export type ViewPreset =
  | "iso"
  | "top"
  | "front"
  | "right"
  | "left"
  | "back"
  | "bottom";

export interface ViewCommand {
  kind: "view" | "fit";
  view?: ViewPreset;
  id: number;
}

export interface ViewerPart {
  name: string;
  stlUrl: string | null;
  downloadUrls: { stl?: string; step?: string; py?: string; "3mf"?: string };
  color: string;
  executedAt: string;
}
