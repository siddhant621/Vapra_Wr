"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function requestPayout(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const amount = Number(formData.get("amount"));
  const account = formData.get("account");

  if (!amount || !account) throw new Error("Invalid input");

  try {
    // find doctor's record
    const doctor = await db.user.findUnique({ where: { clerkUserId: userId } });

    if (!doctor) throw new Error("Doctor not found");

    if (doctor.credits < amount) throw new Error("Insufficient credits");

    const payout = await db.payout.create({
      data: {
        doctorId: doctor.id,
        credits: amount,
        account,
        status: "PROCESSING",
      },
    });

    revalidatePath("/payouts");
    return { payout };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout");
  }
}
