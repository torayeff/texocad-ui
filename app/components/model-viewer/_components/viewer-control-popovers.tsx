import type { CSSProperties, RefObject } from "react";

import type { ModelBrowserNode, TransformMode, ViewPreset } from "@/app/types/model-viewer";
import type { ViewerRevisionOption } from "@/app/types/model-viewer";
import { RevisionMenu } from "@/app/components/model-viewer/_components/revision-menu";
import {
  ComponentsPanel,
  DownloadMenu,
  ExplodePanel,
  TransformMenu,
  ViewPresetsMenu,
} from "@/app/components/model-viewer/_components/viewer-control-panels";

interface ViewerControlPopoversProps {
  activeRevisionKey: string | null;
  activeView: ViewPreset | null;
  canDownload: boolean;
  canDownloadSource: boolean;
  componentsOpen: boolean;
  downloadOpen: boolean;
  explodeAmount: number;
  explodeOpen: boolean;
  hasTransforms: boolean;
  isDownloading: boolean;
  isDownloadingSource: boolean;
  isLatestRevisionSelected: boolean;
  modelBrowserNodes: ModelBrowserNode[];
  onClose: () => void;
  onDownload: () => void;
  onDownloadSource: () => void;
  onExplodeAmountChange: (amount: number) => void;
  onResetTransforms: () => void;
  onSelectBrowserNode: (id: string) => void;
  onSelectLatestRevision?: () => void;
  onSelectRevision?: (key: string) => void;
  onSetTransformMode: (mode: TransformMode) => void;
  onSetView: (view: ViewPreset) => void;
  onToggleBrowserNodeVisibility: (id: string) => void;
  panelRef: RefObject<HTMLDivElement | null>;
  panelStyle: CSSProperties;
  revisions: ViewerRevisionOption[];
  revisionsOpen: boolean;
  selectedBrowserNodeId: string | null;
  transformMode: TransformMode;
  transformOpen: boolean;
  viewMenuOpen: boolean;
  visibleBrowserNodeIds: Set<string>;
}

export function ViewerControlPopovers({
  activeRevisionKey,
  activeView,
  canDownload,
  canDownloadSource,
  componentsOpen,
  downloadOpen,
  explodeAmount,
  explodeOpen,
  hasTransforms,
  isDownloading,
  isDownloadingSource,
  isLatestRevisionSelected,
  modelBrowserNodes,
  onClose,
  onDownload,
  onDownloadSource,
  onExplodeAmountChange,
  onResetTransforms,
  onSelectBrowserNode,
  onSelectLatestRevision,
  onSelectRevision,
  onSetTransformMode,
  onSetView,
  onToggleBrowserNodeVisibility,
  panelRef,
  panelStyle,
  revisions,
  revisionsOpen,
  selectedBrowserNodeId,
  transformMode,
  transformOpen,
  viewMenuOpen,
  visibleBrowserNodeIds,
}: ViewerControlPopoversProps) {
  return (
    <>
      {viewMenuOpen ? (
        <ViewPresetsMenu
          activeView={activeView}
          onClose={onClose}
          onSetView={onSetView}
          panelRef={panelRef}
          style={panelStyle}
        />
      ) : null}

      {downloadOpen ? (
        <DownloadMenu
          canDownload={canDownload}
          canDownloadSource={canDownloadSource}
          isDownloading={isDownloading}
          isDownloadingSource={isDownloadingSource}
          onClose={onClose}
          onDownload={onDownload}
          onDownloadSource={onDownloadSource}
          panelRef={panelRef}
          style={panelStyle}
        />
      ) : null}

      {revisionsOpen && onSelectLatestRevision && onSelectRevision ? (
        <RevisionMenu
          ref={panelRef}
          activeRevisionKey={activeRevisionKey}
          isLatestRevisionSelected={isLatestRevisionSelected}
          revisions={revisions}
          style={panelStyle}
          onClose={onClose}
          onSelectLatestRevision={onSelectLatestRevision}
          onSelectRevision={onSelectRevision}
        />
      ) : null}

      {componentsOpen ? (
        <ComponentsPanel
          modelBrowserNodes={modelBrowserNodes}
          onSelectBrowserNode={onSelectBrowserNode}
          onToggleBrowserNodeVisibility={onToggleBrowserNodeVisibility}
          panelRef={panelRef}
          selectedBrowserNodeId={selectedBrowserNodeId}
          style={panelStyle}
          visibleBrowserNodeIds={visibleBrowserNodeIds}
        />
      ) : null}

      {explodeOpen ? (
        <ExplodePanel
          explodeAmount={explodeAmount}
          onExplodeAmountChange={onExplodeAmountChange}
          panelRef={panelRef}
          style={panelStyle}
        />
      ) : null}

      {transformOpen ? (
        <TransformMenu
          hasTransforms={hasTransforms}
          onClose={onClose}
          onResetTransforms={onResetTransforms}
          onSetTransformMode={onSetTransformMode}
          panelRef={panelRef}
          style={panelStyle}
          transformMode={transformMode}
        />
      ) : null}
    </>
  );
}
