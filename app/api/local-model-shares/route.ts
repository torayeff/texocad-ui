import { randomBytes } from "node:crypto";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  type ContainerClient,
} from "@azure/storage-blob";
import { NextResponse } from "next/server";

import { createSharedArtifactForLocalModel } from "@/app/lib/server/shared-models";
import { publicStorageConfig } from "@/app/lib/server/storage-auth";
import {
  contentTypeForLocalModelShare,
  isValidLocalModelShareSlug,
  localModelShareExtensions,
  maxLocalModelShareApiBodyBytes,
  maxLocalModelShareFileNameChars,
  maxLocalModelShareNameChars,
  maxLocalModelShareUploadBytes,
  normalizeLocalModelShareExtension,
  slugifyLocalModelShareName,
  type LocalModelShareApiRequest,
  type LocalModelShareErrorResponse,
  type LocalModelShareExtension,
  type LocalModelShareFinalizeRequest,
  type LocalModelShareUploadResponse,
} from "@/app/types/local-model-share";

export const runtime = "nodejs";

const localSharePrefix = "public/local-shares";
const uploadUrlLifetimeMs = 15 * 60 * 1000;
const validationSampleBytes = 64 * 1024;
const createUploadLimit = 10;
const rateLimitWindowMs = 60 * 1000;

class LocalShareValidationError extends Error { }

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  __texocadLocalShareRateLimit?: Map<string, RateLimitBucket>;
};
const localShareRateLimit = globalRateLimit.__texocadLocalShareRateLimit ?? new Map<string, RateLimitBucket>();
globalRateLimit.__texocadLocalShareRateLimit = localShareRateLimit;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message } satisfies LocalModelShareErrorResponse, { status });
}

function clientIpForRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

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

function isLocalModelShareExtension(value: unknown): value is LocalModelShareExtension {
  return typeof value === "string" && localModelShareExtensions.includes(value as LocalModelShareExtension);
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

async function readRequestBody(request: Request): Promise<LocalModelShareApiRequest | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  const text = await request.text();
  if (!text || text.length > maxLocalModelShareApiBodyBytes) {
    return null;
  }

  try {
    return JSON.parse(text) as LocalModelShareApiRequest;
  } catch {
    return null;
  }
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

function textFromBuffer(buffer: Buffer) {
  return buffer.toString("utf8").replace(/\0/g, "");
}

function isAsciiStep(sample: Buffer) {
  const text = textFromBuffer(sample).toUpperCase();
  return text.includes("ISO-10303-21") && text.includes("HEADER;");
}

function isBinaryStl(sample: Buffer, size: number) {
  if (sample.byteLength < 84 || size < 84) {
    return false;
  }

  const triangleCount = sample.readUInt32LE(80);
  return 84 + triangleCount * 50 === size;
}

function isAsciiStl(sample: Buffer) {
  const text = textFromBuffer(sample).trimStart().toLowerCase();
  return text.startsWith("solid") && (text.includes("facet") || text.includes("endsolid"));
}

function isGlb(sample: Buffer, size: number) {
  if (sample.byteLength < 12) {
    return false;
  }

  return sample.toString("utf8", 0, 4) === "glTF" && sample.readUInt32LE(4) === 2 && sample.readUInt32LE(8) === size;
}

function isGltf(sample: Buffer) {
  const text = textFromBuffer(sample).trimStart();
  return text.startsWith("{") && text.includes("\"asset\"") && text.includes("\"version\"");
}

function hasBlockedGltfUri(item: unknown) {
  if (!item || typeof item !== "object" || !("uri" in item)) {
    return false;
  }

  const uri = (item as { uri?: unknown }).uri;
  return typeof uri === "string" && Boolean(uri) && !uri.startsWith("data:");
}

function hasExternalGltfResources(buffer: Buffer) {
  const gltf = JSON.parse(textFromBuffer(buffer)) as {
    buffers?: unknown[];
    images?: unknown[];
  };

  return gltf.buffers?.some(hasBlockedGltfUri) === true || gltf.images?.some(hasBlockedGltfUri) === true;
}

async function validateSharedModelBlob(
  containerClient: ContainerClient,
  slug: string,
  extension: LocalModelShareExtension,
): Promise<{ checksum: string; ok: true } | { error: string; ok: false }> {
  const blobClient = containerClient.getBlockBlobClient(blobNameFor(slug, extension));

  if (!(await blobClient.exists())) {
    return { error: "Uploaded model was not found.", ok: false };
  }

  const properties = await blobClient.getProperties();
  const checksum = properties.etag;
  if (!checksum) {
    return { error: "Uploaded model could not be validated.", ok: false };
  }

  const size = properties.contentLength ?? 0;
  if (size <= 0 || size > maxLocalModelShareUploadBytes) {
    return { error: "Model files must be 100 MB or smaller.", ok: false };
  }

  const sample = await blobClient.downloadToBuffer(0, Math.min(size, validationSampleBytes));
  const ok = await (async () => {
    switch (extension) {
      case "step":
        return isAsciiStep(sample);
      case "stl":
        return isBinaryStl(sample, size) || isAsciiStl(sample);
      case "glb":
        return isGlb(sample, size);
      case "gltf":
        if (!isGltf(sample)) {
          return false;
        }

        try {
          return !hasExternalGltfResources(await blobClient.downloadToBuffer(0, size));
        } catch {
          return false;
        }
      default: {
        const unhandledExtension: never = extension;
        throw new Error(`Unhandled model extension: ${String(unhandledExtension)}`);
      }
    }
  })();

  return ok ? { checksum, ok: true } : { error: "Uploaded file does not look like a valid model for its extension.", ok: false };
}

async function finalizeUpload(body: LocalModelShareFinalizeRequest) {
  if (!isValidLocalModelShareSlug(body.slug) || !isLocalModelShareExtension(body.extension)) {
    return jsonError("Invalid share upload request.", 400);
  }

  const shareName = typeof body.shareName === "string" ? body.shareName.trim() : "";
  if (!shareName || shareName.length > maxLocalModelShareNameChars) {
    return jsonError("Invalid share name.", 400);
  }

  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  if (!fileName || fileName.length > maxLocalModelShareFileNameChars) {
    return jsonError("Invalid model filename.", 400);
  }

  const expectedExtension = normalizeLocalModelShareExtension(fileName);
  if (expectedExtension !== body.extension) {
    return jsonError("Model filename does not match the uploaded file type.", 400);
  }

  const containerClient = getContainerClient();
  const blobClient = containerClient.getBlockBlobClient(blobNameFor(body.slug, body.extension));
  const validation = await validateSharedModelBlob(containerClient, body.slug, body.extension);
  if (!validation.ok) {
    await blobClient.deleteIfExists();
    throw new LocalShareValidationError(validation.error);
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

  return NextResponse.json({
    shareUrl: sharedArtifact.shareUrl,
    slug: sharedArtifact.slug,
  });
}

export async function POST(request: Request) {
  const body = await readRequestBody(request);
  if (!body) {
    return jsonError("Invalid share upload request.", 400);
  }

  try {
    if (body.action === "finalizeUpload") {
      return await finalizeUpload(body);
    }

    if (body.action !== "createUpload") {
      return jsonError("Invalid share upload request.", 400);
    }

    const shareName = typeof body.shareName === "string" ? body.shareName.trim() : "";
    const slug = slugifyLocalModelShareName(shareName);
    if (!shareName || !slug) {
      return jsonError("Share name is required.", 400);
    }

    if (shareName.length > maxLocalModelShareNameChars) {
      return jsonError("Share name is too long.", 400);
    }

    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    if (!fileName || fileName.length > maxLocalModelShareFileNameChars) {
      return jsonError("Invalid model filename.", 400);
    }

    const extension = normalizeLocalModelShareExtension(fileName);
    if (!extension) {
      return jsonError("Unsupported model format for sharing. Use STEP, STP, STL, GLB, or GLTF.", 400);
    }

    if (!Number.isFinite(body.fileSize) || body.fileSize <= 0) {
      return jsonError("Provide a model file to share.", 400);
    }

    if (body.fileSize > maxLocalModelShareUploadBytes) {
      return jsonError("Model files must be 100 MB or smaller.", 413);
    }

    const clientIp = clientIpForRequest(request);
    if (!checkRateLimit(`create:${clientIp}`, createUploadLimit)) {
      return jsonError("Too many share attempts. Try again in a minute.", 429);
    }

    return NextResponse.json(await createUploadTarget(getContainerClient(), slug, extension));
  } catch (error) {
    if (error instanceof LocalShareValidationError) {
      return jsonError(error.message, 400);
    }

    console.error("Failed to share local model.", error);
    return jsonError("Failed to share local model.", 500);
  }
}
