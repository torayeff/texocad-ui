"use client";

import { useShareArtifact } from "@/app/hooks/use-share-artifact";
import type { SketchSource } from "@/app/types/sketch-viewer";
import type { ShareRevision } from "@/app/types/share-artifact";

interface UseShareSketchOptions {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
  source: SketchSource | null;
}

function defaultShareName(source: SketchSource | null) {
  if (!source?.label) return "";
  return source.label.replace(/\.(png|jpe?g|webp)$/i, "").replace(/[-_]+/g, " ").trim();
}

export function useShareSketch({ activeRevisionKey, shareRevision, source }: UseShareSketchOptions) {
  return useShareArtifact({
    activeRevisionKey,
    artifactKind: "sketch",
    defaultShareName,
    emptyNameError: "Enter a sketch name.",
    shareError: "Could not share this sketch.",
    shareRevision,
    source,
  });
}
