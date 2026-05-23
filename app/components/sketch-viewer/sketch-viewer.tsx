"use client";

import { Download, History, Loader2, Pencil, Scan, Share2 } from "lucide-react";
import { useRef, useState } from "react";

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
import { cn } from "@/app/lib/cn";
import type { ShareSketchRevision, SketchRevisionOption, SketchSource } from "@/app/types/sketch-viewer";

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
  revisions?: SketchViewerRevisions;
  sharing?: SketchViewerSharing;
  source: SketchSource | null;
}

export default function SketchViewer({ revisions, sharing, source }: SketchViewerProps) {
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
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

  const canShare = source !== null && sharing?.shareRevision != null;
  const canDownload = source !== null;
  const revisionOptions = revisions?.revisions ?? [];
  const canShowRevisions = revisionOptions.length > 0 && revisions !== undefined;
  const latestRevisionKey = revisionOptions[0]?.key ?? null;
  const activeRevision = revisionOptions.find((revision) => revision.key === revisions?.activeRevisionKey) ?? null;
  const { activeTriggerRef, panelRef, panelStyle, railRef, resetPanelPosition } = useFloatingPanel(
    revisionsOpen && canShowRevisions,
    [canShowRevisions, revisionsOpen, revisionOptions.length, revisions?.activeRevisionKey],
  );

  const handleDownload = () => {
    downloadLinkRef.current?.click();
  };

  const toggleRevisions = (trigger: HTMLButtonElement) => {
    const nextOpen = !revisionsOpen;
    activeTriggerRef.current = nextOpen ? trigger : null;
    resetPanelPosition();
    setRevisionsOpen(nextOpen);
  };

  const closeRevisions = () => setRevisionsOpen(false);

  return (
    <section
      className="relative size-full overflow-hidden bg-[var(--viewer-background,var(--muted))] text-foreground"
      aria-label="Generated sketch viewer"
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 py-20 md:p-8 md:py-24">
        {source ? (
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

      <div ref={railRef} className={sketchViewerToolRailClass} aria-label="Sketch controls">
        <ViewerToolButton
          type="button"
          disabled
          tooltip="Mask"
          aria-label="Mask sketch"
          className={sketchViewerToolButtonClass}
        >
          <Scan size={14} strokeWidth={1.75} />
        </ViewerToolButton>
        <ViewerToolButton
          type="button"
          disabled
          tooltip="Annotate"
          aria-label="Annotate sketch"
          className={sketchViewerToolButtonClass}
        >
          <Pencil size={14} strokeWidth={1.75} />
        </ViewerToolButton>

        {canShare ? (
          <ViewerToolButton
            type="button"
            onClick={handleOpenShareDialog}
            disabled={isSharing}
            tooltip="Share sketch"
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
            tooltip="Download sketch"
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
    </section>
  );
}
