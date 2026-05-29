"use client";

import { useShareArtifact } from "@/app/hooks/use-share-artifact";
import type { ModelSource } from "@/app/types/model-viewer";
import type { ShareRevision } from "@/app/types/share-artifact";

interface UseShareModelOptions {
  activeRevisionKey: string | null;
  shareRevision: ShareRevision | null;
  source: ModelSource | null;
}

function defaultShareName(source: ModelSource | null) {
  if (!source?.label) return "";
  return source.label.replace(/\.(step|stp)$/i, "").replace(/[-_]+/g, " ").trim();
}

export function useShareModel({ activeRevisionKey, shareRevision, source }: UseShareModelOptions) {
  return useShareArtifact({
    activeRevisionKey,
    artifactKind: "model",
    defaultShareName,
    emptyNameError: "Enter a model name.",
    shareError: "Could not share this model.",
    shareRevision,
    source,
  });
}
