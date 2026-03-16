import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { db } from "@/lib/prisma";

export default async function Header() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  const allowListed = isAllowedAdminEmail(email);

  let isAdmin = allowListed;

  // Only check database if not already admin via email allow-list
  if (!isAdmin && clerkUser?.id) {
    try {
      const user = await db.user.findUnique({
        where: { clerkUserId: clerkUser.id },
        select: { role: true },
      });
      isAdmin = user?.role === "ADMIN";
    } catch (error) {
      // Database unavailable - use fallback behavior
      console.warn("Database unavailable, using fallback behavior");
      isAdmin = false;
    }
  }

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo-single2.png"
            alt="vapra-logo"
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
          />
          <span className="hidden sm:inline-block text-lg font-semibold tracking-wide bg-gradient-to-r from-emerald-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent shadow-sm">
            Vapra Workshop
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <SignedOut>
            <SignInButton>
              <Button variant="secondary">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {isAdmin && (
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
      </nav>

      <div className="border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-2 py-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            Pricing
          </Link>
          <Link
            href="/mechanics"
            className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            Services
          </Link>
          <Link
            href="/contact-support"
            className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
