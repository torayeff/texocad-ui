"use client";

import { Loader2 } from "lucide-react";

import type { ModelSource, ShareRevision, ViewerRevisionOption } from "@/app/types/model-viewer";
import { ModelLoadPanel } from "@/app/components/model-viewer/_components/model-load-panel";
import { loadingIconClass } from "@/app/components/viewer/viewer-styles";
import { ShareModelDialog } from "@/app/components/model-viewer/_components/share-model-dialog";
import { ViewerControls } from "@/app/components/model-viewer/_components/viewer-controls";
import { ViewerGestureHint } from "@/app/components/model-viewer/_components/viewer-gesture-hint";
import { useLocalModelShare } from "@/app/components/model-viewer/_hooks/use-local-model-share";
import { useModelDownloads } from "@/app/components/model-viewer/_hooks/use-model-downloads";
import { useModelViewerScene } from "@/app/components/model-viewer/_hooks/use-model-viewer-scene";
import { useShareModel } from "@/app/components/model-viewer/_hooks/use-share-model";
import { usePublicShareDialog } from "@/app/hooks/use-public-share-dialog";

interface ModelViewerDownloads {
  sourceCode: ModelSource | null;
}

interface ModelViewerSharing {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
}

interface ModelViewerRevisions {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  revisions: ViewerRevisionOption[];
}

interface ModelViewerProps {
  downloads?: ModelViewerDownloads;
  localFiles?: {
    enabled: boolean;
    onClear: () => void;
    onFileChange: (file: File | null) => void;
    onShareCreated?: (shareUrl: string) => void;
  };
  revisions?: ModelViewerRevisions;
  sharing?: ModelViewerSharing;
  source: ModelSource | null;
  variant?: "studio" | "shared";
}

export default function ModelViewer({
  downloads,
  localFiles,
  revisions,
  sharing,
  source,
  variant = "studio",
}: ModelViewerProps) {
  const {
    activeView,
    autoRotate,
    containerRef,
    explodeAmount,
    fitView,
    hasTransforms,
    loadProgress,
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
  const { handleDownload, handleSourceDownload, isDownloading, isDownloadingSource } = useModelDownloads({
    source,
    sourceCode: downloads?.sourceCode ?? null,
  });
  const {
    didCopyShareUrl,
    handleCloseShareDialog,
    handleCopyShareUrl,
    handleOpenShareDialog,
    handleShareSubmit,
    isShareDialogOpen,
    isSharing,
    setShareName,
    shareError,
    shareName,
    shareUrl,
  } = useShareModel({
    activeRevisionKey: sharing?.activeRevisionKey ?? null,
    shareRevision: sharing?.shareRevision ?? null,
    source,
  });
  const publicShareDialog = usePublicShareDialog();
  const localShare = useLocalModelShare({
    onShareCreated: localFiles?.onShareCreated,
    source,
  });

  const canUseModel = source !== null && loadState === "ready";
  const canUseLocalFiles = localFiles?.enabled === true;
  const isSharedView = variant === "shared";
  const canShare = canUseModel && (
    canUseLocalFiles ||
    isSharedView ||
    sharing?.shareRevision !== null && sharing?.shareRevision !== undefined
  );

  return (
    <section
      className="relative size-full overflow-visible bg-[var(--viewer-background,var(--muted))] text-foreground md:overflow-hidden"
      aria-label={canUseLocalFiles ? "Local CAD viewer" : "Generated CAD viewer"}
    >
      <div ref={containerRef} className="absolute inset-0 cursor-grab [&_canvas]:block [&_canvas]:size-full" />

      {!canUseLocalFiles && !source && loadState === "idle" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No model loaded. Generate one in the chat.
          </p>
        </div>
      ) : null}

      {!canUseLocalFiles && source && loadState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} strokeWidth={1.75} className={loadingIconClass} />
            <span>{status}</span>
          </div>
        </div>
      ) : null}

      {!canUseLocalFiles && source && loadState === "error" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-error">{status}</p>
        </div>
      ) : null}

      {canUseModel ? (
        <ViewerControls
          activeView={activeView}
          autoRotate={autoRotate}
          canClear={canUseLocalFiles}
          canDownload={source !== null}
          canExplode={meshCount !== null && meshCount > 1}
          canDownloadSource={downloads?.sourceCode !== null && downloads?.sourceCode !== undefined}
          canShare={canShare}
          explodeAmount={explodeAmount}
          hasTransforms={hasTransforms}
          isDownloading={isDownloading}
          isDownloadingSource={isDownloadingSource}
          isLatestRevisionSelected={revisions?.isLatestRevisionSelected ?? true}
          isSharing={canUseLocalFiles ? localShare.isSharing : isSharing}
          modelBrowserNodes={modelBrowserNodes}
          revisions={revisions?.revisions ?? []}
          activeRevisionKey={revisions?.activeRevisionKey ?? null}
          selectedBrowserNodeId={selectedBrowserNodeId}
          transformMode={transformMode}
          visibleBrowserNodeIds={visibleBrowserNodeIds}
          wireframe={wireframe}
          onClear={localFiles?.onClear}
          onDownload={handleDownload}
          onDownloadSource={handleSourceDownload}
          onExplodeAmountChange={setExplodeAmount}
          onFitView={fitView}
          onResetTransforms={resetTransforms}
          onSelectLatestRevision={revisions?.onSelectLatestRevision}
          onSelectRevision={revisions?.onSelectRevision}
          onSelectBrowserNode={selectBrowserNode}
          onSetTransformMode={setTransformMode}
          onShare={
            canUseLocalFiles
              ? localShare.handleOpenShareDialog
              : isSharedView
                ? publicShareDialog.handleOpenShareDialog
                : handleOpenShareDialog
          }
          onSetView={setActiveView}
          onToggleAutoRotate={toggleAutoRotate}
          onToggleBrowserNodeVisibility={toggleBrowserNodeVisibility}
          onToggleWireframe={toggleWireframe}
        />
      ) : null}

      {canUseLocalFiles ? (
        <ModelLoadPanel
          loadState={loadState}
          loadProgress={loadProgress}
          showUpload={loadState === "idle" || loadState === "error"}
          status={status}
          onFileChange={localFiles.onFileChange}
        />
      ) : null}

      {canUseLocalFiles && localShare.isShareDialogOpen ? (
        <ShareModelDialog
          mode="create"
          didCopyShareUrl={localShare.didCopyShareUrl}
          isSharing={localShare.isSharing}
          onClose={localShare.handleCloseShareDialog}
          onCopyShareUrl={localShare.handleCopyShareUrl}
          onShareNameChange={localShare.setShareName}
          onSubmit={localShare.handleShareSubmit}
          shareError={localShare.shareError}
          shareName={localShare.shareName}
          shareUrl={localShare.shareUrl}
        />
      ) : null}

      {!canUseLocalFiles && isShareDialogOpen ? (
        <ShareModelDialog
          mode="create"
          didCopyShareUrl={didCopyShareUrl}
          isSharing={isSharing}
          onClose={handleCloseShareDialog}
          onCopyShareUrl={handleCopyShareUrl}
          onShareNameChange={setShareName}
          onSubmit={handleShareSubmit}
          shareError={shareError}
          shareName={shareName}
          shareUrl={shareUrl}
        />
      ) : null}

      {publicShareDialog.isShareDialogOpen ? (
        <ShareModelDialog
          mode="copy"
          didCopyShareUrl={publicShareDialog.didCopyShareUrl}
          isSharing={false}
          onClose={publicShareDialog.handleCloseShareDialog}
          onCopyShareUrl={publicShareDialog.handleCopyShareUrl}
          shareError={publicShareDialog.shareError}
          shareUrl={publicShareDialog.shareUrl}
        />
      ) : null}

      <ViewerGestureHint showGestures={loadState === "ready"} />
    </section>
  );
}
