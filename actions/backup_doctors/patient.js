"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get customer bookings
 */
export async function getCustomerBookings() {
  const { userId } = await auth();
  if (!userId) return { bookings: [] };

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
      select: { id: true },
    });

    if (!customer) {
      return { bookings: [] };
    }

    const bookings = await db.booking.findMany({
      where: {
        customerId: customer.id,
        OR: [
          { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
          {
            status: "COMPLETED",
            scheduledAt: { 
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            }, // Last 30 days
          },
        ],
      },
      include: {
        mechanic: {
          select: {
            id: true,
            name: true,
            phone: true,
            experience: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            registrationNo: true,
          },
        },
        service: {
          select: {
            name: true,
            basePrice: true,
            category: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return { bookings };
  } catch (error) {
    console.error("Bookings fetch failed:", error);
    return { bookings: [] };
  }
}

/**
 * Get upcoming bookings summary
 */
export async function getUpcomingBookings() {
  const { userId } = await auth();
  if (!userId) return { upcoming: [], next: null };

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
      select: { id: true },
    });

    if (!customer) {
      return { upcoming: [], next: null };
    }

    const upcoming = await db.booking.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { gte: new Date() },
      },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        service: {
          select: { name: true, basePrice: true },
        },
        mechanic: {
          select: { name: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    });

    return {
      upcoming,
      next: upcoming[0] || null,
      count: upcoming.length,
    };
  } catch (error) {
    console.error("Upcoming failed:", error);
    return { upcoming: [], next: null };
  }
}

/**
 * Get booking details
 */
export async function getBookingDetails(bookingId) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { name: true, phone: true, email: true },
        },
        mechanic: {
          select: {
            id: true,
            name: true,
            phone: true,
            experience: true,
          },
        },
        vehicle: true,
        service: true,
        serviceRecord: true,
        payments: true,
      },
    });

    return { booking };
  } catch (error) {
    console.error("Booking details failed:", error);
    return { booking: null };
  }
}

/**
 * Cancel booking (24hr policy)
 */
export async function cancelBooking(bookingId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId, customerId: customer.id },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // 24hr cancellation policy
    const now = new Date();
    const deadline = new Date(booking.scheduledAt);
    deadline.setDate(deadline.getDate() - 1);

    if (now > deadline) {
      throw new Error("Cannot cancel within 24 hours");
    }

    if (booking.status !== "SCHEDULED") {
      throw new Error("Cannot cancel completed booking");
    }

    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      // Refund credits
      await tx.user.update({
        where: { id: customer.id },
        data: { credits: { increment: booking.totalCost } },
      });
    });

    revalidatePath("/bookings");
    return { success: true };
  } catch (error) {
    console.error("Cancel failed:", error);
    throw new Error(error.message);
  }
}