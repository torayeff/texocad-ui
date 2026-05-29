"use client";

import { useState } from "react";

import {
  SketchMaskEditor,
} from "@/app/components/sketch-viewer/_components/sketch-mask-editor";
import { SketchViewerControls } from "@/app/components/sketch-viewer/_components/sketch-viewer-controls";
import { SketchViewerShareDialogs } from "@/app/components/sketch-viewer/_components/sketch-viewer-share-dialogs";
import { useSketchDownload } from "@/app/components/sketch-viewer/_hooks/use-sketch-download";
import { useSketchMaskEditor } from "@/app/components/sketch-viewer/_hooks/use-sketch-mask-editor";
import { useShareSketch } from "@/app/components/sketch-viewer/_hooks/use-share-sketch";
import { useFloatingPanel } from "@/app/components/viewer/_hooks/use-floating-panel";
import { usePublicShareDialog } from "@/app/hooks/use-public-share-dialog";
import type { ShareRevision } from "@/app/types/share-artifact";
import type {
  SketchMaskComposerState,
  SketchMaskEditRequest,
  SketchRevisionOption,
  SketchSource,
} from "@/app/types/sketch-viewer";

interface SketchViewerRevisions {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  revisions: SketchRevisionOption[];
}

interface SketchViewerSharing {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
}

interface SketchViewerProps {
  isMaskSubmitting?: boolean;
  onSubmitMaskEdit?: (request: SketchMaskEditRequest) => Promise<void> | void;
  onMaskEditorChange?: (state: SketchMaskComposerState | null) => void;
  revisions?: SketchViewerRevisions;
  sharing?: SketchViewerSharing;
  source: SketchSource | null;
  variant?: "studio" | "shared";
}

export default function SketchViewer({
  isMaskSubmitting = false,
  onSubmitMaskEdit,
  onMaskEditorChange,
  revisions,
  sharing,
  source,
  variant = "studio",
}: SketchViewerProps) {
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  const { isDownloading, downloadError, handleDownload } = useSketchDownload(source);

  const canMask = source !== null && onSubmitMaskEdit !== undefined;
  const {
    handleMaskChange,
    handleOpenMaskEditor,
    isMaskEditorOpen,
    maskEditorRef,
  } = useSketchMaskEditor({
    isMaskSubmitting,
    onMaskEditorChange,
    onSubmitMaskEdit,
    canMask,
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
  } = useShareSketch({
    activeRevisionKey: sharing?.activeRevisionKey ?? null,
    shareRevision: sharing?.shareRevision ?? null,
    source,
  });
  const publicShareDialog = usePublicShareDialog();

  const canShare = source !== null && sharing?.shareRevision != null;
  const canDownload = source !== null;
  const revisionOptions = revisions?.revisions ?? [];
  const canShowRevisions = revisionOptions.length > 0 && revisions !== undefined;
  const latestRevisionKey = revisionOptions[0]?.key ?? null;
  const activeRevision = revisionOptions.find((revision) => revision.key === revisions?.activeRevisionKey) ?? null;
  const hasSource = source !== null;
  const isSharedView = variant === "shared";
  const { activeTriggerRef, panelRef, panelStyle, railRef, resetPanelPosition } = useFloatingPanel(
    hasSource && revisionsOpen && canShowRevisions,
    [canShowRevisions, revisionsOpen, revisionOptions.length, revisions?.activeRevisionKey],
  );

  const toggleRevisions = (trigger: HTMLButtonElement) => {
    const nextOpen = !revisionsOpen;
    activeTriggerRef.current = nextOpen ? trigger : null;
    resetPanelPosition();
    setRevisionsOpen(nextOpen);
  };

  const closeRevisions = () => setRevisionsOpen(false);

  return (
    <section
      className="relative size-full overflow-hidden bg-white text-foreground"
      aria-label="Generated sketch viewer"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 py-20 md:p-8 md:py-24">
        {source && isMaskEditorOpen && canMask ? (
          <SketchMaskEditor
            ref={maskEditorRef}
            isSubmitting={isMaskSubmitting}
            onMaskChange={handleMaskChange}
            source={source}
          />
        ) : source ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed blob URLs are short-lived and not configured for Next image optimization
          <img
            src={source.url}
            alt={source.label}
            className="h-auto w-auto max-w-[min(1024px,calc(100vw-2rem))] max-h-[calc(100dvh-12rem)] object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No sketch loaded. Generate one in the chat.
          </p>
        )}
      </div>

      {downloadError ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-16 z-20 flex justify-center">
          <p className="rounded-xl border border-error/30 bg-background/90 px-3 py-2 text-xs text-error shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] backdrop-blur">
            {downloadError}
          </p>
        </div>
      ) : null}

      {hasSource ? (
        <SketchViewerControls
          activeRevision={activeRevision}
          activeRevisionKey={revisions?.activeRevisionKey ?? null}
          canDownload={canDownload}
          canMask={canMask}
          canShare={canShare}
          canShowRevisions={canShowRevisions}
          isLatestRevisionSelected={revisions?.isLatestRevisionSelected ?? true}
          isMaskEditorOpen={isMaskEditorOpen}
          isMaskSubmitting={isMaskSubmitting}
          isDownloading={isDownloading}
          isSharedView={isSharedView}
          isSharing={isSharing}
          latestRevisionKey={latestRevisionKey}
          panelRef={panelRef}
          panelStyle={panelStyle}
          railRef={railRef}
          revisions={revisionOptions}
          revisionsOpen={revisionsOpen}
          onCloseRevisions={closeRevisions}
          onDownload={handleDownload}
          onOpenMaskEditor={() => handleOpenMaskEditor(closeRevisions)}
          onPublicShare={publicShareDialog.handleOpenShareDialog}
          onSelectLatestRevision={revisions?.onSelectLatestRevision ?? closeRevisions}
          onSelectRevision={revisions?.onSelectRevision ?? closeRevisions}
          onShare={handleOpenShareDialog}
          onToggleRevisions={toggleRevisions}
        />
      ) : null}

      <SketchViewerShareDialogs
        createDialog={{
          didCopyShareUrl,
          isOpen: isShareDialogOpen,
          isSharing,
          onClose: handleCloseShareDialog,
          onCopyShareUrl: handleCopyShareUrl,
          onShareNameChange: setShareName,
          onSubmit: handleShareSubmit,
          shareError,
          shareName,
          shareUrl,
        }}
        publicDialog={{
          didCopyShareUrl: publicShareDialog.didCopyShareUrl,
          isOpen: publicShareDialog.isShareDialogOpen,
          onClose: publicShareDialog.handleCloseShareDialog,
          onCopyShareUrl: publicShareDialog.handleCopyShareUrl,
          shareError: publicShareDialog.shareError,
          shareUrl: publicShareDialog.shareUrl,
        }}
      />
    </section>
  );
}
