"use client";

import { useCallback, useState } from "react";

export function useShareDialogState() {
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const resetShareDialogStatus = useCallback(() => {
    setDidCopyShareUrl(false);
    setShareError(null);
  }, []);

  const openShareDialog = useCallback(() => {
    resetShareDialogStatus();
    setIsShareDialogOpen(true);
  }, [resetShareDialogStatus]);

  const closeShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
    setShareError(null);
  }, []);

  const copyShareUrl = useCallback((url = shareUrl) => {
    if (!url) return;

    void navigator.clipboard.writeText(url)
      .then(() => setDidCopyShareUrl(true))
      .catch(() => setShareError("Could not copy the link."));
  }, [shareUrl]);

  return {
    closeShareDialog,
    copyShareUrl,
    didCopyShareUrl,
    isShareDialogOpen,
    openShareDialog,
    resetShareDialogStatus,
    setShareError,
    setShareUrl,
    shareError,
    shareUrl,
  };
}
