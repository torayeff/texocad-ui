"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { type BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import { initialStatus } from "@/app/components/model-viewer/_lib/model-viewer-state";
import type { LoadProgress, LoadState, ModelBrowserNode, ModelFormat, ModelSource, ViewPreset } from "@/app/types/model-viewer";
import { setCameraView, fitCameraToObject } from "@/app/components/model-viewer/_lib/camera-view";
import { applyExplodeAmount, buildExplodeAssembly, type ExplodeAssembly } from "@/app/components/model-viewer/_lib/explode-assembly";
import { applyWireframe, disposeObject } from "@/app/components/model-viewer/_lib/three-materials";
import { attachModelPicking, collectStandardMaterials, type HighlightState, visibleMeshes } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { useModelLoading } from "@/app/components/model-viewer/_hooks/use-model-loading";
import { useThreeRenderer } from "@/app/components/model-viewer/_hooks/use-three-renderer";
import { useTransformControls } from "@/app/components/model-viewer/_hooks/use-transform-controls";

interface ModelViewerSceneOptions {
  source: ModelSource | null;
}

const browserSelectionColor = new THREE.Color(0x60a5fa);
const browserSelectionEmissive = new THREE.Color(0x1d4ed8);

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

  const refreshPickableMeshes = useCallback(() => {
    pickableMeshesRef.current = visibleMeshes(allPickableMeshesRef.current);
  }, []);

  const clearBrowserSelectionHighlight = useCallback(() => {
    clearHighlightRef.current();

    for (const highlighted of selectedHighlightsRef.current) {
      highlighted.material.color.copy(highlighted.color);
      highlighted.material.emissive.copy(highlighted.emissive);
    }

    selectedHighlightsRef.current = [];
  }, []);

  const clearBrowserSelection = useCallback(() => {
    selectedBrowserNodeIdRef.current = null;
    setSelectedBrowserNodeId(null);
    clearBrowserSelectionHighlight();
  }, [clearBrowserSelectionHighlight]);

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

  const handleTransformSelect = useCallback((nodeId: string | null) => {
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

    const materials = collectStandardMaterials(entry.meshes);
    selectedHighlightsRef.current = materials.map((material) => ({
      material,
      color: material.color.clone(),
      emissive: material.emissive.clone(),
    }));

    for (const material of materials) {
      material.color.copy(browserSelectionColor);
      material.emissive.copy(browserSelectionEmissive);
    }
  }, [clearBrowserSelectionHighlight]);

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

  const applyBrowserSelectionHighlight = useCallback(
    (entry: BrowserNodeEntry) => {
      clearBrowserSelectionHighlight();

      const materials = collectStandardMaterials(entry.meshes);
      selectedHighlightsRef.current = materials.map((material) => ({
        material,
        color: material.color.clone(),
        emissive: material.emissive.clone(),
      }));

      for (const material of materials) {
        material.color.copy(browserSelectionColor);
        material.emissive.copy(browserSelectionEmissive);
      }
    },
    [clearBrowserSelectionHighlight],
  );

  const selectBrowserNode = useCallback(
    (id: string) => {
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
      applyBrowserSelectionHighlight(entry);
      selectTransformNode(id);
    },
    [applyBrowserSelectionHighlight, clearBrowserSelection, selectTransformNode],
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
    [clearBrowserSelection, refreshPickableMeshes],
  );

  const setActiveView = useCallback(
    (view: ViewPreset) => {
      activeViewRef.current = view;
      setActiveViewState(view);

      const runtime = runtimeRef.current;
      if (runtime) {
        setCameraView(runtime.camera, runtime.controls, view, fitDistanceRef.current);
      }
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
    const runtime = runtimeRef.current;
    if (!runtime || !modelGroupRef.current) {
      return;
    }

    const currentExplodeAmount = explodeAmountRef.current;
    applyExplodeAmount(explodeAssemblyRef.current, 0);
    fitDistanceRef.current = fitCameraToObject(
      runtime.camera,
      runtime.controls,
      modelGroupRef.current,
      activeViewRef.current,
    );
    if (currentFormatRef.current) {
      const assembly = buildExplodeAssembly(modelGroupRef.current, currentFormatRef.current);
      explodeAssemblyRef.current = assembly;
      applyExplodeAmount(assembly, currentExplodeAmount);
    }
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
