"use client";

import { Brush, Eraser, X } from "lucide-react";

import { composerButtonClass } from "@/app/studio/_features/chat/_lib/chat-styles";
import type { SketchMaskComposerState } from "@/app/types/sketch-viewer";

export function maskComposerDisabledReason(maskComposer: SketchMaskComposerState | null) {
  if (!maskComposer) return null;
  if (maskComposer.isSubmitting) return "Submitting masked edit...";
  if (!maskComposer.canSubmit) return "Brush an area in the sketch first.";
  return null;
}

interface MaskComposerBannerProps {
  disabledReason: string | null;
  isComposerBusy: boolean;
  maskComposer: SketchMaskComposerState;
}

export function MaskComposerBanner({
  disabledReason,
  isComposerBusy,
  maskComposer,
}: MaskComposerBannerProps) {
  return (
    <div className="mx-1 mb-2 flex items-center justify-between gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--border)_58%,transparent)] bg-muted/35 px-2.5 py-1.5 text-xs text-muted-foreground">
      <div className="flex min-w-0 items-center gap-2">
        <Brush size={14} strokeWidth={1.75} className="shrink-0 text-foreground" />
        <span className="truncate">
          {maskComposer.error ?? disabledReason ?? "Editing masked area"}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={maskComposer.clear}
          disabled={isComposerBusy || !maskComposer.canSubmit}
          className={composerButtonClass}
          aria-label="Clear mask"
        >
          <Eraser size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={maskComposer.close}
          disabled={isComposerBusy}
          className={composerButtonClass}
          aria-label="Cancel mask edit"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
