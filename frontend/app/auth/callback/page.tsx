"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { webstackpro } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Finalizing your WebStackPro account...");

  useEffect(() => {
    async function handle() {
      try {
        if (!supabase) throw new Error("Supabase is not configured.");
        // Supabase has already processed the token and stored the session;
        // grab it and exchange it for a WebStackPro JWT.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user;
        if (!user) {
          setStatus("Your confirmation link is invalid or expired. Please sign in.");
          return;
        }
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
        router.replace("/dashboard");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Unable to confirm your account.");
      }
    }
    void handle();
  }, [router]);

  return (
    <main className="webstackpro-navy-gradient flex min-h-screen items-center justify-center px-4">
      <div className="text-center text-white">
        <span className="font-display text-2xl font-extrabold">
          WebStack<span className="text-cyan">Pro</span>
        </span>
        <p className="mt-3 text-sm text-white/70">{status}</p>
      </div>
    </main>
  );
}
