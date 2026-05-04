# Direct Geometry And Topology API

Use this reference when builder/algebra object constructors are not enough. For exact method signatures bundled with this skill, consult [api-symbol-index.md](api-symbol-index.md).

## Geometry Classes

- `Axis` - origin + direction; use for rotations, coaxial checks, filtering, workplane creation, intersections. Key methods: `angle_between`, `is_parallel`, `is_normal`, `is_opposite`, `is_coaxial`, `is_skew`, `reverse`, `to_plane`, `located`, `intersect`.
- `BoundBox` - axis-aligned bounding box; use for layout and validation. Key methods: `add`, `center`, `is_inside`, `overlaps`, `to_align_offset`; inspect min/max/size.
- `Color` - color metadata for shapes/assemblies/exports.
- `Location` - position + orientation transform; use for placement, joints, serialization, and direct movement. Key methods: `inverse`, `mirror`, `to_axis`, `to_tuple`, `center`, `intersect`.
- `LocationEncoder` - JSON encoding helper for `Location`.
- `Pos` - convenience location from named or positional translation; use in algebra placement.
- `Rot` / `Rotation` - rotation convenience; use with `Pos`/`Location` or object constructors.
- `Matrix` - transform matrix; key methods: `inverse`, `multiply`, `rotate`, `transposed_list`.
- `Plane` - local coordinate system/workplane. Key methods: `contains`, `from_local_coords`, `to_local_coords`, `intersect`, `location_between`, `move`, `moved`, `offset`, `reverse`, `rotated`, `shift_origin`, `to_gp_ax2`.
- `Vector` - 3D vector/point. Key methods: `add`, `sub`, `multiply`, `dot`, `cross`, `normalized`, `reverse`, `rotate`, `distance_to_plane`, `signed_distance_from_plane`, `project_to_line`, `project_to_plane`, `get_angle`, `get_signed_angle`, `to_tuple`, `to_pnt`, `to_dir`, `transform`, `intersect`.

## Topology Classes

- `Shape` - base topological object. Method families: boolean operations, transforms, copy, move, mirror, scale, bounding boxes, center, mass/area/volume, validity, export helpers, selectors.
- `Mixin1D` - shared curve/edge/wire behavior. Key methods: `position_at`, `positions`, `tangent_at`, `location_at`, `locations`, `derivative_at`, `normal`, `offset_2d`, `project`, `perpendicular_line`, `common_plane`, `curvature_comb`, `start_point`, `end_point`.
- `Mixin2D` - shared face/sketch behavior. Key families: face area, normal, location/position at UV, outer/inner wires, holes, 2D fillet/chamfer, projecting/wrapping.
- `Mixin3D` - shared solid/part behavior. Key families: volume/mass, solids, shells, faces, boolean and intersection operations.
- `Vertex` - point topology; construct from coordinates, iterable, or OCP vertex. Use in selectors, curve endpoints, and face vertices.
- `Edge` - curve edge. Key methods: `close`, `distribute_locations`, `find_intersection_points`, `find_tangent`, `geom_equal`, `param_at`, `param_at_point`, `project_to_shape`, `reversed`, `to_axis`, `to_wire`, `trim`, `trim_infinite`, `trim_to_length`, `trim_to_other`.
- `Wire` - connected edge sequence. Use for boundaries, paths, and profiles. Method families: close/order edges, offset, project, make wire factories, combine edges.
- `Face` - bounded surface. Key methods: `outer_wire`, `inner_wires`, `make_holes`, `without_holes`, `is_inside`, `is_coplanar`, `normal_at`, `position_at`, `location_at`, `project_to_shape`, `wrap`, `wrap_faces`, `to_arcs`, `fillet_2d`, `chamfer_2d`, `center`.
- `Shell` - collection of connected faces; use for surface modeling and shell-to-solid workflows.
- `Solid` - 3D solid. Use direct factories for boxes, cylinders, cones, spheres, lofts, sweeps, revolves, thickening, and shell conversion when object constructors are insufficient.
- `Compound` - collection/tree of shapes. Use for assemblies, grouped exports, labels/colors/materials, children/parent, `project_to_viewport`, `do_children_intersect`, `get_type`, `touch`, `unwrap`, `compound`, `compounds`.
- `Curve` - compound-like 1D aggregate for algebra curve workflows.
- `Sketch` - compound-like 2D aggregate for algebra sketch workflows.
- `Part` - compound-like 3D aggregate for algebra part workflows.
- `ShapeList` - list-like selection result with CAD-aware sort/group/filter methods.
- `Joint` - base assembly joint object; see [api-assemblies-joints-import-export.md](api-assemblies-joints-import-export.md).

## Factory Method Families

Use direct factories when high-level constructors are too restrictive:

- `Edge.make_*`: lines, arcs, splines, ellipses, Beziers, or edges from axes/curves.
- `Wire.make_*`: wires from edges, polygons, rects, circles, helices, or ordered paths.
- `Face.make_*`: planes, faces from wires, surfaces, ruled surfaces, holes, projections, and wrapped faces.
- `Shell.make_*`: shells from faces or loft/surface workflows.
- `Solid.make_*`: boxes, cylinders, cones, spheres, torus-like primitives, loft/sweep/revolve/thicken, solids from shells.
- `Compound.make_text(...)`: especially useful for unoutlined single-line CAD text.

For exact factory signatures, use [api-symbol-index.md](api-symbol-index.md), especially the `Direct API Factory And Class Methods` section.

## Direct Selection And Inspection

Common calls:

```python
shape.vertices()
shape.edges()
shape.wires()
shape.faces()
shape.shells()
shape.solids()
shape.compounds()
shape.bounding_box()
shape.center(CenterOf.MASS)
shape.is_valid
```

Use `ShapeList` methods for stable selection:

```python
part.faces().filter_by(GeomType.PLANE).sort_by(Axis.Z)[-1]
part.edges().filter_by(GeomType.CIRCLE).group_by(SortBy.RADIUS)
```

## Projection, Wrapping, And Surface Work

- `project_to_viewport` creates visible/hidden 2D edges for technical drawings.
- `Edge.project_to_shape` and `Face.project_to_shape` project curves/faces onto targets.
- `Face.wrap` and `Face.wrap_faces` wrap planar geometry onto surfaces.
- For non-planar faces, prefer `Face.make_surface(...)` from boundary wires/edges and optional surface points when normal `extrude`/`revolve`/`sweep`/`loft` cannot express the shape.
- Use `Face.make_bezier_surface(...)`, `Face.make_surface_from_array_of_points(...)`, `Face.make_surface_from_curves(...)`, or `Face.make_surface_patch(...)` for explicit freeform patches.
- Use `Face.make_gordon_surface(profiles, guides, tolerance=...)` only when the profile/guide network intersects consistently and boundary curves close the intended surface.
- Surface workflows require watertight `Shell` topology before creating a valid `Solid`; reuse the same `Edge` objects across adjacent faces when continuity matters.
- For curved text/tread/graphics, make source faces/curves larger than the target projection area if clipping is possible.

## Direct Import Functions

Also covered in import/export reference:

- `import_brep(file_name) -> Shape`
- `import_step(filename) -> Compound`
- `import_stl(file_name, model_unit=Unit.MM) -> Face`
- `import_svg(...) -> ShapeList[Wire | Face]`
- `import_svg_as_buildline_code(file_name, precision=6) -> tuple[str, str]`

Validate imported topology before using it as a construction reference.
