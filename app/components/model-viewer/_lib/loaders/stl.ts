import * as THREE from "three";

import { assertGeometryBudget } from "@/app/components/model-viewer/_lib/geometry-budget";
import { addEdgeOverlay, createStandardMaterial, throwIfAborted } from "@/app/components/model-viewer/_lib/loaders/mesh-utils";
import type {
  BuildModelOptions,
  BuiltModel,
  ParsedStlGeometry,
  StlWorkerRequest,
  StlWorkerResponse,
} from "@/app/components/model-viewer/_types/loader-types";

async function parseStlGeometry(buffer: ArrayBuffer, signal?: AbortSignal) {
  const worker = new Worker(new URL("../model-processing.worker.ts", import.meta.url), { type: "module" });

  return new Promise<ParsedStlGeometry>((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new Error("STL parsing was canceled."));
    };

    if (signal?.aborted) {
      abort();
      return;
    }

    worker.addEventListener("message", (event: MessageEvent<StlWorkerResponse>) => {
      cleanup();
      if (event.data.type === "success") {
        resolve(event.data.geometry);
        return;
      }

      reject(new Error(event.data.message));
    });
    worker.addEventListener("error", (event) => {
      cleanup();
      reject(new Error(event.message || "Failed to parse STL model."));
    });
    signal?.addEventListener("abort", abort, { once: true });
    worker.postMessage({ buffer, type: "parse-stl" } satisfies StlWorkerRequest, [buffer]);
  });
}

function createGeometry({ index, normal, position }: ParsedStlGeometry) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  if (normal) {
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  } else {
    geometry.computeVertexNormals();
  }
  if (index) {
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
  }

  return geometry;
}

export async function buildStlModel(buffer: ArrayBuffer, options: BuildModelOptions = {}): Promise<BuiltModel> {
  const parsedGeometry = await parseStlGeometry(buffer, options.signal);
  throwIfAborted(options.signal);
  assertGeometryBudget(1, parsedGeometry.vertexCount, parsedGeometry.triangleCount);

  const mesh = new THREE.Mesh(createGeometry(parsedGeometry), createStandardMaterial(0xcfd6df));
  mesh.name = "STL model";
  addEdgeOverlay(mesh);

  const group = new THREE.Group();
  group.add(mesh);

  return {
    group,
    meshCount: 1,
  };
}
