"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";

import { saveSourceModelFile } from "@/app/studio/_components/viewer/model-viewer-actions";
import { type ModelSource } from "@/app/studio/_components/viewer/model-viewer-loaders";
import type { ViewerRevisionOption } from "@/app/studio/_components/viewer/model-viewer-revisions";
import type { StoredBlobArtifact } from "@/app/studio/_types/chat";
import { cn, inputClass, loadingIconClass, primaryButtonClass, shareButtonClass, viewerGlassClass } from "@/app/studio/_components/viewer/ui/styles";
import { ViewerControls } from "@/app/studio/_components/viewer/ui/viewer-controls";
import { ViewerGestureHint } from "@/app/studio/_components/viewer/ui/viewer-gesture-hint";
import { useModelViewerScene } from "@/app/studio/_components/viewer/use-model-viewer-scene";

interface ShareRevision {
  designId: string;
  exportArtifact: StoredBlobArtifact;
  revisionNumber: number;
}

interface ShareResponse {
  alreadyShared: boolean;
  sharedModel: SharedModelResponse;
}

interface SharedModelResponse {
  shareUrl: string;
  slug: string;
}

interface ShareResult {
  revisionKey: string | null;
  url: string;
}

interface GeneratedStepViewerProps {
  source: ModelSource | null;
  sourceCode: ModelSource | null;
  shareRevision?: ShareRevision | null;
  revisions: ViewerRevisionOption[];
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
}

function defaultShareName(source: ModelSource | null) {
  if (!source?.label) return "";
  return source.label.replace(/\.(step|stp)$/i, "").replace(/[-_]+/g, " ").trim();
}

export default function GeneratedStepViewer({
  source,
  sourceCode,
  shareRevision = null,
  revisions,
  activeRevisionKey,
  isLatestRevisionSelected,
  onSelectLatestRevision,
  onSelectRevision,
}: GeneratedStepViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareName, setShareName] = useState("");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const sourceDownloadAbortRef = useRef<AbortController | null>(null);
  const {
    activeView,
    autoRotate,
    containerRef,
    explodeAmount,
    fitView,
    hasTransforms,
    loadState,
    status,
    meshCount,
    modelBrowserNodes,
    resetTransforms,
    selectBrowserNode,
    selectedBrowserNodeId,
    setActiveView,
    setExplodeAmount,
    setTransformMode,
    toggleAutoRotate,
    toggleBrowserNodeVisibility,
    toggleWireframe,
    transformMode,
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

  const handleOpenShareDialog = useCallback(() => {
    setShareError(null);
    setDidCopyShareUrl(false);
    if (!shareRevision) {
      return;
    }

    setIsShareDialogOpen(true);

    const params = new URLSearchParams({
      designId: shareRevision.designId,
      revisionNumber: String(shareRevision.revisionNumber),
      blobName: shareRevision.exportArtifact.blobName,
      checksum: shareRevision.exportArtifact.checksum,
      contentType: shareRevision.exportArtifact.contentType,
      filename: shareRevision.exportArtifact.filename,
    });

    void fetch(`/api/shares?${params.toString()}`)
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { sharedModel?: SharedModelResponse | null; error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? "Could not check this model.");
        }

        if (data?.sharedModel?.shareUrl) {
          setShareResult({
            revisionKey: activeRevisionKey,
            url: data.sharedModel.shareUrl,
          });
          return;
        }

        setShareName((currentName) => currentName || defaultShareName(source));
      })
      .catch(() => {
        setShareName((currentName) => currentName || defaultShareName(source));
      });
  }, [activeRevisionKey, shareRevision, source]);

  const handleCloseShareDialog = useCallback(() => {
    if (isSharing) return;
    setIsShareDialogOpen(false);
    setShareError(null);
  }, [isSharing]);

  const handleShareSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shareRevision || isSharing) return;

    const trimmedName = shareName.trim();
    if (!trimmedName) {
      setShareError("Enter a model name.");
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setDidCopyShareUrl(false);

    void fetch("/api/shares", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        designId: shareRevision.designId,
        revisionNumber: shareRevision.revisionNumber,
        name: trimmedName,
        exportArtifact: shareRevision.exportArtifact,
      }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as Partial<ShareResponse> & { error?: string } | null;
        if (!response.ok || !data?.sharedModel?.shareUrl) {
          throw new Error(data?.error ?? "Could not share this model.");
        }

        setShareResult({
          revisionKey: activeRevisionKey,
          url: data.sharedModel.shareUrl,
        });
      })
      .catch((error: unknown) => {
        setShareError(error instanceof Error ? error.message : "Could not share this model.");
      })
      .finally(() => setIsSharing(false));
  }, [activeRevisionKey, isSharing, shareName, shareRevision]);

  const handleCopyShareUrl = useCallback(() => {
    const shareUrl = shareResult?.revisionKey === activeRevisionKey ? shareResult.url : null;
    if (!shareUrl) return;

    void navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setDidCopyShareUrl(true);
      })
      .catch(() => {
        setShareError("Could not copy the link.");
      });
  }, [activeRevisionKey, shareResult]);

  useEffect(() => {
    return () => {
      abortDownload();
      abortSourceDownload();
    };
  }, [abortDownload, abortSourceDownload]);

  const canUseModel = source !== null && loadState === "ready";
  const canShare = canUseModel && shareRevision !== null;
  const shareUrl = shareResult?.revisionKey === activeRevisionKey ? shareResult.url : null;

  return (
    <section
      className="relative size-full overflow-visible bg-[var(--viewer-background,var(--muted))] text-foreground md:overflow-hidden"
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
          canDownload={source !== null}
          canExplode={meshCount !== null && meshCount > 1}
          canDownloadSource={sourceCode !== null}
          canShare={canShare}
          explodeAmount={explodeAmount}
          hasTransforms={hasTransforms}
          isDownloading={isDownloading}
          isDownloadingSource={isDownloadingSource}
          isLatestRevisionSelected={isLatestRevisionSelected}
          isSharing={isSharing}
          modelBrowserNodes={modelBrowserNodes}
          revisions={revisions}
          activeRevisionKey={activeRevisionKey}
          selectedBrowserNodeId={selectedBrowserNodeId}
          transformMode={transformMode}
          visibleBrowserNodeIds={visibleBrowserNodeIds}
          wireframe={wireframe}
          onDownload={handleDownload}
          onDownloadSource={handleSourceDownload}
          onExplodeAmountChange={setExplodeAmount}
          onFitView={fitView}
          onResetTransforms={resetTransforms}
          onSelectLatestRevision={onSelectLatestRevision}
          onSelectRevision={onSelectRevision}
          onSelectBrowserNode={selectBrowserNode}
          onSetTransformMode={setTransformMode}
          onShare={handleOpenShareDialog}
          onSetView={setActiveView}
          onToggleAutoRotate={toggleAutoRotate}
          onToggleBrowserNodeVisibility={toggleBrowserNodeVisibility}
          onToggleWireframe={toggleWireframe}
        />
      ) : null}

      {isShareDialogOpen ? (
        <div className="absolute inset-0 z-50 grid place-items-center bg-background/40 p-4 backdrop-blur-[2px]" role="presentation">
          <form
            className={cn(viewerGlassClass, "grid w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-[1.25rem] p-4 text-foreground")}
            onSubmit={handleShareSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-model-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="share-model-title" className="text-sm font-semibold">
                  Share model
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Create a public link for this selected revision.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseShareDialog}
                disabled={isSharing}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close share dialog"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            {shareUrl ? (
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="share-model-link">
                  Public link
                </label>
                <div className="flex min-w-0 gap-2">
                  <input
                    id="share-model-link"
                    className={inputClass}
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className={cn(shareButtonClass, "shrink-0")}
                  >
                    {didCopyShareUrl ? <Check size={14} strokeWidth={1.75} /> : <Copy size={14} strokeWidth={1.75} />}
                    {didCopyShareUrl ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="share-model-name">
                  Model name
                </label>
                <input
                  id="share-model-name"
                  className={inputClass}
                  maxLength={80}
                  value={shareName}
                  onChange={(event) => setShareName(event.currentTarget.value)}
                  placeholder="My Example Model"
                  autoFocus
                />
              </div>
            )}

            {shareError ? <p className="text-xs text-error">{shareError}</p> : null}

            {shareUrl ? null : (
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSharing || !shareName.trim()}
                  className={cn(shareButtonClass, primaryButtonClass)}
                >
                  {isSharing ? <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} /> : null}
                  {isSharing ? "Sharing..." : "Create link"}
                </button>
              </div>
            )}
          </form>
        </div>
      ) : null}

      <ViewerGestureHint showGestures={loadState === "ready"} />
    </section>
  );
}
