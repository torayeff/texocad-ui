"use client";

import type { SketchSource } from "@/app/types/sketch-viewer";
import SketchViewer from "@/app/components/sketch-viewer/sketch-viewer";

interface SharedSketchViewerProps {
  source: SketchSource;
}

export function SharedSketchViewer({ source }: SharedSketchViewerProps) {
  return <SketchViewer source={source} />;
}
