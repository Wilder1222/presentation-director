# Motion Pattern Library

Use motion as explanation, state change, demonstration, or reveal. Every motion slide needs a static poster frame and a stated purpose.

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

## Motion anti-patterns

- Animation on every slide.
- Bounce, elastic overshoot, random rotation, or novelty easing in serious decks.
- Motion with no semantic target.
- More than one active focal animation at a time.
- Infinite loops in captured video.
- Exit animations before a HyperFrames scene transition.
- CSS animations or transitions in Remotion.
- Missing poster frames.
- Timing so fast that labels cannot be read or so slow that the talk stalls.
