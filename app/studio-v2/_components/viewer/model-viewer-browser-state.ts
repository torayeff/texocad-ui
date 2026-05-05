import * as THREE from "three";

import { type ModelFormat } from "@/app/studio-v2/_components/viewer/model-viewer-loaders";
import { type ModelBrowserNode } from "@/app/studio-v2/_components/viewer/model-viewer-state";
import { collectPickableMeshes } from "@/app/studio-v2/_components/viewer/model-viewer-three";

export interface BrowserNodeEntry {
  meshes: THREE.Mesh[];
  objects: THREE.Object3D[];
  visible: boolean;
}

export interface BrowserTreeBuildResult {
  entries: Map<string, BrowserNodeEntry>;
  nodes: ModelBrowserNode[];
}

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

function objectLabel(object: THREE.Object3D, index: number) {
  const label = object.name.trim();
  if (label) {
    return label;
  }

  return object instanceof THREE.Mesh ? `Part ${index}` : `Group ${index}`;
}

function createBrowserNode(id: string, label: string, children: ModelBrowserNode[] = []): ModelBrowserNode {
  return {
    id,
    label,
    ...(children.length > 0 ? { children } : {}),
  };
}

function browserNodeId(index: number) {
  return `browser-node-${index}`;
}

function isStepEdgeOverlayFor(mesh: THREE.Mesh, object: THREE.Object3D | undefined) {
  return object instanceof THREE.Group && object.name === `${mesh.name || "mesh"} edges`;
}

function buildStepBrowserTree(root: THREE.Group): BrowserTreeBuildResult {
  const entries = new Map<string, BrowserNodeEntry>();
  const nodes: ModelBrowserNode[] = [];

  root.children.forEach((object, index) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    const id = browserNodeId(nodes.length + 1);
    const edgeOverlay = isStepEdgeOverlayFor(object, root.children[index + 1]) ? root.children[index + 1] : null;
    const entryObjects = edgeOverlay ? [object, edgeOverlay] : [object];
    const entry = {
      meshes: [object],
      objects: entryObjects,
      visible: entryObjects.every((entryObject) => entryObject.visible),
    };

    entries.set(id, entry);
    nodes.push(createBrowserNode(id, objectLabel(object, nodes.length + 1)));
  });

  return { entries, nodes };
}

function buildObjectBrowserTree(root: THREE.Object3D): BrowserTreeBuildResult {
  const entries = new Map<string, BrowserNodeEntry>();
  let nextNodeIndex = 1;

  const buildNodes = (object: THREE.Object3D): ModelBrowserNode[] => {
    const children = object.children.flatMap(buildNodes);
    const meshes = collectPickableMeshes(object);
    if (meshes.length === 0) {
      return children;
    }

    const hasLabel = object.name.trim().length > 0;
    const shouldIncludeObject = object instanceof THREE.Mesh || hasLabel;
    if (!shouldIncludeObject) {
      return children;
    }

    const id = browserNodeId(nextNodeIndex);
    const entry = {
      meshes,
      objects: [object],
      visible: object.visible,
    };
    nextNodeIndex += 1;
    entries.set(id, entry);

    return [createBrowserNode(id, objectLabel(object, nextNodeIndex - 1), children)];
  };

  return {
    entries,
    nodes: root.children.flatMap(buildNodes),
  };
}

export function buildModelBrowserTree(root: THREE.Group, format: ModelFormat): BrowserTreeBuildResult {
  switch (format) {
    case "step": {
      const stepTree = buildStepBrowserTree(root);
      return stepTree.nodes.length > 0 ? stepTree : buildObjectBrowserTree(root);
    }
    case "glb":
    case "stl":
      return buildObjectBrowserTree(root);
    default:
      return assertNever(format, "Unhandled browser tree model format");
  }
}

export function visibleNodeIds(entries: Map<string, BrowserNodeEntry>) {
  const ids = new Set<string>();
  for (const [id, entry] of entries) {
    if (entry.visible) {
      ids.add(id);
    }
  }
  return ids;
}
