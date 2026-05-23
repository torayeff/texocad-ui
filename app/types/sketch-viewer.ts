export type SketchSource = {
  kind: "url";
  url: string;
  label: string;
};

export interface SketchRevisionOption {
  key: string;
  revisionNumber: number;
  filename: string | null;
  canView: boolean;
  thumbnailUrl: string | null;
}

export interface ShareSketchArtifact {
  filename: string;
  blobName: string;
  contentType: string;
  checksum: string;
}

export interface ShareSketchRevision {
  designId: string;
  exportArtifact: ShareSketchArtifact;
  revisionNumber: number;
}
