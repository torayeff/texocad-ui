"use client";

import { useMemo, useState } from "react";

import { countModelBrowserNodes } from "@/app/components/model-viewer/_components/model-browser-tree";
import { useFloatingPanel } from "@/app/components/viewer/_hooks/use-floating-panel";
import type { ViewerControlsProps } from "@/app/components/model-viewer/_types/viewer-controls";

export type ViewerControlPanel = "components" | "download" | "explode" | "revisions" | "transform" | "views";

interface UseViewerControlPanelsOptions {
  activeRevisionKey: string | null;
  canDownload: boolean;
  canDownloadSource: boolean;
  canExplode: boolean;
  hasTransforms: boolean;
  isLatestRevisionSelected: boolean;
  modelBrowserNodes: ViewerControlsProps["modelBrowserNodes"];
  revisions: ViewerControlsProps["revisions"];
  transformMode: ViewerControlsProps["transformMode"];
}

export function useViewerControlPanels({
  activeRevisionKey,
  canDownload,
  canDownloadSource,
  canExplode,
  hasTransforms,
  isLatestRevisionSelected,
  modelBrowserNodes,
  revisions,
  transformMode,
}: UseViewerControlPanelsOptions) {
  const [openPanel, setOpenPanel] = useState<ViewerControlPanel | null>(null);
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
  const { activeTriggerRef, panelRef, panelStyle, railRef, resetPanelPosition } = useFloatingPanel(
    visibleOpenPanel !== null,
    [
      activeRevisionKey,
      canDownload,
      canDownloadSource,
      componentCount,
      hasTransforms,
      isLatestRevisionSelected,
      revisions.length,
      transformMode,
      visibleOpenPanel,
    ],
  );

  const togglePanel = (panel: ViewerControlPanel, trigger: HTMLButtonElement) => {
    const nextPanel = openPanel === panel ? null : panel;
    activeTriggerRef.current = nextPanel ? trigger : null;
    resetPanelPosition();
    setOpenPanel(nextPanel);
  };

  return {
    activeRevision,
    canShowComponents,
    canShowRevisions,
    closePanel: () => setOpenPanel(null),
    componentCount,
    componentsOpen: visibleOpenPanel === "components",
    downloadOpen: visibleOpenPanel === "download",
    explodeOpen: visibleOpenPanel === "explode",
    panelRef,
    panelStyle,
    railRef,
    revisionsOpen: visibleOpenPanel === "revisions",
    togglePanel,
    transformOpen: visibleOpenPanel === "transform",
    viewMenuOpen: visibleOpenPanel === "views",
  };
}
