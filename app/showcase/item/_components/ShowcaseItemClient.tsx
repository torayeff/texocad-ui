"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { PART_COLORS } from "@/app/studio/_lib/viewer-constants";
import type { ViewerPart } from "@/app/studio/_types/viewer";
import PromptPanel from "@/app/showcase/item/_components/PromptPanel";
import type { ShowcaseItem } from "@/app/showcase/_types/showcase";

const Viewer = dynamic(() => import("@/app/studio/_components/viewer/Viewer"), {
  ssr: false,
});

const BLOB_BASE =
  "https://texocadstorage.blob.core.windows.net/texocad-blob-container/threads";
const EXTENSIONS = ["stl", "step", "py", "3mf"] as const;

function resolveSasUrl(blobUrl: string): Promise<string | null> {
  return fetch(`/api/blob?url=${encodeURIComponent(blobUrl)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => data?.sasUrl ?? null)
    .catch(() => null);
}

interface ShowcaseItemClientProps {
  item: ShowcaseItem;
}

export default function ShowcaseItemClient({
  item,
}: ShowcaseItemClientProps) {
  const [viewerParts, setViewerParts] = useState<ViewerPart[]>([]);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedRef.current === item.thread_id) {
      return;
    }

    loadedRef.current = item.thread_id;

    const blobUrls = item.parts.flatMap((part) =>
      EXTENSIONS.map((ext) => ({
        part,
        ext,
        url: `${BLOB_BASE}/${item.thread_id}/${part}.${ext}`,
      })),
    );

    Promise.all(
      blobUrls.map(({ part, ext, url }) =>
        resolveSasUrl(url).then((sas) => ({ part, ext, sas })),
      ),
    ).then((results) => {
      const byPart = new Map<string, ViewerPart>();

      for (const { part, ext, sas } of results) {
        if (!sas) {
          continue;
        }

        let viewerPart = byPart.get(part);
        if (!viewerPart) {
          viewerPart = {
            name: part,
            stlUrl: null,
            downloadUrls: {},
            color: PART_COLORS[byPart.size % PART_COLORS.length],
            executedAt: "",
          };
          byPart.set(part, viewerPart);
        }

        if (ext === "stl") {
          viewerPart.stlUrl = sas;
          viewerPart.downloadUrls.stl = sas;
        } else if (ext === "step") {
          viewerPart.downloadUrls.step = sas;
        } else if (ext === "py") {
          viewerPart.downloadUrls.py = sas;
        } else if (ext === "3mf") {
          viewerPart.downloadUrls["3mf"] = sas;
        }
      }

      setViewerParts([...byPart.values()]);
    });
  }, [item]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      const container = contentRef.current;
      if (!container) {
        return;
      }

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
    <div
      ref={contentRef}
      className="relative flex min-h-0 flex-1 flex-col md:flex-row"
    >
      <div
        className="min-h-0 flex-[3] border-b border-border md:min-w-0 md:flex-none md:basis-[var(--viewer-width)] md:border-b-0"
        style={viewerPaneStyle}
      >
        <Viewer parts={viewerParts} />
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
        <PromptPanel
          name={item.name}
          prompt={item.prompt}
          threadId={item.thread_id}
        />
      </div>
    </div>
  );
}
