import { AIMessage } from "@langchain/core/messages";
import { getMessageTextContent, getReasoningContent } from "@/app/studio/_features/chat/_lib/message-content";
import type { StreamToolCall } from "@/app/studio/_features/chat/_types/chat";
import type { SubagentStream } from "@/app/studio/_features/chat/_types/subagent";

export interface MessageRow {
  rowKey: string;
  messageType: "human" | "ai";
  textContent: string;
  thinkingContent: string;
  agentName?: string;
  isStreaming: boolean;
  runtimeSeconds?: number;
  startedAtMs?: number;
  toolCalls: StreamToolCall[];
  toolCallsSignature: string;
  subagents: SubagentStream[];
  subagentsSignature: string;
  renderMarkdown: boolean;
}

export const EMPTY_TOOL_CALLS: StreamToolCall[] = [];
export const EMPTY_SUBAGENTS: SubagentStream[] = [];

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

export function getSubagentsSignature(subagents: SubagentStream[]): string {
  return subagents
    .map((subagent) => {
      const lastMessage = subagent.messages[subagent.messages.length - 1];
      const lastMessageSignature = AIMessage.isInstance(lastMessage)
        ? `${getMessageTextContent(lastMessage)}\u0000${getReasoningContent(lastMessage)}`
        : "";

      return [
        subagent.id,
        subagent.status,
        subagent.messages.length,
        subagent.result ?? "",
        lastMessageSignature,
        subagent.startedAt?.getTime() ?? "",
        subagent.completedAt?.getTime() ?? "",
      ].join(":");
    })
    .join("|");
}
