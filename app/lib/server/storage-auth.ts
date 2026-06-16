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

// Authorized blob name shapes (all rooted at the caller's user hash):
//   uploads: users/{hash}/uploads/{date}/{file}
//   threads: users/{hash}/threads/{threadId}/...
//   designs: users/{hash}/designs/{designId}/revisions/{n}/{exports|source}/{file}
export function isAuthorizedUserBlob(blobName: string, userHash: string) {
  const parts = blobName.split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) return false;

  const [root, hash, kind, ...rest] = parts;
  if (root !== "users" || hash !== userHash) return false;

  switch (kind) {
    case "uploads":
      return rest.length >= 1;
    case "threads":
      return rest.length >= 2;
    case "designs":
      return (
        rest.length >= 5 &&
        rest[1] === "revisions" &&
        (rest[3] === "exports" || rest[3] === "source")
      );
    default:
      return false;
  }
}
