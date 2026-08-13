"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WebStackProLogo, WebStackProWordmark } from "@/components/layout/webstackpro-logo";

/**
 * WebStackPro Landing Nav
 */

export function WebStackProNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <WebStackProWordmark dark />
        <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
          <Link href="#features" className="transition hover:text-cyan">Features</Link>
          <Link href="#how" className="transition hover:text-cyan">How it works</Link>
          <Link href="#plans" className="transition hover:text-cyan">Pricing</Link>
          <Link href="#faq" className="transition hover:text-cyan">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <Button variant="ghost" className="px-2 text-sm text-white hover:text-cyan sm:px-4">
              <span className="sm:hidden">Login</span>
              <span className="hidden sm:inline">Login to WebStackPro</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="cyan" className="px-3 sm:px-4">Start Free Trial</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}