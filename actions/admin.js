"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAllowedAdminEmail } from "@/lib/admin-access";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    // First: allow-list (works even if DB is down)
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (isAllowedAdminEmail(email)) return true;

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

/**
 * Admin creates a new mechanic directly (no verification needed)
 */
export async function createMechanic(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const name = formData.get("name");
  const email = formData.get("email");
  const specialty = formData.get("specialty");
  const experience = formData.get("experience");

  if (!name || !email || !specialty) {
    throw new Error("Name, email, and specialty are required");
  }

  try {
    // Create or update mechanic (upsert by email)
    const mechanicClerkId = `admin-created-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const user = await db.user.upsert({
      where: { email },
      update: {
        name,
        role: "MECHANIC",
        specialty,
        experience: experience ? parseInt(experience) : 0,
        credits: 0,
      },
      create: {
        email,
        clerkUserId: mechanicClerkId,
        name,
        role: "MECHANIC",
        specialty,
        experience: experience ? parseInt(experience) : 0,
        credits: 0,
      },
    });

    revalidatePath("/admin");
    return { success: true, mechanic: user };
  } catch (error) {
    console.error("Failed to create mechanic:", error);
    throw new Error(`Failed to create mechanic: ${error.message}`);
  }
}

/**
 * Gets all mechanics (no verification status needed)
 */
export async function getAllMechanics() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { mechanics: [] };
  }

  try {
    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        experience: true,
        credits: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch mechanics:", error);
    return { mechanics: [], error: "Database unavailable" };
  }
}

/**
 * Gets mechanics with their work status (bookings assigned to them)
 */
export async function getMechanicsWithWorkStatus() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { mechanics: [] };
  }

  try {
    const mechanics = await db.user.findMany({
      where: {
        role: "MECHANIC",
      },
      include: {
        mechanicBookings: {
          where: {
            status: {
              in: ["SCHEDULED", "IN_PROGRESS"],
            },
          },
          include: {
            vehicle: {
              select: { brand: true, model: true, registrationNo: true },
            },
            service: {
              select: { name: true, basePrice: true },
            },
            customer: {
              select: { name: true, email: true }, // Removed phone
            },
          },
          orderBy: {
            scheduledAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats for each mechanic
    const mechanicsWithStats = mechanics.map((mechanic) => ({
      ...mechanic,
      activeJobs: mechanic.mechanicBookings.length,
      scheduledCount: mechanic.mechanicBookings.filter((b) => b.status === "SCHEDULED").length,
      inProgressCount: mechanic.mechanicBookings.filter((b) => b.status === "IN_PROGRESS").length,
    }));

    return { mechanics: mechanicsWithStats };
  } catch (error) {
    console.error("Failed to fetch mechanics with work status:", error);
    return { mechanics: [], error: "Database unavailable" };
  }
}

/**
 * Approve or set verification status for mechanic
 */
export async function setMechanicVerification(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const status = formData.get("status");

  if (!mechanicId || !["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid mechanic status");
  }

  try {
    await db.user.update({
      where: { id: mechanicId },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/manage");

    return { success: true };
  } catch (error) {
    console.error("Failed to set mechanic verification status:", error);
    throw new Error(`Failed to set mechanic verification: ${error.message}`);
  }
}

/**
 * Updates mechanic details
 */
export async function updateMechanicDetails(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const name = formData.get("name");
  const specialty = formData.get("specialty");
  const experience = formData.get("experience");

  if (!mechanicId) {
    throw new Error("Mechanic ID is required");
  }

  try {
    await db.user.update({
      where: {
        id: mechanicId,
      },
      data: {
        ...(name && { name }),
        ...(specialty && { specialty }),
        ...(experience && { experience: parseInt(experience) }),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update mechanic:", error);
    throw new Error(`Failed to update mechanic: ${error.message}`);
  }
}

/**
 * Removes a mechanic (sets role back to CUSTOMER)
 */
export async function removeMechanic(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");

  if (!mechanicId) {
    throw new Error("Mechanic ID is required");
  }

  try {
    await db.user.update({
      where: {
        id: mechanicId,
      },
      data: {
        role: "CUSTOMER",
        specialty: null,
        experience: 0,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove mechanic:", error);
    throw new Error(`Failed to remove mechanic: ${error.message}`);
  }
}

/**
 * Gets all pending payouts that need admin approval
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { payouts: [] };
  }

  try {
    const pendingPayouts = await db.payout.findMany({
      where: {
        status: "PROCESSING",
      },
      include: {
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
            credits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts: pendingPayouts };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    return { payouts: [], error: "Database unavailable" };
  }
}

/**
 * Admin creates a payout for a mechanic (admin controls all payouts)
 */
export async function createMechanicPayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const credits = parseInt(formData.get("credits") || "0");
  const note = formData.get("note");

  if (!mechanicId || !credits || credits <= 0) {
    throw new Error("Valid mechanic and credit amount are required");
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { id: mechanicId },
    });

    if (!mechanic || mechanic.role !== "MECHANIC") {
      throw new Error("Mechanic not found");
    }

    if (mechanic.credits < credits) {
      throw new Error("Mechanic doesn't have enough credits");
    }

    const PLATFORM_FEE_PER_CREDIT = 2;
    const MECHANIC_EARNINGS_PER_CREDIT = 8;
    const platformFee = credits * PLATFORM_FEE_PER_CREDIT;
    const netAmount = credits * MECHANIC_EARNINGS_PER_CREDIT;

    const payout = await db.payout.create({
      data: {
        mechanicId,
        credits,
        amount: credits * 10,
        platformFee,
        netAmount,
        status: "PROCESSING",
        note: note || null,
      },
    });

    revalidatePath("/admin");
    return { success: true, payout };
  } catch (error) {
    console.error("Failed to create payout:", error);
    throw new Error(`Failed to create payout: ${error.message}`);
  }
}

export async function getDashboardStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return {
      totalPayoutsReceived: 0,
      chartData: [],
    };
  }

  try {
    const now = new Date();
    const monthsToShow = 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsToShow - 1), 1);

    const payouts = await db.payout.findMany({
      where: {
        status: "PROCESSED",
        processedAt: {
          gte: startDate,
        },
      },
      select: {
        netAmount: true,
        processedAt: true,
      },
    });

    const monthBuckets = Array.from({ length: monthsToShow }).map((_, idx) => {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + idx);
      const label = d.toLocaleString("default", { month: "short" });
      return { label, year: d.getFullYear(), month: d.getMonth(), total: 0 };
    });

    for (const payout of payouts) {
      const date = new Date(payout.processedAt);
      const bucket = monthBuckets.find(
        (b) => b.year === date.getFullYear() && b.month === date.getMonth()
      );
      if (bucket) {
        bucket.total += payout.netAmount;
      }
    }

    const totalPayoutsReceived = monthBuckets.reduce((sum, b) => sum + b.total, 0);

    return {
      totalPayoutsReceived,
      chartData: monthBuckets.map((b) => ({ label: b.label, value: b.total })),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalPayoutsReceived: 0,
      chartData: [],
      error: "Database unavailable",
    };
  }
}

export async function getAllBookings() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const bookings = await db.booking.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: {
          select: { name: true, email: true },
        },
        mechanic: {
          select: { name: true, specialty: true },
        },
        service: {
          select: { name: true, basePrice: true },
        },
        vehicle: {
          select: { brand: true, model: true, registrationNo: true },
        },
      },
      take: 50,
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    throw new Error("Failed to fetch bookings");
  }
}

export async function updateBookingStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const bookingId = formData.get("bookingId");
  const status = formData.get("status");

  if (!bookingId || !status) {
    throw new Error("Missing booking ID or status");
  }

  if (!["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
    throw new Error("Invalid status");
  }

  try {
    await db.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update booking status:", error);
    throw new Error("Failed to update booking status");
  }
}

/**
 * Approves a payout request and deducts credits from mechanic's account
 */
export async function approvePayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const payoutId = formData.get("payoutId");

  if (!payoutId) {
    throw new Error("Payout ID is required");
  }

  try {
    const { userId } = await auth();
    const admin = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // Find the payout request
    const payout = await db.payout.findUnique({
      where: {
        id: payoutId,
        status: "PROCESSING",
      },
      include: {
        mechanic: true,
      },
    });

    if (!payout) {
      throw new Error("Payout request not found or already processed");
    }

    // Check if mechanic has enough credits
    if (payout.mechanic.credits < payout.credits) {
      throw new Error("Mechanic doesn't have enough credits for this payout");
    }

    // Process the payout in a transaction
    await db.$transaction(async (tx) => {
      // Update payout status to PROCESSED
      await tx.payout.update({
        where: {
          id: payoutId,
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: admin?.id || "unknown",
        },
      });

      // Deduct credits from mechanic's account
      await tx.user.update({
        where: {
          id: payout.mechanicId,
        },
        data: {
          credits: {
            decrement: payout.credits,
          },
        },
      });

      // Create a transaction record for the deduction
      await tx.creditTransaction.create({
        data: {
          userId: payout.mechanicId,
          amount: -payout.credits,
          type: "ADMIN_ADJUSTMENT",
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve payout:", error);
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}
