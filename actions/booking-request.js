"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/actions/admin";
import { addBookingRequest, listBookingRequests } from "@/lib/booking-requests-store";

export async function createBookingRequest(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const serviceName = formData.get("serviceName");
  const vehicleInfo = formData.get("vehicleInfo");
  const issueDescription = formData.get("issueDescription");
  const preferredDateRaw = formData.get("preferredDate");
  const preferredTimeSlot = formData.get("preferredTimeSlot");
  const phone = formData.get("phone");
  const email = formData.get("email") || null;

  if (
    !serviceName ||
    !vehicleInfo ||
    !issueDescription ||
    !preferredDateRaw ||
    !preferredTimeSlot ||
    !phone
  ) {
    throw new Error("Missing required fields");
  }

  const preferredDate = new Date(preferredDateRaw);
  if (Number.isNaN(preferredDate.getTime())) {
    throw new Error("Invalid preferred date");
  }

  try {
    // Attach to user if they exist in DB (onboarding usually creates them)
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    const request = await db.bookingRequest.create({
      data: {
        customerId: customer?.id ?? null,
        serviceName,
        vehicleInfo,
        issueDescription,
        preferredDate,
        preferredTimeSlot,
        phone,
        email,
        status: "PENDING",
      },
    });

    revalidatePath("/admin");
    return { success: true, requestId: request.id };
  } catch (dbError) {
    // DB is unreachable (as in your terminal log). Fall back to in-memory store.
    const requestId = `dev-${Date.now()}`;
    addBookingRequest({
      id: requestId,
      serviceName,
      vehicleInfo,
      issueDescription,
      preferredDate,
      preferredTimeSlot,
      phone,
      email,
      status: "PENDING",
      createdAt: new Date(),
    });

    revalidatePath("/admin");
    return { success: true, requestId, stored: "memory" };
  }
}

export async function getBookingRequests() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const requests = await db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return { requests };
  } catch (dbError) {
    return { requests: listBookingRequests(50), source: "memory" };
  }
}

export async function updateBookingRequestStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const requestId = formData.get("requestId");
  const status = formData.get("status");

  if (!requestId || !status) {
    throw new Error("Missing request ID or status");
  }

  if (!["PENDING", "REVIEWED", "ASSIGNED", "CLOSED"].includes(status)) {
    throw new Error("Invalid status");
  }

  try {
    await db.bookingRequest.update({
      where: { id: requestId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update booking request status:", error);
    throw new Error("Failed to update booking request status");
  }
}

export async function cancelOwnBookingRequest(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requestId = formData.get("requestId");
  if (!requestId) {
    throw new Error("Missing request ID");
  }

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const request = await db.bookingRequest.findUnique({
      where: { id: requestId },
      select: { id: true, customerId: true, status: true },
    });

    if (!request || request.customerId !== customer.id) {
      throw new Error("You are not allowed to cancel this appointment");
    }

    if (request.status === "CLOSED") {
      return { success: true, status: request.status };
    }

    if (!["PENDING", "REVIEWED", "ASSIGNED"].includes(request.status)) {
      throw new Error("This appointment cannot be cancelled");
    }

    const updated = await db.bookingRequest.update({
      where: { id: requestId },
      data: { status: "CLOSED" },
    });

    revalidatePath("/appointments");
    return { success: true, status: updated.status };
  } catch (error) {
    console.error("Failed to cancel booking request:", error);
    throw new Error(error.message || "Failed to cancel appointment");
  }
}


