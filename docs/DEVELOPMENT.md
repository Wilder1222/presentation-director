# Development and Contribution

This guide covers repository structure, presentation workspace initialization, extension points, validation, and contribution workflow.

[Back to README](../README.md) · [Architecture](ARCHITECTURE.md) · [Design Atlas](DESIGN-ATLAS.md)

## Repository structure

```text
presentation-director/
├── .agents/plugins/marketplace.json       # Marketplace catalog
├── .codex-plugin/plugin.json              # Standard Codex plugin metadata
├── .claude-plugin/plugin.json             # Claude Code adapter
├── gemini-extension.json                  # Gemini CLI adapter
├── assets/                                # Marketplace icon and screenshots
├── docs/                                  # User, architecture, Atlas, and developer guides
├── LICENSE                                # MIT License
├── skills/presentation-director/
│   ├── SKILL.md                           # Director entry point and hard gates
│   ├── agents/openai.yaml                 # Codex UI metadata
│   ├── assets/
│   │   ├── reference-library/             # Sources, catalog, provenance, previews
│   │   └── workspace-template/            # New presentation workspace template
│   ├── references/
│   │   ├── atlas/                         # Design DNA
│   │   ├── platforms/                     # Host-specific install and fallback behavior
│   │   ├── role-packs/                    # Slide-role reference packs
│   │   ├── patterns/                      # Layout and motion patterns
│   │   ├── renderers/                     # Specialized renderer contracts
│   │   ├── library/                       # Reference operations and registry
│   │   ├── routing.md                     # Renderer routing
│   │   ├── dependencies.json              # Capability profiles and provider detection
│   │   ├── manifest.md                    # Intermediate manifest contract
│   │   ├── creative-planning.md           # Narrative, storyboard, assets, and provider briefs
│   │   ├── quality-contracts.md            # Evidence, page-design IR, rubric, observation, and repair
│   │   ├── content-delivery.md             # Content preferences, timing, rehearsal, scores, editability report
│   │   └── review.md                      # Delivery acceptance criteria
│   └── scripts/                           # Initialization, production planning, cache, QA, validation
├── tests/                                 # Node integration tests for production contracts
└── README.md
```

## Initialize a presentation workspace

```powershell
node .\skills\presentation-director\scripts\init-workspace.mjs `
  --title "AI Agent Platform" `
  --language en-US `
  --platform codex `
  --profile full-studio
```

The command creates `<current-directory>/presentation-director/`:

```text
DESIGN.md
presentation.json
sources/input/
reference-library/raw/
reference-library/selected/
reference-library/captures/
assets/generated/images/
assets/generated/ui/
assets/models/
assets/textures/
diagrams/
motion/hyperframes/
motion/remotion/three/
output/
tmp/
tmp/build-cache/
tmp/creative/
tmp/design-lock/
tmp/design/page-design/
tmp/evidence/
tmp/preferences/
tmp/delivery/
tmp/provider-briefs/
tmp/qa/
tmp/qa/inputs/
tmp/qa/observations/
tmp/qa/repairs/
tmp/slide-builds/<slide-id>/
```

## Minimal manifest

```json
{
  "version": "1.7",
  "status": "planning",
  "storage": {
    "policy": "workspace-local",
    "workspace": ".",
    "sources": "sources",
    "referenceLibrary": "reference-library",
    "raw": "reference-library/raw",
    "temporary": "tmp",
    "output": "output"
  },
  "deliveryContract": {
    "primaryArtifact": "pptx",
    "readyToPresent": true,
    "narrativeRequired": true,
    "visualImpact": "high",
    "fidelity": "high",
    "editability": "native-first",
    "fullPageRaster": "exception-only"
  },
  "narrative": {
    "status": "draft",
    "communicationJob": "To be inferred",
    "audienceStartingPoint": "To be inferred",
    "audienceEndState": "To be inferred",
    "stakes": "To be inferred",
    "arc": "To be inferred",
    "turningPointSlideId": "To be inferred",
    "resolution": "To be inferred"
  },
  "capabilityProfile": {
    "platform": "codex",
    "requestedMode": "full-studio",
    "resolvedMode": "full-studio",
    "checkedAt": "2026-07-30T08:00:00.000Z",
    "required": ["presentation", "image_generation", "ui_capture", "raster_processing", "svg_optimization", "diagram_graph", "short_motion", "video", "media_tooling"],
    "available": ["presentation", "image_generation", "ui_capture", "raster_processing", "svg_optimization", "diagram_graph", "short_motion", "video", "media_tooling"],
    "missing": [],
    "taskReady": true,
    "fallbacksApproved": false
  },
  "deck": {
    "title": "AI Agent Platform",
    "audience": "Enterprise technology leaders",
    "objective": "Approve a pilot",
    "centralTakeaway": "A governed runtime makes agent automation controllable.",
    "acceptanceCriteria": ["The recommendation is explicit and reversible."],
    "language": "en-US",
    "aspectRatio": "16:9",
    "primaryReference": "openai-editorial-inspired",
    "secondaryReferences": [],
    "outputs": ["pptx", "pdf"]
  },
  "styleDecision": {
    "mode": "auto",
    "status": "selected",
    "selectedId": "openai-editorial-inspired",
    "selectedKind": "preset",
    "selectedAt": "2026-07-30T12:00:00.000Z",
    "rationale": "Editorial hierarchy fits the evidence-led enterprise narrative.",
    "visualBoard": null,
    "candidates": [],
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
  },
  "tasteProfile": {
    "status": "locked",
    "designThesis": "Clinical but humane, using evaluation traces to make governance inspectable.",
    "contentMotif": "Evaluation traces and review checkpoints",
    "tensions": ["clinical/humane", "dense/calm"],
    "signatureMoves": [
      {
        "name": "Evidence margin",
        "purpose": "Keep source confidence visible beside major claims.",
        "scope": "Evidence and recommendation slides"
      }
    ],
    "antiDefaults": ["generic-ai-glow", "feature-card-wall", "decorative-neural-mesh"],
    "contentSwapTest": "pass",
    "authorshipNote": "Governance provenance becomes the recurring composition device."
  },
  "contentPreference": {
    "status": "locked",
    "source": "inferred",
    "compression": "high",
    "evidenceOrder": "after-claim",
    "prefers": ["giant-conclusion", "product-proof"],
    "avoids": ["long-background", "generic-market-context"],
    "speakerNotesDetail": "high",
    "inferenceNote": "The brief favors concise conclusions and detailed presenter notes."
  },
  "delivery": {
    "status": "locked",
    "mode": "live",
    "totalSeconds": 600,
    "reserveSeconds": 30,
    "presenterGoal": "Secure approval for a bounded pilot.",
    "timingTolerance": 0.15
  },
  "motionBudget": {
    "maxVideoSlides": 3,
    "maxTotalVideoSeconds": 45,
    "maxTransitionStyles": 2,
    "maxNativeAnimatedSlides": 6,
    "maxNativeAnimationStepsPerSlide": 4
  },
  "slides": []
}
```

See [`manifest.md`](../skills/presentation-director/references/manifest.md) for the complete schema and 3D examples.

## Production optimization scripts

After sources, narrative, content preferences, deck timing, slide visual and delivery plans, renderer-neutral page designs, acceptance criteria, and asset briefs are locked, compile the creative and quality contracts:

```powershell
node .\skills\presentation-director\scripts\prepare-creative.mjs <project-directory> --strict
```

Inspect `tmp/evidence/`, `tmp/preferences/`, `tmp/delivery/delivery-plan.json`, `tmp/motion/native-motion-plan.json`, `tmp/design/page-design/`, `tmp/qa/deck-rubric.json`, and `tmp/creative/`; use generated JSON in `tmp/provider-briefs/` for specialist calls. Native PPTX providers must apply the compiled native motion plan after building each static frame and record its plan hash and applied animation ids in the build receipt. After representative samples are rendered, lock the design and prepare incremental work:

```powershell
node .\skills\presentation-director\scripts\lock-design.mjs <project-directory> `
  --approved-by user `
  --sample s01=tmp/design-lock/s01.png `
  --sample s03=tmp/design-lock/s03.png `
  --sample s05=tmp/design-lock/s05.png `
  --sample s08=tmp/design-lock/s08.png

node .\skills\presentation-director\scripts\prepare-build.mjs <project-directory> --max-workers 4
```

Each production task owns `tmp/slide-builds/<slide-id>/` plus its declared media outputs. Write a
matching `receipt.json` into that capsule only after the slide source and preview are complete; its
`inputHash` must equal the task's `cacheKey`.

After declared outputs exist, record builds, exact render observations, and QA:

```powershell
node .\skills\presentation-director\scripts\record-build.mjs <project-directory> --all
node .\skills\presentation-director\scripts\record-render-observation.mjs <project-directory> `
  --input tmp/qa/inputs/s01-r1.json
node .\skills\presentation-director\scripts\record-qa.mjs <project-directory> `
  --slide s01 --status passed --reviewer reviewer --note "Full-size inspection passed" `
  --observation tmp/qa/observations/s01/r1.json

node .\skills\presentation-director\scripts\compile-native-capability-report.mjs <project-directory> `
  --input tmp/delivery/native-capability-audit-input.json
node .\skills\presentation-director\scripts\record-delivery-rehearsal.mjs <project-directory> `
  --input tmp/delivery/rehearsal-input.json
node .\skills\presentation-director\scripts\compile-quality-scorecard.mjs <project-directory>
```

Only the Director writes shared state. Worker tasks use the exclusive paths generated in `tmp/task-graph.json`.

For assets that declare candidate variants, preserve the reviewed selection before final build preparation:

```powershell
node .\skills\presentation-director\scripts\record-asset-selection.mjs <project-directory> `
  --slide s01 --asset hero-product `
  --candidate a=assets/generated/images/candidates/hero-a.webp `
  --candidate b=assets/generated/images/candidates/hero-b.webp `
  --selected b --reviewer director `
  --rationale "B preserves the title safe zone and explains the mechanism."
```

## Add a Design Atlas entry

1. Create `skills/presentation-director/references/atlas/<name>.yaml`.
2. Store abstract design principles, not redistributable proprietary assets.
3. Register the entry in the on-demand loading table in `SKILL.md`.
4. Update the source registry and reference catalog when external material is involved.
5. Update [`DESIGN-ATLAS.md`](DESIGN-ATLAS.md).
6. Run the complete validation suite.

## Add a role pack

1. Create `skills/presentation-director/references/role-packs/<name>.yaml`.
2. Restrict it to explicit slide roles.
3. Do not let it override global typography, color, or brand rules.
4. Register it in `SKILL.md` and `references/routing.md`.
5. Add or update provenance records when external references are involved.

## Add a renderer or motion capability

1. Define its use conditions and fallback behavior in `references/routing.md`.
2. Define the intermediate data contract in `references/manifest.md`.
3. Define provider handoff fields in `references/prompt-contracts.md`.
4. Define acceptance criteria in `references/review.md`.
5. Update `references/dependencies.json` when the capability requires provider detection.
6. Update `scripts/validate-workspace.mjs` so invalid routing is rejected automatically.
7. Add the renderer to [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Validation

Check installed capabilities and update a workspace profile:

```powershell
node .\skills\presentation-director\scripts\check-capabilities.mjs `
  --platform codex `
  --project <project-directory> `
  --profile full-studio `
  --write
```

Validate the standard plugin structure:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py" .
```

Validate the Skill:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py" `
  ".\skills\presentation-director"
```

Validate progressive loading, reference links, and internal Skill structure:

```powershell
node .\skills\presentation-director\scripts\validate-skill-structure.mjs
```

Validate reference metadata and previews:

```powershell
python .\skills\presentation-director\scripts\validate-reference-library.py `
  --workspace .\presentation-director
```

Validate a presentation workspace:

```powershell
node .\skills\presentation-director\scripts\validate-workspace.mjs <project-directory>
```

Run creative and production integration tests:

```powershell
node --test .\tests\creative-planning.test.mjs
node --test .\tests\production-optimization.test.mjs
```

Use `--allow-draft` only during development. Final delivery must pass without it.

## Documentation rules

Keep the root README focused on product value, visual proof, quick start, and common use cases.

Update the dedicated guide when changing:

- Installation, providers, or capability profiles: `docs/INSTALLATION.md`.
- Workflow, contracts, routing, motion, or editability: `docs/ARCHITECTURE.md`.
- Design DNA, role packs, source records, or rights rules: `docs/DESIGN-ATLAS.md`.
- Repository structure, extension points, or validation: `docs/DEVELOPMENT.md`.

User-visible capability changes should still be reflected concisely in the root README.

## Contribution workflow

1. Create a `codex/<feature-name>` branch from `main`.
2. Update the Skill, contracts, validators, and relevant documentation together.
3. Run plugin, Skill, reference-library, and workspace validation.
4. Confirm that raw PDFs, models, textures, caches, and `node_modules` are not included in the commit.
5. Open a pull request describing user-visible behavior changes and compatibility impact.

## Engineering references

- [OpenAI Agent Skills](https://github.com/openai/skills) for discoverable, installable, progressively loaded Skills.
- [Remotion](https://github.com/remotion-dev/remotion) for deterministic React-driven video composition.
- [Three.js](https://threejs.org/) for Web 3D scenes, cameras, materials, and model rendering.
- [PptxGenJS](https://github.com/gitbrent/PptxGenJS) for the capabilities and boundaries of programmatic PowerPoint generation.
