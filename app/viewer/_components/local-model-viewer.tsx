"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import type { ModelSource } from "@/app/types/model-viewer";

const ModelViewer = dynamic(
  () => import("@/app/components/model-viewer/model-viewer"),
  { ssr: false },
);

function localFileSource(file: File): ModelSource {
  return {
    kind: "file",
    file,
    label: file.name,
  };
}

export function LocalModelViewer() {
  const [source, setSource] = useState<ModelSource | null>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setSource(file ? localFileSource(file) : null);
  }, []);

  const handleClear = useCallback(() => {
    setSource(null);
  }, []);

  const handleShareCreated = useCallback((shareUrl: string) => {
    window.history.replaceState(window.history.state, "", new URL(shareUrl).pathname);
  }, []);

  return (
    <ModelViewer
      source={source}
      localFiles={{
        enabled: true,
        onClear: handleClear,
        onFileChange: handleFileChange,
        onShareCreated: handleShareCreated,
      }}
    />
  );
}
