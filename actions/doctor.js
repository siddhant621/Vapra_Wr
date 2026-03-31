"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Set mechanic's working hours (9AM-7PM default)
 */
export async function setWorkingHours(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const mechanic = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MECHANIC",
      },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const startTime = formData.get("startTime"); // "09:00"
    const endTime = formData.get("endTime");     // "19:00"
    const workDays = formData.get("workDays");   // "Mon,Tue,Wed,Thu,Fri,Sat"

    if (!startTime || !endTime) {
      throw new Error("Working hours required");
    }

    // Delete existing availability
    await db.availability.deleteMany({
      where: { mechanicId: mechanic.id },
    });

    // Create new working hours record
    const workingHours = await db.availability.create({
      data: {
        mechanicId: mechanic.id,
        startTime: new Date(`2024-01-01T${startTime}:00`),
        endTime: new Date(`2024-01-01T${endTime}:00`),
        workDays,
        status: "AVAILABLE",
      },
    });

    revalidatePath("/mechanic");
    return { success: true, workingHours };
  } catch (error) {
    console.error("Failed to set working hours:", error);
    throw new Error(`Failed to set hours: ${error.message}`);
  }
}

/**
 * Get mechanic's current working hours
 */
export async function getMechanicWorkingHours() {
  const { userId } = await auth();

  if (!userId) {
    return { workingHours: null };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      return { workingHours: null };
    }

    const workingHours = await db.availability.findFirst({
      where: { mechanicId: mechanic.id, status: "AVAILABLE" },
    });

    return { workingHours };
  } catch (error) {
    console.error("Failed to fetch working hours:", error);
    return { workingHours: null };
  }
}

/**
 * Get mechanic's upcoming bookings
 */
export async function getMechanicBookings() {
  const { userId } = await auth();

  if (!userId) {
    return { bookings: [] };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      return { bookings: [] };
    }

    const bookings = await db.booking.findMany({
      where: {
        mechanicId: mechanic.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { gte: new Date() },
      },
      include: {
        customer: { 
          select: { name: true, phone: true, email: true } 
        },
        vehicle: { 
          select: { brand: true, model: true, registrationNo: true } 
        },
        service: { 
          select: { name: true, basePrice: true, category: true, duration: true } 
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return { bookings: [] };
  }
}

/**
 * Customer/Mechanic cancel booking (24hr policy)
 */
export async function cancelBooking(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const bookingId = formData.get("bookingId");

    if (!bookingId) {
      throw new Error("Booking ID required");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { 
        customer: true, 
        mechanic: true, 
        service: true 
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Verify authorization (customer OR mechanic)
    if (booking.customerId !== user.id && booking.mechanicId !== user.id) {
      throw new Error("Not authorized to cancel this booking");
    }

    // 24hr cancellation policy
    const now = new Date();
    const cancelDeadline = new Date(booking.scheduledAt);
    cancelDeadline.setDate(cancelDeadline.getDate() - 1);

    if (now > cancelDeadline) {
      throw new Error("Cannot cancel within 24 hours of scheduled time");
    }

    // Refund credits to customer (full service price)
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      // Refund customer
      await tx.creditTransaction.create({
        data: {
          userId: booking.customerId,
          amount: booking.service.basePrice,
          type: "CANCELLATION_REFUND",
          note: `Refund for cancelled booking: ${booking.service.name}`,
        },
      });

      await tx.user.update({
        where: { id: booking.customerId },
        data: { credits: { increment: booking.service.basePrice } },
      });
    });

    revalidatePath("/bookings");
    revalidatePath("/mechanic");
    return { success: true };
  } catch (error) {
    console.error("Cancel booking failed:", error);
    throw new Error(`Cancel failed: ${error.message}`);
  }
}

/**
 * Mechanic adds service notes / updates status
 */
export async function updateBookingNotes(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const bookingId = formData.get("bookingId");
    const notes = formData.get("notes");
    const status = formData.get("status");

    if (!bookingId || !notes) {
      throw new Error("Booking ID and notes required");
    }

    const booking = await db.booking.findFirst({
      where: { 
        id: bookingId, 
        mechanicId: mechanic.id 
      },
      include: { service: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: { 
        notes, 
        status: status || booking.status 
      },
      include: {
        customer: true,
        vehicle: true,
        service: true,
      },
    });

    revalidatePath("/mechanic");
    return { success: true, booking: updatedBooking };
  } catch (error) {
    console.error("Update notes failed:", error);
    throw new Error(`Update failed: ${error.message}`);
  }
}

/**
 * Mark booking as completed (mechanic only, after scheduled time)
 */
export async function markBookingCompleted(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const bookingId = formData.get("bookingId");

    if (!bookingId) {
      throw new Error("Booking ID required");
    }

    const booking = await db.booking.findFirst({
      where: { 
        id: bookingId, 
        mechanicId: mechanic.id,
        status: "IN_PROGRESS",
      },
    });

    if (!booking) {
      throw new Error("Booking not scheduled or already completed");
    }

    // Must be after scheduled time + service duration
    const now = new Date();
    const expectedEnd = new Date(booking.scheduledAt);
    expectedEnd.setMinutes(expectedEnd.getMinutes() + booking.service.duration);

    if (now < expectedEnd) {
      throw new Error("Cannot complete before expected end time");
    }

    await db.$transaction(async (tx) => {
      // Mark completed
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" },
      });

      // Create service record
      await tx.serviceRecord.create({
        data: {
          vehicleId: booking.vehicleId,
          bookingId,
          description: booking.notes || "Service completed",
          cost: booking.service.basePrice,
        },
      });
    });

    revalidatePath("/mechanic");
    return { success: true };
  } catch (error) {
    console.error("Complete booking failed:", error);
    throw new Error(`Completion failed: ${error.message}`);
  }
}