import * as THREE from "three";

import type { RefObject } from "react";
import { setCameraView, fitCameraToObject } from "@/app/components/model-viewer/_lib/camera-view";
import { applyExplodeAmount, buildExplodeAssembly } from "@/app/components/model-viewer/_lib/explode-assembly";
import type { ExplodeAssembly } from "@/app/components/model-viewer/_lib/explode-assembly";
import type { ModelFormat, ViewPreset } from "@/app/types/model-viewer";
import type { ViewerRuntime } from "@/app/components/model-viewer/_types/viewer-runtime";

interface SetActiveViewOptions {
  activeViewRef: RefObject<ViewPreset>;
  fitDistanceRef: RefObject<number>;
  runtime: ViewerRuntime | null;
  setActiveViewState: (view: ViewPreset | null) => void;
  view: ViewPreset;
}

interface FitViewOptions {
  activeViewRef: RefObject<ViewPreset>;
  currentFormat: ModelFormat | null;
  currentExplodeAmount: number;
  explodeAssemblyRef: RefObject<ExplodeAssembly | null>;
  fitDistanceRef: RefObject<number>;
  model: THREE.Group | null;
  runtime: ViewerRuntime | null;
}

export function setSceneActiveView({
  activeViewRef,
  fitDistanceRef,
  runtime,
  setActiveViewState,
  view,
}: SetActiveViewOptions) {
  activeViewRef.current = view;
  setActiveViewState(view);

  if (runtime) {
    setCameraView(runtime.camera, runtime.controls, view, fitDistanceRef.current);
  }
}

export function fitSceneView({
  activeViewRef,
  currentExplodeAmount,
  currentFormat,
  explodeAssemblyRef,
  fitDistanceRef,
  model,
  runtime,
}: FitViewOptions) {
  if (!runtime || !model) {
    return;
  }

  applyExplodeAmount(explodeAssemblyRef.current, 0);
  fitDistanceRef.current = fitCameraToObject(
    runtime.camera,
    runtime.controls,
    model,
    activeViewRef.current,
  );

  if (currentFormat) {
    const assembly = buildExplodeAssembly(model, currentFormat);
    explodeAssemblyRef.current = assembly;
    applyExplodeAmount(assembly, currentExplodeAmount);
  }
}
