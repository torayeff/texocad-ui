"use client";

import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Matrix3,
  Matrix4,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

import type { HeroPointTargetId } from "@/app/_lib/hero-point-targets";
import {
  buildHeroPointData,
  HERO_POINT_COUNT,
  HERO_POINT_TARGETS,
} from "@/app/_lib/hero-point-targets";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const TARGET_COUNT = HERO_POINT_TARGETS.length;
const HOLD_DURATION = 3.6;
const MORPH_DURATION = 1.9;
const SEGMENT_DURATION = HOLD_DURATION + MORPH_DURATION;
const CYCLE_DURATION = SEGMENT_DURATION * TARGET_COUNT;
const REDUCED_MOTION_TIME = HOLD_DURATION / 2;

interface TimelineSample {
  from: number;
  to: number;
  progress: number;
}

function sampleTimeline(cycleTime: number): TimelineSample {
  const segment = Math.min(
    TARGET_COUNT - 1,
    Math.floor(cycleTime / SEGMENT_DURATION),
  );
  const local = cycleTime - segment * SEGMENT_DURATION;
  if (local < HOLD_DURATION) {
    return { from: segment, to: segment, progress: 0 };
  }
  return {
    from: segment,
    to: (segment + 1) % TARGET_COUNT,
    progress: (local - HOLD_DURATION) / MORPH_DURATION,
  };
}

// ---------------------------------------------------------------------------
// Per-shape presentation
// ---------------------------------------------------------------------------

interface ShapePose {
  /** Spin speed in rad/s around the vertical axis. */
  spin: number;
  tiltX: number;
  tiltZ: number;
}

/**
 * Radially symmetric parts (fan, bearing, gears) are pitched toward the
 * camera so spinning around Y reads as the part rotating on its own axis.
 */
const TARGET_POSES: Record<HeroPointTargetId, ShapePose> = {
  turbofan: { spin: 0.5, tiltX: -1.08, tiltZ: 0.08 },
  bolt: { spin: 0.85, tiltX: -0.3, tiltZ: 0.55 },
  gears: { spin: 0.45, tiltX: -0.92, tiltZ: 0.05 },
  drone: { spin: 0.4, tiltX: -0.45, tiltZ: 0 },
  bearing: { spin: 0.55, tiltX: -1.0, tiltZ: 0.14 },
  piston: { spin: 0.5, tiltX: -0.25, tiltZ: 0.08 },
  rocketEngine: { spin: 0.35, tiltX: -0.3, tiltZ: 0.12 },
};

const SHAPE_POSES: ShapePose[] = HERO_POINT_TARGETS.map(
  (target) => TARGET_POSES[target.id],
);

// ---------------------------------------------------------------------------
// Palette — monochrome: neutral grays varied only in brightness, so the
// cloud stays on-scheme and reads on both light and dark backgrounds
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

/** Indexed by the tint byte from buildHeroPointData. */
const HERO_PALETTE: Rgb[] = [
  [0.5, 0.5, 0.5],
  [0.36, 0.36, 0.36],
  [0.68, 0.68, 0.68],
  [0.92, 0.92, 0.92],
];

// ---------------------------------------------------------------------------
// Shaders — morph, stagger, swirl, and sprite shading all run on the GPU
// ---------------------------------------------------------------------------

const POINT_WORLD_SIZE = 0.013;

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 positionTo;
  attribute float aStagger;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPointScale;
  uniform mat3 uMatFrom;
  uniform mat3 uMatTo;

  varying vec3 vColor;
  varying float vFlight;
  varying float vFade;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
  }

  void main() {
    float spread = 0.34;
    float local = clamp((uProgress - aStagger * spread) / (1.0 - spread), 0.0, 1.0);
    float eased = easeInOutCubic(local);

    vec3 from = uMatFrom * position;
    vec3 to = uMatTo * positionTo;
    vec3 pos = mix(from, to, eased);

    // Each point dissolves, swirls, and reforms on its own flight envelope.
    float flight = sin(3.14159265 * eased);
    float seed = fract(aStagger * 61.17 + aSize * 13.73) * 6.2831853;
    vec3 drift = vec3(
      sin(uTime * 1.35 + seed + pos.y * 2.4),
      sin(uTime * 1.07 + seed * 1.7 + pos.x * 2.1),
      sin(uTime * 1.62 + seed * 2.3 + pos.z * 2.7)
    );
    pos += drift * (0.004 + flight * 0.11);
    pos += normalize(pos + vec3(1e-4)) * flight * (0.05 + 0.1 * aStagger);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = aSize * (1.0 + flight * 1.1) * uPointScale;
    gl_PointSize = clamp(size / -mvPosition.z, 1.25, 22.0);

    vColor = aColor;
    vFlight = flight;
    vFade = clamp((-mvPosition.z - 2.6) / 3.4, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/** Bright core keeps points visible on dark themes, dark rim on light ones. */
const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vFlight;
  varying float vFade;

  void main() {
    vec2 offset = gl_PointCoord - 0.5;
    float dist = length(offset);
    if (dist > 0.5) discard;

    float body = smoothstep(0.5, 0.3, dist);
    float core = smoothstep(0.17, 0.0, dist);
    float rim = smoothstep(0.3, 0.44, dist) * (1.0 - smoothstep(0.44, 0.5, dist));

    vec3 color = mix(vColor, vec3(1.0), core * (0.75 + vFlight * 0.25));
    color = mix(color, vec3(0.13), rim * 0.55);

    float alpha = body * (0.95 - vFade * 0.45);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

function createHeroPointCloud(container: HTMLElement): (() => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }

  const data = buildHeroPointData();
  const shapeAttributes = data.shapes.map(
    (shape) => new BufferAttribute(shape, 3),
  );

  const colors = new Float32Array(HERO_POINT_COUNT * 3);
  for (let index = 0; index < HERO_POINT_COUNT; index++) {
    const rgb = HERO_PALETTE[data.tint[index]];
    const brightness = 0.8 + data.stagger[index] * 0.35;
    colors[index * 3] = Math.min(1, rgb[0] * brightness);
    colors[index * 3 + 1] = Math.min(1, rgb[1] * brightness);
    colors[index * 3 + 2] = Math.min(1, rgb[2] * brightness);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("aStagger", new BufferAttribute(data.stagger, 1));
  geometry.setAttribute("aSize", new BufferAttribute(data.size, 1));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));

  let boundFrom = -1;
  let boundTo = -1;
  const bindShapes = (from: number, to: number) => {
    if (boundFrom !== from) {
      geometry.setAttribute("position", shapeAttributes[from]);
      boundFrom = from;
    }
    if (boundTo !== to) {
      geometry.setAttribute("positionTo", shapeAttributes[to]);
      boundTo = to;
    }
  };
  bindShapes(0, 0);

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPointScale: { value: 1 },
    uMatFrom: { value: new Matrix3() },
    uMatTo: { value: new Matrix3() },
  };

  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthWrite: false,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);

  const camera = new PerspectiveCamera(38, 1, 0.1, 24);
  camera.position.set(0, 0.06, 4.3);
  camera.lookAt(0, 0, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uPointScale.value =
      (POINT_WORLD_SIZE * height * pixelRatio) /
      (2 * Math.tan((camera.fov * Math.PI) / 360));
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const poseMatrix = new Matrix4();
  const scratchRotation = new Matrix4();
  const composePose = (state: number, elapsed: number, target: Matrix3) => {
    const pose = SHAPE_POSES[state];
    poseMatrix.makeRotationY(elapsed * pose.spin + state * 1.1);
    scratchRotation.makeRotationX(pose.tiltX);
    poseMatrix.premultiply(scratchRotation);
    if (pose.tiltZ !== 0) {
      scratchRotation.makeRotationZ(pose.tiltZ);
      poseMatrix.premultiply(scratchRotation);
    }
    target.setFromMatrix4(poseMatrix);
  };

  const update = (elapsed: number) => {
    const sample = sampleTimeline(elapsed % CYCLE_DURATION);
    bindShapes(sample.from, sample.to);

    composePose(sample.from, elapsed, uniforms.uMatFrom.value);
    if (sample.to === sample.from) {
      uniforms.uMatTo.value.copy(uniforms.uMatFrom.value);
    } else {
      composePose(sample.to, elapsed, uniforms.uMatTo.value);
    }

    uniforms.uTime.value = elapsed;
    uniforms.uProgress.value = sample.progress;
    points.position.y = Math.sin(elapsed * 0.55) * 0.025;

    camera.position.x = Math.sin(elapsed * 0.12) * 0.1;
    camera.position.y = 0.06 + Math.sin(elapsed * 0.09 + 1.7) * 0.05;
    camera.lookAt(0, 0, 0);
  };

  let frameId = 0;
  const startTime = performance.now();
  const renderFrame = (now: number) => {
    frameId = requestAnimationFrame(renderFrame);
    // The first RAF timestamp can predate startTime; clamp so the
    // timeline math never sees a negative time.
    const elapsed = reducedMotionQuery.matches
      ? REDUCED_MOTION_TIME
      : Math.max(0, (now - startTime) / 1000);
    update(elapsed);
    renderer.render(scene, camera);
  };
  frameId = requestAnimationFrame(renderFrame);

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    renderer.domElement.remove();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeroPointCloud() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const dispose = createHeroPointCloud(container);
    return () => {
      dispose?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative aspect-[6/5] w-full lg:aspect-auto lg:h-full lg:min-h-0"
    />
  );
}
