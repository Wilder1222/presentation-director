# Specialist Handoff Contracts

## Contents

1. Style candidate board
2. Compiled provider brief
3. Shared contract
4. Image generation and product UI
5. Diagrams
6. HyperFrames
7. Remotion and optional Three.js
8. PPTX

## Style candidate board

This is the only visual artifact allowed before the final `DESIGN.md`. It is a temporary decision aid, not a deck asset.

```text
Communication job: [audience, outcome, central takeaway]
Candidate count: 2-3 materially different, task-appropriate directions
Frames per candidate: cover, core content, hardest visual role
Comparison: same 16:9 ratio, scale, and labeling for every direction
Preset evidence: use bundled catalog previews and identify the Atlas
Custom evidence: label original concept frames as generated, not sourced
Show for each: palette, typography, density, composition, imagery, diagram, motion, tradeoff
Exclude: logos, copied marketing text, exact official compositions, and mixed candidate identities
Output: tmp/style-discovery/options.webp or options.png
```

Do not use rejected candidate traits in production. After selection, resolve references and write the final design contract before invoking production providers.

## Compiled provider brief

Manifest 1.5 production handoffs originate in `presentation.json`, not an improvised provider prompt. After the narrative, storyboard, and asset briefs are complete, run `prepare-creative.mjs --strict`. Use the generated file at `tmp/provider-briefs/<slide-id>/<asset-id>.json` as the provider's task contract.

The compiled brief carries:

- the deck communication job and current audience state;
- the slide question, claim, consequence, and bridge;
- silhouette, density, focal mode, visual peak, and continuity cue;
- asset method, placement, continuity family, reuse policy, variants, dependencies, and acceptance checks;
- Design DNA, allowed signature moves, anti-defaults, and canonical output path.

Pass the JSON brief and `DESIGN.md` without deleting constraints. Provider-specific syntax may be added, but it must not change the communication job, visual system, output contract, or acceptance criteria. If the source manifest changes, regenerate the brief instead of editing the generated file.

## Shared contract

Create a specialist handoff only after capability preflight records the required capability as available and the creative plan is current. If it is missing, show installation guidance and stop; do not write a prompt that implies the provider ran. Use the provider identified by preflight rather than assuming a platform-specific skill name.

Every specialist handoff must include:

- slide id and narrative job;
- audience-facing claim;
- intended placement and aspect ratio;
- selected layout pattern;
- exact color and typography roles from `DESIGN.md`;
- relationship to surrounding slides;
- required output path and format;
- acceptance checks;
- prohibited content and rights constraints.
- design thesis, content motif, allowed signature move, and task-specific anti-defaults from `tasteProfile`.

Every input copy, source project, temporary record, and output path must resolve inside the active `presentation-director` workspace. Configure provider output and project directories explicitly; do not accept a provider's user-home or global-cache default for persistent artifacts.

Every provider output must be insertable into, or replaceable within, the final PPTX. A specialist preview, generated image, SVG, HTML page, or video is never the final presentation by itself. If a route flattens a full slide, the handoff must include the manifest's `rasterExceptionReason` and a project-local replaceable source.

Do not ask a renderer to invent the deck's style or add visual interest. The director has already locked the taste profile and visual system. Reject provider defaults that are not explicitly allowed.

## Image generation

Use this structure:

```text
Purpose: [what the image proves or makes the audience feel]
Placement: [left/right/full bleed and crop behavior]
Aspect ratio: [exact ratio]
Subject: [specific visual subject]
Composition: [camera, negative space, focal position]
Material and lighting: [concrete treatment]
Palette: [roles and hex values from DESIGN.md]
Continuity: [how it relates to other deck visuals]
Exclude: text, logos, watermarks, UI labels, and [task-specific clichés]
Avoid defaults: [tasteProfile.antiDefaults]
Earned signature move: [name, purpose, slide scope]
Output: [project-relative path]
```

Generate original assets. Do not prompt for direct replicas of company campaigns, identifiable protected characters, logos, or official product renders.

For a high-impact generative asset, render the `variantCount` declared in the compiled brief. Change composition, viewpoint, material emphasis, or focal balance meaningfully; do not treat near-identical seeds as real alternatives. Inspect candidates at the intended slide crop, then use `record-asset-selection.mjs` to preserve the candidate hashes, selected output, reviewer, and communication rationale.

For a slide with left-side copy, place the subject toward the right and preserve clean negative space on the left. Ask for the final crop, not a generic image that will be cropped later.

Do not request `premium`, `futuristic`, `cinematic`, `beautiful`, or `high-end` without translating the word into concrete composition, material, light, crop, palette, and subject constraints. Such adjectives alone amplify generic model defaults.

## Product UI capture

Provide:

```text
Product state: [exact screen and task]
Viewport: 1600x900 or another slide-safe 16:9 frame
Visible data: [realistic but non-sensitive sample values]
Primary proof: [what viewers must notice]
Interaction state: [idle/loading/success/error]
Design tokens: [from DESIGN.md]
Capture: [full viewport or component bounds]
Output: [PNG/WebP path]
```

Prefer a coherent product surface over a dashboard of decorative cards. Keep readable UI text in the generated frontend; keep slide explanation native in PowerPoint.

## Diagram handoff

Provide:

```text
Diagram question: [what relationship must become clear]
Topology: [layers/nodes/edges/order]
Edge semantics: [data/control/dependency/optional]
Label budget: [maximum words per node]
Grouping: [clusters and boundaries]
Palette and line semantics: [from DESIGN.md]
Output: [SVG path]
```

Use deterministic labels and data. Do not use image generation for node text, arrows, architecture relationships, tables, or charts.

For simple native PowerPoint diagrams, create connectors before entity nodes so edges remain behind nodes and labels.

## HyperFrames handoff

Provide:

```text
Composition purpose: [why motion materially helps]
Hero frame: [static end-state composition]
Duration: [3-15 seconds]
Scenes: [ordered beats]
Motion pattern: [from patterns/motion.md]
Required poster frame: [path]
Required video: [path]
Design source: [path to shared DESIGN.md]
```

Then invoke the detected short-motion provider. When that provider is HyperFrames, follow these non-negotiable rules:

- scaffold the composition with `npx hyperframes init <name> --non-interactive` instead of creating its structure by hand;
- read the shared `DESIGN.md`;
- lay out the most visible frame before animation;
- use deterministic synchronous GSAP timelines;
- avoid infinite repeats;
- use transitions between multi-scene compositions;
- run lint, validate, inspect, and animation-map checks.

## Remotion handoff

Provide:

```text
Video purpose: [what a static slide cannot explain]
Audience and voice: [tone]
Duration: [15-90 seconds]
Composition dimensions and fps: [usually 1920x1080, 30 fps]
Scene sequence: [ordered beats and durations]
Narration/captions: [requirements]
Poster frame: [path]
Video output: [path]
Design source: [path to shared DESIGN.md]
```

Then invoke the detected video provider. When that provider is Remotion, read its required video-layout reference and use frame-based APIs. Do not use CSS transitions or CSS animations. Render representative still frames before the full video.

### Three.js component inside Remotion

When the manifest contains `threeD`, extend the Remotion handoff with:

```text
3D purpose: [what depth, assembly, or camera movement explains]
Hero frame: [camera angle, crop, focal object, overlay safe zones]
Scene graph: [objects, groups, parent-child relationships, world scale]
Camera: [type, FOV, start/end/target, path anchors]
Materials and lighting: [roles from DESIGN.md]
Motion: [object/camera states, frame ranges, easing, hold frames]
Assets: [local GLB/glTF, textures, HDRI, source and rights]
Performance: [target hardware, pixel-ratio cap, shadow/postprocessing policy]
Fallback: [poster path and equivalent static explanation]
Acceptance: [determinism, clipping, z-fighting, legibility, loading and render checks]
```

Confirm both `video` and `three_d` are available. When the video provider is Remotion, read its 3D guidance. Use `<ThreeCanvas width={width} height={height}>`, provide lighting, set `layout="none"` on sequences inside the canvas, and drive every animated value from `useCurrentFrame()`. Never use `useFrame()`, wall-clock time, unseeded randomness, self-running mixers, or self-running shaders. Keep audience-facing copy outside perspective space unless its spatial attachment is meaningful.

## PPTX handoff

Provide the detected presentation provider with:

- `DESIGN.md`;
- `presentation.json`;
- source deck or template, if present;
- finalized assets and poster frames;
- output path;
- source notes path;
- explicit editability expectations.

The handoff must require a complete, ready-to-present PPTX rather than a code sample or partial deck. Keep audience-facing text, data, tables, charts, and simple diagrams native whenever feasible; preserve SVG, image, UI, and video assets as replaceable media with their source projects. Render every slide, run overflow checks, and open the completed PPTX in the target presentation application before delivery.

Follow the detected provider's visual route and implementation engine. Do not substitute PptxGenJS, python-pptx, or direct XML manipulation when the installed provider requires another engine.
