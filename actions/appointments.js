"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { deductCreditsForBooking } from "@/actions/credits"; // Update import name

/**
 * Book a new service booking with a mechanic
 */
export async function bookService(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get the customer user
    const customer = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "CUSTOMER",
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Parse form data
    const mechanicId = formData.get("mechanicId");
    const vehicleId = formData.get("vehicleId");
    const serviceId = formData.get("serviceId");
    const scheduledAt = new Date(formData.get("scheduledAt"));
    const notes = formData.get("notes") || null;

    // Validate input
    if (!mechanicId || !vehicleId || !serviceId || !scheduledAt) {
      throw new Error("Mechanic, vehicle, service, and date are required");
    }

    // Check if the mechanic exists and is verified
    const mechanic = await db.user.findFirst({
      where: {
        id: mechanicId,
        role: "MECHANIC",
      },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    // Check vehicle belongs to customer
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: vehicleId,
        ownerId: customer.id,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found or doesn't belong to you");
    }

    // Check service exists
    const service = await db.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      throw new Error("Service not found or inactive");
    }

    // Check if customer has enough credits (service.basePrice credits required)
    if (customer.credits < service.basePrice) {
      throw new Error(`Insufficient credits. Need ${service.basePrice} credits`);
    }

    // Check time slot availability for mechanic (30min slots)
    const slotEnd = new Date(scheduledAt);
    slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);

    const overlappingBooking = await db.booking.findFirst({
      where: {
        mechanicId: mechanic.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        OR: [
          {
            scheduledAt: { lte: scheduledAt },
            scheduledAt: { gt: new Date(scheduledAt.getTime() - service.duration * 60000) },
          },
          {
            scheduledAt: { lt: slotEnd },
            scheduledAt: { gte: scheduledAt },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new Error("This time slot is already booked by the mechanic");
    }

    // Deduct credits from customer and add to mechanic
    const { success, error } = await deductCreditsForBooking(
      customer.id,
      mechanic.id,
      service.basePrice
    );

    if (!success) {
      throw new Error(error || "Failed to process credits");
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        mechanicId: mechanic.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledAt,
        notes,
        status: "SCHEDULED",
      },
      include: {
        customer: { select: { name: true, phone: true } },
        mechanic: { select: { name: true, specialty: true, phone: true } },
        vehicle: { select: { brand: true, model: true, registrationNo: true } },
        service: { select: { name: true, basePrice: true, duration: true } },
      },
    });

    revalidatePath("/bookings");
    revalidatePath("/(main)/bookings");
    return { success: true, booking };
  } catch (error) {
    console.error("Failed to book service:", error);
    throw new Error(`Booking failed: ${error.message}`);
  }
}

/**
 * Get mechanic by ID with availability
 */
export async function getMechanicById(mechanicId) {
  try {
    const mechanic = await db.user.findFirst({
      where: {
        id: mechanicId,
        role: "MECHANIC",
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        experience: true,
        credits: true,
        verificationStatus: true,
      },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    return { mechanic };
  } catch (error) {
    console.error("Failed to fetch mechanic:", error);
    throw new Error("Failed to fetch mechanic details");
  }
}

/**
 * Get available time slots for mechanic bookings (next 7 days)
 */
export async function getAvailableTimeSlots(mechanicId) {
  try {
    const mechanic = await db.user.findFirst({
      where: {
        id: mechanicId,
        role: "MECHANIC",
      },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(now, i));

    // Default working hours: 9AM - 7PM (10 slots of 60min)
    const startHour = 9;
    const endHour = 19;
    const slotDuration = 60; // minutes

    const existingBookings = await db.booking.findMany({
      where: {
        mechanicId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { gte: now, lte: endOfDay(days[6]) },
      },
    });

    const availableSlotsByDay = {};

    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];

      // Skip past slots
      if (day < now) continue;

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        // Check for overlaps
        const overlaps = existingBookings.some((booking) => {
          const bStart = new Date(booking.scheduledAt);
          const bEnd = new Date(bStart);
          bEnd.setMinutes(bEnd.getMinutes() + 60); // assume 60min bookings

          return (
            (slotStart >= bStart && slotStart < bEnd) ||
            (slotEnd > bStart && slotEnd <= bEnd) ||
            (slotStart <= bStart && slotEnd >= bEnd)
          );
        });

        if (!overlaps) {
          availableSlotsByDay[dayString].push({
            startTime: slotStart.toISOString(),
            formatted: `${format(slotStart, "h:mm a")} - ${format(slotEnd, "h:mm a")}`,
            day: format(slotStart, "EEEE, MMMM do"),
          });
        }
      }
    }

    const result = Object.entries(availableSlotsByDay)
      .filter(([, slots]) => slots.length > 0)
      .map(([date, slots]) => ({
        date,
        displayDate: slots[0].day,
        slots,
      }));

    return { days: result };
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return { days: [] };
  }
}

/**
 * Cancel a booking (only if >24 hours before scheduled)
 */
export async function cancelBooking(bookingId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
    });

    if (!customer) throw new Error("Customer not found");

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, mechanic: true, service: true },
    });

    if (!booking || booking.customerId !== customer.id) {
      throw new Error("Booking not found or unauthorized");
    }

    const now = new Date();
    const cancelDeadline = new Date(booking.scheduledAt);
    cancelDeadline.setDate(cancelDeadline.getDate() - 1); // 24 hours before

    if (now > cancelDeadline) {
      throw new Error("Cannot cancel less than 24 hours before appointment");
    }

    // Refund credits (service.basePrice back to customer)
    await db.user.update({
      where: { id: customer.id },
      data: { credits: { increment: booking.service.basePrice } },
    });

    // Refund to mechanic? No - service fee kept by platform

    await db.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/bookings");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    throw new Error(`Cancel failed: ${error.message}`);
  }
}

/**
 * Get customer's upcoming bookings
 */
export async function getCustomerBookings() {
  const { userId } = await auth();
  if (!userId) return { bookings: [] };

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!customer) return { bookings: [] };

    const bookings = await db.booking.findMany({
      where: {
        customerId: customer.id,
        scheduledAt: { gte: new Date() },
        status: { not: "CANCELLED" },
      },
      include: {
        mechanic: {
          select: { name: true, specialty: true, phone: true },
        },
        vehicle: {
          select: { brand: true, model: true, registrationNo: true },
        },
        service: { select: { name: true, basePrice: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return { bookings: [] };
  }
}