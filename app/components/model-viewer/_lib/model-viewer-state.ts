import type { ViewPreset } from "@/app/types/model-viewer";

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
