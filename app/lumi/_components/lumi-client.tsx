"use client";

import type { CSSProperties } from "react";
import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PanelBottomOpen, PanelRightOpen } from "lucide-react";

import { Header } from "@/app/components/header";
import Chat from "@/app/components/chat/chat";
import { useSplitLayout } from "@/app/hooks/use-split-layout";
import { uploadFileToBlob } from "@/app/lib/chat/blob-upload";
import { THREAD_QUERY_PARAM } from "@/app/lib/chat/chat-url";
import { LUMI_ASSISTANT_ID } from "@/app/lib/chat/langgraph-config";
import { cn } from "@/app/lib/cn";
import LumiViewer from "@/app/lumi/_components/lumi-viewer";
import { useLumiRevisions } from "@/app/lumi/_hooks/use-lumi-revisions";
import type { ChatHandle } from "@/app/types/chat";
import type { SketchMaskComposerState, SketchMaskEditRequest } from "@/app/types/sketch-viewer";

const LUMI_THREAD_SEARCH_METADATA = { agent_mode: LUMI_ASSISTANT_ID };

function noop() { }

export default function LumiClient() {
  const searchParams = useSearchParams();
  const [initialThreadId] = useState(() => searchParams.get(THREAD_QUERY_PARAM));
  const [isMaskSubmitting, setIsMaskSubmitting] = useState(false);
  const [maskComposer, setMaskComposer] = useState<SketchMaskComposerState | null>(null);
  const chatRef = useRef<ChatHandle | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const splitLayout = useSplitLayout({ contentRef });
  const revisions = useLumiRevisions();

  const handleClearViewer = useCallback(() => {
    revisions.clearViewerRevisions();
  }, [revisions]);

  const handleSketchMaskSubmit = useCallback(async ({ prompt, mask }: SketchMaskEditRequest) => {
    if (!revisions.activeSketchExport) {
      throw new Error("No active sketch image is available to edit.");
    }

    setIsMaskSubmitting(true);
    try {
      const uploadedMask = await uploadFileToBlob(mask);
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
          <LumiViewer
            hasModel={revisions.hasModel}
            hasSketch={revisions.hasSketch}
            isMaskSubmitting={isMaskSubmitting}
            modelSource={revisions.modelSource}
            modelRevisions={{
              activeRevisionKey: revisions.activeModelRevisionKey,
              isLatestRevisionSelected: revisions.isLatestModelRevisionSelected,
              onSelectLatestRevision: revisions.handleSelectLatestModelRevision,
              onSelectRevision: revisions.handleSelectModelRevision,
              revisions: revisions.modelRevisionOptions,
            }}
            onMaskEditorChange={handleMaskEditorChange}
            onSubmitMaskEdit={revisions.activeSketchExport ? handleSketchMaskSubmit : undefined}
            onViewerModeChange={revisions.setViewerMode}
            sketchSource={revisions.sketchSource}
            sketchRevisions={{
              activeRevisionKey: revisions.activeSketchRevisionKey,
              isLatestRevisionSelected: revisions.isLatestSketchRevisionSelected,
              onSelectLatestRevision: revisions.handleSelectLatestSketchRevision,
              onSelectRevision: revisions.handleSelectSketchRevision,
              revisions: revisions.sketchRevisionOptions,
            }}
            viewerMode={revisions.viewerMode}
          />
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
          <Chat
            ref={chatRef}
            agentAvatarUrl="/images/lumi/lumi.png"
            allowAnonymous
            assistantId={LUMI_ASSISTANT_ID}
            hasInitialAgentMode
            headerTitle="Lumi"
            initialThreadId={initialThreadId}
            maskComposer={maskComposer}
            onDesignRevisionEvent={noop}
            onDesignRevisionsChange={noop}
            onModeChange={noop}
            onModeReset={noop}
            onModelRevisionEvent={revisions.handleModelRevision}
            onModelRevisionsChange={revisions.handleModelRevisionsChange}
            onSketchRevisionEvent={revisions.handleSketchRevision}
            onSketchRevisionsChange={revisions.handleSketchRevisionsChange}
            onClearViewer={handleClearViewer}
            onToggleCollapse={splitLayout.toggleChatCollapsed}
            showAgentPicker={false}
            threadSearchMetadata={LUMI_THREAD_SEARCH_METADATA}
          />
        </div>
      </div>
    </main>
  );
}
