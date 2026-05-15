import type { Message } from "@langchain/langgraph-sdk";

export interface ChatInputHandle {
  focus: () => void;
  setPrompt: (prompt: string) => void;
}

export interface GeomExportEntry {
  filename: string;
  url: string;
}

export interface PartEntry {
  name: string;
  script_path: string;
  exports: GeomExportEntry[];
  executed_at: string;
}

export interface TodoItem {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface TexocadGraphState {
  messages: Message[];
  todos?: TodoItem[];
  product?: PartEntry[];
}

export interface CustomProductEvent {
  type: "product";
  parts: PartEntry[];
}

export interface StreamToolCall {
  id: string;
  state: "pending" | "completed" | "error";
  call: {
    name: string;
    id?: string;
    args: Record<string, unknown>;
  };
  result?: unknown;
}

export interface ThreadSummary {
  threadId: string;
  title: string;
  updatedAt: Date;
}
