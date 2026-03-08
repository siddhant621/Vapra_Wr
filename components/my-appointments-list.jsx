"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { cancelOwnBookingRequest } from "@/actions/booking-request";
import { XCircle } from "lucide-react";

function getRequestStatusMeta(status) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending review",
        badgeClass:
          "bg-amber-900/40 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-900/40",
        description:
          "We have received your request and our team will review it shortly.",
      };
    case "REVIEWED":
      return {
        label: "Reviewed",
        badgeClass:
          "bg-sky-900/40 border-sky-500/60 text-sky-200 shadow-sm shadow-sky-900/40",
        description:
          "Your request has been reviewed. We will confirm the exact schedule soon.",
      };
    case "ASSIGNED":
      return {
        label: "Assigned to mechanic",
        badgeClass:
          "bg-emerald-900/40 border-emerald-500/60 text-emerald-200 shadow-sm shadow-emerald-900/40",
        description:
          "A mechanic has been assigned to your service. You will be contacted for final confirmation.",
      };
    case "CLOSED":
      return {
        label: "Closed",
        badgeClass:
          "bg-slate-900/60 border-slate-600/70 text-slate-300/90 shadow-inner shadow-slate-950/60",
        description: "This request has been closed.",
      };
    default:
      return {
        label: status || "Unknown",
        badgeClass: "bg-muted/30 border-muted/40 text-muted-foreground",
        description: "",
      };
  }
}

export default function MyAppointmentsList({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (requestId) => {
    setCancellingId(requestId);

    try {
      const formData = new FormData();
      formData.append("requestId", requestId);

      await cancelOwnBookingRequest(formData);

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "CLOSED" } : req
        )
      );

      toast.success("Appointment request cancelled");
    } catch (error) {
      toast.error(error?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {requests.map((request) => {
        const statusMeta = getRequestStatusMeta(request.status);
        const canCancel =
          request.status === "PENDING" || request.status === "REVIEWED";

        return (
          <Card
            key={request.id}
            className="relative overflow-hidden bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-emerald-950/60 border border-emerald-900/40 hover:border-emerald-400/70 shadow-lg shadow-emerald-950/40 backdrop-blur-sm transition-all duration-200"
          >
            <div className="pointer-events-none absolute inset-px rounded-2xl border border-emerald-500/10" />

            <CardHeader className="relative flex flex-row items-start justify-between gap-4 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-white tracking-tight">
                  {request.serviceName || "Service request"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Requested on{" "}
                  <span className="font-medium text-emerald-200/90">
                    {format(new Date(request.createdAt), "PP p")}
                  </span>
                </p>
                {request.preferredDate && (
                  <p className="text-xs text-muted-foreground">
                    Preferred date:{" "}
                    <span className="font-medium text-emerald-100/90">
                      {format(new Date(request.preferredDate), "PP")}
                    </span>
                  </p>
                )}
                {request.vehicleInfo && (
                  <p className="text-xs text-muted-foreground">
                    Vehicle:{" "}
                    <span className="font-medium text-slate-100">
                      {request.vehicleInfo}
                    </span>
                  </p>
                )}
                {request.issueDescription && (
                  <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                    {request.issueDescription}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <Badge
                  variant="outline"
                  className={`text-[0.65rem] px-3 py-1 rounded-full font-semibold uppercase tracking-wide ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </Badge>
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1.5 rounded-full border-red-500/70 bg-red-900/30 px-4 py-1.5 text-[0.7rem] font-semibold text-red-100 hover:bg-red-600/80 hover:text-white hover:border-red-400 shadow-sm shadow-red-900/40"
                    disabled={cancellingId === request.id}
                    onClick={() => handleCancel(request.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {cancellingId === request.id ? "Cancelling..." : "Cancel request"}
                  </Button>
                )}
              </div>
            </CardHeader>

            {statusMeta.description && (
              <CardContent className="pt-0 pb-4">
                <p className="text-[0.7rem] text-gray-300/90">
                  {statusMeta.description}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
