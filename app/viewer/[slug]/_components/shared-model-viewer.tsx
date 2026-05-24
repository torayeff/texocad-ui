"use client";

import dynamic from "next/dynamic";

import type { ModelSource } from "@/app/types/model-viewer";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

interface SharedModelViewerProps {
  source: ModelSource;
}

export function SharedModelViewer({ source }: SharedModelViewerProps) {
  return <ModelViewer source={source} variant="shared" />;
}
