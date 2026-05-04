# DFM Review Template

Use this template for manufacturability reviews. Keep it short unless the user asks for a formal report.

## Short Review

```markdown
## DFM Review

Assumptions:
- Process:
- Process variant:
- Material:
- Quantity:
- Units:
- Critical interfaces:
- Cosmetic surfaces:
- Supplier assumptions:

Findings:
- [Severity] [Category] [Feature or area]: [Issue]. Recommendation: [Specific change or check].

Validation:
- Minimum wall/feature checks:
- Clearance/tolerance checks:
- Tooling/support/fixturing checks:
- Assembly/finishing checks:
- Export or drawing requirements:

Residual risks:
- [Risk that needs supplier confirmation, prototype testing, or user decision.]
```

## Formal Review

Use this version when the user asks for a detailed report, production readiness review, supplier handoff, or multi-process comparison.

```markdown
## DFM Review

Scope:
- Source geometry:
- Process:
- Process variant:
- Material and grade:
- Quantity and production phase:
- Units:
- Finish/post-processing:
- Critical interfaces:
- Cosmetic surfaces:
- Assumptions:

Executive summary:
- [One to three bullets summarizing manufacturability, major blockers, and recommended next step.]

Findings:
- [Severity] [Category] [Feature or area]: [Issue].
  - Why it matters: [Manufacturing, cost, quality, assembly, or inspection consequence.]
  - Recommendation: [Specific geometry, tolerance, material, process, or supplier question.]
  - Validation: [Coupon, drawing check, supplier DFM, first article, inspection, or prototype test.]

Process-specific checks:
- Geometry and feature size:
- Tolerances and datums:
- Tool/nozzle/support/fixturing access:
- Material and process variant:
- Assembly and fasteners:
- Surface finishing and cosmetics:
- Inspection and supplier handoff:

Open supplier questions:
- [Question that needs machine, tooling, material, finish, or inspection capability.]

Recommended next actions:
1. [Highest priority design change or confirmation.]
2. [Next validation step.]
3. [Export/drawing/supplier handoff action.]

Residual risks:
- [Risk that remains after recommended changes.]
```

## Severity Guide

- Critical: likely to fail manufacturing, assembly, inspection, safety, or core function. Example: sealed bore has no tolerance or post-machining plan.
- Major: manufacturable only with high cost, fragility, inconsistent yield, special tooling, rework, or supplier escalation. Example: CNC pocket requires a very small cutter at high depth.
- Minor: improvement for cost, quality, handling, cosmetics, robustness, or clarity. Example: add a radius to reduce deburring effort.
- Note: assumption, supplier question, process tradeoff, or optional improvement. Example: confirm whether DXF is already kerf compensated.

## Finding Categories

- Geometry: wall thickness, radius, hole, rib, boss, flange, bend, tab, slot, undercut, draft, or envelope.
- Tolerance: fit clearance, GD&T, datum, tolerance stack, inspection method, or process capability.
- Material: grade, temper, resin, filler, shrinkage, heat, chemical exposure, or compliance.
- Process access: tool reach, support removal, powder escape, mold pull, bend sequence, pierce point, or fixturing.
- Assembly: fastener, insert, snap fit, press fit, weld, adhesive, torque access, or serviceability.
- Finishing: coating buildup, masking, cosmetic face, texture, deburring, polishing, or heat treatment.
- Handoff: export format, drawing, supplier question, first article, capability, or acceptance criteria.

## Example Finding

```markdown
- Major [Tolerance] Bearing bore: The bore is modeled as-printed with a tight bearing fit, but SLS/MJF surface roughness and dimensional variation are unlikely to hold the required fit directly. Recommendation: add machining stock and define the bore as a post-machined datum feature, or change to a pressed metal bushing with a validated coupon.
```
