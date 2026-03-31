import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyAdmin } from "@/actions/admin";

const DATE_KEYS = ["createdAt"];

function toCsvRow(fields) {
  return fields.map((value) => {
    if (value === undefined || value === null) return "";
    const cell = String(value).replace(/"/g, '""');
    return `"${cell}"`;
  }).join(",");
}

function buildCsv(requests) {
  const header = [
    "Request ID",
    "Customer ID",
    "Service Name",
    "Vehicle Info",
    "Issue",
    "Preferred Date",
    "Preferred Time",
    "Phone",
    "Email",
    "Status",
    "Created At",
    "Updated At"
  ];

  const rows = requests.map((r) => (
    toCsvRow([
      r.id,
      r.customerId || "",
      r.serviceName,
      r.vehicleInfo,
      r.issueDescription,
      r.preferredDate ? new Date(r.preferredDate).toISOString() : "",
      r.preferredTimeSlot || "",
      r.phone,
      r.email || "",
      r.status,
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
      r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    ])
  ));

  return [toCsvRow(header), ...rows].join("\n");
}

export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "lastday";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let startDate = new Date();
  let endDate = new Date();

  if (range === "lastweek") {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "lastmonth") {
    endDate = new Date();
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "lastday") {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
  } else if (range === "custom" && from && to) {
    const parsedFrom = new Date(from);
    const parsedTo = new Date(to);
    if (Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime())) {
      return new NextResponse("Invalid date range", { status: 400 });
    }
    startDate = parsedFrom;
    endDate = parsedTo;
  } else {
    // fallback to last day
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
  }

  if (startDate > endDate) {
    return new NextResponse("Start date must be before end date", { status: 400 });
  }

  const requests = await db.bookingRequest.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const csv = buildCsv(requests);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=service-requests-${range}-${Date.now()}.csv`,
    },
  });
}
