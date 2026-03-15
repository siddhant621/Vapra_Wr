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
        description="Serving Bikaner with trusted automotive repair and service since July 2013."
      />

      <section className="grid gap-8 md:grid-cols-2 items-start">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-emerald-400" />
              Our Story
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              Vapra Workshop was founded in{" "}
              <span className="text-white font-medium">July 2013</span> by{" "}
              <span className="text-white font-medium">Ashok Devra</span> with
              a simple but powerful vision — to create a workshop where
              honesty, quality workmanship, and customer trust come before
              everything else.
            </p>

            <p>
              Starting from a small garage at{" "}
              <span className="text-white font-medium">
                Old Chungi Chowki, Gajner Road, Bikaner
              </span>
              , Vapra Workshop quickly earned the trust of local drivers
              through reliable repairs, transparent service, and genuine
              dedication to every vehicle that entered the workshop.
            </p>

            <p>
              Over the years, what began as a modest neighborhood repair shop
              has grown into a trusted destination for drivers across Bikaner.
              Our journey has been built on hard work, hands-on mechanical
              expertise, and the belief that every customer deserves honest
              service and dependable solutions.
            </p>

            <p>
              Today, Vapra Workshop combines{" "}
              <span className="text-white font-medium">
                years of practical automotive experience
              </span>{" "}
              with modern tools and a digital service platform that allows
              customers to easily book appointments, manage services, and stay
              informed about their vehicle’s health.
            </p>

            <p>
              Every vehicle we service carries our promise — careful attention,
              reliable repairs, and a commitment to keeping our customers safe
              and confident on the road.
            </p>

            <p className="italic text-emerald-400 border-l-2 border-emerald-500 pl-4">
              “A workshop is not just about repairing vehicles — it’s about
              earning the trust of every customer who walks through the door.”
              — Ashok Devra
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20 overflow-hidden bg-gradient-to-br from-emerald-900/20 to-transparent group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
          <CardContent className="p-0 relative group-hover:scale-105 transition-transform duration-300">
            <img
              src="/Ashokji.jpeg"
              alt="Ashok Devra - Founder of Vapra Workshop"
              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h4 className="font-bold text-2xl mb-2 drop-shadow-lg">Ashok Devra</h4>
              <p className="text-lg text-emerald-200 font-medium drop-shadow-md">Founder & Master Technician</p>
              <div className="w-16 h-1 bg-emerald-400 mt-3 rounded-full"></div>
            </div>
            <div className="absolute top-4 right-4 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Since 2013
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">Quick Facts</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Open 7 days a week</p>
                <p className="text-gray-400">
                  9:00 AM – 6:00 PM, including weekends.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">
                  Old Chungi Chowki, Gajner Road
                </p>
                <p className="text-gray-400">Bikaner, Rajasthan 334002</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">
                  New Workshop Location
                </p>
                <p className="text-gray-400">
                  We are expanding! Our new Vapra Workshop branch is now open
                  opposite Civil Airport, Nal, Bikaner to serve more customers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">
                  Quality & Service Guarantee
                </p>
                <p className="text-gray-400">
                  Trusted repairs with transparent pricing and reliable
                  service standards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20 bg-emerald-950/20">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Ready to book a service?
            </h3>

            <p className="text-sm text-gray-400">
              Book your vehicle service in just a few clicks and let our
              experienced technicians take care of the rest.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/onboarding">Book an Appointment</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-emerald-600/60"
              >
                <Link href="/services">Browse Services</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">
              Customer-First Approach
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              We believe in honest communication. Every repair is explained
              clearly, estimates are shared upfront, and work only begins after
              customer approval.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">
              Modern Diagnostics
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              Using modern diagnostic tools and techniques, we quickly identify
              issues and provide accurate, efficient repair solutions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-white">
              Long-Term Vehicle Care
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-gray-300 space-y-2">
            <p>
              Our goal is not just fixing problems — we help maintain your
              vehicle’s performance and reliability for the long run.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}