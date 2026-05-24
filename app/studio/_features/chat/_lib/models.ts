export interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

export const MODELS: ModelOption[] = [
  { id: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI" },
];

export const DEFAULT_MODEL_ID = "gpt-5.5";
