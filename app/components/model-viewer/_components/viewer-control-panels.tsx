import type { CSSProperties, RefObject } from "react";
import { Loader2, MoveDiagonal, Rotate3d, Undo2 } from "lucide-react";

import { viewLabels, viewPresets } from "@/app/components/model-viewer/_lib/model-viewer-state";
import { ModelBrowserTree } from "@/app/components/model-viewer/_components/model-browser-tree";
import {
  activeControlClass,
  controlFloatingPanelClass,
  controlMenuItemClass,
  controlMenuPopoverClass,
  controlPanelPopoverClass,
  loadingIconClass,
} from "@/app/components/viewer/viewer-styles";
import type { ModelBrowserNode, TransformMode, ViewPreset } from "@/app/types/model-viewer";
import { cn } from "@/app/lib/cn";

interface FloatingPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
}

interface ViewPresetsMenuProps extends FloatingPanelProps {
  activeView: ViewPreset | null;
  onClose: () => void;
  onSetView: (view: ViewPreset) => void;
}

export function ViewPresetsMenu({ activeView, onClose, onSetView, panelRef, style }: ViewPresetsMenuProps) {
  return (
    <div
      ref={panelRef}
      className={cn(controlMenuPopoverClass, "!w-32")}
      style={style}
      id="view-presets-menu"
      role="menu"
      aria-label="Camera views"
    >
      {viewPresets.map((view) => (
        <button
          key={view}
          type="button"
          role="menuitemradio"
          aria-checked={activeView === view}
          onClick={() => {
            onSetView(view);
            onClose();
          }}
          className={cn(controlMenuItemClass, activeView === view && activeControlClass)}
        >
          {viewLabels[view]}
        </button>
      ))}
    </div>
  );
}

interface DownloadMenuProps extends FloatingPanelProps {
  canDownload: boolean;
  canDownloadSource: boolean;
  isDownloading: boolean;
  isDownloadingSource: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDownloadSource: () => void;
}

export function DownloadMenu({
  canDownload,
  canDownloadSource,
  isDownloading,
  isDownloadingSource,
  onClose,
  onDownload,
  onDownloadSource,
  panelRef,
  style,
}: DownloadMenuProps) {
  return (
    <div
      ref={panelRef}
      className={controlMenuPopoverClass}
      style={style}
      id="download-menu"
      role="menu"
      aria-label="Download files"
    >
      {canDownload ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDownload();
            onClose();
          }}
          disabled={isDownloading}
          className={controlMenuItemClass}
        >
          <span>3D File</span>
          {isDownloading ? <Loader2 size={13} strokeWidth={1.75} className={loadingIconClass} /> : null}
        </button>
      ) : null}
      {canDownloadSource ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onDownloadSource();
            onClose();
          }}
          disabled={isDownloadingSource}
          className={controlMenuItemClass}
        >
          <span>Source code</span>
          {isDownloadingSource ? <Loader2 size={13} strokeWidth={1.75} className={loadingIconClass} /> : null}
        </button>
      ) : null}
    </div>
  );
}

interface ComponentsPanelProps extends FloatingPanelProps {
  modelBrowserNodes: ModelBrowserNode[];
  onSelectBrowserNode: (id: string) => void;
  onToggleBrowserNodeVisibility: (id: string) => void;
  selectedBrowserNodeId: string | null;
  visibleBrowserNodeIds: Set<string>;
}

export function ComponentsPanel({
  modelBrowserNodes,
  onSelectBrowserNode,
  onToggleBrowserNodeVisibility,
  panelRef,
  selectedBrowserNodeId,
  style,
  visibleBrowserNodeIds,
}: ComponentsPanelProps) {
  return (
    <div ref={panelRef} className={controlFloatingPanelClass} style={style}>
      <ModelBrowserTree
        id="model-components-menu"
        nodes={modelBrowserNodes}
        onSelectNode={onSelectBrowserNode}
        onToggleNodeVisibility={onToggleBrowserNodeVisibility}
        selectedNodeId={selectedBrowserNodeId}
        visibleNodeIds={visibleBrowserNodeIds}
      />
    </div>
  );
}

interface ExplodePanelProps extends FloatingPanelProps {
  explodeAmount: number;
  onExplodeAmountChange: (amount: number) => void;
}

export function ExplodePanel({ explodeAmount, onExplodeAmountChange, panelRef, style }: ExplodePanelProps) {
  return (
    <div
      ref={panelRef}
      className={controlPanelPopoverClass}
      style={style}
      id="explode-slider"
      aria-label="Exploded view controls"
    >
      <div className="flex items-center justify-between gap-3 text-[0.75rem] font-medium tracking-[-0.01em] text-muted-foreground">
        <span>Explode</span>
        <span className="tabular-nums text-[color-mix(in_srgb,var(--muted-foreground)_78%,transparent)]">
          {explodeAmount}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={explodeAmount}
        onChange={(event) => onExplodeAmountChange(Number(event.currentTarget.value))}
        aria-label="Explode amount"
        className="h-1.5 w-full cursor-pointer accent-foreground"
      />
    </div>
  );
}

interface TransformMenuProps extends FloatingPanelProps {
  hasTransforms: boolean;
  onClose: () => void;
  onResetTransforms: () => void;
  onSetTransformMode: (mode: TransformMode) => void;
  transformMode: TransformMode;
}

export function TransformMenu({
  hasTransforms,
  onClose,
  onResetTransforms,
  onSetTransformMode,
  panelRef,
  style,
  transformMode,
}: TransformMenuProps) {
  return (
    <div
      ref={panelRef}
      className={cn(controlMenuPopoverClass, "!w-32")}
      style={style}
      id="transform-menu"
      role="menu"
      aria-label="Transform controls"
    >
      <button
        type="button"
        role="menuitemradio"
        aria-checked={transformMode === "translate"}
        onClick={() => {
          onSetTransformMode(transformMode === "translate" ? null : "translate");
          onClose();
        }}
        className={cn(controlMenuItemClass, "justify-start gap-2", transformMode === "translate" && activeControlClass)}
      >
        <MoveDiagonal size={12} strokeWidth={1.75} />
        Move
      </button>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={transformMode === "rotate"}
        onClick={() => {
          onSetTransformMode(transformMode === "rotate" ? null : "rotate");
          onClose();
        }}
        className={cn(controlMenuItemClass, "justify-start gap-2", transformMode === "rotate" && activeControlClass)}
      >
        <Rotate3d size={12} strokeWidth={1.75} />
        Rotate
      </button>
      {hasTransforms ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onResetTransforms();
            onClose();
          }}
          className={cn(controlMenuItemClass, "justify-start gap-2")}
        >
          <Undo2 size={12} strokeWidth={1.75} />
          Reset
        </button>
      ) : null}
    </div>
  );
}
