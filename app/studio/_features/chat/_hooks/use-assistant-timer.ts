"use client";

import { useRef, useCallback, useState } from "react";
import type { AssistantTimer } from "@/app/studio/_features/chat/_types/chat";

export function useAssistantTimer(): AssistantTimer {
  const startTimesRef = useRef(new Map<string, number>());
  const [runtimeSecondsByRow, setRuntimeSecondsByRow] = useState<Record<string, number>>({});

  const markStart = useCallback((rowKey: string) => {
    if (!startTimesRef.current.has(rowKey)) {
      startTimesRef.current.set(rowKey, Date.now());
    }
  }, []);

  const getStartedAtMs = useCallback((rowKey: string): number | undefined => {
    return startTimesRef.current.get(rowKey);
  }, []);

  const finalize = useCallback((rowKey: string) => {
    const startedAt = startTimesRef.current.get(rowKey);
    if (startedAt === undefined) return;

    const runtimeSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    setRuntimeSecondsByRow((current) =>
      current[rowKey] === runtimeSeconds
        ? current
        : { ...current, [rowKey]: runtimeSeconds },
    );
  }, []);

  const reset = useCallback(() => {
    startTimesRef.current.clear();
    setRuntimeSecondsByRow((current) =>
      Object.keys(current).length === 0 ? current : {},
    );
  }, []);

  return { markStart, getStartedAtMs, finalize, reset, runtimeSecondsByRow } as const;
}
