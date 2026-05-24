import type { ModelBrowserNode, TransformMode, ViewerRevisionOption, ViewPreset } from "@/app/types/model-viewer";

export interface ViewerControlsProps {
  activeRevisionKey: string | null;
  activeView: ViewPreset | null;
  autoRotate: boolean;
  canDownload: boolean;
  canDownloadSource: boolean;
  canExplode: boolean;
  canClear?: boolean;
  canShare: boolean;
  explodeAmount: number;
  hasTransforms: boolean;
  isDownloading: boolean;
  isDownloadingSource: boolean;
  isLatestRevisionSelected: boolean;
  isSharing: boolean;
  modelBrowserNodes: ModelBrowserNode[];
  revisions: ViewerRevisionOption[];
  selectedBrowserNodeId: string | null;
  transformMode: TransformMode;
  visibleBrowserNodeIds: Set<string>;
  wireframe: boolean;
  onDownload: () => void;
  onDownloadSource: () => void;
  onClear?: () => void;
  onExplodeAmountChange: (amount: number) => void;
  onFitView: () => void;
  onResetTransforms: () => void;
  onSelectBrowserNode: (id: string) => void;
  onSelectLatestRevision?: () => void;
  onSelectRevision?: (key: string) => void;
  onSetTransformMode: (mode: TransformMode) => void;
  onSetView: (view: ViewPreset) => void;
  onShare: () => void;
  onToggleAutoRotate: () => void;
  onToggleBrowserNodeVisibility: (id: string) => void;
  onToggleWireframe: () => void;
}
