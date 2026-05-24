import type { BlockBlobClient } from "@azure/storage-blob";

import {
  localModelShareFileSizeMessage,
  maxLocalModelShareUploadBytes,
} from "@/app/lib/model-formats";
import type { LocalModelShareExtension } from "@/app/types/local-model-share";

const validationSampleBytes = 64 * 1024;

interface ValidSharedModelBlob {
  checksum: string;
  ok: true;
}

interface InvalidSharedModelBlob {
  error: string;
  ok: false;
}

export type SharedModelBlobValidation = ValidSharedModelBlob | InvalidSharedModelBlob;

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

async function validateBlobSample(
  blobClient: BlockBlobClient,
  extension: LocalModelShareExtension,
  sample: Buffer,
  size: number,
) {
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
}

export async function validateSharedModelBlob(
  blobClient: BlockBlobClient,
  extension: LocalModelShareExtension,
): Promise<SharedModelBlobValidation> {
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
    return { error: localModelShareFileSizeMessage, ok: false };
  }

  const sample = await blobClient.downloadToBuffer(0, Math.min(size, validationSampleBytes));
  const ok = await validateBlobSample(blobClient, extension, sample, size);

  return ok ? { checksum, ok: true } : { error: "Uploaded file does not look like a valid model for its extension.", ok: false };
}
