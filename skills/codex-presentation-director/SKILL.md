---
name: codex-presentation-director
description: Direct high-quality presentations from a brief, source material, a reference deck, or a named visual direction. Use when Codex needs to plan, create, revise, or review PPT/PPTX decks, presentation visuals, product demos, architecture slides, or motion-enhanced presentations while coordinating the Presentations, imagegen, HyperFrames, and Remotion skills.
---

# Codex Presentation Director

Act as the presentation director. Own the communication job, narrative, visual contract, renderer choices, motion budget, provenance, and final quality. Delegate rendering to the installed specialist skills instead of reimplementing their engines.

## Apply the hard gates

1. Define the communication job before choosing layouts:
   `By the end, [audience] should [outcome] because [central takeaway].`
2. Select exactly one visual route:
   - Use a supplied PPTX/template as the source of truth.
   - Use an explicit custom direction or one primary Atlas reference.
   - Use the presentation engine's default library only when neither exists.
3. Create `DESIGN.md` before generating any visual or motion asset.
4. Create `presentation.json` before rendering slides.
5. Build the most-visible static frame before adding animation.
6. Render and inspect every final slide or motion composition before delivery.

Do not expose plans, renderer notes, prompts, timing scaffolds, or QA comments as audience-facing slide copy.

## Initialize the workspace

Run:

```text
node <skill-dir>/scripts/init-workspace.mjs <project-dir> --title "<deck title>" --language zh-CN
```

Keep reusable project truth in `DESIGN.md` and `presentation.json`. Keep disposable build notes, source notes, prompt records, and QA ledgers under `tmp/` as `.txt` files. Put final deliverables under `output/` unless the user gives another destination.

## Load only the required references

- Read [references/workflow.md](references/workflow.md) for every deck build or major revision.
- Read [references/routing.md](references/routing.md) before assigning renderers or output formats.
- Read [references/manifest.md](references/manifest.md) before authoring `presentation.json`.
- Read [references/review.md](references/review.md) before final rendering and delivery.
- Read [references/prompt-contracts.md](references/prompt-contracts.md) before handing work to imagegen, HyperFrames, Remotion, UI capture, or a diagram renderer.
- Read [references/layout-patterns.md](references/layout-patterns.md) when selecting slide silhouettes.
- Read [references/motion-patterns.md](references/motion-patterns.md) when any motion is requested or materially useful.
- Read only the chosen primary Atlas file and any role-scoped secondary file:
  - [references/atlas-apple.yaml](references/atlas-apple.yaml)
  - [references/atlas-openai.yaml](references/atlas-openai.yaml)
  - [references/atlas-nvidia.yaml](references/atlas-nvidia.yaml)
  - [references/atlas-github.yaml](references/atlas-github.yaml)
  - [references/atlas-ibm.yaml](references/atlas-ibm.yaml)
  - [references/atlas-google.yaml](references/atlas-google.yaml)
  - [references/atlas-spotify.yaml](references/atlas-spotify.yaml)
  - [references/atlas-figma.yaml](references/atlas-figma.yaml)
  - [references/atlas-human-marketplace.yaml](references/atlas-human-marketplace.yaml)
- Read one role pack only when a named slide role needs specialist evidence or visual grammar. A role pack never supplies the deck-wide palette or typography:
  - [references/role-packs/cloudflare-network.yaml](references/role-packs/cloudflare-network.yaml)
  - [references/role-packs/stripe-developer-finance.yaml](references/role-packs/stripe-developer-finance.yaml)
  - [references/role-packs/vercel-product-demo.yaml](references/role-packs/vercel-product-demo.yaml)
  - [references/role-packs/snowflake-saas-investor.yaml](references/role-packs/snowflake-saas-investor.yaml)
  - [references/role-packs/adobe-creative-workflow.yaml](references/role-packs/adobe-creative-workflow.yaml)
  - [references/role-packs/salesforce-customer-success.yaml](references/role-packs/salesforce-customer-success.yaml)
  - [references/role-packs/bcg-consulting-evidence.yaml](references/role-packs/bcg-consulting-evidence.yaml)
- Read [references/source-registry.yaml](references/source-registry.yaml) only when provenance, refresh, or rights status is relevant.
- Read [references/reference-library.md](references/reference-library.md) when selecting or refreshing downloaded official reference material.
- Use the bundled `previewFile` from `catalog.json` for visual selection. Do not download a raw source or high-resolution cache object unless a selected slide needs closer inspection, regeneration, or provenance verification.

## Invoke specialist skills when their route is selected

- Invoke `Presentations` for every local PPTX read/create/edit workflow. Follow its template route, artifact-tool requirement, source-note policy, rendering checks, and overflow checks.
- Invoke `imagegen` for original product imagery, conceptual hero art, backgrounds, and illustrative assets. Do not use it for exact architecture, charts, tables, or text-heavy UI.
- Invoke `hyperframes` and `hyperframes-cli` for deterministic short motion, animated architecture builds, title cards, slide loops, and 3-15 second sequences. Give the composition the same `DESIGN.md`.
- Invoke `remotion-best-practices` for 15-90 second multi-scene product demos, narration, captions, or parameterized video. Read its required video-layout guidance before coding.
- Use native PowerPoint shapes for simple editable diagrams and Graphviz or another deterministic diagram route for complex topology. Keep labels outside image generation.

If a required specialist skill is unavailable, preserve the narrative and static layout, record the fallback in `tmp/fallback-reasons.txt`, and generate a replaceable poster frame. Do not silently claim animation or editability that was not produced.

## Route each slide deliberately

Assign one renderer to every slide:

- `native_ppt`: editable text, charts, tables, simple diagrams, and most business slides.
- `image_slide`: cover, concept, or emotional statement where flattened editability is acceptable.
- `svg`: precise architecture, process, roadmap, or topology.
- `ui_capture`: realistic product UI built in HTML/React and captured at presentation resolution.
- `hyperframes_video`: short deterministic motion with a static fallback frame.
- `remotion_video`: longer multi-scene video with a static fallback frame.

Keep the title, key claim, sources, and any necessary labels native in PPTX whenever feasible. Treat generated images and videos as replaceable media assets.

## Control style and motion

- Lock one `primaryReference` for the deck.
- Allow a secondary reference only for named slide roles; never mix its palette into the global identity.
- Treat all company materials in the Atlas and role packs as internal design references, not distributable templates.
- Keep raw reference files outside the plugin. Preserve their canonical links in `sources.json` and load one source at a time with the on-demand collector.
- Use `*-inspired` labels. Do not copy logos, proprietary imagery, exact layouts, marketing copy, or unlicensed fonts. Do not imply endorsement.
- Default to at most 3 video slides, 45 total video seconds, and 2 transition styles.
- Animate only to explain change, sequence, system behavior, product use, or a major reveal.
- Prefer restrained state change over decorative fly-ins, bounce, constant motion, or random effects.

## Preserve accuracy and editability

- Give each slide one narrative job and one primary claim.
- Use takeaway titles that a presenter could say aloud.
- Shorten copy or change layouts before shrinking type.
- Never generate architecture labels, factual diagrams, numerical charts, or tables as raster art.
- Mark every slide `native`, `mixed`, `replaceable-media`, or `flattened` in the manifest.
- Put externally sourced claims and assets in slide sources and in `[Sources]` blocks in speaker notes.
- Do not reuse the same generated image on multiple slides unless it is a deliberate background system.

## Validate before delivery

Run the workspace validator:

```text
node <skill-dir>/scripts/validate-workspace.mjs <project-dir>
```

Then execute the renderer-specific checks in [references/review.md](references/review.md). Resolve every unintended overlap, clipping, broken connector, missing asset, unresolved placeholder, contrast failure, and motion-budget violation. Deliver only the requested final outputs plus a concise summary of what remains flattened or replaceable.
