import * as THREE from "three";

import type { BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";

export function findNodeIdForMesh(
  mesh: THREE.Mesh,
  entries: Map<string, BrowserNodeEntry>,
): string | null {
  for (const [id, entry] of entries) {
    if (entry.meshes.includes(mesh)) {
      return id;
    }
  }
  return null;
}

export function retintTransformHelper(helper: THREE.Object3D) {
  helper.traverse((child) => {
    if ("material" in child) {
      const material = child.material as THREE.LineBasicMaterial | THREE.MeshBasicMaterial;
      if (material.color && material.color.getHex() === 0xffffff) {
        material.color.setHex(0x888888);
      }
    }
  });
}

export function visibleEntryMeshes(entries: Map<string, BrowserNodeEntry>) {
  const meshes: THREE.Mesh[] = [];
  for (const entry of entries.values()) {
    for (const mesh of entry.meshes) {
      if (mesh.visible) {
        meshes.push(mesh);
      }
    }
  }
  return meshes;
}

export function visibleModelMeshes(model: THREE.Group) {
  const meshes: THREE.Mesh[] = [];
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.visible) {
      meshes.push(child);
    }
  });
  return meshes;
}
