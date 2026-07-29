# Slide Pattern Library

Select patterns by narrative job, not by visual novelty. Each slide gets one dominant pattern. Preserve the deck grid, type scale, and palette while varying adjacent silhouettes.

## 1. Minimal title

- **Use for:** opening, section reset, major transition.
- **Structure:** one short title, optional short subtitle, restrained brand marker.
- **Text budget:** title <= 10 words; subtitle <= 18 words.
- **Default renderer:** `native_ppt`.
- **Motion:** dissolve-reveal.
- **Avoid:** agenda lists, multiple logos, decorative card rows.

## 2. Centered product reveal

- **Use for:** naming a product or exposing a pivotal feature.
- **Structure:** compact headline, one dominant product render or UI object, one proof line.
- **Visual share:** 55–75% of the canvas.
- **Default renderer:** `native_ppt` with generated or captured media.
- **Motion:** masked-product-reveal or camera-push.
- **Avoid:** feature lists surrounding the product.

## 3. Giant claim

- **Use for:** tension, thesis, result, or chapter conclusion.
- **Structure:** one sentence or number occupying the visual field; optional evidence footnote.
- **Text budget:** 6–16 words.
- **Default renderer:** `native_ppt`.
- **Motion:** restrained dissolve or word-group reveal.
- **Avoid:** quotation marks unless it is a sourced quote.

## 4. Evidence and meaning

- **Use for:** converting a fact, chart, or example into a conclusion.
- **Structure:** evidence on one side; explicit implication on the other.
- **Text budget:** one claim, one evidence block, one implication.
- **Default renderer:** `native_ppt`.
- **Motion:** progressive-build only when the causal reading order matters.
- **Avoid:** listing metrics without interpretation.

## 5. Product interface frame

- **Use for:** showing a real workflow or product proof.
- **Structure:** one large interface capture plus one concise annotation zone.
- **Visual share:** 60–80% UI.
- **Default renderer:** `ui_capture` inside a native PPT frame.
- **Motion:** product-state-change or short HyperFrames sequence.
- **Avoid:** tiny full-dashboard screenshots and unreadable UI text.

## 6. Feature close-up

- **Use for:** explaining one differentiated interaction or capability.
- **Structure:** cropped product detail, one claim, up to three callouts.
- **Default renderer:** `ui_capture` or `native_ppt`.
- **Motion:** camera-push or highlight sweep.
- **Avoid:** more than three callouts or arrows crossing the focal area.

## 7. Layered architecture

- **Use for:** platforms, technical stacks, governance layers, or system boundaries.
- **Structure:** 3–5 layers, consistent node grammar, clear vertical dependency.
- **Label budget:** <= 5 words per node; <= 7 nodes in the primary view.
- **Default renderer:** `native_ppt` for simple stacks, `svg` for complex systems.
- **Motion:** architecture-build.
- **Avoid:** rasterized labels, unlabeled arrows, and decorative 3D blocks.

## 8. Data flow

- **Use for:** request paths, processing pipelines, state transitions, or lifecycle.
- **Structure:** clear start/end, one edge direction, optional branching with explicit semantics.
- **Default renderer:** `svg`.
- **Motion:** data-flow when order is central.
- **Avoid:** crossing edges and simultaneous bidirectional arrows without a legend.

## 9. Ecosystem map

- **Use for:** platform participants, capabilities, integrations, or market structure.
- **Structure:** one center, 3–6 surrounding groups, explicit relationship labels only when needed.
- **Default renderer:** `svg`.
- **Motion:** progressive-build by group.
- **Avoid:** logo gardens without a point or equal visual weight for unequal entities.

## 10. Decisive comparison

- **Use for:** options, before/after, product tiers, or recommended choice.
- **Structure:** 2–3 columns or a shared axis; highlight the decision criterion.
- **Default renderer:** `native_ppt`.
- **Motion:** compare-morph only when state change is meaningful.
- **Avoid:** more than seven comparison rows or ambiguous checkmark grids.

## 11. Roadmap with gates

- **Use for:** phased delivery, milestones, investment gates, or maturity progression.
- **Structure:** 3–5 phases, outcome per phase, explicit gate or proof.
- **Default renderer:** `native_ppt` or `svg`.
- **Motion:** progressive-build.
- **Avoid:** calendar decoration without ownership, outcome, or decision points.

## 12. Closing resolution

- **Use for:** recommendation, decision, next action, or synthesis.
- **Structure:** resolve the opening tension; one action or conclusion; optional supporting visual.
- **Default renderer:** `native_ppt`.
- **Motion:** slow dissolve or restrained final fade.
- **Avoid:** generic “Thank you” as the only message.

## Selection checks

- Does the pattern make the claim easier to grasp?
- Can the copy fit at the required type size?
- Is the dominant relationship visible from the back of a room?
- Does the silhouette differ from the previous slide without changing the design system?
- Is animation necessary, or will a static hierarchy communicate faster?
