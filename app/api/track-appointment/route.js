import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    const body = (await request.json().catch(() => ({}))) || {};
    const { source, href } = body;

    console.log("[tracking] Appointment booking started", {
      userId: userId || null,
      source: source || "unknown",
      href: href || null,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[tracking] Failed to record appointment start", error);
    // Do not break navigation if tracking fails
    return new Response(null, { status: 204 });
  }
}

