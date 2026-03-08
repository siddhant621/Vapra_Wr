"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ClipboardList,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingRequest } from "@/actions/booking-request";

export default function BookingRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "Service";

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    vehicleInfo: "",
    issueDescription: "",
    preferredDate: "",
    phone: "",
    email: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        !formData.vehicleInfo ||
        !formData.issueDescription ||
        !formData.preferredDate ||
        !formData.phone
      ) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const payload = new FormData();
      payload.append("serviceName", service);
      payload.append("vehicleInfo", formData.vehicleInfo);
      payload.append("issueDescription", formData.issueDescription);
      payload.append("preferredDate", formData.preferredDate);
      payload.append("phone", formData.phone);
      payload.append("email", formData.email);

      await createBookingRequest(payload);

      toast.success("Booking request submitted! Admin has received it.");
      setSubmitted(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/mechanics");
      }, 2000);
    } catch (error) {
      console.error("Error submitting booking request:", error);
      toast.error("Failed to submit booking request");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-emerald-900/20">
            <CardContent className="pt-12 pb-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="bg-emerald-900/20 p-4 rounded-full">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Request Submitted!
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Our admin team will review your{" "}
                    <span className="text-emerald-400 font-medium">{service}</span>{" "}
                    service request and contact you at{" "}
                    <span className="text-white font-medium">{formData.phone}</span>{" "}
                    to confirm your booking.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll be in touch soon. Redirecting to services...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={`Request ${service} Service`}
        backLink="/mechanics"
        backLabel="Services"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Service info */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Card className="border-emerald-900/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-900/20 p-4 rounded-full mb-4">
                    <ClipboardList className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {service}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Submit your service request and our admin team will assign the
                    best available mechanic for this job.
                  </p>
                  <Alert className="bg-emerald-900/10 border-emerald-900/30">
                    <AlertCircle className="h-4 w-4 text-emerald-500" />
                    <AlertDescription className="text-sm text-emerald-100">
                      Response time: 2 hours or less
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column - Form */}
        <div className="lg:col-span-2">
          <Card className="border-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                Service Request Form
              </CardTitle>
              <CardDescription>
                Tell us about your vehicle and the service you need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicleInfo" className="text-white">
                    Vehicle Information{" "}
                    <span className="text-emerald-500">*</span>
                  </Label>
                  <Input
                    id="vehicleInfo"
                    name="vehicleInfo"
                    placeholder="e.g., 2020 Toyota Camry, Black"
                    value={formData.vehicleInfo}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-900 border-emerald-900/30 placeholder:text-slate-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include year, make, model, and color if possible
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDescription" className="text-white">
                    Describe the Issue <span className="text-emerald-500">*</span>
                  </Label>
                  <Textarea
                    id="issueDescription"
                    name="issueDescription"
                    placeholder="Please describe the issue you're experiencing, any sounds, warning lights, or symptoms..."
                    value={formData.issueDescription}
                    onChange={handleInputChange}
                    required
                    className="bg-slate-900 border-emerald-900/30 h-32 placeholder:text-slate-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Detailed information helps us prepare and assign the right mechanic
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate" className="text-white">
                      Preferred Date <span className="text-emerald-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                      <Input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-slate-900 border-emerald-900/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone Number <span className="text-emerald-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="pl-10 bg-slate-900 border-emerald-900/30 placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address{" "}
                    <span className="text-slate-500">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 bg-slate-900 border-emerald-900/30 placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send confirmation to your email as well
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  By submitting, you agree that our admin team may contact you to confirm details.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-8 text-center">
        <Link href="/mechanics" className="text-sm text-muted-foreground hover:text-white">
          Back to all services
        </Link>
      </div>
    </div>
  );
}

