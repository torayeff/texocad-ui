import type { BaseMessage } from "@langchain/core/messages";

export type SubagentStatus = "pending" | "running" | "complete" | "error";

export interface SubagentToolCall {
  args: Record<string, unknown>;
  name: string;
}

export interface SubagentStream {
  id: string;
  status: SubagentStatus;
  toolCall: SubagentToolCall;
  messages: BaseMessage[];
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
}
