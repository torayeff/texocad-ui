"use client";

import { useEffect } from "react";
import * as THREE from "three";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { trackEvent } from "@/app/lib/analytics/client";
import { errorKind } from "@/app/lib/analytics/events";
import { buildModel } from "@/app/components/model-viewer/_lib/model-viewer-loaders";
import { getSourceBuffer, sourceFormat } from "@/app/components/model-viewer/_lib/model-source";
import { buildModelBrowserTree, visibleNodeIds } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import type { BrowserNodeEntry } from "@/app/components/model-viewer/_lib/model-viewer-browser-state";
import { initialStatus } from "@/app/components/model-viewer/_lib/model-viewer-state";
import type { LoadProgress, LoadState, ModelBrowserNode, ModelFormat, ModelSource, ViewPreset } from "@/app/types/model-viewer";
import { fitCameraToObject } from "@/app/components/model-viewer/_lib/camera-view";
import { applyWireframe, collectPickableMeshes, disposeObject } from "@/app/components/model-viewer/_lib/three-materials";
import { visibleMeshes } from "@/app/components/model-viewer/_lib/model-viewer-picking";
import { configureCadRenderer, configureRendererForFormat } from "@/app/components/model-viewer/_hooks/use-three-renderer";
import type { ViewerRuntime } from "@/app/components/model-viewer/_types/viewer-runtime";

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
    const format = sourceFormat(modelSource);
    let cancelled = false;
    const abortController = new AbortController();

    async function loadModel(viewerRuntime: ViewerRuntime) {
      setMeshCount(null);
      setLoadState("loading");
      const loadingLabel = modelSource.kind === "url" ? "Downloading model..." : `Loading ${modelSource.label}...`;
      setStatus(loadingLabel);
      setLoadProgress({ label: loadingLabel, percent: 8 });
      trackEvent("model_load_started", {
        format,
        source_kind: modelSource.kind,
      });
      const buffer = await getSourceBuffer(
        modelSource,
        (progress) => {
          if (cancelled) {
            return;
          }

          setLoadProgress({
            label: loadingLabel,
            loadedBytes: progress.loadedBytes,
            percent: 8 + Math.round(progress.percent * 0.72),
            totalBytes: progress.totalBytes,
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
      trackEvent("model_load_succeeded", {
        format,
        mesh_count: builtModel.meshCount,
        source_kind: modelSource.kind,
      });
    }

    loadModel(viewerRuntime).catch((error: unknown) => {
      if (!cancelled) {
        trackEvent("model_load_failed", {
          error_kind: errorKind(error),
          format,
          source_kind: modelSource.kind,
        });
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
