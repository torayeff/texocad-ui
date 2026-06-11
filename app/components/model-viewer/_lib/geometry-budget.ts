import * as THREE from "three";

const maxModelSourceBytes = 100 * 1024 * 1024;
const maxEdgeOverlayTriangles = 250_000;

const maxModelMeshes = 1000;
const maxModelTriangles = 2_000_000;
const maxModelVertices = 2_000_000;

function modelTooLargeError() {
  return new Error("Model is too large or complex to preview safely.");
}

export function assertSourceByteLength(byteLength: number) {
  if (byteLength > maxModelSourceBytes) {
    throw new Error("Model files must be 100 MB or smaller.");
  }
}

export function geometryVertexCount(geometry: THREE.BufferGeometry) {
  return geometry.getAttribute("position")?.count ?? 0;
}

export function geometryTriangleCount(geometry: THREE.BufferGeometry) {
  return geometry.index ? geometry.index.count / 3 : geometryVertexCount(geometry) / 3;
}

export function assertGeometryBudget(meshCount: number, vertexCount: number, triangleCount: number) {
  if (meshCount > maxModelMeshes || vertexCount > maxModelVertices || triangleCount > maxModelTriangles) {
    throw modelTooLargeError();
  }
}

export function shouldCreateEdgeOverlay(triangleCount: number) {
  return triangleCount <= maxEdgeOverlayTriangles;
}
