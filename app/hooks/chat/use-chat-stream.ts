"use client";

import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/hooks/chat/use-langgraph-auth";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import {
  designRevisionsFromMessages,
  isDesignRevisionArtifact,
  isModelRevisionArtifact,
  isSketchRevisionArtifact,
  latestDesignRevision,
  latestModelRevision,
  latestSketchRevision,
  modelRevisionsFromMessages,
  sketchRevisionsFromMessages,
} from "@/app/lib/design-revisions/design-artifacts";
import type {
  DesignRevisionArtifact,
  ModelRevisionArtifact,
  SketchRevisionArtifact,
} from "@/app/types/design-artifact";
import type {
  TexocadGraphState,
  TodoItem,
} from "@/app/types/chat";
import {
  createdRunIds,
  latestActiveRunId,
  streamThreadControls,
} from "@/app/lib/chat/langgraph-stream";
import { chatUrlWithThread } from "@/app/lib/chat/chat-url";

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
  onModelRevisionEvent?: (revision: ModelRevisionArtifact) => void;
  onSketchRevisionEvent?: (revision: SketchRevisionArtifact) => void;
}

interface UseChatStreamOptions extends UseChatStreamEvents {
  initialThreadId?: string | null;
}

function replaceUrlThreadId(pathname: string, threadId: string | null) {
  window.history.replaceState(
    window.history.state,
    "",
    chatUrlWithThread(pathname, window.location.search, threadId),
  );
}

export function useChatStream(assistantId: AssistantId, options: UseChatStreamOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [threadId, setThreadId] = useState(options.initialThreadId ?? null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [hasStopRequested, setHasStopRequested] = useState(false);

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onDesignRevisionEventRef = useRef(options.onDesignRevisionEvent);
  const onModelRevisionEventRef = useRef(options.onModelRevisionEvent);
  const onSketchRevisionEventRef = useRef(options.onSketchRevisionEvent);
  const threadIdRef = useRef(threadId);
  const pathnameRef = useRef(pathname);
  const loadingRunIdRef = useRef<string | null>(null);
  const activeRunLookupRef = useRef<string | null>(null);
  const locallyStartedRunIdsRef = useRef(new Set<string>());
  useEffect(() => {
    onDesignRevisionEventRef.current = options.onDesignRevisionEvent;
    onModelRevisionEventRef.current = options.onModelRevisionEvent;
    onSketchRevisionEventRef.current = options.onSketchRevisionEvent;
  }, [options.onDesignRevisionEvent, options.onModelRevisionEvent, options.onSketchRevisionEvent]);

  useEffect(() => {
    threadIdRef.current = threadId;
    pathnameRef.current = pathname;
  }, [pathname, threadId]);

  const applyThreadId = useCallback((nextThreadId: string | null) => {
    threadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);
    replaceUrlThreadId(pathnameRef.current, nextThreadId);
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
      if (isModelRevisionArtifact(data)) {
        onModelRevisionEventRef.current?.(data);
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
  const modelRevisions = useMemo(
    () => modelRevisionsFromMessages(messages),
    [messages],
  );
  const latestRevision = latestDesignRevision(designRevisions);
  const latestSketch = latestSketchRevision(sketchRevisions);
  const latestModel = latestModelRevision(modelRevisions);
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
    const requestedThreadId = threadId;

    void client.runs.list(requestedThreadId)
      .then((runs) => {
        const nextRunId = latestActiveRunId(runs);
        if (nextRunId && threadIdRef.current === requestedThreadId) {
          setActiveRunId(nextRunId);
        }
      })
      .catch(() => {
        if (threadIdRef.current === requestedThreadId) {
          activeRunLookupRef.current = null;
        }
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

  useEffect(() => {
    if (latestModel) {
      onModelRevisionEventRef.current?.(latestModel);
    }
  }, [latestModel]);

  return {
    client,
    stream,
    messages,
    isLoading,
    isHydrating,
    isAuthReady,
    isBusy,
    error: visibleError,
    todos,
    designRevisions,
    sketchRevisions,
    modelRevisions,
    urlThreadId: threadId,
    pathname,
    router,
    switchThread,
    stopGeneration,
  } as const;
}
