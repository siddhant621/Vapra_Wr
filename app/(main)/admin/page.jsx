import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { getBookingRequests } from "@/actions/booking-request";

export const metadata = {
  title: "Admin Dashboard - Vapra Workshop",
  description: "Admin dashboard for managing Vapra Workshop",
};

export default async function AdminPage() {
  let requests = [];
  try {
    const res = await getBookingRequests();
    requests = (res?.requests || []).slice(0, 10);
  } catch (e) {
    requests = [];
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Admin Dashboard"
        description="Manage your workshop operations"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dashboard Overview */}
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle>Welcome, Admin</CardTitle>
            <CardDescription>Dashboard Overview</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              This is your admin dashboard for managing Vapra Workshop.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Manage mechanics</li>
              <li>• View bookings</li>
              <li>• Process payouts</li>
              <li>• View customer inquiries</li>
            </ul>
          </CardContent>
        </Card>

        {/* Booking Requests */}
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle>New Booking Requests</CardTitle>
            <CardDescription>Latest customer service requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-300">
                No booking requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-emerald-900/20 bg-muted/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {r.serviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phone: {r.phone} • Status: {r.status}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">
                      {r.issueDescription}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">
              Dashboard statistics and analytics will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
