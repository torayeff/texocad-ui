"use client";

import { useState } from "react";

import { trackEvent } from "@/app/lib/analytics/client";
import { errorKind } from "@/app/lib/analytics/events";
import { saveBrowserFile } from "@/app/lib/browser-downloads";
import type { SketchSource } from "@/app/types/sketch-viewer";

async function downloadSketchSource(source: SketchSource) {
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sketch: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  saveBrowserFile(buffer, source.label, response.headers.get("Content-Type") ?? "application/octet-stream", "sketch");
}

export function useSketchDownload(source: SketchSource | null) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = () => {
    if (!source || isDownloading) return;

    setDownloadError(null);
    setIsDownloading(true);
    trackEvent("artifact_download_started", {
      artifact_kind: "sketch",
      download_kind: "artifact",
      source_kind: "url",
    });
    void downloadSketchSource(source)
      .then(() => {
        trackEvent("artifact_download_succeeded", {
          artifact_kind: "sketch",
          download_kind: "artifact",
          source_kind: "url",
        });
      })
      .catch((error: unknown) => {
        trackEvent("artifact_download_failed", {
          artifact_kind: "sketch",
          download_kind: "artifact",
          error_kind: errorKind(error),
          source_kind: "url",
        });
        setDownloadError("Could not download the sketch.");
      })
      .finally(() => setIsDownloading(false));
  };

  return { isDownloading, downloadError, handleDownload };
}
