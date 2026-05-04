# Assembly And Fasteners

Use this reference when manufacturability depends on how parts join, align, service, or survive assembly loads.

## Inputs To Capture

- Assembly method: screws, bolts, nuts, inserts, rivets, welds, heat stakes, ultrasonic welds, adhesives, snap fits, press fits, pins, tabs, or clips.
- Service intent: permanent, field-serviceable, repeated disassembly, tamper-resistant, adjustable, sealed, or disposable.
- Loads: clamp load, shear, peel, torque, vibration, drop, thermal cycling, creep, fatigue, and misuse.
- Access: tool type, driver angle, wrench clearance, hand access, robot access, fixture access, and inspection access.
- Materials: galvanic compatibility, thread strength, creep, thermal expansion, surface finish, and coating.

## Tool And Hand Access

- Provide straight driver access for screws unless an angled tool is explicitly acceptable.
- Leave clearance for socket heads, washers, nuts, wrench swing, torque tools, and installation fixtures.
- Avoid fasteners hidden behind flanges, ribs, bosses, or cosmetic covers unless the assembly sequence supports it.
- Check whether the fastener can be installed after nearby parts, wires, seals, or hardware are present.
- Provide removal access if the part is serviceable.

## Screws, Threads, And Inserts

- Thread engagement depends on material. Soft plastics, printed polymers, and soft metals need more engagement or inserts.
- Use metal inserts, threaded bushings, helicoils, or captive nuts when repeated service or high torque is expected.
- Add lead-ins to holes and bosses to prevent cross-threading and assembly damage.
- Avoid bottoming screws in blind holes; leave thread relief and clearance for chips, plating, and fastener length tolerance.
- Keep screw bosses away from thin cosmetic walls, molded sink zones, bend lines, and laser-cut edges without enough material.
- Specify torque only when clamp load matters; check whether the material can support it without creep or stripping.

## Press Fits, Pins, And Bearings

- Press fits need material-specific interference, chamfers, insertion-force estimates, and hoop-stress checks.
- Avoid press fits into brittle resin, weak print orientation, thin bosses, or unsupported sheet tabs unless tested.
- Dowel pins and bearing seats need precise holes and datums; plan reaming, boring, or inserts rather than as-printed/as-cut holes.
- Provide relief for displaced material, coating buildup, and thermal expansion.
- Use slip fits plus retention features when serviceability or alignment adjustment matters.

## Snap Fits And Clips

- Check strain limit, creep, fatigue cycles, assembly direction, release access, and material notch sensitivity.
- Add lead-in chamfers and generous root radii.
- Avoid sharp internal corners at snap roots.
- Confirm the manufacturing process can create the undercut without side actions, support scars, or fragile print orientation.
- Prototype snap fits in production-like material; many printed prototypes misrepresent molded snap behavior.

## Adhesives, Welding, And Heat Staking

- Adhesive joints need bondline thickness, surface prep, squeeze-out path, cure access, fixture method, and inspection approach.
- Ultrasonic welding needs energy directors, horn access, support fixtures, and flash control.
- Heat staking needs access for the staking tool, melt volume, post height, and clearance for displaced plastic.
- Spot welding and seam welding need electrode or torch access, heat distortion allowance, and cosmetic cleanup.
- Structural weldments need distortion control, datum strategy, and post-weld inspection.

## Alignment And Poka-Yoke

- Add pilots, pins, tabs, asymmetric features, keyed profiles, or labels where assembly orientation matters.
- Avoid relying on fastener clearance holes alone for precision alignment.
- Use slots or compliant features where tolerance stackups need adjustment.
- Add fixture points when assembly requires repeatable positioning.
- Make wrong assembly impossible where safety, wiring, fluid flow, or calibration depends on orientation.

## Serviceability And Reliability

- Keep wear parts accessible.
- Avoid burying fasteners under permanent labels, adhesives, welds, or fragile cosmetic covers unless intended.
- Account for vibration with thread lockers, locknuts, prevailing torque, staking, clips, or safety wire where appropriate.
- Avoid galvanic couples in conductive environments without isolation or finish planning.
- Consider thermal expansion mismatch between metal inserts and plastic bodies.

## Common Review Findings

- Driver cannot reach the fastener at the required angle.
- Fastener head, washer, nut, or insert overlaps a rib, bend, fillet, or nearby wall.
- Boss is too thin, too tall, or unsupported for screw torque.
- Snap fit is printable but not moldable, or moldable but overstrains the selected resin.
- Press fit has no lead-in, no insertion-force check, or no hoop-stress margin.
- Assembly depends on exact nominal dimensions with no adjustment or compliance.

## Recommended Actions

- Add access clearance envelopes for tools and hands.
- Change screw direction, add captive hardware, or split the assembly.
- Add bosses, ribs, gussets, washers, inserts, or metal load spreaders.
- Replace fragile snap fits with screws, clips, living hinges, or serviceable latches when needed.
- Add alignment pins, slots, datum faces, or fixture holes.
- Define assembly sequence and inspection points before finalizing geometry.
