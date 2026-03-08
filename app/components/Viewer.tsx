"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  GizmoHelper,
} from "@react-three/drei";
import { STLLoader, OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Maximize2, Grid3x3, Box, RotateCw, Download } from "lucide-react";
import { API_BASE } from "@/app/lib/config";
import { useMounted } from "@/app/lib/use-mounted";

THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

type ViewPreset =
  | "iso"
  | "top"
  | "front"
  | "right"
  | "left"
  | "back"
  | "bottom";

const VIEW_LABELS: Record<ViewPreset, string> = {
  iso: "Iso",
  front: "Front",
  back: "Back",
  top: "Top",
  bottom: "Bottom",
  left: "Left",
  right: "Right",
};

const EPS = 1e-5;

const VIEW_DIRECTIONS: Record<ViewPreset, [number, number, number]> = {
  iso: [1, -1, 0.8],
  top: [0, -EPS, 1],
  front: [0, -1, 0],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  back: [0, 1, 0],
  bottom: [0, -EPS, -1],
};

interface ViewCommand {
  kind: "view" | "fit";
  view?: ViewPreset;
  id: number;
}

const SHAFT_LENGTH = 16;
const SHAFT_RADIUS = 0.7;
const HEAD_LENGTH = 5;
const HEAD_RADIUS = 2;
const LABEL_DISTANCE = 28;

const DEFAULT_RADIUS = 50;
const INITIAL_CAMERA_POS = new THREE.Vector3(...VIEW_DIRECTIONS.iso)
  .normalize()
  .multiplyScalar(DEFAULT_RADIUS * 3.2)
  .toArray() as [number, number, number];

const GRID_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0];

const ORBIT_MOUSE_BUTTONS = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN,
} as const;

const TRIAD_UP = new THREE.Vector3(0, 1, 0);

const TRIAD_AXES = ([
  { dir: [1, 0, 0] as const, color: "#ef4444", label: "X" },
  { dir: [0, 1, 0] as const, color: "#22c55e", label: "Y" },
  { dir: [0, 0, 1] as const, color: "#3b82f6", label: "Z" },
] as const).map(({ dir: [x, y, z], color, label }) => {
  const dir = new THREE.Vector3(x, y, z).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(TRIAD_UP, dir);
  const shaftPos: [number, number, number] = [
    dir.x * (SHAFT_LENGTH * 0.5),
    dir.y * (SHAFT_LENGTH * 0.5),
    dir.z * (SHAFT_LENGTH * 0.5),
  ];
  const conePos: [number, number, number] = [
    dir.x * (SHAFT_LENGTH + HEAD_LENGTH * 0.5),
    dir.y * (SHAFT_LENGTH + HEAD_LENGTH * 0.5),
    dir.z * (SHAFT_LENGTH + HEAD_LENGTH * 0.5),
  ];
  const labelPos: [number, number, number] = [
    dir.x * LABEL_DISTANCE,
    dir.y * LABEL_DISTANCE,
    dir.z * LABEL_DISTANCE,
  ];
  return { color, label, quat, shaftPos, conePos, labelPos };
});

function TriadLabel({
  label,
  color,
  position,
}: {
  label: string;
  color: string;
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 64, 64);
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(label, 32, 33);
    return new THREE.CanvasTexture(canvas);
  }, [color, label]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position} scale={[10, 10, 10]} renderOrder={20}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

function CadAxisTriad() {
  return (
    <group>
      {TRIAD_AXES.map(({ color, label, quat, shaftPos, conePos, labelPos }) => (
        <group key={label}>
          <mesh position={shaftPos} quaternion={quat} renderOrder={10}>
            <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, SHAFT_LENGTH, 10]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
          <mesh position={conePos} quaternion={quat} renderOrder={11}>
            <coneGeometry args={[HEAD_RADIUS, HEAD_LENGTH, 14]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
          <TriadLabel label={label} color={color} position={labelPos} />
        </group>
      ))}
    </group>
  );
}

function Scene({
  url,
  viewCommand,
  showGrid,
  wireframe,
  autoRotate,
  isDark,
}: {
  url: string | null;
  viewCommand: ViewCommand | null;
  showGrid: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  isDark: boolean;
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
    if (!url) return;
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

        setGeometry((prev) => {
          prev?.dispose();
          return geo;
        });
      },
      undefined,
      (err) => {
        if (!cancelled) console.error("Failed to load STL:", err);
      }
    );

    return () => {
      cancelled = true;
      setGeometry((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [url, getThree, fitDistance, updateCameraBounds]);

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

export default function Viewer({
  stlUrl,
  currentModel,
}: {
  stlUrl: string | null;
  currentModel: { filename: string; threadId: string } | null;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const [viewCommand, setViewCommand] = useState<ViewCommand | null>(null);
  const [activeView, setActiveView] = useState<ViewPreset>("iso");
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const cmdIdRef = useRef(0);
  const [prevStlUrl, setPrevStlUrl] = useState(stlUrl);

  if (stlUrl !== prevStlUrl) {
    setPrevStlUrl(stlUrl);
    setViewCommand(null);
    setActiveView("iso");
  }

  const isDark = mounted && resolvedTheme === "dark";
  const bgColor = isDark ? "#09090b" : "#f4f4f5";

  const setView = useCallback((view: ViewPreset) => {
    setActiveView(view);
    setViewCommand({ kind: "view", view, id: ++cmdIdRef.current });
  }, []);

  const fitView = useCallback(() => {
    setViewCommand({ kind: "fit", id: ++cmdIdRef.current });
  }, []);

  const handleDownload = (format: "stl" | "step") => {
    if (!currentModel) return;
    const ext = format === "stl" ? ".stl" : ".step";
    const filename = currentModel.filename.replace(/\.[^/.]+$/, ext);
    const url = `${API_BASE}/api/files/${currentModel.threadId}/${filename}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative h-full w-full" style={{ background: bgColor }}>
      {/* View preset bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-1 shadow-sm">
        {(Object.keys(VIEW_LABELS) as ViewPreset[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`cursor-pointer px-2.5 py-1 text-xs font-medium rounded transition-colors ${activeView === v
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      {/* Download buttons */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          onClick={() => handleDownload("stl")}
          disabled={!currentModel}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card/80 backdrop-blur-sm border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download size={13} />
          STL
        </button>
        <button
          onClick={() => handleDownload("step")}
          disabled={!currentModel}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card/80 backdrop-blur-sm border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download size={13} />
          STEP
        </button>
      </div>

      {/* Left toolbar */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-0.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-1 shadow-sm">
        <button
          onClick={fitView}
          title="Fit View"
          className="cursor-pointer p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
        </button>
        <div className="w-4 h-px bg-border/60 my-0.5" />
        <button
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Grid"
          className={`cursor-pointer p-1.5 rounded transition-colors hover:bg-muted ${showGrid
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Grid3x3 size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setWireframe((w) => !w)}
          title="Toggle Wireframe"
          className={`cursor-pointer p-1.5 rounded transition-colors hover:bg-muted ${wireframe
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Box size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setAutoRotate((r) => !r)}
          title="Toggle Auto Rotate"
          className={`cursor-pointer p-1.5 rounded transition-colors hover:bg-muted ${autoRotate
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <RotateCw size={14} strokeWidth={1.75} />
        </button>
      </div>

      <Canvas camera={{ position: INITIAL_CAMERA_POS, fov: 50 }}>
        <ambientLight intensity={isDark ? 0.4 : 0.6} />
        <directionalLight position={[10, 10, 5]} intensity={isDark ? 0.8 : 1} />
        <directionalLight
          position={[-5, -5, -5]}
          intensity={isDark ? 0.3 : 0.4}
        />
        <Scene
          key={stlUrl ?? "empty"}
          url={stlUrl}
          viewCommand={viewCommand}
          showGrid={showGrid}
          wireframe={wireframe}
          autoRotate={autoRotate}
          isDark={isDark}
        />
      </Canvas>

      {!stlUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No model loaded. Generate one in the chat.
          </p>
        </div>
      )}

      {/* Mouse control hint */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 text-[10px] text-muted-foreground/40 select-none">
        <span>Drag to orbit</span>
        <span className="opacity-50">·</span>
        <span>Middle/right-drag to pan</span>
        <span className="opacity-50">·</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
}
