<div align="center">

<img src="assets/icon.png" alt="Presentation Director plugin icon" width="128" height="128" />

# Presentation Director

**Design the story. Direct the tools. Deliver a coherent presentation.**

Turn a brief, document, or reference deck into a presentation with a locked visual system, the right renderer for every slide, purposeful motion, and a final quality review.

![Version](https://img.shields.io/badge/version-0.4.0-4F46E5)
![Codex Plugin](https://img.shields.io/badge/Codex-standard_plugin-111111)
![Agent Skills](https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20Copilot%20%7C%20Gemini%20%7C%20Cursor-2563EB)
![Presentation](https://img.shields.io/badge/output-PPTX%20%7C%20PDF%20%7C%20HTML%20%7C%20MP4-0A7D55)
[![License: MIT](https://img.shields.io/badge/license-MIT-F5F0E6)](LICENSE)

[Showcase](#showcase) · [Why Presentation Director](#why-presentation-director) · [Quick start](#quick-start) · [Examples](#example-prompts) · [Documentation](#documentation)

</div>

## Showcase

### From brief to final QA

Shape the narrative, lock a shared design contract, route every slide to the right specialist capability, and review the rendered result before delivery.

![Presentation Director workflow from brief to QA](assets/screenshot-workflow.png)

### One design contract, multiple controlled outputs

Combine editable PowerPoint content, precise vector diagrams, generated visuals, realistic product UI, and replaceable motion media without losing visual consistency.

![Native, vector, and motion renderer routing](assets/screenshot-renderer-routing.png)

### Spatial product storytelling when it adds meaning

Use optional Three.js scenes inside Remotion for deterministic turntables, exploded views, and spatial sequences, with a static poster for preview and fallback playback.

![Three.js and Remotion product animation workflow](assets/screenshot-threejs.png)

## Why Presentation Director

AI can generate slides. Presentation Director coordinates the decisions that make a deck feel intentionally designed.

| | What changes |
|---|---|
| **One visual system** | `DESIGN.md` locks typography, color, spacing, imagery, diagram language, and motion before production begins. |
| **The right tool per slide** | Native PowerPoint, image generation, SVG, browser UI, HyperFrames, Remotion, and optional Three.js are selected by purpose rather than novelty. |
| **Reusable design intelligence** | The built-in Design Atlas abstracts proven patterns from product launches, editorial technology stories, technical platforms, developer ecosystems, and enterprise communication. |
| **Honest deliverables** | Native, mixed, flattened, and replaceable-media content is declared clearly instead of calling every deck “fully editable.” |
| **Quality before delivery** | Slides are rendered and reviewed for hierarchy, consistency, readability, overflow, provenance, and motion restraint. |

## Core capabilities

- Turn a topic, document, reference deck, or company template into a complete presentation narrative.
- Preserve enterprise masters and brand rules, or establish an original design direction from the Design Atlas.
- Generate hero visuals, product concepts, realistic UI, precise technical diagrams, and data-led slides within one system.
- Create short progressive animations with HyperFrames and multi-scene product demos with Remotion.
- Add Three.js only when depth communicates product structure or spatial relationships.
- Produce PPTX, PDF, HTML, MP4, slide previews, and replaceable media assets from a shared presentation manifest.
- Keep source provenance and usage boundaries attached to external references and generated assets.
- Detect missing specialist capabilities before production and explain what must be installed for the requested result.

## Quick start

Add the marketplace:

```powershell
codex plugin marketplace add Wilder1222/presentation-director --ref main
```

Install the plugin:

```powershell
codex plugin add presentation-director@wilder1222-plugins
```

Open a new Codex task, then describe the presentation you want:

```text
Use $presentation-director to create a 12-slide AI agent product deck
based on my uploaded company template. The audience is enterprise technology
leaders and the objective is to secure approval for a pilot. Keep the
architecture slide accurate and editable; generated visuals are allowed on
product slides.
```

Presentation Director will plan the story, establish the design system, check the required capabilities, generate the necessary assets, assemble the deck, and review the rendered output.

For capability profiles, provider setup, other Agent hosts, and fallback behavior, see the [Installation and Capabilities Guide](docs/INSTALLATION.md).

## Example prompts

### Preserve a company template

```text
Use $presentation-director to update this quarterly business review.
Strictly preserve the uploaded PPTX master, typography, colors, and footer.
Keep every chart and text block editable.
```

### Launch a product

```text
Use $presentation-director to create a launch deck for an AI hardware
product. Use a restrained product-reveal language, create an original hero
visual, and produce a 10-second exploded-view sequence for slide 6.
```

### Explain a technical system

```text
Use $presentation-director to turn this technical proposal into an
8-slide executive narrative. Render architecture relationships with SVG or
native PowerPoint shapes. Do not use an image model for nodes, connectors,
or labels.
```

### Build a spatial product sequence

```text
Use $presentation-director to create a Three.js turntable and exploded
assembly for the product slide. Render through Remotion, embed the resulting
MP4, keep a static poster in the deck, and record the source and license for
every model, texture, and environment asset.
```

## Designed for the work behind great decks

Presentation Director supports the full range between strict enterprise delivery and high-impact product storytelling:

- **Executive and enterprise decks** with editable content and faithful template reuse.
- **Product launches** with original hero imagery, controlled reveals, UI demonstrations, and motion.
- **Technical presentations** with accurate architecture, topology, workflow, and platform diagrams.
- **Investor and strategy narratives** with clear pacing, evidence, metrics, and a decisive takeaway.
- **Multi-format delivery** when the same story must become a PowerPoint deck, web presentation, PDF, or video.

The plugin remains lightweight: it directs specialist capabilities instead of duplicating image models, video engines, browser tooling, or PowerPoint internals.

## Documentation

| Guide | Use it for |
|---|---|
| [Installation and Capabilities](docs/INSTALLATION.md) | Codex installation, other Agent hosts, capability profiles, provider checks, and fallback rules. |
| [Architecture](docs/ARCHITECTURE.md) | Workflow, source-of-truth contracts, renderer routing, editability, motion, and Three.js integration. |
| [Design Atlas and Reference Library](docs/DESIGN-ATLAS.md) | Design DNA, role packs, on-demand source loading, provenance, and copyright boundaries. |
| [Development and Contribution](docs/DEVELOPMENT.md) | Repository structure, workspace initialization, manifests, extension points, validation, and contribution workflow. |
| [Skill source](skills/presentation-director/SKILL.md) | The canonical orchestration rules used by compatible Agent hosts. |

## License and responsible use

Presentation Director is available under the [MIT License](LICENSE). The Design Atlas stores abstract design principles, not redistributable company templates or brand assets. Third-party references remain subject to their original rights and must be used for analysis and inspiration only.

---

<div align="center">

**A presentation should be directed as one story, not generated as a pile of slides.**

</div>
