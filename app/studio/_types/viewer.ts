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
