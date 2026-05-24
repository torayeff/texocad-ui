"use client";

import { useCallback } from "react";

import { useShareDialogState } from "@/app/hooks/use-share-dialog-state";

export function usePublicShareDialog() {
  const {
    closeShareDialog,
    copyShareUrl,
    didCopyShareUrl,
    isShareDialogOpen,
    openShareDialog,
    setShareUrl,
    shareError,
    shareUrl,
  } = useShareDialogState();

  const handleOpenShareDialog = useCallback(() => {
    setShareUrl(window.location.href);
    openShareDialog();
  }, [openShareDialog, setShareUrl]);

  const handleCloseShareDialog = useCallback(() => {
    closeShareDialog();
  }, [closeShareDialog]);

  return {
    didCopyShareUrl,
    handleCloseShareDialog,
    handleCopyShareUrl: copyShareUrl,
    handleOpenShareDialog,
    isShareDialogOpen,
    shareError,
    shareUrl,
  };
}
