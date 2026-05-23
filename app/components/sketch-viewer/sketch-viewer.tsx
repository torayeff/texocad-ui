"use client";

import { History, Loader2, Share2 } from "lucide-react";

import { SketchShareDialog } from "@/app/components/sketch-viewer/_components/sketch-share-dialog";
import { useShareSketch } from "@/app/components/sketch-viewer/_hooks/use-share-sketch";
import {
  sketchViewerActiveControlClass,
  sketchViewerGlassClass,
  sketchViewerToolButtonClass,
  sketchViewerToolRailClass,
} from "@/app/components/sketch-viewer/_lib/sketch-viewer-styles";
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
  const revisionOptions = revisions?.revisions ?? [];
  const canShowRevisions = revisionOptions.length > 0 && revisions !== undefined;
  const latestRevisionKey = revisionOptions[0]?.key ?? null;

  return (
    <section
      className="relative size-full overflow-hidden bg-[var(--viewer-background,var(--muted))] text-foreground"
      aria-label="Generated sketch viewer"
    >
      <div className="absolute inset-0 flex items-center justify-center p-6 md:p-10">
        {source ? (
          <div className="relative max-h-full w-full max-w-5xl overflow-hidden rounded-[var(--viewer-radius)] border border-[color-mix(in_srgb,var(--border)_42%,transparent)] bg-[color-mix(in_srgb,var(--viewer-field-background)_72%,transparent)] shadow-[0_24px_80px_rgb(0_0_0_/_0.14)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed blob URLs are short-lived and not configured for Next image optimization */}
            <img
              src={source.url}
              alt={source.label}
              className="h-full max-h-[calc(100dvh-10rem)] w-full object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No sketch loaded. Generate one in the chat.
          </p>
        )}
      </div>

      {canShare ? (
        <div className={sketchViewerToolRailClass}>
          <button
            type="button"
            onClick={handleOpenShareDialog}
            disabled={isSharing}
            className={sketchViewerToolButtonClass}
            aria-label="Share sketch"
          >
            {isSharing ? (
              <Loader2 size={14} strokeWidth={1.75} className="animate-spin" />
            ) : (
              <Share2 size={14} strokeWidth={1.75} />
            )}
          </button>
        </div>
      ) : null}

      {canShowRevisions ? (
        <div className={cn(sketchViewerGlassClass, "absolute bottom-5 right-5 top-5 z-30 flex w-20 flex-col gap-1 overflow-y-auto rounded-[var(--viewer-control-radius)] p-1")}>
          {revisionOptions.map((revision) => {
            const isLatestRevision = revision.key === latestRevisionKey;
            const isSelected = revisions?.activeRevisionKey === revision.key && (!isLatestRevision || revisions.isLatestRevisionSelected);
            return (
              <button
                key={revision.key}
                type="button"
                disabled={!revision.canView}
                onClick={() => {
                  if (!revision.canView) return;
                  if (isLatestRevision) {
                    revisions.onSelectLatestRevision();
                  } else {
                    revisions.onSelectRevision(revision.key);
                  }
                }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-transparent text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55",
                  isSelected && sketchViewerActiveControlClass,
                )}
                aria-label={`View sketch revision ${revision.revisionNumber}`}
              >
                <History size={14} strokeWidth={1.75} />
                <span className="mt-1">R{revision.revisionNumber}</span>
              </button>
            );
          })}
        </div>
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
