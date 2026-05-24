import { randomBytes } from "node:crypto";
import { AzureNamedKeyCredential, RestError, TableClient } from "@azure/data-tables";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

import { absoluteSiteUrl } from "@/app/lib/site";
import {
  publicStorageConfig,
  hashUserId,
} from "@/app/lib/server/storage-auth";
import { isStepExport, STEP_CONTENT_TYPE } from "@/app/lib/server/shared-model-validation";
import type { ShareArtifactInput, ShareKind, ShareModelInput } from "@/app/lib/server/shared-model-validation";
export {
  parseShareInput,
  parseShareRevisionInput,
  validateShareBlob,
  validateShareName,
} from "@/app/lib/server/shared-model-validation";

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

interface ShareEntity {
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

const SHARES_TABLE_NAME = "texocadshares";
const SLUG_PARTITION_KEY = "slug";
const PUBLIC_SHARED_PREFIX = "public/shared";
const READ_SAS_EXPIRY_MS = 10 * 60 * 1000;
const SLUG_SAFE_CHARS = /[^a-z0-9-]+/g;
const TABLE_KEY_UNSAFE_CHARS = /[/\\#?\n\r\t]/g;

function safeTableKey(value: string) {
  return value.trim().replace(TABLE_KEY_UNSAFE_CHARS, "_");
}

function ownerPartitionKey(ownerHash: string) {
  return safeTableKey(ownerHash);
}

function shareRowKey(input: ShareModelInput) {
  return safeTableKey(`${input.kind ?? "model"}:${input.designId}:${input.revisionNumber}:${input.exportArtifact.checksum}`);
}

function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(SLUG_SAFE_CHARS, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .replace(/^-|-$/g, "");
}

function makeSlug(name: string) {
  const base = slugifyName(name) || "share";
  const suffix = randomBytes(4).toString("base64url").toLowerCase().replace(SLUG_SAFE_CHARS, "").slice(0, 6);
  return `${base}-${suffix}`;
}

function extensionFromFilename(filename: string) {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".stp")) return ".stp";
  if (lowerFilename.endsWith(".step")) return ".step";
  if (lowerFilename.endsWith(".jpg")) return ".jpg";
  if (lowerFilename.endsWith(".jpeg")) return ".jpeg";
  if (lowerFilename.endsWith(".webp")) return ".webp";
  if (lowerFilename.endsWith(".png")) return ".png";
  return ".step";
}

function sharedArtifactBlobName(kind: ShareKind, slug: string, filename: string) {
  return `${PUBLIC_SHARED_PREFIX}/${slug}/${kind}${extensionFromFilename(filename)}`;
}

function shareContentType(kind: ShareKind, artifact: ShareArtifactInput) {
  switch (kind) {
    case "model":
      return isStepExport(artifact.filename, artifact.contentType)
        ? STEP_CONTENT_TYPE
        : artifact.contentType;
    case "sketch":
      return artifact.contentType;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function publicBlobUrl(blobName: string) {
  const { blobHost, publicContainerName } = publicStorageConfig();
  return `https://${blobHost}/${publicContainerName}/${blobName}`;
}

function tableClient() {
  const { account, key, tableUrl } = publicStorageConfig();
  return new TableClient(tableUrl, SHARES_TABLE_NAME, new AzureNamedKeyCredential(account, key));
}

function blobServiceClient() {
  return BlobServiceClient.fromConnectionString(publicStorageConfig().connectionString);
}

function privateBlobUrl(blobName: string) {
  const { blobHost, privateContainerName } = publicStorageConfig();
  return `https://${blobHost}/${privateContainerName}/${blobName}`;
}

function privateReadSasUrl(blobName: string) {
  const { credential, privateContainerName } = publicStorageConfig();
  const sasToken = generateBlobSASQueryParameters(
    {
      blobName,
      containerName: privateContainerName,
      expiresOn: new Date(Date.now() + READ_SAS_EXPIRY_MS),
      permissions: BlobSASPermissions.parse("r"),
    },
    credential,
  ).toString();

  return `${privateBlobUrl(blobName)}?${sasToken}`;
}

function isRestNotFound(error: unknown) {
  return error instanceof RestError && error.statusCode === 404;
}

async function getShareEntity(partitionKey: string, rowKey: string) {
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

function sharedArtifactFromShare(entity: ShareEntity): SharedArtifact {
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
    revisionNumber: entity.revisionNumber,
    shareUrl: absoluteSiteUrl(`/viewer/${entity.slug}`),
    slug: entity.slug,
  };
}

export async function createOrGetSharedArtifact(userId: string, input: ShareModelInput) {
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

  const client = tableClient();
  await client.createTable();

  const slug = makeSlug(input.name);
  const artifactBlobName = sharedArtifactBlobName(kind, slug, input.exportArtifact.filename);
  const serviceClient = blobServiceClient();
  const publicBlobClient = serviceClient
    .getContainerClient(publicStorageConfig().publicContainerName)
    .getBlobClient(artifactBlobName);

  await publicBlobClient.syncCopyFromURL(privateReadSasUrl(privateBlobName));
  await publicBlobClient.setHTTPHeaders({
    blobContentDisposition: `attachment; filename="${input.exportArtifact.filename.replaceAll('"', "")}"`,
    blobContentType: shareContentType(kind, input.exportArtifact),
  });

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
    revisionNumber: input.revisionNumber,
    slug,
  };
  const slugEntity = {
    ...entity,
    partitionKey: SLUG_PARTITION_KEY,
    rowKey: slug,
  };

  await Promise.all([
    client.createEntity<ShareEntity>(entity),
    client.createEntity<ShareEntity>(slugEntity),
  ]);

  return {
    alreadyShared: false,
    sharedArtifact: sharedArtifactFromShare(entity),
  };
}

export async function getSharedArtifactForRevision(userId: string, input: Omit<ShareModelInput, "name">) {
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
  if (slug !== slugifyName(slug)) return null;

  const entity = await getShareEntity(SLUG_PARTITION_KEY, slug);
  return entity ? sharedArtifactFromShare(entity) : null;
}

export const createOrGetSharedModel = createOrGetSharedArtifact;
export const getSharedModelForRevision = getSharedArtifactForRevision;
export const getSharedModelBySlug = getSharedArtifactBySlug;
