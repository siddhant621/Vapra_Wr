"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { deductCreditsForAppointment } from "@/actions/credits";

/**
 * Book a new service with mechanic (no video call)
 */
export async function bookService(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get customer
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
    const serviceId = formData.get("serviceId");
    const vehicleId = formData.get("vehicleId");
    const scheduledAt = new Date(formData.get("scheduledAt"));
    const description = formData.get("description") || null;

    // Validate input
    if (!mechanicId || !serviceId || !vehicleId || !scheduledAt) {
      throw new Error("Mechanic, service, vehicle, and date required");
    }

    // Check mechanic exists
    const mechanic = await db.user.findUnique({
      where: { id: mechanicId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    // Check service exists
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error("Service not found");
    }

    // Check vehicle belongs to customer
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.customerId !== customer.id) {
      throw new Error("Invalid vehicle");
    }

    // Check customer credits
    if (customer.credits < service.basePrice) {
      throw new Error(`Need ${service.basePrice} credits (have ${customer.credits})`);
    }

    // Check mechanic availability (no overlapping bookings)
    const overlappingBooking = await db.booking.findFirst({
      where: {
        mechanicId: mechanicId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        OR: [
          {
            scheduledAt: { lte: scheduledAt },
            scheduledAt: { gt: new Date(scheduledAt.getTime() - service.duration * 60000) },
          },
          {
            scheduledAt: { lt: new Date(scheduledAt.getTime() + service.duration * 60000) },
            scheduledAt: { gte: scheduledAt },
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new Error("Mechanic unavailable at this time");
    }

    // Deduct credits from customer, add to mechanic
    const { success, error } = await deductCreditsForAppointment(
      customer.id,
      mechanic.id
    );

    if (!success) {
      throw new Error(error || "Credit deduction failed");
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        mechanicId: mechanic.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        scheduledAt,
        status: "SCHEDULED",
        description,
        totalCost: service.basePrice,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        mechanic: { select: { name: true, phone: true } },
        vehicle: true,
        service: true,
      },
    });

    revalidatePath("/bookings");
    revalidatePath("/services");
    return { success: true, booking };
  } catch (error) {
    console.error("Booking failed:", error);
    throw new Error(`Booking failed: ${error.message}`);
  }
}

/**
 * Get mechanic by ID
 */
export async function getMechanicById(mechanicId) {
  try {
    const mechanic = await db.user.findUnique({
      where: { 
        id: mechanicId, 
        role: "MECHANIC" 
      },
      include: {
        bookings: {
          where: { status: "COMPLETED" },
          take: 5,
          include: { service: true },
        },
      },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    return { mechanic };
  } catch (error) {
    console.error("Failed to fetch mechanic:", error);
    throw new Error("Mechanic details fetch failed");
  }
}

/**
 * Get available time slots for mechanic (next 7 days)
 */
export async function getAvailableTimeSlots(mechanicId) {
  try {
    const mechanic = await db.user.findUnique({
      where: { id: mechanicId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    // Get mechanic's working hours (9AM-7PM default)
    const workingHours = await db.availability.findFirst({
      where: { mechanicId: mechanic.id },
    });

    if (!workingHours) {
      return { days: [] };
    }

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(now, i));

    // Get existing bookings for next 7 days
    const lastDay = endOfDay(days[6]);
    const existingBookings = await db.booking.findMany({
      where: {
        mechanicId: mechanic.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { lte: lastDay },
      },
    });

    const availableSlotsByDay = {};

    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];

      // Set working hours for this day
      const start = new Date(day);
      start.setHours(
        workingHours.startTime.getHours(),
        workingHours.startTime.getMinutes(),
        0,
        0
      );
      const end = new Date(day);
      end.setHours(
        workingHours.endTime.getHours(),
        workingHours.endTime.getMinutes(),
        0,
        0
      );

      let current = new Date(start);
      
      // Generate 1-hour slots
      while (current < end) {
        if (isBefore(current, now)) {
          current = addHours(current, 1);
          continue;
        }

        const slotEnd = addHours(current, 1);
        const overlaps = existingBookings.some(booking => {
          const bStart = new Date(booking.scheduledAt);
          const bEnd = addHours(bStart, 1);
          return current < bEnd && slotEnd > bStart;
        });

        if (!overlaps) {
          availableSlotsByDay[dayString].push({
            startTime: current.toISOString(),
            formatted: `${format(current, "h:mm a")} - ${format(slotEnd, "h:mm a")}`,
            day: format(current, "EEEE, MMMM d"),
          });
        }

        current = slotEnd;
      }
    }

    return {
      days: Object.entries(availableSlotsByDay)
        .filter(([, slots]) => slots.length > 0)
        .map(([date, slots]) => ({
          date,
          displayDate: slots[0].day,
          slots,
        })),
    };
  } catch (error) {
    console.error("Slots fetch failed:", error);
    return { days: [] };
  }
}