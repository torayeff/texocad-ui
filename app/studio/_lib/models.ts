export interface ModelOption {
  id: string;
  label: string;
  provider: string;
}

export const MODELS: ModelOption[] = [
  { id: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI" },
  // { id: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "Anthropic" },
  // { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "Google" },
];

export const DEFAULT_MODEL_ID = "gpt-5.5";
