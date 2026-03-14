"use client";

import { useEffect, useRef } from "react";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import type { GeomExportEvent } from "@/app/studio/_types/chat";

const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";

const ASSISTANT_ID = process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID ?? "cad_agent";

interface UseChatOptions {
  threadId?: string | null;
  onThreadIdChange?: (threadId: string | null) => void;
  onCustomEvent?: (data: Record<string, unknown>) => void;
}

export function isGeomExportEvent(data: unknown): data is GeomExportEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as GeomExportEvent).type === "geom_export" &&
    "filename" in data &&
    "thread_id" in data &&
    "url" in data
  );
}

export function useChat(options: UseChatOptions = {}) {
  const {
    threadId: optionThreadId = null,
    onThreadIdChange,
    onCustomEvent,
  } = options;

  const { headers, isReady: isAuthReady } = useLanggraphAuth();

  const onCustomEventRef = useRef(onCustomEvent);
  useEffect(() => {
    onCustomEventRef.current = onCustomEvent;
  }, [onCustomEvent]);

  const onThreadIdChangeRef = useRef(onThreadIdChange);
  useEffect(() => {
    onThreadIdChangeRef.current = onThreadIdChange;
  }, [onThreadIdChange]);

  const stream = useStream({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: ASSISTANT_ID,
    threadId: isAuthReady ? (optionThreadId ?? undefined) : undefined,
    defaultHeaders: headers,
    fetchStateHistory: true,
    onThreadId: (id) => {
      onThreadIdChangeRef.current?.(id);
    },
    onCustomEvent: (event) => {
      const data = event as Record<string, unknown>;
      onCustomEventRef.current?.(data);
    },
  });

  return { stream, isAuthReady };
}
