"use client";

import { useCallback, useRef, useState } from "react";

import { useShareDialogState } from "@/app/hooks/use-share-dialog-state";
import { trackEvent } from "@/app/lib/analytics/client";
import { errorKind } from "@/app/lib/analytics/events";
import type { ShareResponse, ShareRevision } from "@/app/types/share-artifact";

interface ShareResult {
  revisionKey: string | null;
  url: string;
}

interface UseShareArtifactOptions<TSource> {
  activeRevisionKey: string | null;
  artifactKind: "model" | "sketch" | "markdown";
  defaultShareName: (source: TSource | null) => string;
  emptyNameError: string;
  shareError: string;
  shareRevision: ShareRevision | null;
  source: TSource | null;
}

function shareKindParams(kind: "model" | "sketch" | "markdown") {
  return kind === "model" ? {} : { kind };
}

function shareRevisionParams(kind: "model" | "sketch" | "markdown", revision: ShareRevision) {
  const params: Record<string, string> = {
    designId: revision.designId,
    revisionNumber: String(revision.revisionNumber),
    blobName: revision.exportArtifact.blobName,
    checksum: revision.exportArtifact.checksum,
    contentType: revision.exportArtifact.contentType,
    filename: revision.exportArtifact.filename,
  };

  if (kind !== "model") {
    params.kind = kind;
  }

  return params;
}

export function useShareArtifact<TSource>({
  activeRevisionKey,
  artifactKind,
  defaultShareName,
  emptyNameError,
  shareError,
  shareRevision,
  source,
}: UseShareArtifactOptions<TSource>) {
  const {
    closeShareDialog,
    copyShareUrl,
    didCopyShareUrl,
    isShareDialogOpen,
    openShareDialog,
    resetShareDialogStatus,
    setShareError,
    setShareUrl,
    shareError: currentShareError,
  } = useShareDialogState();
  const [isSharing, setIsSharing] = useState(false);
  const [shareName, setShareName] = useState("");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const requestVersionRef = useRef(0);
  const shareUrl = shareResult?.revisionKey === activeRevisionKey ? shareResult.url : null;

  const handleOpenShareDialog = useCallback(() => {
    if (!shareRevision) return;

    setShareUrl(null);
    openShareDialog();
    trackEvent("share_dialog_opened", {
      artifact_kind: artifactKind,
      has_existing_share: shareUrl !== null,
    });

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const requestRevisionKey = activeRevisionKey;
    const requestDefaultName = defaultShareName(source);
    const params = new URLSearchParams(shareRevisionParams(artifactKind, shareRevision));

    void fetch(`/api/shares?${params.toString()}`)
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as ShareResponse & { error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? shareError);
        }

        if (data?.sharedArtifact?.shareUrl) {
          if (requestVersionRef.current !== requestVersion) return;
          trackEvent("share_existing_found", {
            artifact_kind: artifactKind,
          });
          setShareResult({
            revisionKey: requestRevisionKey,
            url: data.sharedArtifact.shareUrl,
          });
          setShareUrl(data.sharedArtifact.shareUrl);
          return;
        }

        if (requestVersionRef.current === requestVersion) {
          setShareName((currentName) => currentName || requestDefaultName);
        }
      })
      .catch(() => {
        if (requestVersionRef.current === requestVersion) {
          setShareName((currentName) => currentName || requestDefaultName);
        }
      });
  }, [activeRevisionKey, artifactKind, defaultShareName, openShareDialog, setShareUrl, shareError, shareRevision, shareUrl, source]);

  const handleCloseShareDialog = useCallback(() => {
    if (isSharing) return;
    closeShareDialog();
  }, [closeShareDialog, isSharing]);

  const handleShareSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    if (!shareRevision || isSharing) return;

    const trimmedName = shareName.trim();
    if (!trimmedName) {
      setShareError(emptyNameError);
      return;
    }

    setIsSharing(true);
    resetShareDialogStatus();
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const requestRevisionKey = activeRevisionKey;

    void fetch("/api/shares", {
        method: "POST",
        body: JSON.stringify({
          ...shareKindParams(artifactKind),
          designId: shareRevision.designId,
          revisionNumber: shareRevision.revisionNumber,
          name: trimmedName,
          exportArtifact: shareRevision.exportArtifact,
          relatedArtifacts: shareRevision.relatedArtifacts,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as Partial<ShareResponse> & { error?: string } | null;
        if (!response.ok || !data?.sharedArtifact?.shareUrl) {
          throw new Error(data?.error ?? shareError);
        }

        if (requestVersionRef.current !== requestVersion) return;
        trackEvent("share_created", {
          already_shared: data.alreadyShared,
          artifact_kind: artifactKind,
        });
        setShareResult({
          revisionKey: requestRevisionKey,
          url: data.sharedArtifact.shareUrl,
        });
        setShareUrl(data.sharedArtifact.shareUrl);
      })
      .catch((error: unknown) => {
        if (requestVersionRef.current !== requestVersion) return;
        trackEvent("share_failed", {
          artifact_kind: artifactKind,
          error_kind: errorKind(error),
        });
        setShareError(error instanceof Error ? error.message : shareError);
      })
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsSharing(false);
      });
  }, [activeRevisionKey, artifactKind, emptyNameError, isSharing, resetShareDialogStatus, setShareError, setShareUrl, shareError, shareName, shareRevision]);

  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return;
    trackEvent("share_link_copied", {
      artifact_kind: artifactKind,
    });
    copyShareUrl(shareUrl);
  }, [artifactKind, copyShareUrl, shareUrl]);

  return {
    didCopyShareUrl,
    handleCloseShareDialog,
    handleCopyShareUrl,
    handleOpenShareDialog,
    handleShareSubmit,
    isShareDialogOpen,
    isSharing,
    setShareName,
    shareError: currentShareError,
    shareName,
    shareUrl,
  };
}
