"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createContactMessage(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  if (!name || !email || !message) {
    throw new Error("Missing required fields");
  }

  try {
    await db.contact.create({
      data: {
        name,
        email,
        message,
      },
    });

    revalidatePath("/contact-support");
    return { success: true };
  } catch (error) {
    console.error("Failed to create contact message:", error);
    throw new Error("Failed to submit message");
  }
}
