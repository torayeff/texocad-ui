import type { Group } from "three";

export type NumericArrayData = number[] | number[][];

export interface BuiltModel {
  group: Group;
  meshCount: number;
}

export interface BuildModelOptions {
  signal?: AbortSignal;
}

export interface StepMeshData {
  attributes: {
    normal?: {
      array: NumericArrayData;
    };
    position: {
      array: NumericArrayData;
    };
  };
  brep_faces?: Array<{
    color?: [number, number, number] | null;
    first: number;
    last: number;
  }>;
  color?: [number, number, number] | null;
  index: {
    array: NumericArrayData;
  };
  displayName?: string;
  name: string;
}

export interface StepWorkerRequest {
  buffer: ArrayBuffer;
  type: "parse-step";
}

export type StepWorkerResponse =
  | {
    meshes: StepMeshData[];
    type: "success";
  }
  | {
    message: string;
    type: "error";
  };

export type StlIndexArray = Uint16Array | Uint32Array;

export interface ParsedStlGeometry {
  index: StlIndexArray | null;
  normal: Float32Array | null;
  position: Float32Array;
  triangleCount: number;
  vertexCount: number;
}

export interface StlWorkerRequest {
  buffer: ArrayBuffer;
  type: "parse-stl";
}

export type StlWorkerResponse =
  | {
    geometry: ParsedStlGeometry;
    type: "success";
  }
  | {
    message: string;
    type: "error";
  };
