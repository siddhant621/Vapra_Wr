import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SPECIALTIES } from "@/lib/specialities";

export default async function MechanicsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Find Our Services"
          description="Browse by service type or request a mechanic for your specific need."
          backLink="/"
          backLabel="Back to Home"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {SPECIALTIES.map((specialty) => (
            <Link key={specialty.name} href={`/mechanics/${specialty.name}`}>
              <Card className="h-full border-emerald-900/20 hover:border-emerald-600/40 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-14 h-14 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                    <div className="text-emerald-400">{specialty.icon}</div>
                  </div>
                  <h3 className="font-semibold text-white">{specialty.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
