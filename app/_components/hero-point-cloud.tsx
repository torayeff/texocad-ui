"use client";

import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DynamicDrawUsage,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";

import {
  buildHeroPointData,
  HERO_POINT_COUNT,
} from "@/app/_lib/hero-point-shapes";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineSegment {
  hold: number;
  morph: number;
}

/** Hold/morph timing per shape, in buildHeroPointData order. */
const SEGMENTS: TimelineSegment[] = [
  { hold: 3.2, morph: 1.6 }, // drone
  { hold: 3.2, morph: 1.6 }, // headphones
  { hold: 3.2, morph: 1.6 }, // plane
  { hold: 3.2, morph: 1.6 }, // camera
  { hold: 3.2, morph: 1.6 }, // vase
];
const CYCLE_DURATION = SEGMENTS.reduce(
  (sum, segment) => sum + segment.hold + segment.morph,
  0,
);
const REDUCED_MOTION_TIME = SEGMENTS[0].hold / 2;

/** Tiny resting shimmer; kept low so held shapes stay crisp. */
const STATE_JITTER = 0.003;
/** Extra scatter at the midpoint of a morph for the dissolve effect. */
const MORPH_SCATTER = 0.055;
const STAGGER_SPREAD = 0.28;
const BOB_AMPLITUDE = 0.02;

interface TimelineSample {
  from: number;
  to: number;
  progress: number;
}

function sampleTimeline(cycleTime: number): TimelineSample {
  let start = 0;
  for (let index = 0; index < SEGMENTS.length; index++) {
    const segment = SEGMENTS[index];
    if (cycleTime < start + segment.hold) {
      return { from: index, to: index, progress: 0 };
    }
    if (cycleTime < start + segment.hold + segment.morph) {
      const next = (index + 1) % SEGMENTS.length;
      const progress = (cycleTime - start - segment.hold) / segment.morph;
      return { from: index, to: next, progress };
    }
    start += segment.hold + segment.morph;
  }
  return { from: 0, to: 0, progress: 0 };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

/** Indexed like SEGMENTS: drone, headphones, plane, camera, vase. */
const SHAPE_POSES: ShapePose[] = [
  { spin: 0.42, tiltX: -0.58, tiltZ: 0.08 },
  { spin: 0.45, tiltX: -0.22, tiltZ: 0.06 },
  { spin: 0.45, tiltX: -0.3, tiltZ: 0.2 },
  { spin: 0.42, tiltX: -0.28, tiltZ: 0.05 },
  { spin: 0.5, tiltX: -0.3, tiltZ: 0.05 },
];

const POSE_TRIG = SHAPE_POSES.map((pose) => ({
  cosX: Math.cos(pose.tiltX),
  sinX: Math.sin(pose.tiltX),
  cosZ: Math.cos(pose.tiltZ),
  sinZ: Math.sin(pose.tiltZ),
}));

// ---------------------------------------------------------------------------
// Palette — mid-tone colors that read on both light and dark backgrounds
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

interface HeroPalette {
  base: Rgb;
  teal: Rgb;
  blue: Rgb;
  spark: Rgb;
}

const HERO_PALETTE: HeroPalette = {
  base: [0.46, 0.52, 0.6],
  teal: [0.1, 0.62, 0.55],
  blue: [0.25, 0.5, 0.88],
  spark: [0.88, 0.95, 1],
};

const TINT_ORDER: (keyof HeroPalette)[] = ["base", "teal", "blue", "spark"];

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

/**
 * Round sprite with a bright core and a dark rim: the core keeps points
 * visible on dark backgrounds, the rim outlines them on light ones.
 */
function createDotTexture(): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.96)");
  gradient.addColorStop(0.55, "rgba(34,38,46,0.85)");
  gradient.addColorStop(0.78, "rgba(34,38,46,0.3)");
  gradient.addColorStop(1, "rgba(34,38,46,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

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
  const positions = new Float32Array(data.shapes[0]);
  const colors = new Float32Array(HERO_POINT_COUNT * 3);
  for (let index = 0; index < HERO_POINT_COUNT; index++) {
    const rgb = HERO_PALETTE[TINT_ORDER[data.tint[index]]];
    const brightness = 0.82 + data.stagger[index] * 0.32;
    const offset = index * 3;
    colors[offset] = Math.min(1, rgb[0] * brightness);
    colors[offset + 1] = Math.min(1, rgb[1] * brightness);
    colors[offset + 2] = Math.min(1, rgb[2] * brightness);
  }

  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(positions, 3);
  positionAttribute.setUsage(DynamicDrawUsage);
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  const texture = createDotTexture();
  const material = new PointsMaterial({
    size: 0.03,
    vertexColors: true,
    map: texture,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    sizeAttenuation: true,
    alphaTest: 0.01,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);

  const camera = new PerspectiveCamera(38, 1, 0.1, 24);
  camera.position.set(0, 0.08, 4.25);
  camera.lookAt(0, 0, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const scratchFrom: [number, number, number] = [0, 0, 0];
  const scratchTo: [number, number, number] = [0, 0, 0];

  const writeState = (
    state: number,
    index: number,
    elapsed: number,
    out: [number, number, number],
  ) => {
    const source = data.shapes[state];
    const offset = index * 3;
    let x = source[offset];
    let y = source[offset + 1];
    let z = source[offset + 2];

    const pose = SHAPE_POSES[state];
    const trig = POSE_TRIG[state];

    // Spin around the vertical axis.
    const angle = elapsed * pose.spin;
    const spinCos = Math.cos(angle);
    const spinSin = Math.sin(angle);
    const spunX = spinCos * x + spinSin * z;
    z = spinCos * z - spinSin * x;
    x = spunX;

    // Fixed presentation tilt: pitch, then roll.
    const tiltedY = trig.cosX * y - trig.sinX * z;
    z = trig.sinX * y + trig.cosX * z;
    y = tiltedY;
    if (trig.sinZ !== 0) {
      const rolledX = trig.cosZ * x - trig.sinZ * y;
      y = trig.sinZ * x + trig.cosZ * y;
      x = rolledX;
    }

    out[0] = x;
    out[1] = y + Math.sin(elapsed * 0.7 + state * 1.3) * BOB_AMPLITUDE;
    out[2] = z;
  };

  const update = (elapsed: number) => {
    const cycleTime = elapsed % CYCLE_DURATION;
    const sample = sampleTimeline(cycleTime);
    const morphing = sample.from !== sample.to;
    const scatter = morphing
      ? Math.sin(Math.PI * sample.progress) * MORPH_SCATTER
      : 0;
    const amplitude = STATE_JITTER + scatter;

    for (let index = 0; index < HERO_POINT_COUNT; index++) {
      writeState(sample.from, index, elapsed, scratchFrom);
      let eased = 0;

      if (morphing) {
        const local =
          (sample.progress - data.stagger[index] * STAGGER_SPREAD) /
          (1 - STAGGER_SPREAD);
        eased = easeInOutCubic(Math.min(1, Math.max(0, local)));
      }

      let x = scratchFrom[0];
      let y = scratchFrom[1];
      let z = scratchFrom[2];
      if (eased > 0) {
        writeState(sample.to, index, elapsed, scratchTo);
        x += (scratchTo[0] - x) * eased;
        y += (scratchTo[1] - y) * eased;
        z += (scratchTo[2] - z) * eased;
      }

      const offset = index * 3;
      positions[offset] =
        x + Math.sin(elapsed * 1.7 + index * 0.911) * amplitude;
      positions[offset + 1] =
        y + Math.sin(elapsed * 1.45 + index * 1.567) * amplitude * 0.85;
      positions[offset + 2] =
        z + Math.sin(elapsed * 1.95 + index * 2.317) * amplitude * 0.7;
    }
    positionAttribute.needsUpdate = true;
  };

  let frameId = 0;
  const startTime = performance.now();
  const renderFrame = (now: number) => {
    frameId = requestAnimationFrame(renderFrame);
    const elapsed = reducedMotionQuery.matches
      ? REDUCED_MOTION_TIME
      : (now - startTime) / 1000;
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
    texture?.dispose();
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
