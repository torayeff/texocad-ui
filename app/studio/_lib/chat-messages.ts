import type {
  ToolCallInfo,
  AIBlock,
  ChatMessage,
  GeomExportEvent,
} from "@/app/studio/_types/chat";

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

let nextToolId = 0;

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

export function applyErrorPayload(
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

export function updateLastAi(
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

  const newMsg = createEmptyAiMessage();
  const updatedMsg = updater(newMsg);
  return [...messages, updatedMsg];
}

function genToolId(): string {
  return `tc_${++nextToolId}`;
}

function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

function getRecordValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getNumericValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
