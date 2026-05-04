# API Operations

Compact coverage for build123d operation functions. For exact signatures bundled with this skill, consult [api-symbol-index.md](api-symbol-index.md).

## Operation Rules

- Operations take existing objects and produce new objects or modify the active builder.
- Builder mode can omit object arguments when pending/current builder objects are unambiguous.
- Algebra mode passes objects explicitly.
- Operations are positioned by input geometry. `Locations` does not relocate operation results.
- Use `mode` in builder mode; use `+`, `-`, `&` in algebra mode.

## Generic Operations

- `add(objects, rotation=None, clean=True, mode=Mode.ADD)` - add shapes, compounds, or builders into the active builder; use for imported geometry or adding a prepared sketch/part.
- `bounding_box(objects=None, mode=Mode.PRIVATE)` - create 2D/3D bounding box as sketch/part; useful for inspection, packaging, and layout.
- `chamfer(objects, length, length2=None, angle=None, reference=None)` - bevel vertices/edges; use `length2` or `angle`, not both; reference controls measured side.
- `fillet(objects, radius)` - radius vertices/edges; delay 3D fillets until topology is stable.
- `mirror(objects=None, about=Plane.YZ, mode=Mode.ADD)` - mirror curves, sketches, parts, or compounds about a plane; primary symmetry tool.
- `offset(objects=None, amount=0, openings=None, kind=Kind.ARC, side=Side.BOTH, closed=True, min_edge_length=None, mode=Mode.REPLACE)` - offset 1D/2D/3D geometry; use `openings` for hollowing solids.
- `project(objects=None, workplane=None, target=None, mode=Mode.ADD)` - project points, lines, wires, or faces to workplane/target; use for curved or face-based construction.
- `project_workplane(origin, x_dir, projection_dir, distance)` - create a workplane for projection from origin/direction data.
- `scale(objects=None, by=1, mode=Mode.REPLACE)` - uniform or XYZ scale; be careful with tolerance-critical models.
- `split(objects=None, bisect_by=Plane.XY, keep=Keep.TOP, mode=Mode.REPLACE)` - split objects by plane/face/shell; use `Keep.ALL/BOTH/TOP/BOTTOM/INSIDE/OUTSIDE`.
- `sweep(sections=None, path=None, multisection=False, is_frenet=False, transition=Transition.TRANSFORMED, normal=None, binormal=None, clean=True, mode=Mode.ADD)` - sweep profile(s) along a path; use `edge ^ t` to orient profiles. If fragile, try loft.

## Part Operations

- `draft(faces, neutral_plane, angle)` - taper faces relative to a neutral plane; use for cast/molded parts.
- `extrude(to_extrude=None, amount=None, dir=None, until=None, target=None, both=False, taper=0, clean=True, mode=Mode.ADD)` - turn faces/sketches into parts; use `Until` with `target` for topology-driven cuts.
- `loft(sections=None, ruled=False, clean=True, mode=Mode.ADD)` - build between profiles/vertices; ensure profile ordering and orientation are stable.
- `make_brake_formed(thickness, station_widths, line=None, side=Side.LEFT, kind=Kind.ARC, clean=True, mode=Mode.ADD)` - sheet metal/brake-formed parts from bend line/stations.
- `revolve(profiles=None, axis=Axis.Z, revolution_arc=360, clean=True, mode=Mode.ADD)` - rotate profile(s) about an axis; keep profile on one side of axis.
- `section(obj=None, section_by=Plane.XY, height=0, clean=True, mode=Mode.PRIVATE)` - create 2D slices of parts for inspection, drawings, or manufacturing profiles.
- `thicken(to_thicken=None, amount=None, normal_override=None, both=False, clean=True, mode=Mode.ADD)` - thicken faces/sketches into parts.

## Sketch/Curve Operations

- `full_round(edge, invert=False, voronoi_point_count=100, mode=Mode.REPLACE)` - replace a face edge with a full round; useful for drawing-derived profiles.
- `make_face(edges=None, mode=Mode.ADD)` - create a face from closed edges/wires; usually follows `BuildLine`.
- `make_hull(edges=None, mode=Mode.ADD)` - convex hull from edges; useful for tangential/simple envelope profiles.
- `trace(lines=None, line_width=1, mode=Mode.ADD)` - convert lines into faces with width; useful for traces, routes, and engraving-like profiles.

## Builder Selector Helpers

Use inside builder scopes to select active topology:

- `vertex(select=Select.ALL)` / `vertices(select=Select.ALL)`
- `edge(select=Select.ALL)` / `edges(select=Select.ALL)`
- `wire(select=Select.ALL)` / `wires(select=Select.ALL)`
- `face(select=Select.ALL)` / `faces(select=Select.ALL)`
- `solid(select=Select.ALL)` / `solids(select=Select.ALL)`

Selection scopes:

- `Select.ALL`: all current topology.
- `Select.LAST`: topology from the last operation.
- `Select.NEW`: truly new topology created by the last operation. It can miss reused/modified topology.

## Operation Patterns

### 2D Hole Pattern Before Extrude

For dense through-hole patterns, subtract circles in a sketch and extrude once. This is often faster and more robust than many 3D booleans.

```python
with BuildPart() as plate:
    with BuildSketch():
        Rectangle(length, width)
        with GridLocations(dx, dy, nx, ny):
            Circle(hole_radius, mode=Mode.SUBTRACT)
    extrude(thickness)
```

### Face Workplane Cut

```python
with BuildSketch(part.faces().sort_by(Axis.Z)[-1]):
    SlotOverall(slot_length, slot_width)
extrude(amount=-depth, mode=Mode.SUBTRACT)
```

### Stable Fillet

```python
top = part.faces().sort_by(Axis.Z)[-1]
edges_to_round = top.edges().filter_by(GeomType.LINE).sort_by(SortBy.LENGTH)
fillet(edges_to_round, radius)
```

## Failure Recovery

- `make_face` fails: inspect closure, common plane, duplicate/self-intersecting edges.
- `extrude` fails: simplify profile, fix invalid faces, avoid self-touching inner wires.
- `sweep` fails: try simpler path, fixed normal/binormal, `is_frenet`, or `loft`.
- `offset` fails: reduce amount, change `Kind`, split self-intersecting loops, or offset in 2D first.
- `fillet/chamfer` fails: use smaller radius/length, filter out tangent/short edges, move operation later.
