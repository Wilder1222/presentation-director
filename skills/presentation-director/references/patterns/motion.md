# Motion Pattern Library

Use motion as explanation, state change, demonstration, or reveal. Every motion slide needs a static poster frame and a stated purpose.

## Contents

1. Native PowerPoint motion
2. Dissolve reveal
3. Progressive build
4. Masked product reveal
5. Camera push
6. Architecture build
7. Data flow
8. Product state change
9. Compare morph
10. Section transition
11. Product orbit reveal
12. Exploded assembly
13. Spatial layer build
14. Motion anti-patterns

## native-powerpoint-motion

Manifest 1.7 uses the slide's role, claim, content signals, continuity, and semantic page regions to choose native PowerPoint effects automatically. The selector favors a small, legible vocabulary:

- `fade` transition for openings, section resets, reveals, and ordinary claim changes;
- `morph` transition for meaningful before/after or option changes with shared anchors;
- `fade` entrance for the takeaway region;
- `wipe` from the left for ordered diagrams, workflows, roadmaps, data, and metrics;
- a second `fade` for a product reveal, comparison difference, or declared visual peak.

The compiled plan is applied after the static frame is complete. Keep at most six native-animated slides and four steps per slide by default. Every effect needs a semantic target, a reading-order purpose, and a static fallback. If the target PowerPoint version cannot preserve the effect, record the loss rather than silently claiming that the animation exists.

## dissolve-reveal

- **Purpose:** introduce a major claim or reset attention.
- **Best engines:** native PPT or HyperFrames.
- **Duration:** 0.5–1.2 seconds.
- **Sequence:** background hold -> title opacity/position settle -> optional proof line.
- **Use sparingly:** section starts and conclusions.
- **Avoid:** different dissolve timing on every slide.

## progressive-build

- **Purpose:** preserve reading order for 3–5 related elements.
- **Best engines:** native PPT, HyperFrames, or progressive duplicate slides.
- **Duration:** 2–8 seconds.
- **Sequence:** context -> primary element -> supporting elements -> conclusion emphasis.
- **Avoid:** revealing bullets that do not depend on sequence.

## masked-product-reveal

- **Purpose:** create a controlled product reveal without a decorative fly-in.
- **Best engine:** HyperFrames.
- **Duration:** 3–7 seconds.
- **Sequence:** ambient field -> mask opens -> object settles -> one proof line appears.
- **Avoid:** glossy logo imitation, spinning devices, or unrelated particles.

## camera-push

- **Purpose:** move from system context to a meaningful product detail.
- **Best engines:** HyperFrames or Remotion.
- **Duration:** 3–8 seconds.
- **Sequence:** full product state -> spatial push/crop -> detail highlight -> hold.
- **Avoid:** zooming only for spectacle or making UI text unreadable.

## architecture-build

- **Purpose:** explain dependency order, boundaries, or layer activation.
- **Best engine:** HyperFrames.
- **Duration:** 6–12 seconds.
- **Sequence:** frame and labels -> connectors -> nodes/layers -> active path -> conclusion highlight.
- **Rules:** keep edge semantics consistent; preserve labels as HTML/SVG text; animate direction, not random motion.
- **Avoid:** pulsing every node or animating all edges at once.

## data-flow

- **Purpose:** show how information, control, or value moves through a system.
- **Best engines:** HyperFrames or Remotion.
- **Duration:** 5–15 seconds.
- **Sequence:** source -> path -> transformation -> destination -> outcome.
- **Rules:** use one direction and a legend when multiple edge types exist.
- **Avoid:** perpetual particle loops and ambiguous glowing lines.

## product-state-change

- **Purpose:** demonstrate a short UI interaction or state transition.
- **Best engine:** HyperFrames for one interaction; Remotion for a narrated sequence.
- **Duration:** 4–15 seconds.
- **Sequence:** initial state -> user intent -> system response -> success evidence.
- **Avoid:** fake cursor wandering, excessive microinteraction, or unreadable speed.

## compare-morph

- **Purpose:** show a meaningful before/after or option change while preserving spatial correspondence.
- **Best engines:** HyperFrames or native presentation transition when reliable.
- **Duration:** 2–6 seconds.
- **Sequence:** baseline -> shared anchors remain -> changed attributes transform -> difference is labeled.
- **Avoid:** morphing unrelated layouts.

## section-transition

- **Purpose:** signal a change of chapter, scale, or time.
- **Best engines:** native PPT, HyperFrames, or Remotion.
- **Duration:** 0.6–1.5 seconds.
- **Limit:** choose at most two transition families per deck.
- **Avoid:** a unique transition for every section.

## product-orbit-reveal

- **Purpose:** reveal product form, finish, or one meaningful side.
- **Best engine:** Remotion + `@remotion/three`.
- **Duration:** 4–10 seconds.
- **Sequence:** hero angle -> restrained orbit or object turntable -> proof angle -> hold for native callout.
- **Rules:** end on the poster composition and keep the camera target stable.
- **Avoid:** perpetual spinning, dramatic lens changes, or orbiting when one still is clearer.

## exploded-assembly

- **Purpose:** explain how physical or spatial components relate.
- **Best engine:** Remotion + `@remotion/three`.
- **Duration:** 6–15 seconds.
- **Sequence:** whole -> controlled separation -> relationship emphasis -> optional reassembly -> hold.
- **Rules:** separate along meaningful axes and keep labels as readable overlays.
- **Avoid:** arbitrary explosions, collisions, or physics-driven randomness.

## spatial-layer-build

- **Purpose:** use depth to explain containment, hierarchy, or stacked infrastructure.
- **Best engine:** Remotion + `@remotion/three`.
- **Duration:** 6–12 seconds.
- **Sequence:** spatial frame -> base layer -> dependent layers -> active relationship -> final system view.
- **Rules:** use one depth axis consistently and provide an equivalent poster.
- **Avoid:** turning a clear architecture diagram into an unreadable 3D maze.

## Motion anti-patterns

- Animation on every slide.
- Bounce, elastic overshoot, random rotation, or novelty easing in serious decks.
- Motion with no semantic target.
- More than one active focal animation at a time.
- Infinite loops in captured video.
- Exit animations before a HyperFrames scene transition.
- CSS animations or transitions in Remotion.
- `useFrame()`, wall-clock time, self-running mixers, or unseeded randomness in Remotion 3D.
- Generic particle tunnels, glowing globes, or floating geometry with no explanatory role.
- Missing poster frames.
- Timing so fast that labels cannot be read or so slow that the talk stalls.
