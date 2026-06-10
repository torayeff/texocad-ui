export interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

export type ReasoningEffortId = "none" | "low" | "medium" | "high" | "xhigh";

export interface ReasoningEffortOption {
  id: ReasoningEffortId;
  label: string;
  description: string;
}

export const MODELS: ModelOption[] = [
  { id: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI" },
];

export const DEFAULT_MODEL_ID = "gpt-5.5";

export const REASONING_EFFORTS: ReasoningEffortOption[] = [
  { id: "none", label: "None", description: "Fastest responses" },
  { id: "low", label: "Low", description: "Light reasoning" },
  { id: "medium", label: "Medium", description: "Balanced reasoning" },
  { id: "high", label: "High", description: "Deeper reasoning" },
  { id: "xhigh", label: "XHigh", description: "Maximum reasoning" },
];

export const DEFAULT_REASONING_EFFORT_ID: ReasoningEffortId = "low";
export const DEFAULT_FREE_REASONING_EFFORT_ID: ReasoningEffortId = "low";

const FREE_REASONING_EFFORT_IDS = new Set<ReasoningEffortId>(["none", "low"]);

// What unlocks the locked reasoning efforts for the current user.
export type ReasoningUpsell = "sign-in" | "upgrade";

export function reasoningEffortsForAccess(hasAdvancedReasoning: boolean) {
  if (hasAdvancedReasoning) return REASONING_EFFORTS;
  return REASONING_EFFORTS.filter((effort) => FREE_REASONING_EFFORT_IDS.has(effort.id));
}

export function lockedReasoningEffortsForAccess(hasAdvancedReasoning: boolean) {
  if (hasAdvancedReasoning) return [];
  return REASONING_EFFORTS.filter((effort) => !FREE_REASONING_EFFORT_IDS.has(effort.id));
}

export function isReasoningEffortAllowed(
  effortId: ReasoningEffortId,
  hasAdvancedReasoning: boolean,
) {
  return hasAdvancedReasoning || FREE_REASONING_EFFORT_IDS.has(effortId);
}
