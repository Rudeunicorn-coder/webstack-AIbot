"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { WebStackProSidebar } from "@/components/dashboard/sidebar";
import { useWebStackPro } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { webstackpro } from "@/lib/api";

/**
 * WebStackPro Dashboard Layout
 * Guards the route with a WebStackPro session and renders the navy sidebar shell.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setBusiness = useWebStackPro((s) => s.setBusiness);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function syncSession() {
      const token = localStorage.getItem("webstackpro_token");
      if (token) {
        setChecking(false);
        return;
      }
      // Arriving from an email confirmation link or OAuth redirect: the user has
      // a valid Supabase session but no WebStackPro token yet — exchange it now.
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user) {
          try {
            const res = await webstackpro.post<{ token: string; business: { id: string; name: string; plan: string; planActive: boolean } }>(
              "/auth/exchange",
              {
                ownerId: user.id,
                email: user.email,
                name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "Agent",
              }
            );
            localStorage.setItem("webstackpro_token", res.token);
            localStorage.setItem("webstackpro_business", JSON.stringify(res.business));
            setBusiness(res.business);
            setChecking(false);
            return;
          } catch (_) {
            /* fall through to cached-token guard below */
          }
        }
      }
      const cached = localStorage.getItem("webstackpro_business");
      if (cached) {
        try {
          setBusiness(JSON.parse(cached));
        } catch (_) {
          /* ignore malformed cache */
        }
      }
      setChecking(false);
      if (!localStorage.getItem("webstackpro_token")) {
        router.replace("/login");
      }
    }
    void syncSession();
  }, [router, setBusiness]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <span className="font-display text-lg font-extrabold text-white">
          WebStack<span className="text-cyan">Pro</span>
        </span>
      </div>
    );
  }

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