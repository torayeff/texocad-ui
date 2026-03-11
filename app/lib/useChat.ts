"use client";

import { useState, useRef, useCallback, useEffect } from "react";


export type ToolCallState = "pending" | "completed" | "error";

export interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  state: ToolCallState;
  agent?: string;
  isSubagent?: boolean;
}

export type AIBlock =
  | { kind: "thinking"; content: string; agent: string; isSubagent: boolean }
  | { kind: "text"; content: string; agent: string; isSubagent: boolean }
  | { kind: "tool_call"; toolCallId: string; agent: string; isSubagent: boolean }
  | { kind: "tool_result"; toolCallId: string; agent: string; isSubagent: boolean };

export interface ChatMessage {
  id: string;
  role: "human" | "ai";
  content: string;
  thinking?: string;
  toolCalls: ToolCallInfo[];
  blocks: AIBlock[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    runtimeSeconds?: number;
  };
}

export interface GeomExportEvent {
  type: "geom_export";
  filename: string;
  thread_id: string;
  url: string;
}

export function isGeomExportEvent(data: unknown): data is GeomExportEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as GeomExportEvent).type === "geom_export" &&
    "filename" in data &&
    "thread_id" in data &&
    "url" in data
  );
}

export interface HydratedHistory {
  messages: ChatMessage[];
  customEvents: Record<string, unknown>[];
}

interface NormalizedHistoryEvent {
  name: string;
  payload: Record<string, unknown>;
}


let nextToolId = 0;

const HISTORY_EVENT_META_KEYS = new Set([
  "id",
  "thread_id",
  "run_id",
  "created_at",
  "updated_at",
]);

export function createHumanMessage(content: string): ChatMessage {
  return {
    id: genMsgId(),
    role: "human",
    content,
    toolCalls: [],
    blocks: [],
  };
}

export function createEmptyAiMessage(): ChatMessage {
  return {
    id: genMsgId(),
    role: "ai",
    content: "",
    toolCalls: [],
    blocks: [],
  };
}

export function applyThinkingChunk(
  message: ChatMessage,
  chunk: string,
  agent: string,
  isSubagent: boolean,
): ChatMessage {
  return {
    ...message,
    thinking: (message.thinking ?? "") + chunk,
    blocks: appendStreamBlock(message.blocks, "thinking", chunk, agent, isSubagent),
  };
}

export function applyTextChunk(
  message: ChatMessage,
  chunk: string,
  agent: string,
  isSubagent: boolean,
): ChatMessage {
  return {
    ...message,
    content: message.content + chunk,
    blocks: appendStreamBlock(message.blocks, "text", chunk, agent, isSubagent),
  };
}

export function applyToolCall(
  message: ChatMessage,
  name: string,
  args: Record<string, unknown>,
  agent: string,
  isSubagent: boolean,
): ChatMessage {
  const toolCall: ToolCallInfo = {
    id: genToolId(),
    name,
    args,
    state: "pending",
    agent,
    isSubagent,
  };

  return {
    ...message,
    toolCalls: [...message.toolCalls, toolCall],
    blocks: [
      ...message.blocks,
      { kind: "tool_call", toolCallId: toolCall.id, agent, isSubagent },
    ],
  };
}

export function applyToolResult(
  message: ChatMessage,
  name: string,
  result: string,
  agent: string,
  isSubagent: boolean,
): ChatMessage {
  const { toolCalls, toolCallId } = completePendingToolCall(
    message.toolCalls,
    name,
    result,
  );
  if (!toolCallId) return message;

  return {
    ...message,
    toolCalls,
    blocks: [
      ...message.blocks,
      { kind: "tool_result", toolCallId, agent, isSubagent },
    ],
  };
}

export function applyUsagePayload(
  message: ChatMessage,
  data: Record<string, unknown>,
): ChatMessage {
  const usage = getUsage(data);
  if (!usage) return message;

  return {
    ...message,
    usage,
  };
}

export function hydrateHistory(rawEvents: unknown): HydratedHistory {
  if (!Array.isArray(rawEvents)) {
    return { messages: [], customEvents: [] };
  }

  const events = rawEvents
    .map(normalizeHistoryEvent)
    .filter((event): event is NormalizedHistoryEvent => event !== null);

  const messages: ChatMessage[] = [];
  const customEvents: Record<string, unknown>[] = [];
  let currentAiMessage: ChatMessage | null = null;

  const flushAiMessage = () => {
    if (!currentAiMessage) return;
    if (
      !currentAiMessage.content &&
      !currentAiMessage.thinking &&
      currentAiMessage.toolCalls.length === 0 &&
      currentAiMessage.blocks.length === 0
    ) {
      currentAiMessage = null;
      return;
    }

    messages.push(currentAiMessage);
    currentAiMessage = null;
  };

  const ensureAiMessage = () => {
    if (currentAiMessage) return currentAiMessage;

    currentAiMessage = createEmptyAiMessage();
    return currentAiMessage;
  };

  for (const event of events) {
    const { name, payload } = event;
    const agent = getStringValue(payload.agent);
    const isSubagent = Boolean(payload.subagent ?? payload.is_subagent);

    switch (name) {
      case "user_message": {
        flushAiMessage();
        messages.push(createHumanMessage(stringifyContent(payload.content)));
        break;
      }
      case "thinking": {
        const chunk = stringifyContent(payload.content);
        if (!chunk) break;
        currentAiMessage = applyThinkingChunk(
          ensureAiMessage(),
          chunk,
          agent,
          isSubagent,
        );
        break;
      }
      case "text": {
        const chunk = stringifyContent(payload.content);
        if (!chunk) break;
        currentAiMessage = applyTextChunk(
          ensureAiMessage(),
          chunk,
          agent,
          isSubagent,
        );
        break;
      }
      case "tool_call": {
        currentAiMessage = applyToolCall(
          ensureAiMessage(),
          getStringValue(payload.name) || "tool",
          getRecordValue(payload.args) ?? {},
          agent,
          isSubagent,
        );
        break;
      }
      case "tool_result": {
        currentAiMessage = applyToolResult(
          ensureAiMessage(),
          getStringValue(payload.name),
          stringifyContent(payload.content),
          agent,
          isSubagent,
        );
        break;
      }
      case "usage": {
        currentAiMessage = applyUsagePayload(ensureAiMessage(), payload);
        break;
      }
      case "error": {
        currentAiMessage = applyErrorPayload(
          ensureAiMessage(),
          getStringValue(payload.message) || stringifyContent(payload.content),
          agent,
          isSubagent,
        );
        break;
      }
      case "done": {
        flushAiMessage();
        break;
      }
      default: {
        customEvents.push(
          "type" in payload
            ? payload
            : {
              ...payload,
              type: name,
            },
        );
        break;
      }
    }
  }

  flushAiMessage();
  return { messages, customEvents };
}

function genToolId(): string {
  return `tc_${++nextToolId}`;
}

function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeHistoryEvent(
  rawEvent: unknown,
): NormalizedHistoryEvent | null {
  const event = getRecordValue(rawEvent);
  if (!event) return null;

  const name =
    getStringValue(event.event_name) ||
    getStringValue(event.event) ||
    getStringValue(event.type);
  if (!name) return null;

  const payload =
    getRecordValue(event.payload) ??
    getRecordValue(event.data) ??
    Object.fromEntries(
      Object.entries(event).filter(
        ([key]) =>
          !HISTORY_EVENT_META_KEYS.has(key) &&
          key !== "event" &&
          key !== "event_name" &&
          key !== "type" &&
          key !== "payload" &&
          key !== "data",
      ),
    );

  return {
    name,
    payload,
  };
}

function getRecordValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getUsage(
  data: Record<string, unknown>,
): ChatMessage["usage"] | undefined {
  const agents = getRecordValue(data.agents);
  if (!agents) return undefined;

  const { inputTokens, outputTokens } = Object.values(agents).reduce<{
    inputTokens: number;
    outputTokens: number;
  }>((totals, usageValue) => {
    const usage = getRecordValue(usageValue);
    if (!usage) return totals;

    return {
      inputTokens: totals.inputTokens + getNumericValue(usage.input_tokens),
      outputTokens: totals.outputTokens + getNumericValue(usage.output_tokens),
    };
  }, { inputTokens: 0, outputTokens: 0 });

  if (inputTokens <= 0 && outputTokens <= 0) return undefined;

  return {
    inputTokens,
    outputTokens,
    runtimeSeconds:
      typeof data.runtime === "number" ? data.runtime : undefined,
  };
}

function getNumericValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function applyErrorPayload(
  message: ChatMessage,
  result: string,
  agent: string,
  isSubagent: boolean,
): ChatMessage {
  const { toolCalls, toolCallId } = failPendingToolCall(message.toolCalls, result);
  if (!toolCallId) return message;

  return {
    ...message,
    toolCalls,
    blocks: [
      ...message.blocks,
      { kind: "tool_result", toolCallId, agent, isSubagent },
    ],
  };
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

function failPendingToolCall(
  toolCalls: ToolCallInfo[],
  result: string,
): { toolCalls: ToolCallInfo[]; toolCallId: string } {
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].state !== "pending") continue;
    const copy = [...toolCalls];
    copy[i] = { ...copy[i], result, state: "error" };
    return { toolCalls: copy, toolCallId: copy[i].id };
  }

  return { toolCalls, toolCallId: "" };
}

function appendStreamBlock(
  blocks: AIBlock[],
  kind: "thinking" | "text",
  chunk: string,
  agent: string,
  isSubagent: boolean,
): AIBlock[] {
  const last = blocks[blocks.length - 1];
  if (
    last &&
    last.kind === kind &&
    last.agent === agent &&
    last.isSubagent === isSubagent
  ) {
    const copy = [...blocks];
    copy[copy.length - 1] = { ...last, content: last.content + chunk };
    return copy;
  }

  return [...blocks, { kind, content: chunk, agent, isSubagent }];
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

  // Fallback: if no AI message exists, create one and apply the update
  const newMsg = createEmptyAiMessage();
  const updatedMsg = updater(newMsg);
  return [...messages, updatedMsg];
}


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

  // RAF batching state
  const pendingUpdatesRef = useRef<((messages: ChatMessage[]) => ChatMessage[])[]>([]);
  const rafRef = useRef<number | null>(null);

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

  const applyPendingUpdates = (prev: ChatMessage[]) => {
    const updaters = pendingUpdatesRef.current;
    if (updaters.length === 0) return prev;
    pendingUpdatesRef.current = [];
    let current = prev;
    for (const u of updaters) {
      current = u(current);
    }
    return current;
  };

  const scheduleUpdate = useCallback((updater: (messages: ChatMessage[]) => ChatMessage[]) => {
    pendingUpdatesRef.current.push(updater);

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setMessages(applyPendingUpdates);
      });
    }
  }, []);

  const submit = useCallback(
    (content: string) => {
      const trimmedContent = content.trim();
      if (!trimmedContent || isBusyRef.current) return;

      const humanMsg = createHumanMessage(trimmedContent);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      setMessages((prev) => [...applyPendingUpdates(prev), humanMsg]);

      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      function ensureAiMessageUpdater(msgs: ChatMessage[]) {
        if (msgs.length > 0 && msgs[msgs.length - 1].role === "ai") {
          return msgs;
        }
        return [...msgs, createEmptyAiMessage()];
      }

      function applyToLatestAi(msgs: ChatMessage[], updater: (msg: ChatMessage) => ChatMessage) {
        const ensured = ensureAiMessageUpdater(msgs);
        return updateLastAi(ensured, updater);
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
              const chunk = data.content as string;
              scheduleUpdate((prev) =>
                applyToLatestAi(prev, (msg) =>
                  applyThinkingChunk(msg, chunk, agent, isSubagent)
                )
              );
            } else if (event === "text") {
              const chunk = data.content as string;
              scheduleUpdate((prev) =>
                applyToLatestAi(prev, (msg) =>
                  applyTextChunk(msg, chunk, agent, isSubagent)
                )
              );
            } else if (event === "tool_call") {
              scheduleUpdate((prev) =>
                applyToLatestAi(prev, (msg) =>
                  applyToolCall(
                    msg,
                    (data.name as string) || "tool",
                    (data.args as Record<string, unknown>) ?? {},
                    agent,
                    isSubagent
                  )
                )
              );
            } else if (event === "tool_result") {
              const name = data.name as string;
              const resultContent = data.content as string;
              scheduleUpdate((prev) =>
                applyToLatestAi(prev, (msg) =>
                  applyToolResult(msg, name, resultContent, agent, isSubagent)
                )
              );
            } else if (event === "error") {
              setError((data.message as string) ?? "Unknown server error");
            } else if (event === "usage") {
              scheduleUpdate((prev) =>
                applyToLatestAi(prev, (msg) =>
                  applyUsagePayload(msg, data)
                )
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
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          setMessages(applyPendingUpdates);
        }
      })();
    },
    [setActiveThreadId, scheduleUpdate],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return { messages, isHydrating, isLoading, error, threadId, submit, stop };
}
