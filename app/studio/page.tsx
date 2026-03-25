"use client";

import type { CSSProperties } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Chat from "@/app/studio/_components/chat/Chat";
import { Header } from "@/app/components/Header";
import { PART_COLORS } from "@/app/studio/_lib/viewer-constants";
import type { PartEntry } from "@/app/studio/_types/chat";
import type { ViewerPart } from "@/app/studio/_types/viewer";

const Viewer = dynamic(() => import("@/app/studio/_components/viewer/Viewer"), { ssr: false });

function resolveSasUrl(blobUrl: string): Promise<string | null> {
  return fetch(`/api/blob?url=${encodeURIComponent(blobUrl)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => data?.sasUrl ?? null)
    .catch(() => null);
}

function buildViewerParts(
  parts: PartEntry[],
  resolvedUrls: Map<string, string>,
): ViewerPart[] {
  return parts.map((part, idx) => {
    const downloadUrls: ViewerPart["downloadUrls"] = {};
    let stlUrl: string | null = null;

    for (const exp of part.exports ?? []) {
      const sas = resolvedUrls.get(exp.url);
      if (!sas) continue;
      if (exp.filename.endsWith(".stl")) {
        stlUrl = sas;
        downloadUrls.stl = sas;
      } else if (exp.filename.endsWith(".step")) {
        downloadUrls.step = sas;
      } else if (exp.filename.endsWith(".py")) {
        downloadUrls.py = sas;
      }
    }

    return {
      name: part.name,
      stlUrl,
      downloadUrls,
      color: PART_COLORS[idx % PART_COLORS.length],
      executedAt: part.executed_at,
    };
  });
}

export default function StudioPage() {
  const [viewerParts, setViewerParts] = useState<ViewerPart[]>([]);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  const handleProductEvent = useCallback((parts: PartEntry[]) => {
    const allExports = parts.flatMap((p) => p.exports ?? []);
    const uniqueUrls = [...new Set(allExports.map((e) => e.url))];
    requestVersionRef.current += 1;
    const snapshotVersion = requestVersionRef.current;

    Promise.all(
      uniqueUrls.map((url) => resolveSasUrl(url).then((sas) => [url, sas] as const)),
    ).then((results) => {
      if (snapshotVersion !== requestVersionRef.current) return;
      const resolved = new Map<string, string>();
      for (const [url, sas] of results) {
        if (sas) resolved.set(url, sas);
      }
      setViewerParts(buildViewerParts(parts, resolved));
    });
  }, []);

  const handleClearViewer = useCallback(() => {
    requestVersionRef.current++;
    setViewerParts([]);
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
          <Viewer parts={viewerParts} />
        </div>

        <div
          className="relative hidden w-0 md:block"
          role="presentation"
        >
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
          <Chat onProductEvent={handleProductEvent} onClearViewer={handleClearViewer} />
        </div>
      </div>
    </main>
  );
}
