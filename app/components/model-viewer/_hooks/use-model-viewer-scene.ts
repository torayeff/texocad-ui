"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import type { BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import { initialStatus } from "@/app/components/model-viewer/_lib/model-viewer-state";
import type { LoadProgress, LoadState, ModelBrowserNode, ModelFormat, ModelSource, ViewPreset } from "@/app/types/model-viewer";
import { applyExplodeAmount, buildExplodeAssembly } from "@/app/components/model-viewer/_lib/explode-assembly";
import type { ExplodeAssembly } from "@/app/components/model-viewer/_lib/explode-assembly";
import { applyWireframe, disposeObject } from "@/app/components/model-viewer/_lib/three-materials";
import { attachModelPicking } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import type { HighlightState } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { useModelLoading } from "@/app/components/model-viewer/_hooks/use-model-loading";
import { useThreeRenderer } from "@/app/components/model-viewer/_hooks/use-three-renderer";
import { useTransformControls } from "@/app/components/model-viewer/_hooks/use-transform-controls";
import { fitSceneView, setSceneActiveView } from "@/app/components/model-viewer/_lib/scene-view-actions";
import { useBrowserSelection } from "@/app/components/model-viewer/_hooks/use-browser-selection";

interface ModelViewerSceneOptions {
  source: ModelSource | null;
}

export function useModelViewerScene({ source }: ModelViewerSceneOptions) {
  const activeViewRef = useRef<ViewPreset>("iso");
  const allPickableMeshesRef = useRef<THREE.Mesh[]>([]);
  const autoRotateRef = useRef(false);
  const browserNodeEntriesRef = useRef<Map<string, BrowserNodeEntry>>(new Map());
  const clearHighlightRef = useRef<() => void>(() => { });
  const currentFormatRef = useRef<ModelFormat | null>(null);
  const explodeAmountRef = useRef(0);
  const explodeAssemblyRef = useRef<ExplodeAssembly | null>(null);
  const fitDistanceRef = useRef(120);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const pickableMeshesRef = useRef<THREE.Mesh[]>([]);
  const selectedBrowserNodeIdRef = useRef<string | null>(null);
  const selectedHighlightsRef = useRef<HighlightState[]>([]);
  const wireframeRef = useRef(false);

  const [activeView, setActiveViewState] = useState<ViewPreset | null>("iso");
  const [autoRotate, setAutoRotate] = useState(false);
  const [explodeAmount, setExplodeAmountState] = useState(0);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [meshCount, setMeshCount] = useState<number | null>(null);
  const [modelBrowserNodes, setModelBrowserNodes] = useState<ModelBrowserNode[]>([]);
  const [selectedBrowserNodeId, setSelectedBrowserNodeId] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [visibleBrowserNodeIds, setVisibleBrowserNodeIds] = useState<Set<string>>(new Set());
  const [wireframe, setWireframe] = useState(false);

  const {
    clearBrowserSelection,
    clearBrowserSelectionHighlight,
    handleTransformSelect,
    selectBrowserNode: selectBrowserNodeWithTransform,
    toggleBrowserNodeVisibility,
  } = useBrowserSelection({
    allPickableMeshesRef,
    browserNodeEntriesRef,
    clearHighlightRef,
    pickableMeshesRef,
    selectedBrowserNodeIdRef,
    selectedHighlightsRef,
    setSelectedBrowserNodeId,
    setVisibleBrowserNodeIds,
  });

  const clearCurrentModel = useCallback(
    (scene?: THREE.Scene) => {
      clearBrowserSelectionHighlight();
      allPickableMeshesRef.current = [];
      pickableMeshesRef.current = [];
      browserNodeEntriesRef.current = new Map();
      currentFormatRef.current = null;
      explodeAmountRef.current = 0;
      explodeAssemblyRef.current = null;
      selectedBrowserNodeIdRef.current = null;
      setExplodeAmountState(0);
      setSelectedBrowserNodeId(null);
      setModelBrowserNodes([]);
      setVisibleBrowserNodeIds(new Set());

      const currentModel = modelGroupRef.current;
      if (!currentModel) {
        return;
      }

      scene?.remove(currentModel);
      disposeObject(currentModel);
      modelGroupRef.current = null;
    },
    [clearBrowserSelectionHighlight],
  );

  const initializeExplode = useCallback((model: THREE.Group, format: ModelFormat) => {
    const assembly = buildExplodeAssembly(model, format);
    currentFormatRef.current = format;
    explodeAssemblyRef.current = assembly;
    explodeAmountRef.current = 0;
    setExplodeAmountState(0);
  }, []);

  const clearActiveView = useCallback(() => {
    setActiveViewState(null);
  }, []);

  const { containerRef, runtimeRef } = useThreeRenderer({
    activeViewRef,
    autoRotateRef,
    fitDistanceRef,
    modelGroupRef,
    onBeforeDispose: clearCurrentModel,
    onControlsStart: clearActiveView,
  });

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    return attachModelPicking({
      camera: runtime.camera,
      clearHighlightRef,
      pickableMeshesRef,
      renderer: runtime.renderer,
    });
  }, [runtimeRef]);

  useModelLoading({
    activeViewRef,
    allPickableMeshesRef,
    browserNodeEntriesRef,
    clearBrowserSelectionHighlight,
    clearCurrentModel,
    fitDistanceRef,
    modelGroupRef,
    pickableMeshesRef,
    initializeExplode,
    runtimeRef,
    selectedBrowserNodeIdRef,
    setLoadProgress,
    setLoadState,
    setMeshCount,
    setModelBrowserNodes,
    setSelectedBrowserNodeId,
    setStatus,
    setVisibleBrowserNodeIds,
    source,
    wireframeRef,
  });

  const {
    detachTransform,
    hasTransforms,
    resetTransforms,
    selectTransformNode,
    selectedTransformNodeId,
    setTransformMode,
    transformMode,
  } = useTransformControls({
    browserNodeEntriesRef,
    modelGroupRef,
    onSelectNode: handleTransformSelect,
    runtimeRef,
  });

  const selectBrowserNode = useCallback(
    (id: string) => {
      selectBrowserNodeWithTransform(id, selectTransformNode);
    },
    [selectBrowserNodeWithTransform, selectTransformNode],
  );

  const setActiveView = useCallback(
    (view: ViewPreset) => {
      setSceneActiveView({
        activeViewRef,
        fitDistanceRef,
        runtime: runtimeRef.current,
        setActiveViewState,
        view,
      });
    },
    [runtimeRef],
  );

  const setExplodeAmount = useCallback((amount: number) => {
    const nextAmount = THREE.MathUtils.clamp(Math.round(amount), 0, 100);
    explodeAmountRef.current = nextAmount;
    setExplodeAmountState(nextAmount);
    applyExplodeAmount(explodeAssemblyRef.current, nextAmount);
    detachTransform();
  }, [detachTransform]);

  const fitView = useCallback(() => {
    fitSceneView({
      activeViewRef,
      currentExplodeAmount: explodeAmountRef.current,
      currentFormat: currentFormatRef.current,
      explodeAssemblyRef,
      fitDistanceRef,
      model: modelGroupRef.current,
      runtime: runtimeRef.current,
    });
  }, [runtimeRef]);

  const toggleWireframe = useCallback(() => {
    setWireframe((nextWireframe) => {
      const next = !nextWireframe;
      wireframeRef.current = next;
      if (modelGroupRef.current) {
        applyWireframe(modelGroupRef.current, next);
      }
      return next;
    });
  }, []);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((nextAutoRotate) => {
      const next = !nextAutoRotate;
      autoRotateRef.current = next;
      const runtime = runtimeRef.current;
      if (runtime) {
        runtime.controls.autoRotate = next;
      }
      if (next) {
        setTransformMode(null);
      }
      return next;
    });
  }, [runtimeRef, setTransformMode]);

  return {
    activeView,
    autoRotate,
    containerRef,
    clearBrowserSelection,
    detachTransform,
    explodeAmount,
    fitView,
    hasTransforms,
    loadProgress,
    loadState,
    meshCount,
    modelBrowserNodes,
    resetTransforms,
    selectBrowserNode,
    selectedBrowserNodeId,
    selectedTransformNodeId,
    selectTransformNode,
    setActiveView,
    setExplodeAmount,
    setTransformMode,
    status,
    toggleAutoRotate,
    toggleBrowserNodeVisibility,
    toggleWireframe,
    transformMode,
    visibleBrowserNodeIds,
    wireframe,
  };
}
