import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * WebStackPro time formatting helper - local 12h time for chat bubbles.
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

/**
 * WebStackPro date formatting helper for conversation lists.
 */
export function formatMessageDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const day = 86400000;

  if (diff < day && now.getDate() === d.getDate()) return formatTime(d);
  if (diff < 7 * day) return d.toLocaleDateString("en-NG", { weekday: "short" });
  return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

/**
 * First letter avatar for a WebStackPro contact.
 */
export function initials(name: string): string {
  return (name || "W")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function naira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const CHANNEL_META: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  instagram: { label: "Instagram", color: "#E1306C" },
  messenger: { label: "Messenger", color: "#0084FF" },
  web: { label: "Website Chat", color: "#00D4FF" },
};