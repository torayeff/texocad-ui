# Modular Build123d CAD Code

Use this reference when creating maintainable CAD-as-code rather than a one-off script.

## Recommended Structure

Small project:

```text
model.py
```

Reusable project:

```text
cad/
├── params.py
├── sketches.py
├── parts.py
├── assemblies.py
├── exports.py
└── validate.py
```

Keep viewer calls and exports out of pure geometry functions.

## Parameters

Use dataclasses or clearly grouped constants:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class BracketParams:
    length: float = 80.0
    width: float = 30.0
    thickness: float = 4.0
    hole_radius: float = 3.0
    bend_radius: float = 6.0
    clearance: float = 0.25
```

Rules:

- Store nominal dimensions, clearances, tolerances, process allowances, and export units together.
- Derive secondary dimensions from primary dimensions.
- Avoid magic numbers inside modeling functions.

## Sketch Functions

Return `Sketch`, `Curve`, `Face`, or named construction data. Keep sketch builders local.

```python
def make_plate_sketch(p: BracketParams) -> Sketch:
    with BuildSketch() as sketch:
        Rectangle(p.length, p.width)
        with GridLocations(p.length - 20, p.width - 10, 2, 2):
            Circle(p.hole_radius, mode=Mode.SUBTRACT)
    return sketch.sketch
```

Use `Mode.PRIVATE` for construction curves that should remain inspectable but not part of the final result.

## Part Functions

Return `Part` or `Solid`. Keep side effects out.

```python
def make_plate(p: BracketParams) -> Part:
    with BuildPart() as plate:
        add(make_plate_sketch(p))
        extrude(amount=p.thickness)
        top = plate.faces().sort_by(Axis.Z)[-1]
        hole_edges = top.edges().filter_by(GeomType.CIRCLE)
        chamfer(hole_edges, length=0.4)
    return plate.part
```

Rules:

- Name important selections.
- Assert feature counts for fragile selections.
- Keep final cosmetic features late.

## Assemblies

Use labels, colors, materials, and joints.

```python
def make_assembly(p: BracketParams) -> Compound:
    body = make_plate(p)
    body.label = "plate"
    return Compound(children=[body], label="bracket")
```

Use shallow copies for repeated unchanged components.

## Exports

Create one function per target:

```python
def write_step(part: Part, path: str) -> None:
    ok = export_step(part, path, unit=Unit.MM)
    assert ok
```

Name target-specific settings:

- `export_stl(..., tolerance=..., angular_tolerance=...)`
- `export_step(..., unit=Unit.MM, precision_mode=PrecisionMode.AVERAGE)`
- `ExportDXF`/`ExportSVG` layers for cut/score/engrave/hidden/visible.
- `Mesher` for 3MF and metadata.

## Validation

Use a lightweight `validate_model(model, params)` function:

```python
def validate_plate(plate: Part, p: BracketParams) -> None:
    assert plate.is_valid
    bbox = plate.bounding_box().size
    assert abs(bbox.X - p.length) < 1e-6
    assert abs(bbox.Z - p.thickness) < 1e-6
    assert (
        len(plate.faces().sort_by(Axis.Z)[-1].edges().filter_by(GeomType.CIRCLE)) == 4
    )
```

Use volume or mass assertions for regression-sensitive geometry, especially when following drawings or challenge examples.

## Import Style

For single CAD scripts and docs-like examples, `from build123d import *` is acceptable because build123d is used as a CAD DSL.

For larger software projects, prefer:

```python
import build123d as bd
```

Do not mix styles in one file without a reason.

## Agent Coding Checklist

- Add top-level parameters before geometry.
- Keep functions small and named by design intent.
- Separate geometry, assembly, export, and validation.
- Avoid viewer/export side effects in part-building functions.
- Put imports at the top of the file.
- Validate regenerated geometry after parameter changes.
