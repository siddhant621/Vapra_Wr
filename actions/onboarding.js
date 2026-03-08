"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAllowedAdminEmail } from "@/lib/admin-access";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user info from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found in Clerk");
  }

  const role = formData.get("role");

  if (!role || !["CUSTOMER", "ADMIN"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  return await setRole({ userId, clerkUser, role });
}

export async function autoSetUserRole() {
  const { userId } = await auth();

  if (!userId) {
    // If not authenticated, tell the client to send the user to sign-in
    return { success: true, redirect: "/sign-in" };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found in Clerk");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const role = isAllowedAdminEmail(email) ? "ADMIN" : "CUSTOMER";

  return await setRole({ userId, clerkUser, role });
}

async function setRole({ userId, clerkUser, role }) {
  try {
    // Admin allow-list (email-based)
    if (role === "ADMIN") {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!isAllowedAdminEmail(email)) {
        throw new Error("You are not allowed to become an admin");
      }
    }

    // Try to persist role in DB. If DB is down, we still redirect (so the UI works in dev).
    let user = null;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        const name = `${clerkUser.firstName} ${clerkUser.lastName}`;
        user = await db.user.create({
          data: {
            clerkUserId: userId,
            name,
            imageUrl: clerkUser.imageUrl,
            email: clerkUser.emailAddresses[0].emailAddress,
          },
        });
      }

      await db.user.update({
        where: { clerkUserId: userId },
        data: { role },
      });
    } catch (dbError) {
      console.error("DB unavailable while setting role:", dbError?.message || dbError);
      // Continue with redirect even if DB is unavailable
    }

    // Redirect based on role
    if (role === "CUSTOMER") {
      revalidatePath("/");
      return { success: true, redirect: "/services" };
    }

    if (role === "ADMIN") {
      revalidatePath("/");
      return { success: true, redirect: "/admin" };
    }

    // Fallback (should never happen)
    return { success: true, redirect: "/" };
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Get user info from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const shouldBeAdmin = isAllowedAdminEmail(email);

  try {
    let user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    // Create user if they don't exist
    if (!user) {
      const name = `${clerkUser.firstName} ${clerkUser.lastName}`;
      user = await db.user.create({
        data: {
          clerkUserId: userId,
          name,
          imageUrl: clerkUser.imageUrl,
          email,
          role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
        },
      });
    }

    // Ensure admin allow list always yields admin role
    if (shouldBeAdmin && user.role !== "ADMIN") {
      user = await db.user.update({
        where: { clerkUserId: userId },
        data: { role: "ADMIN" },
      });
    }

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error);
    // If the DB is unavailable, still provide a minimal role response so front-end
    // redirects properly based on the allow-list.
    return {
      clerkUserId: userId,
      email,
      role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
    };
  }
}
