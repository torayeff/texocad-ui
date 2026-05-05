import * as THREE from "three";
import { type OrbitControls } from "three/addons/controls/OrbitControls.js";

import { type ModelFormat } from "@/app/studio-v2/_components/viewer/model-loader-types";
import { type ViewPreset } from "@/app/studio-v2/_components/viewer/model-viewer-state";

const eps = 1e-5;
const triadShaftLength = 16;
const triadShaftRadius = 0.7;
const triadHeadLength = 5;
const triadHeadRadius = 2;
const triadLabelDistance = 28;
const triadUp = new THREE.Vector3(0, 1, 0);

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

const viewDirections: Record<ViewPreset, [number, number, number]> = {
  iso: [1, -1, 0.8],
  top: [0, -eps, 1],
  front: [0, -1, 0],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  back: [0, 1, 0],
  bottom: [0, -eps, -1],
};

const triadAxes = ([
  { direction: [1, 0, 0] as const, color: "#ef4444", label: "X" },
  { direction: [0, 1, 0] as const, color: "#22c55e", label: "Y" },
  { direction: [0, 0, 1] as const, color: "#3b82f6", label: "Z" },
] as const).map(({ color, direction: [x, y, z], label }) => {
  const direction = new THREE.Vector3(x, y, z).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(triadUp, direction);

  return {
    color,
    label,
    quaternion,
    conePosition: direction.clone().multiplyScalar(triadShaftLength + triadHeadLength * 0.5),
    labelPosition: direction.clone().multiplyScalar(triadLabelDistance),
    shaftPosition: direction.clone().multiplyScalar(triadShaftLength * 0.5),
  };
});

interface ExplodePartObject {
  object: THREE.Object3D;
  originalWorldPosition: THREE.Vector3;
  parent: THREE.Object3D;
}

export interface ExplodeAssembly {
  parts: Array<{
    objects: ExplodePartObject[];
    targetOffset: THREE.Vector3;
  }>;
}

function createTriadLabelTexture(label: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create triad label texture.");
  }

  context.clearRect(0, 0, 64, 64);
  context.font = "bold 44px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(label, 32, 33);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

export function createAxisTriad() {
  const group = new THREE.Group();

  for (const { color, label, quaternion, shaftPosition, conePosition, labelPosition } of triadAxes) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(triadShaftRadius, triadShaftRadius, triadShaftLength, 10),
      new THREE.MeshBasicMaterial({ color, depthTest: false }),
    );
    shaft.position.copy(shaftPosition);
    shaft.quaternion.copy(quaternion);
    shaft.renderOrder = 10;
    group.add(shaft);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(triadHeadRadius, triadHeadLength, 14),
      new THREE.MeshBasicMaterial({ color, depthTest: false }),
    );
    cone.position.copy(conePosition);
    cone.quaternion.copy(quaternion);
    cone.renderOrder = 11;
    group.add(cone);

    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        depthTest: false,
        depthWrite: false,
        map: createTriadLabelTexture(label, color),
        transparent: true,
      }),
    );
    labelSprite.position.copy(labelPosition);
    labelSprite.renderOrder = 20;
    labelSprite.scale.set(10, 10, 10);
    group.add(labelSprite);
  }

  return group;
}

export function getIntersectionMaterial(intersection: THREE.Intersection): THREE.MeshStandardMaterial | null {
  if (!(intersection.object instanceof THREE.Mesh)) {
    return null;
  }

  const material = intersection.object.material;
  const intersectedMaterial = Array.isArray(material) ? material[intersection.face?.materialIndex ?? 0] : material;

  return intersectedMaterial instanceof THREE.MeshStandardMaterial ? intersectedMaterial : null;
}

export function collectPickableMeshes(object: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });
  return meshes;
}

function isStepEdgeOverlayFor(mesh: THREE.Mesh, object: THREE.Object3D | undefined) {
  return object instanceof THREE.Group && object.name === `${mesh.name || "mesh"} edges`;
}

function collectStepExplodeObjectGroups(root: THREE.Group) {
  const groups: THREE.Object3D[][] = [];

  root.children.forEach((object, index) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    const edgeOverlay = isStepEdgeOverlayFor(object, root.children[index + 1]) ? root.children[index + 1] : null;
    groups.push(edgeOverlay ? [object, edgeOverlay] : [object]);
  });

  return groups;
}

function collectExplodeObjectGroups(root: THREE.Group, format: ModelFormat) {
  switch (format) {
    case "step": {
      const stepGroups = collectStepExplodeObjectGroups(root);
      return stepGroups.length > 0 ? stepGroups : collectPickableMeshes(root).map((mesh) => [mesh]);
    }
    case "glb":
    case "stl":
      return collectPickableMeshes(root).map((mesh) => [mesh]);
    default:
      return assertNever(format, "Unhandled explode model format");
  }
}

function objectGroupBounds(objects: THREE.Object3D[]) {
  const bounds = new THREE.Box3().makeEmpty();
  for (const object of objects) {
    bounds.expandByObject(object);
  }

  return bounds;
}

function fallbackExplodeDirection(index: number, count: number) {
  const offset = 2 / Math.max(count, 1);
  const y = index * offset - 1 + offset * 0.5;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * Math.PI * (3 - Math.sqrt(5));

  return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).normalize();
}

interface ExplodePartTarget {
  center: THREE.Vector3;
  objects: ExplodePartObject[];
  radius: number;
  targetCenter: THREE.Vector3;
}

function enforceOutsideModel(parts: ExplodePartTarget[], modelCenter: THREE.Vector3, modelRadius: number, clearance: number) {
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const direction = part.targetCenter.clone().sub(modelCenter);
    if (direction.lengthSq() <= eps) {
      direction.copy(fallbackExplodeDirection(index, parts.length));
    } else {
      direction.normalize();
    }

    const minDistance = modelRadius + part.radius + clearance;
    if (part.targetCenter.distanceTo(modelCenter) < minDistance) {
      part.targetCenter.copy(modelCenter).addScaledVector(direction, minDistance);
    }
  }
}

function separateExplodeTargets(parts: ExplodePartTarget[], clearance: number) {
  for (let iteration = 0; iteration < 10; iteration += 1) {
    for (let firstIndex = 0; firstIndex < parts.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < parts.length; secondIndex += 1) {
        const first = parts[firstIndex];
        const second = parts[secondIndex];
        const delta = second.targetCenter.clone().sub(first.targetCenter);
        const minDistance = first.radius + second.radius + clearance;
        const distance = delta.length();

        if (distance >= minDistance) {
          continue;
        }

        const direction = distance > eps
          ? delta.divideScalar(distance)
          : fallbackExplodeDirection(firstIndex + secondIndex, parts.length);
        const pushDistance = (minDistance - distance) * 0.5;
        first.targetCenter.addScaledVector(direction, -pushDistance);
        second.targetCenter.addScaledVector(direction, pushDistance);
      }
    }
  }
}

export function buildExplodeAssembly(root: THREE.Group, format: ModelFormat): ExplodeAssembly {
  root.updateWorldMatrix(true, true);

  const modelBounds = new THREE.Box3().setFromObject(root);
  if (modelBounds.isEmpty()) {
    return { parts: [] };
  }

  const modelCenter = modelBounds.getCenter(new THREE.Vector3());
  const modelSphere = modelBounds.getBoundingSphere(new THREE.Sphere());
  const objectGroups = collectExplodeObjectGroups(root, format);
  if (objectGroups.length <= 1) {
    return { parts: [] };
  }

  const clearance = Math.max(modelSphere.radius * 0.04, 0.5);
  const partTargets = objectGroups.flatMap((objects, index) => {
    const partBounds = objectGroupBounds(objects);
    if (partBounds.isEmpty()) {
      return [];
    }

    const center = partBounds.getCenter(new THREE.Vector3());
    const sphere = partBounds.getBoundingSphere(new THREE.Sphere());
    const direction = center.clone().sub(modelCenter);
    if (direction.lengthSq() > eps) {
      direction.normalize();
    } else {
      direction.copy(fallbackExplodeDirection(index, objectGroups.length));
    }

    const distanceFromCenter = center.distanceTo(modelCenter);
    const outsideDistance = Math.max(
      modelSphere.radius + sphere.radius + clearance - distanceFromCenter,
      modelSphere.radius * 0.35,
    );

    return [{
      center,
      objects: objects.flatMap((object) => {
        const parent = object.parent;
        return parent
          ? [{
            object,
            originalWorldPosition: object.getWorldPosition(new THREE.Vector3()),
            parent,
          }]
          : [];
      }),
      radius: sphere.radius,
      targetCenter: center.clone().addScaledVector(direction, outsideDistance),
    }];
  });

  enforceOutsideModel(partTargets, modelCenter, modelSphere.radius, clearance);
  separateExplodeTargets(partTargets, clearance);
  enforceOutsideModel(partTargets, modelCenter, modelSphere.radius, clearance);

  return {
    parts: partTargets.map(({ center, objects, targetCenter }) => ({
      objects,
      targetOffset: targetCenter.sub(center),
    })),
  };
}

export function applyExplodeAmount(assembly: ExplodeAssembly | null, amount: number) {
  if (!assembly) {
    return;
  }

  const progress = THREE.MathUtils.clamp(amount, 0, 100) / 100;
  for (const part of assembly.parts) {
    const worldOffset = part.targetOffset.clone().multiplyScalar(progress);
    for (const { object, originalWorldPosition, parent } of part.objects) {
      parent.updateWorldMatrix(true, false);
      object.position.copy(parent.worldToLocal(originalWorldPosition.clone().add(worldOffset)));
    }
  }
}

function disposeTexture(texture: THREE.Texture, disposedTextures: Set<THREE.Texture>) {
  if (disposedTextures.has(texture)) {
    return;
  }

  disposedTextures.add(texture);
  const image = texture.image as { close?: () => void } | undefined;
  image?.close?.();
  texture.dispose();
}

function disposeMaterial(material: THREE.Material, disposedTextures: Set<THREE.Texture>) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      disposeTexture(value, disposedTextures);
    }
  }

  material.dispose();
}

export function disposeObject(object: THREE.Object3D) {
  const disposedTextures = new Set<THREE.Texture>();

  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
    }

    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        disposeMaterial(material, disposedTextures);
      }
    }

    if (child instanceof THREE.LineSegments) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        disposeMaterial(material, disposedTextures);
      }
    }

    if (child instanceof THREE.Sprite) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        disposeMaterial(material, disposedTextures);
      }
    }
  });
}

export function applyWireframe(object: THREE.Object3D, wireframe: boolean) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      const wireframeMaterial = material as THREE.Material & { wireframe?: boolean };
      if ("wireframe" in wireframeMaterial) {
        wireframeMaterial.wireframe = wireframe;
      }
    }
  });
}

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
  const fitDistance = sphere.radius / Math.sin(fitFov / 2);
  const distance = Math.max(fitDistance * 1.18, 30);

  object.position.sub(center);
  camera.near = Math.max(distance / 1000, 0.1);
  camera.far = distance * 100;
  controls.target.set(0, 0, 0);
  controls.maxDistance = distance * 8;
  setCameraView(camera, controls, view, distance);

  return distance;
}
