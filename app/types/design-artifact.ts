export interface StoredBlobArtifact {
  filename: string;
  blobName: string;
  contentType: string;
  checksum: string;
}

interface BaseRevisionArtifact {
  designId: string;
  revisionNumber: number;
  source: StoredBlobArtifact;
  exports: StoredBlobArtifact[];
  renders?: StoredBlobArtifact[];
  createdByThreadId: string;
  createdByRunId?: string;
}

export interface DesignRevisionArtifact extends BaseRevisionArtifact {
  type: "texocad.design_revision";
}

export interface SketchRevisionArtifact extends BaseRevisionArtifact {
  type: "texocad.sketch_revision";
}

export interface ModelRevisionArtifact extends BaseRevisionArtifact {
  type: "texocad.model_revision";
}

export type TexocadRevisionArtifact =
  | DesignRevisionArtifact
  | SketchRevisionArtifact
  | ModelRevisionArtifact;
