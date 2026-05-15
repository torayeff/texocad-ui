import type { DesignRevisionArtifact, StoredBlobArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ModelSource, ViewerRevisionOption } from "@/app/types/model-viewer";

export interface SignedRevisionSources {
  key: string;
  viewerSource: ModelSource | null;
  sourceCode: ModelSource | null;
}

export function isStepExport(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".step") || filename.endsWith(".stp") || artifact.contentType === "application/step";
}

export function isSourceCode(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".py") || artifact.contentType.startsWith("text/x-python");
}

export function revisionKey(revision: DesignRevisionArtifact) {
  return `${revision.designId}:${revision.revisionNumber}`;
}

export function mergeDesignRevisions(...revisionLists: DesignRevisionArtifact[][]) {
  const revisionsByKey = new Map<string, DesignRevisionArtifact>();
  for (const revisions of revisionLists) {
    for (const revision of revisions) {
      revisionsByKey.set(revisionKey(revision), revision);
    }
  }
  return Array.from(revisionsByKey.values());
}

export function revisionsMatch(a: DesignRevisionArtifact, b: DesignRevisionArtifact) {
  return (
    revisionKey(a) === revisionKey(b) &&
    a.source.checksum === b.source.checksum &&
    a.exports.length === b.exports.length &&
    a.exports.every((artifact, index) => {
      const otherArtifact = b.exports[index];
      return otherArtifact !== undefined && artifact.blobName === otherArtifact.blobName && artifact.checksum === otherArtifact.checksum;
    })
  );
}

export function revisionListsMatch(a: DesignRevisionArtifact[], b: DesignRevisionArtifact[]) {
  if (a.length !== b.length) return false;
  return a.every((revision, index) => revisionsMatch(revision, b[index]));
}

export function revisionOptionsFromArtifacts(revisions: DesignRevisionArtifact[]): ViewerRevisionOption[] {
  return revisions
    .map((revision) => {
      const stepExport = revision.exports.find(isStepExport);
      return {
        key: revisionKey(revision),
        revisionNumber: revision.revisionNumber,
        filename: stepExport?.filename ?? null,
        canView: stepExport !== undefined,
      };
    })
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

async function signBlobName(blobName: string): Promise<string | null> {
  const response = await fetch(`/api/blob?blobName=${encodeURIComponent(blobName)}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { sasUrl?: string };
  return data.sasUrl ?? null;
}

export async function signedRevisionSources(
  revision: DesignRevisionArtifact,
  key: string,
): Promise<SignedRevisionSources | null> {
  const stepExport = revision.exports.find(isStepExport);
  const sourceArtifact = isSourceCode(revision.source) ? revision.source : null;

  if (!stepExport) return null;

  const [stepSasUrl, sourceSasUrl] = await Promise.all([
    signBlobName(stepExport.blobName),
    sourceArtifact ? signBlobName(sourceArtifact.blobName) : Promise.resolve(null),
  ]);

  return {
    key,
    viewerSource: stepSasUrl ? { kind: "url", url: stepSasUrl, label: stepExport.filename } : null,
    sourceCode: sourceArtifact && sourceSasUrl
      ? { kind: "url", url: sourceSasUrl, label: sourceArtifact.filename }
      : null,
  };
}
