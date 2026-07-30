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
│   │   └── review.md                      # Delivery acceptance criteria
│   └── scripts/                           # Initialization, collection, validation
└── README.md
```

## Initialize a presentation workspace

```powershell
node .\skills\presentation-director\scripts\init-workspace.mjs `
  D:\presentations\agent-platform `
  --title "AI Agent Platform" `
  --language en-US `
  --platform codex `
  --profile full-studio
```

The generated workspace contains:

```text
DESIGN.md
presentation.json
assets/generated/images/
assets/generated/ui/
assets/models/
assets/textures/
diagrams/
motion/hyperframes/
motion/remotion/three/
output/
tmp/
```

## Minimal manifest

```json
{
  "version": "1.0",
  "status": "planning",
  "capabilityProfile": {
    "platform": "codex",
    "requestedMode": "full-studio",
    "resolvedMode": "full-studio",
    "checkedAt": "2026-07-30T08:00:00.000Z",
    "required": ["presentation", "image_generation", "ui_capture", "short_motion", "video"],
    "available": ["presentation", "image_generation", "ui_capture", "short_motion", "video"],
    "missing": [],
    "taskReady": true,
    "fallbacksApproved": false
  },
  "deck": {
    "title": "AI Agent Platform",
    "audience": "Enterprise technology leaders",
    "objective": "Approve a pilot",
    "centralTakeaway": "A governed runtime makes agent automation controllable.",
    "language": "en-US",
    "aspectRatio": "16:9",
    "primaryReference": "openai-editorial-inspired",
    "secondaryReferences": [],
    "outputs": ["pptx", "pdf"]
  },
  "motionBudget": {
    "maxVideoSlides": 3,
    "maxTotalVideoSeconds": 45,
    "maxTransitionStyles": 2
  },
  "slides": []
}
```

See [`manifest.md`](../skills/presentation-director/references/manifest.md) for the complete schema and 3D examples.

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
python .\skills\presentation-director\scripts\validate-reference-library.py
```

Validate a presentation workspace:

```powershell
node .\skills\presentation-director\scripts\validate-workspace.mjs <project-directory>
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
