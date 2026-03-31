"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

// Service prices in credits (no subscriptions)
const SERVICE_PRICES = {
  "oil-change": 8,
  "brake-service": 12,
  "tire-rotation": 6,
  "ac-service": 15,
  "engine-diagnostic": 10,
  "wheel-alignment": 8,
};

// Welcome credits for new customers
const WELCOME_CREDITS = 5;

/**
 * Allocate welcome credits for new customers
 */
export async function checkAndAllocateWelcomeCredits(user) {
  try {
    if (!user || user.role !== "CUSTOMER") {
      return user;
    }

    // Already has credits or welcome given
    if (user.credits > 0 || user.welcomeCreditsGiven) {
      return user;
    }

    const updatedUser = await db.$transaction(async (tx) => {
      // Give welcome credits
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: WELCOME_CREDITS,
          type: "WELCOME_BONUS",
          note: "Welcome to garage! 5 free credits",
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { increment: WELCOME_CREDITS },
          welcomeCreditsGiven: true,
        },
      });

      return updatedUser;
    });

    revalidatePath("/services");
    revalidatePath("/bookings");
    return updatedUser;
  } catch (error) {
    console.error("Welcome credits failed:", error);
    return user;
  }
}

/**
 * Deduct credits for service booking (dynamic price)
 */
export async function deductCreditsForService(customerId, mechanicId, serviceId) {
  try {
    const customer = await db.user.findUnique({
      where: { id: customerId },
      include: { 
        bookings: {
          where: { status: "SCHEDULED" },
          select: { id: true },
        },
      },
    });

    const mechanic = await db.user.findUnique({
      where: { id: mechanicId },
    });

    if (!customer || !mechanic) {
      throw new Error("Customer or mechanic not found");
    }

    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error("Service not found");
    }

    const cost = service.basePrice;
    if (customer.credits < cost) {
      throw new Error(`Need ${cost} credits (have ${customer.credits})`);
    }

    const result = await db.$transaction(async (tx) => {
      // Customer deduction transaction
      await tx.creditTransaction.create({
        data: {
          userId: customer.id,
          amount: -cost,
          type: "SERVICE_BOOKING",
          note: `Service: ${service.name}`,
        },
      });

      // Mechanic earning transaction
      await tx.creditTransaction.create({
        data: {
          userId: mechanic.id,
          amount: cost,
          type: "SERVICE_BOOKING",
          note: `Service completed: ${service.name}`,
        },
      });

      // Update customer credits
      const updatedCustomer = await tx.user.update({
        where: { id: customer.id },
        data: { credits: { decrement: cost } },
      });

      // Update mechanic credits
      await tx.user.update({
        where: { id: mechanic.id },
        data: { credits: { increment: cost } },
      });

      return updatedCustomer;
    });

    return { success: true, user: result, cost };
  } catch (error) {
    console.error("Credit deduction failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's complete credit history
 */
export async function getCreditHistory(userId) {
  try {
    const transactions = await db.creditTransaction.findMany({
      where: { userId },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const summary = await db.creditTransaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    });

    return {
      transactions,
      summary,
      balance: transactions[0]?.user?.credits || 0,
    };
  } catch (error) {
    console.error("Credit history failed:", error);
    return { transactions: [], summary: [] };
  }
}

/**
 * Refund credits for cancelled booking (admin or customer)
 */
export async function refundBookingCredits(bookingId) {
  const { userId } = await auth();

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        mechanic: true,
        service: true,
      },
    });

    if (!booking || booking.status !== "CANCELLED") {
      throw new Error("Invalid booking for refund");
    }

    const refundAmount = booking.service.basePrice;

    await db.$transaction(async (tx) => {
      // Refund customer
      await tx.creditTransaction.create({
        data: {
          userId: booking.customerId,
          amount: refundAmount,
          type: "BOOKING_REFUND",
          note: `Refund for cancelled booking: ${booking.service.name}`,
        },
      });

      await tx.user.update({
        where: { id: booking.customerId },
        data: { credits: { increment: refundAmount } },
      });

      // Deduct from mechanic (if already credited)
      await tx.creditTransaction.create({
        data: {
          userId: booking.mechanicId,
          amount: -refundAmount,
          type: "BOOKING_REFUND",
          note: `Refund deduction: ${booking.service.name}`,
        },
      });

      await tx.user.update({
        where: { id: booking.mechanicId },
        data: { credits: { decrement: refundAmount } },
      });
    });

    revalidatePath("/bookings");
    return { success: true, amount: refundAmount };
  } catch (error) {
    console.error("Refund failed:", error);
    throw new Error(`Refund failed: ${error.message}`);
  }
}

/**
 * Admin credit adjustment (add/remove credits)
 */
export async function adminAdjustCredits(formData) {
  const { userId } = await auth();

  try {
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!admin || admin.role !== "ADMIN") {
      throw new Error("Admin only");
    }

    const targetUserId = formData.get("userId");
    const amount = parseInt(formData.get("amount"));
    const reason = formData.get("reason") || "Admin adjustment";

    if (!targetUserId || isNaN(amount)) {
      throw new Error("Valid user and amount required");
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error("User not found");
    }

    await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: targetUser.id,
          amount,
          type: "ADMIN_ADJUSTMENT",
          note: reason,
        },
      });

      await tx.user.update({
        where: { id: targetUser.id },
        data: { credits: { increment: amount } },
      });
    });

    revalidatePath("/admin/users");
    return { success: true, user: targetUser.id, amount };
  } catch (error) {
    console.error("Credit adjustment failed:", error);
    throw new Error("Adjustment failed");
  }
}