import occtimportjs from "occt-import-js";
import type { OcctImportModule, OcctMesh, OcctNumericArray } from "occt-import-js";

import type { StepMeshData, StepWorkerRequest, StepWorkerResponse } from "@/app/components/model-viewer/_types/loader-types";

interface WorkerScope {
  addEventListener: (type: "message", listener: (event: MessageEvent) => void) => void;
  postMessage: (message: StepWorkerResponse) => void;
}

interface StepDisplayNameCandidates {
  brepNames: string[];
  occurrenceNames: string[];
  productNames: string[];
}

const workerScope = self as unknown as WorkerScope;
const triangulationParams = {
  linearUnit: "millimeter",
  linearDeflectionType: "bounding_box_ratio",
  linearDeflection: 0.001,
  angularDeflection: 0.5,
};
const genericStepNames = new Set(["", "COMPOUND", "COMPSOLID", "EDGE", "FACE", "SHELL", "SOLID", "VERTEX", "WIRE"]);

let occtImportPromise: Promise<OcctImportModule> | null = null;

function loadOcctImporter() {
  occtImportPromise ??= occtimportjs({
    locateFile: (path) => (path.endsWith(".wasm") ? "/occt-import-js.wasm" : path),
  });

  return occtImportPromise;
}

function serializeNumericArray(values: OcctNumericArray): number[] | number[][] {
  if (Array.isArray(values[0])) {
    return (values as number[][]).map((row) => Array.from(row));
  }

  return Array.from(values as ArrayLike<number>);
}

function serializeColor(color?: [number, number, number] | null): [number, number, number] | null {
  return color ? [color[0], color[1], color[2]] : null;
}

function isGenericStepName(name: string) {
  const normalizedName = name.trim().toUpperCase();

  return (
    genericStepNames.has(normalizedName) ||
    /^SOLID[_\s-]*\d*$/.test(normalizedName) ||
    /^(?:=>)?\[[\d:\s]+\]$/.test(normalizedName)
  );
}

function decodeStepString(value: string) {
  return value.replace(/''/g, "'").trim();
}

function splitStepArguments(value: string) {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === "'") {
      current += char;
      if (inString && nextChar === "'") {
        current += nextChar;
        index += 1;
      } else {
        inString = !inString;
      }
      continue;
    }

    if (!inString) {
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      } else if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function firstStepStringArgument(entityArguments: string) {
  const [firstArgument] = splitStepArguments(entityArguments);
  const match = firstArgument?.match(/^'((?:''|[^'])*)'$/);

  return match ? decodeStepString(match[1]) : null;
}

function secondStepStringArgument(entityArguments: string) {
  const [, secondArgument] = splitStepArguments(entityArguments);
  const match = secondArgument?.match(/^'((?:''|[^'])*)'$/);

  return match ? decodeStepString(match[1]) : null;
}

function collectStepEntityNames(content: string, entityName: string, argumentName: (args: string) => string | null) {
  const names: string[] = [];
  const entityPattern = new RegExp(`${entityName}\\s*\\(([^;]*)\\)\\s*;`, "gi");
  let match: RegExpExecArray | null;

  while ((match = entityPattern.exec(content))) {
    const name = argumentName(match[1]);
    if (name && !isGenericStepName(name)) {
      names.push(name);
    }
  }

  return names;
}

function uniqueNames(names: string[]) {
  return [...new Set(names)];
}

function parseStepDisplayNameCandidates(buffer: ArrayBuffer): StepDisplayNameCandidates {
  const content = new TextDecoder().decode(buffer);

  return {
    brepNames: uniqueNames(collectStepEntityNames(content, "MANIFOLD_SOLID_BREP", firstStepStringArgument)),
    occurrenceNames: uniqueNames(collectStepEntityNames(content, "NEXT_ASSEMBLY_USAGE_OCCURRENCE", secondStepStringArgument)),
    productNames: uniqueNames(collectStepEntityNames(content, "PRODUCT", firstStepStringArgument)),
  };
}

function namesForMeshCount(names: string[], meshCount: number) {
  if (names.length <= meshCount) {
    return names;
  }

  return names.slice(-meshCount);
}

function chooseStepDisplayNames({ brepNames, occurrenceNames, productNames }: StepDisplayNameCandidates, meshCount: number) {
  const nameBuckets = [occurrenceNames, productNames, brepNames];
  const exactNames = nameBuckets.find((names) => names.length === meshCount);
  if (exactNames) {
    return exactNames;
  }

  const overflowingNames = nameBuckets.find((names) => names.length > meshCount);
  if (overflowingNames) {
    return namesForMeshCount(overflowingNames, meshCount);
  }

  return nameBuckets.find((names) => names.length > 0) ?? [];
}

function serializeMesh(mesh: OcctMesh, displayName?: string): StepMeshData {
  const normal = mesh.attributes.normal;

  return {
    attributes: {
      normal: normal ? { array: serializeNumericArray(normal.array) } : undefined,
      position: { array: serializeNumericArray(mesh.attributes.position.array) },
    },
    brep_faces: mesh.brep_faces?.map((face) => ({
      color: serializeColor(face.color),
      first: face.first,
      last: face.last,
    })),
    color: serializeColor(mesh.color),
    displayName,
    index: { array: serializeNumericArray(mesh.index.array) },
    name: mesh.name,
  };
}

async function parseStep(buffer: ArrayBuffer) {
  const displayNameCandidates = parseStepDisplayNameCandidates(buffer);
  const occt = await loadOcctImporter();
  const result = occt.ReadStepFile(new Uint8Array(buffer), triangulationParams);

  if (!result.success) {
    throw new Error("OpenCascade could not read this STEP file.");
  }

  const displayNames = chooseStepDisplayNames(displayNameCandidates, result.meshes.length);

  return result.meshes.map((mesh, index) => {
    const displayName = displayNames[index];

    return serializeMesh(mesh, displayName && isGenericStepName(mesh.name) ? displayName : undefined);
  });
}

workerScope.addEventListener("message", (event) => {
  const request = event.data as StepWorkerRequest;
  if (request.type !== "parse-step") {
    return;
  }

  void parseStep(request.buffer)
    .then((meshes) => {
      workerScope.postMessage({ meshes, type: "success" });
    })
    .catch((error: unknown) => {
      workerScope.postMessage({
        message: error instanceof Error ? error.message : "Failed to parse STEP model.",
        type: "error",
      });
    });
});
