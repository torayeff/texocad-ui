"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import { PanelBottomOpen, PanelRightOpen } from "lucide-react";

import { Header } from "@/app/components/header";
import { cn } from "@/app/lib/cn";
import type { ShareSketchRevision, SketchMaskComposerState, SketchMaskEditRequest } from "@/app/types/sketch-viewer";
import type { ShareRevision } from "@/app/types/model-viewer";
import SketchViewer from "@/app/components/sketch-viewer/sketch-viewer";
import Chat from "@/app/studio/_features/chat/_components/chat";
import { uploadFileToBlob } from "@/app/studio/_features/chat/_lib/blob-upload";
import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  latestDesignRevision,
  latestSketchRevision as getLatestSketchRevision,
} from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import type { DesignRevisionArtifact, SketchRevisionArtifact } from "@/app/studio/_features/design-revisions/_types/design-artifact";
import type { ChatHandle } from "@/app/studio/_features/chat/_types/chat";
import {
  isStepExport,
  isSketchImageExport,
  mergeDesignRevisions,
  mergeSketchRevisions,
  revisionKey,
  revisionListsMatch,
  revisionOptionsFromArtifacts,
  revisionsMatch,
  signedSketchRevisionSources as getSignedSketchRevisionSources,
  signedRevisionSources as getSignedRevisionSources,
  sketchRevisionKey,
  sketchRevisionListsMatch,
  sketchRevisionOptionsFromArtifacts,
  sketchRevisionsMatch,
  type SignedSketchRevisionSources,
  type SignedRevisionSources,
} from "@/app/studio/_features/design-revisions/_lib/revision-sources";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

export default function StudioClient() {
  const [signedRevisionSources, setSignedRevisionSources] = useState<SignedRevisionSources | null>(null);
  const [signedSketchRevisionSources, setSignedSketchRevisionSources] = useState<SignedSketchRevisionSources[]>([]);
  const [hydratedDesignRevisions, setHydratedDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [liveDesignRevisions, setLiveDesignRevisions] = useState<DesignRevisionArtifact[]>([]);
  const [hydratedSketchRevisions, setHydratedSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [liveSketchRevisions, setLiveSketchRevisions] = useState<SketchRevisionArtifact[]>([]);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string | null>(null);
  const [selectedSketchRevisionKey, setSelectedSketchRevisionKey] = useState<string | null>(null);
  const [studioMode, setStudioMode] = useState<StudioAssistantId>(CAD_ASSISTANT_ID);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isMaskSubmitting, setIsMaskSubmitting] = useState(false);
  const [maskComposer, setMaskComposer] = useState<SketchMaskComposerState | null>(null);
  const chatRef = useRef<ChatHandle | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const designRequestVersionRef = useRef(0);
  const sketchRequestVersionRef = useRef(0);

  const handleDesignRevision = useCallback((revision: DesignRevisionArtifact) => {
    setLiveDesignRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => revisionKey(currentRevision) === revisionKey(revision));
      if (existingRevision && revisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => revisionKey(currentRevision) !== revisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
    setStudioMode(CAD_ASSISTANT_ID);
  }, []);

  const handleSketchRevision = useCallback((revision: SketchRevisionArtifact) => {
    setLiveSketchRevisions((currentRevisions) => {
      const existingRevision = currentRevisions.find((currentRevision) => sketchRevisionKey(currentRevision) === sketchRevisionKey(revision));
      if (existingRevision && sketchRevisionsMatch(existingRevision, revision)) return currentRevisions;

      const nextRevisions = currentRevisions.filter((currentRevision) => sketchRevisionKey(currentRevision) !== sketchRevisionKey(revision));
      nextRevisions.push(revision);
      return nextRevisions;
    });
    setStudioMode(SKETCH_ASSISTANT_ID);
  }, []);

  const handleDesignRevisionsChange = useCallback((revisions: DesignRevisionArtifact[]) => {
    setHydratedDesignRevisions((currentRevisions) => (
      revisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const handleSketchRevisionsChange = useCallback((revisions: SketchRevisionArtifact[]) => {
    setHydratedSketchRevisions((currentRevisions) => (
      sketchRevisionListsMatch(currentRevisions, revisions) ? currentRevisions : revisions
    ));
  }, []);

  const handleClearViewer = useCallback(() => {
    designRequestVersionRef.current += 1;
    sketchRequestVersionRef.current += 1;
    setSignedRevisionSources(null);
    setSignedSketchRevisionSources([]);
    setHydratedDesignRevisions([]);
    setLiveDesignRevisions([]);
    setHydratedSketchRevisions([]);
    setLiveSketchRevisions([]);
    setSelectedRevisionKey(null);
    setSelectedSketchRevisionKey(null);
    setStudioMode(CAD_ASSISTANT_ID);
  }, []);

  const designRevisions = useMemo(
    () => mergeDesignRevisions(hydratedDesignRevisions, liveDesignRevisions),
    [hydratedDesignRevisions, liveDesignRevisions],
  );
  const latestRevision = useMemo(() => latestDesignRevision(designRevisions), [designRevisions]);
  const sketchRevisions = useMemo(
    () => mergeSketchRevisions(hydratedSketchRevisions, liveSketchRevisions),
    [hydratedSketchRevisions, liveSketchRevisions],
  );
  const latestSketchRevision = useMemo(() => getLatestSketchRevision(sketchRevisions), [sketchRevisions]);
  const selectedRevision = useMemo(() => selectedRevisionKey
    ? designRevisions.find((revision) => revisionKey(revision) === selectedRevisionKey) ?? null
    : null, [designRevisions, selectedRevisionKey]);
  const selectedSketchRevision = useMemo(() => selectedSketchRevisionKey
    ? sketchRevisions.find((revision) => sketchRevisionKey(revision) === selectedSketchRevisionKey) ?? null
    : null, [sketchRevisions, selectedSketchRevisionKey]);
  const activeRevision = selectedRevision ?? latestRevision;
  const activeSketchRevision = selectedSketchRevision ?? latestSketchRevision;
  const activeRevisionKey = activeRevision ? revisionKey(activeRevision) : null;
  const activeSketchRevisionKey = activeSketchRevision ? sketchRevisionKey(activeSketchRevision) : null;
  const isLatestRevisionSelected = selectedRevisionKey === null || selectedRevision === null;
  const isLatestSketchRevisionSelected = selectedSketchRevisionKey === null || selectedSketchRevision === null;
  const revisionOptions = useMemo(() => revisionOptionsFromArtifacts(designRevisions), [designRevisions]);
  const signedSketchSourcesByKey = useMemo(() => {
    const sourcesByKey = new Map<string, SignedSketchRevisionSources>();
    for (const sources of signedSketchRevisionSources) {
      sourcesByKey.set(sources.key, sources);
    }
    return sourcesByKey;
  }, [signedSketchRevisionSources]);
  const sketchRevisionOptions = useMemo(() => (
    sketchRevisionOptionsFromArtifacts(sketchRevisions).map((revision) => ({
      ...revision,
      thumbnailUrl: signedSketchSourcesByKey.get(revision.key)?.imageSource?.url ?? null,
    }))
  ), [signedSketchSourcesByKey, sketchRevisions]);
  const viewerSource = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.viewerSource : null;
  const sourceCode = signedRevisionSources?.key === activeRevisionKey ? signedRevisionSources.sourceCode : null;
  const sketchSource = activeSketchRevisionKey
    ? signedSketchSourcesByKey.get(activeSketchRevisionKey)?.imageSource ?? null
    : null;
  const activeStepExport = activeRevision?.exports.find(isStepExport) ?? null;
  const activeSketchExport = activeSketchRevision?.exports.find(isSketchImageExport) ?? null;
  const shouldShowSketchViewer = studioMode === SKETCH_ASSISTANT_ID || sketchSource !== null || (activeSketchRevision !== null && !activeRevision);

  const handleSelectLatestRevision = useCallback(() => {
    setSelectedRevisionKey(null);
  }, []);

  const handleSelectRevision = useCallback((key: string) => {
    setSelectedRevisionKey(key);
  }, []);

  const handleSelectLatestSketchRevision = useCallback(() => {
    setSelectedSketchRevisionKey(null);
  }, []);

  const handleSelectSketchRevision = useCallback((key: string) => {
    setSelectedSketchRevisionKey(key);
  }, []);

  const handleSketchMaskSubmit = useCallback(async ({ prompt, mask }: SketchMaskEditRequest) => {
    if (!activeSketchExport) {
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
        `Input image: ${activeSketchExport.blobName}`,
        `Mask: ${uploadedMask.url}`,
        `Instructions: ${prompt}`,
      ].join("\n"));

      if (!submitted) {
        throw new Error("Chat is not ready to submit the masked edit.");
      }
    } finally {
      setIsMaskSubmitting(false);
    }
  }, [activeSketchExport]);

  const handleMaskEditorChange = useCallback((state: SketchMaskComposerState | null) => {
    setMaskComposer(state);
    if (state) {
      requestAnimationFrame(() => {
        chatRef.current?.focusInput();
      });
    }
  }, []);

  const toggleChatCollapsed = useCallback(() => {
    setIsChatCollapsed((collapsed) => !collapsed);
  }, []);

  useEffect(() => {
    designRequestVersionRef.current += 1;
    const snapshotVersion = designRequestVersionRef.current;

    if (!activeRevision || !activeRevisionKey) return;

    void getSignedRevisionSources(activeRevision, activeRevisionKey).then((sources) => {
      if (snapshotVersion !== designRequestVersionRef.current) return;
      setSignedRevisionSources(sources);
    });
  }, [activeRevision, activeRevisionKey]);

  useEffect(() => {
    sketchRequestVersionRef.current += 1;
    const snapshotVersion = sketchRequestVersionRef.current;

    const revisionsToSign = sketchRevisions.map((revision) => ({
      key: sketchRevisionKey(revision),
      revision,
    }));

    if (revisionsToSign.length === 0) return;

    void Promise.all(
      revisionsToSign.map(({ key, revision }) => getSignedSketchRevisionSources(revision, key)),
    ).then((sources) => {
      if (snapshotVersion !== sketchRequestVersionRef.current) return;
      setSignedSketchRevisionSources(sources.filter((source): source is SignedSketchRevisionSources => source !== null));
    });
  }, [sketchRevisions]);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (event: MouseEvent) => {
      const container = contentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(35, pct)));
    };

    const onUp = () => setIsResizing(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const viewerPaneStyle = {
    "--viewer-width": `${splitPct}%`,
  } as CSSProperties;
  const shareRevision: ShareRevision | null = activeRevision && activeStepExport ? {
    designId: activeRevision.designId,
    revisionNumber: activeRevision.revisionNumber,
    exportArtifact: activeStepExport,
  } : null;
  const shareSketchRevision: ShareSketchRevision | null = activeSketchRevision && activeSketchExport ? {
    designId: activeSketchRevision.designId,
    revisionNumber: activeSketchRevision.revisionNumber,
    exportArtifact: activeSketchExport,
  } : null;

  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <Header />

      <div ref={contentRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={cn(
            "min-h-0 md:min-w-0 md:border-b-0",
            isChatCollapsed ? "flex-1" : "flex-[2] md:flex-none md:basis-[var(--viewer-width)]",
          )}
          style={viewerPaneStyle}
        >
          {shouldShowSketchViewer ? (
            <SketchViewer
              isMaskSubmitting={isMaskSubmitting}
              onMaskEditorChange={handleMaskEditorChange}
              onSubmitMaskEdit={activeSketchExport ? handleSketchMaskSubmit : undefined}
              source={sketchSource}
              revisions={{
                activeRevisionKey: activeSketchRevisionKey,
                isLatestRevisionSelected: isLatestSketchRevisionSelected,
                onSelectLatestRevision: handleSelectLatestSketchRevision,
                onSelectRevision: handleSelectSketchRevision,
                revisions: sketchRevisionOptions,
              }}
              sharing={{
                activeRevisionKey: activeSketchRevisionKey,
                shareRevision: shareSketchRevision,
              }}
            />
          ) : (
            <ModelViewer
              source={viewerSource}
              downloads={{
                sourceCode,
              }}
              revisions={{
                activeRevisionKey,
                isLatestRevisionSelected,
                onSelectLatestRevision: handleSelectLatestRevision,
                onSelectRevision: handleSelectRevision,
                revisions: revisionOptions,
              }}
              sharing={{
                activeRevisionKey,
                shareRevision,
              }}
            />
          )}
        </div>

        <div className={cn("relative hidden w-0 md:block", isChatCollapsed && "md:hidden")} role="presentation">
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            onMouseDown={() => setIsResizing(true)}
            className={`absolute inset-y-0 -left-1 z-10 w-2 !cursor-col-resize bg-transparent transition-colors ${isResizing ? "bg-accent/20" : "hover:bg-muted/80"
              }`}
          />
        </div>

        {isChatCollapsed ? (
          <button
            type="button"
            onClick={toggleChatCollapsed}
            aria-label="Show chat panel"
            aria-expanded={false}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 border-t border-border bg-background text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-full md:w-10 md:border-l md:border-t-0"
          >
            <PanelBottomOpen size={14} strokeWidth={1.75} className="md:hidden" />
            <PanelRightOpen size={14} strokeWidth={1.75} className="hidden md:block" />
          </button>
        ) : null}

        <div
          className={cn(
            "min-h-0 flex-[3] md:min-w-[320px] md:flex-1 md:border-l md:border-border",
            isChatCollapsed && "hidden",
          )}
        >
          <Chat
            ref={chatRef}
            assistantId={studioMode}
            maskComposer={maskComposer}
            onDesignRevisionEvent={handleDesignRevision}
            onDesignRevisionsChange={handleDesignRevisionsChange}
            onModeChange={setStudioMode}
            onSketchRevisionEvent={handleSketchRevision}
            onSketchRevisionsChange={handleSketchRevisionsChange}
            onClearViewer={handleClearViewer}
            onToggleCollapse={toggleChatCollapsed}
          />
        </div>
      </div>
    </main>
  );
}
