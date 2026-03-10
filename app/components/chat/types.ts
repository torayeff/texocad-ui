export type ToolCallState = "pending" | "completed" | "error";

export interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  state: ToolCallState;
}

export interface ChatMessage {
  id: string;
  role: "human" | "ai";
  content: string;
  thinking?: string;
  toolCalls: ToolCallInfo[];
}

export interface GeomExportEvent {
  type: "geom_export";
  filename: string;
  thread_id: string;
  url: string;
}

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
