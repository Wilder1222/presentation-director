# Director Workflow

## Contents

0. Capability preflight
1. Intake
2. Visual route
3. Communication and narrative
4. Design contract
5. Slide plan and manifest
6. Asset production
7. Rendering
8. Review and delivery

## 0. Run capability preflight

Before design or asset generation, choose the host platform and requested capability profile, then run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile full-studio --write
```

Use `full-studio` for the complete general workflow. Add `--require three_d` when the accepted plan needs spatial 3D. The checker writes `capabilityProfile` to `presentation.json` and reports the providers it actually found.

If a required capability is missing:

1. show the checker-provided installation guidance and explain which outputs are blocked;
2. stop before creating assets or promising the blocked output;
3. rerun the checker after installation; or
4. only after explicit user approval, rerun with `--approve-fallbacks --write`, record the decision in `tmp/fallback-reasons.txt`, and replace unsupported renderers in the manifest.

Never infer that a provider exists from documentation alone. Never describe an incomplete profile as Full Studio.

## 1. Intake

Collect or infer:

- audience and decision context;
- presentation job and desired outcome;
- central takeaway;
- delivery format, language, aspect ratio, and deadline;
- source material and required claims;
- user-supplied PPTX/template, brand assets, fonts, or visual references;
- editability requirements;
- whether motion must play inside PowerPoint or may be delivered as HTML/MP4.

Ask only when a missing answer materially changes the output. Otherwise record a reasonable assumption in `tmp/assumptions.txt` and continue.

## 2. Select the visual route

Choose the first matching route:

1. **User template**: preserve its master, layouts, placeholders, theme, and inherited elements. Use Atlas material only for composition ideas inside compatible content frames.
2. **Explicit direction**: translate the user's mood, brand, or named references into a custom design contract.
3. **No direction**: use the default library of the detected presentation provider.

Never combine a supplied template with an unrelated default slide library.

For Atlas work, select one primary reference. A secondary reference must include a narrow scope such as `architecture slides only` or `product reveal slides only`.

## 3. Define communication and narrative

Write the communication job:

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

## 4. Write `DESIGN.md`

Lock:

- identity name and primary/secondary references;
- canvas and safe margins;
- color roles and usage ratios;
- typography, weights, sizes, and fallback fonts;
- grid, spacing, density, and image treatment;
- diagram semantics;
- motion tempo, patterns, and budget;
- anti-patterns;
- rights and attribution boundaries.

For named-company inspiration, distinguish observations from safe adaptations. Do not copy official assets or present the result as an official company template.

## 5. Write `presentation.json`

Create the slide sequence before asset generation. For every slide, define:

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

Read `manifest.md` for the complete contract. Preserve the preflight-generated `capabilityProfile`. Set `status` to `planning` during design and `final` only after all paths and sources resolve and every selected renderer is supported by an available capability or an explicitly approved fallback.

## 6. Produce assets

Write an asset brief before invoking a specialist. Reuse the same design tokens and state exactly where the asset sits on the slide.

Recommended order:

1. deterministic diagrams and charts;
2. product UI and screenshots;
3. generated hero/concept imagery;
4. static poster frames;
5. motion versions of approved static frames.

Do not generate motion before the static hero frame passes composition review.

## 7. Render

- Build PPTX with the presentation provider recorded in `capabilityProfile` and its required local engine.
- Keep titles, claims, labels, charts, and simple diagrams native whenever practical.
- Insert generated media in replaceable frames.
- Add a poster image for every video slide.
- Put a `[Sources]` block in speaker notes for every external claim or asset.
- For motion, keep HyperFrames or Remotion project sources next to the rendered media so the user can regenerate them.

## 8. Review and deliver

Run `validate-workspace.mjs`, then follow `review.md`.

Do not deliver until:

- `capabilityProfile.checkedAt` reflects the current provider state;
- every selected renderer is supported by `capabilityProfile.available`;
- any fallback is explicitly approved, recorded, and reflected in the final renderer assignments;
- all slides render;
- every slide has been inspected individually;
- there are no unintended overlaps or clipped titles;
- all local asset paths exist;
- externally sourced claims and assets are traceable;
- motion is deterministic and within budget;
- flattened and replaceable-media slides are disclosed accurately.

Deliver only the requested final artifacts. Keep scratch plans and QA files under `tmp/`.
