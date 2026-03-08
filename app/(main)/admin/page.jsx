import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingRequests } from "./components/booking-requests";
import { PendingPayouts } from "./components/pending-payouts";
import { getBookingRequests } from "@/actions/booking-request";
import { getPendingPayouts, getDashboardStats } from "@/actions/admin";

export const metadata = {
  title: "Admin Dashboard - Vapra Workshop",
  description: "Admin dashboard for managing appointments and payments",
};

export default async function AdminPage() {
  const [bookingRequestsData, pendingPayoutsData, dashboardStats] =
    await Promise.all([
      getBookingRequests(),
      getPendingPayouts(),
      getDashboardStats(),
    ]);

  const maxChartValue = Math.max(...dashboardStats.chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white">Payouts Received</h2>
          <p className="mt-2 text-3xl font-bold text-emerald-200">
            ₹{dashboardStats.totalPayoutsReceived.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Total processed payouts in the last 6 months
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white">Payout Trend</h2>
          <div className="mt-4 grid grid-cols-6 gap-2 items-end">
            {dashboardStats.chartData.map((point) => {
              const height = (point.value / maxChartValue) * 100;
              return (
                <div key={point.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-4 rounded-t-lg bg-emerald-400 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white">Pending Payouts</h2>
          <p className="mt-2 text-3xl font-bold text-amber-200">
            {pendingPayoutsData.payouts.length}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Payouts awaiting approval
          </p>
        </div>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Booking Requests</TabsTrigger>
        <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
      </TabsList>

      <TabsContent value="requests" className="border-none p-0">
        <BookingRequests requests={bookingRequestsData.requests || []} />
        </TabsContent>

        <TabsContent value="payouts" className="border-none p-0">
          <PendingPayouts payouts={pendingPayoutsData.payouts || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
