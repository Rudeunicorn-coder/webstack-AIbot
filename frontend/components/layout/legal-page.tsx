import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WebStackProLogo } from "@/components/layout/webstackpro-logo";

/**
 * Shared shell for legal pages (Terms, Privacy).
 * Navy header, readable content column, footer links.
 */
export function WebStackProLegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center gap-2.5 px-4 py-4">
          <Link href="/">
            <WebStackProLogo size={32} />
          </Link>
          <Link href="/" className="font-display text-lg font-extrabold text-navy">
            WebStack<span className="text-cyan-dark">Pro</span>
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-extrabold text-navy">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>

        <div className="prose prose-slate mt-8 max-w-none space-y-8 text-[15px] leading-7">
          {children}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <p>WebStackPro © 2026 | Nigeria</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="font-medium text-navy hover:text-cyan-dark">
              Terms of Service
            </Link>
            <Link href="/privacy" className="font-medium text-navy hover:text-cyan-dark">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
