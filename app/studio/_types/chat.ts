import type {
  Message as SDKMessage,
  AIMessage as SDKAIMessage,
  HumanMessage as SDKHumanMessage,
  ToolMessage as SDKToolMessage,
  DefaultToolCall,
} from "@langchain/langgraph-sdk";

import type {
  ToolCallWithResult as SDKToolCallWithResult,
  ToolCallState,
  SubagentStreamInterface as SDKSubagentStreamInterface,
  SubagentStatus,
  UseDeepAgentStream,
  DeepAgentTypeConfigLike,
  AgentTypeConfigLike,
} from "@langchain/langgraph-sdk/react";

export type Message = SDKMessage;
export type AIMessage = SDKAIMessage;
export type HumanMessage = SDKHumanMessage;
export type ToolMessage = SDKToolMessage;
export type ToolCallWithResult = SDKToolCallWithResult;
export type SubagentStreamInterface = SDKSubagentStreamInterface;

export type { DefaultToolCall, ToolCallState, SubagentStatus };

export interface GeomExportEvent {
  type: "geom_export";
  filename: string;
  thread_id: string;
  url: string;
}

export interface TodoItem {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export type AgentState = {
  messages: SDKMessage[];
  todos?: TodoItem[];
  [key: string]: unknown;
};

/**
 * Phantom type that tells `useStream`'s type resolver our backend
 * is a LangGraph DeepAgent deployment, enabling deep-agent options
 * (`filterSubagentMessages`) and return types (`getSubagentsByMessage`, etc.).
 */
export interface DeepAgentType {
  "~deepAgentTypes": DeepAgentTypeConfigLike & {
    Subagents: unknown;
  };
  "~agentTypes": AgentTypeConfigLike & {
    State: AgentState;
    Tools: never[];
  };
}

export type DeepAgentStream = UseDeepAgentStream<AgentState>;
