# Presentation Delivery Contract

## Contents

1. Primary outcome
2. Ready to use
3. Narrative led
4. Visually impactful
5. High quality and high fidelity
6. Modifiable by default
7. Final handoff

## 1. Primary outcome

Produce a finished PowerPoint presentation that the user can open, review, edit, and present immediately. PPTX is the primary artifact. PDF, HTML, MP4, source projects, and preview images are supporting deliverables unless the user explicitly requests another primary format.

Do not treat any of these as completion:

- an outline, storyboard, or slide plan without the deck;
- renderer code without the rendered PPTX;
- a folder of slide images without an assembled presentation;
- a PDF when the request requires editable PowerPoint;
- a PPTX containing placeholders, broken media, production notes, or incomplete pages;
- an attractive deck whose claims, diagrams, or product UI are inaccurate.

## 2. Ready to use

A ready-to-use presentation must:

- open successfully in the target presentation application;
- contain every requested slide in final narrative order;
- have no TODO, draft, unresolved, placeholder, prompt, or production copy visible to the audience;
- include resolved fonts or documented safe fallbacks;
- include working images, charts, diagrams, poster frames, and embedded or linked media as required;
- keep all project sources and regeneration inputs inside the workspace;
- include speaker notes or source notes where evidence or presenter support requires them;
- pass structural validation, full-size visual inspection, and slide-level overflow checks;
- make its editability and compatibility limits explicit.

## 3. Narrative led

Build one argument, not a sequence of topics.

- Define the audience decision, central takeaway, and desired action before slide planning.
- Choose a narrative arc that creates causality, tension, discovery, proof, and resolution.
- Give every slide one narrative job and one claim.
- Write takeaway titles that form a readable argument when viewed in sequence.
- Use evidence to change the audience's understanding, not merely to fill a layout.
- Create section changes only when the argument changes state.
- Resolve the opening question or tension in the closing.

Review the title sequence without slide bodies. If it does not communicate a coherent route, revise the story before polishing visuals.

## 4. Visually impactful

Create impact through hierarchy, contrast, scale, pacing, composition, and well-chosen media. Do not confuse impact with constant spectacle.

- Establish two to four deliberate visual peaks in a typical 10–15 slide deck.
- Make the most important object or statement unmistakable from presentation distance.
- Use quiet slides to increase the force of reveals, evidence peaks, product proof, and closing resolution.
- Vary silhouettes according to narrative rhythm while preserving one grid and visual identity.
- Use original or authentic visual material whose crop, lighting, texture, and subject support the claim.
- Use motion only when sequence, state change, spatial structure, or product behavior becomes clearer.
- Reject generic effects that add intensity without meaning.

A visually impactful deck can be restrained. The requirement is memorable emphasis, not decorative density.

## 5. High quality and high fidelity

Treat fidelity as accuracy plus craft.

### Content fidelity

- Preserve user facts, terminology, numbers, citations, product behavior, and technical relationships.
- Do not invent chart data, architecture nodes, UI states, customer evidence, or product capabilities.
- Keep generated concept imagery clearly separate from product proof.

### Template and brand fidelity

- Preserve supplied masters, layouts, theme colors, fonts, placeholders, logos, footers, and inherited objects unless the user authorizes a redesign.
- Match spacing, alignment, radius, line weight, image treatment, chart grammar, and page density—not only palette and font names.

### Visual fidelity

- Render product UI at legible resolution with realistic states and accurate copy.
- Build exact diagrams, charts, tables, and labels with deterministic editable or vector routes.
- Inspect headline breaks, baselines, optical centering, crop edges, connector joins, chart scales, label spacing, and contrast at full size.
- Verify representative slides in the target application when compatibility matters.

## 6. Modifiable by default

Use a native-first editability model:

- Keep titles, body copy, labels, citations, tables, charts, and simple diagrams as native PowerPoint objects.
- Keep theme colors, text styles, and recurring geometry consistent so global edits remain practical.
- Use editable SVG or grouped native shapes for deterministic diagrams when feasible.
- Place generated images, captured UI, and rendered motion in clearly replaceable media frames.
- Keep the source file or project for every replaceable SVG, image, UI capture, HyperFrames composition, Remotion video, and Three.js scene inside the workspace.
- Do not flatten an entire slide merely to preserve visual styling when native structure can reproduce it.
- Use `image_slide` only for a cover, concept, emotional statement, or exceptional composition that materially benefits from flattening. Record `rasterExceptionReason` in the slide manifest.
- Never call a deck fully editable when it contains flattened or replaceable-media content without explaining the distinction.

## 7. Final handoff

The default handoff contains:

- the final `.pptx` under `output/`;
- requested PDF, HTML, MP4, or preview exports;
- replaceable media and their source projects;
- `DESIGN.md` and `presentation.json`;
- source and rights records;
- a concise disclosure of flattened slides, replaceable media, animation type, and compatibility limits.

Deliver the completed artifacts, not implementation scaffolding. Keep debug logs, intermediate renders, prompts, and QA records under `tmp/`.
