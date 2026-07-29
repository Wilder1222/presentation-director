# Renderer and Output Routing

## Choose the output route

| Need | Primary route | Required companion | Fallback |
|---|---|---|---|
| Editable PowerPoint | PPTX with native objects | `Presentations` | Static PPTX with replaceable media |
| Existing company template | Duplicate and edit source layouts | `Presentations` template-following route | Ask for a usable PPTX/POTX if parsing fails |
| Original hero or concept art | Raster asset | `imagegen` | Typographic or sourced-image composition |
| Exact simple architecture/process | Native PPT shapes | `Presentations` | SVG |
| Complex topology/network | Graphviz or deterministic SVG | diagram tooling + `Presentations` | Simplify topology |
| Product UI | HTML/React capture | browser/capture tooling + `Presentations` | Native framed screenshot |
| 3–15 second slide motion | MP4/WebM + poster | `hyperframes`, `hyperframes-cli` | Progressive static build |
| 15–90 second demo/video | MP4 + poster | `remotion-best-practices` | Short HyperFrames summary or static storyboard |
| Full web presentation | HTML runtime | HyperFrames or a dedicated HTML-slide route | PPTX/PDF |

## Assign renderers by slide role

| Slide role | Default renderer | Use another renderer when |
|---|---|---|
| cover / hero | `native_ppt` | Use `image_slide` for a true visual statement; use motion only for a major reveal |
| giant claim / quote | `native_ppt` | Use `image_slide` only when the background is the message |
| metrics / chart / table | `native_ppt` | Use `svg` for a custom but exact chart |
| architecture / process | `native_ppt` or `svg` | Use `hyperframes_video` when sequence or data flow is central |
| product UI | `ui_capture` | Use `hyperframes_video` for a short interaction; Remotion for a narrated demo |
| comparison | `native_ppt` | Use `svg` when geometry is specialized |
| roadmap | `native_ppt` or `svg` | Use short motion only when stages must reveal progressively |
| closing / decision | `native_ppt` | Use a restrained visual asset for emotional closure |

## Route design references

- Choose exactly one primary Atlas for the whole deck.
- A secondary Atlas may influence only explicitly named slide roles and must retain the primary palette and typography.
- Load at most one role pack for a slide. Role packs supply narrative structure, diagram grammar, and evidence patterns—not a replacement brand identity.
- Use `cloudflare-network` for network, security, control-plane, or developer-infrastructure slides.
- Use `stripe-developer-finance` for API finance, payment flows, or economic-network slides.
- Use `vercel-product-demo` for developer-product interactions and design-engineering proof.
- Use `snowflake-saas-investor` for SaaS platform, agentic control, and product-to-growth evidence.
- Use `adobe-creative-workflow` for creative portfolios, workflows, and adoption proof.
- Use `salesforce-customer-success` for enterprise ecosystem, customer outcome, and recurring-revenue slides.
- Use `bcg-consulting-evidence` for conclusion-first executive summaries, frameworks, and transformation paths.
- Never mix a role pack's signature color, logo, proprietary type, or trade dress into the deck-wide system.

## Image generation route

Use image generation for:

- product concept renders;
- cinematic or editorial hero imagery;
- abstract backgrounds;
- human-centered contextual photography;
- illustrative metaphors.

Do not use it for:

- architecture labels or arrows;
- numerical charts;
- tables;
- screenshots that must look like a real product;
- text-heavy diagrams;
- logos or company trade dress.

Keep required text and factual labels native in the deck.

## Motion route

### Native or progressive static build

Use for a simple appear/dissolve/build when PowerPoint support is available. If the renderer cannot produce a reliable native animation, use progressive duplicate slides or a short embedded video. Do not edit OOXML animation internals inside this skill.

### HyperFrames

Use for deterministic, layout-led motion that fits a slide-sized sequence:

- architecture node/edge builds;
- state transitions;
- product UI highlights;
- title and section reveals;
- short loops and slide backgrounds.

Keep duration between 3 and 15 seconds by default. Use the same `DESIGN.md`, build the static hero frame first, use finite timelines, and run lint, validate, inspect, and animation-map checks.

### Remotion

Use for:

- multi-scene demos;
- voiceover and captions;
- data-driven or parameterized videos;
- product stories longer than one slide beat;
- batch variants.

Keep duration between 15 and 90 seconds by default. Use frame-based Remotion APIs; do not use CSS transitions or CSS animations.

## Editability route

- `native`: all meaningful content remains editable PowerPoint content.
- `mixed`: text and framing are native; a diagram or visual is replaceable media.
- `replaceable-media`: the primary media is flattened, but can be swapped without rebuilding the slide.
- `flattened`: the slide is effectively a single image. Use only with explicit acceptance or for low-editability visual statements.

Do not describe a deck as fully editable if any slide is `replaceable-media` or `flattened` without explaining the distinction.

## Default motion budget

```json
{
  "maxVideoSlides": 3,
  "maxTotalVideoSeconds": 45,
  "maxTransitionStyles": 2
}
```

Exceed the budget only when motion is a primary deliverable and the user accepts the runtime and editing tradeoff.
