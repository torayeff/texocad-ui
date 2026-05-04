# Build123d API Coverage Index

Use this file for practical API routing. For documented symbols and exact signatures bundled with this skill, read [api-symbol-index.md](api-symbol-index.md) first, then return here to choose the compact reference.

## Exhaustive Signature Coverage

[api-symbol-index.md](api-symbol-index.md) indexes bundled API signatures and routes each symbol to the compact reference that explains how to use it. Use it whenever the task needs broad coverage, exact syntax, overload discovery, methods/properties, or "every function" lookup.

## Modeling Interfaces

- Builder API: `BuildLine`, `BuildSketch`, `BuildPart`, builder selectors, pending edges/faces, `Locations`, `GridLocations`, `HexLocations`, `PolarLocations` -> [api-builders-locations-enums.md](api-builders-locations-enums.md)
- Algebra API: `+`, `-`, `&`, `Plane * Location * Shape`, `Pos`, `Rot`, `Location`, object arithmetic -> [build123d-workflows.md](build123d-workflows.md), [selectors-and-workplanes.md](selectors-and-workplanes.md)
- Direct API: `Axis`, `Plane`, `Vector`, `Shape`, `Edge`, `Wire`, `Face`, `Solid`, `ShapeList`, factories, transforms, projections -> [api-topology-direct.md](api-topology-direct.md)

## Object Constructors

Read [api-objects.md](api-objects.md).

- 1D curve objects: `BaseLineObject`, `Airfoil`, `Bezier`, `BlendCurve`, `CenterArc`, `ConstrainedArcs`, `ConstrainedLines`, `DoubleTangentArc`, `EllipticalCenterArc`, `EllipticalStartArc`, `ParabolicCenterArc`, `HyperbolicCenterArc`, `FilletPolyline`, `Helix`, `IntersectingLine`, `JernArc`, `Line`, `PolarLine`, `Polyline`, `RadiusArc`, `SagittaArc`, `Spline`, `TangentArc`, `ThreePointArc`, `ArcArcTangentLine`, `ArcArcTangentArc`, `PointArcTangentLine`, `PointArcTangentArc`.
- 2D sketch and drawing objects: `BaseSketchObject`, `Arrow`, `ArrowHead`, `Circle`, `DimensionLine`, `Ellipse`, `ExtensionLine`, `Polygon`, `Rectangle`, `RectangleRounded`, `RegularPolygon`, `SlotArc`, `SlotCenterPoint`, `SlotCenterToCenter`, `SlotOverall`, `TechnicalDrawing`, `Text`, `Trapezoid`, `Triangle`.
- 3D part objects and hole features: `BasePartObject`, `Box`, `Cone`, `ConvexPolyhedron`, `CounterBoreHole`, `CounterSinkHole`, `Cylinder`, `Hole`, `Sphere`, `Torus`, `Wedge`.
- Text/font helpers: `Text`, `available_fonts()`, `FontManager().register_font(...)`, `Compound.make_text(...)`.
- Custom objects: subclass/use `BaseLineObject`, `BaseSketchObject`, `BasePartObject`.

## Operations

Read [api-operations.md](api-operations.md).

- Generic operations: `add`, `bounding_box`, `chamfer`, `fillet`, `mirror`, `offset`, `project`, `project_workplane`, `scale`, `split`, `sweep`.
- Part operations: `draft`, `extrude`, `loft`, `make_brake_formed`, `revolve`, `section`, `thicken`.
- Sketch/curve operations: `full_round`, `make_face`, `make_hull`, `trace`.
- Builder selector functions: `vertex`, `vertices`, `edge`, `edges`, `wire`, `wires`, `face`, `faces`, `solid`, `solids`.

## Builders, Locations, Enums

Read [api-builders-locations-enums.md](api-builders-locations-enums.md).

- Builders: `BuildLine`, `BuildSketch`, `BuildPart`.
- Locations: `Locations`, `GridLocations`, `HexLocations`, `PolarLocations`.
- Core enums: `Align`, `CenterOf`, `FontStyle`, `GeomType`, `Keep`, `Kind`, `Mode`, `Select`, `SortBy`, `Transition`, `Until`.
- Additional enums/option families from docs and cheat sheet: `ApproxOption`, `AngularDirection`, `ContinuityLevel`, `Extrinsic`, `FrameMethod`, `HeadType`, `Intrinsic`, `LengthMode`, `MeshType`, `NumberDisplay`, `PageSize`, `PositionMode`, `PrecisionMode`, `Sagitta`, `Side`, `Tangency`, `TextAlign`, `Unit`.

## Geometry And Topology

Read [api-topology-direct.md](api-topology-direct.md).

- Geometry: `Axis`, `BoundBox`, `Color`, `Location`, `LocationEncoder`, `Pos`, `Rot`, `Matrix`, `Plane`, `Rotation`, `Vector`.
- Topology: `Shape`, `Mixin1D`, `Mixin2D`, `Mixin3D`, `Vertex`, `Edge`, `Wire`, `Face`, `Shell`, `Solid`, `Compound`, `Curve`, `Sketch`, `Part`, `ShapeList`.
- Method families: construction factories, centers/bounding boxes, transforms/movement, booleans, selectors, intersections, projections, wrapping, splitting/trimming, validity, mass/area/volume, assembly tree traversal.

## Selection And Operators

Read [selectors-and-workplanes.md](selectors-and-workplanes.md).

- `ShapeList`: `sort_by`, `sort_by_distance`, `group_by`, `filter_by`, `filter_by_position`, `>`, `<`, `>>`, `<<`, `|`, indexing/slicing.
- 1D sampling: `@`, `%`, `^`, plus `position_at`, `tangent_at`, `location_at`.
- CAD booleans: `+`, `-`, `&`.
- Placement: `Plane * object`, `Location * object`, `Plane * Pos/Rot * object`.
- New topology: `Select.NEW`, `Select.LAST`, `new_edges`.

## Assemblies, Joints, Drawings, Import/Export

Read [api-assemblies-joints-import-export.md](api-assemblies-joints-import-export.md).

- Assemblies: `Compound(children=...)`, labels, colors, materials, `parent`, `children`, anytree traversal, shallow/deep copies, `show_topology`, `pack`.
- Joints: `Joint`, `RigidJoint`, `RevoluteJoint`, `LinearJoint`, `CylindricalJoint`, `BallJoint`, `connect_to`, `relative_to`, joint ranges/symbols.
- Technical drawing: `TechnicalDrawing`, `Draft`, `Arrow`, `ArrowHead`, `DimensionLine`, `ExtensionLine`, `Text`, `project_to_viewport`, `ExportSVG`.
- 2D export/import: `ExportDXF`, `ExportSVG`, `import_svg`, `import_svg_as_buildline_code`.
- 3D export/import: `export_brep`, `export_gltf`, `export_step`, `export_stl`, `import_brep`, `import_step`, `import_stl`.
- Mesh/3MF: `Mesher`, `add_shape`, `add_meta_data`, `add_code_to_metadata`, `get_mesh_properties`, `read`, `write`, `write_stream`.

## Tutorial Pattern Routing

- Design workflow and part decomposition -> [cad-engineering.md](cad-engineering.md), [examples.md](examples.md)
- Constraints and tangency -> [selectors-and-workplanes.md](selectors-and-workplanes.md), [api-objects.md](api-objects.md)
- Lego/plates/holes/grids -> [examples.md](examples.md), [api-operations.md](api-operations.md)
- Joints and assemblies -> [api-assemblies-joints-import-export.md](api-assemblies-joints-import-export.md)
- Surface modeling, wrapping, projection, Gordon surfaces -> [api-topology-direct.md](api-topology-direct.md), [examples.md](examples.md)
- Technical drawings -> [api-assemblies-joints-import-export.md](api-assemblies-joints-import-export.md)
