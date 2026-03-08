"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getPatientAppointments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const appointments = await db.appointment.findMany({
      where: { patient: { clerkUserId: userId } },
      include: { doctor: true },
      orderBy: { scheduledAt: "desc" },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to fetch patient appointments:", error);
    return { appointments: [] };
  }
}
