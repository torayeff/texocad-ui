import { buildStepModel } from "@/app/components/model-viewer/_lib/loaders/step";
import type { BuildModelOptions, BuiltModel } from "@/app/components/model-viewer/_types/loader-types";
import {
  type ModelFormat,
} from "@/app/types/model-viewer";

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

export async function buildModel(buffer: ArrayBuffer, format: ModelFormat, options: BuildModelOptions = {}): Promise<BuiltModel> {
  switch (format) {
    case "step":
      return buildStepModel(buffer, options);
    case "stl":
    case "glb":
      throw new Error("Only generated STEP exports are supported in Studio.");
    default:
      return assertNever(format, "Unhandled model format");
  }
}
