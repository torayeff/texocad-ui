# Laser And 2D Cutting DFM

Use this reference for laser, waterjet, plasma, router, and knife-cut flat profiles.

Rules of thumb below depend strongly on material, thickness, machine, nozzle, abrasive, cutter, focus, gas, and supplier compensation policy.

## Inputs To Capture

- Process: CO2 laser, fiber laser, waterjet, plasma, CNC router, knife cutter, drag knife, or unknown.
- Material: alloy or sheet good, thickness, coating, film, grain direction, flatness, flammability, reflectivity, and whether fumes are safe.
- Fit intent: loose assembly, sliding tab, press fit, weld tab, bonded joint, cosmetic panel, stencil, gasket, or disposable template.
- File assumptions: units, scale, DXF/SVG source, layers, text conversion, spline handling, closed contours, and machine kerf compensation.
- Post-processing: deburr, tumble, grain finish, bend, weld, anodize, paint, heat treat, edge seal, or adhesive bonding.

## Process Variants

| Process | Best fit | Watch for |
| --- | --- | --- |
| CO2 laser | Wood, acrylic, paper, cardboard, many plastics, thin organic sheet | Char, melted edges, unsafe plastics, flame, smoke staining, taper in thick material |
| Fiber laser | Steel, stainless, aluminum, brass/copper with suitable machine | Reflective materials, heat tint, burrs, small-web overheating, gas/edge quality |
| Waterjet | Thick plate, composites, stone, glass, heat-sensitive materials | Wider kerf, taper, abrasive grit, slower cuts, small-feature blowout |
| Plasma | Lower-cost thick steel plate and rough profiles | Large kerf, dross, heat affected zone, lower precision, edge bevel |
| Router | Plastics, wood, composites, aluminum sheet with proper tooling | Tool radius, tabs, chatter, chipout, vacuum hold-down, minimum inside radius |
| Knife cutter | Gaskets, foam, vinyl, paper, fabric, thin flexible sheet | Drag-knife corner overcut, material stretch, registration, small loose features |

## Kerf And Compensation

- Confirm whether the supplier expects nominal geometry or pre-compensated geometry. Do not compensate twice.
- Kerf removes material. For tab-slot joints, slots usually need to grow and tabs may need to shrink depending on machine compensation.
- Typical kerf order of magnitude: laser may be tenths of a millimeter, waterjet around a millimeter, and plasma several millimeters. Use supplier data for the real value.
- For fit-sensitive tab-slot designs, create a kerf comb or test coupon in the same material and thickness.
- Account for coatings, paint, powder coat, anodize, and char when defining final fit.

## Feature Rules

- Minimum web: avoid narrow strips between cuts. Thin webs overheat, warp, vibrate, break during handling, or fall into the bed.
- Hole size: holes smaller than material thickness are often poor quality or need drilling. Waterjet and plasma need more generous holes than fine laser work.
- Hole-to-edge and hole-to-hole distance: keep enough material between features to prevent heat distortion, blowout, or broken tabs. Increase spacing with thickness.
- Slots and tabs: avoid designing slots exactly equal to material thickness. Add clearance for kerf, material thickness tolerance, edge taper, finish, and assembly angle.
- Internal corners: lasers and waterjets can make sharp-ish corners, but router-cut parts need tool-radius relief; tabbed assemblies often still need dogbones or lollipop reliefs.
- Pierces and lead-ins: place pierce marks away from cosmetic surfaces, sealing edges, and tight-fit areas when possible.
- Small loose cutouts: add tabs, bridges, or delete nonfunctional islands that may tip, fall, weld back, or be lost.
- Text and stencils: convert text to outlines and bridge islands in letters such as `A`, `B`, `D`, `O`, `P`, `Q`, and `R`.
- Stress risers: add small radii to sharp internal corners where the part carries load.

## Material Guidance

- Acrylic: cast acrylic generally cuts and engraves cleaner than extruded acrylic; avoid tight press fits that crack brittle corners.
- Wood, plywood, and MDF: account for char, glue variation, grain, humidity, and thickness variation. Use tabs or slots with adjustable clearance.
- Metals: stainless and aluminum edge quality depends on gas, thickness, and machine. Burrs and heat tint may need finishing.
- Composites: waterjet or router may be safer than laser depending on fibers and resin; confirm dust/fume controls.
- Rubber, foam, gasket, and fabric: knife or waterjet may preserve edges better than heat cutting.
- Unsafe materials: do not laser unknown plastics, PVC, vinyl, PTFE, or materials that release corrosive or toxic fumes without explicit shop approval.
- Coated material: confirm whether protective film stays on, burns, contaminates edges, or affects engraving.

## DXF/SVG File Validation

- Use 1:1 scale and explicit units. State whether the file is mm or inch.
- Use closed, non-self-intersecting contours for cuts.
- Remove duplicate lines, overlapping vectors, stray points, hidden construction geometry, and tiny segments.
- Convert text, strokes, and fonts to outlines/paths when the cutting workflow requires it.
- Separate cut, score, engrave, etch, construction, bend, and no-cut geometry onto clearly named layers.
- Avoid shared edges unless the supplier supports common-line cutting and the nesting plan is intentional.
- Check spline and arc compatibility; simplify only enough to avoid faceted edges.
- Review in outline or wireframe mode before export to catch open vectors and doubled geometry.

## Common Failure Modes

- Undersized slots or oversized tabs from incorrect kerf assumptions.
- Loose assemblies from material thickness variation or overcompensation.
- Burned, melted, or heat-tinted cosmetic edges.
- Warped thin panels, curled webs, dross, burrs, or hardened heat-affected edges.
- Lost islands in text, tipped small cutouts, or parts welded back to the sheet.
- Scale mistakes from inch/mm confusion or SVG import behavior.
- Router parts with impossible sharp inside corners.

## Common Actions

- Add dogbones, lollipop reliefs, or slot clearance for tabbed assemblies.
- Add small radii to reduce stress risers and cutting artifacts.
- Add labels, etched orientation marks, or assembly numbering when orientation matters.
- Add temporary tabs for small loose cutouts or delete nonfunctional islands.
- Move tight fits away from pierce points, lead-ins, heat-affected zones, and cosmetic faces.
- Prototype a kerf comb and tab-slot coupon before committing to a production batch.

## Supplier Handoff And Validation

- Provide DXF for manufacturing profiles; SVG is acceptable only when the supplier or toolchain supports it reliably.
- Include material, thickness, finish side, grain direction if relevant, quantity, units, and whether kerf compensation is applied.
- Mark critical dimensions, fit-critical slots, cosmetic faces, bend lines, score lines, and engraving layers.
- Confirm minimum web, minimum hole, edge quality, tolerance class, tab retention, and nesting spacing.
- Inspect first articles for kerf, edge taper, burr, char, heat tint, and fit before cutting a full batch.
