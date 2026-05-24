"use client";

import { useCallback, useState } from "react";

export function usePublicShareDialog() {
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleOpenShareDialog = useCallback(() => {
    setDidCopyShareUrl(false);
    setShareError(null);
    setShareUrl(window.location.href);
    setIsShareDialogOpen(true);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
    setShareError(null);
  }, []);

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return;

    void navigator.clipboard.writeText(shareUrl)
      .then(() => setDidCopyShareUrl(true))
      .catch(() => setShareError("Could not copy the link."));
  }, [shareUrl]);

  return {
    didCopyShareUrl,
    handleCloseShareDialog,
    handleCopyShareUrl,
    handleOpenShareDialog,
    isShareDialogOpen,
    shareError,
    shareUrl,
  };
}
