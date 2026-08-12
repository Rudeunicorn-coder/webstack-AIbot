"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Library,
  Settings,
  LogOut,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WebStackProLogo } from "@/components/layout/webstackpro-logo";

const NAV = [
  { href: "/dashboard", label: "Unified Inbox", icon: Inbox },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: Library },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/**
 * WebStackPro Dashboard Sidebar
 * Navy brand rail with the WebStackPro constellation.
 */
export function WebStackProSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("webstackpro_token");
    localStorage.removeItem("webstackpro_business");
    router.replace("/login");
  }

  return (
    <aside className="webstackpro-navy-gradient hidden w-64 shrink-0 flex-col border-r border-white/10 text-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <WebStackProLogo size={34} />
        <div className="leading-none">
          <p className="font-display text-base font-extrabold text-white">
            WebStack<span className="text-cyan">Pro</span>
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan/80">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-cyan text-navy shadow-glow"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.label === "Unified Inbox" && active && (
                <Sparkles className="ml-auto h-3.5 w-3.5" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/dashboard/settings#billing"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <CreditCard className="h-4 w-4" /> Billing &amp; Plan
        </Link>
        <div className="rounded-lg bg-cyan/10 p-3 text-xs text-white/80">
          <span className="flex items-center gap-1.5 font-semibold text-cyan">
            <Sparkles className="h-3.5 w-3.5" /> WebStackPro AI Active
          </span>
          <p className="mt-1 text-white/60">Answers first · hands off when unsure.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 transition hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}