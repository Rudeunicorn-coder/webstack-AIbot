import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "WebStackPro - Never Miss A Customer Message Again",
    template: "%s | WebStackPro",
  },
  description:
    "WebStackPro installs a 24/7 AI Agent on your WhatsApp, Instagram and Website. Built for Nigerian businesses. Automate. Convert. Grow.",
  keywords: ["WebStackPro", "AI Agent", "Unified Inbox", "WhatsApp", "Nigeria"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}