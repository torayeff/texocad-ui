import * as THREE from "three";
import { type MutableRefObject } from "react";

import { getIntersectionMaterial } from "@/app/studio-v2/_components/viewer/model-viewer-three";

export interface HighlightState {
  material: THREE.MeshStandardMaterial;
  color: THREE.Color;
  emissive: THREE.Color;
}

export function isVisibleThroughParents(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) {
      return false;
    }

    current = current.parent;
  }

  return true;
}

export function visibleMeshes(meshes: THREE.Mesh[]) {
  return meshes.filter(isVisibleThroughParents);
}

export function collectStandardMaterials(meshes: THREE.Mesh[]) {
  const materials = new Set<THREE.MeshStandardMaterial>();

  for (const mesh of meshes) {
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of meshMaterials) {
      if (material instanceof THREE.MeshStandardMaterial) {
        materials.add(material);
      }
    }
  }

  return [...materials];
}

interface AttachModelPickingOptions {
  camera: THREE.PerspectiveCamera;
  clearHighlightRef: MutableRefObject<() => void>;
  pickableMeshesRef: MutableRefObject<THREE.Mesh[]>;
  renderer: THREE.WebGLRenderer;
}

export function attachModelPicking({
  camera,
  clearHighlightRef,
  pickableMeshesRef,
  renderer,
}: AttachModelPickingOptions) {
  let highlighted: HighlightState | null = null;
  let pointerFrame = 0;
  let pointerPosition: { clientX: number; clientY: number } | null = null;
  let cachedBounds = renderer.domElement.getBoundingClientRect();
  let cursor = "";
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const highlightColor = new THREE.Color(0xffc857);
  const highlightEmissive = new THREE.Color(0x5c3a00);

  const clearHighlight = () => {
    if (!highlighted) {
      return;
    }

    highlighted.material.color.copy(highlighted.color);
    highlighted.material.emissive.copy(highlighted.emissive);
    highlighted = null;
  };
  clearHighlightRef.current = clearHighlight;

  const highlightMaterial = (material: THREE.MeshStandardMaterial) => {
    if (highlighted?.material === material) {
      return;
    }

    clearHighlight();
    highlighted = {
      material,
      color: material.color.clone(),
      emissive: material.emissive.clone(),
    };
    material.color.copy(highlightColor);
    material.emissive.copy(highlightEmissive);
  };

  const setCursor = (nextCursor: string) => {
    if (cursor === nextCursor) {
      return;
    }

    cursor = nextCursor;
    renderer.domElement.style.cursor = nextCursor;
  };

  const runPointerPick = () => {
    pointerFrame = 0;

    const position = pointerPosition;
    const bounds = cachedBounds;
    const pickableMeshes = pickableMeshesRef.current;
    if (!position || pickableMeshes.length === 0) {
      return;
    }

    pointer.x = ((position.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
    pointer.y = -((position.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const [intersection] = raycaster.intersectObjects(pickableMeshes, false);

    if (!intersection) {
      clearHighlight();
      setCursor("grab");
      return;
    }

    const material = getIntersectionMaterial(intersection);
    if (!material) {
      clearHighlight();
      setCursor("grab");
      return;
    }

    highlightMaterial(material);
    setCursor("pointer");
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (pickableMeshesRef.current.length === 0) {
      return;
    }

    cachedBounds = renderer.domElement.getBoundingClientRect();
    pointerPosition = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (!pointerFrame) {
      pointerFrame = window.requestAnimationFrame(runPointerPick);
    }
  };

  const handlePointerLeave = () => {
    pointerPosition = null;
    if (pointerFrame) {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    }
    clearHighlight();
    setCursor("grab");
  };

  setCursor("grab");
  renderer.domElement.addEventListener("pointermove", handlePointerMove, { passive: true });
  renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

  return () => {
    if (pointerFrame) {
      window.cancelAnimationFrame(pointerFrame);
    }
    renderer.domElement.removeEventListener("pointermove", handlePointerMove);
    renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
    clearHighlight();
    clearHighlightRef.current = () => { };
  };
}
