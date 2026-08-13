import Script from "next/script";
import { WebStackProLogo, WebStackProWordmark } from "@/components/layout/webstackpro-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "WebStackPro Widget Demo" };

export default function WidgetDemoPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-navy via-[#0F2A5C] to-navy text-white">
      <Script
        src="https://webstack-a-ibot-frontend.vercel.app/webstackpro-widget.js"
        data-api="https://webstackpro-api.onrender.com"
        data-business="cmsqgpews000013u9e0dr852s"
        strategy="afterInteractive"
        async
      />

      <header className="flex items-center gap-2.5 border-b border-white/10 px-6 py-4">
        <WebStackProLogo size={30} />
        <span className="font-display text-lg font-extrabold">
          WebStack<span className="text-cyan">Pro</span>
        </span>
        <span className="ml-auto rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs text-cyan">
          Customer Demo Site
        </span>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">
          This is what your customers see.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Pretend you are a customer on a business website. Look at the bottom-right
          corner — that floating bubble is the WebStackPro AI chat widget.
        </p>
        <p className="mx-auto mt-4 max-w-xl rounded-xl border border-cyan/40 bg-cyan/10 p-4 text-sm text-cyan">
          Click the <b>bubble in the bottom-right corner</b>, then ask:{" "}
          <b>&quot;What are your business hours?&quot;</b>
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
        {[
          { t: "Website Chat", d: "Customers chat with your AI directly on your site." },
          { t: "WhatsApp", d: "Connect WhatsApp Business and answer in the same inbox." },
          { t: "Unified Inbox", d: "All channels, one list. AI answers, you take over when needed." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
            <h3 className="font-semibold text-cyan">{c.t}</h3>
            <p className="mt-2 text-sm text-white/70">{c.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/50">
        <Link href="/demo" className="text-cyan hover:underline">
          Admin demo →
        </Link>{" "}
        (this is the customer side)
      </footer>
    </main>
  );
}
