"use client";

import type {
  LocalModelShareApiResponse,
  LocalModelShareFinalizeRequest,
  LocalModelShareSuccessResponse,
  LocalModelShareUploadRequest,
  LocalModelShareUploadResponse,
} from "@/app/types/local-model-share";

function isShareUploadResponse(result: LocalModelShareApiResponse): result is LocalModelShareUploadResponse {
  return "uploadUrl" in result && typeof result.uploadUrl === "string";
}

function isShareSuccessResponse(result: LocalModelShareApiResponse): result is LocalModelShareSuccessResponse {
  return "shareUrl" in result && typeof result.shareUrl === "string";
}

async function readShareApiResponse(response: Response): Promise<LocalModelShareApiResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as LocalModelShareApiResponse;
  }

  const message = (await response.text()).trim() || response.statusText || "Failed to share model.";
  return { error: message };
}

export async function createLocalModelShareUpload(
  payload: LocalModelShareUploadRequest,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/local-model-shares", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
  const result = await readShareApiResponse(response);

  if ("error" in result) {
    throw new Error(result.error);
  }

  if (!response.ok || !isShareUploadResponse(result)) {
    throw new Error("Share upload URL was not returned.");
  }

  return result;
}

export async function uploadFileToSharedModelBlob(
  file: File,
  upload: LocalModelShareUploadResponse,
  signal?: AbortSignal,
) {
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      request.abort();
    };

    if (signal?.aborted) {
      reject(new Error("Model upload was canceled."));
      return;
    }

    request.open("PUT", upload.uploadUrl);
    request.setRequestHeader("If-None-Match", "*");
    request.setRequestHeader("x-ms-blob-type", "BlockBlob");
    request.addEventListener("load", () => {
      cleanup();
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }

      reject(new Error("Failed to upload model file."));
    });
    request.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to upload model file."));
    });
    request.addEventListener("abort", () => {
      cleanup();
      reject(new Error("Model upload was canceled."));
    });
    signal?.addEventListener("abort", abort, { once: true });
    request.send(file);
  });
}

export async function finalizeLocalModelShareUpload(
  upload: LocalModelShareUploadResponse,
  file: File,
  shareName: string,
  signal?: AbortSignal,
) {
  const payload: LocalModelShareFinalizeRequest = {
    action: "finalizeUpload",
    extension: upload.extension,
    fileName: file.name,
    shareName,
    slug: upload.slug,
  };
  const response = await fetch("/api/local-model-shares", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
  const result = await readShareApiResponse(response);

  if ("error" in result) {
    throw new Error(result.error);
  }

  if (!response.ok || !isShareSuccessResponse(result)) {
    throw new Error("Failed to validate uploaded model.");
  }

  return result;
}
