"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SketchMaskEditor,
  type SketchMaskEditorHandle,
} from "@/app/components/sketch-viewer/_components/sketch-mask-editor";
import { SketchViewerControls } from "@/app/components/sketch-viewer/_components/sketch-viewer-controls";
import { SketchViewerShareDialogs } from "@/app/components/sketch-viewer/_components/sketch-viewer-share-dialogs";
import { useShareSketch } from "@/app/components/sketch-viewer/_hooks/use-share-sketch";
import { useFloatingPanel } from "@/app/components/viewer/use-floating-panel";
import { usePublicShareDialog } from "@/app/hooks/use-public-share-dialog";
import { saveModelFile } from "@/app/components/model-viewer/_lib/model-viewer-actions";
import type {
  ShareSketchRevision,
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
  shareRevision: ShareSketchRevision | null;
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

async function downloadSketchSource(source: SketchSource) {
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sketch: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  saveModelFile(buffer, source.label, response.headers.get("Content-Type") ?? "application/octet-stream");
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
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [maskError, setMaskError] = useState<string | null>(null);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const maskEditorRef = useRef<SketchMaskEditorHandle | null>(null);
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
  const canMask = source !== null && onSubmitMaskEdit !== undefined;
  const hasSource = source !== null;
  const isSharedView = variant === "shared";
  const { activeTriggerRef, panelRef, panelStyle, railRef, resetPanelPosition } = useFloatingPanel(
    hasSource && revisionsOpen && canShowRevisions,
    [canShowRevisions, revisionsOpen, revisionOptions.length, revisions?.activeRevisionKey],
  );

  const handleDownload = () => {
    if (!source || isDownloading) return;

    setIsDownloading(true);
    void downloadSketchSource(source)
      .catch(() => window.alert("Could not download the sketch."))
      .finally(() => setIsDownloading(false));
  };

  const toggleRevisions = (trigger: HTMLButtonElement) => {
    const nextOpen = !revisionsOpen;
    activeTriggerRef.current = nextOpen ? trigger : null;
    resetPanelPosition();
    setRevisionsOpen(nextOpen);
  };

  const closeRevisions = () => setRevisionsOpen(false);

  const handleCloseMaskEditor = useCallback(() => {
    if (isMaskSubmitting) return;
    setIsMaskEditorOpen(false);
    setHasMask(false);
    setMaskError(null);
  }, [isMaskSubmitting]);

  const handleSubmitMaskEdit = useCallback(async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      const message = "Describe what should change inside the masked area.";
      setMaskError(message);
      throw new Error(message);
    }

    try {
      const mask = await maskEditorRef.current?.createMaskFile();
      if (!mask) {
        throw new Error("Brush the area you want to edit first.");
      }

      if (!onSubmitMaskEdit) {
        throw new Error("Mask editing is not available.");
      }

      await onSubmitMaskEdit({ prompt: trimmedPrompt, mask });
      setIsMaskEditorOpen(false);
      setHasMask(false);
      setMaskError(null);
      onMaskEditorChange?.(null);
    } catch (submitError) {
      setMaskError(submitError instanceof Error ? submitError.message : "Could not submit masked edit.");
      throw submitError;
    }
  }, [onMaskEditorChange, onSubmitMaskEdit]);

  const handleMaskChange = useCallback((nextHasMask: boolean) => {
    setHasMask(nextHasMask);
    if (nextHasMask) {
      setMaskError(null);
    }
  }, []);

  const handleOpenMaskEditor = () => {
    closeRevisions();
    setMaskError(null);
    setIsMaskEditorOpen(true);
  };

  useEffect(() => {
    if (!isMaskEditorOpen || !canMask) {
      onMaskEditorChange?.(null);
      return;
    }

    onMaskEditorChange?.({
      canSubmit: hasMask,
      clear: () => maskEditorRef.current?.clear(),
      close: handleCloseMaskEditor,
      error: maskError,
      isSubmitting: isMaskSubmitting,
      submit: handleSubmitMaskEdit,
    });
  }, [
    canMask,
    handleCloseMaskEditor,
    handleSubmitMaskEdit,
    hasMask,
    isMaskEditorOpen,
    isMaskSubmitting,
    maskError,
    onMaskEditorChange,
  ]);

  return (
    <section
      className="relative size-full overflow-hidden bg-[var(--viewer-background,var(--muted))] text-foreground"
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
          onOpenMaskEditor={handleOpenMaskEditor}
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
