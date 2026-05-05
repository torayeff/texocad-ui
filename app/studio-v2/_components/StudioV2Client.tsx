"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/app/components/Header";
import Chat from "@/app/studio-v2/_components/chat/Chat";
import { type ModelSource } from "@/app/studio-v2/_components/viewer/model-viewer-loaders";
import type { DesignRevisionArtifact, StoredBlobArtifact } from "@/app/studio-v2/_types/chat";

const GeneratedStepViewer = dynamic(
  () => import("@/app/studio-v2/_components/viewer/GeneratedStepViewer"),
  { ssr: false },
);

function isStepExport(artifact: StoredBlobArtifact) {
  const filename = artifact.filename.toLowerCase();
  return filename.endsWith(".step") || filename.endsWith(".stp") || artifact.contentType === "application/step";
}

async function signBlobName(blobName: string): Promise<string | null> {
  const response = await fetch(`/api/blob-v2?blobName=${encodeURIComponent(blobName)}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { sasUrl?: string };
  return data.sasUrl ?? null;
}

export default function StudioV2Client() {
  const [viewerSource, setViewerSource] = useState<ModelSource | null>(null);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  const handleDesignRevision = useCallback((revision: DesignRevisionArtifact) => {
    const stepExport = revision.exports.find(isStepExport);
    requestVersionRef.current += 1;
    const snapshotVersion = requestVersionRef.current;

    if (!stepExport) {
      setViewerSource(null);
      return;
    }

    void signBlobName(stepExport.blobName).then((sasUrl) => {
      if (snapshotVersion !== requestVersionRef.current) return;
      setViewerSource(sasUrl ? { kind: "url", url: sasUrl, label: stepExport.filename } : null);
    });
  }, []);

  const handleClearViewer = useCallback(() => {
    requestVersionRef.current += 1;
    setViewerSource(null);
  }, []);

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
          <GeneratedStepViewer source={viewerSource} onClear={handleClearViewer} />
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
          <Chat onDesignRevisionEvent={handleDesignRevision} onClearViewer={handleClearViewer} />
        </div>
      </div>
    </main>
  );
}
