import { isMarkdownExport, isSketchImageExport, isStepExport } from "@/app/lib/artifact-formats";
import { isRecord } from "@/app/lib/type-guards";
import { hashUserId, isAuthorizedUserBlob } from "@/app/lib/server/storage-auth";

export interface ShareExportArtifactInput {
  blobName: string;
  checksum: string;
  contentType: string;
  filename: string;
}

export interface ShareArtifactInput {
  kind?: ShareKind;
  designId: string;
  revisionNumber: number;
  name: string;
  exportArtifact: ShareExportArtifactInput;
  relatedArtifacts?: ShareExportArtifactInput[];
}

export type ShareArtifactRevisionInput = Omit<ShareArtifactInput, "name">;
export type ShareKind = "model" | "sketch" | "markdown";

const MAX_SHARE_NAME_LENGTH = 80;
const MAX_BLOB_NAME_LENGTH = 1024;

function parseShareExportArtifact(value: Record<string, unknown>): ShareExportArtifactInput | null {
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

export function parseShareInput(value: unknown): ShareArtifactInput | null {
  if (!isRecord(value) || !isRecord(value.exportArtifact)) return null;

  const { designId, revisionNumber, name, exportArtifact } = value;
  const kind = parseShareKind(value.kind);
  const parsedExportArtifact = parseShareExportArtifact(exportArtifact);
  const relatedArtifacts = parseRelatedArtifacts(value.relatedArtifacts);

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
    relatedArtifacts,
  };
}

export function parseShareRevisionInput(value: unknown): ShareArtifactRevisionInput | null {
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

export function validateShareBlob(userId: string, input: ShareArtifactRevisionInput): ShareArtifactRevisionInput | null {
  const blobName = input.exportArtifact.blobName.replace(/^\/+/, "");
  if (!validatePrivateBlobName(blobName) || !isShareExport(input.kind ?? "model", input.exportArtifact.filename, input.exportArtifact.contentType)) {
    return null;
  }

  if (!isAuthorizedUserBlob(blobName, hashUserId(userId))) {
    return null;
  }

  const relatedArtifacts = input.kind === "markdown"
    ? validatedRelatedMarkdownArtifacts(userId, input.relatedArtifacts ?? [])
    : [];
  if (!relatedArtifacts) {
    return null;
  }

  return {
    ...input,
    exportArtifact: {
      ...input.exportArtifact,
      blobName,
    },
    relatedArtifacts,
  };
}

export function validateShareName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SHARE_NAME_LENGTH;
}

function validatePrivateBlobName(blobName: string) {
  return blobName.length > 0 && blobName.length <= MAX_BLOB_NAME_LENGTH && !blobName.startsWith("/");
}

function parseShareKind(value: unknown): ShareKind {
  if (value === "sketch" || value === "markdown") return value;
  return "model";
}

function isShareExport(kind: ShareKind, filename: string, contentType: string) {
  switch (kind) {
    case "model":
      return isStepExport(filename, contentType);
    case "sketch":
      return isSketchImageExport(filename, contentType);
    case "markdown":
      return isMarkdownExport(filename, contentType);
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function parseRelatedArtifacts(value: unknown): ShareExportArtifactInput[] {
  if (!Array.isArray(value)) return [];
  const artifacts: ShareExportArtifactInput[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const artifact = parseShareExportArtifact(item);
    if (artifact) artifacts.push(artifact);
  }
  return artifacts;
}

function validatedRelatedMarkdownArtifacts(userId: string, artifacts: ShareExportArtifactInput[]) {
  const userHash = hashUserId(userId);
  const validatedArtifacts: ShareExportArtifactInput[] = [];
  for (const artifact of artifacts) {
    const blobName = artifact.blobName.replace(/^\/+/, "");
    if (
      !validatePrivateBlobName(blobName) ||
      !isSketchImageExport(artifact.filename, artifact.contentType) ||
      !isAuthorizedUserBlob(blobName, userHash)
    ) {
      return null;
    }
    validatedArtifacts.push({ ...artifact, blobName });
  }
  return validatedArtifacts;
}
