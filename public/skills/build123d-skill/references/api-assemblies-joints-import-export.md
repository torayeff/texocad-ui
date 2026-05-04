# Assemblies, Joints, Drawings, Import/Export

Use this reference for multi-part models, motion interfaces, drawings, and manufacturing outputs.

## Assemblies

Build assemblies with `Compound(children=[...])` and shape metadata.

Key concepts:

- `label`: human-readable name for parts/subassemblies.
- `color`: `Color` metadata for viewers/exporters.
- `material`: material string metadata.
- `parent` / `children`: assembly tree relationships.
- Shapes are anytree nodes; use tree traversal patterns and `show_topology()` when debugging.
- Use shallow copies for repeated unchanged components to improve performance and preserve identity.
- Use deep copies only when repeated instances must diverge.

Useful APIs:

- `Compound(children=[...], label=..., color=..., material=...)`
- `Compound.do_children_intersect(include_parent=False, tolerance=...)`
- `Compound.project_to_viewport(...)`
- `Compound.get_type(Vertex | Edge | Face | Shell | Solid | Wire)`
- `Compound.unwrap(fully=True)`
- `pack(objects, padding, align_z=False)` - place independent shapes without overlap; use `align_z=True` for print beds/flat layouts.

## Joints

Joints are named connection datums attached to parts/compounds. Use meaningful labels and real mating axes/locations.

- `Joint` - base joint; exposes joint label, parent, location/symbol behavior.
- `RigidJoint(label, to_part=None, joint_location=None)` - fixed mate.
- `RevoluteJoint(label, to_part=None, axis=Axis.Z, angle_reference=None, angular_range=(0, 360))` - hinge/rotating axis.
- `LinearJoint(label, to_part=None, axis=Axis.Z, linear_range=(0, inf))` - slider/slot motion.
- `CylindricalJoint(label, to_part=None, axis=Axis.Z, angle_reference=None, linear_range=(0, inf), angular_range=(0, 360))` - combined rotation and translation.
- `BallJoint(label, to_part=None, joint_location=None, angular_range=((0, 360), (0, 360), (0, 360)), angle_reference=Plane.XY)` - spherical/socket motion.

Patterns:

- Define joints at real axes: hole axis, hinge pin axis, pipe endpoint, slot centerline, ball center.
- Use `connect_to` to mate compatible joints.
- Use `relative_to` and joint symbols during debugging.
- Test min/max joint ranges for collisions.

## Technical Drawings

Key objects:

- `TechnicalDrawing` - page border and title block.
- `Draft` - drafting style/options used by dimensions.
- `Arrow`, `ArrowHead` - annotation arrows.
- `DimensionLine`, `ExtensionLine` - internal/external dimensions.
- `Text` - labels, titles, notes.
- `project_to_viewport` - creates visible and hidden edges for 2D views.
- `ExportSVG` - writes drawing layers.

Workflow:

1. Build or import a 3D `Part`.
2. Create `TechnicalDrawing(page_size=..., title=..., drawing_scale=...)`.
3. Project standard views with `project_to_viewport`.
4. Place visible/hidden edges on the sheet with `Pos`.
5. Add `ExtensionLine`, `DimensionLine`, and `Text`.
6. Export visible/hidden lines on separate SVG/DXF layers.

## 2D Exporters

### `ExportDXF`

Use for CAD/CAM 2D exchange.

- Constructor controls DXF version, `Unit`, default color, line weight, and line type.
- `add_layer(name, color=None, line_weight=None, line_type=None)`
- `add_shape(shape, layer="")`
- `write(file_name)`

Use layers for cut/score/engrave/hidden/visible workflows.

### `ExportSVG`

Use for drawings, visual vector output, laser workflows, and documentation.

- Constructor controls `unit`, `scale`, `margin`, stroke fitting, precision, fill/line colors, line weight, and line type.
- `add_layer(name, fill_color=None, line_color=..., line_weight=..., line_type=...)`
- `add_shape(shape, layer="", reverse_wires=False)`
- `write(path)`

For drawings, place hidden lines on a different layer/style.

## 3D Exporters

- `export_brep(to_export, file_path) -> bool` - OpenCascade-native BREP; best for preserving exact OCCT topology in local workflows.
- `export_gltf(to_export, file_path, unit=Unit.MM, binary=False, linear_deflection=0.001, angular_deflection=0.1) -> bool` - visual/scene exchange.
- `export_step(to_export, file_path, unit=Unit.MM, write_pcurves=True, precision_mode=PrecisionMode.AVERAGE, timestamp=None) -> bool` - solid/assembly exchange for CAD/CAM.
- `export_stl(to_export, file_path, tolerance=0.001, angular_tolerance=0.1, ascii_format=False) -> bool` - mesh export for 3D printing; tune tolerance.

## 3MF / Mesh With `Mesher`

Use `Mesher(unit=Unit.MM)` for 3MF-like mesh workflows and metadata.

Important methods:

- `add_shape(shape, linear_deflection=0.001, angular_deflection=0.1, mesh_type=MeshType.MODEL, part_number=None, uuid_value=None)`
- `add_meta_data(name_space, name, value, metadata_type, must_preserve)`
- `add_code_to_metadata()`
- `get_mesh_properties()`
- `get_meta_data()`
- `get_meta_data_by_key(name_space, name)`
- `read(file_name) -> list[Shape]`
- `write(file_name)`
- `write_stream(stream, file_type)`

Use 3MF/mesh metadata when slicer workflows need part numbers, model/support mesh roles, or preserved metadata.

## Importers

- `import_svg(svg_file, flip_y=True, align=Align.MIN, ignore_visibility=False, label_by="id", is_inkscape_label=None) -> ShapeList[Wire | Face]` - import vector geometry. Check orientation, scale, visibility, labels, and face validity.
- `import_svg_as_buildline_code(file_name, precision=6) -> tuple[str, str]` - convert SVG paths to build123d code; inspect before using.
- `import_brep(file_name) -> Shape` - import BREP exact topology.
- `import_step(filename) -> Compound` - import STEP assemblies/solids.
- `import_stl(file_name, model_unit=Unit.MM) -> Face` - import mesh-derived geometry; not a precise editable BREP solid.

Always validate imported geometry before using it as a construction reference.

## Export Selection Guide

- Editable CAD/CAM: STEP.
- Exact OCCT local persistence: BREP.
- 3D printing simple mesh: STL.
- 3D printing multi-part/color/metadata: 3MF via `Mesher`.
- Web/visual scene: glTF.
- 2D CAM/vector exchange: DXF.
- Drawings and visual vector output: SVG.
