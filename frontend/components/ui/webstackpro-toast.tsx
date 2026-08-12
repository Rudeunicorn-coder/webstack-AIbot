import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WebStackPro toast stack - realtime "New message on WebStackPro" notifications.
 */

export interface WebStackProToastItem {
  id: number;
  text: string;
  channel: string;
}

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: "💬",
  instagram: "📸",
  messenger: "💙",
  web: "🌐",
};

export function WebStackProToasts({
  toasts,
  onDismiss,
}: {
  toasts: WebStackProToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-cyan/40 bg-navy p-3 text-left text-white shadow-glow"
          onClick={() => onDismiss(t.id)}
          aria-live="assertive"
        >
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan/20 text-lg">
            {CHANNEL_ICON[t.channel] || "🔔"}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-cyan">New message on WebStackPro</span>
            <span className="block truncate text-xs text-white/70">{t.text}</span>
          </span>
          <span className="ml-auto text-white/40">×</span>
        </button>
      ))}
    </div>
  );
}

export { cn };