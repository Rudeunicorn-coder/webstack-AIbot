"use client";

import Link from "next/link";
import Script from "next/script";
import {
  Bot,
  Inbox,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  Globe,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebStackProNav } from "@/components/layout/navbar";
import { WebStackProLogo } from "@/components/layout/webstackpro-logo";
import { naira } from "@/lib/utils";

const CHANNELS = [
  { icon: MessageCircle, name: "WhatsApp", desc: "Replies to every WhatsApp message, night and day." },
  { icon: Instagram, name: "Instagram DM", desc: "Catches DM enquiries before they go cold." },
  { icon: MessageSquare, name: "Messenger", desc: "Facebook Messenger handled automatically." },
  { icon: Globe, name: "Website Chat", desc: "Floating widget that answers on your site." },
];

const FEATURES = [
  {
    icon: Bot,
    title: "24/7 WebStackPro AI Agent",
    desc: "GPT-powered agent trained on your business knowledge. Answers first, fast, in a friendly Nigerian tone.",
  },
  {
    icon: Inbox,
    title: "One Unified Inbox",
    desc: "WhatsApp, Instagram, Messenger and Website chats all land in one WebStackPro dashboard.",
  },
  {
    icon: Sparkles,
    title: "Smart Human Hand-off",
    desc: "AI answers confidently or hands off to your team. A green WebStackPro AI badge tells you who's talking.",
  },
  {
    icon: Zap,
    title: "Real-time Notifications",
    desc: "New message toasts stream live into your WebStackPro dashboard via Socket.io.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Billing via Paystack",
    desc: "Subscribe to WebStackPro with Paystack. 14-day free trial, then fair month rates.",
  },
  {
    icon: Check,
    title: "Train Your AI",
    desc: "Upload your PDFs and notes; WebStackPro AI learns your business and answers accurately.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your WebStackPro account",
    desc: "Sign up free, get a 14-day trial with your WebStackPro branded workspace.",
  },
  {
    n: "02",
    title: "Connect your channels",
    desc: "One click to connect WhatsApp, Instagram, Messenger and your website widget.",
  },
  {
    n: "03",
    title: "Train the WebStackPro AI",
    desc: "Drop in your prices, policies and FAQs. WebStackPro AI learns on day one.",
  },
  {
    n: "04",
    title: "Watch WebStackPro work",
    desc: "AI replies instantly; you take over when needed. Never miss a customer again.",
  },
];

const PLANS = [
  { name: "Free Trial", price: "Free", period: "14 days", desc: "Explore WebStackPro AI", cta: "Start Free WebStackPro Trial", features: ["AI answers on 1 channel", "Unified inbox", "Website widget"] },
  { name: "Starter", price: naira(50000), period: "/month", desc: "For growing businesses", cta: "Subscribe to WebStackPro", featured: false, features: ["AI on all channels", "Knowledge base (100 pages)", "2 team agents", "Realtime inbox"] },
  { name: "Pro", price: naira(120000), period: "/month", desc: "For busy teams", cta: "Subscribe to WebStackPro", featured: true, features: ["Everything in Starter", "Unlimited knowledge base", "10 team agents", "Priority AI speed", "Analytics + exports"] },
];

export default function LandingPage() {
  return (
    <main className="bg-background">
      <WebStackProNav />

      {/* ===================== HERO ===================== */}
      <section id="hero" className="webstackpro-navy-gradient relative overflow-hidden pt-28 pb-20 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />

        <div className="container relative mx-auto grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              WebStackPro AI Agent · Built for Nigerian businesses
            </span>
            <h1 className="font-display mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              WebStackPro — <span className="webstackpro-gradient">Never Miss A Customer Message Again</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              WebStackPro installs a 24/7 AI Agent on your WhatsApp, Instagram, and
              Website. Built for Nigerian businesses. One inbox, smart replies, human
              hand-off when it matters.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="cyan" className="h-auto min-h-12 w-full whitespace-normal px-5 py-3 text-base sm:w-auto sm:px-8">
                  Start Your Free WebStackPro Trial
                </Button>
              </Link>
              <Link href="#how" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto min-h-12 w-full whitespace-normal border-white/30 bg-transparent px-5 py-3 text-base text-white hover:bg-cyan/10 hover:text-white sm:w-auto sm:px-8"
                >
                  See how it works
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/70">
              {["14-day free trial", "No card required", "Paystack secure"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-cyan" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero dashboard mock */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-white/15 bg-navy/70 p-4 shadow-glow-lg backdrop-blur">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-navy px-3 py-2">
                <span className="text-sm font-semibold text-white">WebStackPro Dashboard</span>
                <span className="flex items-center gap-1.5 text-xs text-cyan">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" /> LIVE
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-white/95 p-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <WebStackProLogo size={30} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">Adaeze from WhatsApp</p>
                      <p className="text-xs text-gray-500">Nna, how much for the Samsung phone? I saw it!</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      WEBSTACKPRO AI
                    </span>
                  </div>
                </div>
                <div className="ml-6 rounded-xl rounded-tl-sm bg-cyan p-3 text-navy shadow-sm">
                  <p className="text-sm font-medium">
                    Good morning Adaeze! The Samsung goes for ₦820,000. We deliver within 24-48 hours. Ready to order?
                  </p>
                  <p className="mt-1 text-right text-[10px] font-semibold text-navy/60">Powered by WebStackPro AI</p>
                </div>
                <div className="rounded-xl bg-white/95 p-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <WebStackProLogo size={30} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">Ngozi from Messenger</p>
                      <p className="text-xs text-gray-500">I need it today. Can I speak to someone?</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      HUMAN: CHIOMA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CHANNELS ===================== */}
      <section className="relative z-10 mx-auto -mt-10 grid max-w-[1400px] gap-4 px-6 md:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map((c) => (
          <Card key={c.name} className="border border-border bg-white shadow-lg">
            <CardContent className="flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan/15 text-cyan-dark">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <h3 className="text-sm font-bold text-navy">{c.name}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="container mx-auto py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-dark">WebStackPro Features</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-navy md:text-4xl">
            Everything you need to Automate, Convert and Grow
          </h2>
          <p className="mt-4 text-muted-foreground">
            One platform. Every channel. Your own AI that never sleeps.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group border-border bg-white transition hover:border-cyan/60 hover:shadow-glow">
              <CardContent className="p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy text-cyan transition group-hover:bg-cyan group-hover:text-navy">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how" className="webstackpro-navy-gradient py-20 text-white">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan">How WebStackPro Works</span>
            <h2 className="font-display mt-3 text-3xl font-extrabold md:text-4xl">Up and running in minutes</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="font-display text-4xl font-extrabold text-cyan">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="plans" className="container mx-auto py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-dark">WebStackPro Plans</span>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-navy md:text-4xl">
            Simple pricing. Powerful WebStackPro AI.
          </h2>
          <p className="mt-4 text-muted-foreground">Billed securely through Paystack. Cancel anytime.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.name}
              className={`relative bg-white ${
                p.featured ? "border-cyan shadow-glow" : "border-border"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan px-3 py-1 text-[10px] font-bold text-navy">
                  MOST POPULAR
                </span>
              )}
              <CardContent className="flex flex-col p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-navy">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold text-navy">{p.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-navy">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-dark" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="mt-6">
                  <Button variant={p.featured ? "cyan" : "navy"} className="w-full">
                    {p.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="container mx-auto max-w-3xl pb-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-extrabold text-navy">WebStackPro FAQ</h2>
        </div>
        <div className="mt-8 space-y-4">
          {[
            ["How fast is WebStackPro delivery?", "WebStackPro AI replies instantly. Physical orders from WebStackPro customers get 24-48 hours delivery."],
            ["How does WebStackPro billing work?", "WebStackPro Starter is ₦50,000/month, Pro is ₦120,000/month. Billed via Paystack. New customers get a free 14-day trial."],
            ["Which channels can I connect?", "WhatsApp, Instagram DM, Facebook Messenger and your website via the free WebStackPro widget."],
            ["When does the AI hand off to a human?", "When WebStackPro AI confidence drops below 0.8, the conversation moves to a human agent and your team is notified in real time."],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-border bg-white p-5 open:border-cyan/50 open:shadow-glow">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-navy">
                {q}
                <span className="text-cyan-dark transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="webstackpro-navy-gradient py-16 text-center">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl font-extrabold text-white md:text-4xl">
            Automate. Convert. Grow. with WebStackPro.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Join Nigerian businesses answering every customer instantly. Start your free WebStackPro trial today.
          </p>
          <Link href="/login" className="mt-6 inline-block w-full px-6 sm:w-auto">
            <Button size="lg" variant="cyan" className="h-auto min-h-12 w-full whitespace-normal px-5 py-3 text-base">
              Start Your Free WebStackPro Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-navy/10 bg-white py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <WebStackProLogo size={30} />
            <span className="font-display font-extrabold text-navy">
              WebStack<span className="text-cyan-dark">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/terms" className="text-muted-foreground transition hover:text-navy">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-muted-foreground transition hover:text-navy">
              Privacy Policy
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            WebStackPro © 2026 | Nigeria | A WebStackPro Product
          </p>
        </div>
      </footer>

      <Script
        src="/webstackpro-widget.js"
        data-api={process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}
        data-business="cmsqgpews000013u9e0dr852s"
        strategy="afterInteractive"
        async
      />
    </main>
  );
}