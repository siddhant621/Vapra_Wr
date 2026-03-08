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
  const phone = formData.get("phone");
  const email = formData.get("email") || null;

  if (!serviceName || !vehicleInfo || !issueDescription || !preferredDateRaw || !phone) {
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

