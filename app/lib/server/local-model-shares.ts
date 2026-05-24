import { randomBytes } from "node:crypto";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  type ContainerClient,
} from "@azure/storage-blob";

import {
  contentTypeForLocalModelShare,
  isLocalModelShareExtension,
  isValidLocalModelShareSlug,
  localModelShareFileSizeMessage,
  maxLocalModelShareFileNameChars,
  maxLocalModelShareNameChars,
  maxLocalModelShareUploadBytes,
  normalizeLocalModelShareExtension,
  slugifyLocalModelShareName,
} from "@/app/lib/model-formats";
import { createSharedArtifactForLocalModel } from "@/app/lib/server/shared-models";
import { validateSharedModelBlob } from "@/app/lib/server/local-model-share-validation";
import { publicStorageConfig } from "@/app/lib/server/storage-auth";
import type {
  LocalModelShareFinalizeRequest,
  LocalModelShareUploadRequest,
  LocalModelShareUploadResponse,
  LocalModelShareSuccessResponse,
  LocalModelShareExtension,
} from "@/app/types/local-model-share";

const localSharePrefix = "public/local-shares";
const uploadUrlLifetimeMs = 15 * 60 * 1000;
const createUploadLimit = 10;
const rateLimitWindowMs = 60 * 1000;

export class LocalModelShareError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  __texocadLocalShareRateLimit?: Map<string, RateLimitBucket>;
};
const localShareRateLimit = globalRateLimit.__texocadLocalShareRateLimit ?? new Map<string, RateLimitBucket>();
globalRateLimit.__texocadLocalShareRateLimit = localShareRateLimit;

function checkRateLimit(key: string, limit: number) {
  const now = Date.now();
  if (localShareRateLimit.size > 5000) {
    for (const [bucketKey, bucket] of localShareRateLimit) {
      if (bucket.resetAt <= now) {
        localShareRateLimit.delete(bucketKey);
      }
    }
  }

  const bucket = localShareRateLimit.get(key);
  if (!bucket || bucket.resetAt <= now) {
    localShareRateLimit.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

function randomSuffix() {
  return randomBytes(8).toString("base64url").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
}

function blobNameFor(slug: string, extension: LocalModelShareExtension) {
  return `${localSharePrefix}/${slug}.${extension}`;
}

function getContainerClient() {
  const config = publicStorageConfig();
  return BlobServiceClient.fromConnectionString(config.connectionString).getContainerClient(config.publicContainerName);
}

async function createUploadTarget(
  containerClient: ContainerClient,
  slug: string,
  extension: LocalModelShareExtension,
): Promise<LocalModelShareUploadResponse> {
  const { credential, publicContainerName } = publicStorageConfig();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const uploadSlug = `${slug}-${randomSuffix()}`;
    const blobName = blobNameFor(uploadSlug, extension);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    if (!(await blobClient.exists())) {
      const expiresOn = new Date(Date.now() + uploadUrlLifetimeMs);
      const sas = generateBlobSASQueryParameters(
        {
          blobName,
          containerName: publicContainerName,
          expiresOn,
          permissions: BlobSASPermissions.parse("c"),
          protocol: SASProtocol.Https,
          startsOn: new Date(Date.now() - 5 * 60 * 1000),
        },
        credential,
      ).toString();

      return {
        expiresAt: expiresOn.toISOString(),
        extension,
        slug: uploadSlug,
        uploadUrl: `${blobClient.url}?${sas}`,
      };
    }
  }

  throw new Error("Could not create a unique shared filename.");
}

export async function createLocalModelShareUpload(
  body: LocalModelShareUploadRequest,
  clientIp: string,
) {
  const shareName = body.shareName.trim();
  const slug = slugifyLocalModelShareName(shareName);
  if (!shareName || !slug) {
    throw new LocalModelShareError("Share name is required.", 400);
  }

  if (shareName.length > maxLocalModelShareNameChars) {
    throw new LocalModelShareError("Share name is too long.", 400);
  }

  const fileName = body.fileName;
  if (!fileName || fileName.length > maxLocalModelShareFileNameChars) {
    throw new LocalModelShareError("Invalid model filename.", 400);
  }

  const extension = normalizeLocalModelShareExtension(fileName);
  if (!extension) {
    throw new LocalModelShareError("Unsupported model format for sharing. Use STEP, STP, STL, GLB, or GLTF.", 400);
  }

  if (!Number.isFinite(body.fileSize) || body.fileSize <= 0) {
    throw new LocalModelShareError("Provide a model file to share.", 400);
  }

  if (body.fileSize > maxLocalModelShareUploadBytes) {
    throw new LocalModelShareError(localModelShareFileSizeMessage, 413);
  }

  if (!checkRateLimit(`create:${clientIp}`, createUploadLimit)) {
    throw new LocalModelShareError("Too many share attempts. Try again in a minute.", 429);
  }

  return createUploadTarget(getContainerClient(), slug, extension);
}

export async function finalizeLocalModelShareUpload(
  body: LocalModelShareFinalizeRequest,
): Promise<LocalModelShareSuccessResponse> {
  if (!isValidLocalModelShareSlug(body.slug) || !isLocalModelShareExtension(body.extension)) {
    throw new LocalModelShareError("Invalid share upload request.", 400);
  }

  const shareName = body.shareName.trim();
  if (!shareName || shareName.length > maxLocalModelShareNameChars) {
    throw new LocalModelShareError("Invalid share name.", 400);
  }

  const fileName = body.fileName;
  if (!fileName || fileName.length > maxLocalModelShareFileNameChars) {
    throw new LocalModelShareError("Invalid model filename.", 400);
  }

  const expectedExtension = normalizeLocalModelShareExtension(fileName);
  if (expectedExtension !== body.extension) {
    throw new LocalModelShareError("Model filename does not match the uploaded file type.", 400);
  }

  const containerClient = getContainerClient();
  const blobClient = containerClient.getBlockBlobClient(blobNameFor(body.slug, body.extension));
  const validation = await validateSharedModelBlob(blobClient, body.extension);
  if (!validation.ok) {
    await blobClient.deleteIfExists();
    throw new LocalModelShareError(validation.error, 400);
  }

  await blobClient.setHTTPHeaders({
    blobCacheControl: "public, max-age=31536000, immutable",
    blobContentDisposition: `attachment; filename="${fileName.replaceAll('"', "")}"`,
    blobContentType: contentTypeForLocalModelShare(body.extension),
  });

  const sharedArtifact = await createSharedArtifactForLocalModel({
    artifactBlobName: blobNameFor(body.slug, body.extension),
    checksum: validation.checksum,
    contentType: contentTypeForLocalModelShare(body.extension),
    filename: fileName,
    name: shareName,
  });

  return {
    shareUrl: sharedArtifact.shareUrl,
    slug: sharedArtifact.slug,
  };
}
