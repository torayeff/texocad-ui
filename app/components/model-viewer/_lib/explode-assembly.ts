import * as THREE from "three";

import { collectPickableMeshes } from "@/app/components/model-viewer/_lib/three-materials";
import type { ModelFormat } from "@/app/types/model-viewer";

const eps = 1e-5;

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

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
