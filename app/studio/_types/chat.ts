import type { Message } from "@langchain/langgraph-sdk";

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

export interface GeomExportEntry {
  filename: string;
  url: string;
}

export interface CadGraphState {
  messages: Message[];
  todos?: TodoItem[];
  exports?: GeomExportEntry[];
}

