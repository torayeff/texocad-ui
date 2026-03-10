import type { AIBlock, ChatMessage, ToolCallInfo } from "@/app/components/chat/types";

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

function getSequenceValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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
