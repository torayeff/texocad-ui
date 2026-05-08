import { type ButtonHTMLAttributes, type ReactNode, memo, useMemo, useState } from "react";
import { Camera, Download, Focus, History, Layers, Loader2, Move3d, MoveDiagonal, Puzzle, RefreshCcwDot, Rotate3d, Share2, SquareDashed, Undo2 } from "lucide-react";

import type { ViewerRevisionOption } from "@/app/studio/_components/viewer/model-viewer-revisions";
import { type ModelBrowserNode, type TransformMode, type ViewPreset, viewLabels, viewPresets } from "@/app/studio/_components/viewer/model-viewer-state";
import { countModelBrowserNodes, ModelBrowserTree } from "@/app/studio/_components/viewer/ui/model-browser-tree";
import { RevisionMenu } from "@/app/studio/_components/viewer/ui/revision-menu";
import {
  activeControlClass,
  cn,
  controlFloatingPanelClass,
  controlMenuItemClass,
  controlMenuPopoverClass,
  controlPanelPopoverClass,
  loadingIconClass,
  toolButtonClass,
  toolRailClass,
  toolTooltipClass,
} from "@/app/studio/_components/viewer/ui/styles";

interface ViewerControlsProps {
  activeView: ViewPreset | null;
  autoRotate: boolean;
  canDownload: boolean;
  canExplode: boolean;
  canDownloadSource: boolean;
  canShare: boolean;
  explodeAmount: number;
  hasTransforms: boolean;
  isDownloading: boolean;
  isDownloadingSource: boolean;
  isLatestRevisionSelected: boolean;
  isSharing: boolean;
  modelBrowserNodes: ModelBrowserNode[];
  revisions: ViewerRevisionOption[];
  activeRevisionKey: string | null;
  selectedBrowserNodeId: string | null;
  transformMode: TransformMode;
  visibleBrowserNodeIds: Set<string>;
  wireframe: boolean;
  onDownload: () => void;
  onDownloadSource: () => void;
  onFitView: () => void;
  onResetTransforms: () => void;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  onSelectBrowserNode: (id: string) => void;
  onExplodeAmountChange: (amount: number) => void;
  onSetTransformMode: (mode: TransformMode) => void;
  onShare: () => void;
  onSetView: (view: ViewPreset) => void;
  onToggleBrowserNodeVisibility: (id: string) => void;
  onToggleAutoRotate: () => void;
  onToggleWireframe: () => void;
}

type OpenPanel = "components" | "download" | "explode" | "revisions" | "transform" | "views";

interface ToolButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  children: ReactNode;
  tooltip: string;
  tooltipDisabled?: boolean;
}

function ToolButton({ children, className, tooltip, tooltipDisabled = false, ...buttonProps }: ToolButtonProps) {
  return (
    <span className="group/tooltip relative inline-grid">
      <button {...buttonProps} aria-label={buttonProps["aria-label"] ?? tooltip} className={className}>
        {children}
      </button>
      {tooltipDisabled ? null : (
        <span role="tooltip" className={toolTooltipClass}>
          {tooltip}
        </span>
      )}
    </span>
  );
}

export const ViewerControls = memo(function ViewerControls({
  activeView,
  autoRotate,
  canDownload,
  canExplode,
  canDownloadSource,
  canShare,
  explodeAmount,
  hasTransforms,
  isDownloading,
  isDownloadingSource,
  isLatestRevisionSelected,
  isSharing,
  modelBrowserNodes,
  revisions,
  activeRevisionKey,
  selectedBrowserNodeId,
  transformMode,
  visibleBrowserNodeIds,
  wireframe,
  onDownload,
  onDownloadSource,
  onExplodeAmountChange,
  onFitView,
  onResetTransforms,
  onSelectLatestRevision,
  onSelectRevision,
  onSelectBrowserNode,
  onSetTransformMode,
  onShare,
  onSetView,
  onToggleBrowserNodeVisibility,
  onToggleAutoRotate,
  onToggleWireframe,
}: ViewerControlsProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel | null>(null);
  const componentCount = useMemo(() => countModelBrowserNodes(modelBrowserNodes), [modelBrowserNodes]);
  const canShowComponents = modelBrowserNodes.length > 0;
  const canShowRevisions = revisions.length > 0;
  const activeRevision = activeRevisionKey
    ? revisions.find((revision) => revision.key === activeRevisionKey) ?? null
    : null;
  const visibleOpenPanel =
    (openPanel === "components" && !canShowComponents) ||
      (openPanel === "download" && !canDownload && !canDownloadSource) ||
      (openPanel === "explode" && !canExplode) ||
      (openPanel === "revisions" && !canShowRevisions)
      ? null
      : openPanel;

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const viewMenuOpen = visibleOpenPanel === "views";
  const downloadOpen = visibleOpenPanel === "download";
  const explodeOpen = visibleOpenPanel === "explode";
  const componentsOpen = visibleOpenPanel === "components";
  const revisionsOpen = visibleOpenPanel === "revisions";
  const transformOpen = visibleOpenPanel === "transform";

  return (
    <div className={toolRailClass} aria-label="Viewer controls">
      <ToolButton
        type="button"
        onClick={() => togglePanel("views")}
        tooltip="Camera views"
        tooltipDisabled={viewMenuOpen}
        aria-label={activeView ? `Camera views, current view ${viewLabels[activeView]}` : "Camera views"}
        aria-expanded={viewMenuOpen}
        aria-haspopup="menu"
        aria-controls="view-presets-menu"
        className={cn(toolButtonClass, viewMenuOpen && activeControlClass)}
      >
        <Camera size={14} strokeWidth={1.75} />
      </ToolButton>

      {canShowComponents ? (
        <ToolButton
          type="button"
          onClick={() => togglePanel("components")}
          tooltip="Model components"
          tooltipDisabled={componentsOpen}
          aria-label={`Model components, ${componentCount} total`}
          aria-expanded={componentsOpen}
          aria-haspopup="tree"
          aria-controls="model-components-menu"
          className={cn(toolButtonClass, componentsOpen && activeControlClass)}
        >
          <Puzzle size={14} strokeWidth={1.75} />
        </ToolButton>
      ) : null}

      <ToolButton type="button" onClick={onFitView} tooltip="Fit view" aria-label="Fit view" className={toolButtonClass}>
        <Focus size={14} strokeWidth={1.75} />
      </ToolButton>
      <ToolButton
        type="button"
        onClick={onToggleWireframe}
        tooltip="Toggle wireframe"
        aria-label="Toggle wireframe"
        aria-pressed={wireframe}
        className={cn(toolButtonClass, wireframe && activeControlClass)}
      >
        <SquareDashed size={14} strokeWidth={1.75} />
      </ToolButton>
      <ToolButton
        type="button"
        onClick={onToggleAutoRotate}
        tooltip="Toggle auto rotate"
        aria-label="Toggle auto rotate"
        aria-pressed={autoRotate}
        className={cn(toolButtonClass, autoRotate && activeControlClass)}
      >
        <RefreshCcwDot size={14} strokeWidth={1.75} />
      </ToolButton>

      <ToolButton
        type="button"
        onClick={() => togglePanel("transform")}
        tooltip="Transform"
        tooltipDisabled={transformOpen}
        aria-label="Transform object"
        aria-expanded={transformOpen}
        aria-haspopup="menu"
        aria-controls="transform-menu"
        className={cn(toolButtonClass, (transformOpen || transformMode !== null) && activeControlClass)}
      >
        <Move3d size={14} strokeWidth={1.75} />
      </ToolButton>

      {canExplode ? (
        <ToolButton
          type="button"
          onClick={() => togglePanel("explode")}
          tooltip="Explode model"
          tooltipDisabled={explodeOpen}
          aria-label="Explode model"
          aria-expanded={explodeOpen}
          aria-haspopup="dialog"
          aria-controls="explode-slider"
          className={cn(toolButtonClass, (explodeOpen || explodeAmount > 0) && activeControlClass)}
        >
          <Layers size={14} strokeWidth={1.75} />
        </ToolButton>
      ) : null}

      {canDownload || canDownloadSource || canShare || canShowRevisions ? (
        <>
          {canShare ? (
            <ToolButton
              type="button"
              onClick={onShare}
              disabled={isSharing}
              tooltip="Share model"
              aria-label="Share model"
              className={toolButtonClass}
            >
              {isSharing ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Share2 size={14} strokeWidth={1.75} />
              )}
            </ToolButton>
          ) : null}
          {canDownload || canDownloadSource ? (
            <ToolButton
              type="button"
              onClick={() => togglePanel("download")}
              tooltip="Download"
              tooltipDisabled={downloadOpen}
              aria-label="Download"
              aria-expanded={downloadOpen}
              aria-haspopup="menu"
              aria-controls="download-menu"
              className={cn(toolButtonClass, downloadOpen && activeControlClass)}
            >
              {isDownloading || isDownloadingSource ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Download size={14} strokeWidth={1.75} />
              )}
            </ToolButton>
          ) : null}
          {canShowRevisions ? (
            <ToolButton
              type="button"
              onClick={() => togglePanel("revisions")}
              tooltip="Revisions"
              tooltipDisabled={revisionsOpen}
              aria-label={activeRevision ? `Revisions, viewing revision ${activeRevision.revisionNumber}` : "Revisions"}
              aria-expanded={revisionsOpen}
              aria-haspopup="menu"
              aria-controls="revision-menu"
              className={cn(toolButtonClass, (revisionsOpen || !isLatestRevisionSelected) && activeControlClass)}
            >
              <History size={14} strokeWidth={1.75} />
            </ToolButton>
          ) : null}
        </>
      ) : null}

      {viewMenuOpen ? (
        <div
          className={controlMenuPopoverClass}
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
                setOpenPanel(null);
              }}
              className={cn(controlMenuItemClass, activeView === view && activeControlClass)}
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>
      ) : null}

      {downloadOpen ? (
        <div
          className={controlMenuPopoverClass}
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
                setOpenPanel(null);
              }}
              disabled={isDownloading}
              className={controlMenuItemClass}
            >
              <span>STEP File</span>
              {isDownloading ? <Loader2 size={13} strokeWidth={1.75} className={loadingIconClass} /> : null}
            </button>
          ) : null}
          {canDownloadSource ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDownloadSource();
                setOpenPanel(null);
              }}
              disabled={isDownloadingSource}
              className={controlMenuItemClass}
            >
              <span>Source code</span>
              {isDownloadingSource ? <Loader2 size={13} strokeWidth={1.75} className={loadingIconClass} /> : null}
            </button>
          ) : null}
        </div>
      ) : null}

      {revisionsOpen ? (
        <RevisionMenu
          activeRevisionKey={activeRevisionKey}
          isLatestRevisionSelected={isLatestRevisionSelected}
          revisions={revisions}
          onClose={() => setOpenPanel(null)}
          onSelectLatestRevision={onSelectLatestRevision}
          onSelectRevision={onSelectRevision}
        />
      ) : null}

      {componentsOpen ? (
        <ModelBrowserTree
          id="model-components-menu"
          className={controlFloatingPanelClass}
          nodes={modelBrowserNodes}
          onSelectNode={onSelectBrowserNode}
          onToggleNodeVisibility={onToggleBrowserNodeVisibility}
          selectedNodeId={selectedBrowserNodeId}
          visibleNodeIds={visibleBrowserNodeIds}
        />
      ) : null}

      {explodeOpen ? (
        <div
          className={controlPanelPopoverClass}
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
      ) : null}

      {transformOpen ? (
        <div
          className={controlMenuPopoverClass}
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
              setOpenPanel(null);
            }}
            className={cn(controlMenuItemClass, transformMode === "translate" && activeControlClass)}
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
              setOpenPanel(null);
            }}
            className={cn(controlMenuItemClass, transformMode === "rotate" && activeControlClass)}
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
                setOpenPanel(null);
              }}
              className={controlMenuItemClass}
            >
              <Undo2 size={12} strokeWidth={1.75} />
              Reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
