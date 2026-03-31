"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Mechanic payout requests DISABLED - Admin control only
 * Mechanics can view earnings and contact admin for payout
 */
export async function requestPayout(formData) {
  // DISABLED: Admin controls all payouts
  throw new Error(
    "Payouts managed by admin only. Contact administrator for payment."
  );
}

/**
 * Get mechanic's payout history (view only)
 */
export async function getMechanicPayouts() {
  const { userId } = await auth();

  if (!userId) {
    return { payouts: [] };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MECHANIC",
      },
      select: { id: true },
    });

    if (!mechanic) {
      return { payouts: [] };
    }

    const payouts = await db.payout.findMany({
      where: {
        mechanicId: mechanic.id,
      },
      select: {
        id: true,
        amount: true,
        credits: true,
        platformFee: true,
        netAmount: true,
        paypalEmail: true,
        status: true,
        createdAt: true,
        processedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { payouts };
  } catch (error) {
    console.error("Failed to fetch payouts:", error);
    return { payouts: [], error: "Failed to fetch payouts" };
  }
}

/**
 * Get mechanic's complete earnings dashboard
 */
export async function getMechanicEarnings() {
  const { userId } = await auth();

  if (!userId) {
    return { earnings: null };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MECHANIC",
      },
      select: {
        id: true,
        credits: true,
        name: true,
        email: true,
      },
    });

    if (!mechanic) {
      return { earnings: null };
    }

    // Total completed bookings
    const totalStats = await db.booking.aggregate({
      where: {
        mechanicId: mechanic.id,
        status: "COMPLETED",
      },
      _count: { id: true },
      _sum: { service: { basePrice: true } },
    });

    // This month stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthStats = await db.booking.aggregate({
      where: {
        mechanicId: mechanic.id,
        status: "COMPLETED",
        scheduledAt: { gte: thisMonth },
      },
      _count: { id: true },
      _sum: { service: { basePrice: true } },
    });

    // Platform fee: 20% of service price
    const platformFeeRate = 0.2;
    const mechanicShare = 0.8;

    const totalServiceValue = totalStats._sum.service_basePrice || 0;
    const monthServiceValue = monthStats._sum.service_basePrice || 0;

    return {
      mechanic: {
        id: mechanic.id,
        name: mechanic.name,
        email: mechanic.email,
      },
      earnings: {
        availableCredits: mechanic.credits,
        totalBookings: totalStats._count.id,
        totalServiceValue: Math.round(totalServiceValue),
        estimatedTotalEarnings: Math.round(totalServiceValue * mechanicShare),
        platformFeesPaid: Math.round(totalServiceValue * platformFeeRate),
        
        // Monthly
        monthBookings: monthStats._count.id,
        monthServiceValue: Math.round(monthServiceValue),
        monthEstimatedEarnings: Math.round(monthServiceValue * mechanicShare),
        
        // Payout ready amount
        payoutReady: mechanic.credits * 10, // 1 credit = ₹10
        payoutStatus: "Contact Admin",
        adminControlled: true,
      },
    };
  } catch (error) {
    console.error("Failed to fetch earnings:", error);
    return { earnings: null, error: "Failed to fetch earnings" };
  }
}

/**
 * Get recent completed jobs for mechanic dashboard
 */
export async function getMechanicRecentJobs(limit = 10) {
  const { userId } = await auth();

  if (!userId) {
    return { jobs: [] };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
      select: { id: true },
    });

    if (!mechanic) {
      return { jobs: [] };
    }

    const jobs = await db.booking.findMany({
      where: {
        mechanicId: mechanic.id,
        status: "COMPLETED",
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { 
          select: { 
            brand: true, 
            model: true, 
            registrationNo: true 
          } 
        },
        service: { 
          select: { 
            name: true, 
            basePrice: true, 
            category: true 
          } 
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: parseInt(limit),
    });

    return { jobs };
  } catch (error) {
    console.error("Failed to fetch recent jobs:", error);
    return { jobs: [], error: "Failed to fetch jobs" };
  }
}