import type { Message } from "@langchain/langgraph-sdk";

export interface ChatInputHandle {
  focus: () => void;
  setPrompt: (prompt: string) => void;
}

export interface ChatHandle {
  focusInput: () => void;
  submitMessage: (content: string) => boolean;
}

export type ChatMessageType = "human" | "ai";

export interface UploadedFile {
  contentType: string;
  url: string;
  filename: string;
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
  [key: string]: unknown;
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

export interface ToolResultTextBlock {
  type: "text";
  text: string;
}

export interface ToolResultImageBlock {
  type: "image" | "image_url";
  source_type?: "base64" | "url";
  data?: string;
  base64?: string;
  url?: string;
  image_url?: string | { url?: string };
  mime_type?: string;
  mimeType?: string;
}

export interface ToolPreviewImage {
  src: string;
  mimeType: string;
}

export interface ThreadSummary {
  threadId: string;
  title: string;
  updatedAt: Date;
  mode: "cad" | "sketch" | null;
}

export interface AssistantTimer {
  finalize: (rowKey: string) => void;
  getStartedAtMs: (rowKey: string) => number | undefined;
  markStart: (rowKey: string) => void;
  reset: () => void;
  runtimeSecondsByRow: Record<string, number>;
}
