export interface ShareExportArtifact {
  blobName: string;
  checksum: string;
  contentType: string;
  filename: string;
}

export interface ShareRevision {
  designId: string;
  exportArtifact: ShareExportArtifact;
  relatedArtifacts?: ShareExportArtifact[];
  revisionNumber: number;
}

export interface ShareResponse {
  alreadyShared?: boolean;
  sharedArtifact?: SharedArtifactResult;
}

export interface SharedArtifactResult {
  shareUrl: string;
  slug: string;
}
