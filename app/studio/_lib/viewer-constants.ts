import type { ViewPreset } from "@/app/studio/_types/viewer";
import * as THREE from "three";

export const VIEW_LABELS: Record<ViewPreset, string> = {
  iso: "Iso",
  front: "Front",
  back: "Back",
  top: "Top",
  bottom: "Bottom",
  left: "Left",
  right: "Right",
};

const EPS = 1e-5;

export const VIEW_DIRECTIONS: Record<ViewPreset, [number, number, number]> = {
  iso: [1, -1, 0.8],
  top: [0, -EPS, 1],
  front: [0, -1, 0],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  back: [0, 1, 0],
  bottom: [0, -EPS, -1],
};

export const SHAFT_LENGTH = 16;
export const SHAFT_RADIUS = 0.7;
export const HEAD_LENGTH = 5;
export const HEAD_RADIUS = 2;
const LABEL_DISTANCE = 28;

export const DEFAULT_RADIUS = 50;

export const INITIAL_CAMERA_POS = new THREE.Vector3(...VIEW_DIRECTIONS.iso)
  .normalize()
  .multiplyScalar(DEFAULT_RADIUS * 3.2)
  .toArray() as [number, number, number];

export const ORBIT_MOUSE_BUTTONS = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN,
} as const;

export const PART_COLORS = [
  "#94a3b8", "#60a5fa", "#34d399", "#fbbf24",
  "#f87171", "#a78bfa", "#fb923c", "#2dd4bf",
];

const TRIAD_UP = new THREE.Vector3(0, 1, 0);

export const TRIAD_AXES = ([
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
