"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/app/components/header";
import Chat from "@/app/studio/_components/chat/chat";
import { type ModelSource } from "@/app/studio/_components/viewer/model-viewer-loaders";
import type { ViewerRevisionOption } from "@/app/studio/_components/viewer/model-viewer-revisions";
import { latestDesignRevision } from "@/app/studio/_lib/design-artifacts";
import type { DesignRevisionArtifact, StoredBlobArtifact } from "@/app/studio/_types/chat";

const GeneratedStepViewer = dynamic(
  () => import("@/app/studio/_components/viewer/generated-step-viewer"),
  { ssr: false },
);

function isStepExport(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".step") || filename.endsWith(".stp") || artifact.contentType === "application/step";
}

function isSourceCode(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".py") || artifact.contentType.startsWith("text/x-python");
}

function revisionKey(revision: DesignRevisionArtifact) {
  return `${revision.designId}:${revision.revisionNumber}`;
}

function mergeDesignRevisions(...revisionLists: DesignRevisionArtifact[][]) {
  const revisionsByKey = new Map<string, DesignRevisionArtifact>();
  for (const revisions of revisionLists) {
    for (const revision of revisions) {
      revisionsByKey.set(revisionKey(revision), revision);
    }
  }
  return Array.from(revisionsByKey.values());
}

function revisionsMatch(a: DesignRevisionArtifact, b: DesignRevisionArtifact) {
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

function revisionListsMatch(a: DesignRevisionArtifact[], b: DesignRevisionArtifact[]) {
  if (a.length !== b.length) return false;
  return a.every((revision, index) => revisionsMatch(revision, b[index]));
}

function revisionOptionsFromArtifacts(revisions: DesignRevisionArtifact[]): ViewerRevisionOption[] {
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

interface SignedRevisionSources {
  key: string;
  viewerSource: ModelSource | null;
  sourceCode: ModelSource | null;
}

export default function StudioClient() {
  const [signedRevisionSources, setSignedRevisionSources] = useState<SignedRevisionSources | null>(null);
  const [hydratedDesignRevisions, setHydratedDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [liveDesignRevisions, setLiveDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  const handleDesignRevision = useCallback((revision: DesignRevisionArtifact) => {
    setLiveDesignRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => revisionKey(currentRevision) === revisionKey(revision));
      if (existingRevision && revisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => revisionKey(currentRevision) !== revisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
  }, []);

  const handleDesignRevisionsChange = useCallback((revisions: DesignRevisionArtifact[]) => {
    setHydratedDesignRevisions((currentRevisions) => (
      revisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const handleClearViewer = useCallback(() => {
    requestVersionRef.current += 1;
    setSignedRevisionSources(null);
    setHydratedDesignRevisions([]);
    setLiveDesignRevisions([]);
    setSelectedRevisionKey(null);
  }, []);

  const designRevisions = useMemo(
    () => mergeDesignRevisions(hydratedDesignRevisions, liveDesignRevisions),
    [hydratedDesignRevisions, liveDesignRevisions],
  );
  const latestRevision = useMemo(() => latestDesignRevision(designRevisions), [designRevisions]);
  const selectedRevision = useMemo(() => selectedRevisionKey
    ? designRevisions.find((revision) => revisionKey(revision) === selectedRevisionKey) ?? null
    : null, [designRevisions, selectedRevisionKey]);
  const activeRevision = selectedRevision ?? latestRevision;
  const activeRevisionKey = activeRevision ? revisionKey(activeRevision) : null;
  const isLatestRevisionSelected = selectedRevisionKey === null || selectedRevision === null;
  const revisionOptions = useMemo(() => revisionOptionsFromArtifacts(designRevisions), [designRevisions]);
  const viewerSource = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.viewerSource : null;
  const sourceCode = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.sourceCode : null;

  const handleSelectLatestRevision = useCallback(() => {
    setSelectedRevisionKey(null);
  }, []);

  const handleSelectRevision = useCallback((key: string) => {
    setSelectedRevisionKey(key);
  }, []);

  useEffect(() => {
    requestVersionRef.current += 1;
    const snapshotVersion = requestVersionRef.current;

    if (!activeRevision || !activeRevisionKey) return;

    const stepExport = activeRevision.exports.find(isStepExport);
    const sourceArtifact = isSourceCode(activeRevision.source) ? activeRevision.source : null;

    if (!stepExport) return;

    void Promise.all([
      signBlobName(stepExport.blobName),
      sourceArtifact ? signBlobName(sourceArtifact.blobName) : Promise.resolve(null),
    ]).then(([stepSasUrl, sourceSasUrl]) => {
      if (snapshotVersion !== requestVersionRef.current) return;
      setSignedRevisionSources({
        key: activeRevisionKey,
        viewerSource: stepSasUrl ? { kind: "url", url: stepSasUrl, label: stepExport.filename } : null,
        sourceCode: sourceArtifact && sourceSasUrl
          ? { kind: "url", url: sourceSasUrl, label: sourceArtifact.filename }
          : null,
      });
    });
  }, [activeRevision, activeRevisionKey]);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (event: MouseEvent) => {
      const container = contentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(35, pct)));
    };

    const onUp = () => setIsResizing(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const viewerPaneStyle = {
    "--viewer-width": `${splitPct}%`,
  } as CSSProperties;

  return (
    <main className="flex h-screen flex-col bg-background">
      <Header />

      <div ref={contentRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className="min-h-0 flex-[3] border-b border-border md:min-w-0 md:flex-none md:basis-[var(--viewer-width)] md:border-b-0"
          style={viewerPaneStyle}
        >
          <GeneratedStepViewer
            source={viewerSource}
            sourceCode={sourceCode}
            revisions={revisionOptions}
            activeRevisionKey={activeRevisionKey}
            isLatestRevisionSelected={isLatestRevisionSelected}
            onSelectLatestRevision={handleSelectLatestRevision}
            onSelectRevision={handleSelectRevision}
          />
        </div>

        <div className="relative hidden w-0 md:block" role="presentation">
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            onMouseDown={() => setIsResizing(true)}
            className={`absolute inset-y-0 -left-1 z-10 w-2 !cursor-col-resize bg-transparent transition-colors ${isResizing ? "bg-accent/20" : "hover:bg-muted/80"
              }`}
          />
        </div>

        <div className="min-h-0 flex-[2] md:min-w-[320px] md:flex-1 md:border-l md:border-border">
          <Chat
            onDesignRevisionEvent={handleDesignRevision}
            onDesignRevisionsChange={handleDesignRevisionsChange}
            onClearViewer={handleClearViewer}
          />
        </div>
      </div>
    </main>
  );
}
