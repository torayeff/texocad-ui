import { STLLoader } from "three/addons/loaders/STLLoader.js";

import type { StlWorkerRequest, StlWorkerResponse } from "@/app/components/model-viewer/_types/loader-types";

interface WorkerScope {
  addEventListener: (type: "message", listener: (event: MessageEvent) => void) => void;
  postMessage: (message: StlWorkerResponse, transfer?: Transferable[]) => void;
}

const workerScope = self as unknown as WorkerScope;

function cloneAttributeArray(array: ArrayLike<number>) {
  return array instanceof Float32Array ? new Float32Array(array) : Float32Array.from(array);
}

function cloneIndexArray(array: ArrayLike<number>) {
  return array.length > 65535 ? Uint32Array.from(array) : Uint16Array.from(array);
}

function parseStl(buffer: ArrayBuffer) {
  const geometry = new STLLoader().parse(buffer);
  const positionAttribute = geometry.getAttribute("position");
  const normalAttribute = geometry.getAttribute("normal");
  const indexAttribute = geometry.index;
  const position = cloneAttributeArray(positionAttribute.array);
  const normal = normalAttribute ? cloneAttributeArray(normalAttribute.array) : null;
  const index = indexAttribute ? cloneIndexArray(indexAttribute.array) : null;
  const vertexCount = positionAttribute.count;
  const triangleCount = index ? index.length / 3 : vertexCount / 3;

  geometry.dispose();

  return {
    index,
    normal,
    position,
    triangleCount,
    vertexCount,
  };
}

workerScope.addEventListener("message", (event) => {
  const request = event.data as StlWorkerRequest;
  if (request.type !== "parse-stl") {
    return;
  }

  try {
    const geometry = parseStl(request.buffer);
    const transfer: Transferable[] = [geometry.position.buffer];
    if (geometry.normal) {
      transfer.push(geometry.normal.buffer);
    }
    if (geometry.index) {
      transfer.push(geometry.index.buffer);
    }

    workerScope.postMessage({ geometry, type: "success" }, transfer);
  } catch (error) {
    workerScope.postMessage({
      message: error instanceof Error ? error.message : "Failed to parse STL model.",
      type: "error",
    });
  }
});
