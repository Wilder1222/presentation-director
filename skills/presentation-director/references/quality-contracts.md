# Quality Contracts

Manifest 1.7 assigns every compiled rubric check a `dimension`: `artifact` checks are evaluated against exact slide/deck renders, while `delivery` checks are evaluated during a timed rehearsal. Never infer delivery success from a screenshot or presenter timing from a source file.

## Contents

1. Purpose
2. Evidence bundle
3. Page Design IR
4. Binary rubric
5. Render, observe, repair
6. Passing observation input
7. Failed observation and minimal repair input

## Purpose

Manifest 1.6 turns research, page intent, and review into inspectable contracts. Use these records to keep factual grounding, visual authorship, and repair decisions stable across renderers and parallel workers.

## Evidence bundle

Give every slide one stable `claimId`. External claims require one or more `sources`; each source needs a label and either a workspace-relative `path` or direct `url`. Local source hashes are verified on every validation.

```json
{
  "claimId": "claim-market-shift",
  "claimKind": "external",
  "claim": "The buying criterion has shifted from capability to control.",
  "sources": [
    {
      "id": "src-official-report",
      "label": "Official market report",
      "path": "sources/research/official-report.pdf",
      "usage": "Supports the buying-criterion claim"
    }
  ]
}
```

`prepare-creative.mjs` assigns missing stable IDs and writes:

- `tmp/evidence/evidence-bundle.json`: canonical claims, sources, hashes, and audience context;
- `tmp/evidence/content-alignment.json`: claim-to-source, asset, and motion-segment mapping.

Do not edit these compiled files. Change `presentation.json` or a declared source and compile again.

## Page Design IR

Every slide needs a renderer-neutral `pageDesign` before any provider creates it:

```json
{
  "designIntent": "Turn provenance into the dominant visual mechanism.",
  "backgroundLayer": "Warm white field with no decorative texture.",
  "layoutLayer": "Asymmetric 12-column evidence rail.",
  "contentLayer": "Native takeaway plus one proof region.",
  "focalPoint": "evidence",
  "negativeSpaceTarget": 0.38,
  "regions": [
    { "id": "takeaway", "role": "headline", "anchor": "top-left", "span": "7 columns", "priority": "primary" },
    { "id": "evidence", "role": "proof", "anchor": "center-right", "span": "5 columns", "priority": "secondary" }
  ],
  "readingPath": ["takeaway", "evidence"]
}
```

Use two to eight semantic regions, a deliberate reading path, and a negative-space target from `0.1` to `0.8`. The compiler writes one immutable design contract per slide under `tmp/design/page-design/`; providers receive its path in their generated brief.

## Binary rubric

Add optional plain-language `acceptanceCriteria` at deck or slide level. Compilation creates `tmp/qa/deck-rubric.json` with blocking yes/no checks for the deck takeaway, audience transition, slide claim, live question, design intent, source grounding, and custom criteria.

A reviewer must mark every required check `passed`, `failed`, or `not-applicable` and provide concrete visual evidence. Blocking checks cannot be not-applicable.

## Render, observe, repair

After a slide or final deck is rendered, record the inspection before recording QA:

```text
node <skill-dir>/scripts/record-render-observation.mjs <project-dir> \
  --input tmp/qa/inputs/s05-r1.json
```

The input declares `scope`, `slideId` when applicable, `round`, `status`, `artifact`, `findings`, and all matching `rubricResults`. A failed observation before the round limit also declares a `repairPlan` with minimal targeted actions.

Allowed values:

- observation `status`: `passed` or `failed`;
- rubric result `status`: `passed`, `failed`, or `not-applicable`; a blocking check cannot be not-applicable;
- finding `severity`: `blocking`, `error`, `warning`, or `note`; `category` is a concise task-specific label such as `hierarchy`, `overflow`, `accuracy`, or `connector`;
- repair `operation`: `adjust-copy`, `adjust-layout`, `adjust-typography`, `replace-asset`, `repair-connector`, `simplify-diagram`, `adjust-motion`, `degrade-renderer`, or `other-minimal`;
- optional `repairable: false` declares a terminal failed review. Otherwise, a failed observation before the round limit requires a repair plan.

Then bind QA to that exact observation:

```text
node <skill-dir>/scripts/record-qa.mjs <project-dir> --slide s05 \
  --status passed --reviewer director --note "Full-size render passed" \
  --observation tmp/qa/observations/s05/r2.json
```

Default to at most two repair rounds. Repair copy, alignment, typography, one asset, connectors, diagram complexity, motion, or renderer fallback. Do not redesign the whole slide inside the repair loop. A changed artifact, plan, design lock, source, rubric, or slide input invalidates the observation.

Use the same process for the assembled deck with `scope: deck`, artifact `output/<deck>.pptx`, and `--final`. Final validation requires a passing current observation for every slide and for the deck.

## Passing observation input

Include every rubric check assigned to the scope; the IDs below are illustrative:

```json
{
  "scope": "slide",
  "slideId": "s01",
  "round": 1,
  "status": "passed",
  "reviewer": "director",
  "summary": "The exact full-size render passes its communication and design checks.",
  "artifact": "tmp/slide-builds/s01/preview.png",
  "findings": [],
  "rubricResults": [
    { "checkId": "s01-claim-visible", "status": "passed", "evidence": "The takeaway is the first fixation and remains legible at slide size." },
    { "checkId": "s01-question-answered", "status": "passed", "evidence": "The headline and proof region visibly answer the live question." },
    { "checkId": "s01-design-intent", "status": "passed", "evidence": "The focal point, reading path, and quiet field match the Page Design IR." }
  ]
}
```

## Failed observation and minimal repair input

```json
{
  "scope": "slide",
  "slideId": "s04",
  "round": 1,
  "status": "failed",
  "reviewer": "director",
  "summary": "One control edge collides with an execution-layer label.",
  "artifact": "tmp/slide-builds/s04/preview.png",
  "findings": [
    {
      "id": "connector-collision",
      "severity": "error",
      "category": "connector",
      "target": "control-edge-03",
      "description": "The edge crosses the runtime label.",
      "evidence": "The collision is visible at 100% render size."
    }
  ],
  "rubricResults": [
    { "checkId": "s04-claim-visible", "status": "passed", "evidence": "The control claim remains prominent." },
    { "checkId": "s04-question-answered", "status": "passed", "evidence": "The architecture answers how governance surrounds execution." },
    { "checkId": "s04-design-intent", "status": "failed", "evidence": "The collision breaks the declared reading path and connector grammar." }
  ],
  "repairPlan": {
    "strategy": "minimal",
    "actions": [
      {
        "id": "repair-control-edge-03",
        "target": "control-edge-03",
        "operation": "repair-connector",
        "rationale": "Reroute one edge and offset one label without changing the page composition."
      }
    ]
  }
}
```
