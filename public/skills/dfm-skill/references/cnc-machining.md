# CNC Machining DFM

Use this reference for milled, turned, drilled, and routed parts.

Rules of thumb below assume conventional subtractive machining. Supplier tooling, material, machine rigidity, cutter length, fixture strategy, and inspection plan override generic values.

## Inputs To Capture

- Process: 3-axis milling, 4/5-axis milling, turning, mill-turn, routing, drilling, reaming, boring, broaching, EDM, grinding, or unknown.
- Material and condition: alloy, temper, hardness, plastic grade, fiber fill, casting/forging stock, heat treatment, and required certification.
- Critical features: datums, bearing seats, sealing surfaces, threads, bores, slot widths, perpendicularity, flatness, concentricity, and surface finish.
- Setup assumptions: stock size, workholding faces, soft jaws, vise, fixture plate, vacuum table, tabs, sacrificial stock, and flips.
- Secondary operations: heat treat, anodize, passivation, plating, bead blast, deburr, engraving, insert installation, and inspection.

## Milling Checks

- Tool access: verify every feature can be reached from a realistic tool axis without impossible undercuts, toolholder collisions, or trapped geometry.
- Internal radii: inside corners need a radius at least as large as the cutter radius. Prefer a radius larger than the cutter radius so the tool can maintain feed instead of dwelling in corners.
- Pocket depth: flag pockets deeper than about `3x` tool diameter, treat `3x-6x` as cost/risk territory, and treat `10x` as special tooling or redesign territory.
- Narrow slots: slots near cutter diameter force full-width engagement, heat, deflection, and poor chip evacuation. Widen slots or open one side where possible.
- Thin walls and floors: metal walls near or below about `0.8 mm` and plastic walls near or below about `1.5 mm` are high risk unless short and well supported.
- Tall features: tall ribs, fins, and posts chatter or deflect. Add thickness, reduce height, add fillets, or machine with support stock until late in the process.
- Bottom corners: flat end mills leave a floor radius or tool marks depending on strategy. Specify radii, chamfers, or acceptable tool marks where they matter.
- Square mating corners: add dogbones, corner reliefs, separate inserts, broaching, wire EDM, or change the mating part to accept a radius.
- Surface finish: tight roughness requirements drive smaller stepovers, polishing, grinding, or secondary finishing. Keep finish callouts local.

## Turning And Mill-Turn Checks

- Length-to-diameter ratio: long slender parts deflect, chatter, and may need tailstock, steady rest, or grinding. Avoid tight tolerances far from support.
- Partoff and gripping: leave material for chucking, collets, soft jaws, or sacrificial stock; avoid critical cosmetic surfaces at partoff scars unless finished later.
- Bores: deep small bores are limited by boring bar stiffness and chip evacuation. Consider drilling plus reaming, boring from both sides, or splitting the part.
- Concentricity: keep concentric features in one turning setup when possible; avoid tolerance requirements that depend on reclamping.
- Cross holes and flats: require live tooling, secondary milling, or another setup. Check orientation datum and deburring access.
- Thin rings and sleeves: expect distortion during clamping and after material removal. Add temporary support, thicker stock, or post-machining stress relief.

## Holes, Threads, And Small Features

- Hole depth: holes deeper than about `6x` diameter need attention; above about `10x` diameter may need special drills, peck cycles, gun drilling, or access from both sides.
- Blind holes: include drill tip allowance, thread relief, and chip clearance. Do not place full-depth threads at the absolute bottom of a blind hole.
- Precision holes: call out reamed, bored, or ground holes only where needed. Standard drilled holes should not carry bearing-seat assumptions.
- Threads: specify thread standard, class, depth, through/blind condition, insert type if any, and whether thread locking or repeated service is expected.
- Tiny features: replace tiny milled details with drilled holes, reamed holes, inserts, broaching, EDM, laser marking, or molded/printed features when possible.

## Setups, Datums, And Workholding

- Machine critical tolerance relationships in the same setup where possible.
- Avoid tight position, parallelism, perpendicularity, or concentricity across flips unless the datum scheme and fixturing support it.
- Identify primary, secondary, and tertiary datums from stable, accessible, non-cosmetic surfaces.
- Add machinable datum pads on cast, printed, forged, or molded near-net parts before asking for precision features.
- Plan clamp access, cutter clearance, chip evacuation, probing access, and deburring access.
- Split a part when one complex monolith requires many flips, custom fixtures, or unreachable tools.

## Tolerance Guidance

- Use title-block or general tolerances for noncritical dimensions; reserve tight tolerances for critical-to-function features.
- Tight global tolerances increase programming, cycle time, fixture cost, scrap, and inspection burden.
- Distinguish size tolerance from geometric tolerance. A precise diameter does not guarantee position, perpendicularity, flatness, or runout.
- Apply surface finish and edge-break requirements only where functional or cosmetic. Blanket polishing or deburring notes can be expensive.
- Account for coating buildup, anodize thickness, plating, heat treat distortion, and stress relief after machining.

## Cost Drivers

- Setup count, custom workholding, small tools, deep pockets, deep holes, hard materials, thin walls, tight GD&T, high surface finish, deburring, and inspection.
- Material removal volume: hogging a deep part from billet may be slower and more wasteful than sheet metal, weldment, casting, forging, or additive preform.
- Tool changes and nonstandard cutters: tiny radii, many unique corner sizes, dovetails, undercuts, keyways, and deep reliefs add cost.
- Secondary operations: heat treat, grinding, EDM, polishing, coating, part marking, and assembly need datums and allowance.

## Common Actions

- Add corner reliefs or dogbones where square mating corners are required.
- Increase internal radii and reduce pocket depth where function allows.
- Add fillets at wall bases, thicken flexible walls, and avoid tall isolated posts.
- Move critical features to the same side or same setup.
- Split the part or redesign features to reduce setup count.
- Replace tiny milled features with drill, ream, broach, EDM, insert, or secondary-operation notes when appropriate.
- Add local drawings or GD&T for critical features instead of over-tolerancing the whole model.

## Supplier Handoff

- Send STEP for CAM handoff; BREP can help preserve OCCT topology in local workflows.
- Provide a drawing for toleranced features, threads, surface finish, datums, inspection requirements, critical dimensions, and edge-break notes.
- Specify material, alloy, temper, hardness, grain direction if relevant, finish, coating, and any certification requirement.
- Identify acceptable tool marks, cosmetic faces, deburr expectations, masking areas, and part marking.
- Clarify whether stock, tabs, workholding marks, witness marks, or fixture holes are allowed.
