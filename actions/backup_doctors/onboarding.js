"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const steps = formData.getAll("steps");

  try {
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        onboardingCompleted: true,
        onboardingSteps: steps,
      },
    });

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    throw new Error("Failed to complete onboarding");
  }
}
