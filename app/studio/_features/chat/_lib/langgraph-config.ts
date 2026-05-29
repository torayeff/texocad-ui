export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

export type StudioAssistantId = "cad" | "sketch";

export const CAD_ASSISTANT_ID = "cad";
export const SKETCH_ASSISTANT_ID = "sketch";

export function isStudioAssistantId(value: unknown): value is StudioAssistantId {
  return value === CAD_ASSISTANT_ID || value === SKETCH_ASSISTANT_ID;
}

export function studioAssistantIdFromParam(value: string | null | undefined): StudioAssistantId | null {
  return isStudioAssistantId(value) ? value : null;
}
