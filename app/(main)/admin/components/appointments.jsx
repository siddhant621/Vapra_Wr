"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { updateBookingStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function Appointments({ bookings }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [status, setStatus] = useState("");

  const { loading, data, fn: submitStatusUpdate } = useFetch(updateBookingStatus);

  const handleStatusChange = async (booking, nextStatus) => {
    setActiveBooking(booking);
    setStatus(nextStatus);

    const formData = new FormData();
    formData.append("bookingId", booking.id);
    formData.append("status", nextStatus);

    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success && activeBooking) {
      toast.success("Appointment updated successfully");
      setActiveBooking(null);
    }
  }, [data]);

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Appointments</CardTitle>
        <CardDescription>Review and manage upcoming appointments</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {booking.service?.name || "Service"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Customer: {booking.customer?.name || "Guest"} • {booking.customer?.email || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mechanic: {booking.mechanic?.name || "Unassigned"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vehicle: {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNo})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled: {format(new Date(booking.scheduledAt), "PP p")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-start lg:items-end">
                      <Badge
                        variant="outline"
                        className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                      >
                        {booking.status}
                      </Badge>
                      <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
