"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Submit mechanic profile details (no verification needed)
 */
export async function submitMechanicProfile(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name");
  const phone = formData.get("phone");
  const experience = parseInt(formData.get("experience") || "0");
  const hourlyRate = parseInt(formData.get("hourlyRate") || "0");

  if (!name || !phone) {
    throw new Error("Name and phone required");
  }

  try {
    const updatedMechanic = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        name,
        phone,
        experience,
        hourlyRate,
        // No verificationStatus - mechanics active immediately
        profileComplete: true,
      },
      include: {
        bookings: {
          where: { status: "COMPLETED" },
          take: 3,
          include: { service: true },
        },
      },
    });

    // Set default working hours if not set
    const hasWorkingHours = await db.availability.count({
      where: { mechanicId: updatedMechanic.id },
    });

    if (hasWorkingHours === 0) {
      await db.availability.create({
        data: {
          mechanicId: updatedMechanic.id,
          startTime: new Date("1970-01-01T09:00:00"),
          endTime: new Date("1970-01-01T19:00:00"),
          workDays: "Mon,Tue,Wed,Thu,Fri,Sat",
          status: "AVAILABLE",
        },
      });
    }

    revalidatePath("/mechanic/profile");
    revalidatePath("/mechanic");
    return { success: true, mechanic: updatedMechanic };
  } catch (error) {
    console.error("Profile update failed:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Update mechanic working hours
 */
export async function updateWorkingHours(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
    });

    if (!mechanic) {
      throw new Error("Mechanic not found");
    }

    const startTime = formData.get("startTime"); // "09:00"
    const endTime = formData.get("endTime");     // "19:00"
    const workDays = formData.get("workDays");   // "Mon,Tue,Wed,Thu,Fri,Sat"

    if (!startTime || !endTime) {
      throw new Error("Working hours required");
    }

    const updatedHours = await db.availability.upsert({
      where: { mechanicId: mechanic.id },
      update: {
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`),
        workDays,
      },
      create: {
        mechanicId: mechanic.id,
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`),
        workDays,
        status: "AVAILABLE",
      },
    });

    revalidatePath("/mechanic/profile");
    return { success: true, workingHours: updatedHours };
  } catch (error) {
    console.error("Working hours update failed:", error);
    throw new Error("Failed to update hours");
  }
}

/**
 * Get mechanic profile completion status
 */
export async function getMechanicProfileStatus() {
  const { userId } = await auth();

  if (!userId) {
    return { complete: false };
  }

  try {
    const mechanic = await db.user.findUnique({
      where: { clerkUserId: userId, role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        phone: true,
        experience: true,
        profileComplete: true,
      },
    });

    if (!mechanic) {
      return { complete: false };
    }

    const complete = mechanic.profileComplete && 
                    mechanic.name && 
                    mechanic.phone && 
                    mechanic.experience > 0;

    return { 
      complete, 
      mechanic,
      missing: !complete ? [] : null,
    };
  } catch (error) {
    console.error("Profile status failed:", error);
    return { complete: false };
  }
}