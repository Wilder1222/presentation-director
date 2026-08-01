# Presentation Manifest Contract

## Contents

1. Purpose and top-level structure
2. Storage policy
3. Delivery contract
4. Capability profile
5. Style decision
6. Design taste profile
7. Content preference and delivery planning
8. Creative and quality contracts
9. Production optimization and observed QA
10. Deck and slide objects
11. Assets and motion
12. Optional Three.js component
13. Sources and validation

## Purpose

Use `presentation.json` as the source of truth for narrative, renderer routing, assets, motion, editability, and provenance. Do not infer these choices again during rendering.

## Top-level structure

```json
{
  "version": "1.7",
  "status": "planning",
  "storage": {},
  "deliveryContract": {},
  "narrative": {},
  "capabilityProfile": {},
  "styleDecision": {},
  "tasteProfile": {},
  "contentPreference": {},
  "delivery": {},
  "production": {},
  "deck": {},
  "motionBudget": {},
  "slides": []
}
```

Set `status` to `planning` while assets may still be missing. Set it to `final` only when every referenced local path exists, the capability profile is current, every renderer is supported or replaced by an approved fallback, and the deck is ready for final QA.

## Storage policy

Manifest 1.2 and later keep every project-owned persistent file inside the active workspace:

```json
{
  "policy": "workspace-local",
  "workspace": ".",
  "sources": "sources",
  "referenceLibrary": "reference-library",
  "raw": "reference-library/raw",
  "temporary": "tmp",
  "output": "output"
}
```

The workspace directory must be named `presentation-director` and defaults to `<current-directory>/presentation-director`. Copy user-supplied inputs needed for reproducibility into `sources/`. Downloaded raw references, captures, selected pages, and contact sheets belong under `reference-library/`. Generated media, diagrams, motion projects, temporary records, and final outputs must use workspace-relative paths. Do not use a user-home or system-global cache.

## Delivery contract

Manifest 1.3 makes the project outcome explicit:

```json
{
  "primaryArtifact": "pptx",
  "readyToPresent": true,
  "narrativeRequired": true,
  "visualImpact": "high",
  "fidelity": "high",
  "editability": "native-first",
  "fullPageRaster": "exception-only"
}
```

These values are non-negotiable acceptance targets, not progress flags. The primary deliverable is a complete PPTX that can be opened, presented, and modified immediately. PDF, HTML, MP4, source projects, and preview images are supporting outputs unless the user explicitly requests another primary format.

`native-first` means audience-facing text, data, tables, charts, and simple diagrams remain native PowerPoint objects whenever feasible. SVG, generated imagery, UI captures, and motion media must remain replaceable and retain their source files. A full-page raster slide is allowed only when flattening is essential to the visual result and the slide records `rasterExceptionReason`.

Read `delivery-contract.md` for the complete definition of ready-to-use, narrative, visual impact, fidelity, editability, and handoff requirements.

## Capability profile

Create this object with `check-capabilities.mjs --write`; do not author provider availability from memory.

```json
{
  "platform": "codex",
  "requestedMode": "full-studio",
  "resolvedMode": "full-studio",
  "checkedAt": "2026-07-30T08:00:00.000Z",
  "required": [
    "presentation",
    "image_generation",
    "ui_capture",
    "short_motion",
    "video"
  ],
  "available": [
    "presentation",
    "image_generation",
    "ui_capture",
    "short_motion",
    "video"
  ],
  "missing": [],
  "taskReady": true,
  "fallbacksApproved": false
}
```

Rules:

- `requestedMode` records what the user asked for; `resolvedMode` records what the detected providers can actually deliver.
- `taskReady` must equal `missing.length === 0`.
- A final manifest may retain missing requested capabilities only when `fallbacksApproved` is `true`, the approval is recorded in `tmp/fallback-reasons.txt`, and no slide still uses a renderer backed by a missing capability.
- Adding `threeD` to any slide requires `three_d` in `available` as well as the normal `video` capability.
- Rerun preflight after installing, removing, enabling, disabling, or changing a provider. Do not reuse a stale profile.

## Style decision

Record how the visual direction was chosen and how deeply its references were resolved:

```json
{
  "mode": "recommend",
  "status": "selected",
  "selectedId": "openai-editorial-inspired",
  "selectedKind": "preset",
  "selectedAt": "2026-07-30T12:00:00.000Z",
  "rationale": "Editorial hierarchy fits an evidence-led enterprise AI narrative.",
  "visualBoard": "tmp/style-discovery/options.webp",
  "candidates": [
    { "id": "openai-editorial-inspired", "name": "Editorial Intelligence", "kind": "preset" },
    { "id": "ibm-engineered-grid-inspired", "name": "Engineered Evidence", "kind": "preset" },
    { "id": "calm-operating-system", "name": "Calm Operating System", "kind": "custom" }
  ],
  "referenceDepth": "source",
  "rawAvailable": true,
  "rawStatus": "loaded",
  "researchStatus": "not-required",
  "sources": [
    {
      "sourceId": "openai-enterprise-ai-2025-report",
      "url": "https://cdn.openai.com/pdf/7ef17d82-96bf-4dd1-9df2-228f7f377a29/the-state-of-enterprise-ai_2025-report.pdf",
      "cacheFile": "reference-library/raw/openai/state-of-enterprise-ai-2025.pdf",
      "cacheStatus": "loaded",
      "usage": "Design reference only"
    }
  ]
}
```

Rules:

- `mode` is `specified`, `auto`, or `recommend`.
- `recommend` requires at least two visual candidates and a project-local comparison board.
- `auto` records the rationale but does not require a user checkpoint or candidate board.
- `selectedKind` is `user-template`, `preset`, or `custom`.
- `referenceDepth` is `user-source`, `preview`, `source`, or `web-research`.
- A preset with official raw links must load the selected raw source under `reference-library/raw` and record `rawStatus: loaded`.
- A custom style requires `reference_research`, `researchStatus: complete`, at least two direct sources, and at least one official or first-party source.
- Search-result pages are not source records; store direct destination URLs.
- Do not write the final design contract while recommendation status remains `pending`.

Read `style-discovery.md` for the complete workflow.

## Design taste profile

Manifest 1.3 requires a content-specific taste record before production:

```json
{
  "status": "locked",
  "designThesis": "This presentation should feel clinical but humane, using evaluation traces to make model governance inspectable, without generic AI glow.",
  "contentMotif": "Model evaluation traces and review checkpoints",
  "tensions": ["clinical/humane", "dense/calm"],
  "signatureMoves": [
    {
      "name": "Evidence margin",
      "purpose": "Keep source confidence visible beside every major claim.",
      "scope": "Evidence, architecture, and recommendation slides"
    }
  ],
  "antiDefaults": [
    "generic-ai-glow",
    "three-column-feature-cards",
    "decorative-neural-mesh"
  ],
  "contentSwapTest": "pass",
  "authorshipNote": "The evidence margin turns governance provenance into the deck's recurring visual structure."
}
```

Rules:

- `status` is `draft` during exploration and `locked` before production or final delivery.
- `designThesis`, `contentMotif`, and `authorshipNote` explain why the direction belongs to the current material.
- Use one or two productive `tensions` and no more than two `signatureMoves`.
- Every signature move requires `name`, `purpose`, and allowed `scope`.
- Record at least three task-specific `antiDefaults` rather than relying only on a universal ban list.
- Set `contentSwapTest` to `pass` only when the system would require meaningful redesign for an unrelated company or topic.
- A final Manifest 1.3 fails validation when the profile is unlocked, generic, over-specified, or has not passed the content-swap test.

Read `design-taste.md` before authoring this object.

## Content preference and delivery planning

Manifest 1.7 adds a non-visual preference profile and a rehearsable time contract. `contentPreference` records compression, evidence order, preferred and rejected content moves, and speaker-note detail. Top-level `delivery` records mode, total seconds, reserve, presenter goal, and timing tolerance; each slide records `timeBudgetSeconds`, complementary `spokenDetail`, semantic `attentionCues`, and a non-closing `transitionLine`.

Slide time budgets plus reserve must equal the deck total. Attention targets must reference `pageDesign.regions[].id`. Run `prepare-creative.mjs --strict` to compile `tmp/preferences/content-preference.json` and `tmp/delivery/delivery-plan.json`. See `content-delivery.md` for the full schema, rehearsal input, native-capability receipt, and scorecard contract.

## Creative and quality contracts

Manifest 1.7 locks the causal story, content preferences, and delivery timing, then compiles evidence, page-design intent, visual rhythm, materials, provider handoffs, and a task-specific binary rubric before representative samples or production assets:

```json
{
  "narrative": {
    "status": "locked",
    "communicationJob": "By the end, technology leaders should approve a governed pilot because the runtime makes agent work observable and reversible.",
    "audienceStartingPoint": "Interested in agents but concerned about control and proof.",
    "audienceEndState": "Confident that a bounded pilot is both valuable and governable.",
    "stakes": "Without a governed path, teams either block useful automation or deploy it without sufficient control.",
    "arc": "Uncontrolled opportunity -> visible control system -> evidence -> bounded decision",
    "turningPointSlideId": "s05",
    "resolution": "Approve a six-week pilot with explicit success and governance gates."
  },
  "production": {
    "creativePlan": {
      "status": "prepared",
      "contractVersion": "1.2",
      "preparedAt": "2026-07-31T07:30:00.000Z",
      "digest": "<sha256>",
      "narrativeMap": "tmp/creative/narrative-map.json",
      "storyboard": "tmp/creative/storyboard.json",
      "assetPlan": "tmp/creative/asset-plan.json",
      "report": "tmp/creative/report.json",
      "providerBriefsRoot": "tmp/provider-briefs",
      "providerIndex": "tmp/provider-briefs/index.json",
      "evidenceBundle": "tmp/evidence/evidence-bundle.json",
      "contentAlignment": "tmp/evidence/content-alignment.json",
      "pageDesignIndex": "tmp/design/page-design/index.json",
      "deckRubric": "tmp/qa/deck-rubric.json",
      "contentPreference": "tmp/preferences/content-preference.json",
      "deliveryPlan": "tmp/delivery/delivery-plan.json",
      "artifactHashes": {},
      "warnings": 0
    }
  }
}
```

Use `prepare-creative.mjs --strict` to write these records; never author their digests or generated artifacts manually. Any change to acceptance criteria, sources, narrative, slide titles, claims or content, renderer routing, visual or page-design plans, asset briefs, motion intent, or 3D intent invalidates the plan. Read `creative-planning.md` and `quality-contracts.md` for the full contract.

## Production optimization

Manifest 1.7 carries forward Manifest 1.4 production optimization and binds it to compiled evidence, page-design, content-preference, delivery, rubric, and creative contracts:

```json
{
  "designLock": {
    "status": "locked",
    "requiredSampleCount": 4,
    "lockedAt": "2026-07-31T08:00:00.000Z",
    "approvedBy": "user",
    "creativeDigest": "<sha256>",
    "designDigest": "<sha256>",
    "samples": [
      {
        "slideId": "s01",
        "role": "opening",
        "renderer": "native_ppt",
        "artifact": "tmp/design-lock/s01.png",
        "artifactHash": "<sha256>",
        "approvedAt": "2026-07-31T08:00:00.000Z"
      }
    ]
  },
  "build": {
    "strategy": "incremental-content-addressed",
    "cacheState": "tmp/build-cache/state.json",
    "plan": "tmp/build-plan.json",
    "taskGraph": "tmp/task-graph.json",
    "maxParallelWorkers": 4,
    "lastPreparedAt": "2026-07-31T08:05:00.000Z",
    "lastRecordedAt": "2026-07-31T08:45:00.000Z"
  },
  "qa": {
    "strategy": "risk-based-plus-final-full",
    "plan": "tmp/qa-plan.json",
    "results": "tmp/qa-results.json",
    "ledger": "tmp/qa-ledger.txt",
    "rubric": "tmp/qa/deck-rubric.json",
    "observationsRoot": "tmp/qa/observations",
    "repairsRoot": "tmp/qa/repairs",
    "maxRepairRounds": 2,
    "repairStrategy": "minimal",
    "finalFullReviewRequired": true,
    "finalFullReview": {
      "status": "passed",
      "completedAt": "2026-07-31T09:30:00.000Z",
      "reviewer": "director"
    }
  },
  "delivery": {
    "rehearsal": "tmp/delivery/rehearsal.json",
    "nativeCapabilityAudit": "tmp/delivery/native-capability-audit.json",
    "qualityScorecard": "output/quality-scorecard.json",
    "nativeCapabilityReport": "output/native-capability-report.json",
    "rehearsalStatus": "passed",
    "qualityScorecardStatus": "passed",
    "nativeCapabilityStatus": "complete"
  }
}
```

Each slide owns an isolated build capsule. Omit `buildCapsule` to use
`tmp/slide-builds/<slide-id>` automatically, or declare another workspace-local directory when a
renderer needs a different capsule location:

```json
{
  "id": "s03",
  "role": "architecture",
  "renderer": "svg",
  "buildCapsule": "tmp/slide-builds/s03"
}
```

The capsule is the renderer-neutral assembly handoff. It contains the slide's source or assembly
instructions, a preview when available, and a `receipt.json` whose slide id, renderer, input
hash, and Manifest 1.7 `nativeCapabilities` match the current build task.

Use `lock-design.mjs` to create the digest and sample records. Do not author hashes manually. Use `prepare-build.mjs` to write build, task, and QA plans; use `record-build.mjs` only after declared outputs and the current capsule receipt exist; use `record-render-observation.mjs` and `record-qa.mjs` for artifact evidence; then record a rehearsal and compile native-capability and dual-score reports as described in `content-delivery.md`.

The task graph gives workers exclusive output paths and rejects nested path ownership. Only the Director may modify shared truth. A final Manifest 1.7 also fails when delivery timing, content preferences, rehearsal evidence, native-capability declarations, or either quality score is stale or incomplete.

Read `production-optimization.md` for the complete execution contract.

## Deck object

```json
{
  "title": "AI Agent Platform",
  "audience": "Enterprise technology leaders",
  "objective": "Approve a six-week pilot",
  "centralTakeaway": "A governed agent runtime can automate repeatable knowledge work without losing control.",
  "acceptanceCriteria": ["The final recommendation is explicit and reversible."],
  "language": "zh-CN",
  "aspectRatio": "16:9",
  "primaryReference": "openai-editorial-inspired",
  "secondaryReferences": [
    {
      "name": "nvidia-platform-inspired",
      "scope": ["architecture"]
    }
  ],
  "outputs": ["pptx", "pdf"]
}
```

Use one primary reference. It must match `styleDecision.selectedId` or the supplied user template. Restrict every secondary reference to slide roles.

## Slide object

```json
{
  "id": "s04",
  "role": "architecture",
  "claimId": "claim-control-runtime",
  "claimKind": "original",
  "claim": "Governance surrounds every planning and execution step.",
  "title": "Control is part of the runtime—not an afterthought",
  "layoutPattern": "layered-architecture",
  "renderer": "svg",
  "editability": "mixed",
  "narrativeBeat": {
    "question": "Can control be built into execution rather than added afterward?",
    "evidenceType": "reasoning",
    "consequence": "Governance becomes an operating property instead of an audit exercise.",
    "bridgeToNext": "The next slide shows how that design changes measurable pilot risk."
  },
  "visualPlan": {
    "silhouette": "layered-control-field",
    "density": "medium",
    "focalMode": "diagram",
    "visualPeak": true,
    "continuityCue": "The evidence margin becomes a control rail around every layer."
  },
  "pageDesign": {
    "designIntent": "Make governance visibly surround the execution stack.",
    "backgroundLayer": "Warm-white field without decorative texture.",
    "layoutLayer": "One layered stack inside a 12-column safe grid.",
    "contentLayer": "Native takeaway, editable labels, and vector edges.",
    "focalPoint": "control-rail",
    "negativeSpaceTarget": 0.32,
    "regions": [
      { "id": "takeaway", "role": "headline", "anchor": "top-left", "span": "8 columns", "priority": "primary" },
      { "id": "control-rail", "role": "diagram", "anchor": "center", "span": "10 columns", "priority": "secondary" }
    ],
    "readingPath": ["takeaway", "control-rail"]
  },
  "delivery": {
    "timeBudgetSeconds": 70,
    "spokenDetail": "Explain why the control rail makes the decision reversible without reading the title.",
    "attentionCues": [
      { "atSeconds": 8, "target": "control-rail", "purpose": "Focus the audience on the governing mechanism." }
    ],
    "transitionLine": "The next slide tests whether that control survives execution."
  },
  "acceptanceCriteria": ["Every connector has one declared semantic."],
  "content": {
    "layers": ["Experience", "Agent runtime", "Models and tools", "Governance and observability"]
  },
  "assets": [
    {
      "id": "architecture-main",
      "kind": "svg",
      "path": "diagrams/architecture.svg",
      "status": "ready"
    }
  ],
  "sources": []
}
```

Required fields:

- `id`: stable, unique, filesystem-safe identifier.
- `role`: narrative role, not merely a subject label.
- `claim`: the point the audience should leave with.
- `title`: audience-facing takeaway title.
- `layoutPattern`: an approved pattern or an explicitly named custom pattern.
- `renderer`: one of the supported renderer values.
- `editability`: one of `native`, `mixed`, `replaceable-media`, or `flattened`.
- `narrativeBeat`: the live audience question, evidence type, consequence, and non-closing bridge.
- `visualPlan`: the slide silhouette, density, focal mode, visual-peak flag, and continuity cue.
- `claimId`: stable identifier used across evidence, rubric, and output alignment records.
- `pageDesign`: renderer-neutral design intent, layers, semantic regions, focal point, negative-space target, and reading path.
- `delivery`: slide time budget, complementary spoken detail, semantic attention cues, and the transition to the next beat.
- `acceptanceCriteria`: optional task-specific binary checks added to the compiled deck rubric.

For `image_slide`, set `editability` to `flattened` and add a non-empty `rasterExceptionReason`. Do not use `image_slide` for architecture, diagrams, data, charts, tables, or any slide whose facts need native correction.

Use `claimKind: external` when the central claim depends on an external non-trivial fact. Such slides require at least one source.

## Assets

```json
{
  "id": "hero-product",
  "kind": "image",
  "path": "assets/generated/images/hero-product.webp",
  "status": "planned",
  "brief": {
    "purpose": "Create the single visual focus of the cover",
    "method": "image-generation",
    "role": "hero",
    "placement": "right 58%, subject biased to the right",
    "aspectRatio": "4:3",
    "continuityKey": "governed-runtime-material",
    "reusePolicy": "derived-variant",
    "selectionMode": "variants",
    "variantCount": 3,
    "dependencies": [],
    "acceptance": [
      "The product mechanism reads clearly at slide size",
      "The left title safe zone remains visually quiet"
    ],
    "mustAvoid": ["text", "logos", "neon circuit cliché"]
  }
}
```

Allowed status values are `planned`, `ready`, and `rejected`. A final manifest must not reference planned or rejected assets.

Allowed production methods are `image-generation`, `sourced-image`, `ui-capture`, `diagram`, `short-motion`, `video`, `3d-model`, `3d-material`, and `native`. `reusePolicy` is `single-use`, `system-reuse`, or `derived-variant`. `selectionMode` is `deterministic`, `single`, or `variants`; only `variants` may declare two to four candidates.

After inspecting the declared candidates, use `record-asset-selection.mjs` to populate `selection`:

```json
{
  "status": "selected",
  "selectedAt": "2026-07-31T08:20:00.000Z",
  "reviewer": "director",
  "rationale": "Candidate B preserves the title safe zone and best explains the mechanism.",
  "selectedCandidateId": "b",
  "selectedPath": "assets/generated/images/hero-product.webp",
  "selectedHash": "<sha256>",
  "providerBrief": "tmp/provider-briefs/s01/hero-product.json",
  "providerBriefHash": "<sha256>",
  "candidates": [
    { "id": "a", "path": "assets/generated/images/candidates/hero-a.webp", "hash": "<sha256>" },
    { "id": "b", "path": "assets/generated/images/candidates/hero-b.webp", "hash": "<sha256>" }
  ]
}
```

A final Manifest 1.6+ requires a current selection record for every asset using `selectionMode: variants`. The canonical asset, candidates, and provider brief must still match their recorded hashes. Recording a reviewed `single` or `deterministic` asset is optional.

Use project-relative paths. Never use paths outside the presentation workspace.

## Motion

```json
{
  "renderer": "hyperframes_video",
  "editability": "replaceable-media",
  "motion": {
    "engine": "hyperframes",
    "pattern": "architecture-build",
    "durationSeconds": 9,
    "transition": "masked-reveal",
    "purpose": "Show the dependency order across layers"
  },
  "posterFrame": "motion/hyperframes/architecture/poster.png",
  "assets": [
    {
      "id": "architecture-video",
      "kind": "video",
      "path": "motion/hyperframes/architecture/output.mp4",
      "status": "ready"
    }
  ]
}
```

Every video slide requires:

- an engine matching its renderer;
- a positive duration;
- a purpose tied to understanding or reveal;
- a static poster frame;
- a replaceable video asset.

## Optional Three.js component

A Three.js scene is a component of `remotion_video`, not a separate renderer. Add `threeD` only when spatial depth materially explains the claim.

```json
{
  "id": "s05",
  "role": "product-reveal",
  "claimKind": "original",
  "claim": "The device is designed as one continuous system.",
  "title": "One enclosure, three coordinated layers",
  "layoutPattern": "single-hero",
  "renderer": "remotion_video",
  "editability": "replaceable-media",
  "content": {},
  "motion": {
    "engine": "remotion",
    "pattern": "exploded-assembly",
    "durationSeconds": 10,
    "transition": "dissolve",
    "purpose": "Explain how the three physical layers align"
  },
  "threeD": {
    "runtime": "remotion-three",
    "purpose": "Use depth to make the assembly relationship unambiguous",
    "scenePath": "motion/remotion/product-assembly/src/ProductAssembly.tsx",
    "camera": {
      "type": "perspective",
      "fov": 36,
      "start": [0, 0.4, 5.2],
      "target": [0, 0, 0]
    },
    "fallback": "Use the poster with three native callout labels"
  },
  "posterFrame": "motion/remotion/product-assembly/poster.png",
  "assets": [
    {
      "id": "product-model",
      "kind": "3d-model",
      "path": "assets/models/product.glb",
      "status": "ready",
      "source": "original",
      "rights": "owned"
    },
    {
      "id": "product-assembly-video",
      "kind": "video",
      "path": "motion/remotion/product-assembly/output.mp4",
      "status": "ready"
    }
  ],
  "sources": []
}
```

For this plugin version, `threeD.runtime` must be `remotion-three` and the slide renderer must be `remotion_video`. Required 3D fields are `purpose`, `scenePath`, and `fallback`; the existing top-level `posterFrame` is the static fallback path. Track `source` and `rights` for every asset whose `kind` is `3d-model`, `texture`, or `environment-map`.

## Sources

```json
{
  "label": "NVIDIA investor presentations archive",
  "url": "https://investor.nvidia.com/events-and-presentations/presentations/default.aspx",
  "usage": "Design reference only",
  "rights": "link-only; do not redistribute source assets"
}
```

Use `path` instead of `url` for user-supplied local sources. The rendering stage must mirror slide sources into a `[Sources]` block in speaker notes.

## Validation

Run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <workspace> --profile <requested-mode> --write
node <skill-dir>/scripts/validate-workspace.mjs <workspace>
```

Use `--allow-draft` only during planning. Final delivery requires a passing validation without that flag.
Final validation also requires `pptx` in `deck.outputs`; delivery is not complete until that PPTX has been rendered, inspected at full size, and opened in the target presentation application.
