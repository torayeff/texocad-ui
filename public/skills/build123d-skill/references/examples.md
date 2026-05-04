# Build123d Pattern Catalog

Use these compact examples as patterns. Adapt dimensions, names, selectors, and validation to the user's model.

## Core Recipe

```python
from build123d import *

with BuildPart() as model:
    with BuildSketch():
        # 2D design intent first
        Rectangle(length, width)
    extrude(amount=height)

part = model.part
```

Default order: choose origin -> define parameters -> make curves/sketches -> make faces -> extrude/revolve/sweep/loft -> select topology -> finish -> validate -> export.

## Plate With Holes

Use sketch subtraction before extrusion for dense through-hole patterns.

```python
with BuildPart() as plate:
    with BuildSketch():
        Rectangle(length, width)
        with GridLocations(length - 2 * margin, width - 2 * margin, 2, 2):
            Circle(hole_radius, mode=Mode.SUBTRACT)
    extrude(amount=thickness)
```

## Face-As-Workplane Feature

```python
with BuildPart() as body:
    Box(length, width, thickness)
    top = body.faces().sort_by(Axis.Z)[-1]
    with BuildSketch(top):
        SlotOverall(slot_length, slot_width)
    extrude(amount=-slot_depth, mode=Mode.SUBTRACT)
```

Use this for slots, pockets, labels, bosses, and face-local features.

## Robust Edge Finishing

```python
top = part.faces().sort_by(Axis.Z)[-1]
hole_edges = top.edges().filter_by(GeomType.CIRCLE)
assert len(hole_edges) == expected_holes
chamfer(hole_edges, length=0.5)
```

Select the parent face first, then the child edges.

## Symmetric Profile

```python
with BuildSketch() as sketch:
    with BuildLine():
        FilletPolyline(
            (0, 0), (length / 2, 0), (length / 2, height), radius=bend_radius
        )
        offset(amount=thickness, side=Side.LEFT)
    make_face()
    mirror(about=Plane.YZ)
```

Model half/quarter geometry and mirror it.

## Revolved Part

```python
with BuildPart() as turned:
    with BuildSketch(Plane.XZ):
        with BuildLine():
            Polyline((radius, 0), (radius, height), (0, height), (0, 0), close=True)
        make_face()
    revolve(axis=Axis.Z)
```

Keep the profile on one side of the rotation axis to avoid invalid self-intersections.

## Sweep Along A Path

```python
with BuildLine() as path:
    Spline((0, 0, 0), (20, 0, 10), (40, 10, 10))

with BuildPart() as swept:
    with BuildSketch(path.line ^ 0):
        Circle(section_radius)
    sweep(path=path.line)
```

Use `edge_or_wire ^ t` to place a section on the path frame.

## Loft Between Sections

```python
with BuildPart() as lofted:
    with BuildSketch(Plane.XY):
        Circle(r1)
    with BuildSketch(Plane.XY.offset(height)):
        Rectangle(w2, h2)
    loft()
```

Keep section order and orientation predictable. Use ruled lofts for straight transitions.

## Offset Walls

```python
with BuildSketch() as wall:
    with BuildLine():
        Polyline(points, close=True)
        offset(amount=wall_thickness, side=Side.LEFT)
    make_face()
```

For hollow solids, use `offset(amount=-wall, openings=[...])` and select openings explicitly.

## Constrained Tangency

```python
with BuildLine():
    base = CenterArc((0, 0), 20, 0, 180)
    ConstrainedArcs(
        (base, Tangency.OUTSIDE),
        (Axis.X, Tangency.UNQUALIFIED),
        radius=5,
        sagitta=Sagitta.SHORT,
        selector=lambda arcs: arcs.sort_by_distance((0, 0))[0],
    )
```

Constrained arcs/lines can have many valid solutions. Qualify and select deterministically.

## Text Emboss Or Engrave

```python
with BuildPart() as tag:
    Box(60, 20, 3)
    with BuildSketch(tag.faces().sort_by(Axis.Z)[-1]):
        Text("A1", font_size=8)
    extrude(amount=0.4)  # emboss
```

For engraving, subtract the extrusion. For CNC line engraving, consider `Compound.make_text(..., "singleline")`.

## Surface And Wrapping Patterns

- Use `project_to_shape` to project curves/faces onto target solids.
- Use `Face.wrap` or `Face.wrap_faces` to wrap planar graphics/tread/text onto curved surfaces.
- Use `Face.make_surface(...)`, `Face.make_surface_from_curves(...)`, `Face.make_surface_patch(...)`, or `Face.make_gordon_surface(...)` only when profiles cannot be represented by normal extrude/revolve/sweep/loft.
- For Gordon surfaces, profiles and guides must form a consistent network: curves intersect, endpoints land on boundary curves, and point profiles/guides only appear at the first or last station.
- Convert to a solid only after the shell is watertight.

## Assembly And Joints

```python
base.label = "base"
arm.label = "arm"
base_joint = RigidJoint("mount", base, joint_location=Location(...))
arm_joint = RevoluteJoint("hinge", arm, axis=Axis.Z, angular_range=(-45, 45))
arm_joint.connect_to(base_joint)
assembly = Compound(children=[base, arm], label="hinged_assembly")
```

Use real datum axes and test joint range endpoints.

## Technical Drawing

```python
visible, hidden = part.project_to_viewport(
    (100, 100, 100), (0, 0, 1), look_at=(0, 0, 0)
)
border = TechnicalDrawing(title="Part", sub_title="Units: mm", page_size=PageSize.A4)
exporter = ExportSVG(unit=Unit.MM)
exporter.add_layer("Visible")
exporter.add_layer("Hidden", line_type=LineType.ISO_DOT)
exporter.add_shape(visible, layer="Visible")
exporter.add_shape(hidden, layer="Hidden")
exporter.add_shape(border, layer="Visible")
exporter.write("part.svg")
```

Add `ExtensionLine`, `DimensionLine`, and `Text` for inspection drawings.

## Export Patterns

```python
assert export_step(part, "part.step", unit=Unit.MM)
assert export_stl(part, "part.stl", tolerance=0.01, angular_tolerance=0.1)

svg = ExportSVG(unit=Unit.MM)
svg.add_layer("Cut")
svg.add_shape(profile, layer="Cut")
svg.write("profile.svg")
```

## Debug Pattern

```python
selection = part.edges().filter_by(GeomType.CIRCLE)
print(len(selection), [e.radius for e in selection if hasattr(e, "radius")])
assert len(selection) == expected
```

If a feature fails, show or export the intermediate sketch/part before the failing operation.
