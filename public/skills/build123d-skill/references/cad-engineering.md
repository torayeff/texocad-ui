# CAD Engineering For Build123d Code

Use this reference when a task needs design judgment, not just API syntax.

## Design Intent First

- Identify the functional interfaces: mounting holes, mating faces, shafts, bearings, clearances, fasteners, motion ranges, and datum references.
- Choose the origin at a symmetry center, mating datum, rotation axis, or manufacturing setup datum.
- Record units and manufacturing assumptions as parameters, not comments hidden near exports.
- Prefer named design parameters over literal dimensions. Derive secondary dimensions from critical ones.
- Model symmetries as code: create a half/quarter/profile and `mirror()` rather than duplicating coordinates.

## Feature Order

1. Base profiles and primary solids.
2. Functional interfaces: holes, slots, bosses, ribs, datums, mating pads.
3. Wall thickness, shells, offsets, drafts, and manufacturing relief.
4. Secondary details: text, labels, cosmetic ribs.
5. Fillets and chamfers, especially 3D ones, as late as possible.

Late fillets/chamfers keep selections and booleans simpler. A 2D fillet in a profile is often more robust than a 3D fillet after extrusion when the rounded edge is part of the true design intent.

## Tolerances And Clearances

Name process-specific allowances:

- `clearance_sliding`, `clearance_press_fit`, `clearance_printed_pin`
- `kerf`, `tool_radius`, `bend_radius`, `min_wall`, `min_hole_diameter`
- `stock_allowance`, `draft_angle`, `mesh_tolerance`, `angular_tolerance`

Validate tolerances where they matter: hole diameters, wall thickness, slot width, mating distance, and motion limits.

## Manufacturing Guidance

### 3D Printing

- Model in `Unit.MM` unless there is a strong reason not to.
- Parameterize nozzle/min-wall assumptions and fit clearances.
- Use `pack(objects, padding, align_z=True)` for build plates.
- Use 3MF through `Mesher` when colors, multiple parts, metadata, or richer slicer data matter. Use binary STL for simple mesh exchange.
- Tune `tolerance` and `angular_tolerance`; tiny tolerances create huge files without better printed parts.

### CNC / Machining

- Model tool access, setup datums, real cutter radii, stock, and minimum internal corner radius.
- Avoid impossible sharp internal corners unless they are intentionally EDM/laser/waterjet features.
- Prefer STEP/BREP for CAM and inspection. Avoid STL unless the CAM workflow is mesh based.
- Add chamfers/fillets intentionally: deburr, fit, stress relief, or toolpath needs.

### Laser / 2D Cutting

- Generate 2D profiles, sections, or projected faces.
- Use DXF for CAD/CAM exchange; SVG for visual/vector workflows.
- Encode cut/score/engrave as layers in `ExportDXF` or `ExportSVG`.
- Parameterize kerf and tab/slot clearance.

### STEP Exchange

- Use STEP for editable solid and assembly exchange.
- Preserve units, labels, colors, and material metadata where needed.
- Validate imported STEP geometry before using it as a reference for downstream features.

## Assemblies And Motion

- Label every reusable part and important subcompound.
- Use shallow copies for repeated unchanged components such as screws, bearings, links, and spacers.
- Define joints at true mating datums: hole axes, hinge axes, slot centerlines, pipe endpoints, or ball centers.
- Use `RigidJoint` for fixed mating, `RevoluteJoint` for hinges, `LinearJoint` for sliders, `CylindricalJoint` for screw-like motion, and `BallJoint` for spherical motion.
- Always set and test realistic ranges for moving joints.
- Check interference at representative positions, not only nominal assembly pose.

## Engineering Validation

At minimum, validate:

- Bounding box and datum location.
- Expected volume, area, or mass for regression-sensitive models.
- Expected counts for selected faces, edges, holes, solids, and joints.
- `is_valid` and manifoldness where the topology type supports it.
- Clearances, min wall, min hole, tool radius, kerf, overhang, bed size, stock size, and motion range.
- Export units and mesh tolerances.

Use [validation-checklist.md](validation-checklist.md) for a task checklist.
