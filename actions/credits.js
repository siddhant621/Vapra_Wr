"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

// Garage subscription plans (monthly service credits)
const PLAN_CREDITS = {
  free_user:  5,   // Basic: General services
  standard:  25,   // Standard: General + Paid services  
  premium:   60,   // Premium: All services
};

// Dynamic service pricing from Service model
// const SERVICE_CREDIT_COSTS = {}; // Use service.basePrice instead

/**
 * Allocates monthly service credits based on subscription
 * Call from layout/middleware for CUSTOMER role
 */
export async function checkAndAllocateCredits(user) {
  try {
    if (!user || user.role !== "CUSTOMER") {
      return user;
    }

    const { has } = await auth();

    // Detect subscription plan
    let currentPlan = null;
    let creditsToAllocate = 0;

    if (has({ plan: "premium" })) {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (has({ plan: "standard" })) {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (has({ plan: "free_user" })) {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }

    if (!currentPlan || creditsToAllocate === 0) {
      return user;
    }

    // Prevent double allocation this month
    const currentMonth = format(new Date(), "yyyy-MM");
    const latestTx = user.creditTransactions?.[0];

    if (
      latestTx?.type === "MONTHLY_ALLOCATION" &&
      format(new Date(latestTx.createdAt), "yyyy-MM") === currentMonth
    ) {
      return user;
    }

    // Allocate credits transactionally
    const updatedUser = await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: "MONTHLY_ALLOCATION",
          note: `${currentPlan} plan - ${creditsToAllocate} service credits`,
        },
      });

      return tx.user.update({
        where: { id: user.id },
        data: { 
          credits: { increment: creditsToAllocate }
        },
      });
    });

    // Update UI
    revalidatePath("/dashboard");
    revalidatePath("/services");
    revalidatePath("/vehicles");

    return updatedUser;
  } catch (error) {
    console.error("Credit allocation failed:", error);
    return user;
  }
}

/**
 * Deducts service credits for booking (dynamic pricing)
 * Transfers to mechanic earnings
 */
export async function deductCreditsForBooking(customerId, mechanicId, servicePrice) {
  try {
    const customer = await db.user.findUnique({
      where: { id: customerId },
      select: { id: true, credits: true, name: true },
    });

    const mechanic = await db.user.findUnique({
      where: { id: mechanicId },
      select: { id: true, name: true },
    });

    if (!customer || customer.credits < servicePrice) {
      return { 
        success: false, 
        error: `Need ${servicePrice} credits (you have ${customer?.credits || 0})` 
      };
    }

    if (!mechanic) {
      return { success: false, error: "Mechanic not found" };
    }

    // Atomic credit transfer
    const result = await db.$transaction(async (tx) => {
      // Customer deduction
      await tx.creditTransaction.create({
        data: {
          userId: customer.id,
          amount: -servicePrice,
          type: "SERVICE_BOOKING",
          note: `Service payment: ${servicePrice} credits`,
        },
      });

      // Mechanic earning (platform keeps 20% fee)
      const platformFee = Math.floor(servicePrice * 0.2);
      const mechanicEarning = servicePrice - platformFee;

      await tx.creditTransaction.create({
        data: {
          userId: mechanic.id,
          amount: mechanicEarning,
          type: "SERVICE_EARNING",
          note: `Service earning: ${mechanicEarning} credits (fee: ${platformFee})`,
        },
      });

      // Update balances
      const updatedCustomer = await tx.user.update({
        where: { id: customer.id },
        data: { credits: { decrement: servicePrice } },
      });

      await tx.user.update({
        where: { id: mechanic.id },
        data: { credits: { increment: mechanicEarning } },
      });

      return { 
        customer: updatedCustomer, 
        mechanicEarning,
        platformFee 
      };
    });

    return { 
      success: true, 
      customerCredits: result.customer.credits,
      mechanicEarning: result.mechanicEarning,
      platformFee: result.platformFee,
    };
  } catch (error) {
    console.error("Booking credit deduction failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Admin bulk credit operations
 */
export async function adminCreditAdjustment(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const admin = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (admin?.role !== "ADMIN") throw new Error("Admin required");

    const targetUserId = formData.get("userId");
    const amount = parseInt(formData.get("amount") || "0");
    const reason = formData.get("reason") || "Admin adjustment";

    if (!targetUserId || isNaN(amount)) {
      throw new Error("User ID and amount required");
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new Error("Target user not found");

    await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: targetUserId,
          amount,
          type: amount > 0 ? "ADMIN_CREDIT_ADD" : "ADMIN_CREDIT_DEDUCT",
          note: reason,
        },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { credits: { increment: amount } },
      });
    });

    revalidatePath("/admin/users");
    return { 
      success: true, 
      newBalance: targetUser.credits + amount 
    };
  } catch (error) {
    console.error("Admin credit adjustment failed:", error);
    throw new Error(error.message);
  }
}

/**
 * Get detailed credit history with filters
 */
export async function getCreditHistory(userId, filters = {}) {
  try {
    const { type, dateFrom, dateTo } = filters;

    const where = { 
      userId,
      ...(type && { type }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
    };

    const transactions = await db.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { 
        user: { 
          select: { name: true, role: true } 
        } 
      },
      take: 50,
    });

    const balance = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return { 
      transactions, 
      currentBalance: balance?.credits || 0,
      totalEarned: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      totalSpent: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    };
  } catch (error) {
    console.error("Credit history fetch failed:", error);
    return { transactions: [], currentBalance: 0 };
  }
}