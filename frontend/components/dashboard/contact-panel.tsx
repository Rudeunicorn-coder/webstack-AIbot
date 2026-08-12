"use client";

import { useState } from "react";
import { UserRound, Phone, Mail, Tag, StickyNote, Users, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { cn, CHANNEL_META } from "@/lib/utils";
import { webstackpro } from "@/lib/api";
import {
  WebStackProConversation,
  WebStackProAgent,
  WebStackProTag,
} from "@/lib/types";
import { useWebStackPro } from "@/lib/store";

/**
 * WebStackPro Right Rail
 * Contact details, tags, notes, assign agent + "Take Over for WebStackPro".
 */
export function WebStackProContactPanel({
  conversation,
  tags,
  agents,
}: {
  conversation: WebStackProConversation;
  tags: WebStackProTag[];
  agents: WebStackProAgent[];
}) {
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState("");
  const upsertConversation = useWebStackPro((s) => s.upsertConversation);

  const contact = conversation.contact;
  const meta = CHANNEL_META[conversation.channel] || CHANNEL_META.web;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function takeOver() {
    try {
      const res = await webstackpro.post<{ conversation: WebStackProConversation }>(
        `/conversations/${conversation.id}/takeover`
      );
      upsertConversation(res.conversation);
      flash("You took over for WebStackPro");
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro takeover failed");
    }
  }

  async function assign(agentId: string) {
    try {
      const res = await webstackpro.post<{ conversation: WebStackProConversation }>(
        `/conversations/${conversation.id}/assign`,
        { agentId }
      );
      upsertConversation(res.conversation);
      flash("Conversation assigned");
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro assign failed");
    }
  }

  async function saveNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await webstackpro.post(`/conversations/${conversation.id}/note`, { body: note });
      setNote("");
      flash("WebStackPro note saved");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="hidden h-full w-80 shrink-0 flex-col border-l border-border bg-white xl:flex">
      <div className="flex-1 overflow-y-auto">
        {/* Contact card */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={contact?.name || "Customer"} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-bold text-navy">{contact?.name || "Customer"}</p>
              <p className="text-xs text-muted-foreground">Customer on {meta.label}</p>
            </div>
            <span
              className="ml-auto h-6 w-6 shrink-0 rounded-full"
              style={{ backgroundColor: meta.color }}
              title={meta.label}
            />
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {contact?.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-cyan-dark" /> {contact.phone}
              </p>
            )}
            {contact?.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-cyan-dark" /> {contact.email}
              </p>
            )}
            <p className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-cyan-dark" />
              Customer ID: {contact?.id?.slice(0, 8) || "—"}
            </p>
          </div>
        </div>

        {/* Status + Take Over */}
        <div className="space-y-2 border-b border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            WebStackPro Agent Status
          </p>
          <div className="flex items-center gap-2">
            {conversation.status === "ai" ? (
              <Badge variant="ai">WEBSTACKPRO AI IS ACTIVE</Badge>
            ) : (
              <Badge variant="human">HUMAN: {conversation.assignedTo || "AGENT"}</Badge>
            )}
          </div>
          <Button
            variant="cyan"
            className="w-full"
            onClick={takeOver}
            disabled={conversation.status === "human"}
          >
            <Zap className="h-4 w-4" />
            {conversation.status === "human" ? "Taken Over for WebStackPro" : "Take Over for WebStackPro"}
          </Button>
          {toast && (
            <p className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3.5 w-3.5" /> {toast}
            </p>
          )}
        </div>

        {/* Assign agent */}
        <div className="border-b border-border p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Assign Agent
          </p>
          <div className="flex flex-wrap gap-1.5">
            {agents.length === 0 && (
              <p className="text-xs text-muted-foreground">Add agents in WebStackPro Settings.</p>
            )}
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => assign(a.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                  conversation.assignedTo === a.name
                    ? "border-cyan bg-cyan/15 text-navy"
                    : "border-border text-muted-foreground hover:border-cyan/60 hover:text-navy"
                )}
              >
                <Users className="h-3 w-3" />
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="border-b border-border p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(contact?.tags?.length ? contact.tags : []).map((t: WebStackProTag) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: t.color || "#00D4FF" }}
              >
                <Tag className="h-3 w-3" /> {t.name}
              </span>
            ))}
            {!contact?.tags?.length && (
              <span className="text-xs text-muted-foreground">No WebStackPro tags yet.</span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Notes ({conversation.notes?.length || 0})
          </p>
          <div className="space-y-2">
            {conversation.notes?.map((n) => (
              <div key={n.id} className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
                <p className="text-navy">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {n.author} · {formatNoteDate(n.createdAt)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Textarea
              placeholder="Add a WebStackPro note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[70px] text-xs"
            />
            <Button
              size="sm"
              variant="navy"
              className="mt-2 w-full"
              onClick={saveNote}
              disabled={savingNote || !note.trim()}
            >
              <StickyNote className="h-4 w-4" /> Save note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNoteDate(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}