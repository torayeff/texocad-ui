"use client";

import dynamic from "next/dynamic";
import { Box, Image as ImageIcon } from "lucide-react";

import SketchViewer from "@/app/components/sketch-viewer/sketch-viewer";
import { activeControlClass, viewerGlassClass } from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";
import type { LumiViewerMode } from "@/app/studio/_types/lumi-viewer";
import type { ModelSource, ViewerRevisionOption } from "@/app/types/model-viewer";
import type {
  SketchMaskComposerState,
  SketchMaskEditRequest,
  SketchRevisionOption,
  SketchSource,
} from "@/app/types/sketch-viewer";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

interface LumiViewerRevisionControls<TOption> {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  revisions: TOption[];
}

interface LumiViewerProps {
  hasModel: boolean;
  hasSketch: boolean;
  isMaskSubmitting: boolean;
  modelRevisions: LumiViewerRevisionControls<ViewerRevisionOption>;
  modelSource: ModelSource | null;
  onMaskEditorChange: (state: SketchMaskComposerState | null) => void;
  onSubmitMaskEdit?: (request: SketchMaskEditRequest) => Promise<void> | void;
  onViewerModeChange: (mode: LumiViewerMode) => void;
  sketchRevisions: LumiViewerRevisionControls<SketchRevisionOption>;
  sketchSource: SketchSource | null;
  viewerMode: LumiViewerMode;
}

const MODE_OPTIONS: Array<{ mode: LumiViewerMode; label: string; icon: typeof Box }> = [
  { mode: "sketch", label: "Sketch", icon: ImageIcon },
  { mode: "model", label: "3D Model", icon: Box },
];

export default function LumiViewer({
  hasModel,
  hasSketch,
  isMaskSubmitting,
  modelRevisions,
  modelSource,
  onMaskEditorChange,
  onSubmitMaskEdit,
  onViewerModeChange,
  sketchRevisions,
  sketchSource,
  viewerMode,
}: LumiViewerProps) {
  const showModeToggle = hasSketch && hasModel;

  return (
    <div className="relative h-full">
      {viewerMode === "sketch" ? (
        <SketchViewer
          isMaskSubmitting={isMaskSubmitting}
          onMaskEditorChange={onMaskEditorChange}
          onSubmitMaskEdit={onSubmitMaskEdit}
          source={sketchSource}
          revisions={sketchRevisions}
        />
      ) : (
        <ModelViewer
          source={modelSource}
          revisions={modelRevisions}
        />
      )}

      {showModeToggle ? (
        <div
          role="tablist"
          aria-label="Viewer mode"
          className={cn(
            viewerGlassClass,
            // Sits above the model viewer's gesture legend (anchored at bottom-7).
            "absolute bottom-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-[var(--viewer-control-radius)] p-1 sm:bottom-14",
          )}
        >
          {MODE_OPTIONS.map(({ mode, label, icon: Icon }) => {
            const isActive = viewerMode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onViewerModeChange(mode)}
                className={cn(
                  "flex h-[1.875rem] items-center gap-1.5 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && activeControlClass,
                )}
              >
                <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
