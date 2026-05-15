"use client";

import { useCallback, useState } from "react";

import type { FormEvent } from "react";
import type { ModelSource, ShareRevision } from "@/app/types/model-viewer";

interface ShareResponse {
  alreadyShared: boolean;
  sharedModel: SharedModelResponse;
}

interface SharedModelResponse {
  shareUrl: string;
  slug: string;
}

interface ShareResult {
  revisionKey: string | null;
  url: string;
}

interface UseShareModelOptions {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
  source: ModelSource | null;
}

function defaultShareName(source: ModelSource | null) {
  if (!source?.label) return "";
  return source.label.replace(/\.(step|stp)$/i, "").replace(/[-_]+/g, " ").trim();
}

export function useShareModel({ activeRevisionKey, shareRevision, source }: UseShareModelOptions) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareName, setShareName] = useState("");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const shareUrl = shareResult?.revisionKey === activeRevisionKey ? shareResult.url : null;

  const handleOpenShareDialog = useCallback(() => {
    setShareError(null);
    setDidCopyShareUrl(false);
    if (!shareRevision) {
      return;
    }

    setIsShareDialogOpen(true);

    const params = new URLSearchParams({
      designId: shareRevision.designId,
      revisionNumber: String(shareRevision.revisionNumber),
      blobName: shareRevision.exportArtifact.blobName,
      checksum: shareRevision.exportArtifact.checksum,
      contentType: shareRevision.exportArtifact.contentType,
      filename: shareRevision.exportArtifact.filename,
    });

    void fetch(`/api/shares?${params.toString()}`)
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { sharedModel?: SharedModelResponse | null; error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? "Could not check this model.");
        }

        if (data?.sharedModel?.shareUrl) {
          setShareResult({
            revisionKey: activeRevisionKey,
            url: data.sharedModel.shareUrl,
          });
          return;
        }

        setShareName((currentName) => currentName || defaultShareName(source));
      })
      .catch(() => {
        setShareName((currentName) => currentName || defaultShareName(source));
      });
  }, [activeRevisionKey, shareRevision, source]);

  const handleCloseShareDialog = useCallback(() => {
    if (isSharing) return;
    setIsShareDialogOpen(false);
    setShareError(null);
  }, [isSharing]);

  const handleShareSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shareRevision || isSharing) return;

    const trimmedName = shareName.trim();
    if (!trimmedName) {
      setShareError("Enter a model name.");
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setDidCopyShareUrl(false);

    void fetch("/api/shares", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        designId: shareRevision.designId,
        revisionNumber: shareRevision.revisionNumber,
        name: trimmedName,
        exportArtifact: shareRevision.exportArtifact,
      }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as Partial<ShareResponse> & { error?: string } | null;
        if (!response.ok || !data?.sharedModel?.shareUrl) {
          throw new Error(data?.error ?? "Could not share this model.");
        }

        setShareResult({
          revisionKey: activeRevisionKey,
          url: data.sharedModel.shareUrl,
        });
      })
      .catch((error: unknown) => {
        setShareError(error instanceof Error ? error.message : "Could not share this model.");
      })
      .finally(() => setIsSharing(false));
  }, [activeRevisionKey, isSharing, shareName, shareRevision]);

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return;

    void navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setDidCopyShareUrl(true);
      })
      .catch(() => {
        setShareError("Could not copy the link.");
      });
  }, [shareUrl]);

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
