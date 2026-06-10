"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useState } from "react";

interface UseSplitLayoutOptions {
  contentRef: RefObject<HTMLDivElement | null>;
}

export function useSplitLayout({ contentRef }: UseSplitLayoutOptions) {
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const toggleChatCollapsed = useCallback(() => {
    setIsChatCollapsed((collapsed) => !collapsed);
  }, []);

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
  }, [contentRef, isResizing]);

  return {
    isChatCollapsed,
    isResizing,
    setIsResizing,
    splitPct,
    toggleChatCollapsed,
  };
}
