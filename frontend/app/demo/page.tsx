"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * One-click WebStackPro demo login.
 * Sets a real session token and drops you straight into the live dashboard.
 */
const DEMO_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lcklkIjoiZGVtby1vd25lci13ZWJzdGFja3BybyIsImJ1c2luZXNzSWQiOiJjbXNxZ3Bld3MwMDAwMTN1OWUwZHI4NTJzIiwibmFtZSI6IkRlbW8gQWdlbnQiLCJpYXQiOjE3ODY1NzYyMDEsImV4cCI6MTc4NzE4MTAwMX0.5GyiQfucCAhVLoeOnCFlhm9EANjIUWoVC4ojQupWKlQ";

export default function DemoLoginPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("webstackpro_token", DEMO_TOKEN);
    localStorage.setItem(
      "webstackpro_business",
      JSON.stringify({ id: "cmsqgpews000013u9e0dr852s", name: "Demo WebStackPro Business", plan: "pro", planActive: true })
    );
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="webstackpro-navy-gradient flex min-h-screen items-center justify-center px-4">
      <p className="font-display text-lg font-bold text-cyan">Signing you into WebStackPro demo…</p>
    </main>
  );
}
