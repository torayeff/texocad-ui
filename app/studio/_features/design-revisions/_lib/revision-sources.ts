import type { DesignRevisionArtifact, SketchRevisionArtifact, StoredBlobArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ModelSource, ViewerRevisionOption } from "@/app/types/model-viewer";
import type { SketchRevisionOption, SketchSource } from "@/app/types/sketch-viewer";

export interface SignedRevisionSources {
  key: string;
  viewerSource: ModelSource | null;
  sourceCode: ModelSource | null;
}

export interface SignedSketchRevisionSources {
  key: string;
  imageSource: SketchSource | null;
}

export function isStepExport(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".step") || filename.endsWith(".stp") || artifact.contentType === "application/step";
}

export function isSourceCode(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".py") || artifact.contentType.startsWith("text/x-python");
}

export function isSketchImageExport(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return (
    filename.endsWith(".png") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".webp") ||
    artifact.contentType === "image/png" ||
    artifact.contentType === "image/jpeg" ||
    artifact.contentType === "image/webp"
  );
}

export function revisionKey(revision: DesignRevisionArtifact) {
  return `${revision.designId}:${revision.revisionNumber}`;
}

export function sketchRevisionKey(revision: SketchRevisionArtifact) {
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

export function mergeSketchRevisions(...revisionLists: SketchRevisionArtifact[][]) {
  const revisionsByKey = new Map<string, SketchRevisionArtifact>();
  for (const revisions of revisionLists) {
    for (const revision of revisions) {
      revisionsByKey.set(sketchRevisionKey(revision), revision);
    }
  }
  return Array.from(revisionsByKey.values());
}

export function sketchRevisionsMatch(a: SketchRevisionArtifact, b: SketchRevisionArtifact) {
  return (
    sketchRevisionKey(a) === sketchRevisionKey(b) &&
    a.source.checksum === b.source.checksum &&
    a.exports.length === b.exports.length &&
    a.exports.every((artifact, index) => {
      const otherArtifact = b.exports[index];
      return otherArtifact !== undefined && artifact.blobName === otherArtifact.blobName && artifact.checksum === otherArtifact.checksum;
    })
  );
}

export function sketchRevisionListsMatch(a: SketchRevisionArtifact[], b: SketchRevisionArtifact[]) {
  if (a.length !== b.length) return false;
  return a.every((revision, index) => sketchRevisionsMatch(revision, b[index]));
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

export function sketchRevisionOptionsFromArtifacts(revisions: SketchRevisionArtifact[]): SketchRevisionOption[] {
  return revisions
    .map((revision) => {
      const imageExport = revision.exports.find(isSketchImageExport);
      return {
        key: sketchRevisionKey(revision),
        revisionNumber: revision.revisionNumber,
        filename: imageExport?.filename ?? null,
        canView: imageExport !== undefined,
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

export async function signedSketchRevisionSources(
  revision: SketchRevisionArtifact,
  key: string,
): Promise<SignedSketchRevisionSources | null> {
  const imageExport = revision.exports.find(isSketchImageExport);
  if (!imageExport) return null;

  const imageSasUrl = await signBlobName(imageExport.blobName);

  return {
    key,
    imageSource: imageSasUrl ? { kind: "url", url: imageSasUrl, label: imageExport.filename } : null,
  };
}
