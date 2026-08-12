"use client";

import { create } from "zustand";
import {
  WebStackProBusiness,
  WebStackProConversation,
  InboxFilter,
} from "./types";

/**
 * WebStackPro Global Store (Zustand)
 * Holds the unified inbox state for the WebStackPro Dashboard.
 */

interface WebStackProStore {
  business: WebStackProBusiness | null;
  conversations: WebStackProConversation[];
  activeConversationId: string | null;
  filter: InboxFilter;
  search: string;
  socketToken: string | null;
  socketConnected: boolean;
  toasts: { id: number; text: string; channel: string }[];

  setBusiness: (b: WebStackProBusiness | null) => void;
  setConversations: (c: WebStackProConversation[]) => void;
  setActive: (id: string | null) => void;
  setFilter: (f: InboxFilter) => void;
  setSearch: (s: string) => void;
  setSocketToken: (t: string | null) => void;
  setSocketConnected: (v: boolean) => void;
  pushToast: (text: string, channel: string) => void;
  dismissToast: (id: number) => void;

  upsertConversation: (c: WebStackProConversation) => void;
  appendMessage: (conversationId: string, message: WebStackProConversation["messages"] extends (infer M)[] | undefined ? M : never) => void;
  markRead: (id: string) => void;
}

let toastId = 0;

export const useWebStackPro = create<WebStackProStore>((set, get) => ({
  business: null,
  conversations: [],
  activeConversationId: null,
  filter: "all",
  search: "",
  socketToken: null,
  socketConnected: false,
  toasts: [],

  setBusiness: (business) => set({ business }),
  setConversations: (conversations) => set({ conversations }),
  setActive: (activeConversationId) => set({ activeConversationId }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setSocketToken: (socketToken) => set({ socketToken }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),

  pushToast: (text, channel) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, text, channel }] }));
    setTimeout(() => get().dismissToast(id), 6000);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  upsertConversation: (incoming) =>
    set((s) => {
      const exists = s.conversations.some((c) => c.id === incoming.id);
      const list = exists
        ? s.conversations.map((c) => (c.id === incoming.id ? { ...c, ...incoming } : c))
        : [incoming, ...s.conversations];
      return { conversations: list };
    }),

  appendMessage: (conversationId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              preview: message.text,
              lastMessageAt: new Date().toISOString(),
              messages: [...(c.messages || []), message],
            }
          : c
      ),
    })),

  markRead: (id) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: false } : c)),
    })),
}));