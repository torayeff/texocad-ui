import type { ShareKind } from "@/app/lib/server/shared-artifact-validation";

export interface SharedArtifact {
  artifactBlobName: string;
  artifactUrl: string;
  checksum: string;
  createdAt: string;
  designId: string;
  filename: string;
  kind: ShareKind;
  name: string;
  relatedArtifacts: SharedRelatedArtifact[];
  revisionNumber: number;
  shareUrl: string;
  slug: string;
}

export interface SharedRelatedArtifact {
  artifactBlobName: string;
  artifactUrl: string;
  checksum: string;
  contentType: string;
  filename: string;
}

export interface ShareEntity {
  artifactBlobName?: string;
  checksum: string;
  createdAt: string;
  designId: string;
  filename: string;
  kind?: ShareKind;
  modelBlobName: string;
  name: string;
  ownerHash: string;
  privateBlobName: string;
  relatedArtifactsJson?: string;
  revisionNumber: number;
  slug: string;
}
