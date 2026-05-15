import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { ulid } from "ulidx";

import {
  hashUserId,
  isPrivateBlobStorageConfigured,
  privateStorageConfig,
} from "@/app/lib/server/storage-auth";

const READ_SAS_EXPIRY_MS = 24 * 60 * 60 * 1000;
const WRITE_SAS_EXPIRY_MS = 15 * 60 * 1000;

const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;
const MAX_FILENAME_LENGTH = 120;

interface ResolvedBlobLookup {
  blobName: string;
  blobUrl: string;
}

export function isBlobStorageConfigured() {
  return isPrivateBlobStorageConfigured();
}

function blobUrlForName(blobName: string) {
  const { blobHost, privateContainerName } = privateStorageConfig();
  return `https://${blobHost}/${privateContainerName}/${blobName}`;
}

export function resolveBlobLookup(blobUrl: string | null, blobNameParam: string | null): ResolvedBlobLookup | null {
  if (blobNameParam) {
    const blobName = blobNameParam.replace(/^\/+/, "");
    return {
      blobName,
      blobUrl: blobUrlForName(blobName),
    };
  }

  if (!blobUrl) {
    return null;
  }

  const { blobHost, privateContainerName } = privateStorageConfig();
  const parsed = new URL(blobUrl);
  if (parsed.host !== blobHost) {
    return null;
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2 || pathParts[0] !== privateContainerName) {
    return null;
  }

  return {
    blobName: pathParts.slice(1).join("/"),
    blobUrl,
  };
}

export function signedReadUrl(blobUrl: string, blobName: string) {
  const { credential, privateContainerName } = privateStorageConfig();
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: privateContainerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(Date.now() + READ_SAS_EXPIRY_MS),
    },
    credential,
  ).toString();

  return `${blobUrl}?${sasToken}`;
}

export function isSafeUploadFilename(filename: string) {
  return filename.length <= MAX_FILENAME_LENGTH && SAFE_FILENAME.test(filename);
}

export function createUploadBlobName(userId: string, filename: string) {
  const dotIdx = filename.lastIndexOf(".");
  const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
  const ext = dotIdx > 0 ? filename.slice(dotIdx) : "";
  const date = new Date().toISOString().slice(0, 10);
  return `users/${hashUserId(userId)}/uploads/${date}/${base}_${ulid()}${ext}`;
}

export function signedUploadUrl(blobName: string) {
  const { credential, blobHost, privateContainerName } = privateStorageConfig();
  const blobUrl = `https://${blobHost}/${privateContainerName}/${blobName}`;
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: privateContainerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      expiresOn: new Date(Date.now() + WRITE_SAS_EXPIRY_MS),
    },
    credential,
  ).toString();

  return {
    blobUrl,
    sasUrl: `${blobUrl}?${sasToken}`,
  };
}
