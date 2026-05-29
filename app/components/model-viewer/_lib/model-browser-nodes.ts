import type { ModelBrowserNode } from "@/app/types/model-viewer";

export function countModelBrowserNodes(nodes: ModelBrowserNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countModelBrowserNodes(node.children ?? []), 0);
}
