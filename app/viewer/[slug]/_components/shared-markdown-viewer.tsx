"use client";

import MarkdownViewer from "@/app/components/markdown-viewer/markdown-viewer";
import type { MarkdownSource } from "@/app/types/markdown-viewer";

interface SharedMarkdownViewerProps {
  source: MarkdownSource;
}

export function SharedMarkdownViewer({ source }: SharedMarkdownViewerProps) {
  return <MarkdownViewer source={source} variant="shared" />;
}
