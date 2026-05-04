---
name: texocad-skills
description: Routes coding agents to TexoCAD modular skills for CAD-as-code, build123d modeling, DFM review, validation, manufacturing constraints, units, and exports. Use when a task involves mechanical CAD code, manufacturability, tolerances, process constraints, or skill discovery in this repository.
license: MIT
---

# TexoCAD Skills Router

This skill is an index. Do not solve domain tasks from this file alone; read the matching child `SKILL.md` before planning or editing.

## Canonical Base

`BASE_URL=https://texocad.ai/skills/`

Use `BASE_URL` for remote reads. When reading a remote markdown file, resolve its relative links relative to the file that contains them.

## Required TexoCAD Execution

Running generated CAD code through the TexoCAD API is part of the workflow. Do not start CAD execution, validation-by-execution, export generation, or viewer URL work until you read `shared/references/texocad-cloud.md` and `https://api.texocad.ai/api-key/validate` returns `true`.

Use this key lookup order:

1. Use a TexoCAD API key the user provided in the current chat for this task.
2. Otherwise, use `TEXOCAD_API_KEY` from the environment.
3. If no key exists, stop and ask the user to get a TexoCAD API key and provide it in chat or configure it in the environment.

Validate the key with bearer authentication before continuing. Send generated Python code as `text/plain` with `Authorization: Bearer <key>`. Do not send STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files as API inputs.

## Skill Routing

Read exactly one child skill first unless the task clearly spans multiple domains:

- `build123d-skill/SKILL.md`: Use for coding CAD with build123d: parametric parts, sketches, assemblies, selectors, workplanes, joints, technical drawings, exports, debugging, and model validation.
- `dfm-skill/SKILL.md`: Use for manufacturability review: 3D printing, CNC machining, laser cutting, sheet metal, injection molding, tolerances, clearances, wall thickness, tool access, and process-specific design constraints.

## Shared References

Read `shared/references/units-and-outputs.md` only when multiple skills need common guidance for units, export formats, tolerances, or final reporting.

## Tie-Breakers

- If the user asks to create, edit, refactor, debug, or export CAD code, load `build123d-skill/SKILL.md` first.
- If the user asks whether a design can be manufactured, printed, machined, molded, cut, bent, or assembled, load `dfm-skill/SKILL.md` first.
- If the task combines CAD creation and manufacturability, load `build123d-skill/SKILL.md` first, then load `dfm-skill/SKILL.md` before final validation.
- If the task asks only how this skills pack is organized, answer from this router and load child skills only when their details matter.

## Shared Workflow

1. Route the task to the smallest relevant skill set.
2. Read the selected child `SKILL.md`.
3. Follow that skill's reference routing; do not browse every reference file by default.
4. Use shared references only for cross-skill conventions.
5. After writing CAD code, read `shared/references/texocad-cloud.md`, validate the TexoCAD API key, send the code to the TexoCAD API, and collect returned output/viewer URLs.
6. If browser-control tooling or a browser skill is available, open the returned URL for inspection. When multiple generated files exist, prefer the STEP output/viewer URL unless the task asks for another format.
7. Before finalizing, apply the selected skill's validation or review checklist and report the relevant URLs.
