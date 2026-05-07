import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

import { type ModelBrowserNode } from "@/app/studio/_components/viewer/model-viewer-state";
import { cn, viewerGlassClass } from "@/app/studio/_components/viewer/ui/styles";

interface ModelBrowserTreeProps {
  className?: string;
  id?: string;
  nodes: ModelBrowserNode[];
  onSelectNode: (id: string) => void;
  onToggleNodeVisibility: (id: string) => void;
  selectedNodeId: string | null;
  visibleNodeIds: Set<string>;
}

interface BrowserNodeRowProps {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  node: ModelBrowserNode;
  onSelectNode: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleNodeVisibility: (id: string) => void;
  selected: boolean;
  visible: boolean;
}

const browserTreeClass = cn(
  viewerGlassClass,
  "flex max-h-[min(26rem,calc(100dvh-8rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-[min(15rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[var(--viewer-control-radius)] text-foreground sm:max-h-[min(30rem,calc(100dvh-5rem))]",
);

function collectExpandedIds(nodes: ModelBrowserNode[], expandedIds = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (node.children?.length) {
      expandedIds.add(node.id);
      collectExpandedIds(node.children, expandedIds);
    }
  }

  return expandedIds;
}

export function countModelBrowserNodes(nodes: ModelBrowserNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countModelBrowserNodes(node.children ?? []), 0);
}

interface VisibleBrowserRow {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  node: ModelBrowserNode;
  selected: boolean;
  visible: boolean;
}

function visibleRows(
  nodes: ModelBrowserNode[],
  expandedIds: Set<string>,
  selectedNodeId: string | null,
  visibleNodeIds: Set<string>,
  depth = 0,
): VisibleBrowserRow[] {
  return nodes.flatMap((node) => {
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedIds.has(node.id);
    const row = {
      depth,
      hasChildren,
      isExpanded,
      node,
      selected: node.id === selectedNodeId,
      visible: visibleNodeIds.has(node.id),
    };

    return hasChildren && isExpanded
      ? [row, ...visibleRows(node.children ?? [], expandedIds, selectedNodeId, visibleNodeIds, depth + 1)]
      : [row];
  });
}

const BrowserNodeRow = memo(function BrowserNodeRow({
  depth,
  hasChildren,
  isExpanded,
  node,
  onSelectNode,
  onToggleExpanded,
  onToggleNodeVisibility,
  selected,
  visible,
}: BrowserNodeRowProps) {
  const VisibilityIcon = visible ? Eye : EyeOff;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={selected}
      className={cn(
        "flex min-w-0 items-center gap-1 px-1 py-0.5 text-[0.78125rem] leading-6 text-[color-mix(in_srgb,var(--muted-foreground)_82%,transparent)]",
        selected && "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-foreground",
        !visible && "opacity-55",
      )}
      style={{ paddingLeft: `${0.25 + depth * 0.875}rem` }}
    >
      {hasChildren ? (
        <button
          type="button"
          aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          onClick={() => onToggleExpanded(node.id)}
          className="grid size-5 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-[color-mix(in_srgb,var(--muted-foreground)_74%,transparent)] transition-colors duration-150 ease-in-out hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-foreground"
        >
          {isExpanded ? <ChevronDown size={14} strokeWidth={1.75} /> : <ChevronRight size={14} strokeWidth={1.75} />}
        </button>
      ) : null}

      <button
        type="button"
        aria-label={visible ? `Hide ${node.label}` : `Show ${node.label}`}
        aria-pressed={!visible}
        onClick={() => onToggleNodeVisibility(node.id)}
        className="grid size-5 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-[color-mix(in_srgb,var(--muted-foreground)_74%,transparent)] transition-colors duration-150 ease-in-out hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-foreground"
      >
        <VisibilityIcon size={14} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => onSelectNode(node.id)}
        className="flex min-w-0 flex-1 rounded-md border-0 bg-transparent px-1 py-0 text-left text-inherit transition-colors duration-150 ease-in-out hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-foreground"
      >
        <span className="truncate">{node.label}</span>
      </button>
    </div>
  );
});

export const ModelBrowserTree = memo(function ModelBrowserTree({
  className,
  id,
  nodes,
  onSelectNode,
  onToggleNodeVisibility,
  selectedNodeId,
  visibleNodeIds,
}: ModelBrowserTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => collectExpandedIds(nodes));
  const itemCount = useMemo(() => countModelBrowserNodes(nodes), [nodes]);
  const rows = useMemo(
    () => visibleRows(nodes, expandedIds, selectedNodeId, visibleNodeIds),
    [expandedIds, nodes, selectedNodeId, visibleNodeIds],
  );

  useEffect(() => {
    setExpandedIds(collectExpandedIds(nodes));
  }, [nodes]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((currentExpandedIds) => {
      const nextExpandedIds = new Set(currentExpandedIds);
      if (nextExpandedIds.has(id)) {
        nextExpandedIds.delete(id);
      } else {
        nextExpandedIds.add(id);
      }

      return nextExpandedIds;
    });
  }, []);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <aside id={id} className={cn(browserTreeClass, className)} aria-label="Model browser">
      <div className="flex items-center justify-between gap-2 px-1.5 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 px-1 py-0.5 text-left text-[0.75rem] font-semibold tracking-[-0.01em] text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
          <span className="truncate">
            Components <span className="font-medium text-[color-mix(in_srgb,var(--muted-foreground)_72%,transparent)]">· {itemCount}</span>
          </span>
        </div>
      </div>
      <div role="tree" aria-label="Loaded model components" className="overflow-y-auto pb-1">
        {rows.map((row) => (
          <BrowserNodeRow
            key={row.node.id}
            depth={row.depth}
            hasChildren={row.hasChildren}
            isExpanded={row.isExpanded}
            node={row.node}
            onSelectNode={onSelectNode}
            onToggleExpanded={toggleExpanded}
            onToggleNodeVisibility={onToggleNodeVisibility}
            selected={row.selected}
            visible={row.visible}
          />
        ))}
      </div>
    </aside>
  );
});
