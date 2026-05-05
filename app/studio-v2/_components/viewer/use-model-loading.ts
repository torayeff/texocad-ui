import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect } from "react";
import * as THREE from "three";

import { buildModel, getSourceBuffer, sourceFormat, type ModelFormat, type ModelSource } from "@/app/studio-v2/_components/viewer/model-viewer-loaders";
import { buildModelBrowserTree, type BrowserNodeEntry, visibleNodeIds } from "@/app/studio-v2/_components/viewer/model-viewer-browser-state";
import { initialStatus, type LoadProgress, type LoadState, type ModelBrowserNode, type ViewPreset } from "@/app/studio-v2/_components/viewer/model-viewer-state";
import { applyWireframe, collectPickableMeshes, disposeObject, fitCameraToObject } from "@/app/studio-v2/_components/viewer/model-viewer-three";
import { visibleMeshes } from "@/app/studio-v2/_components/viewer/model-viewer-picking";
import { configureCadRenderer, configureRendererForFormat, type ViewerRuntime } from "@/app/studio-v2/_components/viewer/use-three-renderer";

interface UseModelLoadingOptions {
  activeViewRef: MutableRefObject<ViewPreset>;
  allPickableMeshesRef: MutableRefObject<THREE.Mesh[]>;
  browserNodeEntriesRef: MutableRefObject<Map<string, BrowserNodeEntry>>;
  clearBrowserSelectionHighlight: () => void;
  clearCurrentModel: (scene?: THREE.Scene) => void;
  fitDistanceRef: MutableRefObject<number>;
  initializeExplode: (model: THREE.Group, format: ModelFormat) => void;
  modelGroupRef: MutableRefObject<THREE.Group | null>;
  pickableMeshesRef: MutableRefObject<THREE.Mesh[]>;
  runtimeRef: MutableRefObject<ViewerRuntime | null>;
  selectedBrowserNodeIdRef: MutableRefObject<string | null>;
  setLoadProgress: Dispatch<SetStateAction<LoadProgress | null>>;
  setLoadState: Dispatch<SetStateAction<LoadState>>;
  setMeshCount: Dispatch<SetStateAction<number | null>>;
  setModelBrowserNodes: Dispatch<SetStateAction<ModelBrowserNode[]>>;
  setSelectedBrowserNodeId: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setVisibleBrowserNodeIds: Dispatch<SetStateAction<Set<string>>>;
  source: ModelSource | null;
  wireframeRef: MutableRefObject<boolean>;
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
