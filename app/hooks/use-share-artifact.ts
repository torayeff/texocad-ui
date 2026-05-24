"use client";

import { useCallback, useRef, useState } from "react";

interface ShareArtifact {
  blobName: string;
  checksum: string;
  contentType: string;
  filename: string;
}

interface ShareRevision {
  designId: string;
  exportArtifact: ShareArtifact;
  revisionNumber: number;
}

interface ShareResponse {
  sharedArtifact?: SharedArtifactResponse;
}

interface SharedArtifactResponse {
  shareUrl: string;
  slug: string;
}

interface ShareResult {
  revisionKey: string | null;
  url: string;
}

interface UseShareArtifactOptions<TSource> {
  activeRevisionKey: string | null;
  artifactKind: "model" | "sketch";
  defaultShareName: (source: TSource | null) => string;
  emptyNameError: string;
  shareError: string;
  shareRevision: ShareRevision | null;
  source: TSource | null;
}

function shareKindParams(kind: "model" | "sketch") {
  return kind === "sketch" ? { kind } : {};
}

function shareRevisionParams(kind: "model" | "sketch", revision: ShareRevision) {
  const params: Record<string, string> = {
    designId: revision.designId,
    revisionNumber: String(revision.revisionNumber),
    blobName: revision.exportArtifact.blobName,
    checksum: revision.exportArtifact.checksum,
    contentType: revision.exportArtifact.contentType,
    filename: revision.exportArtifact.filename,
  };

  if (kind === "sketch") {
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareName, setShareName] = useState("");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [currentShareError, setShareError] = useState<string | null>(null);
  const [didCopyShareUrl, setDidCopyShareUrl] = useState(false);
  const requestVersionRef = useRef(0);
  const shareUrl = shareResult?.revisionKey === activeRevisionKey ? shareResult.url : null;

  const handleOpenShareDialog = useCallback(() => {
    setShareError(null);
    setDidCopyShareUrl(false);
    if (!shareRevision) return;

    setIsShareDialogOpen(true);

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
          setShareResult({
            revisionKey: requestRevisionKey,
            url: data.sharedArtifact.shareUrl,
          });
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
  }, [activeRevisionKey, artifactKind, defaultShareName, shareError, shareRevision, source]);

  const handleCloseShareDialog = useCallback(() => {
    if (isSharing) return;
    setIsShareDialogOpen(false);
    setShareError(null);
  }, [isSharing]);

  const handleShareSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    if (!shareRevision || isSharing) return;

    const trimmedName = shareName.trim();
    if (!trimmedName) {
      setShareError(emptyNameError);
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setDidCopyShareUrl(false);
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const requestRevisionKey = activeRevisionKey;

    void fetch("/api/shares", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...shareKindParams(artifactKind),
        designId: shareRevision.designId,
        revisionNumber: shareRevision.revisionNumber,
        name: trimmedName,
        exportArtifact: shareRevision.exportArtifact,
      }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as Partial<ShareResponse> & { error?: string } | null;
        if (!response.ok || !data?.sharedArtifact?.shareUrl) {
          throw new Error(data?.error ?? shareError);
        }

        if (requestVersionRef.current !== requestVersion) return;
        setShareResult({
          revisionKey: requestRevisionKey,
          url: data.sharedArtifact.shareUrl,
        });
      })
      .catch((error: unknown) => {
        if (requestVersionRef.current !== requestVersion) return;
        setShareError(error instanceof Error ? error.message : shareError);
      })
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsSharing(false);
      });
  }, [activeRevisionKey, artifactKind, emptyNameError, isSharing, shareError, shareName, shareRevision]);

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
    handleShareSubmit,
    isShareDialogOpen,
    isSharing,
    setShareName,
    shareError: currentShareError,
    shareName,
    shareUrl,
  };
}
