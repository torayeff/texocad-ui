import { hashUserId, isAuthorizedUserBlob } from "@/app/lib/server/storage-auth";

export interface ShareArtifactInput {
  blobName: string;
  checksum: string;
  contentType: string;
  filename: string;
}

export interface ShareModelInput {
  kind?: ShareKind;
  designId: string;
  revisionNumber: number;
  name: string;
  exportArtifact: ShareArtifactInput;
}

export type ShareRevisionInput = Omit<ShareModelInput, "name">;
export type ShareKind = "model" | "sketch";

const MAX_SHARE_NAME_LENGTH = 80;
const MAX_BLOB_NAME_LENGTH = 1024;
export const STEP_CONTENT_TYPE = "application/step";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseShareExportArtifact(value: Record<string, unknown>): ShareArtifactInput | null {
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
  const kind = parseShareKind(value.kind);
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
    kind,
    exportArtifact: parsedExportArtifact,
  };
}

export function parseShareRevisionInput(value: unknown): ShareRevisionInput | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, exportArtifact } = value;
  const kind = parseShareKind(value.kind);
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
    kind,
    exportArtifact: parsedExportArtifact,
  };
}

export function validateShareBlob(userId: string, input: ShareRevisionInput): ShareRevisionInput | null {
  const blobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  if (!validatePrivateBlobName(blobName) || !isShareExport(input.kind ?? "model", input.exportArtifact.filename, input.exportArtifact.contentType)) {
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

export function isSketchImageExport(filename: string, contentType: string) {
  const lowerFilename = filename.toLowerCase();
  return (
    lowerFilename.endsWith(".png") ||
    lowerFilename.endsWith(".jpg") ||
    lowerFilename.endsWith(".jpeg") ||
    lowerFilename.endsWith(".webp") ||
    contentType === "image/png" ||
    contentType === "image/jpeg" ||
    contentType === "image/webp"
  );
}

export function validateShareName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SHARE_NAME_LENGTH;
}

function validatePrivateBlobName(blobName: string) {
  return blobName.length > 0 && blobName.length <= MAX_BLOB_NAME_LENGTH && !blobName.startsWith("/");
}

function parseShareKind(value: unknown): ShareKind {
  return value === "sketch" ? "sketch" : "model";
}

function isShareExport(kind: ShareKind, filename: string, contentType: string) {
  switch (kind) {
    case "model":
      return isStepExport(filename, contentType);
    case "sketch":
      return isSketchImageExport(filename, contentType);
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
