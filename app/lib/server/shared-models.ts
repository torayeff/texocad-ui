import { createHash, randomBytes } from "node:crypto";
import { AzureNamedKeyCredential, RestError, TableClient } from "@azure/data-tables";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import { absoluteSiteUrl } from "@/app/lib/site";

export interface ShareModelInput {
  designId: string;
  revisionNumber: number;
  name: string;
  exportArtifact: {
    blobName: string;
    checksum: string;
    contentType: string;
    filename: string;
  };
}

export interface SharedModel {
  checksum: string;
  createdAt: string;
  designId: string;
  filename: string;
  modelBlobName: string;
  modelUrl: string;
  name: string;
  revisionNumber: number;
  shareUrl: string;
  slug: string;
}

interface ShareEntity {
  checksum: string;
  createdAt: string;
  designId: string;
  filename: string;
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
const MAX_SHARE_NAME_LENGTH = 80;
const MAX_BLOB_NAME_LENGTH = 1024;
const STEP_CONTENT_TYPE = "application/step";
const SLUG_SAFE_CHARS = /[^a-z0-9-]+/g;
const TABLE_KEY_UNSAFE_CHARS = /[/\\#?\n\r\t]/g;

function parseStorageConnectionString(connectionString: string) {
  const account = connectionString.match(/AccountName=([^;]+)/)?.[1];
  const key = connectionString.match(/AccountKey=([^;]+)/)?.[1];
  const suffix = connectionString.match(/EndpointSuffix=([^;]+)/)?.[1] ?? "core.windows.net";
  if (!account || !key) {
    throw new Error("Cannot parse Azure storage account credentials.");
  }

  return {
    account,
    key,
    blobHost: `${account}.blob.${suffix}`,
    tableUrl: `https://${account}.table.${suffix}`,
  };
}

function storageConfig() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
  const privateContainerName = process.env.AZURE_STORAGE_CONTAINER
    ?? process.env.AZURE_STORAGE_CONTAINER_NAME
    ?? "";
  const publicContainerName = process.env.AZURE_STORAGE_PUBLIC_CONTAINER ?? "";

  if (!connectionString || !privateContainerName || !publicContainerName) {
    throw new Error("Azure storage is not configured.");
  }

  return {
    ...parseStorageConnectionString(connectionString),
    connectionString,
    privateContainerName,
    publicContainerName,
  };
}

function safeTableKey(value: string) {
  return value.trim().replace(TABLE_KEY_UNSAFE_CHARS, "_");
}

function ownerPartitionKey(ownerHash: string) {
  return safeTableKey(ownerHash);
}

function shareRowKey(input: ShareModelInput) {
  return safeTableKey(`${input.designId}:${input.revisionNumber}:${input.exportArtifact.checksum}`);
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
  const base = slugifyName(name) || "model";
  const suffix = randomBytes(4).toString("base64url").toLowerCase().replace(SLUG_SAFE_CHARS, "").slice(0, 6);
  return `${base}-${suffix}`;
}

function extensionFromFilename(filename: string) {
  const extension = filename.toLowerCase().endsWith(".stp") ? ".stp" : ".step";
  return extension;
}

function sharedModelBlobName(slug: string, filename: string) {
  return `${PUBLIC_SHARED_PREFIX}/${slug}/model${extensionFromFilename(filename)}`;
}

function publicBlobUrl(blobName: string) {
  const { blobHost, publicContainerName } = storageConfig();
  return `https://${blobHost}/${publicContainerName}/${blobName}`;
}

function tableClient() {
  const { account, key, tableUrl } = storageConfig();
  return new TableClient(tableUrl, SHARES_TABLE_NAME, new AzureNamedKeyCredential(account, key));
}

function blobServiceClient() {
  return BlobServiceClient.fromConnectionString(storageConfig().connectionString);
}

function privateBlobUrl(blobName: string) {
  const { blobHost, privateContainerName } = storageConfig();
  return `https://${blobHost}/${privateContainerName}/${blobName}`;
}

function privateReadSasUrl(blobName: string) {
  const { key, account, privateContainerName } = storageConfig();
  const credential = new StorageSharedKeyCredential(account, key);
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

function sharedModelFromShare(entity: ShareEntity): SharedModel {
  const modelUrl = publicBlobUrl(entity.modelBlobName);
  return {
    checksum: entity.checksum,
    createdAt: entity.createdAt,
    designId: entity.designId,
    filename: entity.filename,
    modelBlobName: entity.modelBlobName,
    modelUrl,
    name: entity.name,
    revisionNumber: entity.revisionNumber,
    shareUrl: absoluteSiteUrl(`/viewer/${entity.slug}`),
    slug: entity.slug,
  };
}

export function hashUserId(userId: string) {
  return createHash("sha256").update(userId).digest("hex");
}

export function isAuthorizedUserBlob(blobName: string, userHash: string) {
  const [root, hash, kind, , marker, , folder] = blobName.split("/");
  if (root !== "users" || hash !== userHash) return false;

  if (kind === "uploads") return blobName.split("/").length > 3;
  if (kind === "threads") return blobName.split("/").length > 4;
  if (kind !== "designs") return false;

  const parts = blobName.split("/");
  return (
    parts.length >= 8 &&
    marker === "revisions" &&
    (folder === "exports" || folder === "source")
  );
}

export function isStepExport(filename: string, contentType: string) {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith(".step") || lowerFilename.endsWith(".stp") || contentType === STEP_CONTENT_TYPE;
}

export function validateShareName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SHARE_NAME_LENGTH;
}

export function validatePrivateBlobName(blobName: string) {
  return blobName.length > 0 && blobName.length <= MAX_BLOB_NAME_LENGTH && !blobName.startsWith("/");
}

export async function createOrGetSharedModel(userId: string, input: ShareModelInput) {
  const ownerHash = hashUserId(userId);
  const privateBlobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  const ownerKey = ownerPartitionKey(ownerHash);
  const revisionKey = shareRowKey({
    ...input,
    exportArtifact: {
      ...input.exportArtifact,
      blobName: privateBlobName,
    },
  });

  const existingEntity = await getShareEntity(ownerKey, revisionKey);
  if (existingEntity) {
    return {
      alreadyShared: true,
      sharedModel: sharedModelFromShare(existingEntity),
    };
  }

  const client = tableClient();
  await client.createTable();

  const slug = makeSlug(input.name);
  const modelBlobName = sharedModelBlobName(slug, input.exportArtifact.filename);
  const serviceClient = blobServiceClient();
  const publicBlobClient = serviceClient
    .getContainerClient(storageConfig().publicContainerName)
    .getBlobClient(modelBlobName);

  await publicBlobClient.syncCopyFromURL(privateReadSasUrl(privateBlobName));
  await publicBlobClient.setHTTPHeaders({
    blobContentDisposition: `attachment; filename="${input.exportArtifact.filename.replaceAll('"', "")}"`,
    blobContentType: isStepExport(input.exportArtifact.filename, input.exportArtifact.contentType)
      ? STEP_CONTENT_TYPE
      : input.exportArtifact.contentType,
  });

  const entity = {
    partitionKey: ownerKey,
    rowKey: revisionKey,
    checksum: input.exportArtifact.checksum,
    createdAt: new Date().toISOString(),
    designId: input.designId,
    filename: input.exportArtifact.filename,
    modelBlobName,
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
    sharedModel: sharedModelFromShare(entity),
  };
}

export async function getSharedModelForRevision(userId: string, input: Omit<ShareModelInput, "name">) {
  const ownerHash = hashUserId(userId);
  const ownerKey = ownerPartitionKey(ownerHash);
  const revisionKey = shareRowKey({
    ...input,
    name: "",
    exportArtifact: {
      ...input.exportArtifact,
      blobName: input.exportArtifact.blobName.replace(/^\/+/, ""),
    },
  });
  const entity = await getShareEntity(ownerKey, revisionKey);
  return entity ? sharedModelFromShare(entity) : null;
}

export async function getSharedModelBySlug(slug: string) {
  if (slug !== slugifyName(slug)) return null;

  const entity = await getShareEntity(SLUG_PARTITION_KEY, slug);
  return entity ? sharedModelFromShare(entity) : null;
}
