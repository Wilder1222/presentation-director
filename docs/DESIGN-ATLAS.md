# Design Atlas and Reference Library

The Design Atlas stores reusable presentation principles extracted from strong design systems. It contains design DNA, slide-role patterns, motion patterns, prompts, compact previews, and source provenance.

It does not redistribute company templates, logos, proprietary fonts, or marketing assets.

The Atlas is evidence, not a finished identity. Presentation Director combines the selected reference with a project-specific design thesis, content motif, productive tensions, one or two signature moves, and explicit anti-defaults. See the runtime [Design Taste contract](../skills/presentation-director/references/design-taste.md).

[Back to README](../README.md) · [Architecture](ARCHITECTURE.md) · [Development](DEVELOPMENT.md)

## Design DNA

Each Atlas entry describes abstract rules such as:

- Visual hierarchy and information density.
- Grid, whitespace, alignment, and composition.
- Typography scale and rhythm.
- Color behavior and accent usage.
- Image, product-render, and illustration direction.
- Diagram grammar.
- Motion tempo and preferred transitions.
- Slide roles where the system performs best.
- Patterns and behaviors that should be avoided.

The project `tasteProfile` supplies what a reusable Atlas cannot: why this presentation should look this way, what makes it specific to the current content, and which generated defaults must be rejected.

Built-in Design DNA includes:

| Atlas | Best suited to |
|---|---|
| Apple | Product reveals, minimal narrative, and cinematic pacing. |
| OpenAI | Editorial technology storytelling, concept explanation, and restrained visuals. |
| NVIDIA | Platform architecture, ecosystems, performance, and technical evidence. |
| GitHub | Developer collaboration, community, and state change. |
| IBM | Engineering grids, enterprise systems, and evidence-led data. |
| Google | Multi-product narratives, expressive shapes, and state transitions. |
| Spotify | Cultural rhythm, design principles, and modular systems. |
| Figma | Modular recomposition, collaboration, and creative activity. |
| Human Marketplace | Human-centered markets, trust, and two-sided journeys. |

Atlas entries use names such as `apple-product-launch-inspired` instead of implying an official template or endorsement.

## Primary and secondary references

Each presentation should have one primary design direction. Secondary references are limited to explicit slide roles.

Example:

```yaml
primary_reference: openai-editorial-inspired
secondary_references:
  - reference: nvidia-platform-architecture-inspired
    allowed_roles:
      - architecture
      - ecosystem
```

Secondary references may influence composition or diagram language, but they must not override the global typography, palette, or brand rules locked in `DESIGN.md`.

## Style decision modes

Presentation Director supports three routes:

- `specified`: preserve a supplied template or follow a user-provided direction.
- `auto`: score the presentation objective and characteristics, select one best-fit direction, record the rationale, and continue without a checkpoint.
- `recommend`: produce 2-3 visual candidates and a comparison board, then wait for the user's selection.

When no style is supplied, recommendation is the default unless the user delegates the decision or asks for uninterrupted delivery.

After a preset is selected, its source ids are resolved and the smallest relevant raw source set is loaded when official PDF links exist. A non-Atlas custom direction triggers official-source-first web research and remains local to that presentation project.

## Role packs

Role packs provide targeted patterns for a small group of slides. Included packs cover:

- Cloudflare.
- Stripe.
- Vercel.
- Snowflake.
- Adobe.
- Salesforce.
- BCG.

These packs support roles such as platform architecture, developer workflow, data cloud, ecosystem, comparison, operating model, and strategic recommendation. They are not full-deck themes.

## Reference library

The repository includes compact, normalized previews and source metadata. Large raw PDFs and high-resolution source assets are excluded from Git and loaded into the active presentation workspace only when required.

This structure keeps the plugin lightweight while preserving traceability:

```text
Source registry
    -> provenance and rights metadata
    -> compressed preview in the repository
    -> optional original asset in the workspace reference library
```

The fixed workspace location is:

```text
<current-directory>/presentation-director/reference-library
```

Raw PDFs are stored under `reference-library/raw`. Selected pages, captures, and review sheets remain beside them. User-home and system-global caches are not used.

## On-demand source loading

List registered sources without downloading them:

```powershell
node .\skills\presentation-director\scripts\collect-reference-library.mjs --workspace .\presentation-director --list
```

Load one selected source:

```powershell
node .\skills\presentation-director\scripts\collect-reference-library.mjs --workspace .\presentation-director --source <source-id>
```

Add `--include-heavy` for a source marked `heavy`. Use `--all` only when intentionally rebuilding the entire workspace reference library.

The library is manually maintained. Presentation Director does not monitor external sites or automatically expand the source registry.

## Provenance requirements

Each external source record should include:

- Source owner.
- Original title and URL.
- Source type and publication date when known.
- Local cache status.
- Permitted use and redistribution status.
- Notes about what design principle was extracted.

When an external reference, fact, or asset materially influences a slide, preserve the source in speaker notes or the presentation manifest.

## Copyright and brand boundaries

Source code and original documentation are licensed under MIT. That license does not alter rights attached to third-party references.

Do not:

- Redistribute public company materials as commercially reusable templates.
- Copy third-party logos, official marketing copy, proprietary fonts, or proprietary product assets.
- Reproduce an exact page composition when creating public output.
- Describe an inspired theme as an official company template.
- Imply endorsement by a referenced company.

Public outputs should use abstract or `*-inspired` names and original content. External screenshots, PDFs, brand names, fonts, 3D models, textures, and other assets remain subject to their original licenses and terms.

## Atlas maintenance

Atlas updates are intentional and manual:

1. Add or update a source in the registry.
2. Record rights and provenance.
3. Create a compact preview when permitted.
4. Extract general design principles.
5. Update the relevant Atlas or role-pack YAML.
6. Validate metadata, paths, and preview integrity.

Development instructions for adding an Atlas entry are in the [Development and Contribution Guide](DEVELOPMENT.md).
