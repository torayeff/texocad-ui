"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ModelSource } from "@/app/types/model-viewer";
import {
  maxLocalModelShareNameChars,
  maxLocalModelShareUploadBytes,
  slugifyLocalModelShareName,
  type LocalModelShareApiResponse,
  type LocalModelShareFinalizeRequest,
  type LocalModelShareSuccessResponse,
  type LocalModelShareUploadRequest,
  type LocalModelShareUploadResponse,
} from "@/app/types/local-model-share";

interface UseLocalModelShareOptions {
  source: ModelSource | null;
  onShareCreated?: (shareUrl: string) => void;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function defaultShareName(source: ModelSource | null) {
  if (!source) {
    return "";
  }

  const sourceName = source.kind === "file"
    ? source.file.name
    : new URL(source.url, window.location.href).pathname.split("/").pop() ?? source.label;
  const name = safeDecodeURIComponent(sourceName || source.label);
  const dotIndex = name.lastIndexOf(".");

  return (dotIndex > 0 ? name.slice(0, dotIndex) : name).replace(/[-_]+/g, " ").trim();
}

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

async function uploadFileToBlob(
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

async function finalizeBlobUpload(
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

export function useLocalModelShare({ onShareCreated, source }: UseLocalModelShareOptions) {
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareName, setShareName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareAbortRef = useRef<AbortController | null>(null);

  const handleOpenShareDialog = useCallback(() => {
    if (!source) {
      return;
    }

    setShareError(null);
    setDidCopyShareUrl(false);
    setShareName((currentName) => currentName || defaultShareName(source));
    setIsShareDialogOpen(true);
  }, [source]);

  const handleCloseShareDialog = useCallback(() => {
    if (isSharing) {
      return;
    }

    setIsShareDialogOpen(false);
    setShareError(null);
  }, [isSharing]);

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) {
      return;
    }

    void navigator.clipboard.writeText(shareUrl)
      .then(() => setDidCopyShareUrl(true))
      .catch(() => setShareError("Could not copy the link."));
  }, [shareUrl]);

  const handleShareSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    if (!source || isSharing) {
      return;
    }

    const trimmedName = shareName.trim();
    const slug = slugifyLocalModelShareName(trimmedName);
    if (!trimmedName || !slug) {
      setShareError("Enter a model name.");
      return;
    }

    if (trimmedName.length > maxLocalModelShareNameChars) {
      setShareError(`Model names must be ${maxLocalModelShareNameChars} characters or fewer.`);
      return;
    }

    if (source.kind !== "file") {
      setShareError("Only local files can be shared from this viewer.");
      return;
    }

    const file = source.file;
    if (file.size > maxLocalModelShareUploadBytes) {
      setShareError("Model files must be 100 MB or smaller.");
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setDidCopyShareUrl(false);
    shareAbortRef.current?.abort();
    const abortController = new AbortController();
    shareAbortRef.current = abortController;

    void (async () => {
      const payload: LocalModelShareUploadRequest = {
        action: "createUpload",
        fileName: file.name,
        fileSize: file.size,
        shareName: trimmedName,
      };
      const response = await fetch("/api/local-model-shares", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: abortController.signal,
      });
      const result = await readShareApiResponse(response);

      if ("error" in result) {
        throw new Error(result.error);
      }

      if (!response.ok || !isShareUploadResponse(result)) {
        throw new Error("Share upload URL was not returned.");
      }

      await uploadFileToBlob(file, result, abortController.signal);
      const finalizedShare = await finalizeBlobUpload(result, file, trimmedName, abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }

      setShareUrl(finalizedShare.shareUrl);
      onShareCreated?.(finalizedShare.shareUrl);
    })()
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setShareError(error instanceof Error ? error.message : "Failed to share model.");
        }
      })
      .finally(() => {
        if (shareAbortRef.current === abortController) {
          shareAbortRef.current = null;
          setIsSharing(false);
        }
      });
  }, [isSharing, onShareCreated, shareName, source]);

  useEffect(() => {
    return () => {
      shareAbortRef.current?.abort();
    };
  }, []);

  return {
    didCopyShareUrl,
    handleCloseShareDialog,
    handleCopyShareUrl,
    handleOpenShareDialog,
    handleShareSubmit,
    isShareDialogOpen,
    isSharing,
    setShareName,
    shareError,
    shareName,
    shareUrl,
  };
}
