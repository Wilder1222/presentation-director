# Production Optimization

Manifest 1.7 adds three lightweight director-owned tasks after parallel slide production: native-capability reporting, delivery rehearsal, and dual quality scoring. They add no renderer dependency and must not be delegated to slide workers because they aggregate shared build and QA evidence.

## Contents

1. Purpose
2. Creative compilation
3. Representative design lock
4. Incremental build preparation
5. Parallel task ownership
6. Build recording
7. Risk-based QA
8. Final acceptance

## Purpose

Use Manifest 1.7 production records to improve story, delivery, and material quality while reducing full-deck rework. Compile evidence, content preferences, delivery timing, narrative, page designs, storyboard, rubric, assets, and provider briefs; lock representative visual evidence before parallel work; hash every slide's design and inputs; rebuild only changed work; isolate worker output paths; and retain observed artifact and delivery review.

## Creative compilation

After narrative, style, taste, `DESIGN.md`, and the slide plan are coherent, run:

```text
node <skill-dir>/scripts/prepare-creative.mjs <project-dir> --strict
```

This creates content-addressed evidence, page-design, rubric, creative-plan, and immutable provider-brief records. Resolve every strict issue before representative samples. Changes to acceptance criteria, sources, narrative, slide titles, claims or content, renderer routing, page design, visual rhythm, asset briefs, motion, or 3D make the plan stale and invalidate any existing design lock.

## Representative design lock

After style selection, taste lock, `DESIGN.md`, and the slide plan are complete, render representative static samples. Use four samples when the deck has at least four slides; shorter decks use every slide. Include:

- the opening slide;
- at least three distinct roles when available;
- at least one specialist renderer when the planned deck uses one;
- a normal content slide and a planned visual peak when available.

Store samples under `tmp/design-lock/`, then run:

```text
node <skill-dir>/scripts/lock-design.mjs <project-dir> \
  --approved-by <user|team|auto-review> \
  --sample s01=tmp/design-lock/s01.png \
  --sample s03=tmp/design-lock/s03.png \
  --sample s05=tmp/design-lock/s05.png \
  --sample s08=tmp/design-lock/s08.png
```

Use `auto-review` only when the user delegated style choice and intermediate approval. The lock records the current creative digest. Any later change to the creative plan, `DESIGN.md`, selected references, taste profile, deck reference identity, or motion budget invalidates the digest and requires a new design lock.

## Incremental build preparation

Run after design lock and whenever content, sources, selected assets, renderer routing, or capabilities change:

```text
node <skill-dir>/scripts/prepare-build.mjs <project-dir> --max-workers 4
```

The script writes:

- `tmp/build-plan.json`: dirty/cached slide decisions and content hashes;
- `tmp/task-graph.json`: dependencies, roles, and exclusive write paths;
- `tmp/qa-plan.json`: risk scores and review scope.

Every slide also owns an isolated build capsule at `tmp/slide-builds/<slide-id>/` unless the
manifest declares another workspace-local `buildCapsule`. The capsule is the renderer-neutral
handoff to final assembly: keep slide source, assembly instructions, previews, and a final
`receipt.json` there. This gives native PowerPoint workers a real output boundary even when the
slide has no generated image, SVG, or video.

Do not regenerate a cached slide whose input hash and recorded output hashes still match. Do not reuse a cached slide after its design digest, manifest digest, source file, renderer input, or output changes.

## Parallel task ownership

Start workers only after the design lock is valid. Respect `maxParallelWorkers`; prefer two to four workers for a normal deck. Assign one worker to one slide-production task at a time.

The Director exclusively owns:

- `DESIGN.md` and `presentation.json`;
- build cache state and shared QA results;
- final PPTX assembly and `output/`;
- cross-slide decisions and final review.

Workers may write only paths declared by their task. Reject identical, nested, or otherwise overlapping output ownership before work starts. A worker returns artifacts and findings to the Director; it does not rewrite the design contract or mark its own build complete.

Write `receipt.json` last, using the task's current input hash:

```json
{
  "schemaVersion": "1.1",
  "slideId": "s03",
  "renderer": "svg",
  "inputHash": "<task cacheKey>",
  "status": "complete",
  "sourceFiles": ["diagram.mmd", "diagram.svg"],
  "preview": "preview.png",
  "nativeCapabilities": {
    "nativeText": true,
    "nativeShapes": false,
    "nativeCharts": false,
    "replaceableSvg": true,
    "replaceableImages": false,
    "embeddedVideo": false,
    "flattened": false,
    "losses": ["The complex topology remains a replaceable SVG rather than native connectors."]
  }
}
```

Manifest 1.7 requires all seven booleans and a concrete `losses` array in every receipt. These fields describe the slide before final assembly; the final native-capability audit described in `content-delivery.md` rechecks the assembled PPTX and reports any assembly-stage change.

## Build recording

After checking that a worker's declared outputs exist, let the Director record successful work:

```text
node <skill-dir>/scripts/record-build.mjs <project-dir> --slide s03,s05
node <skill-dir>/scripts/record-build.mjs <project-dir> --all
```

Recording is transactional for the selected slides. Missing outputs, invalid receipts, stale task hashes, or mismatched renderers fail the command. A content-preference, deck/slide delivery, visible copy, source, renderer, asset, motion, manifest, or design change makes the creative/build evidence stale and requires creative recompilation, representative re-lock, and `prepare-build.mjs` again.

For a generative asset with `selectionMode: variants`, record the inspected choice before final build preparation:

```text
node <skill-dir>/scripts/record-asset-selection.mjs <project-dir> \
  --slide s01 --asset hero-product \
  --candidate a=assets/generated/images/candidates/hero-a.webp \
  --candidate b=assets/generated/images/candidates/hero-b.webp \
  --selected b --reviewer director \
  --rationale "B preserves the title safe zone and explains the product mechanism."
```

The selection record preserves candidate, canonical output, and provider-brief hashes. Changing a selected file makes final validation fail instead of silently substituting a different asset.

## Risk-based QA and repair

During iteration, inspect every dirty slide and every medium/high-risk cached slide. Review video, 3D, flattened, externally sourced, multi-asset, long-title, and visual-peak slides more deeply. Evaluate the exact render against all matching checks in `tmp/qa/deck-rubric.json`, then record an observation input:

```text
node <skill-dir>/scripts/record-render-observation.mjs <project-dir> \
  --input tmp/qa/inputs/s05-r1.json
```

Failed observations before the round limit must include a minimal repair plan. Repair only the failing copy, layout, typography, asset, connector, diagram, motion, or renderer route; do not restart the whole slide. After the corrected render passes, bind the current observation to QA:

```text
node <skill-dir>/scripts/record-qa.mjs <project-dir> --slide s05 \
  --status passed --reviewer reviewer --note "Poster, labels, crop, and editability verified" \
  --observation tmp/qa/observations/s05/r2.json
```

Risk-based iteration never replaces the final full review. Before delivery, review every slide at full size, inspect the montage for rhythm, run provider checks, and open the final PPTX in the target application. Then record:

```text
node <skill-dir>/scripts/record-render-observation.mjs <project-dir> \
  --input tmp/qa/inputs/deck-final-r1.json
node <skill-dir>/scripts/record-qa.mjs <project-dir> --final \
  --status passed --reviewer director --note "All slides and final PPTX open-check passed" \
  --observation tmp/qa/observations/deck-final/r1.json
```

Final pass fails when any slide lacks a passing QA record, its current build hash is incomplete, or a recorded output changed after build recording.

## Final acceptance

Manifest 1.7 final validation requires:

- a current evidence bundle, alignment map, page-design index, binary rubric, strict creative plan, and unchanged provider briefs;
- a recorded final selection for every `variants` asset, including the declared candidate count;
- a current representative design lock;
- a build plan matching the current manifest and design digest;
- a complete cache-state record for every slide;
- a QA plan that covers every slide;
- passing current render observations bound to every slide-level record and the final full-deck review.
- a passing current delivery rehearsal, truthful native-capability report, and 100-point artifact and delivery scorecard.

Use the optimization records as evidence of work completed, not as a substitute for visual judgment.
