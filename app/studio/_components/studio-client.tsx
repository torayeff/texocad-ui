"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/app/components/header";
import type { ShareRevision } from "@/app/components/model-viewer/_types/share-model";
import Chat from "@/app/studio/_features/chat/_components/chat";
import { latestDesignRevision } from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import type { DesignRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import {
  isStepExport,
  mergeDesignRevisions,
  revisionKey,
  revisionListsMatch,
  revisionOptionsFromArtifacts,
  revisionsMatch,
  signedRevisionSources as getSignedRevisionSources,
  type SignedRevisionSources,
} from "@/app/studio/_features/design-revisions/_lib/revision-sources";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

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
  const activeStepExport = activeRevision?.exports.find(isStepExport) ?? null;

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

    void getSignedRevisionSources(activeRevision, activeRevisionKey).then((sources) => {
      if (snapshotVersion !== requestVersionRef.current) return;
      setSignedRevisionSources(sources);
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
  const shareRevision: ShareRevision | null = activeRevision && activeStepExport ? {
    designId: activeRevision.designId,
    revisionNumber: activeRevision.revisionNumber,
    exportArtifact: activeStepExport,
  } : null;

  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <Header />

      <div ref={contentRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className="min-h-0 flex-[2] border-b border-border md:min-w-0 md:flex-none md:basis-[var(--viewer-width)] md:border-b-0"
          style={viewerPaneStyle}
        >
          <ModelViewer
            source={viewerSource}
            downloads={{
              sourceCode,
            }}
            revisions={{
              activeRevisionKey,
              isLatestRevisionSelected,
              onSelectLatestRevision: handleSelectLatestRevision,
              onSelectRevision: handleSelectRevision,
              revisions: revisionOptions,
            }}
            sharing={{
              activeRevisionKey,
              shareRevision,
            }}
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

        <div className="min-h-0 flex-[3] md:min-w-[320px] md:flex-1 md:border-l md:border-border">
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
