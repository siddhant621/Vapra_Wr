"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Mechanic payout request (admin approval required)
 */
export async function requestPayout(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const mechanic = await db.user.findUnique({ 
      where: { clerkUserId: userId, role: "MECHANIC" } 
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const credits = parseInt(formData.get("credits") || "0");
    const paypalEmail = formData.get("paypalEmail")?.trim();

    if (credits <= 0 || !paypalEmail) {
      throw new Error("Valid credits and PayPal email required");
    }

    if (mechanic.credits < credits) {
      throw new Error(`Need ${credits} credits (have ${mechanic.credits})`);
    }

    // Minimum payout ₹100 (10 credits)
    if (credits < 10) {
      throw new Error("Minimum payout is 10 credits (₹100)");
    }

    const amount = credits * 10;           // 1 credit = ₹10
    const platformFee = credits * 2;       // ₹2 per credit
    const netAmount = amount - platformFee;

    const payout = await db.payout.create({
      data: {
        mechanicId: mechanic.id,
        credits,
        amount,
        platformFee,
        netAmount,
        paypalEmail,
        status: "PROCESSING",
        requestedBy: mechanic.id,
      },
      include: {
        mechanic: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true 
          },
        },
      },
    });

    revalidatePath("/mechanic/payouts");
    return { 
      success: true, 
      payout,
      remainingCredits: mechanic.credits - credits,
    };
  } catch (error) {
    console.error("Payout request failed:", error);
    throw new Error(error.message);
  }
}

/**
 * Update payout PayPal email
 */
export async function updatePayoutEmail(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const paypalEmail = formData.get("paypalEmail")?.trim();
    if (!paypalEmail) {
      throw new Error("Valid PayPal email required");
    }

    // Update all pending payouts
    await db.payout.updateMany({
      where: {
        mechanicId: mechanic.id,
        status: "PROCESSING",
      },
      data: { paypalEmail },
    });

    revalidatePath("/mechanic/payouts");
    return { success: true };
  } catch (error) {
    console.error("Email update failed:", error);
    throw new Error("Failed to update email");
  }
}

/**
 * Get my payout requests
 */
export async function getMyPayoutRequests() {
  const { userId } = await auth();
  if (!userId) return { requests: [] };

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
      select: { id: true },
    });

    if (!mechanic) {
      return { requests: [] };
    }

    const requests = await db.payout.findMany({
      where: { mechanicId: mechanic.id },
      orderBy: { createdAt: "desc" },
    });

    return { requests };
  } catch (error) {
    console.error("Payouts fetch failed:", error);
    return { requests: [] };
  }
}