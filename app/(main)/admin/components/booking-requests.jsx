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
import { updateBookingRequestStatus } from "@/actions/booking-request";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function BookingRequests({ requests }) {
  const [activeRequest, setActiveRequest] = useState(null);
  const [status, setStatus] = useState("PENDING");

  const { loading, data, fn: submitStatusUpdate } = useFetch(updateBookingRequestStatus);

  const handleChangeStatus = async (request, nextStatus) => {
    setActiveRequest(request);
    setStatus(nextStatus);

    const formData = new FormData();
    formData.append("requestId", request.id);
    formData.append("status", nextStatus);

    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success && activeRequest) {
      toast.success("Request updated successfully");
      setActiveRequest(null);
    }
  }, [data]);

  return (
    <Card className="bg-muted/20 border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">
          Booking Requests
        </CardTitle>
        <CardDescription>Review and manage customer booking requests</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No booking requests at this time.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{request.serviceName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.vehicleInfo} •{" "}
                        {new Date(request.preferredDate).toLocaleDateString()}{" "}
                        {request.preferredTimeSlot
                          ? `• ${request.preferredTimeSlot}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {request.issueDescription}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {request.customer?.name ? `Customer: ${request.customer.name}` : "Guest"} • {request.phone}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-start lg:items-end">
                      <Badge
                        variant="outline"
                        className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                      >
                        {request.status}
                      </Badge>
                      <Select value={request.status} onValueChange={(value) => handleChangeStatus(request, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="REVIEWED">Reviewed</SelectItem>
                          <SelectItem value="ASSIGNED">Assigned</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
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
