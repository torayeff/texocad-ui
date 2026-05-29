"use client";

import { useState, useCallback, useRef } from "react";
import type { Client, Thread } from "@langchain/langgraph-sdk";

import type { ThreadSummary } from "@/app/studio/_features/chat/_types/chat";
import {
  defaultThreadTitle,
  modeFromThread,
  normalizeThreadTitle,
  THREAD_TITLE_METADATA_KEY,
  titleFromThreadMetadata,
} from "@/app/studio/_features/chat/_lib/thread-metadata";

const PAGE_SIZE = 20;
const HISTORY_SELECT_FIELDS = ["thread_id", "metadata", "updated_at"] as const;

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
  const fallbackTitle = extractFirstHumanText(values);
  const title = titleFromThreadMetadata(thread)
    ?? (fallbackTitle ? normalizeThreadTitle(fallbackTitle) : null)
    ?? defaultThreadTitle(threadId);
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
        sortBy: "updated_at",
        sortOrder: "desc",
        select: [...HISTORY_SELECT_FIELDS],
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
    const deletedThread = threads.find((thread) => thread.threadId === threadId) ?? null;
    setThreads((prev) => prev.filter((thread) => thread.threadId !== threadId));

    try {
      await client.threads.delete(threadId);
    } catch (err) {
      if (deletedThread) {
        setThreads((prev) => {
          if (prev.some((thread) => thread.threadId === threadId)) return prev;
          const restoredThreads = [...prev, deletedThread];
          restoredThreads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          return restoredThreads;
        });
      }
      throw err;
    }
  }, [client, threads]);

  const renameThread = useCallback(async (threadId: string, title: string) => {
    const nextTitle = normalizeThreadTitle(title);
    if (!nextTitle) return;

    const previousTitle = threads.find((thread) => thread.threadId === threadId)?.title ?? null;
    setThreads((prev) => prev.map((thread) => {
      if (thread.threadId !== threadId) return thread;
      return { ...thread, title: nextTitle };
    }));

    try {
      await client.threads.update(threadId, {
        metadata: { [THREAD_TITLE_METADATA_KEY]: nextTitle },
      });
    } catch (err) {
      if (previousTitle) {
        setThreads((prev) => prev.map((thread) => (
          thread.threadId === threadId ? { ...thread, title: previousTitle } : thread
        )));
      }
      throw err;
    }
  }, [client, threads]);

  return { threads, isLoading, hasMore, refresh, loadMore, deleteThread, renameThread };
}
