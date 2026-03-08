"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function submitDoctorVerification(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name");
  const license = formData.get("license");
  const specialty = formData.get("specialty");

  if (!name || !license || !specialty) {
    throw new Error("Missing fields");
  }

  try {
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        name,
        licenseNumber: license,
        specialty,
        verificationStatus: "PENDING",
      },
    });

    revalidatePath("/doctor/verification");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit verification:", error);
    throw new Error("Failed to submit verification");
  }
}
