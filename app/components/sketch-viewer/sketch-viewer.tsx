"use client";

import { Brush, Download, History, Loader2, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  SketchMaskEditor,
  type SketchMaskEditorHandle,
} from "@/app/components/sketch-viewer/_components/sketch-mask-editor";
import { SketchRevisionMenu } from "@/app/components/sketch-viewer/_components/sketch-revision-menu";
import { SketchShareDialog } from "@/app/components/sketch-viewer/_components/sketch-share-dialog";
import { useShareSketch } from "@/app/components/sketch-viewer/_hooks/use-share-sketch";
import {
  sketchViewerActiveControlClass,
  sketchViewerToolButtonClass,
  sketchViewerToolRailClass,
} from "@/app/components/sketch-viewer/_lib/sketch-viewer-styles";
import { ViewerToolButton } from "@/app/components/model-viewer/_components/viewer-tool-button";
import { loadingIconClass } from "@/app/components/model-viewer/_lib/viewer-styles";
import { useFloatingPanel } from "@/app/components/model-viewer/_hooks/use-floating-panel";
import { usePublicShareDialog } from "@/app/hooks/use-public-share-dialog";
import { cn } from "@/app/lib/cn";
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
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
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
    if (!source) return;
    downloadLinkRef.current?.click();
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
        <div ref={railRef} className={sketchViewerToolRailClass} aria-label="Sketch controls">
          {isSharedView ? (
            <ViewerToolButton
              type="button"
              onClick={publicShareDialog.handleOpenShareDialog}
              tooltip="Share"
              aria-label="Share sketch"
              className={sketchViewerToolButtonClass}
            >
              <Share2 size={14} strokeWidth={1.75} />
            </ViewerToolButton>
          ) : (
            <ViewerToolButton
              type="button"
              disabled={!canMask || isMaskSubmitting}
              onClick={handleOpenMaskEditor}
              tooltip="Edit"
              aria-label="Edit sketch with mask"
              className={cn(sketchViewerToolButtonClass, isMaskEditorOpen && sketchViewerActiveControlClass)}
            >
              {isMaskSubmitting ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Brush size={14} strokeWidth={1.75} />
              )}
            </ViewerToolButton>
          )}

          {canShare && !isSharedView ? (
            <ViewerToolButton
              type="button"
              onClick={handleOpenShareDialog}
              disabled={isSharing}
              tooltip="Share"
              aria-label="Share sketch"
              className={sketchViewerToolButtonClass}
            >
              {isSharing ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Share2 size={14} strokeWidth={1.75} />
              )}
            </ViewerToolButton>
          ) : null}

          {canDownload ? (
            <ViewerToolButton
              type="button"
              onClick={handleDownload}
              tooltip="Download"
              aria-label="Download sketch"
              className={sketchViewerToolButtonClass}
            >
              <Download size={14} strokeWidth={1.75} />
            </ViewerToolButton>
          ) : null}

          {canShowRevisions ? (
            <ViewerToolButton
              type="button"
              onClick={(event) => toggleRevisions(event.currentTarget)}
              tooltip="Revisions"
              tooltipDisabled={revisionsOpen}
              aria-label={activeRevision ? `Revisions, viewing revision ${activeRevision.revisionNumber}` : "Revisions"}
              aria-expanded={revisionsOpen}
              aria-haspopup="menu"
              aria-controls="sketch-revision-menu"
              className={cn(sketchViewerToolButtonClass, (revisionsOpen || !revisions.isLatestRevisionSelected) && sketchViewerActiveControlClass)}
            >
              <History size={14} strokeWidth={1.75} />
            </ViewerToolButton>
          ) : null}

          {revisionsOpen && canShowRevisions ? (
            <SketchRevisionMenu
              ref={panelRef}
              activeRevisionKey={revisions.activeRevisionKey}
              isLatestRevisionSelected={revisions.isLatestRevisionSelected}
              latestRevisionKey={latestRevisionKey}
              revisions={revisionOptions}
              style={panelStyle}
              onClose={closeRevisions}
              onSelectLatestRevision={revisions.onSelectLatestRevision}
              onSelectRevision={revisions.onSelectRevision}
            />
          ) : null}
        </div>
      ) : null}

      {source ? (
        <a
          ref={downloadLinkRef}
          className="hidden"
          href={source.url}
          download={source.label}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      {isShareDialogOpen ? (
        <SketchShareDialog
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
        <SketchShareDialog
          didCopyShareUrl={publicShareDialog.didCopyShareUrl}
          isSharing={false}
          onClose={publicShareDialog.handleCloseShareDialog}
          onCopyShareUrl={publicShareDialog.handleCopyShareUrl}
          onShareNameChange={() => undefined}
          onSubmit={(event) => event.preventDefault()}
          shareError={publicShareDialog.shareError}
          shareName={source?.label ?? ""}
          shareUrl={publicShareDialog.shareUrl}
        />
      ) : null}
    </section>
  );
}
