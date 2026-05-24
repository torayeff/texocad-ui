export const STEP_CONTENT_TYPE = "application/step";

export function isStepExport(filename: string, contentType: string) {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith(".step") || lowerFilename.endsWith(".stp") || contentType === STEP_CONTENT_TYPE;
}

export function isSketchImageExport(filename: string, contentType: string) {
  const lowerFilename = filename.toLowerCase();
  return (
    lowerFilename.endsWith(".png") ||
    lowerFilename.endsWith(".jpg") ||
    lowerFilename.endsWith(".jpeg") ||
    lowerFilename.endsWith(".webp") ||
    contentType === "image/png" ||
    contentType === "image/jpeg" ||
    contentType === "image/webp"
  );
}
