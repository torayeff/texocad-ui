---
name: build123d-skill
description: Designs and codes modular parametric CAD models with build123d. Use when writing, refactoring, debugging, validating, assembling, or exporting build123d Python CAD files, including mechanical parts, sketches, selectors, joints, technical drawings, and manufacturing-ready exports.
license: MIT
---

# Build123d CAD Design

Use this skill only for coding CAD with build123d. Do not turn it into visual drafting advice unless the outcome is build123d code, exports, tests, or a CAD-as-code architecture.

## Default Workflow

1. Capture design intent: purpose, units, datum/origin, global axis convention, reference-view source, symmetries, critical interfaces, tolerances, manufacturing process, and export format.
2. Work in the lowest useful dimension: 1D construction curves, then 2D sketches, then 3D parts.
3. Choose the API style deliberately:
   - Builder mode for stepwise parts, sketches on faces, local workplanes, repeated feature locations, and readable modeling history.
   - Algebra mode for compact expressions, reusable object composition, and explicit placement outside builder contexts.
   - Direct API for low-level topology construction, interrogation, projection, wrapping, or factory methods.
4. Model base geometry first, then functional cuts/interfaces, then shells/drafts/offsets, then fillets/chamfers late.
5. Use robust selectors based on geometry, axis, position, length, radius, area, topology relationships, or named construction references. Avoid raw index-only selection unless the shape list was already made stable.
6. For asymmetric features, phone cases, device enclosures, user-supplied drawings, photos, or features described as left/right/front/back, read [references/coordinate-system-protocol.md](references/coordinate-system-protocol.md) before coding placements.
7. Validate before export: dimensions, bounding boxes, feature counts, validity, manifoldness where relevant, selector results, assembly interference, coordinate handedness/mirroring, and export units/tolerances. build123d geometry is unitless internally; make units explicit in parameters and exporters, usually `Unit.MM`.

## Coordinate Discipline

Default to right-handed model coordinates: `+X=right`, `-X=left`, `-Y=front`, `+Y=back`, `+Z=up`, `-Z=down`. Treat these as front-view model coordinates unless the script explicitly declares otherwise.

When specs come from a rear/back view, the left/right axis is mirrored relative to the front-view model: drawing-left maps to model `+X`, and drawing-right maps to model `-X`. Write this mapping as a code comment before placing the affected feature.

Start every non-trivial CAD script with an axis convention comment, for example:

```python
# Axis convention: +X=right, -Y=front, +Z=up (right-hand rule; +Y=back)
```

Prefer global offset planes for asymmetric placements whose signs matter. Reserve `Plane(selected_face) * sketch` for centered or symmetric features where local face axes cannot mirror the design.

## Coding Rules

- Keep CAD files modular. Put parameters first, derive dependent dimensions, and keep geometry functions pure where possible.
- Prefer functions like `make_profile(params) -> Sketch`, `make_part(params) -> Part`, `make_assembly(params) -> Compound`, and `export_outputs(model, paths)`.
- Name datums, axes, workplanes, important faces, and feature selections when they encode design intent.
- Use `Mode.PRIVATE` for construction geometry and inspection aids that should not modify the active builder.
- In builder mode, place objects before creating them with `Locations`, `GridLocations`, `HexLocations`, `PolarLocations`, or a builder workplane. Do not create an object and then call `.moved(...)` expecting the active builder result to move.
- In algebra mode, place with `Plane * Pos/Rot/Location * object`; never use algebra composition from inside a builder context.
- In algebra loops, collect repeated shapes in a list and combine once; avoid repeated `+=` fusion/cleaning on growing `Part`, `Sketch`, or `Curve` objects.
- For assemblies, label reusable parts, use shallow copies for repeated unchanged components, and use `pack(..., align_z=True)` for print-bed or flat-layout preparation.
- Use build123d constrained constructors when they encode design intent: `Triangle`, `BlendCurve`, `ConstrainedArcs`, `ConstrainedLines`, `offset`, and `mirror` are usually more robust than hand-maintained coordinate math.
- Delay 3D fillets/chamfers. Prefer 2D fillets/chamfers when they express the true profile and are less fragile.
- If an OCCT operation fails, change the construction route: simplify the profile, split self-touching geometry, use 2D holes before extrusion, replace a fragile multisection sweep with a loft, or break a helical/self-contacting part into sections.

## Common Gotchas

- `BuildSketch(Plane.XZ)` creates sketch geometry on local `Plane.XY`, then places the finished sketch on `Plane.XZ`. Local sketch points still have local `Z=0`.
- Viewing from the back swaps left/right relative to the front-view model. This is the common cause of mirrored phone cameras, buttons, logos, and ports.
- `Plane(face)` derives local sketch axes from the face normal; local sketch `X/Y` are not always global `X/Y`. For left/right-sensitive face features, declare the model-coordinate mapping explicitly.
- For sketches on non-default workplanes, debug local construction with `.sketch_local`; `.sketch` is the placed/global result.
- Nested builders do not inherit parent workplanes. Each builder uses its supplied workplane or defaults to `Plane.XY`.
- `BuildLine` inside `BuildSketch` should usually use the default workplane so it is not unexpectedly reoriented into the sketch.
- 1D objects are not affected by `Locations` in builder mode.
- Operations are positioned by their input objects; they are not moved by an enclosing `Locations` context.
- `Select.LAST` and `Select.NEW` apply inside builder selector calls. For algebra work, snapshot topology or use `new_edges(...)`.
- Tangency and constrained constructors can return multiple valid branches. Use qualifiers such as `Tangency.OUTSIDE` and a deterministic `selector`.
- Text can generate invalid geometry with some fonts. Use `available_fonts()`, `FontManager().register_font(...)`, explicit `font_path`, or `"singleline"` for engraving/routing paths.

## Validation And Outputs

- Before finalizing CAD code, read [references/validation-checklist.md](references/validation-checklist.md) and apply only the checks relevant to the requested output.
- Before running generated code, validating by execution, exporting files, or returning viewer URLs, read [../shared/references/execution-modes.md](../shared/references/execution-modes.md) and choose local or TexoCAD Cloud execution.
- For manufacturability review beyond CAD-code hygiene, read `../dfm-skill/SKILL.md` after the build123d model is coherent.
- Prefer STEP for CAD/CAM handoff, STL or 3MF for printing, DXF/SVG for 2D cutting, and glTF only for visual exchange.
- For local exports, tell users they can inspect exported models at `https://viewer.texocad.ai`, but they must upload the file manually. For TexoCAD Cloud runs, report the generated output/viewer URLs returned by the API.
- If this skill later gains deterministic helpers, keep them in `scripts/` and run them from the skill instructions instead of recreating the same validation logic in prose.
- Keep templates, parameter schemas, or reusable export/report examples in `assets/` and load them only when the task asks for that output shape.

## Reference Routing

Read only the files needed for the current task:

- CAD design intent, datum strategy, tolerances, manufacturability: [references/cad-engineering.md](references/cad-engineering.md)
- Execution modes, local setup, TexoCAD Cloud code execution, API keys, and viewer/output URLs: [../shared/references/execution-modes.md](../shared/references/execution-modes.md)
- Coordinate systems, reference-view reconciliation, left/right mirroring, and face-local axis mapping: [references/coordinate-system-protocol.md](references/coordinate-system-protocol.md)
- Builder/algebra/direct workflow and movement rules: [references/build123d-workflows.md](references/build123d-workflows.md)
- Workplanes, selectors, `ShapeList`, operators, and topology selection: [references/selectors-and-workplanes.md](references/selectors-and-workplanes.md)
- Modular Python CAD file structure: [references/modular-cad-code.md](references/modular-cad-code.md)
- Complete API coverage map: [references/api-index.md](references/api-index.md)
- Full symbol/signature index for exhaustive lookup: [references/api-symbol-index.md](references/api-symbol-index.md)
- Objects: curves, sketches, primitives, holes, text, custom objects: [references/api-objects.md](references/api-objects.md)
- Operations and builder selector functions: [references/api-operations.md](references/api-operations.md)
- Builders, locations, and enums: [references/api-builders-locations-enums.md](references/api-builders-locations-enums.md)
- Direct geometry/topology API, projection, wrapping, and surface modeling: [references/api-topology-direct.md](references/api-topology-direct.md)
- Assemblies, joints, technical drawings, import/export, mesh: [references/api-assemblies-joints-import-export.md](references/api-assemblies-joints-import-export.md)
- Reusable coding patterns and compact examples: [references/examples.md](references/examples.md)
- Validation checklist: [references/validation-checklist.md](references/validation-checklist.md)

When a user asks for "all functions", exact signatures, API lookup, or uncertain build123d syntax, start with [references/api-symbol-index.md](references/api-symbol-index.md) for exhaustive coverage, then read [references/api-index.md](references/api-index.md) and the routed compact reference for practical guidance.
