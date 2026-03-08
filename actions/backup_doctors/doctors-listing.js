"use server";

import { db } from "@/lib/prisma";

export async function getDoctorsBySpecialty(specialty) {
  try {
    const doctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        specialty,
        verificationStatus: "VERIFIED",
      },
      orderBy: { name: "asc" },
    });

    return { doctors };
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return { doctors: [] };
  }
}
