/**
 * Procedural point-cloud morph targets for the hero animation: clean,
 * uniform surface samplings of real products — quadcopter drone,
 * headphones, plane, camera, and vase. Every shape is centered at the
 * origin in a canonical orientation (standing on Y, facing +Z) and sized
 * to fit roughly inside a unit-radius sphere. Presentation tilt and
 * motion are applied at render time by the component.
 */

export const HERO_POINT_COUNT = 4600;

export interface HeroPointData {
  /** Targets in hero order: drone, headphones, plane, camera, vase. */
  shapes: Float32Array[];
  /** Per-point 0..1 random used for morph stagger and brightness variation. */
  stagger: Float32Array;
  /** Per-point palette group: 0 base, 1 teal, 2 blue, 3 spark. */
  tint: Uint8Array;
}

const TAU = Math.PI * 2;

type Point3 = [number, number, number];

/** Deterministic mulberry32 PRNG so every visitor sees the same cloud. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
// Uniform surface sampling
// ---------------------------------------------------------------------------

interface SurfacePatch {
  /** Area relative to the shape's other patches; sets point share. */
  area: number;
  sample: (rng: () => number, out: Point3) => void;
}

/** Fills one morph target, distributing points across patches by area. */
function fillFromPatches(
  random: () => number,
  patches: SurfacePatch[],
): Float32Array {
  const cumulative: number[] = [];
  let total = 0;
  for (const patch of patches) {
    total += patch.area;
    cumulative.push(total);
  }

  const target = new Float32Array(HERO_POINT_COUNT * 3);
  const out: Point3 = [0, 0, 0];
  for (let index = 0; index < HERO_POINT_COUNT; index++) {
    const patch = patches[lowerBound(cumulative, random() * total)];
    patch.sample(random, out);
    const offset = index * 3;
    target[offset] = out[0];
    target[offset + 1] = out[1];
    target[offset + 2] = out[2];
  }
  return target;
}

/** Flat ring in the xy-plane at height z, sampled uniformly by area. */
function annulusPatchZ(
  innerRadius: number,
  outerRadius: number,
  z: number,
): SurfacePatch {
  const innerSq = innerRadius * innerRadius;
  const outerSq = outerRadius * outerRadius;
  return {
    area: Math.PI * (outerSq - innerSq),
    sample: (rng, out) => {
      const radius = Math.sqrt(innerSq + (outerSq - innerSq) * rng());
      const angle = rng() * TAU;
      out[0] = Math.cos(angle) * radius;
      out[1] = Math.sin(angle) * radius;
      out[2] = z;
    },
  };
}

/** Cylinder wall around the Z axis between zMin and zMax. */
function cylinderPatchZ(
  radius: number,
  zMin: number,
  zMax: number,
): SurfacePatch {
  return {
    area: TAU * radius * (zMax - zMin),
    sample: (rng, out) => {
      const angle = rng() * TAU;
      out[0] = Math.cos(angle) * radius;
      out[1] = Math.sin(angle) * radius;
      out[2] = zMin + rng() * (zMax - zMin);
    },
  };
}

/** Cylinder wall around the Y axis between yMin and yMax. */
function cylinderPatchY(
  radius: number,
  yMin: number,
  yMax: number,
  centerX = 0,
  centerZ = 0,
): SurfacePatch {
  return {
    area: TAU * radius * (yMax - yMin),
    sample: (rng, out) => {
      const angle = rng() * TAU;
      out[0] = centerX + Math.cos(angle) * radius;
      out[1] = yMin + rng() * (yMax - yMin);
      out[2] = centerZ + Math.sin(angle) * radius;
    },
  };
}

/** Flat ring in the xz-plane at height y, sampled uniformly by area. */
function annulusPatchY(
  innerRadius: number,
  outerRadius: number,
  y: number,
  centerX = 0,
  centerZ = 0,
): SurfacePatch {
  const innerSq = innerRadius * innerRadius;
  const outerSq = outerRadius * outerRadius;
  return {
    area: Math.PI * (outerSq - innerSq),
    sample: (rng, out) => {
      const radius = Math.sqrt(innerSq + (outerSq - innerSq) * rng());
      const angle = rng() * TAU;
      out[0] = centerX + Math.cos(angle) * radius;
      out[1] = y;
      out[2] = centerZ + Math.sin(angle) * radius;
    },
  };
}

/** Cylinder wall around the X axis between xMin and xMax. */
function cylinderPatchX(
  radius: number,
  xMin: number,
  xMax: number,
  centerY = 0,
  centerZ = 0,
): SurfacePatch {
  return {
    area: TAU * radius * (xMax - xMin),
    sample: (rng, out) => {
      const angle = rng() * TAU;
      out[0] = xMin + rng() * (xMax - xMin);
      out[1] = centerY + Math.cos(angle) * radius;
      out[2] = centerZ + Math.sin(angle) * radius;
    },
  };
}

/** Flat ring in the yz-plane at position x, sampled uniformly by area. */
function annulusPatchX(
  innerRadius: number,
  outerRadius: number,
  x: number,
  centerY = 0,
  centerZ = 0,
): SurfacePatch {
  const innerSq = innerRadius * innerRadius;
  const outerSq = outerRadius * outerRadius;
  return {
    area: Math.PI * (outerSq - innerSq),
    sample: (rng, out) => {
      const radius = Math.sqrt(innerSq + (outerSq - innerSq) * rng());
      const angle = rng() * TAU;
      out[0] = x;
      out[1] = centerY + Math.cos(angle) * radius;
      out[2] = centerZ + Math.sin(angle) * radius;
    },
  };
}

// ---------------------------------------------------------------------------
// Arc-length sampling of polylines (used for the toothed gear rim)
// ---------------------------------------------------------------------------

type Segment = [number, number, number, number, number, number];

interface SegmentSet {
  segments: Segment[];
  cumulative: number[];
  total: number;
}

function buildSegmentSet(points: Point3[]): SegmentSet {
  const segments: Segment[] = [];
  const cumulative: number[] = [];
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (length < 1e-6) continue;
    total += length;
    segments.push([a[0], a[1], a[2], b[0], b[1], b[2]]);
    cumulative.push(total);
  }
  return { segments, cumulative, total };
}

function sampleSegmentSet(set: SegmentSet, t: number, out: Point3): void {
  const pick = Math.min(set.total, Math.max(0, t * set.total));
  const index = lowerBound(set.cumulative, pick);
  const segment = set.segments[index];
  const previous = index === 0 ? 0 : set.cumulative[index - 1];
  const length = set.cumulative[index] - previous;
  const local = length > 0 ? (pick - previous) / length : 0;
  out[0] = segment[0] + (segment[3] - segment[0]) * local;
  out[1] = segment[1] + (segment[4] - segment[1]) * local;
  out[2] = segment[2] + (segment[5] - segment[2]) * local;
}

// ---------------------------------------------------------------------------
// Lathe surfaces (surfaces of revolution, used by the fuselage and vase)
// ---------------------------------------------------------------------------

/** [position along the axis, radius] control point of a lathe profile. */
type LatheControl = [number, number];

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Revolves a Catmull-Rom-smoothed profile around the given axis, sampling
 * uniformly by lateral surface area.
 */
function lathePatch(controls: LatheControl[], axis: "y" | "z"): SurfacePatch {
  const SUBDIVISIONS = 24;
  const positions: number[] = [];
  const radii: number[] = [];
  for (let seg = 0; seg < controls.length - 1; seg++) {
    const p0 = controls[Math.max(0, seg - 1)];
    const p1 = controls[seg];
    const p2 = controls[seg + 1];
    const p3 = controls[Math.min(controls.length - 1, seg + 2)];
    for (let sub = 0; sub < SUBDIVISIONS; sub++) {
      const t = sub / SUBDIVISIONS;
      positions.push(catmullRom(p0[0], p1[0], p2[0], p3[0], t));
      radii.push(Math.max(0, catmullRom(p0[1], p1[1], p2[1], p3[1], t)));
    }
  }
  const last = controls[controls.length - 1];
  positions.push(last[0]);
  radii.push(Math.max(0, last[1]));

  const cumulative: number[] = [];
  let total = 0;
  for (let index = 1; index < positions.length; index++) {
    const midRadius = (radii[index - 1] + radii[index]) / 2;
    const slant = Math.hypot(
      positions[index] - positions[index - 1],
      radii[index] - radii[index - 1],
    );
    total += TAU * midRadius * slant;
    cumulative.push(total);
  }

  return {
    area: total,
    sample: (rng, out) => {
      const pick = rng() * total;
      const index = lowerBound(cumulative, pick);
      const previous = index === 0 ? 0 : cumulative[index - 1];
      const span = cumulative[index] - previous;
      const local = span > 0 ? (pick - previous) / span : 0;
      const position =
        positions[index] + (positions[index + 1] - positions[index]) * local;
      const radius = radii[index] + (radii[index + 1] - radii[index]) * local;
      const angle = rng() * TAU;
      if (axis === "y") {
        out[0] = Math.cos(angle) * radius;
        out[1] = position;
        out[2] = Math.sin(angle) * radius;
      } else {
        out[0] = Math.cos(angle) * radius;
        out[1] = Math.sin(angle) * radius;
        out[2] = position;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Drone — rounded quad body, four arms, motor pods, prop blades, axis on Y
// ---------------------------------------------------------------------------

const DRONE_BODY_RADIUS = 0.28;
const DRONE_BODY_HALF_DEPTH = 0.055;
const DRONE_ARM_RADIUS = 0.032;
const DRONE_ARM_START = 0.2;
const DRONE_MOTOR_OFFSET = 0.6;
const DRONE_MOTOR_RADIUS = 0.06;
const DRONE_MOTOR_BOTTOM = 0.02;
const DRONE_MOTOR_TOP = 0.15;
const DRONE_PROP_Y = 0.18;
const DRONE_PROP_LENGTH = 0.28;
const DRONE_PROP_WIDTH = 0.034;
/** Static rotor blade angles, varied so the quad does not look stamped. */
const DRONE_PROP_ANGLES = [0.4, 1.5, 0.9, 2.3];

/** Rounded-square plan silhouette of the body (superellipse, exponent 4). */
function droneBodyRadius(angle: number): number {
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  return DRONE_BODY_RADIUS * Math.pow(cos ** 4 + sin ** 4, -0.25);
}

/** Cylinder lying in the xz-plane between two points, for the drone arms. */
function horizontalTubePatch(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  radius: number,
): SurfacePatch {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const perpX = -dz / length;
  const perpZ = dx / length;
  return {
    area: TAU * radius * length,
    sample: (rng, out) => {
      const t = rng();
      const phi = rng() * TAU;
      const side = Math.cos(phi) * radius;
      out[0] = x1 + dx * t + perpX * side;
      out[1] = Math.sin(phi) * radius;
      out[2] = z1 + dz * t + perpZ * side;
    },
  };
}

function buildDroneTarget(random: () => number): Float32Array {
  const OUTLINE_STEPS = 256;
  const outline: Point3[] = [];
  let faceArea = 0;
  for (let step = 0; step <= OUTLINE_STEPS; step++) {
    const angle = (step / OUTLINE_STEPS) * TAU;
    const radius = droneBodyRadius(angle);
    outline.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    if (step < OUTLINE_STEPS) {
      faceArea += 0.5 * radius * radius * (TAU / OUTLINE_STEPS);
    }
  }
  const wall = buildSegmentSet(outline);
  const wallScratch: Point3 = [0, 0, 0];
  const maxPlanRadius = droneBodyRadius(Math.PI / 4);

  const sampleBodyFace = (y: number) => (rng: () => number, out: Point3) => {
    for (; ;) {
      const angle = rng() * TAU;
      const radius = Math.sqrt(rng()) * maxPlanRadius;
      if (radius > droneBodyRadius(angle)) continue;
      out[0] = Math.cos(angle) * radius;
      out[1] = y;
      out[2] = Math.sin(angle) * radius;
      return;
    }
  };

  const patches: SurfacePatch[] = [
    { area: faceArea, sample: sampleBodyFace(DRONE_BODY_HALF_DEPTH) },
    { area: faceArea, sample: sampleBodyFace(-DRONE_BODY_HALF_DEPTH) },
    {
      area: wall.total * DRONE_BODY_HALF_DEPTH * 2,
      sample: (rng, out) => {
        sampleSegmentSet(wall, rng(), wallScratch);
        out[0] = wallScratch[0];
        out[1] = (rng() * 2 - 1) * DRONE_BODY_HALF_DEPTH;
        out[2] = wallScratch[2];
      },
    },
  ];

  for (let rotor = 0; rotor < 4; rotor++) {
    const signX = rotor % 2 === 0 ? 1 : -1;
    const signZ = rotor < 2 ? 1 : -1;
    const motorX = signX * DRONE_MOTOR_OFFSET;
    const motorZ = signZ * DRONE_MOTOR_OFFSET;
    const bladeCos = Math.cos(DRONE_PROP_ANGLES[rotor]);
    const bladeSin = Math.sin(DRONE_PROP_ANGLES[rotor]);
    patches.push(
      horizontalTubePatch(
        signX * DRONE_ARM_START,
        signZ * DRONE_ARM_START,
        motorX,
        motorZ,
        DRONE_ARM_RADIUS,
      ),
      cylinderPatchY(
        DRONE_MOTOR_RADIUS,
        DRONE_MOTOR_BOTTOM,
        DRONE_MOTOR_TOP,
        motorX,
        motorZ,
      ),
      annulusPatchY(0, DRONE_MOTOR_RADIUS, DRONE_MOTOR_TOP, motorX, motorZ),
      {
        // Two-blade prop as a narrow ellipse; over-weighted to stay readable.
        area: Math.PI * DRONE_PROP_LENGTH * DRONE_PROP_WIDTH * 3,
        sample: (rng, out) => {
          const angle = rng() * TAU;
          const spread = Math.sqrt(rng());
          const along = Math.cos(angle) * spread * DRONE_PROP_LENGTH;
          const across = Math.sin(angle) * spread * DRONE_PROP_WIDTH;
          out[0] = motorX + bladeCos * along - bladeSin * across;
          out[1] = DRONE_PROP_Y + (rng() - 0.5) * 0.01;
          out[2] = motorZ + bladeSin * along + bladeCos * across;
        },
      },
    );
  }
  return fillFromPatches(random, patches);
}

// ---------------------------------------------------------------------------
// Headphones — arc headband tube and two ear cups with cushions, facing +Z
// ---------------------------------------------------------------------------

const HEADPHONE_BAND_RADIUS = 0.78;
const HEADPHONE_BAND_CENTER_Y = 0.06;
const HEADPHONE_BAND_TUBE_RADIUS = 0.06;
/** How far past horizontal the band reaches on each side, in radians. */
const HEADPHONE_BAND_OVERHANG = 0.25;
const HEADPHONE_CUP_OUTER_RADIUS = 0.32;
const HEADPHONE_CUP_INNER_X = 0.66;
const HEADPHONE_CUP_OUTER_X = 0.84;
const HEADPHONE_CUP_CENTER_Y = -0.16;
const HEADPHONE_CUSHION_INNER_RADIUS = 0.12;

function buildHeadphonesTarget(random: () => number): Float32Array {
  const bandSweep = Math.PI + 2 * HEADPHONE_BAND_OVERHANG;
  const patches: SurfacePatch[] = [
    {
      // Headband: round tube swept along an arc in the xy-plane.
      area:
        TAU * HEADPHONE_BAND_TUBE_RADIUS * HEADPHONE_BAND_RADIUS * bandSweep,
      sample: (rng, out) => {
        const theta = -HEADPHONE_BAND_OVERHANG + rng() * bandSweep;
        const phi = rng() * TAU;
        const radial =
          HEADPHONE_BAND_RADIUS + Math.cos(phi) * HEADPHONE_BAND_TUBE_RADIUS;
        out[0] = Math.cos(theta) * radial;
        out[1] = HEADPHONE_BAND_CENTER_Y + Math.sin(theta) * radial;
        out[2] = Math.sin(phi) * HEADPHONE_BAND_TUBE_RADIUS;
      },
    },
  ];

  for (const side of [-1, 1]) {
    patches.push(
      // Ear cup shell.
      cylinderPatchX(
        HEADPHONE_CUP_OUTER_RADIUS,
        side === 1 ? HEADPHONE_CUP_INNER_X : -HEADPHONE_CUP_OUTER_X,
        side === 1 ? HEADPHONE_CUP_OUTER_X : -HEADPHONE_CUP_INNER_X,
        HEADPHONE_CUP_CENTER_Y,
        0,
      ),
      // Outer shell cap.
      annulusPatchX(
        0,
        HEADPHONE_CUP_OUTER_RADIUS,
        side * HEADPHONE_CUP_OUTER_X,
        HEADPHONE_CUP_CENTER_Y,
        0,
      ),
      // Cushion ring facing the head.
      annulusPatchX(
        HEADPHONE_CUSHION_INNER_RADIUS,
        HEADPHONE_CUP_OUTER_RADIUS,
        side * HEADPHONE_CUP_INNER_X,
        HEADPHONE_CUP_CENTER_Y,
        0,
      ),
    );
  }
  return fillFromPatches(random, patches);
}

// ---------------------------------------------------------------------------
// Plane — lathe fuselage, tapered wings, stabilizer, and fin, nose toward +Z
// ---------------------------------------------------------------------------

const PLANE_FUSELAGE: LatheControl[] = [
  [-0.9, 0.012],
  [-0.65, 0.055],
  [-0.2, 0.095],
  [0.15, 0.105],
  [0.55, 0.09],
  [0.8, 0.06],
  [0.9, 0],
];

interface WingSpec {
  /** Spanwise start/end, mirrored to both sides. */
  rootOffset: number;
  tipOffset: number;
  rootChord: number;
  tipChord: number;
  rootLeadingZ: number;
  /** How far back the tip leading edge is swept. */
  sweep: number;
  rootY: number;
  /** Tip rise relative to the root. */
  dihedral: number;
}

/** Mirrored pair of flat tapered wings, uniform across the plan area. */
function wingPairPatch(spec: WingSpec): SurfacePatch {
  const span = spec.tipOffset - spec.rootOffset;
  return {
    area: span * (spec.rootChord + spec.tipChord),
    sample: (rng, out) => {
      let u = 0;
      let chord = spec.rootChord;
      // Rejection keeps density uniform as the chord tapers to the tip.
      for (; ;) {
        u = rng();
        chord = spec.rootChord + (spec.tipChord - spec.rootChord) * u;
        if (rng() * spec.rootChord <= chord) break;
      }
      const side = rng() < 0.5 ? -1 : 1;
      out[0] = side * (spec.rootOffset + u * span);
      out[1] = spec.rootY + u * spec.dihedral + (rng() - 0.5) * 0.012;
      out[2] = spec.rootLeadingZ - u * spec.sweep - rng() * chord;
    },
  };
}

const FIN_BOTTOM = 0.04;
const FIN_TOP = 0.36;
const FIN_ROOT_CHORD = 0.17;
const FIN_TIP_CHORD = 0.09;
const FIN_LEADING_Z = -0.68;
const FIN_SWEEP = 0.12;

function buildPlaneTarget(random: () => number): Float32Array {
  const patches: SurfacePatch[] = [
    lathePatch(PLANE_FUSELAGE, "z"),
    wingPairPatch({
      rootOffset: 0.08,
      tipOffset: 0.95,
      rootChord: 0.32,
      tipChord: 0.13,
      rootLeadingZ: 0.3,
      sweep: 0.12,
      rootY: -0.02,
      dihedral: 0.08,
    }),
    wingPairPatch({
      rootOffset: 0.03,
      tipOffset: 0.34,
      rootChord: 0.15,
      tipChord: 0.09,
      rootLeadingZ: -0.72,
      sweep: 0.06,
      rootY: 0.02,
      dihedral: 0.03,
    }),
    {
      // Vertical tail fin, tapered and swept like the wings.
      area: ((FIN_TOP - FIN_BOTTOM) * (FIN_ROOT_CHORD + FIN_TIP_CHORD)) / 2,
      sample: (rng, out) => {
        let v = 0;
        let chord = FIN_ROOT_CHORD;
        for (; ;) {
          v = rng();
          chord = FIN_ROOT_CHORD + (FIN_TIP_CHORD - FIN_ROOT_CHORD) * v;
          if (rng() * FIN_ROOT_CHORD <= chord) break;
        }
        out[0] = (rng() - 0.5) * 0.012;
        out[1] = FIN_BOTTOM + v * (FIN_TOP - FIN_BOTTOM);
        out[2] = FIN_LEADING_Z - v * FIN_SWEEP - rng() * chord;
      },
    },
  ];
  return fillFromPatches(random, patches);
}

// ---------------------------------------------------------------------------
// Camera — rounded body, lens barrel with glass, viewfinder hump, lens on +Z
// ---------------------------------------------------------------------------

const CAMERA_HALF_WIDTH = 0.7;
const CAMERA_HALF_HEIGHT = 0.45;
const CAMERA_HALF_DEPTH = 0.22;
const CAMERA_LENS_RADIUS = 0.34;
const CAMERA_LENS_INNER_RADIUS = 0.21;
const CAMERA_LENS_FRONT = 0.6;
const CAMERA_GLASS_Z = 0.52;
const CAMERA_HUMP_HALF_WIDTH = 0.22;
const CAMERA_HUMP_HALF_HEIGHT = 0.1;
const CAMERA_HUMP_CENTER_Y = 0.55;
const CAMERA_BUTTON_X = 0.42;
const CAMERA_BUTTON_RADIUS = 0.06;

/** Superellipse exponent for the rounded body silhouette. */
const ROUNDED_BOX_EXPONENT = 5;

/** Rounded-rectangle prism extruded along Z: front/back faces and wall. */
function roundedBoxPatchesZ(
  halfWidth: number,
  halfHeight: number,
  zMin: number,
  zMax: number,
  centerY = 0,
): SurfacePatch[] {
  const STEPS = 288;
  const outline: Point3[] = [];
  let faceArea = 0;
  for (let step = 0; step <= STEPS; step++) {
    const angle = (step / STEPS) * TAU;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const radius = Math.pow(
      Math.abs(cos / halfWidth) ** ROUNDED_BOX_EXPONENT +
      Math.abs(sin / halfHeight) ** ROUNDED_BOX_EXPONENT,
      -1 / ROUNDED_BOX_EXPONENT,
    );
    outline.push([cos * radius, centerY + sin * radius, 0]);
    if (step < STEPS) faceArea += 0.5 * radius * radius * (TAU / STEPS);
  }
  const wall = buildSegmentSet(outline);
  const wallScratch: Point3 = [0, 0, 0];

  const sampleFace = (z: number) => (rng: () => number, out: Point3) => {
    for (; ;) {
      const x = (rng() * 2 - 1) * halfWidth;
      const y = (rng() * 2 - 1) * halfHeight;
      const reach =
        Math.abs(x / halfWidth) ** ROUNDED_BOX_EXPONENT +
        Math.abs(y / halfHeight) ** ROUNDED_BOX_EXPONENT;
      if (reach > 1) continue;
      out[0] = x;
      out[1] = centerY + y;
      out[2] = z;
      return;
    }
  };

  return [
    { area: faceArea, sample: sampleFace(zMax) },
    { area: faceArea, sample: sampleFace(zMin) },
    {
      area: wall.total * (zMax - zMin),
      sample: (rng, out) => {
        sampleSegmentSet(wall, rng(), wallScratch);
        out[0] = wallScratch[0];
        out[1] = wallScratch[1];
        out[2] = zMin + rng() * (zMax - zMin);
      },
    },
  ];
}

function buildCameraTarget(random: () => number): Float32Array {
  const patches: SurfacePatch[] = [
    ...roundedBoxPatchesZ(
      CAMERA_HALF_WIDTH,
      CAMERA_HALF_HEIGHT,
      -CAMERA_HALF_DEPTH,
      CAMERA_HALF_DEPTH,
    ),
    // Viewfinder hump on top of the body.
    ...roundedBoxPatchesZ(
      CAMERA_HUMP_HALF_WIDTH,
      CAMERA_HUMP_HALF_HEIGHT,
      -0.15,
      0.11,
      CAMERA_HUMP_CENTER_Y,
    ),
    // Lens barrel, front rim, inner barrel, and recessed glass disc.
    cylinderPatchZ(CAMERA_LENS_RADIUS, CAMERA_HALF_DEPTH, CAMERA_LENS_FRONT),
    annulusPatchZ(
      CAMERA_LENS_INNER_RADIUS,
      CAMERA_LENS_RADIUS,
      CAMERA_LENS_FRONT,
    ),
    cylinderPatchZ(CAMERA_LENS_INNER_RADIUS, CAMERA_GLASS_Z, CAMERA_LENS_FRONT),
    annulusPatchZ(0, CAMERA_LENS_INNER_RADIUS, CAMERA_GLASS_Z),
    // Shutter button.
    cylinderPatchY(CAMERA_BUTTON_RADIUS, 0.44, 0.53, CAMERA_BUTTON_X, 0),
    annulusPatchY(0, CAMERA_BUTTON_RADIUS, 0.53, CAMERA_BUTTON_X, 0),
  ];
  return fillFromPatches(random, patches);
}

// ---------------------------------------------------------------------------
// Vase — smooth lathe profile with belly, neck, and flared lip, axis on Y
// ---------------------------------------------------------------------------

const VASE_OUTER: LatheControl[] = [
  [-0.85, 0.27],
  [-0.78, 0.33],
  [-0.45, 0.5],
  [-0.05, 0.54],
  [0.35, 0.33],
  [0.6, 0.26],
  [0.78, 0.31],
  [0.88, 0.36],
];

/** Inner wall of the mouth so the opening reads from above. */
const VASE_INNER: LatheControl[] = [
  [0.88, 0.33],
  [0.6, 0.225],
  [0.42, 0.21],
];

function buildVaseTarget(random: () => number): Float32Array {
  return fillFromPatches(random, [
    lathePatch(VASE_OUTER, "y"),
    lathePatch(VASE_INNER, "y"),
    annulusPatchY(0, 0.27, -0.85),
  ]);
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export function buildHeroPointData(): HeroPointData {
  const random = createRandom(1337);
  const shapes = [
    buildDroneTarget(random),
    buildHeadphonesTarget(random),
    buildPlaneTarget(random),
    buildCameraTarget(random),
    buildVaseTarget(random),
  ];

  const stagger = new Float32Array(HERO_POINT_COUNT);
  const tint = new Uint8Array(HERO_POINT_COUNT);
  for (let index = 0; index < HERO_POINT_COUNT; index++) {
    stagger[index] = random();
    const pick = random();
    tint[index] = pick < 0.64 ? 0 : pick < 0.82 ? 1 : pick < 0.96 ? 2 : 3;
  }

  return { shapes, stagger, tint };
}
