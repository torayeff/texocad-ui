import { AzureNamedKeyCredential, RestError, TableClient } from "@azure/data-tables";

import { absoluteSiteUrl } from "@/app/lib/site";
import { publicBlobUrl } from "@/app/lib/server/shared-artifact-storage";
import { safeTableKey } from "@/app/lib/server/shared-artifact-slugs";
import { publicStorageConfig } from "@/app/lib/server/storage-auth";
import type { ShareArtifactInput } from "@/app/lib/server/shared-artifact-validation";
import type { ShareEntity, SharedArtifact, SharedRelatedArtifact } from "@/app/lib/server/shared-artifact-types";

export const SLUG_PARTITION_KEY = "slug";

const SHARES_TABLE_NAME = "texocadshares";

function tableClient() {
  const { account, key, tableUrl } = publicStorageConfig();
  return new TableClient(tableUrl, SHARES_TABLE_NAME, new AzureNamedKeyCredential(account, key));
}

function isRestNotFound(error: unknown) {
  return error instanceof RestError && error.statusCode === 404;
}

export function ownerPartitionKey(ownerHash: string) {
  return safeTableKey(ownerHash);
}

export function shareRowKey(input: ShareArtifactInput) {
  return safeTableKey(`${input.kind ?? "model"}:${input.designId}:${input.revisionNumber}:${input.exportArtifact.checksum}`);
}

export async function getShareEntity(partitionKey: string, rowKey: string) {
  const client = tableClient();
  try {
    return await client.getEntity<ShareEntity>(partitionKey, rowKey);
  } catch (error) {
    if (isRestNotFound(error)) return null;
    throw error;
  }
}

function getEntityArtifactBlobName(entity: ShareEntity) {
  return entity.artifactBlobName ?? entity.modelBlobName;
}

function relatedArtifactsFromEntity(entity: ShareEntity): SharedRelatedArtifact[] {
  if (!entity.relatedArtifactsJson) return [];
  try {
    const parsed = JSON.parse(entity.relatedArtifactsJson) as Omit<SharedRelatedArtifact, "artifactUrl">[];
    return parsed.map((artifact) => ({
      ...artifact,
      artifactUrl: publicBlobUrl(artifact.artifactBlobName),
    }));
  } catch {
    return [];
  }
}

export function sharedArtifactFromShare(entity: ShareEntity): SharedArtifact {
  const artifactBlobName = getEntityArtifactBlobName(entity);
  const artifactUrl = publicBlobUrl(artifactBlobName);
  return {
    artifactBlobName,
    artifactUrl,
    checksum: entity.checksum,
    createdAt: entity.createdAt,
    designId: entity.designId,
    filename: entity.filename,
    kind: entity.kind ?? "model",
    name: entity.name,
    relatedArtifacts: relatedArtifactsFromEntity(entity),
    revisionNumber: entity.revisionNumber,
    shareUrl: absoluteSiteUrl(`/viewer/${entity.slug}`),
    slug: entity.slug,
  };
}

export async function createShareEntities(
  entity: ShareEntity & { partitionKey: string; rowKey: string },
  slugEntity?: ShareEntity & { partitionKey: string; rowKey: string },
) {
  const client = tableClient();
  await client.createTable();

  if (!slugEntity) {
    await client.createEntity<ShareEntity>(entity);
    return;
  }

  await Promise.all([
    client.createEntity<ShareEntity>(entity),
    client.createEntity<ShareEntity>(slugEntity),
  ]);
}
