"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAllowedAdminEmail } from "@/lib/admin-access";

/**
 * Set user's role (CUSTOMER or MECHANIC or ADMIN)
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found");
  }

  const role = formData.get("role");

  if (!["CUSTOMER", "MECHANIC", "ADMIN"].includes(role)) {
    throw new Error("Invalid role");
  }

  return await setRole({ userId, clerkUser, role });
}

/**
 * Auto-set role on first login
 */
export async function autoSetUserRole() {
  const { userId } = await auth();

  if (!userId) {
    return { success: true, redirect: "/mechanics" };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const role = isAllowedAdminEmail(email) ? "ADMIN" : "CUSTOMER";

  return await setRole({ userId, clerkUser, role });
}

async function setRole({ userId, clerkUser, role }) {
  try {
    // Admin email allow-list
    if (role === "ADMIN") {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!isAllowedAdminEmail(email)) {
        throw new Error("Admin access denied");
      }
    }

    // Upsert user
    let user = await db.user.upsert({
      where: { clerkUserId: userId },
      update: { 
        role,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      },
      create: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
        role,
        credits: role === "CUSTOMER" ? 5 : 0, // Free credits for customers
      },
    });

    // Role-based redirect
    if (role === "CUSTOMER") {
      revalidatePath("/");
      return { success: true, redirect: "/services", role: "CUSTOMER" };
    }

    if (role === "MECHANIC") {
      revalidatePath("/");
      return { success: true, redirect: "/mechanic", role: "MECHANIC" };
    }

    if (role === "ADMIN") {
      revalidatePath("/");
      return { success: true, redirect: "/admin", role: "ADMIN" };
    }

    return { success: true, redirect: "/" };
  } catch (error) {
    console.error("Set role failed:", error);
    throw new Error(`Profile update failed: ${error.message}`);
  }
}

/**
 * Get complete user profile
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const isAdminEmail = isAllowedAdminEmail(email);

  // Keep role if already set, otherwise set CUSTOMER by default (or ADMIN if allow-listed).
  const existingUser = await db.user.findUnique({ where: { clerkUserId: userId } });
  const resolvedRole = isAdminEmail ? "ADMIN" : existingUser?.role || "CUSTOMER";

  try {
    let user = await db.user.upsert({
      where: { clerkUserId: userId },
      update: {
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
        email,
        role: resolvedRole,
      },
      create: {
        clerkUserId: userId,
        email,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        imageUrl: clerkUser.imageUrl,
        role: resolvedRole,
        credits: 5, // Welcome credits
      },
    });

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      role: user.role,
      credits: user.credits,
      experience: user.experience || 0,
    };
  } catch (error) {
    console.error("Get user failed:", error);
    // Fallback for DB outage
    return {
      clerkUserId: userId,
      email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      role: isAdminEmail ? "ADMIN" : "CUSTOMER",
      credits: 5,
    };
  }
}

/**
 * Update user profile (name, phone)
 */
export async function updateUserProfile(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const name = formData.get("name");
    const phone = formData.get("phone");

    const updatedUser = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        name,
        phone,
      },
    });

    revalidatePath("/profile");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Profile update failed:", error);
    throw new Error("Profile update failed");
  }
}