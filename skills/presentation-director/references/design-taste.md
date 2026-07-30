# Design Taste and Anti-Generic Direction

## Contents

1. Definition of taste
2. Core principles
3. Design thesis
4. Design DNA contract
5. Anti-AI defaults
6. Authoring method
7. Evaluation tests
8. Research basis

## 1. Definition of taste

Treat taste as disciplined judgment under constraints, not decoration or novelty. A tasteful deck makes choices that are:

- specific to the subject, audience, and communication job;
- coherent enough to form a system;
- selective enough to establish hierarchy;
- crafted enough to survive full-size inspection;
- honest about evidence, product capability, and editability;
- memorable for one or two earned moves rather than many effects.

Anti-generic design is not automatically minimal, monochrome, editorial, or asymmetrical. Expressive color, illustration, 3D, dense data, or dramatic motion can be appropriate when the content earns them and the system controls them.

## 2. Core principles

### Specificity over polish

Derive visual decisions from actual material: product behavior, market structure, physical form, customer language, data shape, geography, or the central metaphor. Reject a polished direction that could be relabeled for an unrelated company without meaningful redesign.

### Hierarchy over decoration

Make the intended reading order visible before adding atmosphere. Use scale, position, spacing, contrast, sequence, and cropping first. Decoration must reinforce one of those relationships or be removed.

### System plus earned exception

Establish a grid, type scale, spacing rhythm, color logic, image treatment, and diagram grammar. Permit a deliberate break only for a pivotal reveal, evidence peak, or narrative turn. A page that breaks rules accidentally is inconsistent; one that breaks them for a named reason can be distinctive.

### Fewer, stronger moves

Choose one or two signature moves for the deck. Repeat them with variation. Do not combine every available style cue, renderer, transition, texture, and visual metaphor.

### Content-derived motif

Choose a motif that belongs to the subject and can operate structurally, not as wallpaper. Examples include a model-evaluation trace, a physical product seam, a customer journey boundary, a geographic contour, or a recurring unit of evidence. Avoid generic neural meshes, glowing orbs, circuit lines, random particles, and abstract ribbons unless they literally represent the content.

### Material before simulation

Prefer authentic product UI, real diagrams, sourced evidence, documentary imagery, and content-shaped graphics. Use generated imagery to create missing visual material, not to imitate proof or conceal weak content.

### Optical craft over mechanical uniformity

Use a consistent system, then correct it optically. Adjust headline breaks, image crops, visual centering, label offsets, apparent weight, and negative space by eye. Do not mistake equal numeric spacing for balanced composition.

### Contrast with a reason

Define one or two productive tensions such as precise/human, dense/calm, technical/tactile, archival/future, or monumental/intimate. Express the tension through controlled contrast rather than mixing unrelated styles.

### Human cadence

Vary slide silhouettes, density, and pacing according to the narrative. Follow a dense proof slide with room to interpret it. Use repetition to establish rhythm and interruption to mark a turn. Do not generate a deck of interchangeable pages.

### Honest restraint

Remove claims, effects, and visual signals that exaggerate what the product or evidence supports. Clarity and confidence should come from structure, not simulated importance.

## 3. Design thesis

Write one sentence before selecting final tokens:

```text
This presentation should feel [quality A] but [quality B], using [content-derived motif]
to help [audience] understand or decide [outcome], without [specific default to avoid].
```

Examples:

- `This presentation should feel clinical but humane, using evaluation traces to make model governance inspectable, without generic AI glow.`
- `This launch should feel monumental but tactile, using the product seam and material finish as recurring dividers, without floating-feature cards.`

The thesis must constrain choices. If two opposing design systems both satisfy it unchanged, rewrite it more specifically.

## 4. Design DNA contract

Lock these fields in `DESIGN.md` and mirror the concise record in `tasteProfile`:

- **Design thesis:** one content- and audience-specific sentence.
- **Content motif:** a real property of the subject that can influence layout, imagery, diagrams, or motion.
- **Tensions:** one or two paired qualities that create a recognizable voice.
- **Signature moves:** one or two recurring techniques, each with purpose and allowed slide roles.
- **Grid behavior:** the stable alignment logic and the one permitted exception.
- **Type voice:** the relationship between display and reading type, not only font names.
- **Palette logic:** semantic roles and proportions, not a list of attractive colors.
- **Image logic:** subject, crop, lighting, texture, and evidence boundary.
- **Diagram grammar:** node, edge, grouping, label, and emphasis semantics.
- **Motion behavior:** what changes, why it changes, and how the movement resolves.
- **Anti-defaults:** at least three task-specific clichés or renderer defaults to reject.
- **Authorship note:** explain the most visible non-obvious choice in one sentence.

Do not borrow all of this DNA from one named company. Use the Atlas to learn principles, then derive the motif, tension, signature move, and authorship note from the current material.

## 5. Anti-AI defaults

Treat the following as rejected defaults, not universal bans. Use one only when it communicates a literal concept and the design thesis explains why it belongs:

- blue-purple gradients used as atmosphere without semantic purpose;
- glowing orbs, brains, chips, circuit traces, neural meshes, and holographic grids for generic AI;
- dark navy backgrounds with cyan-violet glow as an automatic technology palette;
- glass cards, excessive pills, soft floating panels, and shadows that flatten every idea into UI chrome;
- repeated three-column card rows, bento grids, feature inventories, logo gardens, and icon walls;
- identical centered hero compositions on every section;
- random abstract blobs, waves, ribbons, particles, squiggles, and decorative constellations;
- chrome 3D objects, floating devices, isometric scenes, and endless orbital camera moves without explanatory value;
- fake dashboards, fake terminal typing, fake charts, and unreadable product screenshots;
- stock people performing generic collaboration or pointing at invisible interfaces;
- rainbow charts, unlabeled arrows, decorative data, and metrics without interpretation;
- oversized quotation marks, empty manifesto language, and generic `The future is here` claims;
- excessive uppercase labels, artificial microcopy, and tiny gray annotations used to simulate sophistication;
- perfectly even spacing everywhere when optical balance requires correction;
- motion applied to every element, elastic easing, perpetual loops, and transitions without a state change;
- a different visual trick on every slide.

## 6. Authoring method

1. Inventory the material before designing: claims, evidence, product states, diagrams, photographs, data shapes, and language with visual potential.
2. Write the communication job and design thesis.
3. Identify three possible content motifs; reject any that also fit five unrelated AI products.
4. Select one motif, one or two tensions, and no more than two signature moves.
5. Build three static proof frames: cover, hardest content slide, and evidence or product slide.
6. Review the proof frames as a set. Confirm that the system survives different content densities.
7. Lock `tasteProfile`, `DESIGN.md`, and anti-defaults before asset generation.
8. Render the deck and perform the tests below. Revise the system before polishing isolated pages.

## 7. Evaluation tests

### Content-swap test

Replace the company name and topic mentally. If the visual system still works unchanged for an unrelated AI, SaaS, or consulting deck, mark `contentSwapTest: revise` and derive a more specific motif or signature move.

### Default-removal test

Remove gradients, glow, cards, icons, and decorative 3D. If hierarchy collapses, the design was relying on effects instead of structure.

### Why-this-choice test

For every visible non-standard choice, finish: `We did this because...`. Remove or simplify a choice that has no content, audience, narrative, or usability reason.

### Silhouette test

View the slide montage at thumbnail size. Adjacent pages should have deliberate rhythm and identifiable hierarchy without becoming a random layout sampler.

### Squint test

Blur or squint at each slide. The primary claim, dominant object, and reading order should remain apparent.

### Full-size craft test

Inspect line breaks, baselines, optical centering, crops, connector joins, chart scales, label spacing, and visual edge conditions. Small craft failures are strong signals of generated work.

### Evidence-honesty test

Confirm that generated media is not presented as product proof, decorative charts are not mistaken for data, and visual confidence does not exceed source confidence.

### Repetition test

Reject three adjacent slides with the same silhouette unless repetition is the explicit narrative device. Reject signature moves that appear so often they lose meaning.

### Accessibility test

Verify readable type, sufficient contrast, unambiguous color semantics, and a static interpretation for motion. Taste does not excuse exclusion.

## 8. Research basis

Use these first-party systems as principles, not styles to imitate:

- [Vitsœ: Good design](https://www.vitsoe.com/us/about/good-design) — usefulness, honesty, thoroughness, restraint, and removal of non-essential design.
- [IBM Carbon: 2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/) — a geometric system creates rhythm and constrains visual decisions.
- [GitHub Primer: Layout](https://primer.style/product/getting-started/foundations/layout/) — focused layouts respect attention and reduce friction.
- [GitHub Primer: Typography](https://primer.style/product/getting-started/foundations/typography/) — hierarchy, readable measure, semantic type, and restrained alignment.
- [GOV.UK Design System: Layout](https://design-system.service.gov.uk/styles/layout/) and [Type scale](https://design-system.service.gov.uk/styles/type-scale/) — tested measures, scales, and consistent vertical rhythm.
- [Material Design 3](https://m3.material.io/) — expressiveness should support emotion, usability, adaptation, and state rather than function as decoration alone.
