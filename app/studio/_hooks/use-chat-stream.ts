import { useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStream } from "@langchain/react";

import { useLanggraphAuth } from "@/app/studio/_hooks/use-langgraph-auth";
import { engines } from "@/app/studio/_lib/langgraph-config";
import type { EngineKey } from "@/app/studio/_lib/langgraph-config";
import type { StreamAccessors } from "@/app/studio/_hooks/use-message-rows";
import type {
  TexocadGraphState,
  CustomExportEvent,
  GeomExportEntry,
  TodoItem,
} from "@/app/studio/_types/chat";

const EMPTY_TODOS: TodoItem[] = [];

export function useChatStream(engineKey: EngineKey, onExportEvent?: (entry: GeomExportEntry) => void) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("thread_id");

  const { client, isReady: isAuthReady } = useLanggraphAuth();

  const onExportEventRef = useRef(onExportEvent);
  useEffect(() => {
    onExportEventRef.current = onExportEvent;
  }, [onExportEvent]);

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
    assistantId: engines[engineKey].assistantId,
    threadId: isAuthReady ? (urlThreadId ?? undefined) : undefined,
    fetchStateHistory: true,
    filterSubagentMessages: true,
    onThreadId: (id: string) => handleThreadIdChange(id),
    onCustomEvent: (data: unknown) => {
      const event = data as CustomExportEvent;
      if (event.type === "exports" && Array.isArray(event.exports)) {
        for (const entry of event.exports) {
          onExportEventRef.current?.(entry);
        }
      }
    },
  }), [
    client,
    engineKey,
    handleThreadIdChange,
    isAuthReady,
    urlThreadId,
  ]);

  const stream = useStream<TexocadGraphState>(streamOptions);

  const { messages, isLoading, error, values } = stream;
  const isHydrating = stream.isThreadLoading;
  const todos: TodoItem[] = Array.isArray(values.todos) ? values.todos : EMPTY_TODOS;
  const exports: GeomExportEntry[] = useMemo(
    () => Array.isArray(values.exports) ? values.exports : [],
    [values.exports],
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
    exports,
    urlThreadId,
    pathname,
    router,
    handleThreadIdChange,
  } as const;
}
