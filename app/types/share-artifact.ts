export interface ShareExportArtifact {
  blobName: string;
  checksum: string;
  contentType: string;
  filename: string;
}

export interface ShareRevision {
  designId: string;
  exportArtifact: ShareExportArtifact;
  revisionNumber: number;
}

export interface ShareResponse {
  sharedArtifact?: SharedArtifactResult;
}

export interface SharedArtifactResult {
  shareUrl: string;
  slug: string;
}
