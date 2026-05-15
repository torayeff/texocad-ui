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
