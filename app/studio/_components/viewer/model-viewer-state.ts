export type LoadState = "idle" | "loading" | "ready" | "error";
export type TransformMode = "translate" | "rotate" | null;
export type ViewPreset = "iso" | "front" | "back" | "top" | "bottom" | "left" | "right";

export interface LoadProgress {
  label: string;
  percent: number;
}

export interface ModelBrowserNode {
  id: string;
  label: string;
  children?: ModelBrowserNode[];
}

export const viewPresets: ViewPreset[] = ["iso", "front", "back", "top", "bottom", "left", "right"];

export const viewLabels: Record<ViewPreset, string> = {
  iso: "Iso",
  front: "Front",
  back: "Back",
  top: "Top",
  bottom: "Bottom",
  left: "Left",
  right: "Right",
};

export const initialStatus = "Choose a model URL or local file to load.";
