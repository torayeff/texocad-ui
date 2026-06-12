import type { UploadedFile } from "@/app/types/chat";
import { anonymousSessionHeaders } from "@/app/lib/chat/anonymous-session";

const SAFE_FILENAME_REPLACEMENTS = /[^a-zA-Z0-9._-]/g;

export function sanitizeUploadFilename(name: string): string {
  return name.replace(/\s+/g, "_").replace(SAFE_FILENAME_REPLACEMENTS, "");
}

export async function uploadFileToBlob(file: File): Promise<UploadedFile> {
  const sanitized = sanitizeUploadFilename(file.name);

  const response = await fetch("/api/blob", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...anonymousSessionHeaders() },
    body: JSON.stringify({ filename: sanitized }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to get upload URL");
  }

  const { sasUrl, blobUrl } = (await response.json()) as {
    sasUrl: string;
    blobUrl: string;
  };

  const uploadResponse = await fetch(sasUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status})`);
  }

  return {
    contentType: file.type || "application/octet-stream",
    url: blobUrl,
    filename: file.name,
  };
}
