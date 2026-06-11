export const LANGGRAPH_API_URL =
  process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

export type AssistantId = "cad" | "sketch" | "lumi" | "forma";

export const CAD_ASSISTANT_ID = "cad";
export const SKETCH_ASSISTANT_ID = "sketch";
export const LUMI_ASSISTANT_ID = "lumi";
export const FORMA_ASSISTANT_ID = "forma";

export function isAssistantId(value: unknown): value is AssistantId {
  return value === CAD_ASSISTANT_ID
    || value === SKETCH_ASSISTANT_ID
    || value === LUMI_ASSISTANT_ID
    || value === FORMA_ASSISTANT_ID;
}

export function isEndToEndAssistantId(value: unknown): value is typeof LUMI_ASSISTANT_ID | typeof FORMA_ASSISTANT_ID {
  return value === LUMI_ASSISTANT_ID || value === FORMA_ASSISTANT_ID;
}

export function assistantIdFromParam(value: string | null | undefined): AssistantId | null {
  return isAssistantId(value) ? value : null;
}

export function assistantDisplayName(assistantId: AssistantId) {
  switch (assistantId) {
    case CAD_ASSISTANT_ID:
      return "CAD";
    case SKETCH_ASSISTANT_ID:
      return "Sketch";
    case LUMI_ASSISTANT_ID:
      return "Lumi";
    case FORMA_ASSISTANT_ID:
      return "Forma";
    default: {
      const exhaustiveAssistantId: never = assistantId;
      return exhaustiveAssistantId;
    }
  }
}
