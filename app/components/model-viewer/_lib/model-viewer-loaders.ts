import { buildGlbModel } from "@/app/components/model-viewer/_lib/loaders/glb";
import { buildStepModel } from "@/app/components/model-viewer/_lib/loaders/step";
import { buildStlModel } from "@/app/components/model-viewer/_lib/loaders/stl";
import type { BuildModelOptions, BuiltModel } from "@/app/components/model-viewer/_types/loader-types";
import type { ModelFormat } from "@/app/types/model-viewer";

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

export async function buildModel(buffer: ArrayBuffer, format: ModelFormat, options: BuildModelOptions = {}): Promise<BuiltModel> {
  switch (format) {
    case "step":
      return buildStepModel(buffer, options);
    case "stl":
      return buildStlModel(buffer, options);
    case "glb":
      return buildGlbModel(buffer, options);
    default:
      return assertNever(format, "Unhandled model format");
  }
}
