---
name: codex-presentation-director
description: Direct high-quality presentations from a brief, source material, a reference deck, or a named visual direction. Use when an AI agent needs to plan, create, revise, or review PPT/PPTX decks, presentation visuals, product demos, architecture slides, optional Three.js scenes, or motion-enhanced presentations while checking and coordinating installed specialist capabilities.
---

# Presentation Director

Act as the presentation director. Own the communication job, narrative, visual contract, renderer choices, motion budget, provenance, dependency readiness, and final quality. Delegate rendering to installed specialist capabilities instead of reimplementing their engines.

## Apply the hard gates

1. Run capability preflight before creating `DESIGN.md` or generating assets. Read [references/dependencies.json](references/dependencies.json), select the requested profile, and write `capabilityProfile` to `presentation.json`.
2. If a required capability is missing, show the user its platform-specific installation guidance and fallback impact. Stop until the capability is installed or the user explicitly approves a fallback. Never silently downgrade or claim Full Studio.
3. Define the communication job before choosing layouts:
   `By the end, [audience] should [outcome] because [central takeaway].`
4. Select exactly one visual route:
   - Use a supplied PPTX/template as the source of truth.
   - Use an explicit custom direction or one primary Atlas reference.
   - Use the presentation engine's default library only when neither exists.
5. Create `DESIGN.md` before generating any visual or motion asset.
6. Create `presentation.json` before rendering slides.
7. Build the most-visible static frame before adding animation.
8. Render and inspect every final slide or motion composition before delivery.

Do not expose plans, renderer notes, prompts, timing scaffolds, or QA comments as audience-facing slide copy.

## Initialize the workspace

Run:

```text
node <skill-dir>/scripts/init-workspace.mjs <project-dir> --title "<deck title>" --language zh-CN --platform <platform> --profile full-studio
```

For an existing workspace, run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile <requested-mode> --write
```

Keep reusable project truth in `DESIGN.md` and `presentation.json`. Keep disposable build notes, source notes, prompt records, and QA ledgers under `tmp/` as `.txt` files. Put final deliverables under `output/` unless the user gives another destination.

For a requested Three.js scene, add `--require three_d`. Rerun `check-capabilities.mjs --write` after installing, enabling, or changing any provider. Use `--approve-fallbacks` only after the user explicitly accepts the reported loss of capability.

## Load only the required references

- Read [references/workflow.md](references/workflow.md) for every deck build or major revision.
- Read [references/dependencies.json](references/dependencies.json) before capability preflight or installation guidance.
- Read exactly one host adapter before invoking providers:
  - [references/platforms/codex.md](references/platforms/codex.md)
  - [references/platforms/claude-code.md](references/platforms/claude-code.md)
  - [references/platforms/copilot.md](references/platforms/copilot.md)
  - [references/platforms/gemini.md](references/platforms/gemini.md)
  - [references/platforms/cursor.md](references/platforms/cursor.md)
- Read [references/routing.md](references/routing.md) before assigning renderers or output formats.
- Read [references/manifest.md](references/manifest.md) before authoring `presentation.json`.
- Read [references/review.md](references/review.md) before final rendering and delivery.
- Read [references/prompt-contracts.md](references/prompt-contracts.md) before handing work to imagegen, HyperFrames, Remotion, UI capture, or a diagram renderer.
- Read [references/patterns/layouts.md](references/patterns/layouts.md) when selecting slide silhouettes.
- Read [references/patterns/motion.md](references/patterns/motion.md) when any motion is requested or materially useful.
- Read [references/renderers/threejs.md](references/renderers/threejs.md) only when a Remotion video needs spatial 3D, a product turntable, an exploded assembly, spatial layers, or a camera path.
- Read only the chosen primary Atlas file and any role-scoped secondary file:
  - [references/atlas/apple.yaml](references/atlas/apple.yaml)
  - [references/atlas/openai.yaml](references/atlas/openai.yaml)
  - [references/atlas/nvidia.yaml](references/atlas/nvidia.yaml)
  - [references/atlas/github.yaml](references/atlas/github.yaml)
  - [references/atlas/ibm.yaml](references/atlas/ibm.yaml)
  - [references/atlas/google.yaml](references/atlas/google.yaml)
  - [references/atlas/spotify.yaml](references/atlas/spotify.yaml)
  - [references/atlas/figma.yaml](references/atlas/figma.yaml)
  - [references/atlas/human-marketplace.yaml](references/atlas/human-marketplace.yaml)
- Read one role pack only when a named slide role needs specialist evidence or visual grammar. A role pack never supplies the deck-wide palette or typography:
  - [references/role-packs/cloudflare-network.yaml](references/role-packs/cloudflare-network.yaml)
  - [references/role-packs/stripe-developer-finance.yaml](references/role-packs/stripe-developer-finance.yaml)
  - [references/role-packs/vercel-product-demo.yaml](references/role-packs/vercel-product-demo.yaml)
  - [references/role-packs/snowflake-saas-investor.yaml](references/role-packs/snowflake-saas-investor.yaml)
  - [references/role-packs/adobe-creative-workflow.yaml](references/role-packs/adobe-creative-workflow.yaml)
  - [references/role-packs/salesforce-customer-success.yaml](references/role-packs/salesforce-customer-success.yaml)
  - [references/role-packs/bcg-consulting-evidence.yaml](references/role-packs/bcg-consulting-evidence.yaml)
- Read [references/library/source-registry.yaml](references/library/source-registry.yaml) only when provenance, refresh, or rights status is relevant.
- Read [references/library/reference-library.md](references/library/reference-library.md) when selecting or refreshing downloaded official reference material.
- Use `assets/reference-library/catalog.json` and its bundled `previewFile` values for visual selection. Do not download a raw source or high-resolution cache object unless a selected slide needs closer inspection, regeneration, or provenance verification.

## Invoke installed providers when their route is selected

- Use the presentation provider recorded by capability preflight for every local PPTX read/create/edit workflow. Follow its template route, source-note policy, rendering checks, and overflow checks.
- Use the detected image-generation provider for original product imagery, conceptual hero art, backgrounds, and illustrative assets. Do not use it for exact architecture, charts, tables, or text-heavy UI.
- Use the detected short-motion provider for deterministic animated architecture builds, title cards, slide loops, and 3-15 second sequences. Give the composition the same `DESIGN.md`.
- Use the detected video provider for 15-90 second multi-scene product demos, narration, captions, or parameterized video. Follow that provider's video-layout guidance before coding.
- When a `remotion_video` slide declares `threeD`, use project-local Three.js, React Three Fiber, and `@remotion/three` as a component inside Remotion. Drive every 3D animation from the Remotion frame timeline and provide a poster fallback.
- Use native PowerPoint shapes for simple editable diagrams and Graphviz or another deterministic diagram route for complex topology. Keep labels outside image generation.

If a required capability is unavailable, present its installation guidance first and stop. Continue with a static or alternate fallback only after explicit user approval, rerun capability preflight with `--approve-fallbacks --write`, record the decision in `tmp/fallback-reasons.txt`, and change every unsupported slide renderer in `presentation.json`. Do not silently claim animation, 3D, or editability that was not produced.

## Route each slide deliberately

Assign one renderer to every slide:

- `native_ppt`: editable text, charts, tables, simple diagrams, and most business slides.
- `image_slide`: cover, concept, or emotional statement where flattened editability is acceptable.
- `svg`: precise architecture, process, roadmap, or topology.
- `ui_capture`: realistic product UI built in HTML/React and captured at presentation resolution.
- `hyperframes_video`: short deterministic motion with a static fallback frame.
- `remotion_video`: longer multi-scene video with a static fallback frame; may contain an optional deterministic `threeD` component.

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

Then execute the renderer-specific checks in [references/review.md](references/review.md). Resolve every capability mismatch, unintended overlap, clipping, broken connector, missing asset, unresolved placeholder, contrast failure, and motion-budget violation. Deliver only the requested final outputs plus a concise summary of what remains flattened or replaceable.
