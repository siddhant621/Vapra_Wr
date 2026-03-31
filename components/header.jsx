import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { HeaderAuth } from "./header-auth";
import { Button } from "./ui/button";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <button
            type="button"
            className="md:hidden rounded-md border px-3 py-1 text-sm font-medium text-foreground bg-background/70 hover:bg-background transition"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <div
            className={`w-full md:w-auto overflow-hidden transition-all duration-300 ${
              menuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0 md:max-h-full md:opacity-100"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <Link
                href="/"
                className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/mechanics"
                className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
                onClick={() => setMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/contact-support"
                className="rounded-md px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/40 transition"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
