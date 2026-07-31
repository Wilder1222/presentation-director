# Director Workflow

## Contents

0. Workspace boundary
1. Capability preflight
2. Intake
3. Communication and narrative
4. Style decision
5. Reference resolution
6. Design taste and contract
7. Slide plan and manifest
8. Creative compilation
9. Production lock and incremental plan
10. Asset production
11. Rendering
12. Review and delivery

## 0. Establish the workspace boundary

Create or reuse `<current-directory>/presentation-director`. Store every project-owned persistent artifact beneath it:

- copied inputs in `sources/`;
- raw and derived references in `reference-library/`;
- generated assets, diagrams, UI, and renderer source projects in their declared workspace folders;
- process records in `tmp/`;
- final deliverables in `output/`.

Do not intentionally create, retain, or reference project or process files in user-home, system-drive, shared, browser-download, or global-cache locations. Pass the workspace path explicitly to collectors and specialist providers, configure their project and output directories beneath it, and copy any returned artifact into the workspace immediately.

## 1. Run capability preflight

Before design or asset generation, choose the host platform and requested capability profile, then run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile full-studio --write
```

Use `full-studio` for the complete general workflow. Add `--require three_d` when the accepted plan needs spatial 3D. Add `--require reference_research` after a custom style is selected. The checker writes `capabilityProfile` to `presentation.json` and reports the providers it actually found.

If a required capability is missing:

1. show the checker-provided installation guidance and explain which outputs are blocked;
2. stop before creating assets or promising the blocked output;
3. rerun the checker after installation; or
4. only after explicit user approval, rerun with `--approve-fallbacks --write`, record the decision in `tmp/fallback-reasons.txt`, and replace unsupported routes in the manifest.

Never infer that a provider exists from documentation alone. Never describe an incomplete profile as Full Studio.

## 2. Intake

Collect or infer:

- audience and decision context;
- presentation job and desired outcome;
- central takeaway;
- delivery format, language, aspect ratio, and deadline;
- source material and required claims;
- user-supplied PPTX/template, brand assets, fonts, or visual references;
- requested style-decision behavior: specified, automatic, or candidate recommendation;
- editability requirements;
- whether motion must play inside PowerPoint or may be delivered as HTML/MP4.

Ask only when a missing answer materially changes the output. Otherwise record a reasonable assumption in `tmp/assumptions.txt` and continue.

Initialize the Manifest 1.5 `deliveryContract` exactly as defined in `delivery-contract.md`. Treat PPTX as the primary artifact throughout the workflow. Supporting previews, HTML, PDF, MP4, source projects, and manifests do not replace the final deck.

## 3. Define communication and narrative

Write the communication job before evaluating visual styles:

```text
By the end, [audience] should [understand/believe/choose/approve/do] [outcome]
because [central takeaway].
```

Choose the shortest narrative arc that supports it:

- context -> stakes -> evidence -> implications -> action;
- question -> analysis -> answer;
- problem -> causes/options -> recommendation;
- current state -> change -> future state;
- chronology, process, or learning progression;
- claim -> evidence -> consequence.

An agenda is not a narrative. Every slide must answer a question created by the previous slide or create the question resolved by the next.

## 4. Select the style-decision mode

Choose the first matching mode:

1. **Specified**: the user supplies a template, brand system, named style, or usable visual reference. Preserve a supplied template's master, layouts, placeholders, theme, and inherited elements.
2. **Auto**: the user delegates the decision, asks for one-shot delivery, or requests no intermediate confirmation. Score the fit, select one direction, record the rationale, and continue.
3. **Recommend**: the user requests alternatives, or gives no style direction and has not delegated the decision. Generate 2-3 task-appropriate visual directions, show a comparison board, and wait for selection.

Read `style-discovery.md` for candidate and decision-record requirements. Do not force a checkpoint in auto mode and do not silently auto-select in recommend mode.

Never combine a supplied template with an unrelated default slide library. For Atlas work, select one primary reference. A secondary reference must include a narrow scope such as `architecture slides only` or `product reveal slides only`.

## 5. Resolve reference depth

Complete this stage after a direction is selected and before finalizing `DESIGN.md`:

- **User template**: inspect the supplied file and set `referenceDepth: user-source`.
- **Preset Atlas**: resolve the Atlas `source_ids`. When official PDF sources exist, load the smallest relevant set with the on-demand collector using `--workspace <project-dir>`, record `rawStatus: loaded`, and inspect only pages relevant to planned slide roles. When no raw source exists, use bundled previews and canonical web links.
- **Custom direction**: rerun preflight with `--require reference_research --write`, search official and first-party web material, collect 3-6 direct references, and set `researchStatus: complete` only when the evidence is sufficient.

Record the decision, candidate board when used, rationale, reference depth, raw status, research status, and sources in `presentation.json`. Do not add task-specific custom research to the global Atlas automatically.

If a selected raw source or required research capability is unavailable, report the failure. Do not silently substitute a different style or continue with weaker evidence.

## 6. Lock design taste and write `DESIGN.md`

Read `design-taste.md`. Inventory the actual material, write a one-sentence design thesis, select one content-derived motif, define one or two productive tensions, and allow no more than two signature moves. Record task-specific anti-defaults and run the content-swap test.

Do not use a named-company reference as a complete identity. The Atlas may inform hierarchy, rhythm, composition, diagram logic, or motion, but the current content must determine the motif and authorship choices. If the direction could be relabeled for an unrelated company without meaningful redesign, revise it before asset production.

Lock:

- identity name and primary/secondary references;
- design thesis, content motif, tensions, signature moves, and authorship rationale;
- style-decision mode, selection rationale, and reference evidence;
- canvas and safe margins;
- color roles and usage ratios;
- typography, weights, sizes, and fallback fonts;
- grid, spacing, density, and image treatment;
- diagram semantics;
- motion tempo, patterns, and budget;
- anti-patterns;
- task-specific anti-AI defaults and the content-swap result;
- rights and attribution boundaries.

For named-company inspiration, distinguish observations from safe adaptations. Do not copy official assets or present the result as an official company template. Temporary style boards are decision artifacts, not production assets.

## 7. Write `presentation.json`

Create the slide sequence before asset generation. Preserve `deliveryContract`, `capabilityProfile`, `styleDecision`, and the locked `tasteProfile`. For every slide, define:

- one role;
- one audience-facing claim;
- a takeaway title;
- one layout pattern;
- one renderer;
- editability level;
- required content and evidence;
- assets and their statuses;
- sources;
- motion only when it earns its cost.
- a `narrativeBeat` that states the live question, evidence type, consequence, and bridge;
- a `visualPlan` that states silhouette, density, focal mode, visual peak, and continuity cue.

For every asset, define a structured brief with its production method, role, placement, continuity family, reuse policy, selection mode, dependencies, and concrete acceptance checks. Use variant selection only where candidate quality materially changes the communication result.

Plan two to four visual peaks in a typical 10-15 slide deck and let quieter slides create contrast around them. Use `native_ppt` for editable text, data, tables, charts, and simple diagrams. Use `image_slide` only as an exception and record `rasterExceptionReason` on that slide.

Read `manifest.md` for the complete contract. Set `status` to `planning` during design and `final` only after all paths and sources resolve and every selected renderer is supported by an available capability or an explicitly approved fallback.

## 8. Compile the creative plan

Read `creative-planning.md`, lock the top-level narrative, and run:

```text
node <skill-dir>/scripts/prepare-creative.mjs <project-dir> --strict
```

Inspect the generated narrative map as a causal argument, the storyboard as a rhythm strip, and the asset plan as a dependency graph with safe execution waves. Resolve repeated questions or claims, weak slide bridges, three repeated silhouettes, density fatigue, missing visual peaks, circular asset dependencies, vague acceptance criteria, and renderer/focal-mode conflicts.

Use only the generated provider briefs for production. A later narrative, slide title, claim, content, renderer, visual-plan, asset-brief, motion, or 3D change invalidates the creative digest and requires compilation again.

## 9. Lock representative samples and prepare production

Read `production-optimization.md`. Render representative static samples after the Manifest, design direction, and taste profile are coherent. Use four samples when the deck has at least four slides, include the opening slide, cover distinct slide roles, and include a specialist-rendered slide when one is planned.

Store the approved samples under `tmp/design-lock/` and run `lock-design.mjs`. Do not start parallel workers before the creative digest and resulting design digest are locked. When style choice was delegated, use an internal `auto-review`; otherwise record user or team approval accurately.

Run `prepare-build.mjs` to classify slides as dirty or cached and to generate `tmp/task-graph.json` plus `tmp/qa-plan.json`. Give each worker exclusive declared output paths. Keep `DESIGN.md`, `presentation.json`, cache state, shared QA records, and final assembly under Director ownership. Parallelize only dirty production tasks whose dependencies are satisfied.

## 10. Produce assets

Invoke each specialist with the compiler-generated brief under `tmp/provider-briefs/`. Reuse the same design tokens and preserve its exact narrative role, placement, continuity key, prohibited defaults, and acceptance checks.

Recommended order:

1. deterministic diagrams and charts;
2. product UI and screenshots;
3. generated hero/concept imagery;
4. static poster frames;
5. motion versions of approved static frames.

Do not generate production assets before the selected visual direction and taste profile are resolved. Do not generate motion before the static hero frame passes composition review. Reject provider defaults that conflict with the design thesis or anti-default list.

For an asset using `selectionMode: variants`, render the declared candidate count, inspect candidates at the intended crop and slide size, and record the winner with `record-asset-selection.mjs`. Judge the candidate by communication, composition, continuity, factual safety, and replaceability rather than surface polish alone.

After each worker returns, inspect its declared files and use `record-build.mjs` to record successful slide work. Never let a worker mark its own cache entry complete.

## 11. Render

- Build PPTX with the presentation provider recorded in `capabilityProfile` and its required local engine.
- Keep titles, claims, labels, charts, and simple diagrams native whenever practical.
- Insert generated media in replaceable frames.
- Add a poster image for every video slide.
- Put a `[Sources]` block in speaker notes for every external claim or asset.
- For motion, keep HyperFrames or Remotion project sources next to the rendered media so the user can regenerate them.
- Assemble a complete PPTX in `output/`; renderer previews and source projects are intermediate artifacts.

## 12. Review and deliver

Record each slide review with `record-qa.mjs`. Run the mandatory full-size review of every slide and open-check the final PPTX, then record final QA as passed. Run `validate-workspace.mjs`, then follow `review.md`.

Do not deliver until:

- `capabilityProfile.checkedAt` reflects the current provider state;
- `styleDecision` is selected and its required raw or web research is complete;
- `tasteProfile` is locked, its content-swap test passes, and its signature moves are visible but restrained;
- every selected renderer is supported by `capabilityProfile.available`;
- any fallback is explicitly approved, recorded, and reflected in final routing;
- all slides render and have been inspected individually;
- the final PPTX opens in the target presentation application and can be presented without repair;
- the slide-title sequence reads as a coherent argument and the closing resolves the opening communication job;
- the planned visual peaks are visible in the rendered deck without making every slide compete for attention;
- there are no unintended overlaps or clipped titles;
- all local asset paths exist;
- externally sourced claims and assets are traceable;
- motion is deterministic and within budget;
- the compiled creative plan matches the current narrative, slide sequence, visual plans, and asset briefs;
- provider briefs and final variant-selection records still match their recorded hashes;
- the representative design lock still matches `DESIGN.md` and the selected design contract;
- the build plan matches the current manifest and every slide has a complete cache-state record;
- risk-based iteration records exist and final QA covers every slide;
- native-first editability is preserved for text, data, tables, charts, and simple diagrams;
- every flattened slide has a recorded, defensible `rasterExceptionReason` and a replaceable source asset;
- flattened and replaceable-media slides are disclosed accurately.

Deliver only the requested final artifacts. Keep scratch plans and QA files under `tmp/`.
