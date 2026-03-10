"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useRef, useCallback, useEffect } from "react";

import { BACKEND_URL } from "./config";
import type { AIBlock, ChatMessage, ToolCallInfo } from "@/app/components/chat/types";

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

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

type GetTokenFn = () => Promise<string | null>;

let nextToolId = 0;
function genToolId(): string {
  return `tc_${++nextToolId}`;
}

function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchWithAuth(
  getToken: GetTokenFn,
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  if (!token) {
    throw new Error("Missing Clerk session token");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
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

async function createThread(getToken: GetTokenFn): Promise<string> {
  const res = await fetchWithAuth(getToken, `${BACKEND_URL}/api/threads`, {
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
  getToken: GetTokenFn,
): Promise<ChatMessage[]> {
  const res = await fetchWithAuth(
    getToken,
    `${BACKEND_URL}/api/threads/${threadId}/history`,
  );
  if (!res.ok) {
    throw new BackendRequestError(res.status, await readErrorMessage(res));
  }

  const body = (await res.json()) as { messages?: unknown };
  return normalizeHistoryMessages(body.messages);
}

async function* streamSSE(
  threadId: string,
  content: string,
  signal: AbortSignal,
  getToken: GetTokenFn,
): AsyncGenerator<SSEEvent> {
  const res = await fetchWithAuth(
    getToken,
    `${BACKEND_URL}/api/threads/${threadId}/runs/stream`,
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      signal,
    },
  );

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

function normalizeHistoryMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages.flatMap((message) => {
    if (!message || typeof message !== "object") return [];

    const role = (message as { role?: unknown }).role;
    if (role !== "human" && role !== "ai") return [];

    const content = (message as { content?: unknown }).content;
    return [
      {
        id: genMsgId(),
        role,
        content: typeof content === "string" ? content : String(content ?? ""),
        toolCalls: [],
        blocks: [],
      },
    ];
  });
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
  const { getToken, isLoaded, isSignedIn } = useAuth();
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
    if (!threadId || !isLoaded || !isSignedIn) return;
    if (hydratedThreadIdRef.current === threadId) return;

    let cancelled = false;
    hydratedThreadIdRef.current = threadId;
    setIsHydrating(true);
    setError(null);

    (async () => {
      try {
        const historyMessages = await fetchHistory(threadId, getToken);
        if (cancelled || threadIdRef.current !== threadId) return;
        setMessages(historyMessages);
      } catch (err: unknown) {
        if (cancelled || threadIdRef.current !== threadId) return;

        setMessages([]);
        setError(getErrorMessage(err));

        if (isInvalidThreadError(err)) {
          hydratedThreadIdRef.current = null;
          setActiveThreadId(null);
          onThreadIdChange?.(null);
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
  }, [getToken, isLoaded, isSignedIn, onThreadIdChange, setActiveThreadId, threadId]);

  const submit = useCallback(
    (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isBusyRef.current) return;

      if (!isLoaded) {
        setError("Authentication is still loading. Please try again.");
        return;
      }

      if (!isSignedIn) {
        setError("You must be signed in to use the studio.");
        return;
      }

      const humanMsg: ChatMessage = {
        id: genMsgId(),
        role: "human",
        content: trimmedContent,
        toolCalls: [],
        blocks: [],
      };

      setMessages((prev) => [...prev, humanMsg]);
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const aiId = genMsgId();
      let aiInserted = false;

      function ensureAiMessage() {
        if (aiInserted) return;
        aiInserted = true;
        setMessages((prev) => [
          ...prev,
          { id: aiId, role: "ai", content: "", toolCalls: [], blocks: [] },
        ]);
      }

      (async () => {
        let activeThreadId = threadIdRef.current;

        try {
          if (!activeThreadId) {
            activeThreadId = await createThread(getToken);
            if (controller.signal.aborted) return;

            hydratedThreadIdRef.current = activeThreadId;
            setActiveThreadId(activeThreadId);
            onThreadIdChange?.(activeThreadId);
          }

          for await (const { event, data } of streamSSE(
            activeThreadId,
            trimmedContent,
            controller.signal,
            getToken,
          )) {
            const agent = (data.agent as string) ?? "";
            const isSubagent = Boolean(data.subagent);

            if (event === "thinking") {
              ensureAiMessage();
              const chunk = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) => ({
                  ...msg,
                  thinking: (msg.thinking ?? "") + chunk,
                  blocks: appendStreamBlock(msg.blocks, "thinking", chunk, agent, isSubagent),
                })),
              );
            } else if (event === "text") {
              ensureAiMessage();
              const chunk = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) => ({
                  ...msg,
                  content: msg.content + chunk,
                  blocks: appendStreamBlock(msg.blocks, "text", chunk, agent, isSubagent),
                })),
              );
            } else if (event === "tool_call") {
              ensureAiMessage();
              const tc: ToolCallInfo = {
                id: genToolId(),
                name: data.name as string,
                args: (data.args as Record<string, unknown>) ?? {},
                state: "pending",
                agent,
                isSubagent,
              };
              const block: AIBlock = { kind: "tool_call", toolCallId: tc.id, agent, isSubagent };
              setMessages((prev) =>
                updateLastAi(prev, (msg) => ({
                  ...msg,
                  toolCalls: [...msg.toolCalls, tc],
                  blocks: [...msg.blocks, block],
                })),
              );
            } else if (event === "tool_result") {
              const name = data.name as string;
              const resultContent = data.content as string;
              setMessages((prev) =>
                updateLastAi(prev, (msg) => {
                  const { toolCalls, toolCallId } = completePendingToolCall(
                    msg.toolCalls,
                    name,
                    resultContent,
                  );
                  const block: AIBlock = { kind: "tool_result", toolCallId, agent, isSubagent };
                  return { ...msg, toolCalls, blocks: [...msg.blocks, block] };
                }),
              );
            } else if (event === "error") {
              setError((data.message as string) ?? "Unknown server error");
            } else if (event === "usage") {
              ensureAiMessage();
              const agents = (
                data.agents as Record<
                  string,
                  { input_tokens?: number; output_tokens?: number }
                >
              ) ?? {};
              const { inputTokens, outputTokens } = Object.values(agents).reduce(
                (totals, agentUsage) => ({
                  inputTokens: totals.inputTokens + (agentUsage.input_tokens ?? 0),
                  outputTokens: totals.outputTokens + (agentUsage.output_tokens ?? 0),
                }),
                { inputTokens: 0, outputTokens: 0 },
              );
              const runtimeSeconds =
                typeof data.runtime === "number" ? data.runtime : undefined;

              setMessages((prev) =>
                updateLastAi(prev, (msg) => ({
                  ...msg,
                  usage:
                    inputTokens > 0 || outputTokens > 0
                      ? { inputTokens, outputTokens, runtimeSeconds }
                      : msg.usage,
                })),
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
    [getToken, isLoaded, isSignedIn, onThreadIdChange, setActiveThreadId],
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
      const copy = [...messages];
      copy[i] = updater(copy[i]);
      return copy;
    }
  }
  return messages;
}

function completePendingToolCall(
  toolCalls: ToolCallInfo[],
  name: string,
  result: string,
): { toolCalls: ToolCallInfo[]; toolCallId: string } {
  const idx = toolCalls.findIndex(
    (tc) => tc.name === name && tc.state === "pending",
  );
  if (idx === -1) return { toolCalls, toolCallId: "" };
  const copy = [...toolCalls];
  copy[idx] = { ...copy[idx], result, state: "completed" };
  return { toolCalls: copy, toolCallId: copy[idx].id };
}

function appendStreamBlock(
  blocks: AIBlock[],
  kind: "thinking" | "text",
  chunk: string,
  agent: string,
  isSubagent: boolean,
): AIBlock[] {
  const last = blocks[blocks.length - 1];
  if (last && last.kind === kind && last.agent === agent && last.isSubagent === isSubagent) {
    const copy = [...blocks];
    copy[copy.length - 1] = { ...last, content: last.content + chunk };
    return copy;
  }
  return [...blocks, { kind, content: chunk, agent, isSubagent }];
}
