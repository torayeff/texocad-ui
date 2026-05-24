"use client";

import { memo, useMemo, useState } from "react";
import {
  Camera,
  Download,
  Fullscreen,
  History,
  Layers,
  Loader2,
  Move3d,
  Puzzle,
  RefreshCcwDot,
  Share2,
  SquareDashed,
} from "lucide-react";

import { viewLabels } from "@/app/components/model-viewer/_lib/model-viewer-state";
import {
  activeControlClass,
  loadingIconClass,
  toolButtonClass,
  toolRailClass,
} from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";
import { useFloatingPanel } from "@/app/components/viewer/use-floating-panel";
import { countModelBrowserNodes } from "@/app/components/model-viewer/_components/model-browser-tree";
import { ViewerToolButton } from "@/app/components/viewer/viewer-tool-button";
import { ViewerControlPopovers } from "@/app/components/model-viewer/_components/viewer-control-popovers";
import type { ViewerControlsProps } from "@/app/components/model-viewer/_types/viewer-controls";

type OpenPanel = "components" | "download" | "explode" | "revisions" | "transform" | "views";

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
  const canShowRevisions = revisions.length > 0 && onSelectLatestRevision !== undefined && onSelectRevision !== undefined;
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
  const { activeTriggerRef, panelRef, panelStyle, railRef, resetPanelPosition } = useFloatingPanel(
    visibleOpenPanel !== null,
    [
      activeRevisionKey,
      canDownload,
      canDownloadSource,
      componentCount,
      explodeAmount,
      hasTransforms,
      isLatestRevisionSelected,
      revisions.length,
      transformMode,
      visibleOpenPanel,
    ],
  );

  const togglePanel = (panel: OpenPanel, trigger: HTMLButtonElement) => {
    const nextPanel = openPanel === panel ? null : panel;
    activeTriggerRef.current = nextPanel ? trigger : null;
    resetPanelPosition();
    setOpenPanel(nextPanel);
  };
  const closePanel = () => setOpenPanel(null);

  const viewMenuOpen = visibleOpenPanel === "views";
  const downloadOpen = visibleOpenPanel === "download";
  const explodeOpen = visibleOpenPanel === "explode";
  const componentsOpen = visibleOpenPanel === "components";
  const revisionsOpen = visibleOpenPanel === "revisions";
  const transformOpen = visibleOpenPanel === "transform";

  return (
    <div ref={railRef} className={toolRailClass} aria-label="Viewer controls">
      <ViewerToolButton
        type="button"
        onClick={(event) => togglePanel("views", event.currentTarget)}
        tooltip="Camera views"
        tooltipDisabled={viewMenuOpen}
        aria-label={activeView ? `Camera views, current view ${viewLabels[activeView]}` : "Camera views"}
        aria-expanded={viewMenuOpen}
        aria-haspopup="menu"
        aria-controls="view-presets-menu"
        className={cn(toolButtonClass, viewMenuOpen && activeControlClass)}
      >
        <Camera size={14} strokeWidth={1.75} />
      </ViewerToolButton>

      {canShowComponents ? (
        <ViewerToolButton
          type="button"
          onClick={(event) => togglePanel("components", event.currentTarget)}
          tooltip="Model components"
          tooltipDisabled={componentsOpen}
          aria-label={`Model components, ${componentCount} total`}
          aria-expanded={componentsOpen}
          aria-haspopup="tree"
          aria-controls="model-components-menu"
          className={cn(toolButtonClass, componentsOpen && activeControlClass)}
        >
          <Puzzle size={14} strokeWidth={1.75} />
        </ViewerToolButton>
      ) : null}

      <ViewerToolButton type="button" onClick={onFitView} tooltip="Fit view" aria-label="Fit view" className={toolButtonClass}>
        <Fullscreen size={14} strokeWidth={1.75} />
      </ViewerToolButton>
      <ViewerToolButton
        type="button"
        onClick={onToggleWireframe}
        tooltip="Toggle wireframe"
        aria-label="Toggle wireframe"
        aria-pressed={wireframe}
        className={cn(toolButtonClass, wireframe && activeControlClass)}
      >
        <SquareDashed size={14} strokeWidth={1.75} />
      </ViewerToolButton>
      <ViewerToolButton
        type="button"
        onClick={onToggleAutoRotate}
        tooltip="Toggle auto rotate"
        aria-label="Toggle auto rotate"
        aria-pressed={autoRotate}
        className={cn(toolButtonClass, autoRotate && activeControlClass)}
      >
        <RefreshCcwDot size={14} strokeWidth={1.75} />
      </ViewerToolButton>

      <ViewerToolButton
        type="button"
        onClick={(event) => togglePanel("transform", event.currentTarget)}
        tooltip="Transform"
        tooltipDisabled={transformOpen}
        aria-label="Transform object"
        aria-expanded={transformOpen}
        aria-haspopup="menu"
        aria-controls="transform-menu"
        className={cn(toolButtonClass, (transformOpen || transformMode !== null) && activeControlClass)}
      >
        <Move3d size={14} strokeWidth={1.75} />
      </ViewerToolButton>

      {canExplode ? (
        <ViewerToolButton
          type="button"
          onClick={(event) => togglePanel("explode", event.currentTarget)}
          tooltip="Explode model"
          tooltipDisabled={explodeOpen}
          aria-label="Explode model"
          aria-expanded={explodeOpen}
          aria-haspopup="dialog"
          aria-controls="explode-slider"
          className={cn(toolButtonClass, (explodeOpen || explodeAmount > 0) && activeControlClass)}
        >
          <Layers size={14} strokeWidth={1.75} />
        </ViewerToolButton>
      ) : null}

      {canDownload || canDownloadSource || canShare || canShowRevisions ? (
        <>
          {canShare ? (
            <ViewerToolButton
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
            </ViewerToolButton>
          ) : null}
          {canDownload || canDownloadSource ? (
            <ViewerToolButton
              type="button"
              onClick={(event) => togglePanel("download", event.currentTarget)}
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
            </ViewerToolButton>
          ) : null}
          {canShowRevisions ? (
            <ViewerToolButton
              type="button"
              onClick={(event) => togglePanel("revisions", event.currentTarget)}
              tooltip="Revisions"
              tooltipDisabled={revisionsOpen}
              aria-label={activeRevision ? `Revisions, viewing revision ${activeRevision.revisionNumber}` : "Revisions"}
              aria-expanded={revisionsOpen}
              aria-haspopup="menu"
              aria-controls="revision-menu"
              className={cn(toolButtonClass, (revisionsOpen || !isLatestRevisionSelected) && activeControlClass)}
            >
              <History size={14} strokeWidth={1.75} />
            </ViewerToolButton>
          ) : null}
        </>
      ) : null}

      <ViewerControlPopovers
        activeRevisionKey={activeRevisionKey}
        activeView={activeView}
        canDownload={canDownload}
        canDownloadSource={canDownloadSource}
        componentsOpen={componentsOpen}
        downloadOpen={downloadOpen}
        explodeAmount={explodeAmount}
        explodeOpen={explodeOpen}
        hasTransforms={hasTransforms}
        isDownloading={isDownloading}
        isDownloadingSource={isDownloadingSource}
        isLatestRevisionSelected={isLatestRevisionSelected}
        modelBrowserNodes={modelBrowserNodes}
        onClose={closePanel}
        onDownload={onDownload}
        onDownloadSource={onDownloadSource}
        onExplodeAmountChange={onExplodeAmountChange}
        onResetTransforms={onResetTransforms}
        onSelectBrowserNode={onSelectBrowserNode}
        onSelectLatestRevision={onSelectLatestRevision}
        onSelectRevision={onSelectRevision}
        onSetTransformMode={onSetTransformMode}
        onSetView={onSetView}
        onToggleBrowserNodeVisibility={onToggleBrowserNodeVisibility}
        panelRef={panelRef}
        panelStyle={panelStyle}
        revisions={revisions}
        revisionsOpen={revisionsOpen}
        selectedBrowserNodeId={selectedBrowserNodeId}
        transformMode={transformMode}
        transformOpen={transformOpen}
        viewMenuOpen={viewMenuOpen}
        visibleBrowserNodeIds={visibleBrowserNodeIds}
      />
    </div>
  );
});
