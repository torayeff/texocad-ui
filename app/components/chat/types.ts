import type { Message } from "@langchain/langgraph-sdk";

export interface AgentState {
  messages: Message[];
}

export interface GeomExportEvent {
  type: "geom_export";
  filename: string;
  thread_id: string;
}

export function isGeomExportEvent(data: unknown): data is GeomExportEvent {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as GeomExportEvent).type === "geom_export" &&
    "filename" in data &&
    "thread_id" in data
  );
}
