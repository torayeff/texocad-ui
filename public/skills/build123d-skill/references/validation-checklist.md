# Validation Checklist

Use this checklist before finalizing build123d CAD code, especially before export.

## Parameters

- Units are explicit or obvious from export functions.
- Critical dimensions are named parameters.
- Clearances, tolerances, kerf, tool radius, bend radius, mesh tolerances, and fit allowances are named.
- Derived dimensions are computed from primary dimensions.
- Parameter changes regenerate the model without selector breakage.

## Geometry

- `shape.is_valid` is true where available.
- Manifoldness is checked for printed/solid outputs where available.
- Bounding box matches expected size and datum position.
- Volume/area/mass matches expected values for regression-sensitive parts.
- No unintended self-intersection or single-point self-contact.
- Revolve profiles stay on one side of the revolution axis.
- Loft/sweep section order and orientation are intentional.
- Shells are watertight before conversion to solids.

## Selection Robustness

- Important selectors use geometry/topology criteria, not raw unstable indexes.
- Parent topology is selected first when helpful, e.g. top face then circular hole edges.
- Selector counts are asserted before destructive operations.
- Fillets/chamfers happen late enough that they do not destabilize downstream selectors.
- `Select.NEW`/`Select.LAST` are used only in valid builder contexts.
- Algebra workflows snapshot topology or use `new_edges(...)` for new-feature selection.

## Manufacturing

### 3D Printing

- Minimum wall, minimum hole, overhang, bridge, and clearance assumptions are checked.
- Print orientation and bed bounding box are considered.
- `pack(..., align_z=True)` is used for multi-part print plates when needed.
- STL/3MF mesh tolerance is not excessively fine or coarse.

### CNC / Machining

- Internal corners respect tool radius.
- Stock and setup datums are modeled or documented.
- Draft/chamfer/fillet choices match tool access and deburring needs.
- STEP/BREP is preferred over mesh for CAM.

### Laser / 2D Cutting

- Kerf and slot/tab clearances are included.
- Closed profiles are valid and non-self-intersecting.
- Layers distinguish cut, score, engrave, visible, hidden, or construction as needed.

## Assemblies And Joints

- Parts/subassemblies have unique labels.
- Repeated unchanged parts use shallow copies where appropriate.
- Joint labels are unique on each parent.
- Joint axes/locations match physical mating datums.
- Motion ranges are set for moving joints.
- Interference is checked at nominal and range endpoint poses.
- `do_children_intersect()` is used where collision matters.

## Drawings And Exports

- Export format matches intent: STEP for CAD/CAM, STL for simple print mesh, 3MF for metadata/multipart print, DXF/SVG for 2D, glTF for visual exchange.
- Export units are explicit.
- Mesh tolerance and angular tolerance are set intentionally.
- STEP precision mode is suitable.
- SVG/DXF layers are named and styled.
- Technical drawings include enough views, dimensions, labels, scale, and unit notes.
- Imported geometry is validated before being reused.

## Debugging Loop

When validation fails:

1. Isolate the earliest failing construction step.
2. Show/export the last valid intermediate object.
3. Print selected counts, centers, bounding boxes, normals, radii, lengths, and areas.
4. Simplify or move fillets/chamfers later.
5. Replace fragile 3D booleans with 2D profiles where possible.
6. Try alternate construction routes: loft instead of multisection sweep, split self-contacting helices, or use explicit surfaces/shells.
7. Re-run validations and keep assertions in the code if they guard design intent.
