# API Objects

Compact coverage for build123d object constructors. For exact signatures bundled with this skill, consult [api-symbol-index.md](api-symbol-index.md).

Entry format: `Name` - where used; purpose; key parameters/gotchas.

## Shared Object Parameters

- `mode`: builder combination behavior. Use `Mode.ADD`, `SUBTRACT`, `INTERSECT`, `REPLACE`, or `PRIVATE`. Algebra mode ignores `mode`; use operators instead.
- `align`: 2D uses X/Y `Align`; 3D uses X/Y/Z. A single `Align` can apply to all axes.
- `rotation`: 2D angle in degrees or 3D rotation tuple/`Rotation`.
- Builder placement is done with `Locations`; algebra placement is done with `Plane * Pos/Rot/Location * object`.

## 1D Curve Objects

Use in `BuildLine` or algebra `Curve` construction. 1D objects are not affected by `Locations` in builder mode.

- `BaseLineObject` - base wrapper for a `Wire`; use for custom 1D objects.
- `Airfoil` - NACA 4-digit airfoil curve; key params `airfoil_code`, `n_points`, `finite_te`; exposes parsed camber/thickness data.
- `Bezier` - Bezier curve from control points; optional `weights`.
- `BlendCurve` - smooth transition between two curves; use `ContinuityLevel.C0/C1/C2`, optional endpoint and tangent scales.
- `CenterArc` - circular arc from center, radius, start angle, and arc size.
- `ConstrainedArcs` - local solver for tangent/contact arcs; use `Tangency`, `Sagitta`, `center`, `center_on`, `radius`, and deterministic `selector`.
- `ConstrainedLines` - local solver for tangent/contact/angle lines; use references, optional `angle` or `direction`, and `selector`.
- `DoubleTangentArc` - arc through point/tangent and tangent to another curve; use `keep` to choose branch.
- `EllipticalCenterArc` - elliptical arc from center, radii, start/end or arc size; supports rotation and angular direction.
- `EllipticalStartArc` - elliptical arc from start point, tangent, radii, and arc size.
- `ParabolicCenterArc` - parabolic arc from vertex, focal length, angles, and rotation.
- `HyperbolicCenterArc` - hyperbolic arc from center, radii, angles, and rotation.
- `FilletPolyline` - polyline with rounded corners; accepts one radius or iterable; use for bend profiles.
- `Helix` - helix from pitch, height, radius, direction, cone angle, and handedness; avoid self-contacting thread sections.
- `IntersectingLine` - line from start/direction constrained to intersect another line-like object.
- `JernArc` - arc from start point, tangent, radius, and arc size.
- `Line` - line segment(s) from points.
- `PolarLine` - line from start, length, and angle or direction; `LengthMode` controls length interpretation.
- `Polyline` - multiple connected line segments; optional `close`.
- `RadiusArc` - arc from start, end, and radius; `short_sagitta` chooses branch.
- `SagittaArc` - arc from start, end, and sagitta.
- `Spline` - spline through points; optional tangents, tangent scales, and periodic closure.
- `TangentArc` - arc from two points and a tangent; `tangent_from_first` controls endpoint.
- `ThreePointArc` - circular arc through three points.
- `ArcArcTangentLine` - straight line tangent to two circular arcs; use `side` and `keep`.
- `ArcArcTangentArc` - arc tangent to two arcs with radius; use `(placement, type)` `Keep` pair for branch control.
- `PointArcTangentLine` - tangent line from a point to a circular arc.
- `PointArcTangentArc` - tangent arc from point/direction to another circular arc; can fail when no branch exists.

## 2D Sketch And Drawing Objects

Use in `BuildSketch` or algebra `Sketch`.

- `BaseSketchObject` - base wrapper for a `Face`/`Compound`; use for custom 2D objects.
- `Arrow` - arrow with a shaft path; key params `arrow_size`, `shaft_path`, `shaft_width`, `head_at_start`, `HeadType`.
- `ArrowHead` - standalone arrow head; key params `size`, `HeadType`, `rotation`.
- `Circle` - circle or sector; key params `radius`, `arc_size`, `align`.
- `DimensionLine` - internal/along-path dimension annotation; key params `path`, `Draft`, `label`, `arrows`, `tolerance`, `label_angle`.
- `Ellipse` - ellipse from x/y radii; supports rotation and align.
- `ExtensionLine` - outside dimension line from a border/path; key params `offset`, `Draft`, `measurement_direction`.
- `Polygon` - face from point sequence; point order controls face normal in algebra mode.
- `Rectangle` - width/height rectangle; supports rotation and align.
- `RectangleRounded` - rectangle with filleted corners; key param `radius`.
- `RegularPolygon` - regular polygon; key params `radius`, `side_count`, `major_radius`; exposes `apothem`.
- `SlotArc` - slot following an `Edge`/`Wire`; key params `arc`, `height`.
- `SlotCenterPoint` - slot from center and one endpoint center.
- `SlotCenterToCenter` - slot from center separation and height.
- `SlotOverall` - slot from total width and height.
- `TechnicalDrawing` - drawing border/title block; key params page size, title/subtitle, drawing number, scale, text size.
- `Text` - text face/path; key params `txt`, `font_size`, `font`, `font_path`, `FontStyle`, `TextAlign`, `path`, `position_on_path`, `single_line_width`.
- `Trapezoid` - trapezoid from width, height, and side angles.
- `Triangle` - solved triangle from any valid combination of one side and two other sides/angles; exposes sides, angles, vertices, and edges.

## 3D Part Objects And Hole Features

Use in `BuildPart` or algebra `Part`.

- `BasePartObject` - base wrapper for a `Solid`/`Part`; use for custom 3D objects.
- `Box` - rectangular prism; key params `length`, `width`, `height`, `rotation`, 3-axis `align`.
- `Cone` - cone/frustum; key params bottom/top radius, height, `arc_size`.
- `ConvexPolyhedron` - convex hull solid from points.
- `CounterBoreHole` - subtractive counterbored hole; key params `radius`, `counter_bore_radius`, `counter_bore_depth`, optional depth; defaults to `Mode.SUBTRACT`.
- `CounterSinkHole` - subtractive countersunk hole; key params `radius`, `counter_sink_radius`, depth, angle; defaults to `Mode.SUBTRACT`.
- `Cylinder` - cylinder/sector; key params radius, height, `arc_size`.
- `Hole` - subtractive cylindrical hole; depth `None` means through.
- `Sphere` - sphere/partial sphere; key params radius and arc sizes.
- `Torus` - torus/partial torus; key params major/minor radii and angular spans.
- `Wedge` - wedge from near/far face dimensions.

## Text And Fonts

- `available_fonts()` - inspect installed fonts and styles.
- `FontManager().register_font(path)` - register a font file or variable font faces for reuse.
- `Text(..., font_path=...)` - use a specific font file. Relative paths are relative to current working directory.
- `Text(..., "singleline")` - outlined single-line CAD font; can be slow for many glyphs.
- `Compound.make_text(text, size, "singleline")` - unoutlined single-line text, useful for engraving/routing paths.

Font gotchas:

- Not every font supports every `FontStyle`.
- Some modern variable fonts create overlapping glyph outlines and invalid faces.
- `text_align` aligns glyphs inside the text box; `align` aligns the resulting bounding box.

## Custom Objects

To create reusable domain primitives:

- Subclass or wrap `BaseLineObject` for curve objects.
- Subclass or wrap `BaseSketchObject` for sketch objects.
- Subclass or wrap `BasePartObject` for part objects.

Keep custom objects parameterized, avoid hidden global state, and expose construction datums if downstream features need stable selectors.
