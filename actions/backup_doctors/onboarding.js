"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Complete customer onboarding (add vehicles, get welcome credits)
 */
export async function completeOnboarding(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.onboardingComplete) {
      return { success: true, alreadyComplete: true };
    }

    // Extract onboarding data
    const vehicles = formData.getAll("vehicles"); // Array of vehicle JSON
    const phone = formData.get("phone");
    const hasVehicles = vehicles.length > 0;

    // Mark onboarding complete
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        onboardingComplete: true,
        phone,
        profileComplete: hasVehicles,
      },
    });

    // Create vehicles if provided
    if (hasVehicles && vehicles[0]) {
      for (const vehicleData of vehicles) {
        const vehicle = JSON.parse(vehicleData);
        await db.vehicle.create({
          data: {
            customerId: user.id,
            brand: vehicle.brand,
            model: vehicle.model,
            registrationNo: vehicle.registrationNo,
            year: parseInt(vehicle.year),
            fuelType: vehicle.fuelType || "PETROL",
          },
        });
      }
    }

    // Award welcome credits on completion
    if (!user.welcomeCreditsGiven) {
      await db.creditTransaction.create({
        data: {
          userId: user.id,
          amount: 5,
          type: "ONBOARDING_COMPLETE",
          note: "Welcome bonus for completing onboarding",
        },
      });

      await db.user.update({
        where: { id: user.id },
        data: {
          credits: { increment: 5 },
          welcomeCreditsGiven: true,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/vehicles");
    return { 
      success: true, 
      vehiclesCreated: vehicles.length,
      creditsAwarded: !user.welcomeCreditsGiven,
    };
  } catch (error) {
    console.error("Onboarding failed:", error);
    throw new Error("Failed to complete onboarding");
  }
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress() {
  const { userId } = await auth();

  if (!userId) {
    return { complete: false, progress: 0, steps: [] };
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        vehicles: true,
      },
    });

    if (!user) {
      return { complete: false, progress: 0 };
    }

    const steps = [
      { id: "profile", complete: !!user.name && !!user.phone },
      { id: "vehicles", complete: user.vehicles.length > 0 },
      { id: "services", complete: user.onboardingComplete },
    ];

    const progress = steps.filter(s => s.complete).length / steps.length;
    const complete = user.onboardingComplete && progress === 1;

    return {
      complete,
      progress: Math.round(progress * 100),
      steps,
      vehiclesCount: user.vehicles.length,
    };
  } catch (error) {
    console.error("Progress fetch failed:", error);
    return { complete: false, progress: 0 };
  }
}

/**
 * Skip onboarding (mark as complete without vehicles)
 */
export async function skipOnboarding() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        onboardingComplete: true,
        profileComplete: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, skipped: true };
  } catch (error) {
    console.error("Skip failed:", error);
    throw new Error("Failed to skip onboarding");
  }
}