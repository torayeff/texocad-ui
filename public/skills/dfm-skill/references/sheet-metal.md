# Sheet Metal DFM

Use this reference for bent, punched, laser-cut, or stamped sheet parts.

Rules of thumb below assume press-brake or common sheet fabrication. Supplier tooling, material temper, thickness, grain direction, bend method, and finish stackup override generic values.

## Inputs To Capture

- Process: laser-cut and brake-formed, punched, stamped, roll-formed, welded sheet assembly, panel work, or unknown.
- Material: alloy, thickness, temper, grain direction, coating, springback behavior, and corrosion requirements.
- Function: enclosure, bracket, chassis, spring clip, cosmetic panel, shield, heat sink, structural frame, or production stamping.
- Forming assumptions: bend radius, K-factor, bend allowance, bend deduction, tooling, bend sequence, hemming, offsets, and bend angle tolerance.
- Hardware and joining: PEM nuts/studs, rivets, weld nuts, spot welds, tabs/slots, clinch hardware, adhesive, or fasteners.

## Core Checks

- Constant thickness: sheet metal parts should normally derive from one sheet thickness. Avoid machined-block assumptions unless secondary machining is planned.
- Bend radius: use a realistic inside bend radius for material, thickness, and tooling. A starting point for ductile materials is about `1T`; harder materials may need several times thickness.
- Bend relief: add reliefs where flanges would tear, wrinkle, or collide during bending.
- K-factor and flat pattern: identify bend allowance assumptions before relying on flat dimensions.
- Hole-to-bend distance: keep holes, slots, countersinks, louvers, and cutouts away from bend lines unless distortion is acceptable.
- Flange length: verify the flange can reach the tooling. A starting point is about `4T`, but tooling and bend angle can require more.
- Bend order: verify the part can be bent without tool collision, trapped flanges, or impossible back-gauge access.
- Hardware: plan PEM nuts, studs, rivets, tabs, or welds with edge distance, bend clearance, installation access, and tool clearance.

## Practical Rules

- Inside bend radius: start near `1T` for mild steel and many ductile materials; increase for aluminum 6061-T6, hardened stainless, thick stock, or cracking risk.
- Hole-to-bend: start around `2.5T + R` from bend line for holes; slots, countersinks, and formed features often need more.
- Bend relief: relief width around `T` and depth at least `R + T` is a common starting point. Round relief ends to reduce cracking.
- Slots and tabs: keep tab width and slot width at least about `T`; avoid long skinny tabs unless they are intentionally flexible.
- Edge distance: keep holes, notches, and hardware far enough from edges to avoid breakout, distortion, or fastener pullout.
- Countersinks: avoid countersinks too close to bends or edges, and avoid countersink depth that consumes most of the sheet thickness.
- Multiple bends: tolerances degrade across each bend. Dimension from datums and avoid chained dimensions across many flanges.
- Springback: expect higher springback in high-strength materials, stainless, and aluminum. Specify functional angles and datums instead of assuming nominal CAD angles are exact.

## Feature Guidance

- Hems: use open, closed, or teardrop hems for stiffness, safe edges, and cosmetics. Avoid closed hems in brittle, thick, painted, or coated material unless supplier confirms.
- Joggles and offsets: check minimum offset height, tool access, and whether the feature can be made before or after adjacent bends.
- Louvers, beads, dimples, and embosses: require forming tools and minimum distance from bends, edges, and other formed features.
- Tabs and slots: useful for self-location before welding or fastening; add clearance for coating, bend variation, and assembly sequence.
- Weld tabs: allow torch/electrode access, heat distortion, and post-weld cleanup.
- PEM hardware: follow hardware catalog edge distances and minimum sheet thickness; keep holes far enough from bends that installation remains round and flat.
- Rivets and screws: provide tool access, backside access when needed, and clearance for washers, heads, and drivers.
- Formed threads or extruded holes: check material thickness, thread engagement, and distance from bends.

## Tolerances And Datums

- Same-face cut features can be more accurate than dimensions across bends.
- Bend-to-hole and bend-to-bend tolerances are driven by bend angle, material variation, tooling, and setup.
- Use functional datums on stable faces; avoid using flexible flange tips as primary datums.
- Use GD&T or datum-based dimensions for multi-bend assemblies instead of long chains of linear dimensions.
- Specify which dimensions are critical after forming and which are flat-pattern reference only.
- Account for coating, powder coat, plating, anodize, paint, and masking when fits or grounding points matter.

## Bend Sequence And Tooling Risks

- Tall return flanges can collide with punches, dies, or the press brake frame.
- Narrow channels may require gooseneck tooling or staged forming.
- Closed boxes, U-channels, and opposing flanges can trap the part before the last bend.
- Very short flanges may not contact tooling repeatably.
- Large panels can oil-can, warp, or become hard to hold during bending.
- Grain direction matters for cracking and cosmetic brush direction; specify it when functional.

## Cost Drivers

- Many bends, nonstandard radii, special tooling, hard materials, tight angles, cosmetic grain, hardware installation, welding, masking, and inspection.
- Tight tolerances across multiple bends or welded joints.
- Hardware near bends that needs post-bend installation or special reliefs.
- Features that require punching, forming, machining, welding, and finishing in separate suppliers or setups.

## Common Actions

- Convert machined blocks or printed boxes into folded sheet plus fasteners when constant wall thickness is acceptable.
- Add bend reliefs, corner reliefs, and fillets at flange intersections.
- Move holes away from bend zones or mark them as post-bend operations.
- Add tabs, slots, hemmed edges, beads, joggles, or formed ribs for alignment and stiffness.
- Split trapped box geometry into two formed parts joined by rivets, welds, or screws.
- Replace welded features with PEM hardware or formed tabs when strength and cost allow.

## Supplier Handoff

- Provide formed STEP for review and DXF for flat profiles only when the flat pattern is controlled.
- Include material, thickness, bend radius, K-factor or bend allowance if known, grain direction, finish, coating, and quantity.
- Provide a bend table with angle, radius, direction, and critical dimensions.
- Call out hardware part numbers or required performance, installation side, and keep-out zones.
- Mark cosmetic faces, grain direction, weld zones, mask areas, grounding points, and inspection datums.
- Clarify whether burr direction, tool marks, bend witness marks, hardware marks, and spot-weld marks are acceptable.
