# Specialist Handoff Contracts

## Shared contract

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

Do not ask a renderer to invent the deck's style. The director has already locked it.

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
Output: [project-relative path]
```

Generate original assets. Do not prompt for direct replicas of company campaigns, identifiable protected characters, logos, or official product renders.

For a slide with left-side copy, place the subject toward the right and preserve clean negative space on the left. Ask for the final crop, not a generic image that will be cropped later.

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
Motion pattern: [from motion-patterns.md]
Required poster frame: [path]
Required video: [path]
Design source: [path to shared DESIGN.md]
```

Then invoke the HyperFrames skills and follow their non-negotiable rules:

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

Then invoke `remotion-best-practices`, read its required video-layout reference, and use frame-based APIs. Do not use CSS transitions or CSS animations. Render representative still frames before the full video.

## PPTX handoff

Provide the `Presentations` skill with:

- `DESIGN.md`;
- `presentation.json`;
- source deck or template, if present;
- finalized assets and poster frames;
- output path;
- source notes path;
- explicit editability expectations.

Follow the active Presentations skill's visual route and implementation engine. Do not substitute PptxGenJS, python-pptx, or direct XML manipulation when the installed skill requires another engine.
