import {
  BlobServiceClient,
} from "@azure/storage-blob";

import { isStepExport, STEP_CONTENT_TYPE } from "@/app/lib/artifact-formats";
import { contentTypeForLocalModelShare, extensionFromName, normalizeLocalModelShareExtension } from "@/app/lib/model-formats";
import { generateSignedReadUrl } from "@/app/lib/server/blob-storage";
import { publicStorageConfig } from "@/app/lib/server/storage-auth";
import type { ShareExportArtifactInput, ShareKind } from "@/app/lib/server/shared-artifact-validation";

const PUBLIC_SHARED_PREFIX = "public/shared";
const READ_SAS_EXPIRY_MS = 10 * 60 * 1000;

const KNOWN_EXTENSIONS = new Set(["step", "stp", "stl", "glb", "gltf", "jpg", "jpeg", "webp", "png", "md"]);

function dotExtensionFromFilename(filename: string) {
  const ext = extensionFromName(filename);
  return KNOWN_EXTENSIONS.has(ext) ? `.${ext}` : ".step";
}

export function sharedArtifactBlobName(kind: ShareKind, slug: string, filename: string) {
  return `${PUBLIC_SHARED_PREFIX}/${slug}/${kind}${dotExtensionFromFilename(filename)}`;
}

export function sharedRelatedArtifactBlobName(slug: string, filename: string) {
  return `${PUBLIC_SHARED_PREFIX}/${slug}/${filename.replaceAll('"', "").replaceAll("/", "-")}`;
}

function contentTypeForModelArtifact(artifact: ShareExportArtifactInput) {
  if (isStepExport(artifact.filename, artifact.contentType)) {
    return STEP_CONTENT_TYPE;
  }

  const extension = normalizeLocalModelShareExtension(artifact.filename);
  return extension ? contentTypeForLocalModelShare(extension) : artifact.contentType;
}

function shareContentType(kind: ShareKind, artifact: ShareExportArtifactInput) {
  switch (kind) {
    case "model":
      return contentTypeForModelArtifact(artifact);
    case "sketch":
      return artifact.contentType;
    case "markdown":
      return artifact.contentType;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function publicBlobUrl(blobName: string) {
  const { blobHost, publicContainerName } = publicStorageConfig();
  return `https://${blobHost}/${publicContainerName}/${blobName}`;
}

function blobServiceClient() {
  return BlobServiceClient.fromConnectionString(publicStorageConfig().connectionString);
}

function privateReadSasUrl(blobName: string) {
  const { credential, blobHost, privateContainerName } = publicStorageConfig();
  return generateSignedReadUrl({
    blobHost,
    blobName,
    containerName: privateContainerName,
    credential,
    expiryMs: READ_SAS_EXPIRY_MS,
  });
}

export async function copyPrivateArtifactToPublic(input: {
  artifactBlobName: string;
  exportArtifact: ShareExportArtifactInput;
  kind: ShareKind;
  privateBlobName: string;
}) {
  const publicBlobClient = blobServiceClient()
    .getContainerClient(publicStorageConfig().publicContainerName)
    .getBlobClient(input.artifactBlobName);

  await publicBlobClient.syncCopyFromURL(privateReadSasUrl(input.privateBlobName));
  await publicBlobClient.setHTTPHeaders({
    blobContentDisposition: `attachment; filename="${input.exportArtifact.filename.replaceAll('"', "")}"`,
    blobContentType: shareContentType(input.kind, input.exportArtifact),
  });
}
