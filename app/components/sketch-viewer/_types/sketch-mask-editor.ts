export interface SketchMaskEditorHandle {
  clear: () => void;
  createMaskFile: () => Promise<File>;
}
