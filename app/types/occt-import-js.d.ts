declare module "occt-import-js" {
  export type OcctNumericArray = number[] | number[][];

  export interface OcctMesh {
    attributes: {
      normal?: {
        array: OcctNumericArray;
      };
      position: {
        array: OcctNumericArray;
      };
    };
    brep_faces?: Array<{
      color?: [number, number, number] | null;
      first: number;
      last: number;
    }>;
    color?: [number, number, number] | null;
    index: {
      array: OcctNumericArray;
    };
    name: string;
  }

  export interface OcctReadStepSuccess {
    meshes: OcctMesh[];
    success: true;
  }

  export interface OcctReadStepFailure {
    success: false;
  }

  export interface OcctImportModule {
    ReadStepFile(
      data: Uint8Array,
      params: Record<string, string | number | boolean>,
    ): OcctReadStepSuccess | OcctReadStepFailure;
  }

  export default function occtimportjs(options: {
    locateFile: (path: string) => string;
  }): Promise<OcctImportModule>;
}
