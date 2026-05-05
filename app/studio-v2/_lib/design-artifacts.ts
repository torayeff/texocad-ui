import type { DesignRevisionArtifact, StoredBlobArtifact } from "@/app/studio-v2/_types/chat";

const DESIGN_REVISION_TYPE = "texocad.design_revision";

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
  if (!isRecord(value)) return false;
  return (
    value.type === DESIGN_REVISION_TYPE &&
    typeof value.designId === "string" &&
    typeof value.revisionNumber === "number" &&
    isStoredBlobArtifact(value.source) &&
    Array.isArray(value.exports) &&
    value.exports.every(isStoredBlobArtifact) &&
    typeof value.createdByThreadId === "string" &&
    (value.createdByRunId === undefined || typeof value.createdByRunId === "string")
  );
}

function artifactFromMessage(message: unknown): DesignRevisionArtifact | null {
  const rawMessage = message as unknown as Record<string, unknown>;
  const additionalKwargs = rawMessage.additional_kwargs ?? rawMessage.additionalKwargs;
  if (!isRecord(additionalKwargs)) return null;

  const artifact = additionalKwargs.texocad_artifact;
  return isDesignRevisionArtifact(artifact) ? artifact : null;
}

export function designRevisionsFromMessages(messages: readonly unknown[]): DesignRevisionArtifact[] {
  const revisions: DesignRevisionArtifact[] = [];
  for (const message of messages) {
    const artifact = artifactFromMessage(message);
    if (artifact) revisions.push(artifact);
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
