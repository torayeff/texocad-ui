# Process Selection

Use this reference when the manufacturing process is unspecified or when comparing process fit.

## Inputs To Capture

- Quantity and phase: one-off prototype, functional prototype, pilot batch, low-volume production, production, or mass production.
- Material requirements: strength, stiffness, impact, fatigue, temperature, chemical exposure, flame rating, biocompatibility, conductivity, compliance, surface finish, color, and transparency.
- Geometry: envelope, wall thickness, undercuts, internal channels, sharp corners, deep pockets, flat profiles, bends, molded draft, assembly count, and inspectability.
- Tolerances: cosmetic only, loose assembly, functional fit, sliding fit, bearing/alignment, sealing, optical, or inspected drawing tolerances.
- Business constraints: lead time, tooling budget, expected redesigns, supplier access, certification, part criticality, and acceptable scrap or rework.
- Post-processing: support removal, depowdering, curing, machining, heat treat, welding, plating, painting, polishing, marking, and inspection.

## Quantity And Cost Framing

- One-off prototypes: prefer low tooling cost, fast iteration, and easy geometry changes. 3D printing, laser cutting, and simple CNC are usually better than hard tooling.
- Functional prototypes: choose a process that approximates production material, stiffness, tolerance, and assembly behavior. Printed prototypes may be misleading for molded snap fits, sealing faces, or metal fatigue.
- Pilot builds: prioritize repeatability, supplier feedback, inspection strategy, and design freeze risks. Soft tooling, production-intent machining, and short-run sheet metal are common.
- Low-volume production: setup time, fixturing, inspection, and material waste often dominate cost. CNC, sheet metal, casting, or additive plus secondary machining may beat molded tooling.
- Mass production: tooling/NRE can be justified when unit cost, cycle time, repeatability, and quality control matter more than iteration speed.

## Process Fit Guide

| Process | Best fit | Watch for |
| --- | --- | --- |
| 3D printing | Complex internal geometry, rapid iteration, lightweight structures, low quantities, conformal channels, custom parts | Anisotropy, supports, trapped resin or powder, surface finish, dimensional variability, slow production scaling |
| CNC machining | Engineering materials, flat datums, tight functional features, strong isotropic parts, low to medium quantity | Deep pockets, small internal radii, many setups, thin walls, tool access, expensive global tolerances |
| Laser/2D cutting | Flat profiles, panels, brackets, tabs, slots, fast sheet-stock parts | Kerf, heat effects, loose cutouts, thin webs, file cleanup, flatness, edge quality |
| Sheet metal | Enclosures, chassis, brackets, spring clips, constant-thickness parts, production sheet goods | Bend sequence, bend radius, hole distortion, tolerance stack across bends, tooling access, hardware placement |
| Injection molding | High-volume plastic parts, repeatable cosmetics, integrated clips/bosses/ribs, low unit cost after tooling | Draft, uniform walls, shrink, gates, ejection, undercuts, tooling cost, long design freeze |

## Cross-Process Checks

- If a design has constant thickness and bends, evaluate sheet metal before machining it from billet.
- If a design is mostly a 2D profile, evaluate laser cutting before CNC milling.
- If a design needs tight bearing bores or flat sealing surfaces, additive alone may need secondary machining.
- If a design needs thousands of identical plastic parts, evaluate molding even if 3D printing works for prototypes.
- If internal cavities cannot be cleaned, supported, or inspected, avoid processes that trap material or support residue.
- If cosmetic surfaces are critical, choose a process and orientation that keep gates, ejector marks, supports, tabs, pierce marks, and tool marks off visible faces.
- If a dimension crosses multiple bends, setups, bonded joints, or molded shrink zones, treat it as a tolerance stack rather than a single process tolerance.
- If the design needs both organic geometry and precision datums, plan additive or casting plus secondary machining instead of forcing one process to do everything.
- If production tooling is likely, review prototype features for production feasibility before the prototype geometry becomes locked into assemblies.

## Multi-Process Routes

- Print plus machine: use additive for complex bodies, then machine datums, bores, threads, sealing surfaces, or mounting faces. Add stock allowance and reachable datum pads.
- Laser plus bend: cut a flat pattern, then brake-form the part. Keep holes away from bend zones and define whether dimensions are pre-bend or post-bend.
- CNC prototype to molded production: use CNC or printed prototypes for fit checks, but redesign walls, bosses, ribs, draft, and snap fits before tooling.
- Mold plus secondary operation: use molding for net-shape plastic, then drill, tap, machine seals, heat stake, insert, paint, or laser mark as needed.
- Sheet metal plus weld or hardware: form the main structure, then add PEM hardware, rivets, weld nuts, tabs, or spot welds where geometry allows access.

## Red Flags Requiring Supplier Confirmation

- Tolerances tighter than the normal process capability, especially across setups, bends, shrink zones, or assemblies.
- Sealing, bearing, optical, or safety-critical interfaces without a datum scheme and inspection plan.
- Hidden cavities that may trap support, resin, powder, chips, abrasive, plating solution, or cleaning fluid.
- Undercuts, side pulls, tool-reach constraints, trapped bend geometry, or inaccessible support removal.
- High cosmetic requirements on surfaces likely to receive gates, ejector marks, support scars, pierce marks, clamps, tabs, or tool marks.
- Materials with difficult behavior: high-shrink plastics, glass-filled resin, flexible resin, hard stainless, copper alloys, brittle acrylic, fiber-filled filament, or heat-treated aluminum.
- Production quantities without a plan for repeatability, qualification samples, incoming inspection, and supplier process control.
