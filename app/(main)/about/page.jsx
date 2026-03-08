"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Wrench, Clock, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <PageHeader
        title="About Vapra Workshop"
        description="Decades of trusted automotive service, now with a modern digital experience."
      />

      <section className="grid gap-8 md:grid-cols-[3fr,2fr] items-start">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-emerald-400" />
              Our Story
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              Vapra Workshop started as a small neighborhood garage in Bikaner with a simple mission:
              provide honest, high‑quality repairs that drivers can rely on. Over the years, we&apos;ve
              grown into a full‑service workshop trusted by families, fleet owners, and businesses
              across the region.
            </p>
            <p>
              Today, we combine that same hands‑on expertise with a digital platform that makes it
              easier than ever to book appointments, track service history, and stay informed about
              your vehicle&apos;s health.
            </p>
            <p>
              Whether it&apos;s routine maintenance or complex diagnostics, our certified technicians
              use modern tools, genuine parts, and transparent communication at every step.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Open 7 days a week</p>
                  <p className="text-gray-400">9:00 AM – 6:00 PM, including weekends.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Central Bikaner location</p>
                  <p className="text-gray-400">
                    Old Chungi Chowki, Gajner Road – easy to find and access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Warranty on services</p>
                  <p className="text-gray-400">
                    All major jobs covered with clear warranty terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/20 bg-emerald-950/20">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Ready to book a service?</h3>
              <p className="text-sm text-gray-400">
                Start your booking in a few clicks, choose your service category, and we&apos;ll
                handle the rest.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/onboarding">Book an Appointment</Link>
                </Button>
                <Button asChild variant="outline" className="border-emerald-600/60">
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">Customer‑first approach</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              We explain every recommendation, share estimates upfront, and only proceed with work
              you approve.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">Modern diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              From engine scans to electrical checks, we use up‑to‑date tools to identify issues
              quickly and accurately.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">Long‑term care</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              We help you plan maintenance so your vehicle stays reliable and cost‑efficient over
              time.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
