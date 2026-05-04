---
name: dfm-skill
description: Reviews mechanical designs for design for manufacturing constraints across 3D printing, CNC machining, laser cutting, sheet metal, injection molding, assembly, finishing, and production handoff. Use when checking manufacturability, tolerances, clearances, wall thickness, tool access, process fit, or production risks.
license: MIT
---

# Design For Manufacturing

Use this skill to review a design against the intended manufacturing process. Do not rewrite CAD code unless the user asks; produce actionable constraints, risks, and geometry changes that another CAD skill can implement.

## Default Workflow

1. Identify the target process, material, quantity, critical interfaces, tolerance class, cosmetic requirements, and post-processing assumptions.
2. If the process is unclear, read [references/process-selection.md](references/process-selection.md) and recommend a default based on geometry and quantity.
3. Review functional datums first, then envelope, wall/feature sizes, clearances, tool or nozzle access, support/fixturing, assembly, and inspection.
4. Convert generic warnings into specific design actions: dimension changes, added reliefs, split lines, draft, radius changes, orientation changes, or export requirements.
5. Keep CAD-library advice separate from manufacturing advice. If build123d code must change, load `../build123d-skill/SKILL.md`.
6. Finish with process-specific validation and a short risk summary.

## Review Rules

- State assumptions when the user does not provide material, process, or tolerance targets.
- Prefer process-specific constraints over generic "make it manufacturable" advice.
- Use named dimensions and measurable checks whenever possible: wall thickness, hole diameter, bend radius, tool radius, clearance, draft angle, aspect ratio, and bounding box.
- Treat numeric rules of thumb as starting heuristics. Supplier capability, material data, tooling, machine class, and inspection plan override generic values.
- Flag conflicts between processes, for example printable lattices that are difficult to machine or sharp internal corners that are fine in printing but not CNC.
- Distinguish prototype guidance from production guidance when quantity, repeatability, tooling, or inspection changes the answer.
- Ask for missing critical inputs only when they change the recommendation materially.

## Common Gotchas

- Nominal CAD dimensions are not manufacturing dimensions; account for kerf, shrinkage, tool deflection, printer calibration, coating, and post-processing.
- Tight fits need both tolerance and assembly intent. A clearance fit, press fit, snap fit, and sliding fit require different checks.
- Internal sharp corners are process-dependent: easy in additive and laser profiles, constrained by tool radius in CNC, and risky for molded stress concentration.
- Very thin walls may pass geometry validation but fail due to warping, incomplete fill, vibration, or fragile handling.
- Export format matters: STEP for manufacturing review and CAM, STL/3MF for mesh printing, DXF/SVG for flat cutting, and drawings for toleranced inspection.

## Reference Routing

Read only the references needed for the current process:

- Process choice and cross-process tradeoffs: [references/process-selection.md](references/process-selection.md)
- 3D printing constraints: [references/3d-printing.md](references/3d-printing.md)
- CNC machining constraints: [references/cnc-machining.md](references/cnc-machining.md)
- Laser and 2D cutting constraints: [references/laser-cutting.md](references/laser-cutting.md)
- Sheet metal constraints: [references/sheet-metal.md](references/sheet-metal.md)
- Injection molding constraints: [references/injection-molding.md](references/injection-molding.md)
- Tolerances, datum schemes, fits, and inspection: [references/tolerances-and-datums.md](references/tolerances-and-datums.md)
- Assembly access, fasteners, inserts, fits, and serviceability: [references/assembly-and-fasteners.md](references/assembly-and-fasteners.md)
- Coatings, surface finish, masking, cosmetic faces, and finish stackup: [references/surface-finishing.md](references/surface-finishing.md)
- Prototype-to-production transitions and qualification risks: [references/prototype-to-production.md](references/prototype-to-production.md)
- Review output template: [references/dfm-review-template.md](references/dfm-review-template.md)

If the task spans multiple manufacturing processes, start with [references/process-selection.md](references/process-selection.md), then read the references for the two most plausible processes only.
Read `../shared/references/units-and-outputs.md` when a review depends on units, export formats, named tolerance assumptions, or combined CAD plus DFM reporting.

## Validation And Outputs

- For a DFM review, use [references/dfm-review-template.md](references/dfm-review-template.md) unless the user asks for another format.
- For CAD changes, hand back concrete modeling instructions or load `../build123d-skill/SKILL.md` before editing code.
- If this skill later gains deterministic checks, keep them in `scripts/` and run them from this file instead of repeating ad hoc calculations.
- Keep reusable tolerance tables, customer templates, and report formats in `assets/` and load them only when requested.
