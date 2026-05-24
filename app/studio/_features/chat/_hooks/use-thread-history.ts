"use client";

import { useState, useCallback, useRef } from "react";
import type { Client, Thread } from "@langchain/langgraph-sdk";

import type { ThreadSummary } from "@/app/studio/_features/chat/_types/chat";
import { modeFromThread } from "@/app/studio/_features/chat/_lib/thread-mode";

const PAGE_SIZE = 20;

interface RawMessage {
  type?: string;
  content?: string | Array<{ type: string; text?: string }>;
}

function extractFirstHumanText(values: Record<string, unknown>): string | null {
  const messages = values?.messages;
  if (!Array.isArray(messages)) return null;

  for (const msg of messages as RawMessage[]) {
    if (msg.type !== "human") continue;
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      const text = msg.content
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text!)
        .join("");
      if (text) return text;
    }
  }
  return null;
}

function toThreadSummary(thread: Thread): ThreadSummary {
  const threadId = thread.thread_id;
  const values = (thread.values ?? {}) as Record<string, unknown>;
  const firstMsg = extractFirstHumanText(values);
  const title = firstMsg
    ? firstMsg.length > 100 ? firstMsg.slice(0, 100) + "..." : firstMsg
    : "Untitled conversation";
  const updatedAt = new Date(thread.updated_at);

  return { threadId, title, updatedAt, mode: modeFromThread(thread) };
}

export function useThreadHistory(client: Client, isReady: boolean) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const fetchIdRef = useRef(0);

  const fetchThreads = useCallback(async (offset: number, append: boolean) => {
    if (!isReady) return;
    const id = ++fetchIdRef.current;
    setIsLoading(true);

    try {
      const results = await client.threads.search({
        limit: PAGE_SIZE,
        offset,
      });

      if (id !== fetchIdRef.current) return;

      const summaries = results.map(toThreadSummary);
      summaries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setThreads((prev) => append ? [...prev, ...summaries] : summaries);
      setHasMore(summaries.length === PAGE_SIZE);
      offsetRef.current = offset + summaries.length;
    } finally {
      if (id === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [client, isReady]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    return fetchThreads(0, false);
  }, [fetchThreads]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    return fetchThreads(offsetRef.current, true);
  }, [fetchThreads, hasMore, isLoading]);

  const deleteThread = useCallback(async (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.threadId !== threadId));
    await client.threads.delete(threadId);
  }, [client]);

  return { threads, isLoading, hasMore, refresh, loadMore, deleteThread };
}
