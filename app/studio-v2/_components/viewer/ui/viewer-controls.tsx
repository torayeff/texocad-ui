import { type ButtonHTMLAttributes, type ReactNode, memo, useMemo, useState } from "react";
import { Camera, Download, Focus, Layers, Loader2, Puzzle, Rotate3d, Share2, SquareDashed, Trash2 } from "lucide-react";

import { type ModelBrowserNode, type ViewPreset, viewLabels, viewPresets } from "@/app/studio-v2/_components/viewer/model-viewer-state";
import { countModelBrowserNodes, ModelBrowserTree } from "@/app/studio-v2/_components/viewer/ui/model-browser-tree";
import {
  activeControlClass,
  actionPopoverClass,
  cn,
  loadingIconClass,
  presetButtonClass,
  toolButtonClass,
  toolRailClass,
  toolTooltipClass,
} from "@/app/studio-v2/_components/viewer/ui/styles";

interface ViewerControlsProps {
  activeView: ViewPreset | null;
  autoRotate: boolean;
  canClear: boolean;
  canDownload: boolean;
  canExplode: boolean;
  canShare: boolean;
  explodeAmount: number;
  isDownloading: boolean;
  isSharing: boolean;
  modelBrowserNodes: ModelBrowserNode[];
  selectedBrowserNodeId: string | null;
  visibleBrowserNodeIds: Set<string>;
  wireframe: boolean;
  onClear: () => void;
  onDownload: () => void;
  onFitView: () => void;
  onSelectBrowserNode: (id: string) => void;
  onExplodeAmountChange: (amount: number) => void;
  onShare: () => void;
  onSetView: (view: ViewPreset) => void;
  onToggleBrowserNodeVisibility: (id: string) => void;
  onToggleAutoRotate: () => void;
  onToggleWireframe: () => void;
}

type OpenPanel = "components" | "explode" | "views";

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
  canClear,
  canDownload,
  canExplode,
  canShare,
  explodeAmount,
  isDownloading,
  isSharing,
  modelBrowserNodes,
  selectedBrowserNodeId,
  visibleBrowserNodeIds,
  wireframe,
  onClear,
  onDownload,
  onExplodeAmountChange,
  onFitView,
  onSelectBrowserNode,
  onShare,
  onSetView,
  onToggleBrowserNodeVisibility,
  onToggleAutoRotate,
  onToggleWireframe,
}: ViewerControlsProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel | null>(null);
  const componentCount = useMemo(() => countModelBrowserNodes(modelBrowserNodes), [modelBrowserNodes]);
  const canShowComponents = modelBrowserNodes.length > 0;
  const visibleOpenPanel =
    (openPanel === "components" && !canShowComponents) || (openPanel === "explode" && !canExplode) ? null : openPanel;

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };

  const viewMenuOpen = visibleOpenPanel === "views";
  const explodeOpen = visibleOpenPanel === "explode";
  const componentsOpen = visibleOpenPanel === "components";

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
        <Rotate3d size={14} strokeWidth={1.75} />
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

      {canClear || canDownload || canShare ? (
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
          {canDownload ? (
            <ToolButton
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              tooltip="Download model"
              aria-label="Download model"
              className={toolButtonClass}
            >
              {isDownloading ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Download size={14} strokeWidth={1.75} />
              )}
            </ToolButton>
          ) : null}
          {canClear ? (
            <ToolButton type="button" onClick={onClear} tooltip="Clear scene" aria-label="Clear scene" className={toolButtonClass}>
              <Trash2 size={14} strokeWidth={1.75} />
            </ToolButton>
          ) : null}
        </>
      ) : null}

      {viewMenuOpen ? (
        <div
          className={cn(actionPopoverClass, "left-0 top-[calc(100%+0.5rem)] w-32 p-1")}
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
              className={cn(
                presetButtonClass,
                "flex w-full items-center justify-between text-left",
                activeView === view && activeControlClass,
              )}
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>
      ) : null}

      {componentsOpen ? (
        <ModelBrowserTree
          id="model-components-menu"
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 -translate-x-1/2"
          nodes={modelBrowserNodes}
          onSelectNode={onSelectBrowserNode}
          onToggleNodeVisibility={onToggleBrowserNodeVisibility}
          selectedNodeId={selectedBrowserNodeId}
          visibleNodeIds={visibleBrowserNodeIds}
        />
      ) : null}

      {explodeOpen ? (
        <div
          className={cn(
            actionPopoverClass,
            "left-1/2 top-[calc(100%+0.5rem)] w-[min(13rem,calc(100vw-1.5rem))] -translate-x-1/2 gap-2 p-2.5",
          )}
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
    </div>
  );
});
