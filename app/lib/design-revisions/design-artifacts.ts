import type {
  DesignRevisionArtifact,
  MarkdownRevisionArtifact,
  ModelRevisionArtifact,
  SketchRevisionArtifact,
  StoredBlobArtifact,
  TexocadRevisionArtifact,
} from "@/app/types/design-artifact";

import { isRecord } from "@/app/lib/type-guards";

const DESIGN_REVISION_TYPE = "texocad.design_revision";
const SKETCH_REVISION_TYPE = "texocad.sketch_revision";
const MODEL_REVISION_TYPE = "texocad.model_revision";
const MARKDOWN_REVISION_TYPE = "texocad.brief_revision";

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

export function isModelRevisionArtifact(value: unknown): value is ModelRevisionArtifact {
  return isRevisionArtifact(value, MODEL_REVISION_TYPE);
}

export function isMarkdownRevisionArtifact(value: unknown): value is MarkdownRevisionArtifact {
  return isRevisionArtifact(value, MARKDOWN_REVISION_TYPE);
}

function isTexocadRevisionArtifact(value: unknown): value is TexocadRevisionArtifact {
  return (
    isDesignRevisionArtifact(value) ||
    isSketchRevisionArtifact(value) ||
    isModelRevisionArtifact(value) ||
    isMarkdownRevisionArtifact(value)
  );
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
  if (!isRecord(message)) return null;
  const additionalKwargs = message.additional_kwargs ?? message.additionalKwargs;
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

export function modelRevisionsFromMessages(messages: readonly unknown[]): ModelRevisionArtifact[] {
  const revisions: ModelRevisionArtifact[] = [];
  for (const message of messages) {
    const artifact = artifactFromMessage(message);
    if (isModelRevisionArtifact(artifact)) revisions.push(artifact);
  }
  return revisions;
}

export function markdownRevisionsFromMessages(messages: readonly unknown[]): MarkdownRevisionArtifact[] {
  const revisions: MarkdownRevisionArtifact[] = [];
  for (const message of messages) {
    const artifact = artifactFromMessage(message);
    if (isMarkdownRevisionArtifact(artifact)) revisions.push(artifact);
  }
  return revisions;
}

export function latestRevision<T extends { revisionNumber: number }>(
  revisions: T[],
): T | null {
  let latest: T | null = null;
  for (const revision of revisions) {
    if (!latest || revision.revisionNumber > latest.revisionNumber) {
      latest = revision;
    }
  }
  return latest;
}

export function latestDesignRevision(revisions: DesignRevisionArtifact[]) {
  return latestRevision(revisions);
}

export function latestSketchRevision(revisions: SketchRevisionArtifact[]) {
  return latestRevision(revisions);
}

export function latestModelRevision(revisions: ModelRevisionArtifact[]) {
  return latestRevision(revisions);
}

export function latestMarkdownRevision(revisions: MarkdownRevisionArtifact[]) {
  return latestRevision(revisions);
}
