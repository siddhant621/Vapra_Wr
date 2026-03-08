import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import MyAppointmentsList from "@/components/my-appointments-list";

export const metadata = {
  title: "My Appointments - Vapra Workshop",
  description: "View and track all your workshop bookings.",
};

async function getCustomerBookingRequests(userId) {
  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!customer) {
      return { requests: [] };
    }

    const requests = await db.bookingRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serviceName: true,
        vehicleInfo: true,
        issueDescription: true,
        preferredDate: true,
        preferredTimeSlot: true,
        status: true,
        createdAt: true,
      },
    });

    return { requests };
  } catch (error) {
    console.error("Failed to load customer booking requests:", error);
    return { requests: [], error: "Failed to load appointments" };
  }
}

function getRequestStatusMeta(status) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending review",
        badgeClass: "bg-amber-900/20 border-amber-900/40 text-amber-300",
        description:
          "We have received your request and our team will review it shortly.",
      };
    case "REVIEWED":
      return {
        label: "Reviewed",
        badgeClass: "bg-sky-900/20 border-sky-900/40 text-sky-300",
        description:
          "Your request has been reviewed. We will confirm the exact schedule soon.",
      };
    case "ASSIGNED":
      return {
        label: "Assigned to mechanic",
        badgeClass: "bg-emerald-900/20 border-emerald-900/40 text-emerald-300",
        description:
          "A mechanic has been assigned to your service. You will be contacted for final confirmation.",
      };
    case "CLOSED":
      return {
        label: "Closed",
        badgeClass: "bg-muted/30 border-muted/40 text-muted-foreground",
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

export default async function AppointmentsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { requests, error } = await getCustomerBookingRequests(userId);

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <PageHeader
        title="My Appointments"
        description="Track all your workshop booking requests and their current status."
      />

      {error && (
        <Card className="border-red-900/40 bg-red-950/20">
          <CardContent className="py-4">
            <p className="text-sm text-red-200">
              We couldn&apos;t load your appointments right now. Please try again in a
              moment.
            </p>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card className="border-emerald-900/20 bg-emerald-950/10">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-lg font-semibold text-white">No appointments yet</p>
            <p className="text-sm text-muted-foreground">
              Once you book a service, you&apos;ll see all of your requests listed here
              with live status updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MyAppointmentsList initialRequests={requests} />
      )}
    </div>
  );
}


