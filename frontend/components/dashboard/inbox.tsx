"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Inbox as InboxIcon, Wifi, WifiOff } from "lucide-react";
import { webstackpro } from "@/lib/api";
import { useWebStackPro } from "@/lib/store";
import { useWebStackProRealtime } from "@/components/dashboard/websocket-hook";
import { WebStackProFilterBar, WebStackProConversationList } from "@/components/dashboard/conversation-list";
import { WebStackProChatWindow } from "@/components/dashboard/chat-window";
import { WebStackProContactPanel } from "@/components/dashboard/contact-panel";
import { WebStackProToasts } from "@/components/ui/webstackpro-toast";
import { WebStackProConversation, WebStackProAgent, WebStackProTag } from "@/lib/types";

type InboxResponse = {
  business: { id: string; name: string; plan: string; planActive: boolean };
  conversations: WebStackProConversation[];
};

type DetailResponse = {
  conversation: WebStackProConversation;
  tags: WebStackProTag[];
  agents: WebStackProAgent[];
};

/**
 * WebStackPro Unified Inbox
 * Left: conversation list · Center: chat window · Right: contact panel.
 */
export function WebStackProInbox() {
  useWebStackProRealtime();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ tags: WebStackProTag[]; agents: WebStackProAgent[] }>({
    tags: [],
    agents: [],
  });

  const conversations = useWebStackPro((s) => s.conversations);
  const setConversations = useWebStackPro((s) => s.setConversations);
  const setBusiness = useWebStackPro((s) => s.setBusiness);
  const filter = useWebStackPro((s) => s.filter);
  const activeId = useWebStackPro((s) => s.activeConversationId);
  const setActive = useWebStackPro((s) => s.setActive);
  const toasts = useWebStackPro((s) => s.toasts);
  const dismissToast = useWebStackPro((s) => s.dismissToast);
  const markRead = useWebStackPro((s) => s.markRead);
  const socketConnected = useWebStackPro((s) => s.socketConnected);

  const loadConversations = useCallback(async () => {
    try {
      const res = await webstackpro.get<InboxResponse>("/conversations");
      setBusiness(res.business);
      setConversations(res.conversations);
    } catch (err) {
      console.error("WebStackPro inbox load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [setBusiness, setConversations]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadDetail = useCallback(
    async (id: string) => {
      try {
        const res = await webstackpro.get<DetailResponse>(`/conversations/${id}`);
        setDetail({ tags: res.tags, agents: res.agents });
        useWebStackPro.getState().upsertConversation(res.conversation);
        markRead(id);
      } catch (_) {
        // detail fetch best-effort
      }
    },
    [markRead]
  );

  useEffect(() => {
    if (activeId) loadDetail(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "open":
        return conversations.filter((c) => c.status === "ai" || c.status === "human");
      case "resolved":
        return conversations.filter((c) => c.status === "resolved");
      case "unread":
        return conversations.filter((c) => c.unread && c.status !== "resolved");
      case "ai":
        return conversations.filter((c) => c.status === "ai");
      case "human":
        return conversations.filter((c) => c.status === "human");
      case "whatsapp":
      case "instagram":
      case "messenger":
      case "web":
        return conversations.filter((c) => c.channel === filter && c.status !== "resolved");
      default:
        return conversations;
    }
  }, [conversations, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: conversations.length };
    (["open", "resolved", "unread", "ai", "human", "whatsapp", "instagram", "messenger", "web"] as const).forEach((k) => {
      c[k] = conversations.filter((x) =>
        k === "open"
          ? x.status === "ai" || x.status === "human"
          : k === "resolved"
          ? x.status === "resolved"
          : k === "unread"
          ? x.unread && x.status !== "resolved"
          : k === "ai"
          ? x.status === "ai"
          : k === "human"
          ? x.status === "human"
          : x.channel === k && x.status !== "resolved"
      ).length;
    });
    return c;
  }, [conversations]);

  return (
    <div className="flex h-full flex-col">
      {/* WebStackPro Dashboard header */}
      <header className="flex flex-col gap-3 border-b border-border bg-white px-4 py-3 lg:h-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InboxIcon className="h-5 w-5 text-cyan-dark" />
            <h1 className="font-display text-lg font-extrabold text-navy">
              WebStackPro Dashboard
            </h1>
            {activeConversation?.businessId && (
              <span className="text-sm text-muted-foreground">
                {activeConversation.contact?.name || ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${
                socketConnected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {socketConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5" /> WebStackPro Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" /> Offline
                </>
              )}
            </span>
            <span className="hidden rounded-full bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan-dark md:inline">
              {conversations.length} conversations
            </span>
          </div>
        </div>
        <div className="lg:hidden">
          <WebStackProFilterBar counts={counts} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: list + filters (desktop) */}
        <section className="flex w-full max-w-sm flex-col border-r border-border bg-muted/30 lg:flex">
          <div className="hidden lg:block">
            <WebStackProFilterBar counts={counts} />
          </div>
          <WebStackProConversationList conversations={filtered} loading={loading} />
        </section>

        {/* Center: chat */}
        <section className="hidden min-w-0 flex-1 flex-col lg:flex">
          <WebStackProChatWindow
            conversation={activeConversation}
            conversationId={activeId}
          />
        </section>

        {/* Right: contact panel */}
        {activeConversation && (
          <WebStackProContactPanel conversation={activeConversation} {...detail} />
        )}

        {/* Mobile: single chat view */}
        <section className="flex min-w-0 flex-1 flex-col lg:hidden">
          <WebStackProChatWindow conversation={activeConversation} conversationId={activeId} />
        </section>
      </div>

      <WebStackProToasts
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}