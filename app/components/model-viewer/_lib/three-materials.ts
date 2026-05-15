import * as THREE from "three";

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
