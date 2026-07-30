# Three.js 3D Component

Three.js is an optional spatial-visual component inside the existing Remotion video route. It is not a deck-wide renderer, a PowerPoint-native format, or a replacement for precise 2D diagrams.

## Contents

1. Use it only when depth carries meaning
2. Runtime boundary
3. Required design direction
4. Remotion implementation rules
5. Asset and provenance rules
6. Supported motion patterns
7. Anti-patterns
8. Required deliverables

## Use it only when depth carries meaning

Good uses:

- a product turntable that reveals form or finish;
- an exploded assembly that explains component relationships;
- spatial layers where containment or depth is the message;
- a short camera path between a few meaningful anchors;
- a physical or volumetric data view with an explicit legend.

Keep native PPT or deterministic SVG for architecture labels, processes, charts, tables, roadmaps, and dense information. Do not convert a clear 2D explanation into 3D merely for visual novelty.

## Runtime boundary

Use:

```text
Three.js scene model
  -> React Three Fiber
  -> @remotion/three <ThreeCanvas>
  -> Remotion frame timeline
  -> MP4/WebM + poster
  -> replaceable media in PPTX
```

Do not add Three.js, React Three Fiber, model decoders, or runtime assets to this plugin package. Install compatible project-local dependencies only after a slide has selected the 3D route.

HyperFrames may composite a finished 3D clip with typography and slide motion. It should not own an independently running WebGL loop.

## Required design direction

Before scene implementation, add `## 3D Direction` to the project `DESIGN.md` and define:

- purpose and focal object;
- hero frame and overlay safe zones;
- world scale and object hierarchy;
- camera type, field of view, start/end positions, target, and path anchors;
- material roles, roughness, reflectivity, and brand-color usage;
- key, fill, rim, environment, and shadow treatment;
- background, atmosphere, depth cues, and postprocessing limits;
- reveal order, hold frames, tempo, and easing;
- target rendering hardware and performance limits;
- poster frame and equivalent static explanation.

Keep titles, claims, sources, and most labels as native HTML or PowerPoint overlays. Put text into perspective space only when its attachment to the model carries meaning.

## Remotion implementation rules

Confirm `video` and `three_d` are available, then invoke the detected video provider. When that provider is Remotion, follow its 3D reference. At minimum:

- install compatible project-local versions of `three`, `@react-three/fiber`, `@remotion/three`, and `@types/three`;
- wrap all 3D content in `<ThreeCanvas>` with explicit `width` and `height`;
- provide intentional lighting;
- derive every animated model, camera, material, shader, and procedural value from `useCurrentFrame()` and deterministic inputs;
- never use `useFrame()`, `requestAnimationFrame()`, wall-clock time, self-running mixers, or unseeded randomness;
- set `layout="none"` on a Remotion `<Sequence>` inside `<ThreeCanvas>`;
- use the ANGLE Chromium OpenGL renderer when the render environment requires it;
- render representative stills before the full video.

Seed procedural variation and make it a pure function of manifest inputs and frame number.

## Asset and provenance rules

- Prefer local GLB/glTF runtime models.
- Track the source, rights, and transformation history of every model, texture, HDRI, font, and decoder-dependent asset.
- Use Draco, Meshopt, or KTX2 only when the composition installs and verifies the matching decoder.
- Avoid render-time CDN dependencies.
- Keep model and texture assets in the presentation workspace, not in the plugin or reference library.
- Dispose of replaced geometries, materials, textures, and image bitmaps during interactive previews.

## Supported motion patterns

### product-orbit-reveal

Establish the hero angle, use a restrained orbit or object turntable, stop at one proof angle, then hold for the native callout. Avoid perpetual spinning.

### exploded-assembly

Show the whole, separate components along meaningful axes, emphasize one relationship, optionally reassemble, then hold. Avoid physics-driven explosions.

### spatial-layer-build

Reveal a base and its dependent layers along one consistent depth axis, show the active relationship, then finish on a readable system view. Reject it when the 2D version is clearer.

### camera-path-explain

Move between a small number of manifest-defined anchors. Each stop must explain a new fact. Avoid wandering or spectacle-only camera motion.

## Anti-patterns

- glowing globes, particle tunnels, neon grids, floating cubes, or starfields without narrative meaning;
- excessive bloom, depth of field, motion blur, or reflections that obscure the object;
- tiny labels inside perspective space;
- high device pixel ratio, full-resolution textures, and expensive shadows by default;
- animation that produces different output on repeated renders;
- 3D used as a background while the slide's real information remains unrelated.

## Required deliverables

Every 3D composition must produce:

1. a project-local scene source;
2. a final MP4 or WebM rendered by Remotion;
3. a static poster frame used by PPTX/PDF and as failure fallback;
4. provenance records for all 3D assets;
5. representative QA stills at camera and motion anchors;
6. a fallback statement that preserves the slide claim without motion;
7. `editability: replaceable-media` in the manifest.
