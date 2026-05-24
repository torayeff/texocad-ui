import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

import { assertGeometryBudget, geometryTriangleCount, geometryVertexCount } from "@/app/components/model-viewer/_lib/geometry-budget";
import { addEdgeOverlay, normalizeMesh, throwIfAborted } from "@/app/components/model-viewer/_lib/loaders/mesh-utils";
import type { BuildModelOptions, BuiltModel } from "@/app/components/model-viewer/_types/loader-types";

function isGltfJsonBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 32));
  for (const byte of bytes) {
    if (byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d) {
      continue;
    }

    return byte === 0x7b;
  }

  return false;
}

function hasBlockedGltfUri(item: unknown) {
  if (!item || typeof item !== "object" || !("uri" in item)) {
    return false;
  }

  const uri = (item as { uri?: unknown }).uri;
  return typeof uri === "string" && Boolean(uri) && !uri.startsWith("data:");
}

function validateGltfJsonPayload(buffer: ArrayBuffer) {
  if (!isGltfJsonBuffer(buffer)) {
    return;
  }

  const payload = JSON.parse(new TextDecoder().decode(buffer)) as {
    buffers?: unknown[];
    images?: unknown[];
  };
  if (payload.buffers?.some(hasBlockedGltfUri) || payload.images?.some(hasBlockedGltfUri)) {
    throw new Error("GLTF files with external resources cannot be previewed.");
  }
}

async function parseGlb(buffer: ArrayBuffer, signal?: AbortSignal) {
  throwIfAborted(signal);

  return new Promise<GLTF>((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new Error("GLB parsing was canceled."));
    };

    if (signal?.aborted) {
      abort();
      return;
    }

    signal?.addEventListener("abort", abort, { once: true });
    new GLTFLoader().parse(
      buffer,
      "",
      (gltf) => {
        cleanup();
        resolve(gltf);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export async function buildGlbModel(buffer: ArrayBuffer, options: BuildModelOptions = {}): Promise<BuiltModel> {
  validateGltfJsonPayload(buffer);
  throwIfAborted(options.signal);
  const gltf = await parseGlb(buffer, options.signal);
  throwIfAborted(options.signal);

  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      normalizeMesh(child);
      meshes.push(child);
    }
  });

  const totals = meshes.reduce(
    (sum, mesh) => {
      sum.vertices += geometryVertexCount(mesh.geometry);
      sum.triangles += geometryTriangleCount(mesh.geometry);
      return sum;
    },
    { triangles: 0, vertices: 0 },
  );
  assertGeometryBudget(meshes.length, totals.vertices, totals.triangles);

  for (const mesh of meshes) {
    throwIfAborted(options.signal);
    addEdgeOverlay(mesh);
  }

  group.add(gltf.scene);

  return {
    group,
    meshCount: meshes.length,
  };
}
