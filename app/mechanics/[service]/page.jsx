import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MechanicServicePage({ params }) {
  const { service } = await params;

  // Match doctors-appointment-platform behavior:
  // decode URL segment and provide a "Request Booking" CTA.
  if (!service) {
    redirect("/mechanics");
  }

  const decodedService = service.split("%20").join(" ");
  const bookingUrl = `/booking-request?service=${encodeURIComponent(decodedService)}`;

  return (
    <div className="space-y-6">
      <PageHeader title={decodedService} backLink="/mechanics" backLabel="All Services" />

      <Card className="border-emerald-900/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2 text-white">Book Service Now</CardTitle>
          <CardDescription>
            Submit your service request for {decodedService}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <p className="text-center text-muted-foreground max-w-md">
            Our admin team will review your request and assign the best available mechanic for your{" "}
            {decodedService} service.
          </p>
          <Link href={bookingUrl}>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Request Booking
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

