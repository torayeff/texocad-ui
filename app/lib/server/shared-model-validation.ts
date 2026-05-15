import { hashUserId, isAuthorizedUserBlob } from "@/app/lib/server/storage-auth";

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

export type ShareRevisionInput = Omit<ShareModelInput, "name">;

const MAX_SHARE_NAME_LENGTH = 80;
const MAX_BLOB_NAME_LENGTH = 1024;
export const STEP_CONTENT_TYPE = "application/step";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseShareExportArtifact(value: Record<string, unknown>) {
  const { blobName, checksum, contentType, filename } = value;

  if (
    typeof blobName !== "string" ||
    typeof checksum !== "string" ||
    typeof contentType !== "string" ||
    typeof filename !== "string"
  ) {
    return null;
  }

  return {
    blobName,
    checksum,
    contentType,
    filename,
  };
}

export function parseShareInput(value: unknown): ShareModelInput | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, name, exportArtifact } = value;
  const parsedExportArtifact = parseShareExportArtifact(exportArtifact);

  if (
    typeof designId !== "string" ||
    typeof revisionNumber !== "number" ||
    typeof name !== "string" ||
    !parsedExportArtifact
  ) {
    return null;
  }

  return {
    designId,
    revisionNumber,
    name,
    exportArtifact: parsedExportArtifact,
  };
}

export function parseShareRevisionInput(value: unknown): ShareRevisionInput | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, exportArtifact } = value;
  const parsedExportArtifact = parseShareExportArtifact(exportArtifact);

  if (
    typeof designId !== "string" ||
    typeof revisionNumber !== "number" ||
    !parsedExportArtifact
  ) {
    return null;
  }

  return {
    designId,
    revisionNumber,
    exportArtifact: parsedExportArtifact,
  };
}

export function validateShareBlob(userId: string, input: ShareRevisionInput): ShareRevisionInput | null {
  const blobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  if (!validatePrivateBlobName(blobName) || !isStepExport(input.exportArtifact.filename, input.exportArtifact.contentType)) {
    return null;
  }

  if (!isAuthorizedUserBlob(blobName, hashUserId(userId))) {
    return null;
  }

  return {
    ...input,
    exportArtifact: {
      ...input.exportArtifact,
      blobName,
    },
  };
}

export function isStepExport(filename: string, contentType: string) {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith(".step") || lowerFilename.endsWith(".stp") || contentType === STEP_CONTENT_TYPE;
}

export function validateShareName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SHARE_NAME_LENGTH;
}

function validatePrivateBlobName(blobName: string) {
  return blobName.length > 0 && blobName.length <= MAX_BLOB_NAME_LENGTH && !blobName.startsWith("/");
}
