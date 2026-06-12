import {
  isGlbExport as isGlbExportByName,
  isMarkdownExport as isMarkdownExportByName,
  isSketchImageExport as isSketchImageExportByName,
  isStepExport as isStepExportByName,
} from "@/app/lib/artifact-formats";
import type {
  DesignRevisionArtifact,
  MarkdownRevisionArtifact,
  ModelRevisionArtifact,
  SketchRevisionArtifact,
  StoredBlobArtifact,
} from "@/app/types/design-artifact";
import { anonymousSessionHeaders } from "@/app/lib/chat/anonymous-session";
import type { MarkdownRevisionOption, MarkdownSource } from "@/app/types/markdown-viewer";
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

export interface SignedModelRevisionSources {
  key: string;
  modelSource: ModelSource | null;
}

export interface SignedMarkdownRevisionSources {
  key: string;
  markdownSource: MarkdownSource | null;
}

export function isStepExport(artifact: StoredBlobArtifact) {
  return isStepExportByName(artifact.filename, artifact.contentType);
}

export function isGlbExport(artifact: StoredBlobArtifact) {
  return isGlbExportByName(artifact.filename, artifact.contentType);
}

export function isSourceCode(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".py") || artifact.contentType.startsWith("text/x-python");
}

export function isSketchImageExport(artifact: StoredBlobArtifact) {
  return isSketchImageExportByName(artifact.filename, artifact.contentType);
}

export function isMarkdownExport(artifact: StoredBlobArtifact) {
  return isMarkdownExportByName(artifact.filename, artifact.contentType);
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

export function modelRevisionKey(revision: ModelRevisionArtifact) {
  return artifactRevisionKey(revision);
}

export function mergeModelRevisions(...revisionLists: ModelRevisionArtifact[][]) {
  return mergeRevisionLists(modelRevisionKey, ...revisionLists);
}

export function modelRevisionsMatch(a: ModelRevisionArtifact, b: ModelRevisionArtifact) {
  return artifactRevisionsMatch(a, b);
}

export function modelRevisionListsMatch(a: ModelRevisionArtifact[], b: ModelRevisionArtifact[]) {
  return revisionListsMatchBy(modelRevisionsMatch, a, b);
}

export function markdownRevisionKey(revision: MarkdownRevisionArtifact) {
  return artifactRevisionKey(revision);
}

export function mergeMarkdownRevisions(...revisionLists: MarkdownRevisionArtifact[][]) {
  return mergeRevisionLists(markdownRevisionKey, ...revisionLists);
}

export function markdownRevisionsMatch(a: MarkdownRevisionArtifact, b: MarkdownRevisionArtifact) {
  return artifactRevisionsMatch(a, b);
}

export function markdownRevisionListsMatch(a: MarkdownRevisionArtifact[], b: MarkdownRevisionArtifact[]) {
  return revisionListsMatchBy(markdownRevisionsMatch, a, b);
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

export function markdownRevisionOptionsFromArtifacts(revisions: MarkdownRevisionArtifact[]): MarkdownRevisionOption[] {
  return revisions
    .map((revision) => {
      const markdownExport = revision.exports.find(isMarkdownExport);
      return {
        key: markdownRevisionKey(revision),
        revisionNumber: revision.revisionNumber,
        filename: markdownExport?.filename ?? null,
        canView: markdownExport !== undefined,
      };
    })
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

async function signBlobName(blobName: string): Promise<string | null> {
  const response = await fetch(`/api/blob?blobName=${encodeURIComponent(blobName)}`, {
    headers: anonymousSessionHeaders(),
  });
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

export async function signedModelRevisionSources(
  revision: ModelRevisionArtifact,
  key: string,
): Promise<SignedModelRevisionSources | null> {
  const glbExport = revision.exports.find(isGlbExport);
  if (!glbExport) return null;

  const glbSasUrl = await signBlobName(glbExport.blobName);

  return {
    key,
    modelSource: glbSasUrl ? { kind: "url", url: glbSasUrl, label: glbExport.filename } : null,
  };
}

export async function signedMarkdownRevisionSources(
  revision: MarkdownRevisionArtifact,
  key: string,
): Promise<SignedMarkdownRevisionSources | null> {
  const markdownExport = revision.exports.find(isMarkdownExport);
  if (!markdownExport) return null;

  const imageExports = revision.exports.filter((artifact) => artifact !== markdownExport && isSketchImageExport(artifact));
  const [markdownSasUrl, imageSasUrls] = await Promise.all([
    signBlobName(markdownExport.blobName),
    Promise.all(imageExports.map((artifact) => signBlobName(artifact.blobName))),
  ]);

  const imageUrlsByFilename: Record<string, string> = {};
  imageExports.forEach((artifact, index) => {
    const imageUrl = imageSasUrls[index];
    if (imageUrl) imageUrlsByFilename[artifact.filename] = imageUrl;
  });

  return {
    key,
    markdownSource: markdownSasUrl
      ? {
        kind: "url",
        url: markdownSasUrl,
        label: markdownExport.filename,
        imageUrlsByFilename,
      }
      : null,
  };
}
