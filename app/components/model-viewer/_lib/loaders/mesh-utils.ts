import * as THREE from "three";

import { geometryTriangleCount, shouldCreateEdgeOverlay } from "@/app/components/model-viewer/_lib/geometry-budget";
import type { NumericArrayData } from "@/app/components/model-viewer/_types/loader-types";

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new Error("Model loading was canceled.");
  }
}

export function flattenNumericArray(values: NumericArrayData): number[] {
  if (Array.isArray(values[0])) {
    return (values as number[][]).flat();
  }

  return values as number[];
}

export function colorFromRgb(rgb?: [number, number, number] | null) {
  return rgb ? new THREE.Color(rgb[0], rgb[1], rgb[2]) : new THREE.Color(0xcfd6df);
}

export function createEdgeMaterial() {
  return new THREE.LineBasicMaterial({
    color: 0x101820,
    transparent: true,
    opacity: 0.62,
  });
}

export function createStandardMaterial(color: THREE.Color | number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
}

export function addEdgeOverlay(mesh: THREE.Mesh, thresholdAngle = 25) {
  if (!shouldCreateEdgeOverlay(geometryTriangleCount(mesh.geometry))) {
    return;
  }

  const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const edgeLines = new THREE.LineSegments(edgeGeometry, createEdgeMaterial());
  edgeLines.name = `${mesh.name || "mesh"} edges`;
  edgeLines.renderOrder = 1;
  mesh.add(edgeLines);
}

function standardMaterialFrom(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
    const cloned = material.clone();
    cloned.side = THREE.DoubleSide;
    return cloned;
  }

  const materialWithColor = material as THREE.Material & { color?: THREE.Color };
  return createStandardMaterial(materialWithColor.color instanceof THREE.Color ? materialWithColor.color.clone() : 0xcfd6df);
}

export function normalizeMesh(mesh: THREE.Mesh) {
  if (!mesh.geometry.getAttribute("normal")) {
    mesh.geometry.computeVertexNormals();
  }

  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map((material) => standardMaterialFrom(material))
    : standardMaterialFrom(mesh.material);
}
