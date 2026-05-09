"use client";

import dynamic from "next/dynamic";

import type { ModelSource } from "@/app/studio/_components/viewer/model-viewer-loaders";

const GeneratedStepViewer = dynamic(
  () => import("@/app/studio/_components/viewer/generated-step-viewer"),
  { ssr: false },
);

interface SharedModelViewerProps {
  source: ModelSource;
}

export function SharedModelViewer({ source }: SharedModelViewerProps) {
  return (
    <GeneratedStepViewer
      source={source}
      sourceCode={null}
      shareRevision={null}
      revisions={[]}
      activeRevisionKey={null}
      isLatestRevisionSelected
      onSelectLatestRevision={() => undefined}
      onSelectRevision={() => undefined}
    />
  );
}
