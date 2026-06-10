export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

// Header carrying the signed anonymous-session token to the LangGraph API
// (cross-origin, so the same-site cookie cannot be used there).
export const ANONYMOUS_SESSION_HEADER = "x-texocad-anonymous-session";

export type AssistantId = "cad" | "sketch" | "lumi";
export type StudioAssistantId = "cad" | "sketch";

export const CAD_ASSISTANT_ID = "cad";
export const SKETCH_ASSISTANT_ID = "sketch";
export const LUMI_ASSISTANT_ID = "lumi";

export function isStudioAssistantId(value: unknown): value is StudioAssistantId {
  return value === CAD_ASSISTANT_ID || value === SKETCH_ASSISTANT_ID;
}

export function isAssistantId(value: unknown): value is AssistantId {
  return isStudioAssistantId(value) || value === LUMI_ASSISTANT_ID;
}

export function studioAssistantIdFromParam(value: string | null | undefined): StudioAssistantId | null {
  return isStudioAssistantId(value) ? value : null;
}
