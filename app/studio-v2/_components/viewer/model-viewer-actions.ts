import { getSourceBuffer, type ModelSource } from "@/app/studio-v2/_components/viewer/model-viewer-loaders";

function decodeFileName(fileName: string) {
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function safeDownloadFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim().slice(0, 255) || "model";
}

export function downloadNameFromSource(source: ModelSource) {
  if (source.kind === "file") {
    return source.file.name || "model";
  }

  if (source.label) {
    return source.label;
  }

  try {
    const pathname = new URL(source.url, window.location.href).pathname;
    const fileName = pathname.slice(pathname.lastIndexOf("/") + 1);
    return fileName ? decodeFileName(fileName) : "model";
  } catch {
    return "model";
  }
}

export function saveModelFile(buffer: ArrayBuffer, fileName: string, type: string) {
  const objectUrl = URL.createObjectURL(new Blob([buffer], { type }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = safeDownloadFileName(fileName);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function saveSourceModelFile(source: ModelSource, signal?: AbortSignal) {
  const buffer = await getSourceBuffer(source, undefined, signal);
  const mimeType = source.kind === "file" ? source.file.type || "application/octet-stream" : "application/octet-stream";
  saveModelFile(buffer, downloadNameFromSource(source), mimeType);
}
