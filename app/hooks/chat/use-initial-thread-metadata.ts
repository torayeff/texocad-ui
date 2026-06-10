"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Client } from "@langchain/langgraph-sdk";

import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import {
  THREAD_AGENT_MODE_METADATA_KEY,
  normalizeThreadTitle,
  THREAD_TITLE_METADATA_KEY,
} from "@/app/lib/chat/thread-metadata";

interface PendingInitialThreadMetadata {
  mode: AssistantId;
  title: string;
}

export function useInitialThreadMetadata(client: Client, isReady: boolean, threadId: string | null) {
  const pendingMetadataRef = useRef<PendingInitialThreadMetadata | null>(null);

  useEffect(() => {
    const metadata = pendingMetadataRef.current;
    if (!isReady || !threadId || !metadata) return;

    void client.threads.update(threadId, {
      metadata: {
        [THREAD_AGENT_MODE_METADATA_KEY]: metadata.mode,
        [THREAD_TITLE_METADATA_KEY]: metadata.title,
      },
    }).then(() => {
      if (pendingMetadataRef.current === metadata) {
        pendingMetadataRef.current = null;
      }
    }).catch((err) => {
      console.error("Failed to store thread metadata:", err);
    });
  }, [client, isReady, threadId]);

  return useCallback((content: string, mode: AssistantId, existingThreadId: string | null) => {
    const title = existingThreadId ? null : normalizeThreadTitle(content);
    pendingMetadataRef.current = title ? { mode, title } : null;

    return title
      ? {
        [THREAD_AGENT_MODE_METADATA_KEY]: mode,
        [THREAD_TITLE_METADATA_KEY]: title,
      }
      : {
        [THREAD_AGENT_MODE_METADATA_KEY]: mode,
      };
  }, []);
}
