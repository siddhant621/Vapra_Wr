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
import { setUserRole, autoSetUserRole } from "@/actions/onboarding";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();

  // Custom hook for user role server action
  const {
    loading: autoLoading,
    data: autoData,
    error: autoError,
    fn: autoSubmit,
  } = useFetch(autoSetUserRole);

  const { loading, data, error, fn: submitUserRole } = useFetch(setUserRole);

  // If auto-redirect finished, send the user where the server told us
  useEffect(() => {
    if (autoData && autoData?.success) {
      router.push(autoData.redirect);
    }
  }, [autoData, router]);

  // If manual selection finished, send the user where the server told us
  useEffect(() => {
    if (data && data?.success) {
      router.push(data.redirect);
    }
  }, [data, router]);

  // If user is not authenticated, send to sign in
  useEffect(() => {
    if (autoError?.message === "Unauthorized" || error?.message === "Unauthorized") {
      router.push("/sign-in");
    }
  }, [autoError, error, router]);

  // Auto-redirect immediately once the page loads
  useEffect(() => {
    autoSubmit();
  }, [autoSubmit]);

  const isBusy = autoLoading || loading;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Customer/User Option */}
      <Card
        className="cursor-pointer border-emerald-900/20 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        onClick={async () => {
          if (isBusy) return;
          const formData = new FormData();
          formData.append("role", "CUSTOMER");
          await submitUserRole(formData);
        }}
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
              disabled={isBusy}
            >
              {isBusy ? (
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
        onClick={async () => {
          if (isBusy) return;
          const formData = new FormData();
          formData.append("role", "ADMIN");
          await submitUserRole(formData);
        }}
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
              disabled={isBusy}
            >
              {isBusy ? (
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
