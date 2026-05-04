# Coordinate System Protocol

Treat this protocol as the source of truth for placement, handedness, reference-view reconciliation, and mirror checks. If a drawing, sketch plane, or local face axes create ambiguity, resolve it explicitly with this protocol before coding.

build123d follows the right-hand rule. The default working plane is `Plane.XY` with origin at `(0, 0, 0)`.

## Default Axis Convention

Use this convention unless the geometry demands otherwise:

- `+X = right`: viewer's right when looking at the front face
- `-X = left`
- `-Y = front`: toward the viewer / front face normal
- `+Y = back`: away from the viewer / rear face normal
- `+Z = up`: top of the object
- `-Z = down`: bottom of the object

This matches build123d named planes and the frontend viewer semantics:

- `FRONT = -Y`
- `BACK = +Y`
- `RIGHT = +X`
- `LEFT = -X`
- `TOP = +Z`
- `BOTTOM = -Z`

This means:

- The top face lies in the XY plane at some `+Z`.
- The bottom face lies in the XY plane at some `-Z`.
- The front face lies in the XZ plane at some `-Y`.
- The back face lies in the XZ plane at some `+Y`.
- Viewing from the front (`-Y` toward you): left is `-X`, right is `+X`, up is `+Z`.
- Viewing from the back (`+Y` toward you): left and right swap relative to front view. This is the key source of mirror errors.

## Plane Pairs And Normals

Each pair describes the same geometric plane with different local-axis order and opposite normal:

- `Plane.XY` normal = `+Z`; `Plane.YX` normal = `-Z`: top / bottom
- `Plane.XZ` normal = `-Y`; `Plane.ZX` normal = `+Y`: front / back
- `Plane.YZ` normal = `+X`; `Plane.ZY` normal = `-X`: right / left

Choose the plane whose local 2D axes and normal direction match the intended drawing convention and cut direction.

## Common Face Selectors

For a part centered at origin, select the actual face when possible:

```python
front = part.faces().sort_by(Axis.Y)[0]
back = part.faces().sort_by(Axis.Y)[-1]
right = part.faces().sort_by(Axis.X)[-1]
left = part.faces().sort_by(Axis.X)[0]
top = part.faces().sort_by(Axis.Z)[-1]
bottom = part.faces().sort_by(Axis.Z)[0]
```

Sketching on a selected face automatically orients the sketch plane so that a negative extrude (`amount < 0`) cuts into the solid. This avoids many offset/extrude sign errors that occur with manual plane construction.

## Local Axis Mapping Warning

`Plane(face)` derives the sketch's local 2D axes from the face normal to form a right-handed frame. The local sketch axes are not always global `X/Y`:

- Top / bottom faces: local coordinates correspond to global `X/Y`
- Front / back faces: local coordinates correspond to global `X/Z`
- Right / left faces: local coordinates correspond to global `Y/Z` or `Z/Y`, depending on plane orientation

For asymmetric features whose placement depends on correct left/right or top/bottom sign, use an explicit global offset plane:

- Top / bottom: `Plane.XY.offset(z)` or `Plane.YX.offset(z)`
- Front / back: `Plane.XZ.offset(front_offset)` or `Plane.ZX.offset(back_offset)`
- Right / left: `Plane.YZ.offset(x)` or `Plane.ZY.offset(x)`

Example front-face placement with global `X/Z` offsets:

```python
sketch = (
    Plane.XZ.offset(front_offset)
    * Pos(camera_x, camera_z)
    * RectangleRounded(width, height, radius)
)
part -= extrude(sketch, amount=depth)
```

Reserve `Plane(selected_face) * sketch` for centered or symmetric features where local axis direction does not affect placement.

## Required Workflow

Before writing geometry:

1. Declare orientation at the top of every script:

   ```python
   # Axis convention: +X=right, -Y=front, +Z=up (right-hand rule; +Y=back)
   ```

   If the object requires a different convention, declare and justify it. Object-specific notes such as "flat faces normal to Z" or "thickness along Z" are fine when true; do not relabel `+Z` as "front" unless the script explicitly declares a non-standard convention.

2. Reconcile reference views. When specs come from a drawing or photo:

   - Identify the drawing's viewing convention: front view, rear view, top view, exploded, etc.
   - If the view is not labeled, ask the user or assume rear view for device back-panel drawings and document the assumption.
   - A rear-view drawing is mirrored left-to-right relative to a front view. Explicitly negate the lateral axis when mapping rear-view dimensions into front-view model coordinates.
   - Write the mapping as a comment:

     ```python
     # Drawing view: rear. Drawing-left -> model +X (device right).
     ```

3. Write a datum-to-axis comment for each major feature group:

   ```python
   # Camera module: spec says 12.56 mm from left edge (rear view)
   #   -> model X = +(width / 2 - 12.56) (right side in front view)
   ```

4. After the first successful execution, verify:

   - Does each feature sit on the expected side when the model is viewed from the front (`-Y` toward the viewer)?
   - Do left/right, top/bottom, and front/back features match the physical object?
   - If any feature is mirrored, fix the sign on the offending axis and re-execute before presenting the result.
