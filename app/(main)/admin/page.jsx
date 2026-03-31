import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/prisma";
import { format } from "date-fns";

export const metadata = {
  title: "Admin Dashboard - Vapra Workshop",
  description: "Garage management dashboard",
};

export default async function AdminPage() {
  const [mechanics, serviceRequests, payouts] = await Promise.all([
    db.user.findMany({
      where: { role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        experience: true,
        credits: true,
        verificationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.payout.findMany({
      where: { status: "PROCESSING" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const totalRevenueAgg = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: "PAID" },
  });

  const dashboardStats = {
    totalMechanics: mechanics.length,
    activeJobs: serviceRequests.filter((item) => item.status === "PENDING").length,
    totalRevenue: totalRevenueAgg._sum.amount || 0,
    pendingPayouts: payouts.length,
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      inactive: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return variants[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getExperienceLabel = (years) => {
    if (years >= 10) return "Veteran";
    if (years >= 5) return "Senior";
    return "Junior";
  };

  const getPerformanceRating = (credits, bookings) => {
    const score = (credits / 100 + bookings / 50);
    if (score >= 10) return "★★★★★";
    if (score >= 7) return "★★★★";
    if (score >= 4) return "★★★";
    return "★★";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="group p-8 rounded-3xl bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-400 transition-all backdrop-blur-sm">
            <div className="text-blue-300 mb-3 text-lg font-semibold">Mechanics</div>
            <div className="text-4xl font-black text-white">{dashboardStats.totalMechanics}</div>
            <div className="text-blue-200 mt-2 text-sm font-medium">Active</div>
          </div>

          <div className="group p-8 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all backdrop-blur-sm">
            <div className="text-emerald-300 mb-3 text-lg font-semibold">Active Jobs</div>
            <div className="text-4xl font-black text-white">{dashboardStats.activeJobs}</div>
            <div className="text-emerald-200 mt-2 text-sm font-medium">In progress</div>
          </div>

          <div className="group p-8 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-400 transition-all backdrop-blur-sm">
            <div className="text-amber-300 mb-3 text-lg font-semibold">Revenue</div>
            <div className="text-4xl font-black text-white">₹{dashboardStats.totalRevenue.toLocaleString()}</div>
            <div className="text-amber-200 mt-2 text-sm font-medium">Lifetime</div>
          </div>

          <div className="group p-8 rounded-3xl bg-red-500/10 border-2 border-red-500/30 hover:border-red-400 transition-all backdrop-blur-sm">
            <div className="text-red-300 mb-3 text-lg font-semibold">Pending Payouts</div>
            <div className="text-4xl font-black text-white">{dashboardStats.pendingPayouts}</div>
            <div className="text-red-200 mt-2 text-sm font-medium">Review needed</div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <Tabs defaultValue="mechanics" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-20 bg-white/5 rounded-2xl p-2 border border-white/20">
              <TabsTrigger value="mechanics" className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:shadow-lg h-16">
                Mechanics ({mechanics.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:shadow-lg h-16">
                Service Requests
              </TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:shadow-lg h-16">
                Payouts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mechanics" className="mt-0">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-4 px-6 font-bold text-white">Name</th>
                      <th className="text-left py-4 px-6 font-bold text-white w-24">Level</th>
                      <th className="text-left py-4 px-6 font-bold text-white">Credits</th>
                      <th className="text-left py-4 px-6 font-bold text-white">Bookings</th>
                      <th className="text-left py-4 px-6 font-bold text-white w-28">Rating</th>
                      <th className="text-left py-4 px-6 font-bold text-white w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mechanics.map((m) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                        <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${m.verificationStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                          {m.name}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`px-3 py-1 text-xs font-bold ${m.experience >= 10 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : m.experience >= 5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                            {getExperienceLabel(m.experience)}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="bg-emerald-500/20 px-4 py-2 rounded-full text-emerald-300 font-mono">
                            {m.credits.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-blue-300 font-mono">{m.bookings || 0}</td>
                        <td className="py-4 px-6 text-amber-300 font-medium">{getPerformanceRating(m.credits, m.bookings || 0)}</td>
                        <td className="py-4 px-6">
                          <Badge className={getStatusBadge(m.verificationStatus?.toLowerCase?.() || 'inactive')}>
                            {m.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serviceRequests.length === 0 ? (
                  <div className="col-span-full text-center py-14 text-slate-300 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    No service requests found.
                  </div>
                ) : (
                  serviceRequests.map((req) => (
                    <div key={req.id} className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all hover:border-emerald-400 hover:bg-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-bold text-xl text-white">{req.serviceName}</h4>
                        <Badge className={
                          req.status === "PENDING" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                          req.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                          req.status === "CANCELLED" ? "bg-slate-500/20 text-slate-300 border-slate-500/30" :
                          "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }>
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-slate-200 mb-2 text-sm">{req.vehicleInfo}</p>
                      <p className="text-slate-200 text-sm mb-2">"{req.issueDescription}"</p>
                      <p className="text-slate-400 text-xs mb-3">Preferred: {format(new Date(req.preferredDate), "MMM d, yyyy")}{req.preferredTimeSlot ? ` @ ${req.preferredTimeSlot}` : ""}</p>
                      <div className="text-slate-400 text-xs space-y-1">
                        <div>{req.customerId ? "Registered user" : "Guest"} • {req.email || "No email"}</div>
                        <div>{req.phone}</div>
                        <div className="text-xs text-slate-300">Requested at {format(new Date(req.createdAt), "MMM d, yyyy h:mm a")}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="payouts" className="mt-0">
              {payouts.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border-2 border-dashed border-white/20">
                  <h3 className="text-3xl font-bold text-white">No Payouts Pending</h3>
                  <p className="text-slate-300 mt-2">Mechanic payout requests will appear here when submitted.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-white">Mechanic ID: {payout.mechanicId || "Unknown"}</h4>
                          <p className="text-sm text-slate-300">{payout.paypalEmail || "No paypal info"}</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{payout.status}</Badge>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        Credits: {payout.credits} • Amount: ₹{payout.amount.toLocaleString()} • Net: ₹{payout.netAmount.toLocaleString()}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Requested on {format(new Date(payout.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}