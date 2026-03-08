"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, Loader2 } from "lucide-react";
import { setUserRole } from "@/actions/onboarding";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();

  // Custom hook for user role server action
  const { loading, data, error, fn: submitUserRole } = useFetch(setUserRole);

  // Handle customer role selection
  const handleCustomerSelection = async () => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "CUSTOMER");

    await submitUserRole(formData);
  };

  // Handle admin role selection
  const handleAdminSelection = async () => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "ADMIN");

    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data && data?.success) {
      router.push(data.redirect);
    }
  }, [data, router]);

  // If user is not authenticated, server action returns "Unauthorized"
  // In that case, send them to the sign-in page instead of doing nothing
  useEffect(() => {
    if (error?.message === "Unauthorized") {
      router.push("/sign-in");
    }
  }, [error, router]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Customer/User Option */}
      <Card 
        className="cursor-pointer border-emerald-900/20 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        onClick={handleCustomerSelection}
      >
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4 w-fit mx-auto">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              I'm a Customer
            </CardTitle>
            <CardDescription className="mb-4">
              Browse and book vehicle services from our mechanics
            </CardDescription>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleCustomerSelection();
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue as Customer"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Option */}
      <Card 
        className="cursor-pointer border-emerald-900/20 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        onClick={handleAdminSelection}
      >
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4 w-fit mx-auto">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              I'm an Admin
            </CardTitle>
            <CardDescription className="mb-4">
              Manage mechanics, services, and platform settings
            </CardDescription>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleAdminSelection();
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue as Admin"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
