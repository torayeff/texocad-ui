import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

import { contentTypeForLocalModelShare, normalizeLocalModelShareExtension } from "@/app/lib/model-formats";
import { publicStorageConfig } from "@/app/lib/server/storage-auth";
import { isStepExport, STEP_CONTENT_TYPE } from "@/app/lib/server/shared-model-validation";
import type { ShareArtifactInput, ShareKind } from "@/app/lib/server/shared-model-validation";

const PUBLIC_SHARED_PREFIX = "public/shared";
const READ_SAS_EXPIRY_MS = 10 * 60 * 1000;

function extensionFromFilename(filename: string) {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".stp")) return ".stp";
  if (lowerFilename.endsWith(".step")) return ".step";
  if (lowerFilename.endsWith(".stl")) return ".stl";
  if (lowerFilename.endsWith(".glb")) return ".glb";
  if (lowerFilename.endsWith(".gltf")) return ".gltf";
  if (lowerFilename.endsWith(".jpg")) return ".jpg";
  if (lowerFilename.endsWith(".jpeg")) return ".jpeg";
  if (lowerFilename.endsWith(".webp")) return ".webp";
  if (lowerFilename.endsWith(".png")) return ".png";
  return ".step";
}

export function sharedArtifactBlobName(kind: ShareKind, slug: string, filename: string) {
  return `${PUBLIC_SHARED_PREFIX}/${slug}/${kind}${extensionFromFilename(filename)}`;
}

function contentTypeForModelArtifact(artifact: ShareArtifactInput) {
  if (isStepExport(artifact.filename, artifact.contentType)) {
    return STEP_CONTENT_TYPE;
  }

  const extension = normalizeLocalModelShareExtension(artifact.filename);
  return extension ? contentTypeForLocalModelShare(extension) : artifact.contentType;
}

function shareContentType(kind: ShareKind, artifact: ShareArtifactInput) {
  switch (kind) {
    case "model":
      return contentTypeForModelArtifact(artifact);
    case "sketch":
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

export async function copyPrivateArtifactToPublic(input: {
  artifactBlobName: string;
  exportArtifact: ShareArtifactInput;
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
