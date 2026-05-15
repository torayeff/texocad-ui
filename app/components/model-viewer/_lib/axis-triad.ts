import * as THREE from "three";

const triadShaftLength = 16;
const triadShaftRadius = 0.7;
const triadHeadLength = 5;
const triadHeadRadius = 2;
const triadLabelDistance = 28;
const triadUp = new THREE.Vector3(0, 1, 0);

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
