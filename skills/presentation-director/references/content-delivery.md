# Content Preference and Delivery Contract

## Contents

1. Content Preference DNA
2. Delivery Plan
3. Build Capability Receipt
4. Delivery Completion
5. Upgrade from Manifest 1.4–1.6

Manifest 1.7 treats the deck file and the live explanation as two related products. Lock the user's content preferences and the delivery envelope before creative compilation, then score both independently.

## Content Preference DNA

Record preferences that affect compression, evidence order, examples, and notes—not visual styling:

```json
{
  "contentPreference": {
    "status": "locked",
    "source": "inferred",
    "compression": "high",
    "evidenceOrder": "after-claim",
    "prefers": ["giant-conclusion", "product-proof", "concrete-example"],
    "avoids": ["long-background", "generic-market-context"],
    "speakerNotesDetail": "high",
    "inferenceNote": "Accepted material favors decisive conclusions, product evidence, and detailed presenter notes."
  }
}
```

Use `specified` when the user states the preferences, `inferred` when they come from supplied or previously accepted material, and `default` only when no useful evidence exists. Inference must be grounded in observable choices such as repeated deletions, preferred claim order, compression, example density, and notes detail. Do not infer demographic or sensitive traits.

`prepare-creative.mjs` compiles the locked profile to `tmp/preferences/content-preference.json` and embeds it in every specialist provider brief.

### Strict content fields

| Field | Allowed value / rule |
|---|---|
| `status` | `draft` or `locked`; strict creative compilation requires `locked`. |
| `source` | `specified`, `inferred`, or `default`. |
| `compression` | `low`, `medium`, or `high`. |
| `evidenceOrder` | `before-claim`, `after-claim`, or `contextual`. |
| `speakerNotesDetail` | `low`, `medium`, or `high`. |
| `prefers`, `avoids` | Arrays of non-empty strings; strict compilation requires at least one of each. |
| `inferenceNote` | Required when `source` is `inferred`. |

## Delivery Plan

Define the whole-deck envelope:

```json
{
  "delivery": {
    "status": "locked",
    "mode": "live",
    "totalSeconds": 900,
    "reserveSeconds": 45,
    "presenterGoal": "Secure approval for a bounded pilot.",
    "timingTolerance": 0.15
  }
}
```

Every slide adds a complementary spoken layer and attention cues tied to semantic page regions:

```json
{
  "delivery": {
    "timeBudgetSeconds": 70,
    "spokenDetail": "Explain why the control rail makes the decision reversible; do not read the title.",
    "attentionCues": [
      { "atSeconds": 8, "target": "control-rail", "purpose": "Make the governing mechanism the first proof point." }
    ],
    "transitionLine": "Now that control is visible, the next page tests whether it survives execution."
  }
}
```

Slide budgets plus reserve must equal `totalSeconds`. Every cue target must reference a current `pageDesign.regions[].id`. Creative compilation writes `tmp/delivery/delivery-plan.json` and adds delivery-specific checks to the deck rubric without mixing them into static render observation.

### Strict delivery fields

| Field | Allowed value / rule |
|---|---|
| `delivery.status` | `draft` or `locked`; strict creative compilation requires `locked`. |
| `delivery.mode` | `live`, `async`, or `self-guided`. |
| `totalSeconds` | Positive number after lock. |
| `reserveSeconds` | `0 <= reserveSeconds < totalSeconds`. |
| `timingTolerance` | Number from `0` through `0.3`. |
| `delivery.acceptanceCriteria` | Array of custom deck-level rehearsal requirements; may be empty. |
| `slide.delivery.timeBudgetSeconds` | Positive number. |
| `slide.delivery.spokenDetail` | Required and complementary to visible copy. |
| `attentionCues[].atSeconds` | `0 <= atSeconds < timeBudgetSeconds`. |
| `attentionCues[].target` | Must equal a current `pageDesign.regions[].id`. |
| `slide.delivery.transitionLine` | Required on non-closing slides; the closing slide may omit it or use `null`. |
| `slide.delivery.acceptanceCriteria` | Optional array of custom slide-level rehearsal requirements. |

Deck and slide `acceptanceCriteria` outside `delivery` compile as `artifact` checks. Put custom rehearsal criteria under the corresponding `delivery.acceptanceCriteria` array.

## Build Capability Receipt

Manifest 1.7 build receipts declare what remains editable after the actual renderer runs:

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
    "nativeShapes": true,
    "nativeCharts": false,
    "replaceableSvg": true,
    "replaceableImages": false,
    "embeddedVideo": false,
    "flattened": false,
    "losses": ["The complex topology remains a replaceable SVG rather than native connectors."]
  }
}
```

Manifest 1.7 receipts use `schemaVersion: "1.1"`; Manifest 1.4–1.6 retain their existing receipt contract. Declare actual output capability, not intended editability. A boolean is `true` only when at least one object of that type is retained in the stated form; `false` means no such retained object exists. When a planned or source object existed but was not retained, add a concrete `losses` entry; this distinguishes true absence from conversion loss. Use an empty loss array only when nothing material was lost.

The receipt describes the renderer's completed slide capsule. After the final PPTX is assembled and opened in the target application, author the review input at `tmp/delivery/native-capability-audit-input.json`. Then run `compile-native-capability-report.mjs`; it records the normalized audit at `tmp/delivery/native-capability-audit.json` and writes `output/native-capability-report.json`. The final report uses the assembled PPTX audit as truth and compares it with the receipt to expose losses introduced during assembly or conversion.

A final assembly audit contains the reviewed artifact and every slide:

```json
{
  "artifact": "output/agent-platform.pptx",
  "reviewer": "powerpoint-open-check",
  "summary": "Opened in the target PowerPoint version and audited object editability slide by slide.",
  "slides": [
    {
      "slideId": "s01",
      "nativeCapabilities": {
        "nativeText": true,
        "nativeShapes": true,
        "nativeCharts": false,
        "replaceableSvg": false,
        "replaceableImages": true,
        "embeddedVideo": false,
        "flattened": false,
        "losses": []
      }
    }
  ]
}
```

## Delivery Completion

After slide QA and final-deck observation:

Create a workspace-local rehearsal input such as `tmp/delivery/rehearsal-input.json` (this is a complete two-slide example):

```json
{
  "status": "passed",
  "reviewer": "presenter-reviewer",
  "summary": "The live run completed inside the envelope and preserved every planned attention shift.",
  "actualTotalSeconds": 162,
  "reserveUsedSeconds": 32,
  "slides": [
    { "slideId": "s01", "actualSeconds": 54 },
    { "slideId": "s02", "actualSeconds": 76 }
  ],
  "rubricResults": [
    {
      "checkId": "deck-time-budget",
      "status": "passed",
      "evidence": "Stopwatch log: 162 seconds including 32 seconds of reserve."
    },
    {
      "checkId": "s01-delivery-timing",
      "status": "passed",
      "evidence": "Slide s01 completed in 54 seconds against a 60-second budget."
    },
    {
      "checkId": "s01-spoken-complement",
      "status": "passed",
      "evidence": "The presenter explained the reversible decision mechanism without reading the title."
    },
    {
      "checkId": "s01-attention-cues",
      "status": "passed",
      "evidence": "The presenter shifted attention to control-rail at the planned beat."
    },
    {
      "checkId": "s02-delivery-timing",
      "status": "passed",
      "evidence": "Slide s02 completed in 76 seconds inside its tolerance."
    },
    {
      "checkId": "s02-spoken-complement",
      "status": "passed",
      "evidence": "The spoken explanation added the operating consequence rather than repeating visible copy."
    },
    {
      "checkId": "s02-attention-cues",
      "status": "passed",
      "evidence": "The planned evidence-region attention sequence was followed."
    }
  ]
}
```

Include every current slide exactly once and every `dimension: delivery` rubric check exactly once. Rehearsal and rubric status values are `passed` or `failed`; every result requires concrete evidence. The recorder binds rehearsal automatically to the current passing final-deck observation and the hash of that exact PPTX, including its speaker notes.

Timing is evaluated with these rules:

- `actualTotalSeconds = sum(slides[].actualSeconds) + reserveUsedSeconds`.
- `reserveUsedSeconds <= planned reserveSeconds`.
- A slide passes when `actualSeconds <= timeBudgetSeconds × (1 + timingTolerance)`.
- The deck passes when `actualTotalSeconds <= totalSeconds × (1 + timingTolerance)`; `totalSeconds` already includes reserve.
- Finishing early is allowed. Time saved elsewhere cannot cancel a slide-level overrun.
- Rehearse again without recompilation when only presenter practice changes; recompile and rebuild when manifest delivery, visible copy, notes, or final PPTX content changes.

```text
node <skill-dir>/scripts/compile-native-capability-report.mjs <project-dir> --input tmp/delivery/native-capability-audit-input.json
node <skill-dir>/scripts/record-delivery-rehearsal.mjs <project-dir> --input tmp/delivery/rehearsal-input.json
node <skill-dir>/scripts/compile-quality-scorecard.mjs <project-dir>
```

The rehearsal input records actual total and per-slide seconds plus concrete results for every `dimension: delivery` rubric check. `actualTotalSeconds` equals measured slide seconds plus reserve used.

Final outputs include:

- `output/native-capability-report.json`: native text, shapes, charts, replaceable media, embedded video, flattened exceptions, and conversion losses by slide.
- `output/quality-scorecard.json`: independent `artifactScore` and `deliveryScore` derived from current rubric evidence.

Each score is `round(100 × passed current checks / total current checks)` within its dimension. Deck and slide checks have equal weight. Missing checks stop compilation; blocking checks cannot be marked not-applicable. The scorecard reports passed and total counts so the result is auditable.

Manifest 1.7 final validation requires both scores to be 100, a passing current rehearsal, and a current native capability report. These are evidence gates; they do not replace human judgment or a real target-application open check.

## Upgrade from Manifest 1.4–1.6

Legacy validation remains available and the Skill must not silently rewrite an existing project. To opt into 1.7:

1. Change `version` to `1.7`; add locked `contentPreference`, top-level `delivery`, per-slide `delivery`, and the template's `production.delivery` paths.
2. Rerun `prepare-creative.mjs --strict`; creative contract 1.2 invalidates the previous representative design lock.
3. Re-render and lock representative samples, then run `prepare-build.mjs` again.
4. Rebuild receipts as schema 1.1 with complete `nativeCapabilities`; record builds and repeat artifact observations plus QA.
5. Assemble and open-check the final PPTX, complete the final native-capability audit, rehearse, compile both reports, and validate.
