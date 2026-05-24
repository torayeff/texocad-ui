import type { ModelSource } from "@/app/types/model-viewer";
import { getSourceBuffer } from "@/app/components/model-viewer/_lib/model-source";
import { saveBrowserFile } from "@/app/lib/browser-downloads";

function decodeFileName(fileName: string) {
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
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

export async function saveSourceModelFile(source: ModelSource, signal?: AbortSignal) {
  const buffer = await getSourceBuffer(source, undefined, signal);
  const mimeType = source.kind === "file" ? source.file.type || "application/octet-stream" : "application/octet-stream";
  saveBrowserFile(buffer, downloadNameFromSource(source), mimeType, "model");
}
