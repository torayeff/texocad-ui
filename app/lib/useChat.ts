"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import {
  applyTextChunk,
  applyThinkingChunk,
  applyToolCall,
  applyToolResult,
  applyUsagePayload,
  createEmptyAiMessage,
  createHumanMessage,
  hydrateHistory,
} from "./chatMessageState";
import type { HydratedHistory } from "./chatMessageState";
import type { ChatMessage } from "@/app/components/chat/types";

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

const CHAT_API_BASE = "/api/threads";

interface UseChatOptions {
  onCustomEvent?: (data: Record<string, unknown>) => void;
  onThreadIdChange?: (threadId: string | null) => void;
  threadId?: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isHydrating: boolean;
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  submit: (content: string) => void;
  stop: () => void;
}

class BackendRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
  }
}

async function fetchChatApi(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: "same-origin",
  });
}

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as
      | { detail?: unknown; message?: unknown }
      | null;
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.message === "string") return body.message;
  }

  const bodyText = await res.text().catch(() => "");
  return bodyText || `Request failed: ${res.status}`;
}

async function createThread(): Promise<string> {
  const res = await fetchChatApi(CHAT_API_BASE, {
    method: "POST",
  });
  if (!res.ok) {
    throw new BackendRequestError(res.status, await readErrorMessage(res));
  }

  const body = (await res.json()) as { thread_id?: unknown };
  if (typeof body.thread_id !== "string") {
    throw new Error("Thread creation response is missing thread_id");
  }

  return body.thread_id;
}

async function fetchHistory(
  threadId: string,
): Promise<HydratedHistory> {
  const res = await fetchChatApi(`${CHAT_API_BASE}/${threadId}/history`);
  if (!res.ok) {
    throw new BackendRequestError(res.status, await readErrorMessage(res));
  }

  const body = (await res.json()) as { events?: unknown };
  return hydrateHistory(body.events);
}

async function* streamSSE(
  threadId: string,
  content: string,
  signal: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const res = await fetchChatApi(`${CHAT_API_BASE}/${threadId}/runs/stream`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok) {
    throw new BackendRequestError(res.status, await readErrorMessage(res));
  }
  if (!res.body) throw new Error("Response body is null");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData = "";

  for (; ;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        currentData = line.slice(6);
      } else if (line === "") {
        if (currentEvent && currentData) {
          try {
            yield { event: currentEvent, data: JSON.parse(currentData) };
          } catch { }
        }
        currentEvent = "";
        currentData = "";
      }
    }
  }

  if (currentEvent && currentData) {
    try {
      yield { event: currentEvent, data: JSON.parse(currentData) };
    } catch { }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isInvalidThreadError(error: unknown): boolean {
  return (
    error instanceof BackendRequestError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  );
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    onCustomEvent,
    onThreadIdChange,
    threadId: optionThreadId = null,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(optionThreadId);

  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(optionThreadId);
  const isBusyRef = useRef(false);
  const hydratedThreadIdRef = useRef<string | null>(null);
  const onCustomEventRef = useRef(onCustomEvent);
  const onThreadIdChangeRef = useRef(onThreadIdChange);

  const setActiveThreadId = useCallback((nextThreadId: string | null) => {
    threadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);
  }, []);

  useEffect(() => {
    isBusyRef.current = isLoading || isHydrating;
  }, [isHydrating, isLoading]);

  useEffect(() => {
    onCustomEventRef.current = onCustomEvent;
  }, [onCustomEvent]);

  useEffect(() => {
    onThreadIdChangeRef.current = onThreadIdChange;
  }, [onThreadIdChange]);

  useEffect(() => {
    const nextThreadId = optionThreadId;
    if (nextThreadId === threadIdRef.current) return;

    abortRef.current?.abort();
    abortRef.current = null;
    hydratedThreadIdRef.current = null;
    setIsHydrating(false);
    setIsLoading(false);
    setActiveThreadId(nextThreadId);
    setMessages([]);
  }, [optionThreadId, setActiveThreadId]);

  useEffect(() => {
    if (!threadId) return;
    if (hydratedThreadIdRef.current === threadId) return;

    let cancelled = false;
    hydratedThreadIdRef.current = threadId;
    setIsHydrating(true);
    setError(null);

    (async () => {
      try {
        const historyMessages = await fetchHistory(threadId);
        if (cancelled || threadIdRef.current !== threadId) return;
        setMessages(historyMessages.messages);
        for (const customEvent of historyMessages.customEvents) {
          onCustomEventRef.current?.(customEvent);
        }
      } catch (err: unknown) {
        if (cancelled || threadIdRef.current !== threadId) return;

        setMessages([]);
        setError(getErrorMessage(err));

        if (isInvalidThreadError(err)) {
          hydratedThreadIdRef.current = null;
          setActiveThreadId(null);
          onThreadIdChangeRef.current?.(null);
        }
      } finally {
        if (!cancelled && threadIdRef.current === threadId) {
          setIsHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setActiveThreadId, threadId]);

  const submit = useCallback(
    (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isBusyRef.current) return;

      const humanMsg = createHumanMessage(trimmedContent);

      setMessages((prev) => [...prev, humanMsg]);
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let aiInserted = false;

      function ensureAiMessage() {
        if (aiInserted) return;
        aiInserted = true;
        setMessages((prev) => [...prev, createEmptyAiMessage()]);
      }

      (async () => {
        let activeThreadId = threadIdRef.current;

        try {
          if (!activeThreadId) {
            activeThreadId = await createThread();
            if (controller.signal.aborted) return;

            hydratedThreadIdRef.current = activeThreadId;
            setActiveThreadId(activeThreadId);
            onThreadIdChangeRef.current?.(activeThreadId);
          }

          for await (const { event, data } of streamSSE(
            activeThreadId,
            trimmedContent,
            controller.signal,
          )) {
            const agent = (data.agent as string) ?? "";
            const isSubagent = Boolean(data.subagent);

            if (event === "thinking") {
              ensureAiMessage();
              const chunk = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) =>
                  applyThinkingChunk(msg, chunk, agent, isSubagent),
                ),
              );
            } else if (event === "text") {
              ensureAiMessage();
              const chunk = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) =>
                  applyTextChunk(msg, chunk, agent, isSubagent),
                ),
              );
            } else if (event === "tool_call") {
              ensureAiMessage();
              setMessages((prev) =>
                updateLastAi(prev, (msg) =>
                  applyToolCall(
                    msg,
                    (data.name as string) || "tool",
                    (data.args as Record<string, unknown>) ?? {},
                    agent,
                    isSubagent,
                  ),
                ),
              );
            } else if (event === "tool_result") {
              const name = data.name as string;
              const resultContent = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) =>
                  applyToolResult(msg, name, resultContent, agent, isSubagent),
                ),
              );
            } else if (event === "error") {
              setError((data.message as string) ?? "Unknown server error");
            } else if (event === "usage") {
              ensureAiMessage();
              setMessages((prev) =>
                updateLastAi(prev, (msg) => applyUsagePayload(msg, data)),
              );
            } else if (event === "done") {
              // no-op
            } else {
              onCustomEventRef.current?.({ ...data, type: event });
            }
          }
        } catch (err: unknown) {
          if ((err as DOMException)?.name === "AbortError") return;
          setError(getErrorMessage(err));
        } finally {
          setIsLoading(false);
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        }
      })();
    },
    [setActiveThreadId],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return { messages, isHydrating, isLoading, error, threadId, submit, stop };
}

function updateLastAi(
  messages: ChatMessage[],
  updater: (msg: ChatMessage) => ChatMessage,
): ChatMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "ai") {
      const updated = updater(messages[i]);
      if (updated === messages[i]) return messages;
      const copy = [...messages];
      copy[i] = updated;
      return copy;
    }
  }
  return messages;
}
