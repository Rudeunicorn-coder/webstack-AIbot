"use client";

import { useState } from "react";
import {
  UserRound,
  Phone,
  Mail,
  Tag,
  StickyNote,
  Users,
  Zap,
  Check,
  Pencil,
  X,
  Plus,
  Trash2,
} from "lucide-react";
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
  WebStackProContact,
} from "@/lib/types";
import { useWebStackPro } from "@/lib/store";

/**
 * WebStackPro Right Rail
 * Contact details (editable), tags, notes, assign agent + "Take Over for WebStackPro".
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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [showTagCreate, setShowTagCreate] = useState(false);
  const upsertConversation = useWebStackPro((s) => s.upsertConversation);

  const contact = conversation.contact;
  const meta = CHANNEL_META[conversation.channel] || CHANNEL_META.web;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function updateContact(c: WebStackProContact) {
    upsertConversation({ ...conversation, contact: c });
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

  function startEdit() {
    if (!contact) return;
    setName(contact.name || "");
    setPhone(contact.phone || "");
    setEmail(contact.email || "");
    setEditing(true);
  }

  async function saveContact() {
    if (!contact) return;
    try {
      const res = await webstackpro.patch<{ contact: WebStackProContact }>(
        `/contacts/${contact.id}`,
        { name, phone, email }
      );
      updateContact(res.contact);
      setEditing(false);
      flash("WebStackPro contact updated");
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro update failed");
    }
  }

  async function assignTag(tagId: string) {
    if (!contact) return;
    if (contact.tags?.some((t) => t.id === tagId)) return;
    try {
      const res = await webstackpro.post<{ contact: WebStackProContact }>(
        `/contacts/${contact.id}/tags`,
        { tagId }
      );
      updateContact(res.contact);
      flash("WebStackPro tag added");
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro tag failed");
    }
  }

  async function removeTag(tagId: string) {
    if (!contact) return;
    try {
      const res = await webstackpro.del<{ contact: WebStackProContact }>(
        `/contacts/${contact.id}/tags/${tagId}`
      );
      updateContact(res.contact);
      flash("WebStackPro tag removed");
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro tag failed");
    }
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const res = await webstackpro.post<{ tag: WebStackProTag }>("/settings/tags", { name });
      await assignTag(res.tag.id);
      setNewTagName("");
      setShowTagCreate(false);
      flash(`WebStackPro tag "${name}" created`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "WebStackPro tag failed");
    }
  }

  return (
    <div className="hidden h-full w-80 shrink-0 flex-col border-l border-border bg-white xl:flex">
      <div className="flex-1 overflow-y-auto">
        {/* Contact card */}
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={contact?.name || "Customer"} className="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-navy">{contact?.name || "Customer"}</p>
              <p className="text-xs text-muted-foreground">Customer on {meta.label}</p>
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-navy"
                aria-label="Edit contact"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-9 text-sm" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-9 text-sm" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="h-9 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" variant="navy" className="flex-1" onClick={saveContact}>
                  <Check className="h-4 w-4" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Status + Take Over */}
        <div className="space-y-2 border-b border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            WebStackPro Agent Status
          </p>
          <div className="flex items-center gap-2">
            {conversation.status === "resolved" ? (
              <Badge variant="muted">RESOLVED</Badge>
            ) : conversation.status === "ai" ? (
              <Badge variant="ai">WEBSTACKPRO AI IS ACTIVE</Badge>
            ) : (
              <Badge variant="human">HUMAN: {conversation.assignedTo || "AGENT"}</Badge>
            )}
          </div>
          <Button
            variant="cyan"
            className="w-full"
            onClick={takeOver}
            disabled={conversation.status === "human" || conversation.status === "resolved"}
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tags</p>
            <button
              onClick={() => setShowTagCreate((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition hover:border-cyan/60 hover:text-navy"
            >
              <Plus className="h-3 w-3" /> New tag
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(contact?.tags?.length ? contact.tags : []).map((t: WebStackProTag) => (
              <span
                key={t.id}
                className="group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: t.color || "#00D4FF" }}
              >
                <Tag className="h-3 w-3" /> {t.name}
                <button
                  onClick={() => removeTag(t.id)}
                  className="ml-0.5 rounded-full p-0.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label={`Remove ${t.name} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!contact?.tags?.length && (
              <span className="text-xs text-muted-foreground">No WebStackPro tags yet.</span>
            )}
          </div>

          {showTagCreate && (
            <div className="mt-2 flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTag()}
                placeholder="Tag name (e.g. VIP, Follow up)"
                className="h-9 text-xs"
              />
              <Button size="sm" variant="cyan" onClick={createTag} disabled={!newTagName.trim()}>
                Add
              </Button>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assign existing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags
                  .filter((t) => !contact?.tags?.some((ct) => ct.id === t.id))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => assignTag(t.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:border-cyan/60 hover:text-navy"
                    >
                      <Tag className="h-3 w-3" style={{ color: t.color }} /> {t.name}
                    </button>
                  ))}
                {tags.length > 0 && tags.every((t) => contact?.tags?.some((ct) => ct.id === t.id)) && (
                  <span className="text-[11px] text-muted-foreground">All tags assigned.</span>
                )}
              </div>
            </div>
          )}
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