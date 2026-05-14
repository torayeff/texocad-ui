import * as THREE from "three";

import {
  type BuildModelOptions,
  type BuiltModel,
  type StepMeshData,
  type StepWorkerRequest,
  type StepWorkerResponse,
} from "@/app/studio/_components/viewer/model-loader-types";
import {
  colorFromRgb,
  createEdgeMaterial,
  createStandardMaterial,
  flattenNumericArray,
  throwIfAborted,
} from "@/app/studio/_components/viewer/loaders/mesh-utils";

interface BuiltStepMesh {
  mesh: THREE.Mesh;
  edges: THREE.Group;
}

function buildMesh(occtMesh: StepMeshData): BuiltStepMesh {
  const geometry = new THREE.BufferGeometry();
  const positions = flattenNumericArray(occtMesh.attributes.position.array);
  const indices = Uint32Array.from(flattenNumericArray(occtMesh.index.array));
  const meshName = occtMesh.displayName ?? occtMesh.name;

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  if (occtMesh.attributes.normal) {
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(flattenNumericArray(occtMesh.attributes.normal.array), 3),
    );
  } else {
    geometry.computeVertexNormals();
  }

  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.name = meshName;

  const defaultMaterial = createStandardMaterial(colorFromRgb(occtMesh.color));
  const materials: THREE.MeshStandardMaterial[] = [defaultMaterial];
  const edges = new THREE.Group();
  const triangleCount = indices.length / 3;
  const edgeMaterial = createEdgeMaterial();

  const faces = occtMesh.brep_faces ?? [];
  if (faces.length > 0) {
    let triangleIndex = 0;
    let faceIndex = 0;

    while (triangleIndex < triangleCount) {
      const firstTriangle = triangleIndex;
      let lastTriangle: number;
      let materialIndex = 0;

      if (faceIndex >= faces.length) {
        lastTriangle = triangleCount;
      } else if (triangleIndex < faces[faceIndex].first) {
        lastTriangle = faces[faceIndex].first;
      } else {
        lastTriangle = faces[faceIndex].last + 1;
        materials.push(createStandardMaterial(colorFromRgb(faces[faceIndex].color ?? occtMesh.color)));
        materialIndex = materials.length - 1;
        faceIndex += 1;
      }

      geometry.addGroup(firstTriangle * 3, (lastTriangle - firstTriangle) * 3, materialIndex);

      const faceGeometry = new THREE.BufferGeometry();
      faceGeometry.setAttribute("position", geometry.getAttribute("position"));
      if (geometry.getAttribute("normal")) {
        faceGeometry.setAttribute("normal", geometry.getAttribute("normal"));
      }
      faceGeometry.setIndex(new THREE.BufferAttribute(indices.slice(firstTriangle * 3, lastTriangle * 3), 1));

      const edgeGeometry = new THREE.EdgesGeometry(faceGeometry, 180);
      const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edges.add(edgeLines);

      triangleIndex = lastTriangle;
    }
  } else {
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 25);
    edges.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
  }

  const mesh = new THREE.Mesh(geometry, materials.length === 1 ? defaultMaterial : materials);
  mesh.name = meshName;
  edges.name = `${meshName || "mesh"} edges`;
  edges.renderOrder = 1;

  return { mesh, edges };
}

async function parseStepMeshes(buffer: ArrayBuffer, signal?: AbortSignal) {
  const worker = new Worker(new URL("../step-parser.worker.ts", import.meta.url), { type: "module" });

  return new Promise<StepMeshData[]>((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new Error("STEP parsing was canceled."));
    };

    if (signal?.aborted) {
      abort();
      return;
    }

    worker.addEventListener("message", (event: MessageEvent<StepWorkerResponse>) => {
      cleanup();
      if (event.data.type === "success") {
        resolve(event.data.meshes);
        return;
      }

      reject(new Error(event.data.message));
    });
    worker.addEventListener("error", (event) => {
      cleanup();
      reject(new Error(event.message || "Failed to parse STEP model."));
    });
    signal?.addEventListener("abort", abort, { once: true });
    worker.postMessage({ buffer, type: "parse-step" } satisfies StepWorkerRequest, [buffer]);
  });
}

export async function buildStepModel(buffer: ArrayBuffer, options: BuildModelOptions = {}): Promise<BuiltModel> {
  const meshes = await parseStepMeshes(buffer, options.signal);
  throwIfAborted(options.signal);

  const group = new THREE.Group();
  for (const resultMesh of meshes) {
    throwIfAborted(options.signal);
    const built = buildMesh(resultMesh);
    group.add(built.mesh);
    group.add(built.edges);
  }

  return {
    group,
    meshCount: meshes.length,
  };
}
