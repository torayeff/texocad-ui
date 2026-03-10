"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import { BACKEND_URL } from "./config";
import type { ChatMessage, ToolCallInfo, AIBlock } from "@/app/components/chat/types";

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

interface UseChatOptions {
  onCustomEvent?: (data: Record<string, unknown>) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  submit: (content: string) => void;
  stop: () => void;
}

let nextToolId = 0;
function genToolId(): string {
  return `tc_${++nextToolId}`;
}

function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function createThread(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/threads`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to create thread: ${res.status}`);
  const body = await res.json();
  return body.thread_id;
}

async function* streamSSE(
  threadId: string,
  content: string,
  signal: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const res = await fetch(
    `${BACKEND_URL}/api/threads/${threadId}/runs/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal,
    },
  );

  if (!res.ok) throw new Error(`Stream request failed: ${res.status}`);
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

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef(threadId);
  const isLoadingRef = useRef(isLoading);
  const onCustomEventRef = useRef(options.onCustomEvent);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { onCustomEventRef.current = options.onCustomEvent; }, [options.onCustomEvent]);

  useEffect(() => {
    let cancelled = false;
    createThread()
      .then((id) => {
        if (!cancelled) setThreadId(id);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    (content: string) => {
      if (!threadIdRef.current || isLoadingRef.current) return;
      const currentThreadId = threadIdRef.current;

      const humanMsg: ChatMessage = {
        id: genMsgId(),
        role: "human",
        content,
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
        try {
          for await (const { event, data } of streamSSE(
            currentThreadId,
            content,
            controller.signal,
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
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setIsLoading(false);
          abortRef.current = null;
        }
      })();
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, error, threadId, submit, stop };
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
