"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper } from "@react-three/drei";
import { STLLoader, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { CadAxisTriad } from "@/app/studio/_components/viewer/Triad";
import type { ViewCommand } from "@/app/studio/_types/viewer";
import {
  DEFAULT_RADIUS,
  VIEW_DIRECTIONS,
  GRID_ROTATION,
  ORBIT_MOUSE_BUTTONS,
} from "@/app/studio/_lib/viewer-constants";

THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export function Scene({
  url,
  viewCommand,
  showGrid,
  wireframe,
  autoRotate,
  isDark,
  onLoadError,
}: {
  url: string | null;
  viewCommand: ViewCommand | null;
  showGrid: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  isDark: boolean;
  onLoadError: (message: string | null) => void;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const getThree = useThree((s) => s.get);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const radiusRef = useRef(DEFAULT_RADIUS);
  const centerRef = useRef(new THREE.Vector3());

  const sectionColor = isDark ? "#374151" : "#d1d5db";
  const cellColor = isDark ? "#1f2937" : "#e5e7eb";

  const fitDistance = useCallback((r: number) => Math.max(r * 3.2, 30), []);

  const gridScale = radius > 100 ? Math.pow(10, Math.floor(Math.log10(radius / 50))) : 1;

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

  useEffect(() => {
    if (!url) {
      onLoadError(null);
      return;
    }

    onLoadError(null);
    const loader = new STLLoader();
    let cancelled = false;

    loader.load(
      url,
      (geo) => {
        if (cancelled) {
          geo.dispose();
          return;
        }
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        if (box) {
          const centerX = (box.min.x + box.max.x) * 0.5;
          const centerY = (box.min.y + box.max.y) * 0.5;
          geo.translate(-centerX, -centerY, -box.min.z);
        }
        geo.computeBoundingSphere();

        const sphere = geo.boundingSphere!;
        const r = sphere.radius || 50;
        radiusRef.current = r;
        centerRef.current.copy(sphere.center);
        setRadius(r);
        const dist = fitDistance(r);
        const center = centerRef.current;
        const camera = getThree().camera;
        const isoDir = new THREE.Vector3(...VIEW_DIRECTIONS.iso).normalize();
        camera.position.copy(center).addScaledVector(isoDir, dist);
        camera.lookAt(center);

        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
        }
        updateCameraBounds(r);
        onLoadError(null);

        setGeometry((prev) => {
          prev?.dispose();
          return geo;
        });
      },
      undefined,
      (err) => {
        if (!cancelled) {
          setGeometry((prev) => {
            prev?.dispose();
            return null;
          });
          onLoadError("Failed to load model. Try generating it again.");
          console.error("Failed to load STL:", err);
        }
      }
    );

    return () => {
      cancelled = true;
      setGeometry((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [url, getThree, fitDistance, onLoadError, updateCameraBounds]);

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
      {showGrid && (
        <Grid
          rotation={GRID_ROTATION}
          infiniteGrid
          sectionSize={10 * gridScale}
          sectionColor={sectionColor}
          cellSize={1 * gridScale}
          cellColor={cellColor}
          fadeDistance={Math.max(radius * 25, 150)}
          fadeStrength={1.5}
        />
      )}
      {geometry && (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.25}
            roughness={0.5}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      )}
      <GizmoHelper alignment="bottom-left" margin={[58, 58]} renderPriority={1}>
        <CadAxisTriad />
      </GizmoHelper>
    </>
  );
}
