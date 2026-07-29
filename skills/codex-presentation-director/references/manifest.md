# Presentation Manifest Contract

## Purpose

Use `presentation.json` as the source of truth for narrative, renderer routing, assets, motion, editability, and provenance. Do not infer these choices again during rendering.

## Top-level structure

```json
{
  "version": "1.0",
  "status": "planning",
  "deck": {},
  "motionBudget": {},
  "slides": []
}
```

Set `status` to `planning` while assets may still be missing. Set it to `final` only when every referenced local path exists and the deck is ready for final QA.

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

Use one primary reference. Restrict every secondary reference to slide roles.

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
node <skill-dir>/scripts/validate-workspace.mjs <project-dir>
```

Use `--allow-draft` only during planning. Final delivery requires a passing validation without that flag.
