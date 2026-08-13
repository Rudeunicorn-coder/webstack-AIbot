"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LoaderCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { webstackpro } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { WebStackProLogo, WebStackProWordmark } from "@/components/layout/webstackpro-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Already signed in on WebStackPro? Go to the dashboard.
    if (localStorage.getItem("webstackpro_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function exchangeSession(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
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
  }

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error("WebStackPro: Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message || "WebStackPro: unable to sign in");
      await exchangeSession(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WebStackPro sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    try {
      if (!supabase) {
        throw new Error("WebStackPro: Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      void data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "WebStackPro Google login failed");
    }
  }

  // Handle OAuth redirect back into the app.
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(async ({ data }) => {
      const { session } = data;
      if (session?.user && !localStorage.getItem("webstackpro_token")) {
        await exchangeSession(session.user);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="webstackpro-navy-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-cyan"
        >
          <ArrowLeft className="h-4 w-4" /> Back to WebStackPro
        </Link>

        <Card className="border-white/10 bg-white shadow-glow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <WebStackProLogo size={56} />
              <WebStackProWordmark className="mt-4" />
              <h1 className="mt-6 font-display text-2xl font-extrabold text-navy">Login to WebStackPro</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Automate. Convert. Grow. — your unified inbox awaits.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">WebStackPro Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@business.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                By logging in you agree to our{" "}
                <Link href="/terms" className="font-semibold text-cyan-dark hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold text-cyan-dark hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <Button type="submit" variant="navy" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Signing into WebStackPro...
                  </>
                ) : (
                  "Login to WebStackPro"
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              Sign in with Google
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="font-semibold text-cyan-dark hover:underline">
                Start your free WebStackPro trial
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}