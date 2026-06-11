"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";

export function useAutoOpenDetails(autoOpen: boolean) {
  const [userOpen, setUserOpen] = useState(false);
  const previousAutoOpenRef = useRef(autoOpen);

  useEffect(() => {
    if (previousAutoOpenRef.current && !autoOpen) {
      setUserOpen(false);
    }

    previousAutoOpenRef.current = autoOpen;
  }, [autoOpen]);

  const handleToggle = useCallback((event: SyntheticEvent<HTMLDetailsElement>) => {
    if (autoOpen) return;
    setUserOpen(event.currentTarget.open);
  }, [autoOpen]);

  return {
    isOpen: autoOpen || userOpen,
    handleToggle,
  };
}
