import { type Dispatch, type RefObject, type SetStateAction, useEffect } from "react";
import * as THREE from "three";

import { buildModel } from "@/app/components/model-viewer/_lib/model-viewer-loaders";
import { getSourceBuffer, sourceFormat } from "@/app/components/model-viewer/_lib/model-source";
import { buildModelBrowserTree, type BrowserNodeEntry, visibleNodeIds } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import { initialStatus } from "@/app/components/model-viewer/_lib/model-viewer-state";
import type { LoadProgress, LoadState, ModelBrowserNode, ModelFormat, ModelSource, ViewPreset } from "@/app/types/model-viewer";
import { fitCameraToObject } from "@/app/components/model-viewer/_lib/camera-view";
import { applyWireframe, collectPickableMeshes, disposeObject } from "@/app/components/model-viewer/_lib/three-materials";
import { visibleMeshes } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { configureCadRenderer, configureRendererForFormat, type ViewerRuntime } from "@/app/components/model-viewer/_hooks/use-three-renderer";

interface UseModelLoadingOptions {
  activeViewRef: RefObject<ViewPreset>;
  allPickableMeshesRef: RefObject<THREE.Mesh[]>;
  browserNodeEntriesRef: RefObject<Map<string, BrowserNodeEntry>>;
  clearBrowserSelectionHighlight: () => void;
  clearCurrentModel: (scene?: THREE.Scene) => void;
  fitDistanceRef: RefObject<number>;
  initializeExplode: (model: THREE.Group, format: ModelFormat) => void;
  modelGroupRef: RefObject<THREE.Group | null>;
  pickableMeshesRef: RefObject<THREE.Mesh[]>;
  runtimeRef: RefObject<ViewerRuntime | null>;
  selectedBrowserNodeIdRef: RefObject<string | null>;
  setLoadProgress: Dispatch<SetStateAction<LoadProgress | null>>;
  setLoadState: Dispatch<SetStateAction<LoadState>>;
  setMeshCount: Dispatch<SetStateAction<number | null>>;
  setModelBrowserNodes: Dispatch<SetStateAction<ModelBrowserNode[]>>;
  setSelectedBrowserNodeId: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setVisibleBrowserNodeIds: Dispatch<SetStateAction<Set<string>>>;
  source: ModelSource | null;
  wireframeRef: RefObject<boolean>;
}

export function useModelLoading({
  activeViewRef,
  allPickableMeshesRef,
  browserNodeEntriesRef,
  clearBrowserSelectionHighlight,
  clearCurrentModel,
  fitDistanceRef,
  initializeExplode,
  modelGroupRef,
  pickableMeshesRef,
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
}: UseModelLoadingOptions) {
  useEffect(() => {
    const viewerRuntime = runtimeRef.current;
    if (!viewerRuntime) {
      return;
    }

    clearCurrentModel(viewerRuntime.scene);

    if (!source) {
      setLoadProgress(null);
      setLoadState("idle");
      setMeshCount(null);
      setStatus(initialStatus);
      configureCadRenderer(viewerRuntime.renderer, viewerRuntime.scene, viewerRuntime.environmentMap);
      return;
    }

    const modelSource = source;
    let cancelled = false;
    const abortController = new AbortController();

    async function loadModel(viewerRuntime: ViewerRuntime) {
      setMeshCount(null);
      setLoadState("loading");
      const loadingLabel = modelSource.kind === "url" ? "Loading model..." : `Loading ${modelSource.label}...`;
      setStatus(loadingLabel);
      setLoadProgress({ label: loadingLabel, percent: 8 });
      const format = sourceFormat(modelSource);
      const buffer = await getSourceBuffer(
        modelSource,
        (loadPercent) => {
          if (cancelled) {
            return;
          }

          setLoadProgress({
            label: loadingLabel,
            percent: 8 + Math.round(loadPercent * 0.72),
          });
        },
        abortController.signal,
      );
      if (cancelled) {
        return;
      }

      setLoadProgress({ label: "Preparing model...", percent: 84 });
      configureRendererForFormat(format, viewerRuntime.renderer, viewerRuntime.scene, viewerRuntime.environmentMap);
      const parsingLabel = `Parsing ${format.toUpperCase()} geometry...`;
      setStatus(parsingLabel);
      setLoadProgress({ label: parsingLabel, percent: 90 });
      const builtModel = await buildModel(buffer, format, { signal: abortController.signal });

      if (cancelled) {
        disposeObject(builtModel.group);
        return;
      }

      setLoadProgress({ label: "Finishing scene...", percent: 96 });
      const allPickableMeshes = collectPickableMeshes(builtModel.group);
      const browserTree = buildModelBrowserTree(builtModel.group, format);

      allPickableMeshesRef.current = allPickableMeshes;
      pickableMeshesRef.current = visibleMeshes(allPickableMeshes);
      browserNodeEntriesRef.current = browserTree.entries;
      selectedBrowserNodeIdRef.current = null;
      setSelectedBrowserNodeId(null);
      setModelBrowserNodes(browserTree.nodes);
      setVisibleBrowserNodeIds(visibleNodeIds(browserTree.entries));
      modelGroupRef.current = builtModel.group;
      applyWireframe(builtModel.group, wireframeRef.current);
      viewerRuntime.scene.add(builtModel.group);
      fitDistanceRef.current = fitCameraToObject(
        viewerRuntime.camera,
        viewerRuntime.controls,
        builtModel.group,
        activeViewRef.current,
      );
      initializeExplode(builtModel.group, format);
      setMeshCount(builtModel.meshCount);
      setStatus("Ready");
      setLoadProgress(null);
      setLoadState("ready");
    }

    loadModel(viewerRuntime).catch((error: unknown) => {
      if (!cancelled) {
        setStatus(error instanceof Error ? error.message : "Failed to load model file.");
        setLoadProgress(null);
        setLoadState("error");
      }
    });

    return () => {
      cancelled = true;
      abortController.abort();
      clearCurrentModel(viewerRuntime.scene);
      clearBrowserSelectionHighlight();
    };
  }, [
    activeViewRef,
    allPickableMeshesRef,
    browserNodeEntriesRef,
    clearBrowserSelectionHighlight,
    clearCurrentModel,
    fitDistanceRef,
    initializeExplode,
    modelGroupRef,
    pickableMeshesRef,
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
  ]);
}
