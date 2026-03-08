"use client";

import { Suspense } from "react";
import BookingRequestContent from "./booking-request-content";

export default function BookingRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingRequestContent />
    </Suspense>
  );
}