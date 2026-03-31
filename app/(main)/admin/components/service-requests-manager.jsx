"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateServiceRequestStatus } from "@/actions/bookingRequest";
import useFetch from "@/hooks/use-fetch";
import { format } from "date-fns";
import { toast } from "sonner";

const statusVariants = {
  PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  REVIEWED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ASSIGNED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  COMPLETED: "bg-emerald-700/20 text-emerald-200 border-emerald-700/30",
  CLOSED: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export function ServiceRequestsManager({ requests = [] }) {
  const [localRequests, setLocalRequests] = useState(requests);
  const [range, setRange] = useState("lastday");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { loading, fn: submitStatusUpdate } = useFetch(updateServiceRequestStatus);

  const statusActions = useMemo(
    () => [
      { label: "Pending", value: "PENDING" },
      { label: "Review", value: "REVIEWED" },
      { label: "Approve", value: "ASSIGNED" },
      { label: "Close", value: "CLOSED" },
    ],
    []
  );

  const handleStatusChange = async (requestId, status) => {
    if (loading) return;

    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("status", status);

      const result = await submitStatusUpdate(formData);
      if (result?.success) {
        setLocalRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status } : req))
        );
        toast.success(`Request status set to ${status}`);
      }
    } catch (error) {
      toast.error(error?.message || "Could not update status");
    }
  };

  const downloadServiceRequests = () => {
    const url = new URL("/api/admin/export-service-requests", window.location.origin);
    url.searchParams.set("range", range);
    if (range === "custom") {
      if (fromDate) url.searchParams.set("from", fromDate);
      if (toDate) url.searchParams.set("to", toDate);
    }

    window.open(url.toString(), "_blank");
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Range</label>
          <select
            className="rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="lastday">Last Day</option>
            <option value="lastweek">Last Week</option>
            <option value="lastmonth">Last Month</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {range === "custom" && (
          <>
            <div>
              <label className="text-xs text-slate-300" htmlFor="fromDate">
                From
              </label>
              <input
                id="fromDate"
                type="date"
                className="ml-2 rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300" htmlFor="toDate">
                To
              </label>
              <input
                id="toDate"
                type="date"
                className="ml-2 rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </>
        )}
        <button
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          onClick={downloadServiceRequests}
        >
          Download CSV
        </button>
      </div>

      {localRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
          No service requests available
        </div>
      ) : (
        localRequests.map((req) => (
          <div key={req.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{req.serviceName}</h3>
                <p className="text-slate-300 text-sm mt-1">{req.vehicleInfo}</p>
                <p className="text-slate-300 text-sm mt-1">"{req.issueDescription}"</p>
                <p className="text-xs text-slate-400 mt-1">
                  Preferred: {format(new Date(req.preferredDate), "PPP")} {req.preferredTimeSlot ? ` @ ${req.preferredTimeSlot}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {req.customerId ? "Registered" : "Guest"} • {req.email || "No email"} • {req.phone}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Created: {format(new Date(req.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <Badge className={statusVariants[req.status] || statusVariants.PENDING}>
                {req.status}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {statusActions.map((action) => (
                <Button
                  key={`${req.id}-${action.value}`}
                  size="sm"
                  variant={req.status === action.value ? "secondary" : "outline"}
                  onClick={() => handleStatusChange(req.id, action.value)}
                  disabled={loading || req.status === "CLOSED"}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
