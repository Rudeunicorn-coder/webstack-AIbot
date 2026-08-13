"use client";

import { Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, CHANNEL_META, formatMessageDate } from "@/lib/utils";
import { WebStackProConversation, InboxFilter } from "@/lib/types";
import { useWebStackPro } from "@/lib/store";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "unread", label: "Unread" },
  { key: "ai", label: "AI" },
  { key: "human", label: "Human" },
  { key: "resolved", label: "Resolved" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "IG" },
  { key: "messenger", label: "Messenger" },
  { key: "web", label: "Web" },
];

const AVATAR_COLORS = ["#0A1F44", "#00A8CC", "#1B3F85", "#122E63", "#00D4FF"];

function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/**
 * WebStackPro Filter Bar — All / Unread / AI / Human / channels
 */
export function WebStackProFilterBar({ counts }: { counts: Record<string, number> }) {
  const filter = useWebStackPro((s) => s.filter);
  const setFilter = useWebStackPro((s) => s.setFilter);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      {FILTERS.map((f) => {
        const active = filter === f.key;
        const count = counts[f.key] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-cyan bg-cyan text-navy shadow-glow"
                : "border-border bg-white text-muted-foreground hover:border-cyan/50 hover:text-navy"
            )}
          >
            {f.label}
            {count > 0 && (
              <span
                className={cn(
                  "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-navy text-white" : "bg-cyan/20 text-cyan-dark"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * WebStackPro Conversation List — left rail of the Unified Inbox.
 */
export function WebStackProConversationList({
  conversations,
  loading,
}: {
  conversations: WebStackProConversation[];
  loading: boolean;
}) {
  const activeId = useWebStackPro((s) => s.activeConversationId);
  const setActive = useWebStackPro((s) => s.setActive);
  const search = useWebStackPro((s) => s.search);
  const setSearch = useWebStackPro((s) => s.setSearch);
  const filter = useWebStackPro((s) => s.filter);

  const filtered = conversations.filter((c) => {
    const name = (c.contact?.name || "Customer").toLowerCase();
    const preview = (c.preview || "").toLowerCase();
    return name.includes(search.toLowerCase()) || preview.includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search WebStackPro conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading && (
          <div className="space-y-2 px-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-8 flex flex-col items-center px-4 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-cyan/60" />
            <p className="text-sm font-bold text-navy">
              {filter === "resolved" ? "No resolved conversations" : "Your inbox is ready"}
            </p>
            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
              {filter === "resolved"
                ? "Conversations you resolve will be archived here."
                : "Incoming WhatsApp, Instagram, Messenger and web chats land here. Get started in 2 steps:"}
            </p>
            {filter !== "resolved" && (
              <div className="mt-4 w-full space-y-2 text-left">
                {[
                  { title: "1. Put the chat widget on your site", body: "Settings → Channels → copy the embed code." },
                  { title: "2. Connect WhatsApp / IG / Messenger", body: "Settings → Channels → paste your Meta tokens." },
                  { title: "3. Try the test simulator", body: "Settings → Test message to watch the AI reply live." },
                ].map((step) => (
                  <div key={step.title} className="rounded-xl border border-border bg-white p-3">
                    <p className="text-xs font-bold text-navy">{step.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{step.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading &&
          filtered.map((c) => {
            const active = activeId === c.id;
            const meta = CHANNEL_META[c.channel] || { label: c.channel, color: "#00D4FF" };
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  useWebStackPro.getState().markRead(c.id);
                }}
                className={cn(
                  "mb-1 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-cyan bg-white shadow-glow"
                    : "border-transparent hover:border-cyan/40 hover:bg-white"
                )}
              >
                <div className="relative">
                  <Avatar name={c.contact?.name || "Customer"} color={avatarColor(c.id)} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: meta.color }}
                    title={meta.label}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-navy">
                      {c.contact?.name || "Customer"}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {formatMessageDate(c.lastMessageAt)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-xs",
                        c.unread ? "font-semibold text-navy" : "text-muted-foreground"
                      )}
                    >
                      {c.preview || "No messages yet"}
                    </p>
                    {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" />}
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5">
                    {c.status === "resolved" ? (
                      <Badge variant="muted" className="text-[9px]">
                        RESOLVED
                      </Badge>
                    ) : c.status === "ai" ? (
                      <Badge variant="ai" className="text-[9px]">
                        WEBSTACKPRO AI
                      </Badge>
                    ) : (
                      <Badge variant="human" className="text-[9px]">
                        HUMAN: {c.assignedTo || "AGENT"}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}