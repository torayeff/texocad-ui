# 3D Printing DFM

Use this reference for FDM, SLA, SLS, MJF, DMLS, and other additive processes. State the assumed process if the user does not provide one.

Rules of thumb below are starting points only. Confirm supplier capability, material behavior, machine class, orientation, and post-processing before treating any value as guaranteed.

## Inputs To Capture

- Process and machine class: FDM/FFF, SLA/DLP, SLS, MJF, metal PBF/DMLS, binder jet, or unknown.
- Material: PLA, PETG, ABS/ASA, nylon, PC, TPU, resin family, PA12, glass-filled or carbon-filled, aluminum, stainless, titanium, Inconel, or other alloy.
- Function: visual prototype, ergonomic mockup, fixture, load-bearing part, fluid path, heat exposure, electrical insulation, or production end-use.
- Critical interfaces: holes, bosses, snap fits, sliding faces, sealing surfaces, threads, inserts, bearings, datum pads, and cosmetic faces.
- Build assumptions: orientation, layer height, infill, wall count, support strategy, post-cure, depowdering, heat treatment, machining, coating, and inspection.

## Process Fit

| Process | Strengths | DFM risks |
| --- | --- | --- |
| FDM/FFF | Low-cost prototypes, jigs, fixtures, large parts, tough thermoplastics | Z-axis weakness, visible layers, warping, elephant foot, support scars, rough holes |
| SLA/DLP | Fine detail, smooth surfaces, small parts, visual models, dental/jewelry-style precision | Brittle resins, support nubs, trapped resin, suction cups, UV/post-cure distortion |
| SLS | Functional nylon parts, no support structures, nested builds, complex shapes | Rough surface, trapped powder, porous surfaces, thermal warp, loose tolerances |
| MJF | Production-like nylon parts, good batch consistency, no supports, dyeable surfaces | Powder escape, gray/black finish, thermal variation, rough functional fits |
| Metal PBF/DMLS | Complex metal geometry, conformal cooling, lightweight structures | Residual stress, mandatory supports, heat distortion, support removal access, post-machining needs |

## Design Rules

- Wall thickness: use supplier tables when available. As a starting point, consider FDM walls below about `1.0-1.2 mm`, SLA unsupported walls below about `0.6-0.8 mm`, powder-bed polymer walls below about `0.8-1.0 mm`, and metal PBF walls below about `1.0-1.5 mm` as high risk.
- Pins and posts: small freestanding pins fail more often than walls. Increase diameter, shorten unsupported height, add gussets, or replace with inserted hardware.
- Engraved and embossed details: make text and logos larger than the nozzle/laser spot plus post-processing allowance. Raised details are easier to preserve than fine recessed details on rough processes.
- Holes: printed holes often come out undersized or oval. Oversize clearance holes, print pilot holes for drilling/reaming, or add machining stock for precision bores.
- Overhangs: FDM and resin processes usually need support beyond roughly `45 degrees` from vertical. Powder-bed polymer supports overhangs with powder but still needs escape paths.
- Bridges: short FDM bridges may work, but long spans sag. Add arches, chamfers, ribs, or split the part when bridge quality matters.
- Clearances: distinguish cosmetic gaps from functional fits. Start with larger clearances for FDM than SLA/SLS/MJF, and prototype fit coupons before locking a design.
- Hollow bodies: add drain, vent, or powder escape holes at low and high points. Use at least two openings for closed cavities so material can actually leave.
- Load paths: avoid relying on Z-layer adhesion for peel, bending, or threaded pullout loads. Orient layers so primary tensile/bending loads run in the stronger plane where possible.
- Transitions: use fillets and gradual wall transitions to reduce stress concentration, shrink gradients, and crack initiation.

## Process-Specific Checks

### FDM/FFF

- Align high loads in the XY plane when possible; Z-axis layer adhesion is often the weak direction.
- Add bottom chamfers to reduce elephant foot on mating edges.
- Avoid large flat plates in ABS, ASA, nylon, PC, or filled materials unless warping is controlled by enclosure, brim, ribs, or segmentation.
- Prefer heat-set inserts, captive nuts, or through-bolts for repeated assembly. Printed fine threads wear quickly; coarse printed threads need generous clearance.
- Check nozzle diameter and extrusion width before specifying thin ribs, text, gaps, or living hinges.

### SLA/DLP

- Avoid cup-shaped cavities that create suction during peeling. Add vents or reorient the part.
- Hollow thick parts to reduce resin use and cure stresses, but provide drain holes and access for cleaning.
- Keep support touchpoints off cosmetic and sealing faces.
- Account for post-cure shrink, brittleness, and creep, especially for snap fits, thin clips, and threaded features.
- For transparent or cosmetic parts, plan polishing, coating, or orientation to manage layer marks and support scars.

### SLS And MJF

- Check every hollow or internal channel for powder escape and cleaning access.
- Expect rougher surfaces and looser fits than machined or molded parts unless post-processed.
- Avoid tiny blind cavities that trap powder and change mass, balance, or cleanliness.
- Add generous radii and avoid broad uneven sections that can warp during thermal cycling.
- For print-in-place joints, provide enough clearance for powder removal and avoid inaccessible hinge gaps.

### Metal PBF/DMLS

- Assume supports are structural during the build and must be reachable for removal.
- Avoid horizontal down-facing surfaces, large overhangs, and enclosed supports.
- Add machining stock on datums, bores, threads, sealing faces, and bearing seats.
- Plan stress relief, heat treatment, support removal, blasting, and possible HIP before final inspection.
- Avoid sharp reentrant corners and abrupt section changes that amplify residual stress.

## Fit And Fastener Guidance

- Static clearance: use enough gap for printer variation, surface roughness, and coating. Do not copy machined clearances into printed prototypes without a test.
- Sliding fit: add clearance on both sides, orient sliding faces for best surface finish, and consider sanding, machining, or bushings.
- Print-in-place: use process-specific clearance and verify trapped support or powder can be removed.
- Press fit: avoid direct printed press fits in brittle or layered materials unless tested; use inserts, heat staking, or metal hardware.
- Threaded joints: use heat-set inserts for FDM, molded-style inserts or captive nuts for repeated use, and post-tapped metal AM for strength.

## Common Failure Modes

- FDM: elephant foot, curling corners, delamination, stringing, poor small holes, nozzle seams on sealing faces, and brittle layer-aligned tabs.
- SLA/DLP: support divots, uncured trapped resin, suction blowouts, overcured holes, brittle clips, and warped thin panels.
- SLS/MJF: trapped powder, gritty sliding faces, thermal warp, weak thin pins, porous fluid paths, and dye/finish variation.
- Metal AM: cracked supports, warped plates, inaccessible supports, rough internal channels, residual stress distortion, and failed post-machining due to missing stock.

## Validation Workflow

- Define print orientation and mark cosmetic, sealing, sliding, and datum faces before review.
- Print small fit coupons for inserts, sliding features, snap fits, threads, and tab/slot clearances.
- Verify slicer or supplier preview for support contact, trapped material, build volume, and part nesting.
- Confirm drain, vent, and powder escape paths for every hollow cavity or internal channel.
- Add machining stock and reachable datums for precision faces, bores, threaded holes, or seals.
- Use 3MF when material, color, multipart arrangement, or print metadata matters; use STL only for simple mesh handoff.
- Request supplier review for production quantities, metal AM, pressure/fluid parts, medical/regulated parts, or any tight functional tolerance.
