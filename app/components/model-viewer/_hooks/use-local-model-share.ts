"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ModelSource } from "@/app/types/model-viewer";
import {
  maxLocalModelShareNameChars,
  maxLocalModelShareUploadBytes,
  slugifyLocalModelShareName,
} from "@/app/lib/model-formats";
import {
  createLocalModelShareUpload,
  finalizeLocalModelShareUpload,
  uploadFileToSharedModelBlob,
} from "@/app/components/model-viewer/_lib/local-model-share-client";
import type { LocalModelShareUploadRequest } from "@/app/types/local-model-share";

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
      const upload = await createLocalModelShareUpload(payload, abortController.signal);
      await uploadFileToSharedModelBlob(file, upload, abortController.signal);
      const finalizedShare = await finalizeLocalModelShareUpload(upload, file, trimmedName, abortController.signal);
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
