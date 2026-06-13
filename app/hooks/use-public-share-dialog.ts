"use client";

import { useCallback } from "react";

import { useShareDialogState } from "@/app/hooks/use-share-dialog-state";
import { trackEvent } from "@/app/lib/analytics/client";

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
    trackEvent("share_dialog_opened", {
      artifact_kind: "public",
      has_existing_share: true,
    });
  }, [openShareDialog, setShareUrl]);

  const handleCopyShareUrl = useCallback((url?: string | null) => {
    trackEvent("share_link_copied", {
      artifact_kind: "public",
    });
    copyShareUrl(url);
  }, [copyShareUrl]);

  const handleCloseShareDialog = useCallback(() => {
    closeShareDialog();
  }, [closeShareDialog]);

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
