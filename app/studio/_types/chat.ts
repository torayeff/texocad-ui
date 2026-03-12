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

export interface HydratedHistory {
  messages: ChatMessage[];
  customEvents: Record<string, unknown>[];
}

export interface NormalizedHistoryEvent {
  name: string;
  payload: Record<string, unknown>;
}

export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}
