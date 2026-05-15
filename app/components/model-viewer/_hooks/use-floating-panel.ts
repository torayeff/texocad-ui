"use client";

import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface FloatingPanelPosition {
  left: number;
  top: number;
}

const floatingPanelGap = 8;
const viewportPadding = 12;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useFloatingPanel(isOpen: boolean, dependencies: readonly unknown[]) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelPosition, setPanelPosition] = useState<FloatingPanelPosition | null>(null);

  const updateOpenPanelPosition = useCallback(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const rail = railRef.current;
    const trigger = activeTriggerRef.current;
    const panel = panelRef.current;

    if (!rail || !trigger || !panel) {
      return;
    }

    const railRect = rail.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const preferredViewportLeft = triggerRect.left + triggerRect.width / 2 - panelRect.width / 2;
    const maxViewportLeft = Math.max(viewportPadding, window.innerWidth - viewportPadding - panelRect.width);
    const viewportLeft = Math.min(Math.max(preferredViewportLeft, viewportPadding), maxViewportLeft);
    const preferredViewportTop = railRect.bottom + floatingPanelGap;
    const maxViewportTop = Math.max(viewportPadding, window.innerHeight - viewportPadding - panelRect.height);
    const viewportTop = Math.min(Math.max(preferredViewportTop, viewportPadding), maxViewportTop);
    const nextPosition = {
      left: viewportLeft - railRect.left,
      top: viewportTop - railRect.top,
    };

    setPanelPosition((currentPosition) => {
      if (
        currentPosition &&
        Math.abs(currentPosition.left - nextPosition.left) < 0.5 &&
        Math.abs(currentPosition.top - nextPosition.top) < 0.5
      ) {
        return currentPosition;
      }

      return nextPosition;
    });
  }, [isOpen]);

  useIsomorphicLayoutEffect(() => {
    updateOpenPanelPosition();
  }, [updateOpenPanelPosition, ...dependencies]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    window.addEventListener("resize", updateOpenPanelPosition);
    window.addEventListener("scroll", updateOpenPanelPosition, true);

    return () => {
      window.removeEventListener("resize", updateOpenPanelPosition);
      window.removeEventListener("scroll", updateOpenPanelPosition, true);
    };
  }, [isOpen, updateOpenPanelPosition]);

  useEffect(() => {
    if (!isOpen || typeof ResizeObserver === "undefined") {
      return;
    }

    const trigger = activeTriggerRef.current;
    const panel = panelRef.current;

    if (!trigger || !panel) {
      return;
    }

    const observer = new ResizeObserver(updateOpenPanelPosition);
    observer.observe(trigger);
    observer.observe(panel);

    return () => observer.disconnect();
  }, [isOpen, updateOpenPanelPosition]);

  const panelStyle: CSSProperties = {
    left: panelPosition?.left ?? 0,
    top: panelPosition?.top ?? 0,
    visibility: panelPosition ? "visible" : "hidden",
  };

  return {
    activeTriggerRef,
    panelRef,
    panelStyle,
    railRef,
    resetPanelPosition: () => setPanelPosition(null),
  };
}
