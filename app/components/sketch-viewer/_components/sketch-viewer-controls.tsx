import { Brush, Download, History, Loader2, Share2 } from "lucide-react";

import { SketchRevisionMenu } from "@/app/components/sketch-viewer/_components/sketch-revision-menu";
import {
  activeControlClass,
  loadingIconClass,
  toolButtonClass,
  toolRailClass,
} from "@/app/components/viewer/viewer-styles";
import { ViewerToolButton } from "@/app/components/viewer/viewer-tool-button";
import { cn } from "@/app/lib/cn";
import type { SketchRevisionOption } from "@/app/types/sketch-viewer";

import type { CSSProperties, RefObject } from "react";

interface SketchViewerControlsProps {
  activeRevision: SketchRevisionOption | null;
  activeRevisionKey: string | null;
  canDownload: boolean;
  canMask: boolean;
  canShare: boolean;
  canShowRevisions: boolean;
  isLatestRevisionSelected: boolean;
  isMaskEditorOpen: boolean;
  isMaskSubmitting: boolean;
  isSharedView: boolean;
  isSharing: boolean;
  latestRevisionKey: string | null;
  panelRef: RefObject<HTMLDivElement | null>;
  panelStyle: CSSProperties;
  railRef: RefObject<HTMLDivElement | null>;
  revisions: SketchRevisionOption[];
  revisionsOpen: boolean;
  onCloseRevisions: () => void;
  onDownload: () => void;
  onOpenMaskEditor: () => void;
  onPublicShare: () => void;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  onShare: () => void;
  onToggleRevisions: (trigger: HTMLButtonElement) => void;
}

export function SketchViewerControls({
  activeRevision,
  activeRevisionKey,
  canDownload,
  canMask,
  canShare,
  canShowRevisions,
  isLatestRevisionSelected,
  isMaskEditorOpen,
  isMaskSubmitting,
  isSharedView,
  isSharing,
  latestRevisionKey,
  onCloseRevisions,
  onDownload,
  onOpenMaskEditor,
  onPublicShare,
  onSelectLatestRevision,
  onSelectRevision,
  onShare,
  onToggleRevisions,
  panelRef,
  panelStyle,
  railRef,
  revisions,
  revisionsOpen,
}: SketchViewerControlsProps) {
  return (
    <div ref={railRef} className={toolRailClass} aria-label="Sketch controls">
      {isSharedView ? (
        <ViewerToolButton
          type="button"
          onClick={onPublicShare}
          tooltip="Share"
          aria-label="Share sketch"
          className={toolButtonClass}
        >
          <Share2 size={14} strokeWidth={1.75} />
        </ViewerToolButton>
      ) : (
        <ViewerToolButton
          type="button"
          disabled={!canMask || isMaskSubmitting}
          onClick={onOpenMaskEditor}
          tooltip="Edit"
          aria-label="Edit sketch with mask"
          className={cn(toolButtonClass, isMaskEditorOpen && activeControlClass)}
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
          onClick={onShare}
          disabled={isSharing}
          tooltip="Share"
          aria-label="Share sketch"
          className={toolButtonClass}
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
          onClick={onDownload}
          tooltip="Download"
          aria-label="Download sketch"
          className={toolButtonClass}
        >
          <Download size={14} strokeWidth={1.75} />
        </ViewerToolButton>
      ) : null}

      {canShowRevisions ? (
        <ViewerToolButton
          type="button"
          onClick={(event) => onToggleRevisions(event.currentTarget)}
          tooltip="Revisions"
          tooltipDisabled={revisionsOpen}
          aria-label={activeRevision ? `Revisions, viewing revision ${activeRevision.revisionNumber}` : "Revisions"}
          aria-expanded={revisionsOpen}
          aria-haspopup="menu"
          aria-controls="sketch-revision-menu"
          className={cn(toolButtonClass, (revisionsOpen || !isLatestRevisionSelected) && activeControlClass)}
        >
          <History size={14} strokeWidth={1.75} />
        </ViewerToolButton>
      ) : null}

      {revisionsOpen && canShowRevisions ? (
        <SketchRevisionMenu
          ref={panelRef}
          activeRevisionKey={activeRevisionKey}
          isLatestRevisionSelected={isLatestRevisionSelected}
          latestRevisionKey={latestRevisionKey}
          revisions={revisions}
          style={panelStyle}
          onClose={onCloseRevisions}
          onSelectLatestRevision={onSelectLatestRevision}
          onSelectRevision={onSelectRevision}
        />
      ) : null}
    </div>
  );
}
