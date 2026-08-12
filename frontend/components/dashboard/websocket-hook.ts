"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, webstackpro } from "@/lib/api";
import { useWebStackPro } from "@/lib/store";

/**
 * WebStackPro Realtime Hook
 * Connects to Socket.io, joins the business room and pushes
 * "New message on WebStackPro" toasts + inbox updates into the store.
 */
export function useWebStackProRealtime() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setSocketConnected,
    pushToast,
    upsertConversation,
    appendMessage,
  } = useWebStackPro.getState();

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const { token, businessId } = await webstackpro.post<{
          token: string;
          businessId: string;
        }>("/websocket-token");

        if (cancelled) return;
        useWebStackPro.setState({ socketToken: token });

        const socket = io(API_URL, {
          auth: { token, businessId },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => setSocketConnected(true));
        socket.on("disconnect", () => setSocketConnected(false));
        socket.on("connect_error", () => setSocketConnected(false));

        socket.on("webstackpro:new-message", (payload) => {
          pushToast(payload.text || "", payload.channel || "web");
          upsertConversation({
            id: payload.conversationId,
            businessId,
            channel: payload.channel || "web",
            status: "ai",
            unread: true,
            lastMessageAt: new Date().toISOString(),
            preview: payload.text,
            contact: payload.contactName ? { name: payload.contactName } as never : undefined,
          });
        });

        socket.on("webstackpro:handoff", (payload) => {
          appendMessage(payload.conversationId, {
            id: `handoff-${Date.now()}`,
            conversationId: payload.conversationId,
            role: "ai",
            text: "No wahala, let me get my WebStackPro manager for you",
            channel: "web",
            createdAt: new Date().toISOString(),
          });
          pushToast("WebStackPro needs human help", "web");
        });
      } catch (_) {
        // Backend offline or not configured — dashboard still shows cached/served data.
      }
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}