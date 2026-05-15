"use client";

import { useCallback } from "react";
import * as THREE from "three";

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import type { HighlightState } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { visibleMeshes } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { applyBrowserHighlight, clearBrowserHighlight } from "@/app/components/model-viewer/_lib/browser-selection";

interface UseBrowserSelectionOptions {
  browserNodeEntriesRef: RefObject<Map<string, BrowserNodeEntry>>;
  clearHighlightRef: RefObject<() => void>;
  pickableMeshesRef: RefObject<THREE.Mesh[]>;
  allPickableMeshesRef: RefObject<THREE.Mesh[]>;
  selectedBrowserNodeIdRef: RefObject<string | null>;
  selectedHighlightsRef: RefObject<HighlightState[]>;
  setSelectedBrowserNodeId: Dispatch<SetStateAction<string | null>>;
  setVisibleBrowserNodeIds: Dispatch<SetStateAction<Set<string>>>;
}

export function useBrowserSelection({
  allPickableMeshesRef,
  browserNodeEntriesRef,
  clearHighlightRef,
  pickableMeshesRef,
  selectedBrowserNodeIdRef,
  selectedHighlightsRef,
  setSelectedBrowserNodeId,
  setVisibleBrowserNodeIds,
}: UseBrowserSelectionOptions) {
  const refreshPickableMeshes = useCallback(() => {
    pickableMeshesRef.current = visibleMeshes(allPickableMeshesRef.current);
  }, [allPickableMeshesRef, pickableMeshesRef]);

  const clearBrowserSelectionHighlight = useCallback(() => {
    clearBrowserHighlight(clearHighlightRef.current, selectedHighlightsRef.current);
    selectedHighlightsRef.current = [];
  }, [clearHighlightRef, selectedHighlightsRef]);

  const clearBrowserSelection = useCallback(() => {
    selectedBrowserNodeIdRef.current = null;
    setSelectedBrowserNodeId(null);
    clearBrowserSelectionHighlight();
  }, [clearBrowserSelectionHighlight, selectedBrowserNodeIdRef, setSelectedBrowserNodeId]);

  const selectBrowserNode = useCallback(
    (id: string, selectTransformNode: (nodeId: string | null) => void) => {
      if (selectedBrowserNodeIdRef.current === id) {
        clearBrowserSelection();
        selectTransformNode(null);
        return;
      }

      const entry = browserNodeEntriesRef.current.get(id);
      if (!entry) {
        clearBrowserSelection();
        selectTransformNode(null);
        return;
      }

      selectedBrowserNodeIdRef.current = id;
      setSelectedBrowserNodeId(id);
      clearBrowserSelectionHighlight();
      selectedHighlightsRef.current = applyBrowserHighlight(entry);
      selectTransformNode(id);
    },
    [
      browserNodeEntriesRef,
      clearBrowserSelection,
      clearBrowserSelectionHighlight,
      selectedBrowserNodeIdRef,
      selectedHighlightsRef,
      setSelectedBrowserNodeId,
    ],
  );

  const handleTransformSelect = useCallback(
    (nodeId: string | null) => {
      if (nodeId === null) {
        clearBrowserSelectionHighlight();
        selectedBrowserNodeIdRef.current = null;
        setSelectedBrowserNodeId(null);
        return;
      }

      const entry = browserNodeEntriesRef.current.get(nodeId);
      if (!entry) return;

      clearBrowserSelectionHighlight();
      selectedBrowserNodeIdRef.current = nodeId;
      setSelectedBrowserNodeId(nodeId);
      selectedHighlightsRef.current = applyBrowserHighlight(entry);
    },
    [
      browserNodeEntriesRef,
      clearBrowserSelectionHighlight,
      selectedBrowserNodeIdRef,
      selectedHighlightsRef,
      setSelectedBrowserNodeId,
    ],
  );

  const toggleBrowserNodeVisibility = useCallback(
    (id: string) => {
      const entry = browserNodeEntriesRef.current.get(id);
      if (!entry) {
        return;
      }

      const nextVisible = !entry.visible;
      entry.visible = nextVisible;
      for (const object of entry.objects) {
        object.visible = nextVisible;
      }

      refreshPickableMeshes();

      const selectedId = selectedBrowserNodeIdRef.current;
      const selectedEntry = selectedId ? browserNodeEntriesRef.current.get(selectedId) : null;
      if (selectedEntry && visibleMeshes(selectedEntry.meshes).length === 0) {
        clearBrowserSelection();
      }

      setVisibleBrowserNodeIds((currentIds) => {
        const nextIds = new Set(currentIds);
        if (nextVisible) {
          nextIds.add(id);
        } else {
          nextIds.delete(id);
        }
        return nextIds;
      });
    },
    [
      browserNodeEntriesRef,
      clearBrowserSelection,
      refreshPickableMeshes,
      selectedBrowserNodeIdRef,
      setVisibleBrowserNodeIds,
    ],
  );

  return {
    clearBrowserSelection,
    clearBrowserSelectionHighlight,
    handleTransformSelect,
    selectBrowserNode,
    toggleBrowserNodeVisibility,
  };
}
