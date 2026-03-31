import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get all customer bookings
 */
export async function getCustomerBookings() {
  const { userId } = await auth();

  if (!userId) {
    return { bookings: [] };
  }

  try {
    const customer = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "CUSTOMER",
      },
      select: { id: true },
    });

    if (!customer) {
      return { bookings: [] };
    }

    const bookings = await db.booking.findMany({
      where: {
        customerId: customer.id,
        // Show upcoming + recent completed
        OR: [
          { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
          {
            status: "COMPLETED",
            scheduledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
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
            year: true,
          },
        },
        service: {
          select: {
            name: true,
            basePrice: true,
            category: true,
            duration: true,
          },
        },
        serviceRecord: {
          select: {
            description: true,
            cost: true,
            partsUsed: true,
            createdAt: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to get customer bookings:", error);
    return { bookings: [], error: "Failed to fetch bookings" };
  }
}

/**
 * Get booking details with full context
 */
export async function getBookingDetails(bookingId) {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { name: true, phone: true },
        },
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
            year: true,
            fuelType: true,
          },
        },
        service: {
          select: {
            name: true,
            description: true,
            basePrice: true,
            category: true,
            duration: true,
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
        serviceRecord: true,
      },
    });

    if (!booking) {
      return { booking: null };
    }

    return { booking };
  } catch (error) {
    console.error("Failed to get booking details:", error);
    return { booking: null };
  }
}

/**
 * Get upcoming bookings summary
 */
export async function getUpcomingBookings() {
  const { userId } = await auth();

  if (!userId) {
    return { upcoming: [], total: 0 };
  }

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
      select: { id: true },
    });

    if (!customer) {
      return { upcoming: [], total: 0 };
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
        service: { select: { name: true, basePrice: true } },
        mechanic: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    const totalUpcoming = await db.booking.count({
      where: {
        customerId: customer.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { gte: new Date() },
      },
    });

    return { 
      upcoming, 
      totalUpcoming,
      nextBooking: upcoming[0] || null,
    };
  } catch (error) {
    console.error("Failed to get upcoming bookings:", error);
    return { upcoming: [], totalUpcoming: 0 };
  }
}