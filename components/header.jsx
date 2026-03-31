import Image from "next/image";
import Link from "next/link";
import React from "react";
import { HeaderAuth } from "./header-auth";
import { Button } from "./ui/button";

export default function Header() {

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-backdrop-filter:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo-single2.png"
            alt="vapra-logo"
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
          />
          <span className="hidden sm:inline-block text-lg font-semibold tracking-wide bg-linear-to-r from-emerald-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent shadow-sm">
            Vapra Workshop
          </span>
        </Link>

        <HeaderAuth />
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
