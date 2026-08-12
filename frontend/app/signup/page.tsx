"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, LoaderCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { webstackpro } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { WebStackProLogo, WebStackProWordmark } from "@/components/layout/webstackpro-logo";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needConfirm, setNeedConfirm] = useState(false);

  async function finishSignup(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
    const res = await webstackpro.post<{ token: string; business: { id: string; name: string; plan: string; planActive: boolean } }>(
      "/auth/exchange",
      {
        ownerId: user.id,
        email: user.email,
        name: fullName.trim() || "My WebStackPro Business",
      }
    );
    localStorage.setItem("webstackpro_token", res.token);
    localStorage.setItem("webstackpro_business", JSON.stringify(res.business));
    router.replace("/dashboard");
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error("WebStackPro: Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }
      if (password.length < 6) {
        throw new Error("WebStackPro: password must be at least 6 characters");
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() || "Owner" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("WebStackPro: unable to create account");

      // If email confirmation is on, tell the user to check their inbox.
      if (data.session === null) {
        setNeedConfirm(true);
        setLoading(false);
        return;
      }
      await finishSignup(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WebStackPro sign up failed");
      setLoading(false);
    }
  }

  return (
    <main className="webstackpro-navy-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-cyan">
          <ArrowLeft className="h-4 w-4" /> Back to WebStackPro
        </Link>

        <Card className="border-white/10 bg-white shadow-glow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <WebStackProLogo size={56} />
              <WebStackProWordmark className="mt-4" />
              <h1 className="mt-6 font-display text-2xl font-extrabold text-navy">Create your WebStackPro account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your free 14-day trial — no card required.
              </p>
            </div>

            {needConfirm && (
              <div className="mt-6 rounded-lg border border-cyan/40 bg-cyan/10 p-3 text-sm text-navy">
                Almost done! We sent a confirmation link to <b>{email}</b>. Click it, then sign in.
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Business / Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="E.g. Chioma's Boutique"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
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
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit" variant="navy" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Creating your WebStackPro account...
                  </>
                ) : (
                  "Start my free WebStackPro trial"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-cyan-dark hover:underline">
                Login to WebStackPro
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
