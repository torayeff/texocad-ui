"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveSourceModelFile } from "@/app/components/model-viewer/_lib/model-viewer-actions";
import type { ModelSource } from "@/app/types/model-viewer";

interface UseModelDownloadsOptions {
  source: ModelSource | null;
  sourceCode: ModelSource | null;
}

export function useModelDownloads({ source, sourceCode }: UseModelDownloadsOptions) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const sourceDownloadAbortRef = useRef<AbortController | null>(null);

  const abortDownload = useCallback(() => {
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = null;
  }, []);

  const abortSourceDownload = useCallback(() => {
    sourceDownloadAbortRef.current?.abort();
    sourceDownloadAbortRef.current = null;
  }, []);

  const handleDownload = useCallback(() => {
    if (!source || isDownloading) return;

    setDownloadError(null);
    setIsDownloading(true);
    abortDownload();
    const abortController = new AbortController();
    downloadAbortRef.current = abortController;

    void saveSourceModelFile(source, abortController.signal)
      .catch(() => {
        if (!abortController.signal.aborted) {
          setDownloadError("Could not download the current model.");
        }
      })
      .finally(() => {
        if (downloadAbortRef.current === abortController) {
          downloadAbortRef.current = null;
          setIsDownloading(false);
        }
      });
  }, [abortDownload, isDownloading, source]);

  const handleSourceDownload = useCallback(() => {
    if (!sourceCode || isDownloadingSource) return;

    setDownloadError(null);
    setIsDownloadingSource(true);
    abortSourceDownload();
    const abortController = new AbortController();
    sourceDownloadAbortRef.current = abortController;

    void saveSourceModelFile(sourceCode, abortController.signal)
      .catch(() => {
        if (!abortController.signal.aborted) {
          setDownloadError("Could not download the source code.");
        }
      })
      .finally(() => {
        if (sourceDownloadAbortRef.current === abortController) {
          sourceDownloadAbortRef.current = null;
          setIsDownloadingSource(false);
        }
      });
  }, [abortSourceDownload, isDownloadingSource, sourceCode]);

  useEffect(() => {
    return () => {
      abortDownload();
      abortSourceDownload();
    };
  }, [abortDownload, abortSourceDownload]);

  return {
    downloadError,
    handleDownload,
    handleSourceDownload,
    isDownloading,
    isDownloadingSource,
  };
}
