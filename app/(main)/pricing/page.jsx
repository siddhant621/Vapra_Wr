"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function PricingPage() {
  const packages = [
    {
      name: "Basic Service",
      price: "Starting at $49",
      description: "Single service repair",
      popular: false,
      features: [
        "One vehicle service",
        "Basic diagnostics",
        "Labor included",
        "30-day warranty",
        "Standard turnaround time",
      ],
    },
    {
      name: "Complete Maintenance",
      price: "Starting at $199",
      description: "Most popular for regular maintenance",
      popular: true,
      features: [
        "Multiple services",
        "Full diagnostics",
        "Parts & labor included",
        "90-day warranty",
        "Priority scheduling",
        "Free inspection",
      ],
    },
    {
      name: "Premium Package",
      price: "Custom Quote",
      description: "Fleet or specialized services",
      popular: false,
      features: [
        "Unlimited services",
        "Advanced diagnostics",
        "All parts included",
        "6-month warranty",
        "24-hour turnaround",
        "Dedicated technician",
      ],
    },
  ];

  const router = useRouter();

  const handleBooking = () => {
    // For customers, go into the simple flow (no mechanic selection page)
    router.push("/onboarding");
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <PageHeader 
        title="Our Service Pricing"
        description="Transparent pricing for quality automotive services at Vapra Workshop"
      />

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {packages.map((pkg, idx) => (
          <Card
            key={idx}
            className={`relative flex h-full flex-col border transition-all ${
              pkg.popular
                ? "border-emerald-600/60 shadow-lg shadow-emerald-600/20 md:scale-105"
                : "border-emerald-900/20 hover:border-emerald-900/40"
            }`}
          >
            {pkg.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-white">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
              <div className="mt-4">
                <p className="text-3xl font-bold text-emerald-400">{pkg.price}</p>
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col justify-between space-y-6">
              <ul className="space-y-3">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleBooking}
                className={`w-full ${
                  pkg.popular
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-emerald-600/80 hover:bg-emerald-600"
                }`}
              >
                Browse Services
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle>Why Choose Vapra Workshop?</CardTitle>
          <CardDescription>Industry-leading service quality and customer satisfaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Expert Technicians</h4>
              <p className="text-sm text-gray-400">
                Our certified mechanics have years of experience servicing all vehicle types and brands.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Quality Guarantee</h4>
              <p className="text-sm text-gray-400">
                All services backed by our satisfaction guarantee and warranty coverage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Transparent Pricing</h4>
              <p className="text-sm text-gray-400">
                No hidden fees. Get upfront quotes before any work begins.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Fast Turnaround</h4>
              <p className="text-sm text-gray-400">
                Quick service without compromising on quality. Most jobs completed same day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="bg-emerald-900/20 border border-emerald-600/20 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Book Your Service?</h2>
        <p className="text-gray-400 mb-6">
          Browse our services by category and schedule your appointment today
        </p>
        <Button
          size="lg"
          onClick={handleBooking}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Browse All Services
        </Button>
      </div>
    </div>
  );
}
