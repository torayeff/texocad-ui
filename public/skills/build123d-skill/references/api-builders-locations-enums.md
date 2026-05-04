# Builders, Locations, And Enums

Use this reference for builder setup, repeated placement, and enum choices.

## Builders

- `BuildLine(workplane=Plane.XY, mode=Mode.ADD)` - creates curve/wire geometry. Use for profiles, paths, construction lines, splines, and sweep paths. Accepts one workplane.
- `BuildSketch(*workplanes, mode=Mode.ADD)` - creates 2D sketch/faces. Can use multiple workplanes to repeat the same sketch on many faces/planes.
- `BuildPart(*workplanes, mode=Mode.ADD)` - creates 3D parts. Nested sketches feed pending faces to part operations.

Outputs:

- `BuildLine.line`
- `BuildSketch.sketch`
- `BuildPart.part`

Common builder methods:

- `Builder.vertices(select=Select.ALL)`
- `Builder.edges(select=Select.ALL)`
- `Builder.wires(select=Select.ALL)`
- `Builder.faces(select=Select.ALL)`
- `Builder.solids(select=Select.ALL)`

Builder rules:

- Objects add themselves immediately to the active builder.
- Use `Locations` before object creation.
- Nested builders do not inherit parent workplanes.
- Use `mode=Mode.PRIVATE` for construction geometry that should not change the active result.

## Location Contexts

- `Locations(*pts)` - place objects at vectors, tuples, vertices, locations, faces, planes, axes, or iterables of those. Stacks/multiplies with active locations.
- `GridLocations(x_spacing, y_spacing, x_count, y_count, align=(Align.CENTER, Align.CENTER))` - rectangular grid.
- `HexLocations(radius, x_count, y_count, major_radius=False, align=(Align.CENTER, Align.CENTER))` - hexagonal grid.
- `PolarLocations(radius, count, start_angle=0, angular_range=360, rotate=True, endpoint=False)` - circular pattern; `rotate=True` rotates local frames around the pattern.

Patterns:

```python
with GridLocations(20, 10, 3, 2):
    Hole(2)

with PolarLocations(30, 6):
    Cylinder(2, 5)
```

## Core Enums

- `Align`: `MIN`, `CENTER`, `MAX`, `NONE`. Controls object alignment to its local axes.
- `CenterOf`: `GEOMETRY`, `MASS`, `BOUNDING_BOX`. Used by `center(...)`.
- `FontStyle`: `REGULAR`, `BOLD`, `ITALIC`, `BOLDITALIC`.
- `GeomType`: `PLANE`, `CYLINDER`, `CONE`, `SPHERE`, `TORUS`, `BEZIER`, `BSPLINE`, `REVOLUTION`, `EXTRUSION`, `OFFSET`, `LINE`, `CIRCLE`, `ELLIPSE`, `HYPERBOLA`, `PARABOLA`, `OTHER`. Use in `filter_by`.
- `Keep`: `ALL`, `TOP`, `BOTTOM`, `BOTH`, `INSIDE`, `OUTSIDE`. Used by splits and tangent-arc branch choices.
- `Kind`: `ARC`, `INTERSECTION`, `TANGENT`. Offset corner transition behavior.
- `Mode`: `ADD`, `SUBTRACT`, `INTERSECT`, `REPLACE`, `PRIVATE`. Builder combination behavior.
- `Select`: `ALL`, `LAST`, `NEW`. Builder selector scope.
- `SortBy`: `LENGTH`, `RADIUS`, `AREA`, `VOLUME`, `DISTANCE`. ShapeList sorting/grouping criterion.
- `Transition`: `RIGHT`, `ROUND`, `TRANSFORMED`. Sweep transition behavior.
- `Until`: `NEXT`, `LAST`, `PREVIOUS`, `FIRST`. Extrude termination.

## Additional Enum/Option Families

These appear in objects, operations, direct API, import/export, constraints, drawings, or the cheat sheet:

- `ApproxOption`: approximation style such as `ARC`, `SPLINE`, or `NONE`.
- `AngularDirection`: `CLOCKWISE`, `COUNTER_CLOCKWISE`.
- `ContinuityLevel`: continuity target for `BlendCurve`; typically `C0`, `C1`, `C2`.
- `Extrinsic` / `Intrinsic`: Euler rotation ordering.
- `FrameMethod`: `FRENET`, `CORRECTED`; controls frames along curves.
- `HeadType`: arrow head style such as `CURVED`, `FILLETED`, `STRAIGHT`.
- `LengthMode`: `DIAGONAL`, `HORIZONTAL`, `VERTICAL`; used by `PolarLine`.
- `MeshType`: mesh role for 3MF, such as `MODEL`, `SUPPORT`, `SOLIDSUPPORT`, `OTHER`.
- `NumberDisplay`: decimal/fraction drawing display.
- `PageSize`: drawing sheets such as `A4`, `A3`, `LETTER`, `LEGAL`, `LEDGER`.
- `PositionMode`: `PARAMETER` vs `LENGTH` for curve positions.
- `PrecisionMode`: `LEAST`, `AVERAGE`, `GREATEST`, `SESSION`; STEP precision.
- `Sagitta`: branch choice for constrained arcs, commonly `SHORT`, `LONG`, `BOTH`.
- `Side`: `LEFT`, `RIGHT`, `BOTH`.
- `Tangency`: constrained relationship qualifier: `ENCLOSING`, `ENCLOSED`, `OUTSIDE`, `UNQUALIFIED`.
- `TextAlign`: `LEFT`, `CENTER`, `RIGHT`, `BOTTOM`, `TOP`, `TOPFIRSTLINE`.
- `Unit`: `MC`, `MM`, `CM`, `M`, `IN`, `FT`.

## Enum Selection Tips

- Use `Mode.PRIVATE` for construction and inspection.
- Use `Align.NONE` when point-defined profiles should not be re-centered.
- Use `SortBy.AREA` or `SortBy.LENGTH` after filtering to stabilize selections.
- Use `Kind.INTERSECTION` for sharp offset corners, `Kind.ARC` for rounded offset joins, and `Kind.TANGENT` for tangent joins.
- Use explicit `Unit.MM` on exports unless the model intentionally uses another unit.
- Use `Tangency` plus a `selector` for constrained arcs/lines; never assume the first branch is the design branch.
