import { buildStepModel } from "@/app/studio/_components/viewer/loaders/step";
import {
  type BuildModelOptions,
  type BuiltModel,
  type ModelFormat,
} from "@/app/studio/_components/viewer/model-loader-types";
export { getSourceBuffer, sourceFormat } from "@/app/studio/_components/viewer/model-source";
export type {
  BuildModelOptions,
  BuiltModel,
  ModelFormat,
  ModelSource,
  NumericArrayData,
  StepMeshData,
  StepWorkerRequest,
  StepWorkerResponse,
} from "@/app/studio/_components/viewer/model-loader-types";

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
