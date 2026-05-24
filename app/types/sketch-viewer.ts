export type SketchSource = {
  kind: "url";
  url: string;
  label: string;
};

export interface SketchMaskEditRequest {
  prompt: string;
  mask: File;
}

export interface SketchMaskComposerState {
  canSubmit: boolean;
  clear: () => void;
  close: () => void;
  error: string | null;
  isSubmitting: boolean;
  submit: (prompt: string) => Promise<void>;
}

export interface SketchRevisionOption {
  key: string;
  revisionNumber: number;
  filename: string | null;
  canView: boolean;
  thumbnailUrl: string | null;
}

import type { ShareExportArtifact, ShareRevision } from "@/app/types/share-artifact";

export type ShareSketchArtifact = ShareExportArtifact;
export type ShareSketchRevision = ShareRevision;
