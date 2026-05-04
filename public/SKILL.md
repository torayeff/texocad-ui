---
name: texocad-skills
description: Loads the latest TexoCAD skills for CAD-as-code, build123d modeling, DFM review, validation, manufacturing constraints, tolerances, units, and exports. Use when a task involves mechanical CAD code, manufacturability, process constraints, or skill discovery in this repository.
license: MIT
---

# TexoCAD Skills

Set:

`BASE_URL=https://texocad.ai/skills/`

Fetch the latest canonical router with `curl`, then read and follow it:

`curl -fsSL "${BASE_URL}SKILL.md"`

Resolve all relative skill and reference paths from `BASE_URL`. When a remote markdown file links to another markdown file, resolve the link relative to the file that contains it.