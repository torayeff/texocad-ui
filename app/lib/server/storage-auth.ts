import { createHash } from "node:crypto";
import { StorageSharedKeyCredential } from "@azure/storage-blob";

export interface PrivateStorageConfig {
  account: string;
  blobHost: string;
  connectionString: string;
  credential: StorageSharedKeyCredential;
  key: string;
  privateContainerName: string;
  tableUrl: string;
}

export interface PublicStorageConfig extends PrivateStorageConfig {
  publicContainerName: string;
}

interface ParsedConnectionString {
  account: string;
  blobHost: string;
  credential: StorageSharedKeyCredential;
  key: string;
  tableUrl: string;
}

function parseStorageConnectionString(connectionString: string): ParsedConnectionString {
  const account = connectionString.match(/AccountName=([^;]+)/)?.[1];
  const key = connectionString.match(/AccountKey=([^;]+)/)?.[1];
  const suffix = connectionString.match(/EndpointSuffix=([^;]+)/)?.[1] ?? "core.windows.net";
  if (!account || !key) {
    throw new Error("Cannot parse Azure storage account credentials.");
  }

  return {
    account,
    blobHost: `${account}.blob.${suffix}`,
    credential: new StorageSharedKeyCredential(account, key),
    key,
    tableUrl: `https://${account}.table.${suffix}`,
  };
}

export function privateStorageConfig(): PrivateStorageConfig {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING ?? "";
  const privateContainerName = process.env.AZURE_STORAGE_CONTAINER
    ?? process.env.AZURE_STORAGE_CONTAINER_NAME
    ?? "";

  if (!connectionString || !privateContainerName) {
    throw new Error("Azure storage is not configured.");
  }

  return {
    ...parseStorageConnectionString(connectionString),
    connectionString,
    privateContainerName,
  };
}

export function publicStorageConfig(): PublicStorageConfig {
  const privateConfig = privateStorageConfig();
  const publicContainerName = process.env.AZURE_STORAGE_PUBLIC_CONTAINER ?? "";

  if (!publicContainerName) {
    throw new Error("Azure public storage is not configured.");
  }

  return {
    ...privateConfig,
    publicContainerName,
  };
}

export function isPrivateBlobStorageConfigured() {
  return Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING &&
    (process.env.AZURE_STORAGE_CONTAINER || process.env.AZURE_STORAGE_CONTAINER_NAME),
  );
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
