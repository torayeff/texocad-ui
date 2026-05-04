# Build123d Workflows

Use this reference for mode choice, builder behavior, placement, movement, and operation order.

## Mode Choice

### Builder Mode

Use builder mode for readable construction history:

- `BuildLine` creates 1D curves/wires.
- `BuildSketch` creates 2D faces/sketches.
- `BuildPart` creates 3D solids/parts.

Builders maintain a running total. Objects and operations combine into the active builder immediately using `mode`.

```python
from build123d import *

with BuildPart() as part:
    with BuildSketch():
        Rectangle(40, 20)
        with Locations((10, 0)):
            Circle(3, mode=Mode.SUBTRACT)
    extrude(amount=5)
result = part.part
```

Use builder mode when local workplanes, repeated `Locations`, pending edges/faces, and operation sequencing improve readability.

### Algebra Mode

Use algebra mode for explicit composition outside builder contexts.

```python
from build123d import *

part = Box(40, 20, 5) - Pos(10, 0, 0) * Cylinder(3, 10)
```

Placement is `Plane * Pos/Rot/Location * object`. Python binds `*` tighter than `+`, `-`, and `&`, so short expressions are readable. Do not use algebra composition from inside a builder context.

For repeated objects, do not incrementally fuse into a growing object inside a loop. Collect placed objects first, then combine once so build123d only performs one fuse/clean pass:

```python
r = Rectangle(2, 2)
holes = [
    loc * r
    for loc in GridLocations(4, 4, 20, 20).locations
    if loc.position.X**2 + loc.position.Y**2 < limit_radius**2
]
profile = Circle(diameter / 2) - holes
```

### Direct API

Use direct topology/geometry methods when you need:

- Factories such as `Edge.make_*`, `Wire.make_*`, `Face.make_*`, `Solid.make_*`.
- Low-level selection, wrapping, projection, bounding boxes, intersections, or validation.
- Imported or existing topology manipulation.

## Builder Running Total

Common modes:

- `Mode.ADD`: fuse/add into the active object.
- `Mode.SUBTRACT`: cut from the active object.
- `Mode.INTERSECT`: keep overlap.
- `Mode.REPLACE`: replace the running total.
- `Mode.PRIVATE`: create/inspect construction geometry without modifying the running total.

Final results:

- `BuildLine(...).line`
- `BuildSketch(...).sketch`
- `BuildPart(...).part`

## Workplanes

- Builder constructors accept a workplane: `BuildSketch(Plane.XZ)`, `BuildSketch(face)`, `BuildPart(Plane.XY)`.
- Workplanes can be `Plane`, `Face`, or `Location` depending on context.
- Nested builders do not inherit parent workplanes. Pass the intended workplane explicitly.
- A `BuildSketch` uses local sketch coordinates, then places the result on its workplane.

## Locations

Use `Locations`, `GridLocations`, `HexLocations`, and `PolarLocations` to place future objects.

```python
with BuildPart() as plate:
    Box(80, 40, 4)
    with GridLocations(60, 20, 2, 2):
        Hole(3)
```

Rules:

- Placement must happen before object creation.
- Nested location contexts multiply placements.
- 1D objects are not affected by `Locations` in builder mode.
- Operations are positioned by their input objects; they are not relocated by `Locations`.

Wrong inside a builder:

```python
with BuildPart():
    Cylinder(2, 5).moved(Location((10, 0, 0)))  # Does not move the builder result
```

Right:

```python
with BuildPart():
    with Locations((10, 0, 0)):
        Cylinder(2, 5)
```

## Pending Objects

Nested builders can feed pending edges/faces to operations:

- `BuildLine` inside `BuildSketch` creates pending edges for `make_face()`, `trace()`, `make_hull()`, or slot/path workflows.
- `BuildSketch` inside `BuildPart` creates pending faces for `extrude()`, `revolve()`, `loft()`, `sweep()`, or `thicken()`.

Prefer explicit arguments when the implicit pending state would be unclear.

## Movement APIs

- Builder placement: `Locations(...)` and builder workplanes.
- Algebra placement: `Plane * Pos/Rot/Location * shape`.
- Direct movement: `.moved(Location(...))` returns a moved copy; `.move(...)` may mutate depending on object API.
- Planes can be `offset`, `rotated`, `shift_origin`, `reverse`, and converted between local/global coordinates.

## Robust Operation Order

- Use `make_face()` from clean closed curves.
- Prefer cutting repeated holes in a 2D profile before extruding when there are many identical through-holes.
- Use `extrude(..., until=Until.NEXT/FIRST/LAST/PREVIOUS, target=...)` when a cut must terminate at topology instead of a fixed depth.
- Use `revolve()` for axial solids; keep profiles on one side of the revolution axis.
- Use `sweep()` for path-following geometry and `loft()` for transitions between sections. If a multisection sweep fails, consider loft.
- Use `offset(..., openings=...)` for shells and open hollow parts; avoid self-intersection.
- Use `section()` for manufacturing slices, inspection, and 2D derivation from solids.
