"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_features/chat/_hooks/use-langgraph-auth";
import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  activeRunMatches,
  clearStoredActiveRun,
  readStoredActiveRun,
  writeStoredActiveRun,
  type ActiveRunRecord,
} from "@/app/studio/_features/chat/_lib/active-run-storage";
import {
  designRevisionsFromMessages,
  isDesignRevisionArtifact,
  isSketchRevisionArtifact,
  latestDesignRevision,
  latestSketchRevision,
  sketchRevisionsFromMessages,
} from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import type { StreamAccessors } from "@/app/studio/_features/chat/_types/chat";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type {
  TexocadGraphState,
  TodoItem,
} from "@/app/studio/_features/chat/_types/chat";

const EMPTY_TODOS: TodoItem[] = [];

interface CreatedRun {
  run_id?: string;
  runId?: string;
  thread_id?: string;
  threadId?: string;
}

interface JoinableStream {
  joinStream?: (runId: string) => unknown;
  stop?: () => void;
}

interface CancellableRunsClient {
  runs?: {
    cancel?: (threadId: string, runId: string) => unknown;
  };
}

interface UseChatStreamEvents {
  onDesignRevisionEvent?: (revision: DesignRevisionArtifact) => void;
  onSketchRevisionEvent?: (revision: SketchRevisionArtifact) => void;
}

export function useChatStream(assistantId: StudioAssistantId, events: UseChatStreamEvents = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onDesignRevisionEventRef = useRef(events.onDesignRevisionEvent);
  const onSketchRevisionEventRef = useRef(events.onSketchRevisionEvent);
  const assistantIdRef = useRef(assistantId);
  const hasJoinedRunRef = useRef<string | null>(null);
  const pendingRunIdRef = useRef<string | null>(null);
  const urlThreadIdRef = useRef(urlThreadId);
  useEffect(() => {
    onDesignRevisionEventRef.current = events.onDesignRevisionEvent;
    onSketchRevisionEventRef.current = events.onSketchRevisionEvent;
  }, [events.onDesignRevisionEvent, events.onSketchRevisionEvent]);

  useEffect(() => {
    assistantIdRef.current = assistantId;
    urlThreadIdRef.current = urlThreadId;
  }, [assistantId, urlThreadId]);

  const clearActiveRun = useCallback((record?: ActiveRunRecord | null) => {
    hasJoinedRunRef.current = null;
    clearStoredActiveRun(record);
  }, []);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextThreadId) {
        params.set("thread_id", nextThreadId);
        if (pendingRunIdRef.current) {
          writeStoredActiveRun({
            assistantId: assistantIdRef.current,
            runId: pendingRunIdRef.current,
            threadId: nextThreadId,
          });
          pendingRunIdRef.current = null;
        }
      } else {
        params.delete("thread_id");
        clearStoredActiveRun();
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleRunCreated = useCallback((run: unknown) => {
    const createdRun = run as CreatedRun;
    const runId = createdRun.run_id ?? createdRun.runId;
    if (!runId) return;

    const threadId = createdRun.thread_id ?? createdRun.threadId ?? urlThreadIdRef.current;
    if (!threadId) {
      pendingRunIdRef.current = runId;
      return;
    }

    writeStoredActiveRun({
      assistantId: assistantIdRef.current,
      runId,
      threadId,
    });
  }, []);

  const streamOptions = useMemo(() => ({
    client,
    assistantId,
    threadId: isAuthReady ? (urlThreadId ?? undefined) : undefined,
    fetchStateHistory: true,
    filterSubagentMessages: true,
    onCreated: handleRunCreated,
    onThreadId: (id: string) => handleThreadIdChange(id),
    onCustomEvent: (data: unknown) => {
      if (isDesignRevisionArtifact(data)) {
        onDesignRevisionEventRef.current?.(data);
      }
      if (isSketchRevisionArtifact(data)) {
        onSketchRevisionEventRef.current?.(data);
      }
    },
  }), [
    assistantId,
    client,
    handleRunCreated,
    handleThreadIdChange,
    isAuthReady,
    urlThreadId,
  ]);

  const stream = useStream<TexocadGraphState>(streamOptions);

  const { messages, isLoading, error, values } = stream;
  const isHydrating = stream.isThreadLoading;
  const todos: TodoItem[] = Array.isArray(values.todos) ? values.todos : EMPTY_TODOS;
  const designRevisions = useMemo(
    () => designRevisionsFromMessages(messages),
    [messages],
  );
  const sketchRevisions = useMemo(
    () => sketchRevisionsFromMessages(messages),
    [messages],
  );
  const latestRevision = latestDesignRevision(designRevisions);
  const latestSketch = latestSketchRevision(sketchRevisions);
  const isBusy = isLoading || isHydrating || !isAuthReady;

  const joinActiveRun = useCallback((record: ActiveRunRecord) => {
    if (hasJoinedRunRef.current === record.runId) return;
    const joinStream = (stream as unknown as JoinableStream).joinStream;
    if (typeof joinStream !== "function") return;

    hasJoinedRunRef.current = record.runId;
    try {
      void Promise.resolve(joinStream.call(stream, record.runId)).catch(() => {
        hasJoinedRunRef.current = null;
        clearActiveRun(record);
      });
    } catch {
      hasJoinedRunRef.current = null;
      clearActiveRun(record);
    }
  }, [clearActiveRun, stream]);

  const cancelActiveRun = useCallback(async () => {
    const record = readStoredActiveRun();
    if (!record) {
      (stream as unknown as JoinableStream).stop?.();
      return;
    }

    const runs = (client as unknown as CancellableRunsClient).runs;
    const cancel = runs?.cancel;
    if (typeof cancel === "function") {
      try {
        await Promise.resolve(cancel.call(runs, record.threadId, record.runId));
      } catch {
        return;
      }
    } else {
      (stream as unknown as JoinableStream).stop?.();
    }

    hasJoinedRunRef.current = null;
    clearActiveRun(record);
  }, [clearActiveRun, client, stream]);

  useEffect(() => {
    if (!isAuthReady || !urlThreadId || isLoading || isHydrating) return;

    const stored = readStoredActiveRun();
    if (stored && activeRunMatches(stored, assistantId, urlThreadId)) {
      joinActiveRun(stored);
    }
  }, [assistantId, isAuthReady, isHydrating, isLoading, joinActiveRun, urlThreadId]);

  useEffect(() => {
    if (latestRevision) {
      onDesignRevisionEventRef.current?.(latestRevision);
    }
  }, [latestRevision]);

  useEffect(() => {
    if (latestSketch) {
      onSketchRevisionEventRef.current?.(latestSketch);
    }
  }, [latestSketch]);

  const raw = stream as unknown as Record<string, unknown>;
  const streamAccessors: StreamAccessors = {
    getToolCalls: typeof raw.getToolCalls === "function"
      ? raw.getToolCalls as StreamAccessors["getToolCalls"]
      : undefined,
    getSubagentsByMessage: typeof raw.getSubagentsByMessage === "function"
      ? raw.getSubagentsByMessage as StreamAccessors["getSubagentsByMessage"]
      : undefined,
  };

  return {
    client,
    stream,
    streamAccessors,
    messages,
    isLoading,
    isHydrating,
    isAuthReady,
    isBusy,
    error,
    cancelActiveRun,
    clearActiveRun,
    todos,
    designRevisions,
    sketchRevisions,
    latestRevision,
    latestSketch,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } as const;
}
