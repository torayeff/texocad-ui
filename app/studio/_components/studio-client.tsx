"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PanelBottomOpen, PanelRightOpen } from "lucide-react";

import { Header } from "@/app/components/header";
import SketchViewer from "@/app/components/sketch-viewer/sketch-viewer";
import { cn } from "@/app/lib/cn";
import Chat from "@/app/studio/_features/chat/_components/chat";
import { useLanggraphAuth } from "@/app/studio/_features/chat/_hooks/use-langgraph-auth";
import { uploadFileToBlob } from "@/app/studio/_features/chat/_lib/blob-upload";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import { readThreadMode } from "@/app/studio/_features/chat/_lib/thread-mode";
import type { ChatHandle } from "@/app/studio/_features/chat/_types/chat";
import { useStudioRevisions } from "@/app/studio/_hooks/use-studio-revisions";
import { useStudioSplitLayout } from "@/app/studio/_hooks/use-studio-split-layout";
import type { SketchMaskComposerState, SketchMaskEditRequest } from "@/app/types/sketch-viewer";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

export default function StudioClient() {
  const [studioMode, setStudioMode] = useState<StudioAssistantId>(CAD_ASSISTANT_ID);
  const [isMaskSubmitting, setIsMaskSubmitting] = useState(false);
  const [maskComposer, setMaskComposer] = useState<SketchMaskComposerState | null>(null);
  const searchParams = useSearchParams();
  const [initialThreadId] = useState(() => searchParams.get("thread_id"));
  const [isInitialThreadModeResolved, setIsInitialThreadModeResolved] = useState(() => initialThreadId === null);
  const { client, isReady: isAuthReady } = useLanggraphAuth();
  const chatRef = useRef<ChatHandle | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const splitLayout = useStudioSplitLayout({ contentRef });
  const revisions = useStudioRevisions(studioMode, setStudioMode);
  const shouldMountChat = initialThreadId === null || isInitialThreadModeResolved;

  useEffect(() => {
    if (!initialThreadId) {
      return;
    }
    if (!isAuthReady) return;

    let cancelled = false;
    void readThreadMode(client, initialThreadId)
      .then((mode) => {
        if (cancelled) return;
        if (mode) setStudioMode(mode);
        setIsInitialThreadModeResolved(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsInitialThreadModeResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [client, initialThreadId, isAuthReady]);

  const handleClearViewer = useCallback(() => {
    revisions.clearViewerRevisions();
    setStudioMode(CAD_ASSISTANT_ID);
  }, [revisions]);

  const handleSketchMaskSubmit = useCallback(async ({ prompt, mask }: SketchMaskEditRequest) => {
    if (!revisions.activeSketchExport) {
      throw new Error("No active sketch image is available to edit.");
    }

    setIsMaskSubmitting(true);
    try {
      const uploadedMask = await uploadFileToBlob(mask);
      flushSync(() => {
        setStudioMode(SKETCH_ASSISTANT_ID);
      });
      const submitted = chatRef.current?.submitMessage([
        "Edit the active sketch using this mask.",
        `Input image: ${revisions.activeSketchExport.blobName}`,
        `Mask: ${uploadedMask.url}`,
        `Instructions: ${prompt}`,
      ].join("\n"));

      if (!submitted) {
        throw new Error("Chat is not ready to submit the masked edit.");
      }
    } finally {
      setIsMaskSubmitting(false);
    }
  }, [revisions.activeSketchExport]);

  const handleMaskEditorChange = useCallback((state: SketchMaskComposerState | null) => {
    setMaskComposer(state);
    if (state) {
      requestAnimationFrame(() => {
        chatRef.current?.focusInput();
      });
    }
  }, []);

  const viewerPaneStyle = {
    "--viewer-width": `${splitLayout.splitPct}%`,
  } as CSSProperties;

  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <Header />

      <div ref={contentRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={cn(
            "min-h-0 md:min-w-0 md:border-b-0",
            splitLayout.isChatCollapsed ? "flex-1" : "flex-[2] md:flex-none md:basis-[var(--viewer-width)]",
          )}
          style={viewerPaneStyle}
        >
          {revisions.shouldShowSketchViewer ? (
            <SketchViewer
              isMaskSubmitting={isMaskSubmitting}
              onMaskEditorChange={handleMaskEditorChange}
              onSubmitMaskEdit={revisions.activeSketchExport ? handleSketchMaskSubmit : undefined}
              source={revisions.sketchSource}
              revisions={{
                activeRevisionKey: revisions.activeSketchRevisionKey,
                isLatestRevisionSelected: revisions.isLatestSketchRevisionSelected,
                onSelectLatestRevision: revisions.handleSelectLatestSketchRevision,
                onSelectRevision: revisions.handleSelectSketchRevision,
                revisions: revisions.sketchRevisionOptions,
              }}
              sharing={{
                activeRevisionKey: revisions.activeSketchRevisionKey,
                shareRevision: revisions.shareSketchRevision,
              }}
            />
          ) : (
            <ModelViewer
              source={revisions.viewerSource}
              downloads={{
                sourceCode: revisions.sourceCode,
              }}
              revisions={{
                activeRevisionKey: revisions.activeRevisionKey,
                isLatestRevisionSelected: revisions.isLatestRevisionSelected,
                onSelectLatestRevision: revisions.handleSelectLatestRevision,
                onSelectRevision: revisions.handleSelectRevision,
                revisions: revisions.revisionOptions,
              }}
              sharing={{
                activeRevisionKey: revisions.activeRevisionKey,
                shareRevision: revisions.shareRevision,
              }}
            />
          )}
        </div>

        <div className={cn("relative hidden w-0 md:block", splitLayout.isChatCollapsed && "md:hidden")} role="presentation">
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            onMouseDown={() => splitLayout.setIsResizing(true)}
            className={`absolute inset-y-0 -left-1 z-10 w-2 !cursor-col-resize bg-transparent transition-colors ${splitLayout.isResizing ? "bg-accent/20" : "hover:bg-muted/80"
              }`}
          />
        </div>

        {splitLayout.isChatCollapsed ? (
          <div className="flex h-11 shrink-0 items-center justify-end border-t border-border bg-background px-[var(--app-chrome-gutter)] md:h-full md:w-10 md:items-start md:justify-center md:border-l md:border-t-0 md:px-0 md:pt-[0.4375rem]">
            <button
              type="button"
              onClick={splitLayout.toggleChatCollapsed}
              aria-label="Show chat panel"
              aria-expanded={false}
              className="grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelBottomOpen size={14} strokeWidth={1.75} className="md:hidden" />
              <PanelRightOpen size={14} strokeWidth={1.75} className="hidden md:block" />
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            "min-h-0 flex-[3] md:min-w-[320px] md:flex-1 md:border-l md:border-border",
            splitLayout.isChatCollapsed && "hidden",
          )}
        >
          {shouldMountChat ? (
            <Chat
              ref={chatRef}
              assistantId={studioMode}
              initialThreadId={initialThreadId}
              maskComposer={maskComposer}
              onDesignRevisionEvent={revisions.handleDesignRevision}
              onDesignRevisionsChange={revisions.handleDesignRevisionsChange}
              onModeChange={setStudioMode}
              onSketchRevisionEvent={revisions.handleSketchRevision}
              onSketchRevisionsChange={revisions.handleSketchRevisionsChange}
              onClearViewer={handleClearViewer}
              onToggleCollapse={splitLayout.toggleChatCollapsed}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-background px-4 text-sm text-muted-foreground">
              Loading conversation...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
