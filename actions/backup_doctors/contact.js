"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * Submit customer support request
 */
export async function createSupportRequest(formData) {
  const { userId } = await auth();
  const subject = formData.get("subject");
  const message = formData.get("message");
  const priority = formData.get("priority") || "MEDIUM";
  const category = formData.get("category") || "GENERAL";

  if (!subject || !message) {
    throw new Error("Subject and message required");
  }

  try {
    const supportRequest = await db.supportRequest.create({
      data: {
        customerId: userId || null,
        subject,
        message,
        priority,
        category,
        status: "OPEN",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    revalidatePath("/support");
    return { success: true, requestId: supportRequest.id };
  } catch (error) {
    console.error("Support request failed:", error);
    throw new Error("Failed to submit request");
  }
}

/**
 * Get all customer support requests (admin view)
 */
export async function getSupportRequests(filters = {}) {
  const { userId } = await auth();

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return { requests: [] };
    }

    const { status, priority, category, customerId } = filters;
    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(customerId && { customerId }),
    };

    const requests = await db.supportRequest.findMany({
      where,
      include: {
        customer: {
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

    return { requests };
  } catch (error) {
    console.error("Failed to fetch support requests:", error);
    return { requests: [] };
  }
}

/**
 * Update support request status (admin only)
 */
export async function updateSupportRequest(formData) {
  const { userId } = await auth();

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("Admin only");
    }

    const requestId = formData.get("requestId");
    const status = formData.get("status");
    const adminNotes = formData.get("adminNotes") || null;

    if (!requestId || !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
      throw new Error("Invalid input");
    }

    const updatedRequest = await db.supportRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNotes,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    revalidatePath("/admin/support");
    return { success: true, request: updatedRequest };
  } catch (error) {
    console.error("Support update failed:", error);
    throw new Error("Failed to update request");
  }
}

/**
 * Get my support requests (customer view)
 */
export async function getMySupportRequests() {
  const { userId } = await auth();

  if (!userId) {
    return { requests: [] };
  }

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId, role: "CUSTOMER" },
      select: { id: true },
    });

    if (!customer) {
      return { requests: [] };
    }

    const requests = await db.supportRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    return { requests };
  } catch (error) {
    console.error("Failed to fetch my requests:", error);
    return { requests: [] };
  }
}

/**
 * Add reply to support request (customer or admin)
 */
export async function addSupportReply(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    const requestId = formData.get("requestId");
    const reply = formData.get("reply");

    if (!requestId || !reply || reply.trim().length < 10) {
      throw new Error("Valid request ID and reply (10+ chars) required");
    }

    const supportReply = await db.supportReply.create({
      data: {
        supportRequestId: requestId,
        userId: user.id,
        userRole: user.role,
        message: reply.trim(),
      },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    });

    // Auto-open if customer replies
    if (user.role === "CUSTOMER") {
      await db.supportRequest.update({
        where: { id: requestId },
        data: { status: "OPEN" },
      });
    }

    revalidatePath("/support");
    return { success: true, reply: supportReply };
  } catch (error) {
    console.error("Reply failed:", error);
    throw new Error("Failed to add reply");
  }
}