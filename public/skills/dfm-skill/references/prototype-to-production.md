# Prototype To Production

Use this reference when a design is moving from proof of concept to pilot build, production tooling, or repeatable manufacturing.

## Phase Differences

| Phase | Priority | DFM risk |
| --- | --- | --- |
| Concept prototype | Speed, learning, rough fit, ergonomics | Prototype process hides production constraints |
| Functional prototype | Material behavior, load path, interfaces | Printed or machined substitutes misrepresent molded/sheet behavior |
| Engineering validation | Repeatable geometry, test fixtures, failure modes | Critical tolerances and inspection plan still undefined |
| Pilot build | Supplier process, assembly sequence, quality plan | Late changes become expensive |
| Production | Repeatability, yield, unit cost, service, compliance | Tooling, fixtures, inspection, and change control dominate |

## Questions To Ask

- What part of the prototype is being validated: shape, ergonomics, strength, thermal behavior, sealing, assembly, or production process?
- Which prototype features are not production-intent?
- What quantity and lifetime volume justify tooling, fixtures, gauges, or automation?
- Which dimensions must be interchangeable across batches?
- Which failures are unacceptable in production: cosmetic scrap, assembly rework, field failure, regulatory failure, or safety risk?
- What supplier feedback is required before design freeze?

## Common Prototype Traps

- 3D printed snap fits pass because the prototype material is more compliant or weaker than production resin.
- Machined plastic prototypes ignore molded draft, gates, ejectors, sink, ribs, and shrink.
- Printed enclosures pass fit checks because holes are hand-drilled, sanded, or adjusted.
- CNC billet prototypes become too expensive when scaled because they remove too much material or need many setups.
- Laser-cut prototypes use nominal slots that fail when coating, kerf, and material thickness variation are included.
- Sheet metal prototypes work by manual forming but production tooling changes bend radius, K-factor, or bend sequence.
- Hand assembly hides driver access, cable routing, fixture, torque, and inspection problems.

## Production Readiness Checks

- Process intent: target manufacturing route, material grade, supplier capability, and backup process are known.
- Design freeze: critical interfaces, cosmetic requirements, and assembly sequence are stable enough for tooling or fixtures.
- Tolerance plan: datum scheme, critical dimensions, and inspection method are documented.
- Quality plan: first article, sample size, acceptance criteria, boundary samples, and traceability are defined where needed.
- Tooling plan: molds, fixtures, soft jaws, gauges, forming tools, welding fixtures, and trim tools have owners.
- Finish plan: coatings, masking, cosmetic surfaces, and post-processing are production-intent.
- Assembly plan: fasteners, torque, adhesives, welds, inserts, service access, and test steps are defined.
- Change plan: revision control and supplier communication are ready before ordering production parts.

## Process-Specific Transition Notes

- Additive to molding: redesign for uniform walls, draft, ribs, bosses, gates, ejectors, shrink, and resin-specific snap behavior.
- Additive to CNC: add machinable stock, datums, reachable features, standard cutters, and material allowances.
- CNC to molding: remove billet-only pockets, sharp corners, and thick solid masses; add draft and consistent wall thickness.
- CNC to sheet metal: convert solid blocks into constant-thickness panels, bends, tabs, hardware, and formed stiffness features.
- Laser prototype to production sheet metal: validate bend radius, bend allowance, hole-to-bend distance, finish buildup, and hardware installation.
- Soft tooling to hard tooling: recheck shrink, cooling, steel-safe dimensions, side actions, texture, and gate/ejector marks.

## Supplier And Qualification Loop

- Request supplier DFM before tooling release or production purchase order.
- Use first articles to validate dimensions, cosmetics, assembly, function, and inspection method.
- Document deviations and decide whether to change CAD, tooling, process parameters, or acceptance criteria.
- Run fit/function tests with production-intent finish and hardware.
- Create boundary samples for subjective cosmetic acceptance.
- Close the loop with updated drawings, CAD, BOM, assembly instructions, and inspection plans.

## Recommended Actions

- Label prototype-only assumptions directly in the review.
- Identify production blockers separately from prototype improvements.
- Add test coupons for fits, snaps, coatings, and critical tolerances.
- Move from generic DFM advice to supplier-specific capability before design freeze.
- Require formal review for safety-critical, regulated, sealed, high-volume, or high-cosmetic parts.
