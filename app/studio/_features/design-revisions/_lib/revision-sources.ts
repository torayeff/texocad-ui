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

interface RevisionLike {
  designId: string;
  revisionNumber: number;
  source: StoredBlobArtifact;
  exports: StoredBlobArtifact[];
}

function artifactRevisionKey(revision: RevisionLike) {
  return `${revision.designId}:${revision.revisionNumber}`;
}

function artifactRevisionsMatch(a: RevisionLike, b: RevisionLike) {
  return (
    artifactRevisionKey(a) === artifactRevisionKey(b) &&
    a.source.checksum === b.source.checksum &&
    a.exports.length === b.exports.length &&
    a.exports.every((artifact, index) => {
      const otherArtifact = b.exports[index];
      return otherArtifact !== undefined && artifact.blobName === otherArtifact.blobName && artifact.checksum === otherArtifact.checksum;
    })
  );
}

function mergeRevisionLists<TRevision extends RevisionLike>(
  key: (revision: TRevision) => string,
  ...revisionLists: TRevision[][]
) {
  const revisionsByKey = new Map<string, TRevision>();
  for (const revisions of revisionLists) {
    for (const revision of revisions) {
      revisionsByKey.set(key(revision), revision);
    }
  }
  return Array.from(revisionsByKey.values());
}

function revisionListsMatchBy<TRevision extends RevisionLike>(
  match: (a: TRevision, b: TRevision) => boolean,
  a: TRevision[],
  b: TRevision[],
) {
  if (a.length !== b.length) return false;
  return a.every((revision, index) => match(revision, b[index]));
}

export function revisionKey(revision: DesignRevisionArtifact) {
  return artifactRevisionKey(revision);
}

export function sketchRevisionKey(revision: SketchRevisionArtifact) {
  return artifactRevisionKey(revision);
}

export function mergeDesignRevisions(...revisionLists: DesignRevisionArtifact[][]) {
  return mergeRevisionLists(revisionKey, ...revisionLists);
}

export function revisionsMatch(a: DesignRevisionArtifact, b: DesignRevisionArtifact) {
  return artifactRevisionsMatch(a, b);
}

export function revisionListsMatch(a: DesignRevisionArtifact[], b: DesignRevisionArtifact[]) {
  return revisionListsMatchBy(revisionsMatch, a, b);
}

export function mergeSketchRevisions(...revisionLists: SketchRevisionArtifact[][]) {
  return mergeRevisionLists(sketchRevisionKey, ...revisionLists);
}

export function sketchRevisionsMatch(a: SketchRevisionArtifact, b: SketchRevisionArtifact) {
  return artifactRevisionsMatch(a, b);
}

export function sketchRevisionListsMatch(a: SketchRevisionArtifact[], b: SketchRevisionArtifact[]) {
  return revisionListsMatchBy(sketchRevisionsMatch, a, b);
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
        thumbnailUrl: null,
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
