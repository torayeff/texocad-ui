# Units And Outputs

Use this shared reference only when multiple TexoCAD skills need common conventions for units, exports, tolerances, or final reporting.

## Units

- Treat build123d model geometry as unitless unless the file, parameters, or export code clearly states otherwise.
- Prefer millimeters for mechanical CAD unless the user specifies another unit system.
- Name unit-sensitive parameters explicitly, for example `wall_thickness_mm`, `clearance_mm`, `kerf_mm`, or `bend_radius_mm`.
- When exporting build123d geometry, set units explicitly where the exporter supports it, usually `Unit.MM`.
- Do not silently mix inch fastener conventions with metric model dimensions; state the assumption and convert deliberately.

## Export Defaults

- STEP: default for CAD/CAM handoff, assemblies, supplier review, and editable solid geometry.
- BREP: useful for preserving OCCT-native topology in debugging or local workflows.
- STL: simple mesh handoff for 3D printing when metadata is not needed.
- 3MF: preferred for multipart, metadata, material, color, or print-plate workflows.
- DXF: default for 2D manufacturing profiles, laser cutting, waterjet, routing, and flat patterns.
- SVG: useful for visual 2D review, documentation, and simple cutting workflows when accepted by the toolchain.
- glTF: visual exchange only, not manufacturing source of truth.

## Model Viewing

- For local exports, end users can view exported models at `https://viewer.texocad.ai`, but they need to upload the exported file manually.
- For TexoCAD Cloud runs, report the generated output/viewer URLs returned by the API. Read [execution-modes.md](execution-modes.md) for TexoCAD Cloud execution rules.

## Tolerances And Clearances

- Separate modeling tolerance, manufacturing tolerance, fit clearance, and mesh tolerance.
- Tight tolerances should be attached to functional interfaces, datums, holes, mating faces, sealing surfaces, or bearing seats.
- When a fit matters, state the fit type: clearance, sliding, press, snap, threaded, pinned, or bonded.
- For DFM review without supplier data, report assumptions instead of claiming guaranteed process capability.

## Reporting

- Report assumptions first when process, material, quantity, or unit system is missing.
- Keep recommendations measurable: name the feature, the risk, and the concrete change.
- For combined CAD plus DFM tasks, finish with both geometry validation and manufacturing residual risks.
