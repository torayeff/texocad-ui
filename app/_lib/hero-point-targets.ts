/**
 * Point-cloud targets for the home-page hero.
 *
 * Each target is assembled from real three.js geometries (lathes, extrudes,
 * tubes, primitives) and converted to a point cloud by area-weighted surface
 * sampling, so the result reads like a laser scan of an actual part rather
 * than hand-placed dots.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Curve,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Path,
  PlaneGeometry,
  RingGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";

export const HERO_POINT_COUNT = 6200;

export const HERO_POINT_TARGETS = [
  { id: "turbofan", label: "Turbofan stage" },
  { id: "bolt", label: "Hex bolt" },
  { id: "gears", label: "Gear pair" },
  { id: "drone", label: "Quadcopter drone" },
  { id: "bearing", label: "Ball bearing" },
  { id: "piston", label: "Piston and crank" },
  { id: "rocketEngine", label: "Rocket engine" },
] as const;

export type HeroPointTargetId = (typeof HERO_POINT_TARGETS)[number]["id"];

export interface HeroPointData {
  /** Targets in HERO_POINT_TARGETS order. */
  shapes: Float32Array[];
  /** Per-point 0..1 random used for morph stagger and shader hashing. */
  stagger: Float32Array;
  /** Per-point sprite size multiplier. */
  size: Float32Array;
  /** Per-point palette group: 0 base, 1 dim, 2 light, 3 spark. */
  tint: Uint8Array;
}

const TAU = Math.PI * 2;

/** Deterministic mulberry32 PRNG so every visitor sees the same cloud. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function lowerBound(values: ArrayLike<number>, pick: number): number {
  let lo = 0;
  let hi = values.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] < pick) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// Surface sampling
// ---------------------------------------------------------------------------

interface ShapePart {
  geometry: BufferGeometry;
  /** Sampling density multiplier; >1 keeps thin details visible. */
  weight?: number;
}

interface PartTransform {
  scale?: [number, number, number];
  /** Euler angles applied in X, Y, Z order. */
  rotate?: [number, number, number];
  position?: [number, number, number];
  weight?: number;
}

function part(geometry: BufferGeometry, transform: PartTransform = {}): ShapePart {
  const { scale, rotate, position, weight = 1 } = transform;
  if (scale) geometry.scale(scale[0], scale[1], scale[2]);
  if (rotate) {
    if (rotate[0] !== 0) geometry.rotateX(rotate[0]);
    if (rotate[1] !== 0) geometry.rotateY(rotate[1]);
    if (rotate[2] !== 0) geometry.rotateZ(rotate[2]);
  }
  if (position) geometry.translate(position[0], position[1], position[2]);
  return { geometry, weight };
}

/**
 * Converts an assembly of meshes into HERO_POINT_COUNT surface points.
 * Triangles are picked proportionally to weighted area, then sampled with
 * uniform barycentric coordinates, which is what gives the even, scan-like
 * point distribution.
 */
function samplePoints(parts: ShapePart[], random: () => number): Float32Array {
  const sources: { positions: Float32Array; weight: number }[] = [];
  let vertexCount = 0;

  for (const { geometry, weight = 1 } of parts) {
    const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
    const attribute = expanded.attributes.position;
    const copy = new Float32Array(attribute.count * 3);
    for (let vertex = 0; vertex < attribute.count; vertex++) {
      copy[vertex * 3] = attribute.getX(vertex);
      copy[vertex * 3 + 1] = attribute.getY(vertex);
      copy[vertex * 3 + 2] = attribute.getZ(vertex);
    }
    sources.push({ positions: copy, weight });
    vertexCount += attribute.count;
    if (expanded !== geometry) expanded.dispose();
    geometry.dispose();
  }

  const soup = new Float32Array(vertexCount * 3);
  const cumulative = new Float64Array(vertexCount / 3);
  let writeOffset = 0;
  let triangle = 0;
  let totalArea = 0;

  for (const { positions, weight } of sources) {
    soup.set(positions, writeOffset);
    for (let v = 0; v < positions.length; v += 9) {
      const abx = positions[v + 3] - positions[v];
      const aby = positions[v + 4] - positions[v + 1];
      const abz = positions[v + 5] - positions[v + 2];
      const acx = positions[v + 6] - positions[v];
      const acy = positions[v + 7] - positions[v + 1];
      const acz = positions[v + 8] - positions[v + 2];
      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;
      const area = Math.hypot(crossX, crossY, crossZ) / 2;
      totalArea += area * weight;
      cumulative[triangle++] = totalArea;
    }
    writeOffset += positions.length;
  }

  const out = new Float32Array(HERO_POINT_COUNT * 3);
  for (let point = 0; point < HERO_POINT_COUNT; point++) {
    const tri = lowerBound(cumulative, random() * totalArea);
    const offset = tri * 9;
    const r1 = Math.sqrt(random());
    const r2 = random();
    const wa = 1 - r1;
    const wb = r1 * (1 - r2);
    const wc = r1 * r2;
    out[point * 3] =
      wa * soup[offset] + wb * soup[offset + 3] + wc * soup[offset + 6];
    out[point * 3 + 1] =
      wa * soup[offset + 1] + wb * soup[offset + 4] + wc * soup[offset + 7];
    out[point * 3 + 2] =
      wa * soup[offset + 2] + wb * soup[offset + 5] + wc * soup[offset + 8];
  }
  return out;
}

/** Centers the cloud on its bounding box and scales it to a shared radius. */
function normalizePoints(points: Float32Array, fitRadius: number): Float32Array {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
    minZ = Math.min(minZ, points[i + 2]);
    maxZ = Math.max(maxZ, points[i + 2]);
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  let maxRadiusSq = 0;
  for (let i = 0; i < points.length; i += 3) {
    const dx = points[i] - centerX;
    const dy = points[i + 1] - centerY;
    const dz = points[i + 2] - centerZ;
    maxRadiusSq = Math.max(maxRadiusSq, dx * dx + dy * dy + dz * dz);
  }
  const scale = fitRadius / Math.sqrt(maxRadiusSq);

  for (let i = 0; i < points.length; i += 3) {
    points[i] = (points[i] - centerX) * scale;
    points[i + 1] = (points[i + 1] - centerY) * scale;
    points[i + 2] = (points[i + 2] - centerZ) * scale;
  }
  return points;
}

// ---------------------------------------------------------------------------
// Shared curve helpers
// ---------------------------------------------------------------------------

class HelixCurve extends Curve<Vector3> {
  private readonly radius: number;
  private readonly yStart: number;
  private readonly yEnd: number;
  private readonly turns: number;

  constructor(radius: number, yStart: number, yEnd: number, turns: number) {
    super();
    this.radius = radius;
    this.yStart = yStart;
    this.yEnd = yEnd;
    this.turns = turns;
  }

  override getPoint(t: number, optionalTarget = new Vector3()): Vector3 {
    const angle = t * this.turns * TAU;
    return optionalTarget.set(
      Math.cos(angle) * this.radius,
      this.yStart + (this.yEnd - this.yStart) * t,
      Math.sin(angle) * this.radius,
    );
  }
}

// ---------------------------------------------------------------------------
// 1. Turbofan stage — spinner cone, 16 twisted blades, nacelle ring
// ---------------------------------------------------------------------------

function fanBladeGeometry(): BufferGeometry {
  const span = 0.62;
  const geometry = new PlaneGeometry(0.2, span, 2, 12);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const chord = positions.getX(i);
    const along = positions.getY(i);
    const t = (along + span / 2) / span;
    const widened = chord * (0.7 + t * 0.75);
    const pitch = 1.05 - t * 0.6;
    positions.setXYZ(i, Math.cos(pitch) * widened, along, Math.sin(pitch) * widened);
  }
  geometry.rotateZ(-Math.PI / 2);
  geometry.translate(0.56, 0, 0);
  return geometry;
}

function buildTurbofanTarget(random: () => number): Float32Array {
  const parts: ShapePart[] = [
    part(new CylinderGeometry(0.02, 0.2, 0.42, 32), { position: [0, 0.33, 0] }),
    part(new CylinderGeometry(0.2, 0.26, 0.24, 32)),
    part(new CylinderGeometry(1.05, 1.05, 0.34, 80, 1, true), { weight: 0.8 }),
    part(new CylinderGeometry(0.98, 0.98, 0.34, 80, 1, true), { weight: 0.8 }),
    part(new TorusGeometry(1.015, 0.036, 10, 80), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 0.17, 0],
    }),
    part(new TorusGeometry(1.015, 0.036, 10, 80), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -0.17, 0],
    }),
  ];

  for (let blade = 0; blade < 16; blade++) {
    const geometry = fanBladeGeometry();
    geometry.rotateY((blade / 16) * TAU);
    parts.push({ geometry, weight: 1.6 });
  }

  return normalizePoints(samplePoints(parts, random), 1.04);
}

// ---------------------------------------------------------------------------
// 2. Hex bolt — hex head, washer flange, shank, helical thread
// ---------------------------------------------------------------------------

function buildBoltTarget(random: () => number): Float32Array {
  const thread = new HelixCurve(0.165, 0.08, -0.82, 11);
  const parts: ShapePart[] = [
    part(new CylinderGeometry(0.3, 0.3, 0.2, 6), { position: [0, 0.78, 0] }),
    part(new CylinderGeometry(0.22, 0.3, 0.07, 24), { position: [0, 0.915, 0] }),
    part(new CylinderGeometry(0.36, 0.36, 0.05, 32), { position: [0, 0.655, 0] }),
    part(new CylinderGeometry(0.155, 0.155, 0.55, 28, 1, true), {
      position: [0, 0.355, 0],
    }),
    part(new CylinderGeometry(0.145, 0.145, 0.92, 28, 1, true), {
      position: [0, -0.38, 0],
    }),
    { geometry: new TubeGeometry(thread, 420, 0.024, 8), weight: 1.15 },
    part(new CylinderGeometry(0.08, 0.145, 0.1, 24), { position: [0, -0.89, 0] }),
  ];
  return normalizePoints(samplePoints(parts, random), 1.0);
}

// ---------------------------------------------------------------------------
// 3. Gear pair — extruded involute-style teeth, lightening holes, hubs
// ---------------------------------------------------------------------------

interface LighteningHoles {
  count: number;
  radius: number;
  ringRadius: number;
}

function gearShape(
  teeth: number,
  tipRadius: number,
  toothDepth: number,
  boreRadius: number,
  lightening: LighteningHoles | null,
): Shape {
  const rootRadius = tipRadius - toothDepth;
  const pitch = TAU / teeth;
  const shape = new Shape();
  shape.moveTo(rootRadius, 0);
  for (let tooth = 0; tooth < teeth; tooth++) {
    const base = tooth * pitch;
    shape.absarc(0, 0, rootRadius, base, base + pitch * 0.32, false);
    shape.absarc(0, 0, tipRadius, base + pitch * 0.4, base + pitch * 0.6, false);
    shape.absarc(0, 0, rootRadius, base + pitch * 0.68, base + pitch, false);
  }
  shape.closePath();

  const bore = new Path();
  bore.absarc(0, 0, boreRadius, 0, TAU, true);
  shape.holes.push(bore);

  if (lightening) {
    for (let hole = 0; hole < lightening.count; hole++) {
      const angle = (hole / lightening.count) * TAU + pitch / 2;
      const path = new Path();
      path.absarc(
        Math.cos(angle) * lightening.ringRadius,
        Math.sin(angle) * lightening.ringRadius,
        lightening.radius,
        0,
        TAU,
        true,
      );
      shape.holes.push(path);
    }
  }
  return shape;
}

const GEAR_EXTRUDE = { depth: 0.12, bevelEnabled: false, curveSegments: 12 };

function buildGearsTarget(random: () => number): Float32Array {
  const smallTeeth = 13;

  const big = new ExtrudeGeometry(
    gearShape(22, 0.62, 0.09, 0.14, { count: 5, radius: 0.08, ringRadius: 0.35 }),
    GEAR_EXTRUDE,
  );
  big.translate(0, 0, -0.06);
  big.rotateX(-Math.PI / 2);
  big.translate(-0.36, 0, 0);

  const small = new ExtrudeGeometry(
    gearShape(smallTeeth, 0.4, 0.09, 0.09, null),
    GEAR_EXTRUDE,
  );
  small.translate(0, 0, -0.06);
  // Half-tooth clocking so the pair reads as meshed.
  small.rotateZ(Math.PI / smallTeeth);
  small.rotateX(-Math.PI / 2);
  small.translate(0.57, 0, 0);

  const parts: ShapePart[] = [
    { geometry: big },
    { geometry: small },
    part(new CylinderGeometry(0.2, 0.2, 0.26, 28), { position: [-0.36, 0, 0] }),
    part(new CylinderGeometry(0.07, 0.07, 0.56, 16), { position: [-0.36, 0, 0] }),
    part(new CylinderGeometry(0.15, 0.15, 0.24, 24), { position: [0.57, 0, 0] }),
    part(new CylinderGeometry(0.06, 0.06, 0.5, 14), { position: [0.57, 0, 0] }),
  ];

  return normalizePoints(samplePoints(parts, random), 1.08);
}

// ---------------------------------------------------------------------------
// 4. Quadcopter drone — body, canopy, four arms, motors, props, skids
// ---------------------------------------------------------------------------

const ARM_DIRECTIONS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function buildDroneTarget(random: () => number): Float32Array {
  const parts: ShapePart[] = [
    part(new BoxGeometry(0.52, 0.16, 0.72, 2, 1, 2)),
    part(new SphereGeometry(0.2, 20, 14), {
      scale: [1.15, 0.55, 1.5],
      position: [0, 0.1, -0.06],
    }),
    part(new SphereGeometry(0.085, 14, 10), { position: [0, -0.12, 0.3] }),
    part(new CylinderGeometry(0.045, 0.045, 0.07, 12), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -0.12, 0.38],
    }),
    part(new CylinderGeometry(0.02, 0.02, 0.95, 8), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0.28, -0.34, 0.02],
    }),
    part(new CylinderGeometry(0.02, 0.02, 0.95, 8), {
      rotate: [Math.PI / 2, 0, 0],
      position: [-0.28, -0.34, 0.02],
    }),
  ];

  for (const [sx, sz] of ARM_DIRECTIONS) {
    parts.push(
      part(new CylinderGeometry(0.016, 0.016, 0.24, 8), {
        rotate: [0, 0, -0.3 * sx],
        position: [sx * 0.26, -0.21, sz * 0.2],
      }),
    );

    const armYaw = Math.atan2(-sz, sx);
    const arm = new CylinderGeometry(0.038, 0.05, 0.55, 10);
    arm.rotateZ(-Math.PI / 2);
    arm.translate(0.36, 0.05, 0);
    arm.rotateY(armYaw);
    parts.push({ geometry: arm });

    const motorX = sx * 0.45;
    const motorZ = sz * 0.45;
    parts.push(
      part(new CylinderGeometry(0.085, 0.095, 0.16, 18), {
        position: [motorX, 0.13, motorZ],
      }),
      part(new CylinderGeometry(0.03, 0.03, 0.05, 10), {
        position: [motorX, 0.235, motorZ],
      }),
    );

    // Distinct prop clocking per rotor so the four props read naturally.
    const yawBase = (sx + 1) * 0.6 + (sz + 1) * 0.35 + 0.5;
    for (const side of [0, Math.PI]) {
      const blade = new SphereGeometry(1, 14, 8);
      blade.scale(0.2, 0.011, 0.036);
      blade.rotateX(0.24);
      blade.translate(0.185, 0, 0);
      blade.rotateY(yawBase + side);
      blade.translate(motorX, 0.265, motorZ);
      parts.push({ geometry: blade, weight: 1.7 });
    }
  }

  return normalizePoints(samplePoints(parts, random), 1.05);
}

// ---------------------------------------------------------------------------
// 5. Ball bearing — inner/outer races, ten balls, cage rings
// ---------------------------------------------------------------------------

function buildBearingTarget(random: () => number): Float32Array {
  const parts: ShapePart[] = [
    part(new CylinderGeometry(1, 1, 0.32, 80, 1, true)),
    part(new CylinderGeometry(0.84, 0.84, 0.1, 72, 1, true), {
      position: [0, 0.11, 0],
    }),
    part(new CylinderGeometry(0.84, 0.84, 0.1, 72, 1, true), {
      position: [0, -0.11, 0],
    }),
    part(new RingGeometry(0.84, 1, 80), {
      rotate: [-Math.PI / 2, 0, 0],
      position: [0, 0.16, 0],
    }),
    part(new RingGeometry(0.84, 1, 80), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -0.16, 0],
    }),
    part(new CylinderGeometry(0.62, 0.62, 0.1, 64, 1, true), {
      position: [0, 0.11, 0],
    }),
    part(new CylinderGeometry(0.62, 0.62, 0.1, 64, 1, true), {
      position: [0, -0.11, 0],
    }),
    part(new CylinderGeometry(0.42, 0.42, 0.32, 64, 1, true)),
    part(new RingGeometry(0.42, 0.62, 64), {
      rotate: [-Math.PI / 2, 0, 0],
      position: [0, 0.16, 0],
    }),
    part(new RingGeometry(0.42, 0.62, 64), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -0.16, 0],
    }),
    part(new TorusGeometry(0.73, 0.018, 8, 64), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 0.1, 0],
      weight: 1.2,
    }),
    part(new TorusGeometry(0.73, 0.018, 8, 64), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -0.1, 0],
      weight: 1.2,
    }),
  ];

  for (let ball = 0; ball < 10; ball++) {
    const angle = (ball / 10) * TAU;
    parts.push(
      part(new SphereGeometry(0.14, 18, 12), {
        position: [Math.cos(angle) * 0.73, 0, Math.sin(angle) * 0.73],
      }),
    );
  }

  return normalizePoints(samplePoints(parts, random), 1.02);
}

// ---------------------------------------------------------------------------
// 6. Piston and crank — ringed piston, I-beam conrod, crank webs, journals
// ---------------------------------------------------------------------------

function buildPistonTarget(random: () => number): Float32Array {
  const crankCenterY = -0.62;
  const crankThrow = 0.34;
  const crankAngle = 0.62;
  const pinX = Math.sin(crankAngle) * crankThrow;
  const pinY = crankCenterY + Math.cos(crankAngle) * crankThrow;
  const wristY = 0.78;

  const rodDx = -pinX;
  const rodDy = wristY - pinY;
  const rodTilt = Math.atan2(-rodDx, rodDy);
  const beamLength = Math.hypot(rodDx, rodDy) - 0.42;
  const rodMidX = pinX / 2;
  const rodMidY = (wristY + pinY) / 2;

  const parts: ShapePart[] = [
    part(new CylinderGeometry(0.34, 0.335, 0.46, 40), { position: [0, 0.97, 0] }),
    part(new TorusGeometry(0.345, 0.016, 6, 48), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 1.13, 0],
      weight: 1.3,
    }),
    part(new TorusGeometry(0.345, 0.016, 6, 48), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 1.06, 0],
      weight: 1.3,
    }),
    part(new TorusGeometry(0.345, 0.016, 6, 48), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 0.99, 0],
      weight: 1.3,
    }),
    part(new CylinderGeometry(0.085, 0.085, 0.5, 14), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, wristY, 0],
    }),
    part(new TorusGeometry(0.13, 0.05, 10, 28), { position: [0, wristY, 0] }),
    part(new TorusGeometry(0.2, 0.065, 12, 36), { position: [pinX, pinY, 0] }),
    part(new BoxGeometry(0.075, beamLength, 0.045), {
      rotate: [0, 0, rodTilt],
      position: [rodMidX, rodMidY, 0],
    }),
    part(new BoxGeometry(0.17, beamLength, 0.024), {
      rotate: [0, 0, rodTilt],
      position: [rodMidX, rodMidY, 0.042],
    }),
    part(new BoxGeometry(0.17, beamLength, 0.024), {
      rotate: [0, 0, rodTilt],
      position: [rodMidX, rodMidY, -0.042],
    }),
    part(new CylinderGeometry(0.115, 0.115, 0.4, 18), {
      rotate: [Math.PI / 2, 0, 0],
      position: [pinX, pinY, 0],
    }),
    part(new CylinderGeometry(0.42, 0.42, 0.075, 36), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, crankCenterY, 0.24],
    }),
    part(new CylinderGeometry(0.42, 0.42, 0.075, 36), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, crankCenterY, -0.24],
    }),
    part(new CylinderGeometry(0.16, 0.16, 0.2, 18), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, crankCenterY, 0.39],
    }),
    part(new CylinderGeometry(0.16, 0.16, 0.2, 18), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, crankCenterY, -0.39],
    }),
  ];

  return normalizePoints(samplePoints(parts, random), 1.0);
}

// ---------------------------------------------------------------------------
// 7. Rocket engine — chamber and bell lathe, regen ribs, manifolds, feed lines
// ---------------------------------------------------------------------------

const ROCKET_PROFILE: [number, number][] = [
  [0.001, 1.06],
  [0.14, 1.03],
  [0.26, 0.94],
  [0.32, 0.8],
  [0.32, 0.5],
  [0.27, 0.36],
  [0.175, 0.22],
  [0.2, 0.1],
  [0.34, -0.1],
  [0.52, -0.34],
  [0.68, -0.6],
  [0.8, -0.84],
  [0.875, -1.05],
];

const ROCKET_RIB_PATH: [number, number][] = [
  [0.205, 0.12],
  [0.35, -0.09],
  [0.53, -0.33],
  [0.69, -0.59],
  [0.81, -0.83],
  [0.885, -1.04],
];

function buildRocketEngineTarget(random: () => number): Float32Array {
  const profile = ROCKET_PROFILE.map(([r, y]) => new Vector2(r, y));
  const parts: ShapePart[] = [
    { geometry: new LatheGeometry(profile, 72) },
    part(new TorusGeometry(0.875, 0.02, 8, 72), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, -1.05, 0],
    }),
    part(new TorusGeometry(0.22, 0.055, 12, 48), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 0.16, 0],
      weight: 1.1,
    }),
    part(new TorusGeometry(0.3, 0.045, 10, 48), {
      rotate: [Math.PI / 2, 0, 0],
      position: [0, 0.88, 0],
    }),
    part(new CylinderGeometry(0.09, 0.14, 0.14, 16), { position: [0, 1.13, 0] }),
    part(new BoxGeometry(0.16, 0.08, 0.16), { position: [0, 1.22, 0] }),
  ];

  const pipeCurve = new CatmullRomCurve3([
    new Vector3(0.08, 1.2, 0),
    new Vector3(0.3, 1.0, 0.12),
    new Vector3(0.46, 0.62, 0.16),
    new Vector3(0.36, 0.3, 0.1),
    new Vector3(0.25, 0.18, 0.02),
  ]);
  const pipe = new TubeGeometry(pipeCurve, 40, 0.042, 8);
  const mirroredPipe = pipe.clone();
  mirroredPipe.rotateY(Math.PI);
  parts.push({ geometry: pipe, weight: 1.1 }, { geometry: mirroredPipe, weight: 1.1 });

  // Regenerative cooling ribs running down the outside of the bell.
  const ribCurve = new CatmullRomCurve3(
    ROCKET_RIB_PATH.map(([r, y]) => new Vector3(r, y, 0)),
  );
  const ribTemplate = new TubeGeometry(ribCurve, 24, 0.012, 6);
  for (let rib = 0; rib < 18; rib++) {
    const geometry = ribTemplate.clone();
    geometry.rotateY((rib / 18) * TAU);
    parts.push({ geometry, weight: 1.2 });
  }
  ribTemplate.dispose();

  return normalizePoints(samplePoints(parts, random), 1.0);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function buildHeroPointData(): HeroPointData {
  const random = createRandom(20260611);
  const shapes = [
    buildTurbofanTarget(random),
    buildBoltTarget(random),
    buildGearsTarget(random),
    buildDroneTarget(random),
    buildBearingTarget(random),
    buildPistonTarget(random),
    buildRocketEngineTarget(random),
  ];

  const stagger = new Float32Array(HERO_POINT_COUNT);
  const size = new Float32Array(HERO_POINT_COUNT);
  const tint = new Uint8Array(HERO_POINT_COUNT);
  for (let index = 0; index < HERO_POINT_COUNT; index++) {
    stagger[index] = random();
    const pick = random();
    tint[index] = pick < 0.58 ? 0 : pick < 0.8 ? 1 : pick < 0.95 ? 2 : 3;
    size[index] = (0.75 + random() * 0.6) * (tint[index] === 3 ? 1.3 : 1);
  }

  return { shapes, stagger, size, tint };
}
