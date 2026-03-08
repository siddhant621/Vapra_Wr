"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrackAppointmentButton({
  href,
  children,
  source = "home-hero-primary",
}) {
  const handleClick = () => {
    try {
      const payload = JSON.stringify({
        source,
        href,
        timestamp: new Date().toISOString(),
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-appointment", blob);
      } else {
        fetch("/api/track-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Ignore tracking failures
        });
      }
    } catch {
      // Swallow any tracking errors so navigation is never blocked
    }
  };

  return (
    <Button
      asChild
      size="lg"
      className="bg-orange-600 text-white hover:bg-orange-700"
      onClick={handleClick}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

