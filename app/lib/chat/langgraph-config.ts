export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

export type AssistantId = "cad" | "sketch" | "lumi";

export const CAD_ASSISTANT_ID = "cad";
export const SKETCH_ASSISTANT_ID = "sketch";
export const LUMI_ASSISTANT_ID = "lumi";

export function isAssistantId(value: unknown): value is AssistantId {
  return value === CAD_ASSISTANT_ID
    || value === SKETCH_ASSISTANT_ID
    || value === LUMI_ASSISTANT_ID;
}

export function assistantIdFromParam(value: string | null | undefined): AssistantId | null {
  return isAssistantId(value) ? value : null;
}
