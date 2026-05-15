export interface StoredBlobArtifact {
  filename: string;
  blobName: string;
  contentType: string;
  checksum: string;
}

export interface DesignRevisionArtifact {
  type: "texocad.design_revision";
  designId: string;
  revisionNumber: number;
  source: StoredBlobArtifact;
  exports: StoredBlobArtifact[];
  createdByThreadId: string;
  createdByRunId?: string;
}
