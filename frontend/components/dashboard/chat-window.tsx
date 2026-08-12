"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon, Headphones, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatTime, CHANNEL_META } from "@/lib/utils";
import { webstackpro } from "@/lib/api";
import { WebStackProConversation, WebStackProMessage } from "@/lib/types";
import { useWebStackPro } from "@/lib/store";

const ROLE_META = {
  user: { label: "Customer", icon: UserIcon },
  ai: { label: "WebStackPro AI", icon: Bot },
  human: { label: "Agent", icon: Headphones },
};

function MessageBubble({ message, conversation }: { message: WebStackProMessage; conversation: WebStackProConversation }) {
  const meta = ROLE_META[message.role] || ROLE_META.ai;
  const isCustomer = message.role === "user";

  return (
    <div className={cn("flex items-end gap-2.5", isCustomer ? "justify-start" : "justify-end")}>
      {!isCustomer && (
        <Avatar
          name={message.role === "ai" ? "WebStackPro AI" : message.role === "human" ? "Human Agent" : "W"}
          color={message.role === "ai" ? "#00A8CC" : "#0A1F44"}
          className="h-8 w-8 text-[10px]"
        />
      )}

      <div className={cn("flex max-w-[75%] flex-col", isCustomer ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            message.role === "user"
              ? "rounded-bl-sm bg-navy text-white"
              : message.role === "ai"
              ? "rounded-br-sm bg-cyan text-navy"
              : "rounded-br-sm bg-blue-600 text-white"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        </div>
        <span className="mt-1 px-1 text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
          {message.role === "ai" && <span className="ml-1 font-semibold text-cyan-dark">· Powered by WebStackPro AI</span>}
        </span>
      </div>

      {isCustomer && (
        <Avatar name={conversation.contact?.name || "Customer"} className="h-8 w-8 text-[10px]" color="#122E63" />
      )}
    </div>
  );
}

/**
 * WebStackPro Central Chat Window
 * Header carries the conversation status badge + "Powered by WebStackPro AI".
 */
export function WebStackProChatWindow({
  conversation,
  conversationId,
}: {
  conversation: WebStackProConversation | null;
  conversationId: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const appendMessage = useWebStackPro((s) => s.appendMessage);
  const setActive = useWebStackPro((s) => s.setActive);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages?.length, conversationId]);

  if (!conversation || !conversationId) {
    return (
      <div className="grid h-full flex-1 place-items-center bg-background">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan/15">
            <Bot className="h-8 w-8 text-cyan-dark" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-navy">Select a WebStackPro conversation</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose a chat on the left to start replying.</p>
        </div>
      </div>
    );
  }

  const channel = conversation.channel;
  const cid = conversationId;
  const meta = CHANNEL_META[channel] || CHANNEL_META.web;
  const messages = conversation.messages || [];

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    const optimistic: WebStackProMessage = {
      id: `local-${Date.now()}`,
      conversationId: cid,
      role: "human",
      text,
      channel,
      createdAt: new Date().toISOString(),
    };
    appendMessage(cid, optimistic);
    setDraft("");

    try {
      await webstackpro.post(`/conversations/${conversationId}/messages`, { text });
    } catch (_) {
      // Keep the local bubble; the server will reconcile on next fetch.
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button className="lg:hidden" onClick={() => setActive(null)} aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-navy" />
        </button>
        <Avatar name={conversation.contact?.name || "Customer"} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-navy">{conversation.contact?.name || "Customer"}</p>
          <p className="text-xs text-muted-foreground">
            via {meta.label}
            {conversation.assignedTo && ` · Assigned to ${conversation.assignedTo}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === "ai" ? (
            <Badge variant="ai">WEBSTACKPRO AI</Badge>
          ) : (
            <Badge variant="human">HUMAN: {conversation.assignedTo || "AGENT"}</Badge>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} conversation={conversation} />
        ))}
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No messages in this WebStackPro conversation yet.
          </p>
        )}
      </div>

      {/* Composer */}
      <footer className="border-t border-border bg-white p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              conversation.status === "ai"
                ? "Reply as a human agent... (takes over from WebStackPro AI)"
                : "Reply to customer..."
            }
            className="min-h-[44px] max-h-32 flex-1 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            variant="cyan"
            className="h-11"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Sending as a human agent on WebStackPro · AI replies are labelled automatically
        </p>
      </footer>
    </div>
  );
}