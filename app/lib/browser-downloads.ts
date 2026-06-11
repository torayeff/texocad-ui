"use client";

function safeDownloadFileName(fileName: string, fallback = "download") {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim().slice(0, 255) || fallback;
}

export function saveBrowserFile(buffer: ArrayBuffer, fileName: string, type: string, fallbackName = "download") {
  const objectUrl = URL.createObjectURL(new Blob([buffer], { type }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = safeDownloadFileName(fileName, fallbackName);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
