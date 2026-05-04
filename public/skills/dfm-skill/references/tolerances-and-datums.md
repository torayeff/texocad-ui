# Tolerances And Datums

Use this reference when a DFM review involves fits, inspection, datum schemes, tolerance stackups, or unclear dimensional requirements.

## Separate The Concepts

- Modeling tolerance: geometric precision in CAD or mesh export. This is not the same as manufactured tolerance.
- Manufacturing tolerance: expected process variation from machines, tooling, material, operators, fixtures, and environment.
- Fit clearance: intentional gap or interference between mating parts after manufacturing and finishing.
- Inspection tolerance: what is actually measured, how it is measured, and what acceptance criteria apply.
- Mesh tolerance: STL/3MF tessellation quality. Fine mesh triangles do not guarantee a precise manufactured part.

## Inputs To Capture

- Unit system and source of truth: CAD model, drawing, STEP, mesh, DXF, or supplier print.
- Fit type: clearance, sliding, press, snap, threaded, pinned, bonded, sealed, bearing, optical, or cosmetic.
- Critical-to-quality features: holes, bores, slots, faces, pins, seal grooves, bearing seats, snap features, and assembly datums.
- Datum scheme: primary, secondary, and tertiary datums, plus whether they are stable, accessible, and measurable.
- Inspection method: calipers, micrometer, height gauge, pins, go/no-go gauge, CMM, optical scan, fixture, pressure test, or functional test.
- Finish state: before or after coating, heat treat, tumbling, polishing, plating, paint, or assembly.

## Datum Guidance

- Choose datums from stable functional surfaces, not decorative surfaces, flexible flanges, support-scarred faces, or molded freeform skins.
- Keep critical features in the same manufacturing setup when possible.
- Avoid tight relationships across multiple flips, bends, welds, molded shrink zones, or printed assemblies unless the process and inspection plan support them.
- Add datum pads to printed, cast, forged, or molded parts that need secondary machining.
- Make datums accessible to fixtures and inspection tools.
- For assemblies, define whether the part datum or assembly datum controls the final function.

## Tolerance Stackups

- Identify the closed loop: which dimensions add or subtract to determine final clearance or interference.
- Include manufacturing tolerances, coating buildup, material thickness variation, fastener clearance, thermal expansion, and assembly sequence.
- Do worst-case stackup for safety-critical or non-adjustable fits. Use statistical stackup only when production data and process controls justify it.
- Avoid chained dimensions across many features; dimension from datums where function depends on position.
- For flexible parts, define measurement fixture or loaded condition.

## Fit Guidance

- Clearance fits need both minimum and maximum gap. State whether rattle, binding, alignment, or sealing is the limiting condition.
- Sliding fits need allowance for surface finish, debris, coating, thermal expansion, and lubrication.
- Press fits need material strength, hoop stress, insertion force, edge lead-ins, and service temperature checks.
- Snap fits need strain, creep, fatigue cycles, assembly access, lead-ins, and material data.
- Threaded fits need thread class, engagement length, torque, insert type, locking method, and service cycles.
- Bonded fits need bondline thickness, squeeze-out path, surface prep, cure access, and fixture method.

## Drawing And Inspection Triggers

Require a drawing or explicit inspection notes when:

- A feature has a tolerance tighter than general process capability.
- A dimension controls sealing, bearing alignment, optical alignment, safety, compliance, or interchangeability.
- GD&T is needed for position, flatness, perpendicularity, runout, profile, or true position.
- The supplier must inspect and report results, not just make to model.
- The acceptance condition depends on post-processing or assembly.

## Common Review Findings

- Missing datum scheme for tight position or alignment requirements.
- Global tight tolerance applied to every feature without function.
- Fit clearance copied from nominal CAD with no allowance for finish or process variation.
- Critical dimension crosses multiple bends, setups, molded shrink zones, or assembled parts.
- Mesh file supplied for a precision feature that needs STEP and drawing control.
- Inspection access is blocked after assembly or by part geometry.

## Recommended Actions

- Name functional interfaces and assign tolerance only where needed.
- Add local datums, datum pads, inspection bosses, or gauge features.
- Change tight nonfunctional dimensions to reference dimensions.
- Add chamfers, lead-ins, compliance features, slots, or adjustment to absorb stackup.
- Move critical features into one setup, one mold half, one bend datum, or one assembly operation.
- Define whether dimensions apply before or after finishing.
