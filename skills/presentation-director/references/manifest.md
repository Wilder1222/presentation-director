# Presentation Manifest Contract

## Contents

1. Purpose and top-level structure
2. Capability profile
3. Style decision
4. Deck and slide objects
5. Assets and motion
6. Optional Three.js component
7. Sources and validation

## Purpose

Use `presentation.json` as the source of truth for narrative, renderer routing, assets, motion, editability, and provenance. Do not infer these choices again during rendering.

## Top-level structure

```json
{
  "version": "1.1",
  "status": "planning",
  "capabilityProfile": {},
  "styleDecision": {},
  "deck": {},
  "motionBudget": {},
  "slides": []
}
```

Set `status` to `planning` while assets may still be missing. Set it to `final` only when every referenced local path exists, the capability profile is current, every renderer is supported or replaced by an approved fallback, and the deck is ready for final QA.

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
      "cacheFile": "raw/openai/state-of-enterprise-ai-2025.pdf",
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
- A preset with official raw links must load the selected raw source and record `rawStatus: loaded`.
- A custom style requires `reference_research`, `researchStatus: complete`, at least two direct sources, and at least one official or first-party source.
- Search-result pages are not source records; store direct destination URLs.
- Do not write the final design contract while recommendation status remains `pending`.

Read `style-discovery.md` for the complete workflow.

## Deck object

```json
{
  "title": "AI Agent Platform",
  "audience": "Enterprise technology leaders",
  "objective": "Approve a six-week pilot",
  "centralTakeaway": "A governed agent runtime can automate repeatable knowledge work without losing control.",
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
  "claimKind": "original",
  "claim": "Governance surrounds every planning and execution step.",
  "title": "Control is part of the runtime—not an afterthought",
  "layoutPattern": "layered-architecture",
  "renderer": "svg",
  "editability": "mixed",
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
    "placement": "right 58%, subject biased to the right",
    "aspectRatio": "4:3",
    "mustAvoid": ["text", "logos", "neon circuit cliché"]
  }
}
```

Allowed status values are `planned`, `ready`, and `rejected`. A final manifest must not reference planned or rejected assets.

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
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile <requested-mode> --write
node <skill-dir>/scripts/validate-workspace.mjs <project-dir>
```

Use `--allow-draft` only during planning. Final delivery requires a passing validation without that flag.
