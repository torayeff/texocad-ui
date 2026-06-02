import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { ViewPreset } from "@/app/types/model-viewer";

const eps = 1e-5;
const fitPadding = 1.18;
const minimumFitRadius = 0.001;
const minimumCameraDistance = 0.01;
const minimumCameraFar = 10;
const minimumCameraNear = 0.0001;
const minimumControlsMaxDistance = 10;

const viewDirections: Record<ViewPreset, [number, number, number]> = {
  iso: [1, -1, 0.8],
  top: [0, -eps, 1],
  front: [0, -1, 0],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  back: [0, 1, 0],
  bottom: [0, -eps, -1],
};

export function setCameraView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  view: ViewPreset,
  distance: number,
) {
  const target = controls.target.clone();
  const direction = new THREE.Vector3(...viewDirections[view]).normalize();

  camera.up.set(0, 0, 1);
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  controls.update();
}

export function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
  view: ViewPreset,
) {
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.1));
  const fitFov = Math.min(verticalFov, horizontalFov);
  const radius = Number.isFinite(sphere.radius) ? Math.max(sphere.radius, minimumFitRadius) : minimumFitRadius;
  const fitDistance = radius / Math.sin(fitFov / 2);
  const distance = Math.max(fitDistance * fitPadding, minimumCameraDistance);

  object.position.sub(center);
  camera.near = Math.max(distance / 1000, minimumCameraNear);
  camera.far = Math.max(distance * 100, minimumCameraFar);
  controls.target.set(0, 0, 0);
  controls.maxDistance = Math.max(distance * 8, minimumControlsMaxDistance);
  setCameraView(camera, controls, view, distance);

  return distance;
}
