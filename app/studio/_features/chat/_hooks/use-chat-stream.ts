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

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onDesignRevisionEventRef = useRef(options.onDesignRevisionEvent);
  const onSketchRevisionEventRef = useRef(options.onSketchRevisionEvent);
  const assistantIdRef = useRef(assistantId);
  const threadIdRef = useRef(threadId);
  const loadingRunIdRef = useRef<string | null>(null);
  const activeRunLookupRef = useRef<string | null>(null);
  useEffect(() => {
    onDesignRevisionEventRef.current = options.onDesignRevisionEvent;
    onSketchRevisionEventRef.current = options.onSketchRevisionEvent;
  }, [options.onDesignRevisionEvent, options.onSketchRevisionEvent]);

  useEffect(() => {
    assistantIdRef.current = assistantId;
    threadIdRef.current = threadId;
  }, [assistantId, threadId]);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | null) => {
      setThreadId(nextThreadId);
      setActiveRunId(null);
      activeRunLookupRef.current = null;
      replaceUrlThreadId(pathname, searchParams, nextThreadId);
    },
    [pathname, searchParams],
  );

  const handleRunCreated = useCallback((run: unknown) => {
    const { runId: createdRunId, threadId: createdThreadId } = createdRunIds(run, threadIdRef.current);
    if (!createdThreadId) return;
    setThreadId(createdThreadId);
    if (createdRunId) {
      setActiveRunId(createdRunId);
    }
    replaceUrlThreadId(pathname, searchParams, createdThreadId);
  }, [pathname, searchParams]);

  const streamOptions = useMemo(() => ({
    client,
    assistantId,
    threadId: isAuthReady ? (threadId ?? undefined) : undefined,
    fetchStateHistory: true,
    filterSubagentMessages: true,
    reconnectOnMount: true,
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
    threadId,
  ]);

  const stream = useStream<TexocadGraphState>(streamOptions);

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

  useEffect(() => {
    if (!isAuthReady || !activeRunId || isLoading) return;

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

    const completedRunId = loadingRunIdRef.current;
    if (!isLoading && threadId && completedRunId) {
      setActiveRunId((currentRunId) => currentRunId === completedRunId ? null : currentRunId);
      loadingRunIdRef.current = null;
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
    error,
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
  } as const;
}
