export type ModelSource =
  | {
    kind: "url";
    url: string;
    label: string;
  }
  | {
    kind: "file";
    file: File;
    label: string;
  };

export type ModelFormat = "step" | "stl" | "glb";

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

export interface ViewerRevisionOption {
  key: string;
  revisionNumber: number;
  filename: string | null;
  canView: boolean;
}

export interface ShareModelArtifact {
  filename: string;
  blobName: string;
  contentType: string;
  checksum: string;
}

export interface ShareRevision {
  designId: string;
  exportArtifact: ShareModelArtifact;
  revisionNumber: number;
}
