"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { WebStackProSidebar } from "@/components/dashboard/sidebar";
import { useWebStackPro } from "@/lib/store";

/**
 * WebStackPro Dashboard Layout
 * Guards the route with a WebStackPro session and renders the navy sidebar shell.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setBusiness = useWebStackPro((s) => s.setBusiness);

  useEffect(() => {
    const token = localStorage.getItem("webstackpro_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const cached = localStorage.getItem("webstackpro_business");
    if (cached) {
      try {
        setBusiness(JSON.parse(cached));
      } catch (_) {
        /* ignore malformed cache */
      }
    }
  }, [router, setBusiness]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WebStackProSidebar />

      {/* Mobile top bar — still branded WebStackPro */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="lg:hidden flex h-14 items-center gap-2.5 border-b border-navy/10 bg-navy px-4 text-white">
          <span className="font-display text-sm font-extrabold">
            WebStack<span className="text-cyan">Pro</span>
          </span>
          <span className="ml-auto text-xs text-white/60">Dashboard</span>
        </header>
        <main key={pathname} className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}