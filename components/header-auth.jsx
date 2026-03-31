"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { isAllowedAdminEmail } from "@/lib/admin-access";

export function HeaderAuth() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render nothing on SSR and during first hydration to avoid mismatch.
    return null;
  }

  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  const allowListed = isAllowedAdminEmail(email);

  return (
    <div className="flex items-center space-x-2">
      <SignedOut>
        <Link href="/sign-in">
          <Button variant="secondary">Sign In</Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline">Sign Up</Button>
        </Link>
      </SignedOut>

      <SignedIn>
        {allowListed && (
          <Link href="/admin" className="hidden sm:inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-400 text-emerald-100 hover:bg-emerald-500/10 hover:border-emerald-300"
              aria-label="Go to admin dashboard"
            >
              Admin
            </Button>
          </Link>
        )}

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
              userButtonPopoverCard: "shadow-xl",
              userPreviewMainIdentifier: "font-semibold",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
