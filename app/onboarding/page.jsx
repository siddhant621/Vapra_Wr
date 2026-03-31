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

  const { loading, data, error } = useFetch(setUserRole);

  // If auto-redirect finished, send the user where the server told us
  useEffect(() => {
    if (autoData && autoData?.success) {
      router.push(autoData.redirect || "/mechanics");
    }
  }, [autoData, router]);

  // If there is any error (unauthorized or other), send the user to booking without login
  useEffect(() => {
    if (autoError || error) {
      router.push("/mechanics");
    }
  }, [autoError, error, router]);

  // Auto-redirect immediately once the page loads
  useEffect(() => {
    autoSubmit();
  }, [autoSubmit]);

  return (
    <div className="flex h-[70vh] flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      <p className="mt-4 text-center text-white">
        Redirecting to service booking page...
      </p>
    </div>
  );
}
