import { useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import { ASSISTANT_ID } from "@/app/studio/_lib/langgraph-config";
import type { StreamAccessors } from "@/app/studio/_hooks/use-message-rows";
import type {
  TexocadGraphState,
  CustomProductEvent,
  PartEntry,
  TodoItem,
} from "@/app/studio/_types/chat";

const EMPTY_TODOS: TodoItem[] = [];
const EMPTY_PRODUCT: PartEntry[] = [];

export function useChatStream(onProductEvent?: (parts: PartEntry[]) => void) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onProductEventRef = useRef(onProductEvent);
  useEffect(() => {
    onProductEventRef.current = onProductEvent;
  }, [onProductEvent]);

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
    fetchStateHistory: true,
    filterSubagentMessages: true,
    onThreadId: (id: string) => handleThreadIdChange(id),
    onCustomEvent: (data: unknown) => {
      const event = data as CustomProductEvent;
      if (event.type === "product" && Array.isArray(event.parts)) {
        onProductEventRef.current?.(event.parts);
      }
    },
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
  const product: PartEntry[] = useMemo(
    () => Array.isArray(values.product) ? values.product : EMPTY_PRODUCT,
    [values.product],
  );
  const isBusy = isLoading || isHydrating || !isAuthReady;

  const raw = stream as unknown as Record<string, unknown>;
  const streamAccessors: StreamAccessors = {
    getToolCalls: typeof raw.getToolCalls === "function"
      ? raw.getToolCalls as StreamAccessors["getToolCalls"]
      : undefined,
    getSubagentsByMessage: typeof raw.getSubagentsByMessage === "function"
      ? raw.getSubagentsByMessage as StreamAccessors["getSubagentsByMessage"]
      : undefined,
    subagents: raw.subagents instanceof Map
      ? raw.subagents as StreamAccessors["subagents"]
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
    todos,
    product,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } as const;
}
