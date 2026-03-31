"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Verify admin access
 */
export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
}

/**
 * Get all mechanics (no verification needed)
 */
export async function getAllMechanicsAdmin() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const mechanics = await db.user.findMany({
      where: { role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        experience: true,
        credits: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { mechanics };
  } catch (error) {
    throw new Error("Failed to fetch mechanics");
  }
}

/**
 * Get pending payouts for admin approval
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingPayouts = await db.payout.findMany({
      where: { status: "PROCESSING" },
      include: {
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            credits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { payouts: pendingPayouts };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    throw new Error("Failed to fetch pending payouts");
  }
}

/**
 * Approve payout and deduct credits
 */
export async function approvePayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const payoutId = formData.get("payoutId");
  const paypalEmail = formData.get("paypalEmail");

  if (!payoutId) {
    throw new Error("Payout ID required");
  }

  try {
    const { userId } = await auth();
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });

    const payout = await db.payout.findUnique({
      where: { 
        id: payoutId, 
        status: "PROCESSING" 
      },
      include: { mechanic: true },
    });

    if (!payout) {
      throw new Error("Payout not found or already processed");
    }

    if (payout.mechanic.credits < payout.credits) {
      throw new Error(`Mechanic needs ${payout.credits} credits (has ${payout.mechanic.credits})`);
    }

    await db.$transaction(async (tx) => {
      // Mark payout processed
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: admin?.id || "admin",
          paypalEmail: paypalEmail || payout.paypalEmail,
        },
      });

      // Deduct credits from mechanic
      await tx.user.update({
        where: { id: payout.mechanicId },
        data: { credits: { decrement: payout.credits } },
      });

      // Record transaction
      await tx.creditTransaction.create({
        data: {
          userId: payout.mechanicId,
          amount: -payout.credits,
          type: "PAYOUT_PROCESSED",
          note: `Payout approved: ₹${payout.netAmount}`,
        },
      });
    });

    revalidatePath("/admin/payouts");
    return { success: true, payoutId };
  } catch (error) {
    console.error("Payout approval failed:", error);
    throw new Error(`Approval failed: ${error.message}`);
  }
}

/**
 * Create payout request for mechanic (admin only)
 */
export async function createPayoutRequest(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const credits = parseInt(formData.get("credits") || "0");
  const paypalEmail = formData.get("paypalEmail");

  if (!mechanicId || credits <= 0) {
    throw new Error("Valid mechanic and credits required");
  }

  try {
    const mechanic = await db.user.findUnique({ 
      where: { id: mechanicId, role: "MECHANIC" } 
    });

    if (!mechanic || mechanic.credits < credits) {
      throw new Error("Insufficient credits");
    }

    const amount = credits * 10;        // 1 credit = ₹10
    const platformFee = Math.floor(credits * 2);  // ₹2 per credit
    const netAmount = amount - platformFee;

    const payout = await db.payout.create({
      data: {
        mechanicId,
        amount,
        credits,
        platformFee,
        netAmount,
        paypalEmail: paypalEmail || "",
        status: "PROCESSING",
      },
      include: {
        mechanic: {
          select: { name: true, email: true },
        },
      },
    });

    revalidatePath("/admin/payouts");
    return { success: true, payout };
  } catch (error) {
    console.error("Payout creation failed:", error);
    throw new Error(`Payout creation failed: ${error.message}`);
  }
}

/**
 * Get all payout history
 */
export async function getAllPayouts(filters = {}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const { status, mechanicId } = filters;
    const where = { 
      ...(status && { status }),
      ...(mechanicId && { mechanicId }),
    };

    const payouts = await db.payout.findMany({
      where,
      include: {
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { payouts };
  } catch (error) {
    console.error("Failed to fetch payouts:", error);
    return { payouts: [] };
  }
}

/**
 * Bulk payout actions
 */
export async function bulkApprovePayouts(payoutIds) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const { userId } = await auth();
    const admin = await db.user.findUnique({ where: { clerkUserId: userId } });

    await db.$transaction(async (tx) => {
      for (const payoutId of payoutIds) {
        const payout = await tx.payout.findUnique({
          where: { id: payoutId, status: "PROCESSING" },
          include: { mechanic: true },
        });

        if (payout && payout.mechanic.credits >= payout.credits) {
          await tx.payout.update({
            where: { id: payoutId },
            data: {
              status: "PROCESSED",
              processedAt: new Date(),
              processedBy: admin?.id || "admin",
            },
          });

          await tx.user.update({
            where: { id: payout.mechanicId },
            data: { credits: { decrement: payout.credits } },
          });

          await tx.creditTransaction.create({
            data: {
              userId: payout.mechanicId,
              amount: -payout.credits,
              type: "PAYOUT_PROCESSED",
            },
          });
        }
      }
    });

    revalidatePath("/admin/payouts");
    return { success: true, processed: payoutIds.length };
  } catch (error) {
    console.error("Bulk payout failed:", error);
    throw new Error("Bulk approval failed");
  }
}