"use client";

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_features/chat/_hooks/use-langgraph-auth";
import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  designRevisionsFromMessages,
  isDesignRevisionArtifact,
  isSketchRevisionArtifact,
  latestDesignRevision,
  latestSketchRevision,
  sketchRevisionsFromMessages,
} from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type {
  TexocadGraphState,
  TodoItem,
} from "@/app/studio/_features/chat/_types/chat";
import {
  createdRunIds,
  latestActiveRunId,
  streamThreadControls,
} from "@/app/studio/_features/chat/_lib/langgraph-stream";

const EMPTY_TODOS: TodoItem[] = [];
const RESUMABLE_RUN_STORAGE_PREFIX = "lg:stream:";

function removeStoredRunId(threadId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`${RESUMABLE_RUN_STORAGE_PREFIX}${threadId}`);
}

function storedRunId(threadId: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(`${RESUMABLE_RUN_STORAGE_PREFIX}${threadId}`);
}

interface UseChatStreamEvents {
  onDesignRevisionEvent?: (revision: DesignRevisionArtifact) => void;
  onSketchRevisionEvent?: (revision: SketchRevisionArtifact) => void;
}

interface UseChatStreamOptions extends UseChatStreamEvents {
  initialThreadId?: string | null;
}

function replaceUrlThreadId(pathname: string, currentSearchParams: URLSearchParams, threadId: string | null) {
  const params = new URLSearchParams(currentSearchParams.toString());
  if (threadId) {
    params.set("thread_id", threadId);
  } else {
    params.delete("thread_id");
  }

  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function useChatStream(assistantId: StudioAssistantId, options: UseChatStreamOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threadId, setThreadId] = useState(options.initialThreadId ?? null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [hasStopRequested, setHasStopRequested] = useState(false);

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onDesignRevisionEventRef = useRef(options.onDesignRevisionEvent);
  const onSketchRevisionEventRef = useRef(options.onSketchRevisionEvent);
  const threadIdRef = useRef(threadId);
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);
  const loadingRunIdRef = useRef<string | null>(null);
  const activeRunLookupRef = useRef<string | null>(null);
  const locallyStartedRunIdsRef = useRef(new Set<string>());
  useEffect(() => {
    onDesignRevisionEventRef.current = options.onDesignRevisionEvent;
    onSketchRevisionEventRef.current = options.onSketchRevisionEvent;
  }, [options.onDesignRevisionEvent, options.onSketchRevisionEvent]);

  useEffect(() => {
    threadIdRef.current = threadId;
    pathnameRef.current = pathname;
    searchParamsRef.current = searchParams;
  }, [pathname, searchParams, threadId]);

  const applyThreadId = useCallback((nextThreadId: string | null) => {
    threadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);
    replaceUrlThreadId(pathnameRef.current, searchParamsRef.current, nextThreadId);
  }, []);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | null) => {
      applyThreadId(nextThreadId);
      setActiveRunId(null);
      loadingRunIdRef.current = null;
      activeRunLookupRef.current = null;
      locallyStartedRunIdsRef.current.clear();
      setHasStopRequested(false);
    },
    [applyThreadId],
  );

  const handleRunCreated = useCallback((run: unknown) => {
    const { runId: createdRunId, threadId: createdThreadId } = createdRunIds(run, threadIdRef.current);
    if (!createdThreadId) return;
    applyThreadId(createdThreadId);
    setHasStopRequested(false);
    if (createdRunId) {
      locallyStartedRunIdsRef.current.add(createdRunId);
      setActiveRunId(createdRunId);
    }
  }, [applyThreadId]);

  const streamOptions = useMemo(() => ({
    client,
    assistantId,
    threadId: isAuthReady ? (threadId ?? undefined) : undefined,
    fetchStateHistory: false,
    filterSubagentMessages: true,
    reconnectOnMount: true,
    onCreated: handleRunCreated,
    onThreadId: applyThreadId,
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
    applyThreadId,
    client,
    handleRunCreated,
    isAuthReady,
    threadId,
  ]);

  const stream = useStream<TexocadGraphState>(streamOptions);

  const stopGeneration = useCallback(() => {
    const currentThreadId = threadIdRef.current;
    const currentRunId = activeRunId ?? (currentThreadId ? storedRunId(currentThreadId) : null);
    if (!currentThreadId || !currentRunId) {
      void stream.stop();
      return;
    }

    setHasStopRequested(true);
    // Prevent the SDK's disconnect helper from sending its default interrupt;
    // this stop action intentionally rolls back the run instead.
    removeStoredRunId(currentThreadId);
    void stream.stop();
    void client.runs.cancel(currentThreadId, currentRunId, true, "rollback")
      .catch(() => undefined)
      .finally(() => {
        setActiveRunId((runId) => runId === currentRunId ? null : runId);
        loadingRunIdRef.current = null;
        locallyStartedRunIdsRef.current.delete(currentRunId);
        activeRunLookupRef.current = currentThreadId;
      });
  }, [activeRunId, client, stream]);

  const switchThread = useCallback(
    (nextThreadId: string | null) => {
      const { switchThread: streamSwitchThread } = streamThreadControls(stream);
      if (typeof streamSwitchThread === "function") {
        void streamSwitchThread(nextThreadId);
      }
      handleThreadIdChange(nextThreadId);
    },
    [handleThreadIdChange, stream],
  );

  const { messages: rawMessages, isLoading, error, values } = stream;
  const isHydrating = stream.isThreadLoading;
  const visibleError = hasStopRequested ? null : error;

  const messages = useMemo(() => {
    if (threadId === null) return [];
    if (isHydrating && rawMessages.length === 0) return [];
    return rawMessages;
  }, [threadId, isHydrating, rawMessages]);

  const todos = useMemo(() => {
    if (threadId === null) return EMPTY_TODOS;
    if (isHydrating && rawMessages.length === 0) return EMPTY_TODOS;
    return Array.isArray(values.todos) ? values.todos : EMPTY_TODOS;
  }, [threadId, isHydrating, rawMessages.length, values.todos]);
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

  useEffect(() => {
    if (!isAuthReady || !activeRunId || isLoading) return;
    if (
      loadingRunIdRef.current === activeRunId ||
      locallyStartedRunIdsRef.current.has(activeRunId)
    ) return;

    const { joinStream } = streamThreadControls(stream);
    if (typeof joinStream !== "function") return;

    void Promise.resolve(joinStream(activeRunId)).catch(() => {
      setActiveRunId((currentRunId) => currentRunId === activeRunId ? null : currentRunId);
    });
  }, [activeRunId, isAuthReady, isLoading, stream, threadId]);

  useEffect(() => {
    if (!isAuthReady || !threadId || activeRunId || isLoading) return;
    if (activeRunLookupRef.current === threadId) return;
    activeRunLookupRef.current = threadId;

    void client.runs.list(threadId)
      .then((runs) => {
        const nextRunId = latestActiveRunId(runs);
        if (nextRunId) setActiveRunId(nextRunId);
      })
      .catch(() => {
        activeRunLookupRef.current = null;
      });
  }, [activeRunId, client, isAuthReady, isLoading, threadId]);

  useEffect(() => {
    if (isLoading && activeRunId) {
      loadingRunIdRef.current = activeRunId;
      return;
    }

    const completedRunId = loadingRunIdRef.current
      ?? (activeRunId && locallyStartedRunIdsRef.current.has(activeRunId) ? activeRunId : null);
    if (!isLoading && threadId && completedRunId) {
      activeRunLookupRef.current = threadId;
      setActiveRunId((currentRunId) => currentRunId === completedRunId ? null : currentRunId);
      loadingRunIdRef.current = null;
      locallyStartedRunIdsRef.current.delete(completedRunId);
    }
  }, [activeRunId, isLoading, threadId]);

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

  return {
    client,
    stream,
    messages,
    isLoading,
    isHydrating,
    isAuthReady,
    isBusy,
    error: visibleError,
    activeRunId,
    todos,
    designRevisions,
    sketchRevisions,
    latestRevision,
    latestSketch,
    urlThreadId: threadId,
    pathname,
    router,
    handleThreadIdChange,
    switchThread,
    stopGeneration,
  } as const;
}
