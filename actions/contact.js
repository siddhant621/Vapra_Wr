"use server";

import { auth } from "@clerk/nextjs/server";

/**
 * Sends a contact support message
 */
export async function sendContactMessage(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { name, email, subject, message } = formData;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required");
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  try {
    // In a real application, you would:
    // 1. Send email using a service like SendGrid, Mailgun, etc.
    // 2. Store the message in a database
    // 3. Send notifications to support team

    // For now, we'll simulate success
    console.log("Contact message received:", {
      userId,
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Your message has been sent successfully. We'll get back to you within 24 hours.",
    };
  } catch (error) {
    console.error("Failed to send contact message:", error);
    throw new Error("Failed to send message. Please try again.");
  }
}
