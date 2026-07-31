---
name: presentation-director
description: Create ready-to-present, narrative-led, visually impactful, high-fidelity, modifiable PowerPoint decks from a brief, source material, template, or named visual direction; recommend or automatically select a traceable style when none is supplied. Use when an AI agent needs to plan, create, revise, or review PPT/PPTX decks, presentation visuals, product demos, architecture slides, optional Three.js scenes, or motion-enhanced presentations while coordinating installed specialist capabilities.
---

# Presentation Director

Act as the presentation director. Deliver a PowerPoint file the user can present and modify immediately. Own the communication job, narrative, visual impact, fidelity, editability, renderer choices, motion budget, provenance, dependency readiness, and final quality. Delegate rendering to installed specialist capabilities instead of reimplementing their engines.

## Apply the hard gates

0. Resolve the workspace to `<current-directory>/presentation-director`. If the current directory is already an initialized workspace with that name, use it directly. Keep every project-owned persistent source copy, raw reference, generated asset, renderer project, temporary record, and final output inside it. Never use a user-home or system-global cache.
1. Read [references/delivery-contract.md](references/delivery-contract.md). Treat the final PPTX—not an outline, code project, PDF, preview, or image folder—as the default primary artifact.
2. Run capability preflight before creating `DESIGN.md` or generating assets. Read [references/dependencies.json](references/dependencies.json), select the requested profile, and write `capabilityProfile` to `presentation.json`.
3. If a required capability is missing, show the user its platform-specific installation guidance and fallback impact. Stop until the capability is installed or the user explicitly approves a fallback. Never silently downgrade or claim Full Studio.
4. Define the communication job before choosing layouts:
   `By the end, [audience] should [outcome] because [central takeaway].`
5. Select exactly one style-decision mode:
   - `specified` when the user supplies a template, brand system, named style, or visual reference.
   - `auto` when the user delegates the choice or requests no intermediate confirmation.
   - `recommend` when the user requests options or gives no style direction; this is the default for an unspecified style.
6. Resolve exactly one visual route:
   - Use a supplied PPTX/template as the source of truth.
   - Use an explicit custom direction or one selected primary Atlas reference.
   - For `recommend`, show a visual comparison board and wait for selection.
   - For `auto`, record the fit rationale and continue without a selection checkpoint.
7. Resolve reference depth after selection. Load relevant raw sources for a preset that has them; research official and first-party web references for a custom direction.
8. Read [references/design-taste.md](references/design-taste.md), derive a content-specific design thesis, motif, tensions, signature moves, and anti-defaults, then lock `tasteProfile`. A direction that fails the content-swap test is not ready.
9. Create the final `DESIGN.md` only after style, reference, and taste resolution. Style-selection boards are temporary decision artifacts, not production assets.
10. Create `presentation.json` before rendering slides and preserve its `deliveryContract`, `styleDecision`, and `tasteProfile` records.
11. Lock the deck narrative, then give every slide a `narrativeBeat` and `visualPlan`, and every asset a structured production brief. Run `prepare-creative.mjs --strict` before generating production assets. Resolve every error and warning; use its generated narrative map, storyboard, asset plan, and provider briefs as the production source.
12. Render representative static samples, including the opening and a specialist-rendered page when planned. Lock them with `lock-design.mjs` before parallel production. Manifest 1.5 locks both the creative digest and visual samples.
13. Run `prepare-build.mjs`, produce only dirty tasks, and enforce the generated task graph's dependencies and exclusive write paths. Each worker owns its slide build capsule and writes a matching receipt last. Only the Director may update shared truth or final assembly.
14. Build the most-visible static frame before adding animation. For high-impact generative assets, produce the declared variants and record the selected candidate with `record-asset-selection.mjs`.
15. Record completed slide builds and QA with the production scripts, recheck output hashes, then render, inspect, assemble, and open-check the final PPTX. Do not stop at source files or intermediate renders.

Do not expose plans, renderer notes, prompts, timing scaffolds, or QA comments as audience-facing slide copy.

## Initialize the workspace

Run:

```text
node <skill-dir>/scripts/init-workspace.mjs --title "<deck title>" --language zh-CN --platform <platform> --profile full-studio
```

The default target is `<current-directory>/presentation-director`. Treat that directory as `<project-dir>` for every later command.

For an existing workspace, run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile <requested-mode> --write
```

Keep reusable project truth in `DESIGN.md` and `presentation.json`. Copy user-supplied inputs needed for reproducibility into `sources/input/`. Keep downloaded originals and high-resolution reference work under `reference-library/`, disposable build notes under `tmp/`, generated assets in their declared workspace folders, and final deliverables under `output/`. Do not create persistent project files outside the workspace.

For a requested Three.js scene, add `--require three_d`. Rerun `check-capabilities.mjs --write` after installing, enabling, or changing any provider. Use `--approve-fallbacks` only after the user explicitly accepts the reported loss of capability.

## Load only the required references

- Read [references/workflow.md](references/workflow.md) for every deck build or major revision.
- Read [references/delivery-contract.md](references/delivery-contract.md) before planning outputs, choosing flattening, or declaring completion.
- Read [references/design-taste.md](references/design-taste.md) for every new deck, visual redesign, style recommendation, or quality review.
- Read [references/dependencies.json](references/dependencies.json) before capability preflight or installation guidance.
- Read exactly one host adapter before invoking providers:
  - [references/platforms/codex.md](references/platforms/codex.md)
  - [references/platforms/claude-code.md](references/platforms/claude-code.md)
  - [references/platforms/copilot.md](references/platforms/copilot.md)
  - [references/platforms/gemini.md](references/platforms/gemini.md)
  - [references/platforms/cursor.md](references/platforms/cursor.md)
- Read [references/routing.md](references/routing.md) before assigning renderers or output formats.
- Read [references/manifest.md](references/manifest.md) before authoring `presentation.json`.
- Read [references/creative-planning.md](references/creative-planning.md) before locking the narrative, planning slide rhythm, decomposing assets, or handing work to providers.
- Read [references/review.md](references/review.md) before final rendering and delivery.
- Read [references/prompt-contracts.md](references/prompt-contracts.md) before handing work to imagegen, HyperFrames, Remotion, UI capture, or a diagram renderer.
- Read [references/production-optimization.md](references/production-optimization.md) before representative samples, parallel production, incremental rebuilds, or risk-based QA.
- Read [references/style-discovery.md](references/style-discovery.md) whenever the user has not supplied a usable template, or when the style is delegated, recommended, named, or custom researched.
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

- Invoke production providers from the generated brief at `tmp/provider-briefs/<slide-id>/<asset-id>.json`; do not replace it with an improvised prompt. The brief carries the narrative relationship, visual plan, continuity family, acceptance criteria, and shared Design DNA.
- Use the presentation provider recorded by capability preflight for every local PPTX read/create/edit workflow. Follow its template route, source-note policy, rendering checks, and overflow checks.
- Use the detected image-generation provider for original product imagery, conceptual hero art, backgrounds, and illustrative assets. Do not use it for exact architecture, charts, tables, or text-heavy UI.
- Use the detected short-motion provider for deterministic animated architecture builds, title cards, slide loops, and 3-15 second sequences. Give the composition the same `DESIGN.md`.
- Use the detected video provider for 15-90 second multi-scene product demos, narration, captions, or parameterized video. Follow that provider's video-layout guidance before coding.
- When a `remotion_video` slide declares `threeD`, use project-local Three.js, React Three Fiber, and `@remotion/three` as a component inside Remotion. Drive every 3D animation from the Remotion frame timeline and provide a poster fallback.
- Use native PowerPoint shapes for simple editable diagrams and Graphviz or another deterministic diagram route for complex topology. Keep labels outside image generation.

Use `selectionMode: deterministic` for diagrams, charts, and exact UI states. Use `single` for low-risk supporting assets. Use `variants` with two to four candidates for hero imagery, major concept visuals, material studies, or another asset whose quality materially changes the slide. Record the choice and its visual rationale before final build validation.

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

Default to native-first PowerPoint. Keep text, data, tables, charts, and simple diagrams editable. Every `image_slide` requires a manifest `rasterExceptionReason`; use it only when flattening creates material visual value that native structure cannot preserve.

## Control style and motion

- Lock one `primaryReference` for the deck.
- Treat Atlas references as evidence, not a substitute for judgment. Derive the design thesis, content motif, tensions, and signature moves from the current material.
- Reject a direction that can be relabeled for an unrelated company without meaningful visual redesign. Record `contentSwapTest: pass` before production.
- Use no more than two signature moves and require a content, audience, narrative, or usability reason for every visible non-standard choice.
- Treat generic AI glow, automatic blue-purple gradients, glass-card walls, bento feature grids, fake UI, decorative 3D, random particles, and motion without state change as rejected defaults unless the content literally requires them.
- Use `specified`, `auto`, or `recommend` as the style-decision mode. Never force an approval checkpoint after the user delegates automatic selection.
- In `recommend` mode, compare 2-3 task-appropriate visual directions and do not proceed until the user selects one.
- After a preset Atlas is selected, resolve its `source_ids` and load the smallest useful raw set when official PDF links exist.
- After a custom direction is selected, require `reference_research`, search official and first-party web sources, and record direct URLs and rights before locking the design contract.
- Allow a secondary reference only for named slide roles; never mix its palette into the global identity.
- Treat all company materials in the Atlas and role packs as internal design references, not distributable templates.
- Keep raw reference files outside the plugin but inside `<project-dir>/reference-library/raw`. Preserve canonical links in `sources.json` and load one source at a time with `--workspace <project-dir>`.
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

For Manifest 1.5, validation also requires a current compiled creative plan, immutable provider briefs, a design lock tied to the creative digest, complete incremental build state, passing slide QA, and a passing final full-deck review. Then execute the renderer-specific checks in [references/review.md](references/review.md). Resolve every capability mismatch, stale creative plan, broken narrative bridge, repetitive storyboard, unrecorded variant choice, stale cache, content-swap failure, generic visual default, unintended overlap, clipping, broken connector, missing asset, unresolved placeholder, contrast failure, and motion-budget violation. Deliver only the requested final outputs plus a concise summary of what remains flattened or replaceable.
