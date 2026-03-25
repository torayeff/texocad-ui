"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, GizmoHelper } from "@react-three/drei";
import { STLLoader, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { CadAxisTriad } from "@/app/studio/_components/viewer/Triad";
import type { ViewCommand, ViewerPart } from "@/app/studio/_types/viewer";
import {
  DEFAULT_RADIUS,
  VIEW_DIRECTIONS,
  ORBIT_MOUSE_BUTTONS,
} from "@/app/studio/_lib/viewer-constants";

THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

interface LoadedGeometry {
  name: string;
  geometry: THREE.BufferGeometry;
  color: string;
}

export function Scene({
  parts,
  visibilityMap,
  viewCommand,
  wireframe,
  autoRotate,
  onLoadError,
  onLoadingChange,
}: {
  parts: ViewerPart[];
  visibilityMap: Record<string, boolean>;
  viewCommand: ViewCommand | null;
  wireframe: boolean;
  autoRotate: boolean;
  onLoadError: (message: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const [geometries, setGeometries] = useState<LoadedGeometry[]>([]);
  const getThree = useThree((s) => s.get);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const radiusRef = useRef(DEFAULT_RADIUS);
  const centerRef = useRef(new THREE.Vector3());

  const fitDistance = useCallback((r: number) => Math.max(r * 3.2, 30), []);

  const updateCameraBounds = useCallback(
    (r: number) => {
      const controls = controlsRef.current;
      if (controls) {
        controls.minDistance = Math.max(r * 0.15, 0.5);
        controls.maxDistance = Math.max(r * 25, 60);
      }

      const cam = getThree().camera as THREE.PerspectiveCamera;
      if (cam.isPerspectiveCamera) {
        cam.near = Math.max(r / 1000, 0.01);
        cam.far = Math.max(r * 250, 2000);
        cam.updateProjectionMatrix();
      }
    },
    [getThree]
  );

  const fitCurrentView = useCallback(() => {
    const camera = getThree().camera;
    const controls = controlsRef.current;
    const center = centerRef.current;
    const dir = camera.position.clone().sub(center);
    if (dir.lengthSq() < 1e-8) dir.set(...VIEW_DIRECTIONS.iso);

    const r = radiusRef.current;
    const dist = fitDistance(r);
    camera.position.copy(center).addScaledVector(dir.normalize(), dist);
    camera.lookAt(center);

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }

    updateCameraBounds(r);
  }, [getThree, fitDistance, updateCameraBounds]);

  const fitToGeometries = useCallback(
    (loaded: LoadedGeometry[]) => {
      if (loaded.length === 0) {
        radiusRef.current = DEFAULT_RADIUS;
        centerRef.current.set(0, 0, 0);
        return;
      }

      const combinedBox = new THREE.Box3();
      for (const { geometry } of loaded) {
        geometry.computeBoundingBox();
        if (geometry.boundingBox) combinedBox.union(geometry.boundingBox);
      }

      const center = new THREE.Vector3();
      combinedBox.getCenter(center);
      const size = new THREE.Vector3();
      combinedBox.getSize(size);
      const r = Math.max(size.length() * 0.5, 1);

      radiusRef.current = r;
      centerRef.current.copy(center);

      const dist = fitDistance(r);
      const camera = getThree().camera;
      const isoDir = new THREE.Vector3(...VIEW_DIRECTIONS.iso).normalize();
      camera.position.copy(center).addScaledVector(isoDir, dist);
      camera.lookAt(center);

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
      updateCameraBounds(r);
    },
    [getThree, fitDistance, updateCameraBounds],
  );

  useEffect(() => {
    const stlParts = parts.filter((p) => p.stlUrl);
    if (stlParts.length === 0) {
      onLoadError(null);
      onLoadingChange(false);
      return;
    }

    onLoadError(null);
    onLoadingChange(true);
    const loader = new STLLoader();
    let cancelled = false;

    const promises = stlParts.map(
      (part) =>
        new Promise<LoadedGeometry | null>((resolve) => {
          loader.load(
            part.stlUrl!,
            (geo) => {
              if (cancelled) {
                geo.dispose();
                resolve(null);
                return;
              }
              geo.computeVertexNormals();
              resolve({ name: part.name, geometry: geo, color: part.color });
            },
            undefined,
            (err) => {
              console.error(`Failed to load STL for part "${part.name}":`, err);
              resolve(null);
            },
          );
        }),
    );

    Promise.all(promises).then((results) => {
      if (cancelled) {
        for (const r of results) r?.geometry.dispose();
        return;
      }

      const loaded = results.filter((r): r is LoadedGeometry => r !== null);
      if (loaded.length === 0) {
        onLoadError("Failed to load models. Try generating again.");
        onLoadingChange(false);
        setGeometries((prev) => {
          for (const g of prev) g.geometry.dispose();
          return [];
        });
        return;
      }

      onLoadError(null);
      onLoadingChange(false);

      setGeometries((prev) => {
        for (const g of prev) g.geometry.dispose();
        return loaded;
      });

      fitToGeometries(loaded);
    });

    return () => {
      cancelled = true;
      onLoadingChange(false);
      setGeometries((prev) => {
        for (const g of prev) g.geometry.dispose();
        return [];
      });
    };
  }, [parts, onLoadError, onLoadingChange, fitToGeometries]);

  useEffect(() => {
    if (!viewCommand) return;
    if (viewCommand.kind === "fit") {
      fitCurrentView();
      return;
    }

    const camera = getThree().camera;
    const nextView = viewCommand.view ?? "iso";
    const r = radiusRef.current;
    const dist = fitDistance(r);
    const center = centerRef.current;

    camera.up.set(0, 0, 1);

    const dir = new THREE.Vector3(...VIEW_DIRECTIONS[nextView]).normalize();
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
    updateCameraBounds(r);
  }, [viewCommand, getThree, fitDistance, fitCurrentView, updateCameraBounds]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        rotateSpeed={0.7}
        zoomSpeed={0.9}
        panSpeed={0.8}
        screenSpacePanning={true}
        zoomToCursor
        mouseButtons={ORBIT_MOUSE_BUTTONS}
      />
      {geometries.map((entry) => (
        <mesh
          key={entry.name}
          geometry={entry.geometry}
          visible={visibilityMap[entry.name] !== false}
        >
          <meshStandardMaterial
            color={entry.color}
            metalness={0.25}
            roughness={0.5}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      ))}
      <GizmoHelper alignment="bottom-left" margin={[58, 58]} renderPriority={1}>
        <CadAxisTriad />
      </GizmoHelper>
    </>
  );
}
