import { useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";
import type { AssembledToolCall } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import { ASSISTANT_ID } from "@/app/studio/_lib/langgraph-config";
import { designRevisionsFromMessages } from "@/app/studio/_lib/design-artifacts";
import type { StreamAccessors } from "@/app/studio/_hooks/use-message-rows";
import type {
  TexocadGraphState,
  DesignRevisionArtifact,
  TodoItem,
} from "@/app/studio/_types/chat";
import type { StreamToolCall } from "@/app/studio/_components/chat/tool-call-card";

function toStreamToolCalls(toolCalls: AssembledToolCall[]): StreamToolCall[] {
  return toolCalls.map((toolCall) => ({
    id: toolCall.callId,
    state: "pending",
    call: {
      id: toolCall.callId,
      name: toolCall.name,
      args: typeof toolCall.input === "object" && toolCall.input !== null
        ? toolCall.input as Record<string, unknown>
        : {},
    },
  }));
}

const EMPTY_TODOS: TodoItem[] = [];

export function useChatStream(onDesignRevisionEvent?: (revision: DesignRevisionArtifact) => void) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onDesignRevisionEventRef = useRef(onDesignRevisionEvent);
  useEffect(() => {
    onDesignRevisionEventRef.current = onDesignRevisionEvent;
  }, [onDesignRevisionEvent]);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextThreadId) {
        params.set("thread_id", nextThreadId);
      } else {
        params.delete("thread_id");
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const streamOptions = useMemo(() => ({
    client,
    assistantId: ASSISTANT_ID,
    threadId: isAuthReady ? (urlThreadId ?? undefined) : undefined,
    onThreadId: (id: string) => handleThreadIdChange(id),
  }), [
    client,
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
  const latestRevision = designRevisions.at(-1) ?? null;
  const isBusy = isLoading || isHydrating || !isAuthReady;

  useEffect(() => {
    if (latestRevision) {
      onDesignRevisionEventRef.current?.(latestRevision);
    }
  }, [latestRevision]);

  const streamAccessors: StreamAccessors = {
    getToolCalls: () => toStreamToolCalls(stream.toolCalls),
    subagents: [...stream.subagents.values()],
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
    todos,
    designRevisions,
    latestRevision,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } as const;
}
