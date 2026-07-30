# Renderer and Output Routing

## Contents

1. Capability routing
2. Output and slide-role routing
3. Design-reference routing
4. Image and motion routing
5. Editability
6. Motion budget

## Route capabilities before renderers

Use `dependencies.json` and the current `capabilityProfile` as the source of truth. Do not assign a renderer merely because its documentation exists.

| Renderer | Required capability |
|---|---|
| `native_ppt` | `presentation` |
| `image_slide` | `image_generation` |
| `svg` | Director core only |
| `ui_capture` | `ui_capture` |
| `hyperframes_video` | `short_motion` |
| `remotion_video` | `video` |
| `remotion_video` with `threeD` | `video` and `three_d` |

If a capability is missing, present its installation guidance and stop. A fallback is a user decision, not an automatic renderer choice. After explicit approval, rerun capability preflight with `--approve-fallbacks --write` and replace every unsupported renderer in `presentation.json` before asset generation.

## Choose the output route

| Need | Primary route | Required companion | Fallback |
|---|---|---|---|
| Editable PowerPoint | PPTX with native objects | `presentation` provider | Static PPTX with replaceable media |
| Existing company template | Duplicate and edit source layouts | `presentation` provider with template support | Ask for a usable PPTX/POTX if parsing fails |
| Original hero or concept art | Raster asset | `image_generation` provider | Typographic or licensed sourced-image composition |
| Exact simple architecture/process | Native PPT shapes | `presentation` provider | SVG |
| Complex topology/network | Graphviz or deterministic SVG | diagram tooling + `presentation` provider | Simplify topology |
| Product UI | HTML/React capture | `ui_capture` + `presentation` providers | Native framed screenshot |
| Spatial product or assembly animation | Remotion video with optional Three.js component | `video` + `three_d` + poster | 3D still, isometric SVG, or static storyboard |
| 3–15 second slide motion | MP4/WebM + poster | `short_motion` provider | Progressive static build |
| 15–90 second demo/video | MP4 + poster | `video` provider | Short motion summary or static storyboard |
| Full web presentation | HTML runtime | HyperFrames or a dedicated HTML-slide route | PPTX/PDF |

## Assign renderers by slide role

| Slide role | Default renderer | Use another renderer when |
|---|---|---|
| cover / hero | `native_ppt` | Use `image_slide` for a true visual statement; use motion only for a major reveal |
| giant claim / quote | `native_ppt` | Use `image_slide` only when the background is the message |
| metrics / chart / table | `native_ppt` | Use `svg` for a custom but exact chart |
| architecture / process | `native_ppt` or `svg` | Use `hyperframes_video` when sequence or data flow is central |
| product UI | `ui_capture` | Use `hyperframes_video` for a short interaction; Remotion for a narrated demo or meaningful device/space visualization |
| comparison | `native_ppt` | Use `svg` when geometry is specialized |
| roadmap | `native_ppt` or `svg` | Use short motion only when stages must reveal progressively |
| closing / decision | `native_ppt` | Use a restrained visual asset for emotional closure |

## Route design references

- Use `specified` when the user provides direction, `auto` when the user delegates the choice, and `recommend` when alternatives are requested or direction is absent. Read `style-discovery.md` before resolving the route.
- Score style fit against audience, objective, narrative, density, visual roles, editability, delivery environment, and motion usefulness.
- In recommend mode, show 2-3 visual candidates and wait. In auto mode, select one and record the rationale without adding a checkpoint.
- Choose exactly one primary Atlas for the whole deck.
- When a selected preset has official raw links, load the smallest relevant raw source set before locking `DESIGN.md`.
- When a selected direction is not represented by the Atlas, require web reference research, prioritize official sources, and store direct URLs. Do not add task-specific research to the global Atlas automatically.
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

### Optional Three.js component

Use Three.js only inside `remotion_video` in this plugin version. Select it when depth, assembly, or camera position explains the claim: product turntables, exploded assemblies, spatial layer builds, or short camera paths. Do not use it for ordinary architecture, charts, tables, roadmaps, or decorative “tech” backgrounds.

Read [renderers/threejs.md](renderers/threejs.md), add a `## 3D Direction` section to `DESIGN.md`, and declare `threeD` in the slide manifest. Use `@remotion/three` and React Three Fiber, keep all animation frame-driven, and deliver both a rendered video and poster. HyperFrames may composite the finished clip but must not own an unsynchronized WebGL loop.

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
