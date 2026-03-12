"use client";

import { useMemo, useEffect } from "react";
import * as THREE from "three";
import {
  TRIAD_AXES,
  SHAFT_RADIUS,
  SHAFT_LENGTH,
  HEAD_RADIUS,
  HEAD_LENGTH,
} from "@/app/studio/_lib/viewer-constants";

export function TriadLabel({
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

export function CadAxisTriad() {
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
