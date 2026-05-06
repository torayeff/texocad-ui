import { AIMessage } from "@langchain/core/messages";
import type { SubagentDiscoverySnapshot } from "@langchain/react";
import type { StreamToolCall } from "@/app/studio/_components/chat/tool-call-card";

export interface MessageUsage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  runtimeSeconds?: number;
}

export interface MessageRow {
  rowKey: string;
  messageType: "human" | "ai";
  textContent: string;
  thinkingContent: string;
  agentName?: string;
  usage?: MessageUsage;
  isStreaming: boolean;
  startedAtMs?: number;
  toolCalls: StreamToolCall[];
  toolCallsSignature: string;
  subagents: SubagentDiscoverySnapshot[];
  subagentsSignature: string;
  renderMarkdown: boolean;
}

export const EMPTY_TOOL_CALLS: StreamToolCall[] = [];
export const EMPTY_SUBAGENTS: SubagentDiscoverySnapshot[] = [];

function serialize(value: unknown): string {
  return JSON.stringify(value) ?? "";
}

export function getMessageRowKey(
  index: number,
  conversationScope: string,
  messageId?: string | null,
): string {
  if (messageId) return `${conversationScope}:${messageId}`;
  return `${conversationScope}:message-${index}`;
}

export function getMessageUsage(
  message: AIMessage,
  runtimeSeconds?: number,
): MessageUsage | undefined {
  const usage = message.usage_metadata;

  if (!usage) {
    if (runtimeSeconds === undefined) return undefined;
    return {
      inputTokens: 0,
      outputTokens: 0,
      runtimeSeconds,
    };
  }

  return {
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    reasoningTokens: usage.output_token_details?.reasoning || 0,
    runtimeSeconds: runtimeSeconds
      ?? (usage as Record<string, unknown>).runtimeSeconds as number | undefined,
  };
}

export function getToolCallsSignature(toolCalls: StreamToolCall[]): string {
  return toolCalls
    .map((toolCall) => [
      toolCall.id,
      toolCall.state,
      toolCall.call.id ?? "",
      toolCall.call.name,
      serialize(toolCall.call.args),
      serialize(toolCall.result),
    ].join(":"))
    .join("|");
}

export function getSubagentsSignature(subagents: SubagentDiscoverySnapshot[]): string {
  return subagents
    .map((subagent) => {
      return [
        subagent.id,
        subagent.status,
        subagent.name,
        subagent.namespace.join("/"),
        subagent.taskInput ?? "",
        typeof subagent.output === "string" ? subagent.output : serialize(subagent.output),
        subagent.error ?? "",
        subagent.startedAt.getTime(),
        subagent.completedAt?.getTime() ?? "",
      ].join(":");
    })
    .join("|");
}
