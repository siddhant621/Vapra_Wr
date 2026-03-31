import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ManageMechanics } from "@/app/(main)/admin/components/manage-mechanics";
import { ServiceRequestsManager } from "@/app/(main)/admin/components/service-requests-manager";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Admin Manage - Vapra Workshop",
  description: "Admin management panel for mechanics and requests",
};

export default async function AdminManagePage() {
  const [mechanics, serviceRequests, payouts] = await Promise.all([
    db.user.findMany({
      where: { role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        experience: true,
        specialty: true,
        credits: true,
        verificationStatus: true,
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center gap-3 border border-white/10 rounded-2xl bg-white/5 p-4">
          <Link
            href="/admin"
            className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/manage"
            className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
          >
            Manage
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Management</h1>
          <p className="text-slate-300 mb-6">
            This page has the same management UI as the dashboard Manage section, with focused functionality for
            creating mechanics, assigning slots, and triaging customer requests.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Mechanic pool</h2>
              <p className="text-slate-300 mb-4">You can create mechanics and allocate slots from here.</p>
              <ManageMechanics mechanics={mechanics} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Service requests</h2>
              <p className="text-slate-300 mb-4">Review open requests and update statuses as needed.</p>
              <ServiceRequestsManager requests={serviceRequests} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mt-6">
            <h3 className="text-lg font-bold text-white">Outstanding payouts (processing)</h3>
            {payouts.length === 0 ? (
              <p className="text-slate-300 mt-2">No payouts currently processing.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {payouts.map((payout) => (
                  <div key={payout.id} className="rounded-lg border border-white/10 bg-slate-950 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Mechanic ID: {payout.mechanicId || "Unknown"}</span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{payout.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Amount: ₹{payout.amount.toLocaleString()} • Credits: {payout.credits}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
