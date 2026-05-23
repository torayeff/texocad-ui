import type {
  DesignRevisionArtifact,
  SketchRevisionArtifact,
  StoredBlobArtifact,
  TexocadRevisionArtifact,
} from "@/app/studio/_features/design-revisions/_types/design-artifact";

const DESIGN_REVISION_TYPE = "texocad.design_revision";
const SKETCH_REVISION_TYPE = "texocad.sketch_revision";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredBlobArtifact(value: unknown): value is StoredBlobArtifact {
  if (!isRecord(value)) return false;
  return (
    typeof value.filename === "string" &&
    typeof value.blobName === "string" &&
    typeof value.contentType === "string" &&
    typeof value.checksum === "string"
  );
}

export function isDesignRevisionArtifact(value: unknown): value is DesignRevisionArtifact {
  return isRevisionArtifact(value, DESIGN_REVISION_TYPE);
}

export function isSketchRevisionArtifact(value: unknown): value is SketchRevisionArtifact {
  return isRevisionArtifact(value, SKETCH_REVISION_TYPE);
}

export function isTexocadRevisionArtifact(value: unknown): value is TexocadRevisionArtifact {
  return isDesignRevisionArtifact(value) || isSketchRevisionArtifact(value);
}

function isRevisionArtifact<TType extends TexocadRevisionArtifact["type"]>(
  value: unknown,
  type: TType,
): value is Extract<TexocadRevisionArtifact, { type: TType }> {
  if (!isRecord(value)) return false;
  return (
    value.type === type &&
    typeof value.designId === "string" &&
    typeof value.revisionNumber === "number" &&
    isStoredBlobArtifact(value.source) &&
    Array.isArray(value.exports) &&
    value.exports.every(isStoredBlobArtifact) &&
    (value.renders === undefined || (Array.isArray(value.renders) && value.renders.every(isStoredBlobArtifact))) &&
    typeof value.createdByThreadId === "string" &&
    (value.createdByRunId === undefined || typeof value.createdByRunId === "string")
  );
}

function artifactFromMessage(message: unknown): TexocadRevisionArtifact | null {
  const rawMessage = message as unknown as Record<string, unknown>;
  const additionalKwargs = rawMessage.additional_kwargs ?? rawMessage.additionalKwargs;
  if (!isRecord(additionalKwargs)) return null;

  const artifact = additionalKwargs.texocad_artifact;
  return isTexocadRevisionArtifact(artifact) ? artifact : null;
}

export function designRevisionsFromMessages(messages: readonly unknown[]): DesignRevisionArtifact[] {
  const revisions: DesignRevisionArtifact[] = [];
  for (const message of messages) {
    const artifact = artifactFromMessage(message);
    if (isDesignRevisionArtifact(artifact)) revisions.push(artifact);
  }
  return revisions;
}

export function sketchRevisionsFromMessages(messages: readonly unknown[]): SketchRevisionArtifact[] {
  const revisions: SketchRevisionArtifact[] = [];
  for (const message of messages) {
    const artifact = artifactFromMessage(message);
    if (isSketchRevisionArtifact(artifact)) revisions.push(artifact);
  }
  return revisions;
}

export function latestDesignRevision(
  revisions: DesignRevisionArtifact[],
): DesignRevisionArtifact | null {
  let latest: DesignRevisionArtifact | null = null;
  for (const revision of revisions) {
    if (!latest || revision.revisionNumber > latest.revisionNumber) {
      latest = revision;
    }
  }
  return latest;
}

export function latestSketchRevision(
  revisions: SketchRevisionArtifact[],
): SketchRevisionArtifact | null {
  let latest: SketchRevisionArtifact | null = null;
  for (const revision of revisions) {
    if (!latest || revision.revisionNumber > latest.revisionNumber) {
      latest = revision;
    }
  }
  return latest;
}
