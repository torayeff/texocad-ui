import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { type BrowserNodeEntry } from "@/app/studio/_components/viewer/model-viewer-browser-state";
import { type TransformMode } from "@/app/studio/_components/viewer/model-viewer-state";
import { type ViewerRuntime } from "@/app/studio/_components/viewer/use-three-renderer";

interface OriginalTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

interface UseTransformControlsOptions {
  browserNodeEntriesRef: RefObject<Map<string, BrowserNodeEntry>>;
  modelGroupRef: RefObject<THREE.Group | null>;
  onSelectNode: (nodeId: string | null) => void;
  runtimeRef: RefObject<ViewerRuntime | null>;
}

function findNodeIdForMesh(
  mesh: THREE.Mesh,
  entries: Map<string, BrowserNodeEntry>,
): string | null {
  for (const [id, entry] of entries) {
    if (entry.meshes.includes(mesh)) {
      return id;
    }
  }
  return null;
}

export function useTransformControls({
  browserNodeEntriesRef,
  modelGroupRef,
  onSelectNode: onSelectNodeCallback,
  runtimeRef,
}: UseTransformControlsOptions) {
  const transformControlsRef = useRef<TransformControls | null>(null);
  const selectedNodeIdRef = useRef<string | null>(null);
  const originalTransformsRef = useRef<Map<THREE.Object3D, OriginalTransform>>(new Map());
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const [transformMode, setTransformModeState] = useState<TransformMode>(null);
  const [selectedTransformNodeId, setSelectedTransformNodeId] = useState<string | null>(null);
  const [hasTransforms, setHasTransforms] = useState(false);

  const transformModeRef = useRef<TransformMode>(null);

  const getAttachTarget = useCallback((nodeId: string): THREE.Object3D | null => {
    const entry = browserNodeEntriesRef.current.get(nodeId);
    if (entry && entry.objects.length > 0) {
      return entry.objects[0];
    }
    return modelGroupRef.current;
  }, [browserNodeEntriesRef, modelGroupRef]);

  const storeOriginalTransform = useCallback((object: THREE.Object3D) => {
    if (!originalTransformsRef.current.has(object)) {
      originalTransformsRef.current.set(object, {
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
      });
    }
  }, []);

  const attachToObject = useCallback((nodeId: string) => {
    const tc = transformControlsRef.current;
    const runtime = runtimeRef.current;
    if (!tc || !runtime) return;

    const target = getAttachTarget(nodeId);
    if (!target) return;

    const entry = browserNodeEntriesRef.current.get(nodeId);
    if (entry) {
      for (const obj of entry.objects) {
        storeOriginalTransform(obj);
      }
    } else {
      storeOriginalTransform(target);
    }

    tc.attach(target);
    selectedNodeIdRef.current = nodeId;
    setSelectedTransformNodeId(nodeId);
  }, [browserNodeEntriesRef, getAttachTarget, runtimeRef, storeOriginalTransform]);

  const detach = useCallback(() => {
    const tc = transformControlsRef.current;
    if (tc) {
      tc.detach();
    }
    selectedNodeIdRef.current = null;
    setSelectedTransformNodeId(null);
    onSelectNodeCallback(null);
  }, [onSelectNodeCallback]);

  const setTransformMode = useCallback((mode: TransformMode) => {
    transformModeRef.current = mode;
    setTransformModeState(mode);

    const tc = transformControlsRef.current;
    if (!tc) return;

    if (mode === null) {
      detach();
      return;
    }

    tc.setMode(mode);

    if (selectedNodeIdRef.current) {
      attachToObject(selectedNodeIdRef.current);
    }
  }, [attachToObject, detach]);

  const selectNode = useCallback((nodeId: string | null) => {
    if (nodeId === null) {
      detach();
      return;
    }

    selectedNodeIdRef.current = nodeId;
    setSelectedTransformNodeId(nodeId);
    onSelectNodeCallback(nodeId);

    if (transformModeRef.current !== null) {
      attachToObject(nodeId);
    }
  }, [attachToObject, detach, onSelectNodeCallback]);

  const resetTransforms = useCallback(() => {
    const tc = transformControlsRef.current;
    if (tc) {
      tc.detach();
    }

    for (const [object, original] of originalTransformsRef.current) {
      object.position.copy(original.position);
      object.quaternion.copy(original.quaternion);
    }

    originalTransformsRef.current.clear();
    selectedNodeIdRef.current = null;
    setSelectedTransformNodeId(null);
    setHasTransforms(false);
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const { camera, controls, renderer, scene } = runtime;
    const tc = new TransformControls(camera, renderer.domElement);
    tc.setSize(0.75);

    const helper = tc.getHelper();
    helper.traverse((child) => {
      if ("material" in child) {
        const mat = child.material as THREE.LineBasicMaterial | THREE.MeshBasicMaterial;
        if (mat.color && mat.color.getHex() === 0xffffff) {
          mat.color.setHex(0x888888);
        }
      }
    });

    scene.add(helper);
    transformControlsRef.current = tc;

    const handleDraggingChanged = (event: { value: boolean }) => {
      const dragging = event.value;
      isDraggingRef.current = dragging;
      controls.enabled = !dragging;
    };

    const handleObjectChange = () => {
      setHasTransforms(true);

      const nodeId = selectedNodeIdRef.current;
      if (!nodeId) return;

      const entry = browserNodeEntriesRef.current.get(nodeId);
      if (!entry || entry.objects.length <= 1) return;

      const primary = entry.objects[0];
      for (let i = 1; i < entry.objects.length; i++) {
        entry.objects[i].position.copy(primary.position);
        entry.objects[i].quaternion.copy(primary.quaternion);
      }
    };

    tc.addEventListener("dragging-changed", handleDraggingChanged as (event: unknown) => void);
    tc.addEventListener("objectChange", handleObjectChange);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clickThreshold = 4;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (isDraggingRef.current) return;

      const downPos = pointerDownPosRef.current;
      pointerDownPosRef.current = null;
      if (!downPos) return;

      const dx = event.clientX - downPos.x;
      const dy = event.clientY - downPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > clickThreshold) return;

      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const entries = browserNodeEntriesRef.current;
      const allMeshes: THREE.Mesh[] = [];
      for (const entry of entries.values()) {
        for (const mesh of entry.meshes) {
          if (mesh.visible) allMeshes.push(mesh);
        }
      }

      if (allMeshes.length === 0 && modelGroupRef.current) {
        const modelMeshes: THREE.Mesh[] = [];
        modelGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.visible) modelMeshes.push(child);
        });
        const [hit] = raycaster.intersectObjects(modelMeshes, false);
        if (hit) {
          selectNode("__model__");
        } else {
          detach();
        }
        return;
      }

      const [hit] = raycaster.intersectObjects(allMeshes, false);
      if (!hit || !(hit.object instanceof THREE.Mesh)) {
        detach();
        return;
      }

      if (event.shiftKey && modelGroupRef.current) {
        selectNode("__model__");
        return;
      }

      const nodeId = findNodeIdForMesh(hit.object, entries);
      if (nodeId) {
        selectNode(nodeId);
      } else {
        detach();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      switch (event.key.toLowerCase()) {
        case "g":
          setTransformMode(transformModeRef.current === "translate" ? null : "translate");
          break;
        case "r":
          setTransformMode(transformModeRef.current === "rotate" ? null : "rotate");
          break;
        case "escape":
          setTransformMode(null);
          break;
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      tc.removeEventListener("dragging-changed", handleDraggingChanged as (event: unknown) => void);
      tc.removeEventListener("objectChange", handleObjectChange);
      tc.detach();
      scene.remove(tc.getHelper());
      tc.dispose();
      transformControlsRef.current = null;
    };
  }, [runtimeRef, browserNodeEntriesRef, modelGroupRef, selectNode, detach, setTransformMode]);

  return {
    detachTransform: detach,
    hasTransforms,
    resetTransforms,
    selectTransformNode: selectNode,
    selectedTransformNodeId,
    setTransformMode,
    transformMode,
  };
}
