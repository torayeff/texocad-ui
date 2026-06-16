"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, History, Loader2, Share2 } from "lucide-react";

import { RevisionMenu } from "@/app/components/model-viewer/_components/revision-menu";
import { ShareDialog } from "@/app/components/share-dialog";
import { useFloatingPanel } from "@/app/components/viewer/_hooks/use-floating-panel";
import { ViewerEmptyAnimation } from "@/app/components/viewer/viewer-empty-animation";
import { ViewerToolButton } from "@/app/components/viewer/viewer-tool-button";
import {
  activeControlClass,
  loadingIconClass,
  toolButtonClass,
  toolRailClass,
} from "@/app/components/viewer/viewer-styles";
import { useShareArtifact } from "@/app/hooks/use-share-artifact";
import { usePublicShareDialog } from "@/app/hooks/use-public-share-dialog";
import { trackEvent } from "@/app/lib/analytics/client";
import { cn } from "@/app/lib/cn";
import type { MarkdownRevisionOption, MarkdownSource } from "@/app/types/markdown-viewer";
import type { ShareRevision } from "@/app/types/share-artifact";

const REMARK_PLUGINS = [remarkGfm];

interface MarkdownViewerRevisions {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  revisions: MarkdownRevisionOption[];
}

interface MarkdownViewerSharing {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
}

interface MarkdownViewerProps {
  revisions?: MarkdownViewerRevisions;
  sharing?: MarkdownViewerSharing;
  source: MarkdownSource | null;
  variant?: "studio" | "shared";
}

function defaultShareName(source: MarkdownSource | null) {
  if (!source?.label) return "";
  return source.label.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim();
}

function filenameFromMarkdownUrl(src: string) {
  const withoutHash = src.split("#", 1)[0] ?? src;
  const withoutQuery = withoutHash.split("?", 1)[0] ?? withoutHash;
  return decodeURIComponent(withoutQuery.split("/").pop() ?? withoutQuery);
}

function rewrittenImageSrc(src: string | undefined, source: MarkdownSource | null) {
  if (!src || !source?.imageUrlsByFilename) return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return source.imageUrlsByFilename[filenameFromMarkdownUrl(src)] ?? src;
}

export default function MarkdownViewer({
  revisions,
  sharing,
  source,
  variant = "studio",
}: MarkdownViewerProps) {
  const [loadedMarkdown, setLoadedMarkdown] = useState<{
    markdown: string;
    state: "ready" | "error";
    url: string;
  } | null>(null);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const isSharedView = variant === "shared";
  const revisionOptions = revisions?.revisions ?? [];
  const canShowRevisions = revisionOptions.length > 0 && revisions !== undefined;
  const activeRevision = revisionOptions.find((revision) => revision.key === revisions?.activeRevisionKey) ?? null;
  const canShare = source !== null && (isSharedView || sharing?.shareRevision != null);
  const {
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
  } = useShareArtifact({
    activeRevisionKey: sharing?.activeRevisionKey ?? null,
    artifactKind: "markdown",
    defaultShareName,
    emptyNameError: "Enter a document name.",
    shareError: "Could not share this document.",
    shareRevision: sharing?.shareRevision ?? null,
    source,
  });
  const publicShareDialog = usePublicShareDialog();
  const activeMarkdown = loadedMarkdown?.url === source?.url ? loadedMarkdown : null;
  const loadState = source ? activeMarkdown?.state ?? "loading" : "idle";
  const markdown = activeMarkdown?.state === "ready" ? activeMarkdown.markdown : "";
  const {
    activeTriggerRef,
    panelRef,
    panelStyle,
    railRef,
    resetPanelPosition,
  } = useFloatingPanel(source !== null && revisionsOpen && canShowRevisions, [
    canShowRevisions,
    revisionOptions.length,
    revisionsOpen,
    revisions?.activeRevisionKey,
  ]);

  useEffect(() => {
    if (!source) {
      return;
    }

    let cancelled = false;
    const sourceUrl = source.url;
    void fetch(source.url)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load markdown.");
        return response.text();
      })
      .then((content) => {
        if (cancelled) return;
        setLoadedMarkdown({ markdown: content, state: "ready", url: sourceUrl });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedMarkdown({ markdown: "", state: "error", url: sourceUrl });
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  const handleDownload = useCallback(() => {
    if (!source) return;
    trackEvent("artifact_download_started", {
      artifact_kind: "markdown",
      download_kind: "artifact",
      source_kind: "url",
    });
    const anchor = document.createElement("a");
    anchor.href = source.url;
    anchor.download = source.label;
    anchor.rel = "noreferrer";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    trackEvent("artifact_download_succeeded", {
      artifact_kind: "markdown",
      download_kind: "artifact",
      source_kind: "url",
    });
  }, [source]);

  const handleToggleRevisions = useCallback((trigger: HTMLButtonElement) => {
    const nextOpen = !revisionsOpen;
    activeTriggerRef.current = nextOpen ? trigger : null;
    resetPanelPosition();
    setRevisionsOpen(nextOpen);
  }, [activeTriggerRef, resetPanelPosition, revisionsOpen]);

  const markdownComponents = useMemo(() => ({
    img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => {
      const imageSrc = typeof src === "string" ? rewrittenImageSrc(src, source) : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element -- markdown images may be signed blob URLs
        <img
          src={imageSrc}
          alt={alt ?? ""}
          className="max-h-[32rem] rounded-xl border border-border object-contain"
        />
      );
    },
    a: ({ href, children }: ComponentPropsWithoutRef<"a">) => (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  }), [source]);

  return (
    <section className="relative size-full overflow-hidden bg-background text-foreground" aria-label="Markdown viewer">
      {!source && loadState === "idle" ? (
        <ViewerEmptyAnimation />
      ) : null}

      {source ? (
        <div className="absolute inset-0 overflow-y-auto px-5 py-20 sm:px-8 lg:px-12">
          <article className="prose-chat mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card px-5 py-6 shadow-[0_18px_60px_rgb(0_0_0_/_0.08)] sm:px-8 sm:py-8">
            {loadState === "loading" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} strokeWidth={1.75} className={loadingIconClass} />
                <span>Loading markdown...</span>
              </div>
            ) : null}
            {loadState === "error" ? (
              <p className="text-sm text-error">Could not load this markdown document.</p>
            ) : null}
            {loadState === "ready" ? (
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            ) : null}
          </article>
        </div>
      ) : null}

      {source ? (
        <div ref={railRef} className={toolRailClass} aria-label="Markdown controls">
          {canShare ? (
            <ViewerToolButton
              type="button"
              onClick={isSharedView ? publicShareDialog.handleOpenShareDialog : handleOpenShareDialog}
              disabled={!isSharedView && isSharing}
              tooltip="Share document"
              aria-label="Share document"
              className={toolButtonClass}
            >
              {!isSharedView && isSharing ? (
                <Loader2 size={14} strokeWidth={1.75} className={loadingIconClass} />
              ) : (
                <Share2 size={14} strokeWidth={1.75} />
              )}
            </ViewerToolButton>
          ) : null}
          <ViewerToolButton
            type="button"
            onClick={handleDownload}
            tooltip="Download markdown"
            aria-label="Download markdown"
            className={toolButtonClass}
          >
            <Download size={14} strokeWidth={1.75} />
          </ViewerToolButton>
          {canShowRevisions ? (
            <ViewerToolButton
              type="button"
              onClick={(event) => handleToggleRevisions(event.currentTarget)}
              tooltip="Revisions"
              tooltipDisabled={revisionsOpen}
              aria-label={activeRevision ? `Revisions, viewing revision ${activeRevision.revisionNumber}` : "Revisions"}
              aria-expanded={revisionsOpen}
              aria-haspopup="menu"
              aria-controls="markdown-revision-menu"
              className={cn(toolButtonClass, (revisionsOpen || !revisions.isLatestRevisionSelected) && activeControlClass)}
            >
              <History size={14} strokeWidth={1.75} />
            </ViewerToolButton>
          ) : null}

          {revisionsOpen && revisions ? (
            <RevisionMenu
              ref={panelRef}
              activeRevisionKey={revisions.activeRevisionKey}
              id="markdown-revision-menu"
              isLatestRevisionSelected={revisions.isLatestRevisionSelected}
              onClose={() => setRevisionsOpen(false)}
              onSelectLatestRevision={revisions.onSelectLatestRevision}
              onSelectRevision={revisions.onSelectRevision}
              revisions={revisionOptions}
              unavailableLabel="Markdown unavailable"
              style={{ ...panelStyle, position: "absolute", zIndex: 30 }}
            />
          ) : null}
        </div>
      ) : null}

      {isShareDialogOpen ? (
        <ShareDialog
          mode="create"
          copy={{
            createDescription: "Create a public link for this markdown document.",
            nameLabel: "Document name",
            placeholder: "Requirements brief",
            title: "Share document",
            urlDescription: "Anyone with this link can view the shared document.",
          }}
          didCopyShareUrl={didCopyShareUrl}
          isSharing={isSharing}
          onClose={handleCloseShareDialog}
          onCopyShareUrl={handleCopyShareUrl}
          onShareNameChange={setShareName}
          onSubmit={handleShareSubmit}
          shareError={shareError}
          shareName={shareName}
          shareUrl={shareUrl}
          titleId="share-markdown-dialog-title"
        />
      ) : null}

      {publicShareDialog.isShareDialogOpen ? (
        <ShareDialog
          mode="copy"
          copy={{
            createDescription: "",
            nameLabel: "",
            placeholder: "",
            title: "Share document",
            urlDescription: "Copy the public link for this shared document.",
          }}
          didCopyShareUrl={publicShareDialog.didCopyShareUrl}
          isSharing={false}
          onClose={publicShareDialog.handleCloseShareDialog}
          onCopyShareUrl={publicShareDialog.handleCopyShareUrl}
          shareError={publicShareDialog.shareError}
          shareUrl={publicShareDialog.shareUrl}
          titleId="copy-markdown-dialog-title"
        />
      ) : null}
    </section>
  );
}
