# Director Workflow

## Contents

0. Capability preflight
1. Intake
2. Communication and narrative
3. Style decision
4. Reference resolution
5. Design contract
6. Slide plan and manifest
7. Asset production
8. Rendering
9. Review and delivery

## 0. Run capability preflight

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

## 1. Intake

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

## 2. Define communication and narrative

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

## 3. Select the style-decision mode

Choose the first matching mode:

1. **Specified**: the user supplies a template, brand system, named style, or usable visual reference. Preserve a supplied template's master, layouts, placeholders, theme, and inherited elements.
2. **Auto**: the user delegates the decision, asks for one-shot delivery, or requests no intermediate confirmation. Score the fit, select one direction, record the rationale, and continue.
3. **Recommend**: the user requests alternatives, or gives no style direction and has not delegated the decision. Generate 2-3 task-appropriate visual directions, show a comparison board, and wait for selection.

Read `style-discovery.md` for candidate and decision-record requirements. Do not force a checkpoint in auto mode and do not silently auto-select in recommend mode.

Never combine a supplied template with an unrelated default slide library. For Atlas work, select one primary reference. A secondary reference must include a narrow scope such as `architecture slides only` or `product reveal slides only`.

## 4. Resolve reference depth

Complete this stage after a direction is selected and before finalizing `DESIGN.md`:

- **User template**: inspect the supplied file and set `referenceDepth: user-source`.
- **Preset Atlas**: resolve the Atlas `source_ids`. When official PDF sources exist, load the smallest relevant set with the on-demand collector, record `rawStatus: loaded`, and inspect only pages relevant to planned slide roles. When no raw source exists, use bundled previews and canonical web links.
- **Custom direction**: rerun preflight with `--require reference_research --write`, search official and first-party web material, collect 3-6 direct references, and set `researchStatus: complete` only when the evidence is sufficient.

Record the decision, candidate board when used, rationale, reference depth, raw status, research status, and sources in `presentation.json`. Do not add task-specific custom research to the global Atlas automatically.

If a selected raw source or required research capability is unavailable, report the failure. Do not silently substitute a different style or continue with weaker evidence.

## 5. Write `DESIGN.md`

Lock:

- identity name and primary/secondary references;
- style-decision mode, selection rationale, and reference evidence;
- canvas and safe margins;
- color roles and usage ratios;
- typography, weights, sizes, and fallback fonts;
- grid, spacing, density, and image treatment;
- diagram semantics;
- motion tempo, patterns, and budget;
- anti-patterns;
- rights and attribution boundaries.

For named-company inspiration, distinguish observations from safe adaptations. Do not copy official assets or present the result as an official company template. Temporary style boards are decision artifacts, not production assets.

## 6. Write `presentation.json`

Create the slide sequence before asset generation. Preserve `capabilityProfile` and `styleDecision`. For every slide, define:

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

Read `manifest.md` for the complete contract. Set `status` to `planning` during design and `final` only after all paths and sources resolve and every selected renderer is supported by an available capability or an explicitly approved fallback.

## 7. Produce assets

Write an asset brief before invoking a specialist. Reuse the same design tokens and state exactly where the asset sits on the slide.

Recommended order:

1. deterministic diagrams and charts;
2. product UI and screenshots;
3. generated hero/concept imagery;
4. static poster frames;
5. motion versions of approved static frames.

Do not generate production assets before the selected visual direction is resolved. Do not generate motion before the static hero frame passes composition review.

## 8. Render

- Build PPTX with the presentation provider recorded in `capabilityProfile` and its required local engine.
- Keep titles, claims, labels, charts, and simple diagrams native whenever practical.
- Insert generated media in replaceable frames.
- Add a poster image for every video slide.
- Put a `[Sources]` block in speaker notes for every external claim or asset.
- For motion, keep HyperFrames or Remotion project sources next to the rendered media so the user can regenerate them.

## 9. Review and deliver

Run `validate-workspace.mjs`, then follow `review.md`.

Do not deliver until:

- `capabilityProfile.checkedAt` reflects the current provider state;
- `styleDecision` is selected and its required raw or web research is complete;
- every selected renderer is supported by `capabilityProfile.available`;
- any fallback is explicitly approved, recorded, and reflected in final routing;
- all slides render and have been inspected individually;
- there are no unintended overlaps or clipped titles;
- all local asset paths exist;
- externally sourced claims and assets are traceable;
- motion is deterministic and within budget;
- flattened and replaceable-media slides are disclosed accurately.

Deliver only the requested final artifacts. Keep scratch plans and QA files under `tmp/`.
