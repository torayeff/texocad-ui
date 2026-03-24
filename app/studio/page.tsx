"use client";

import type { CSSProperties } from "react";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Chat from "@/app/studio/_components/chat/Chat";
import { Header } from "@/app/components/Header";
import type { GeomExportEntry } from "@/app/studio/_types/chat";

const Viewer = dynamic(() => import("@/app/studio/_components/viewer/Viewer"), { ssr: false });

export default function StudioPage() {
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<{
    stl?: string;
    step?: string;
    py?: string;
  }>({});
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const stlRequestVersionRef = useRef(0);

  const handleViewerArtifact = (entry: GeomExportEntry | null) => {
    if (!entry) {
      setStlUrl(null);
      setDownloadUrls({});
      stlRequestVersionRef.current++;
      return;
    }

    const isStl = entry.filename.endsWith(".stl");
    const requestVersion = isStl ? ++stlRequestVersionRef.current : stlRequestVersionRef.current;

    fetch(`/api/blob?url=${encodeURIComponent(entry.url)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const sasUrl = data?.sasUrl;
        if (!sasUrl) return;
        if (isStl) {
          if (requestVersion !== stlRequestVersionRef.current) return;
          setStlUrl(sasUrl);
          setDownloadUrls((prev) => ({ ...prev, stl: sasUrl }));
        } else if (entry.filename.endsWith(".step")) {
          setDownloadUrls((prev) => ({ ...prev, step: sasUrl }));
        } else if (entry.filename.endsWith(".py")) {
          setDownloadUrls((prev) => ({ ...prev, py: sasUrl }));
        }
      })
      .catch((err) => console.error("Failed to fetch SAS URL:", err));
  };

  const startResize = () => {
    setIsResizing(true);
  };

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

  const viewerKey = stlUrl ?? "empty";
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
          <Viewer key={viewerKey} stlUrl={stlUrl} downloadUrls={downloadUrls} />
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
            onMouseDown={startResize}
            className={`absolute inset-y-0 -left-1 z-10 w-2 !cursor-col-resize bg-transparent transition-colors ${isResizing ? "bg-accent/20" : "hover:bg-muted/80"
              }`}
          />
        </div>
        <div className="min-h-0 flex-[2] md:min-w-[320px] md:flex-1 md:border-l md:border-border">
          <Chat onViewerArtifact={handleViewerArtifact} />
        </div>
      </div>
    </main>
  );
}
