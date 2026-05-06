"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { saveSourceModelFile } from "@/app/studio/_components/viewer/model-viewer-actions";
import { type ModelSource } from "@/app/studio/_components/viewer/model-viewer-loaders";
import { loadingIconClass } from "@/app/studio/_components/viewer/ui/styles";
import { ViewerControls } from "@/app/studio/_components/viewer/ui/viewer-controls";
import { ViewerGestureHint } from "@/app/studio/_components/viewer/ui/viewer-gesture-hint";
import { useModelViewerScene } from "@/app/studio/_components/viewer/use-model-viewer-scene";

interface GeneratedStepViewerProps {
  source: ModelSource | null;
  sourceCode: ModelSource | null;
  onClear: () => void;
}

export default function GeneratedStepViewer({ source, sourceCode, onClear }: GeneratedStepViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const sourceDownloadAbortRef = useRef<AbortController | null>(null);
  const {
    activeView,
    autoRotate,
    containerRef,
    explodeAmount,
    fitView,
    loadState,
    status,
    meshCount,
    modelBrowserNodes,
    selectBrowserNode,
    selectedBrowserNodeId,
    setActiveView,
    setExplodeAmount,
    toggleAutoRotate,
    toggleBrowserNodeVisibility,
    toggleWireframe,
    visibleBrowserNodeIds,
    wireframe,
  } = useModelViewerScene({ source });

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

    setIsDownloading(true);
    abortDownload();
    const abortController = new AbortController();
    downloadAbortRef.current = abortController;

    void saveSourceModelFile(source, abortController.signal)
      .catch(() => {
        if (!abortController.signal.aborted) {
          window.alert("Could not download the current model.");
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

    setIsDownloadingSource(true);
    abortSourceDownload();
    const abortController = new AbortController();
    sourceDownloadAbortRef.current = abortController;

    void saveSourceModelFile(sourceCode, abortController.signal)
      .catch(() => {
        if (!abortController.signal.aborted) {
          window.alert("Could not download the source code.");
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

  const canUseModel = source !== null && loadState === "ready";

  return (
    <section
      className="relative size-full overflow-hidden bg-[var(--viewer-background,var(--muted))] text-foreground"
      aria-label="Generated STEP viewer"
    >
      <div ref={containerRef} className="absolute inset-0 cursor-grab [&_canvas]:block [&_canvas]:size-full" />

      {!source && loadState === "idle" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No model loaded. Generate one in the chat.
          </p>
        </div>
      ) : null}

      {source && loadState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} strokeWidth={1.75} className={loadingIconClass} />
            <span>{status}</span>
          </div>
        </div>
      ) : null}

      {source && loadState === "error" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-error">{status}</p>
        </div>
      ) : null}

      {canUseModel ? (
        <ViewerControls
          activeView={activeView}
          autoRotate={autoRotate}
          canClear={source !== null}
          canDownload={source !== null}
          canExplode={meshCount !== null && meshCount > 1}
          canDownloadSource={sourceCode !== null}
          canShare={false}
          explodeAmount={explodeAmount}
          isDownloading={isDownloading}
          isDownloadingSource={isDownloadingSource}
          isSharing={false}
          modelBrowserNodes={modelBrowserNodes}
          selectedBrowserNodeId={selectedBrowserNodeId}
          visibleBrowserNodeIds={visibleBrowserNodeIds}
          wireframe={wireframe}
          onClear={onClear}
          onDownload={handleDownload}
          onDownloadSource={handleSourceDownload}
          onExplodeAmountChange={setExplodeAmount}
          onFitView={fitView}
          onSelectBrowserNode={selectBrowserNode}
          onShare={() => undefined}
          onSetView={setActiveView}
          onToggleAutoRotate={toggleAutoRotate}
          onToggleBrowserNodeVisibility={toggleBrowserNodeVisibility}
          onToggleWireframe={toggleWireframe}
        />
      ) : null}

      <ViewerGestureHint showGestures={loadState === "ready"} />
    </section>
  );
}
