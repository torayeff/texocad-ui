import {
  createShareEntities,
  getShareEntity,
  ownerPartitionKey,
  shareRowKey,
  sharedArtifactFromShare,
  SLUG_PARTITION_KEY,
} from "@/app/lib/server/shared-artifact-store";
import {
  copyPrivateArtifactToPublic,
  sharedArtifactBlobName,
  sharedRelatedArtifactBlobName,
} from "@/app/lib/server/shared-artifact-storage";
import { makeShareSlug, slugifyShareName } from "@/app/lib/server/shared-artifact-slugs";
import { hashUserId } from "@/app/lib/server/storage-auth";
import type { ShareArtifactInput } from "@/app/lib/server/shared-artifact-validation";
import type { ShareEntity } from "@/app/lib/server/shared-artifact-types";

export async function createOrGetSharedArtifact(userId: string, input: ShareArtifactInput) {
  const ownerHash = hashUserId(userId);
  const kind = input.kind ?? "model";
  const privateBlobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  const ownerKey = ownerPartitionKey(ownerHash);
  const revisionKey = shareRowKey({
    ...input,
    kind,
    exportArtifact: {
      ...input.exportArtifact,
      blobName: privateBlobName,
    },
  });

  const existingEntity = await getShareEntity(ownerKey, revisionKey);
  if (existingEntity) {
    return {
      alreadyShared: true,
      sharedArtifact: sharedArtifactFromShare(existingEntity),
    };
  }

  const slug = makeShareSlug(input.name);
  const artifactBlobName = sharedArtifactBlobName(kind, slug, input.exportArtifact.filename);
  const relatedArtifacts = input.relatedArtifacts ?? [];
  const relatedPublicArtifacts = relatedArtifacts.map((artifact) => ({
    artifact,
    artifactBlobName: sharedRelatedArtifactBlobName(slug, artifact.filename),
  }));
  await copyPrivateArtifactToPublic({
    artifactBlobName,
    exportArtifact: input.exportArtifact,
    kind,
    privateBlobName,
  });
  await Promise.all(
    relatedPublicArtifacts.map(({ artifact, artifactBlobName: relatedArtifactBlobName }) => copyPrivateArtifactToPublic({
      artifactBlobName: relatedArtifactBlobName,
      exportArtifact: artifact,
      kind: "sketch",
      privateBlobName: artifact.blobName.replace(/^\/+/, ""),
    })),
  );

  const entity = {
    partitionKey: ownerKey,
    rowKey: revisionKey,
    checksum: input.exportArtifact.checksum,
    createdAt: new Date().toISOString(),
    designId: input.designId,
    filename: input.exportArtifact.filename,
    kind,
    artifactBlobName,
    modelBlobName: artifactBlobName,
    name: input.name.trim(),
    ownerHash,
    privateBlobName,
    relatedArtifactsJson: JSON.stringify(relatedPublicArtifacts.map(({ artifact, artifactBlobName: relatedArtifactBlobName }) => ({
      artifactBlobName: relatedArtifactBlobName,
      checksum: artifact.checksum,
      contentType: artifact.contentType,
      filename: artifact.filename,
    }))),
    revisionNumber: input.revisionNumber,
    slug,
  };
  const slugEntity = {
    ...entity,
    partitionKey: SLUG_PARTITION_KEY,
    rowKey: slug,
  };

  await createShareEntities(entity, slugEntity);

  return {
    alreadyShared: false,
    sharedArtifact: sharedArtifactFromShare(entity),
  };
}

export async function createSharedArtifactForLocalModel(input: {
  artifactBlobName: string;
  checksum: string;
  contentType: string;
  filename: string;
  name: string;
}) {
  const slug = makeShareSlug(input.name);
  const entity: ShareEntity & { partitionKey: string; rowKey: string } = {
    partitionKey: SLUG_PARTITION_KEY,
    rowKey: slug,
    checksum: input.checksum,
    createdAt: new Date().toISOString(),
    designId: `local:${slug}`,
    filename: input.filename,
    kind: "model",
    artifactBlobName: input.artifactBlobName,
    modelBlobName: input.artifactBlobName,
    name: input.name.trim(),
    ownerHash: "local",
    privateBlobName: input.artifactBlobName,
    revisionNumber: 1,
    slug,
  };

  await createShareEntities(entity);

  return sharedArtifactFromShare(entity);
}

export async function getSharedArtifactForRevision(userId: string, input: Omit<ShareArtifactInput, "name">) {
  const ownerHash = hashUserId(userId);
  const kind = input.kind ?? "model";
  const ownerKey = ownerPartitionKey(ownerHash);
  const revisionKey = shareRowKey({
    ...input,
    kind,
    name: "",
    exportArtifact: {
      ...input.exportArtifact,
      blobName: input.exportArtifact.blobName.replace(/^\/+/, ""),
    },
  });
  const entity = await getShareEntity(ownerKey, revisionKey);
  return entity ? sharedArtifactFromShare(entity) : null;
}

export async function getSharedArtifactBySlug(slug: string) {
  if (slug !== slugifyShareName(slug)) return null;

  const entity = await getShareEntity(SLUG_PARTITION_KEY, slug);
  return entity ? sharedArtifactFromShare(entity) : null;
}
