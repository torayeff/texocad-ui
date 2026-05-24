import type { ShareKind } from "@/app/lib/server/shared-model-validation";

export interface SharedArtifact {
  artifactBlobName: string;
  artifactUrl: string;
  checksum: string;
  createdAt: string;
  designId: string;
  filename: string;
  kind: ShareKind;
  name: string;
  revisionNumber: number;
  shareUrl: string;
  slug: string;
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
  revisionNumber: number;
  slug: string;
}
