# Selectors And Workplanes

Use this reference when choosing faces/edges/vertices, working on non-default planes, or debugging feature placement.

## Selector Strategy

Prefer stable, intent-based selection:

1. Select from a higher topology object first when possible.
2. Filter by geometry type, axis/plane relationship, radius, length, area, center, distance, or topology.
3. Group or sort after filtering.
4. Assert the expected count when the downstream feature depends on it.

Example:

```python
top_face = part.faces().sort_by(Axis.Z)[-1]
hole_edges = top_face.edges().filter_by(GeomType.CIRCLE)
assert len(hole_edges) == 4
chamfer(hole_edges, length=0.5)
```

Avoid:

```python
chamfer(part.edges()[3], length=0.5)
```

Raw indexes are acceptable only after you create a stable filtered/sorted/grouped list and the index encodes a known rule.

## Builder Selectors

Inside builder contexts:

- `vertices(select=Select.ALL)`
- `edges(select=Select.ALL)`
- `wires(select=Select.ALL)`
- `faces(select=Select.ALL)`
- `solids(select=Select.ALL)`

`Select.ALL` means all current topology. `Select.LAST` means created by the last operation. `Select.NEW` means truly new topology from an operation. `Select.NEW` is useful but not universal; fillet/chamfer and reused topology may not appear as "new".

Outside builder contexts, call methods on the shape:

```python
edges = my_part.edges().filter_by(Axis.Z)
```

`Select.LAST` and `Select.NEW` are builder selector concepts. For algebra mode, snapshot topology before and after, or use helpers such as `new_edges(...)` where available.

## ShapeList Methods

Use these operations heavily:

- `sort_by(Axis.X | Axis.Y | Axis.Z | Edge | Wire | SortBy | callable | property)`
- `sort_by_distance(shape_or_point)`
- `group_by(Axis | Edge | Wire | SortBy | callable | property)`
- `filter_by(Axis | Plane | GeomType | predicate | property)`
- `filter_by_position(Axis, minimum, maximum)`
- Python indexing and slicing after stable sorting/grouping.

Common recipes:

```python
top = part.faces().sort_by(Axis.Z)[-1]
vertical_edges = part.edges().filter_by(Axis.Z)
largest_face = part.faces().sort_by(SortBy.AREA)[-1]
circular_edges = top.edges().filter_by(GeomType.CIRCLE)
front_group = part.faces().group_by(Axis.Y)[0]
```

Axis/plane filter meanings:

- `filter_by(Axis.Z)` selects topology aligned with or perpendicular to that axis depending on topology type. For faces, it is commonly used to find faces normal to the axis.
- `filter_by(Plane.XY)` selects topology parallel/coplanar to the plane.

## Operator Cheat Sheet

`ShapeList`:

- `list > Axis.Z`: sort ascending by criterion.
- `list < Axis.Z`: sort descending by criterion.
- `list >> Axis.Z`: last group by criterion.
- `list << Axis.Z`: first group by criterion.
- `list | GeomType.CIRCLE`: filter by criterion.
- `list[index]`: Python indexing/slicing.

1D objects:

- `edge @ 0.5`: position along edge.
- `edge % 0.5`: tangent along edge.
- `edge ^ 0.5`: location/frame along edge.

CAD booleans:

- `a + b`: fuse/add.
- `a - b`: cut/subtract.
- `a & b`: intersect.

Placement:

- `Plane.XZ * Pos(10, 0, 0) * Rot(Z=45) * Box(1, 2, 3)`
- `Location((1, 2, 3), (0, 0, 45)) * object`

## Workplane Gotchas

- `BuildSketch(Plane.XZ)` still draws locally on sketch `Plane.XY`, then places the sketch on `Plane.XZ`.
- Because selectors inspect actual coordinates/topology, sorting local sketch vertices by global `Axis.Z` inside a non-XY sketch can be meaningless or unstable.
- Inside `BuildSketch`, keep nested `BuildLine()` on default `Plane.XY` unless deliberately importing/reorienting geometry.
- `BuildLine` accepts a single workplane. Tuple coordinates are local to that workplane; vectors extracted from existing topology are global.
- Nested builders do not inherit parent coordinate systems.

## Constrained Construction

Use build123d's targeted constraints instead of inventing fragile coordinate math:

- `Triangle` for side/angle-driven triangles.
- `BlendCurve` with `ContinuityLevel.C1` or `C2` for smooth transitions.
- `ConstrainedArcs` and `ConstrainedLines` for tangent/contact constructions.
- `IntersectingLine` for line intersection constraints.
- `offset()` for equidistant profiles, walls, and clearances.
- `mirror()` for symmetry.

Tangency is multi-solution. Use `Tangency.ENCLOSING`, `Tangency.ENCLOSED`, `Tangency.OUTSIDE`, `Tangency.UNQUALIFIED`, `Sagitta.SHORT/LONG/BOTH`, and a deterministic `selector`.

## Debugging Selections

- Print selected counts, centers, radii, lengths, areas, and bounding boxes.
- Show selected edges/faces separately in the viewer.
- Use `show_topology()` for assemblies and complex compounds.
- Assert selector counts before modifying selected topology.
- If a selection breaks after a fillet/chamfer, move that fillet/chamfer later or select from a more stable parent face.
