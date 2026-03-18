import type { Message } from "@langchain/langgraph-sdk";

export interface GeomExportEntry {
  filename: string;
  url: string;
}

export interface TodoItem {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface CadGraphState {
  messages: Message[];
  todos?: TodoItem[];
  exports?: GeomExportEntry[];
}

export interface CustomExportEvent {
  type: "exports";
  exports: GeomExportEntry[];
}
