# Injection Molding DFM

Use this reference for molded plastic, elastomer, or cast-like tooling decisions.

Rules of thumb below are starting points. Resin grade, filler, shrink rate, tooling approach, surface texture, part size, gate strategy, and molder capability override generic values.

## Inputs To Capture

- Resin and grade: amorphous, semi-crystalline, glass-filled, flame-retardant, elastomer, LSR, color, UV stability, food/medical/compliance, and shrink data.
- Production intent: prototype tool, bridge tool, production tool, annual volume, tooling life, cavitation, family mold, and expected design freeze.
- Geometry: pull direction, parting line, cosmetic faces, functional datums, wall thickness, ribs, bosses, snaps, hinges, seals, undercuts, and inserts.
- Tooling constraints: gate restrictions, ejector mark restrictions, side actions, lifters, slides, collapsible cores, texture, venting, cooling, and mold steel.
- Quality plan: dimensional tolerance class, first article, capability targets, cosmetic standards, warpage limits, and inspection datums.

## Core Checks

- Wall thickness: prefer uniform nominal walls and gradual transitions to reduce sink, voids, differential shrink, and warpage.
- Draft: add draft on faces parallel to pull direction. Smooth faces often start around `0.5-2 degrees`; texture, deep ribs, and tall walls usually need more.
- Parting line: identify a plausible pull direction, parting line, shutoffs, core side, cavity side, and visible witness lines.
- Undercuts: flag side actions, lifters, hand loads, collapsible cores, unscrewing cores, or redesign opportunities.
- Ribs and bosses: size ribs and bosses to avoid sink while preserving stiffness and fastening function.
- Gates and flow: consider gate location, weld lines, air traps, knit lines, pressure drop, fiber orientation, and cosmetic surfaces.
- Ejection: ensure ejector access on rigid areas and avoid fragile features that stick in the mold.
- Corners: use radii to reduce stress concentration, improve flow, and reduce tooling stress.

## Wall And Transition Guidance

- Keep nominal walls as uniform as practical. Typical plastic walls often live around `1.2-3.0 mm`, but resin, part size, and flow length matter.
- Avoid thick solid blocks. Core them out, shell them, or replace mass with ribs.
- Use gradual transitions when wall thickness changes; avoid abrupt thick-to-thin steps that cause sink and voids.
- Internal corner radius around `0.5T` is a common starting point. External radius should usually equal internal radius plus wall thickness to preserve uniform sections.
- Large flat panels need ribs, crown, texture, or geometry to hide sink and warpage.

## Ribs, Bosses, And Structural Features

- Rib thickness: start around `0.5T-0.6T` of nominal wall to reduce sink on the opposite face.
- Rib height: start below about `2.5T-3T` unless the molder confirms taller ribs can fill and eject cleanly.
- Rib base radius: start around `0.25T-0.5T`; too small concentrates stress, too large can create sink.
- Rib draft: add draft per side so ribs release; deep ribs need more draft and good venting.
- Boss wall: keep boss wall near or below about `0.6T`, core deep bosses, and avoid solid cylinders on cosmetic faces.
- Boss support: connect bosses to walls with ribs or gussets rather than thick pads. Leave room for ejector pins and screw heads.
- Screw joints: check thread-forming screw engagement, pullout, hoop stress, and repeated service. Consider brass inserts for high service cycles.
- Snap fits: design for resin strain limits, draft, lead-ins, assembly access, and creep. Prototype material must match production behavior.

## Tooling Features

- Gates: place gates to fill from thick to thin where possible and away from high-cosmetic or high-stress areas unless unavoidable.
- Gate types: edge, tab, fan, tunnel/submarine, pin, hot-tip, and valve gates have different vestige, flow, cost, and automation tradeoffs.
- Runners: cold runners waste material but are simpler; hot runners reduce waste and cycle time but increase tooling cost and maintenance.
- Vents: add venting at flow ends, ribs, bosses, thin sections, and air traps to reduce burns and short shots.
- Ejectors: place ejector pins, sleeves, or stripper plates on strong, non-cosmetic surfaces. Bosses may need sleeve ejection.
- Shutoffs: add draft and sufficient shutoff angle to prevent flash and wear.
- Slides and lifters: use only when undercuts justify cost and maintenance; redesign undercuts into snap windows, through-holes, or assembly splits where possible.
- Cooling: thick sections, isolated bosses, and uneven walls cool unevenly and drive cycle time and warpage.

## Material And Process Variants

- Amorphous resins: often lower shrink and better dimensional stability; watch stress cracking and chemical compatibility.
- Semi-crystalline resins: often higher shrink and warp risk; check cooling, crystallinity, and wall uniformity.
- Glass-filled resins: lower shrink along flow but anisotropic behavior, abrasive tooling wear, visible fibers, and weld-line strength risk.
- Elastomers and TPE: need generous radii, draft, venting, and ejection strategy; thin floppy parts can be hard to demold.
- Living hinges: usually require suitable resin such as polypropylene, correct flow orientation, thin hinge geometry, and fatigue testing.
- Insert molding: check insert retention, heat exposure, shutoff, flash, preheat, and automation loading.
- Overmolding: verify chemical/mechanical bond, substrate support, shutoff lines, flash control, and second-shot shrink.
- LSR: plan cold-deck/hot-mold behavior, flash sensitivity, venting, and compression of soft features.

## Defects To Watch

- Sink: thick walls, ribs/bosses too thick, poor cooling, or gate freeze-off before packing.
- Voids: thick sections and poor packing.
- Warp: uneven walls, asymmetric ribs, long flat panels, fiber orientation, differential shrink, or uneven cooling.
- Short shots: thin walls, long flow length, poor venting, undersized gates, or low pressure.
- Flash: poor shutoff, insufficient clamp, worn tooling, low shutoff angle, or excessive pressure.
- Weld/knit lines: flow fronts meet around holes, bosses, ribs, or multiple gates; can be cosmetic and structural risks.
- Burn marks and dieseling: trapped air without venting.
- Stress cracking: sharp corners, molded-in stress, chemical exposure, press inserts, or over-tightened screws.
- Ejection scuffing: insufficient draft, sticky texture, fragile ribs, or poor ejector placement.
- Gate blush and read-through: visible gate, thick ribs, bosses, or flow hesitation on cosmetic surfaces.

## Assembly And Cosmetic Guidance

- Mark A/B/C surfaces so gates, ejectors, parting lines, slides, and texture breaks are placed intentionally.
- Provide lead-ins and generous assembly chamfers for snaps, clips, screws, and inserts.
- Avoid snap fits that require impossible mold actions or overstrain the resin during assembly.
- Add poka-yoke features for orientation-critical parts.
- Keep screw bosses away from outer cosmetic walls or isolate them with ribs to avoid sink.
- Plan ultrasonic welds, heat stakes, adhesives, or clips with energy directors, access, and inspection.

## Tolerances And Qualification

- Do not apply tight tolerances to every molded dimension. Shrink, tool steel, process control, and measurement method all matter.
- Tie tight tolerances to datums and functional interfaces, not flexible walls or freeform cosmetic surfaces.
- Expect first shots to drive tool tuning for shrink, warp, gate vestige, ejector marks, and flash.
- Use first article inspection, capability studies, and boundary samples for production parts.
- Confirm measurement conditions for hygroscopic materials, flexible parts, and parts measured after post-processing.

## Common Actions

- Hollow thick blocks into uniform walls with ribs.
- Add draft and radii to all molded faces and transitions.
- Split complex parts or revise undercuts to avoid side actions.
- Replace deep solid bosses with cored bosses and ribs.
- Move gates, ejectors, and parting lines away from cosmetic or sealing surfaces where possible.
- Add venting paths, flow leaders, rib breaks, or gate changes to address short shots and burns.
- Mark cosmetic surfaces and functional datums so tooling tradeoffs are explicit.

## Supplier Handoff

- Provide STEP plus drawings for toleranced features, datum scheme, cosmetic zones, and inspection requirements.
- Specify resin grade, color, additive package, texture/SPI/VDI finish, annual volume, tooling life, and regulatory requirements.
- Mark gate restrictions, ejector restrictions, parting line preferences, shutoff areas, and acceptable witness marks.
- Include assembly loads, screw type, insert type, snap-fit cycles, chemical exposure, temperature range, and UV exposure.
- Request DFM review before tool release and define expectations for first shots, tool corrections, FAI, and production approval.
