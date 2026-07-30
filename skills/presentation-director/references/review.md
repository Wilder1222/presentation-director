# Review and Acceptance

## Contents

1. Workspace validation
2. Style decision and reference review
3. Narrative and visual review
4. PPTX checks
5. HyperFrames and Remotion checks
6. Rights, provenance, and delivery disclosure

## 1. Workspace validation

Run:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform <platform> --project <project-dir> --profile <requested-mode> --write
node <skill-dir>/scripts/validate-workspace.mjs <project-dir>
```

Do not use `--allow-draft` for delivery. Fix every error. Inspect warnings rather than suppressing them automatically.

Confirm that `capabilityProfile.checkedAt` is current, every selected renderer maps to an available capability, and any missing requested capability has an explicit fallback approval plus a corresponding renderer change. A list of installation instructions is not proof that a provider is installed.

## 2. Style decision and reference review

- `styleDecision.mode` matches what the user requested: specified, automatic, or recommendation.
- Recommendation mode includes materially distinct visual options and a readable comparison board.
- Automatic mode records a concise fit rationale and does not pretend the user approved a checkpoint they delegated.
- The final `DESIGN.md` contains only the selected direction; rejected candidate traits do not leak into it.
- A selected preset with raw links has loaded and recorded the smallest relevant raw source set.
- A selected custom direction has completed direct-source web research with at least one official or first-party source.
- Source observations are translated into safe design principles rather than copied assets or exact compositions.
- Reference depth, raw status, research status, direct URLs, and rights are recorded accurately.

## 3. Narrative review

- The communication job is clear and the closing resolves it.
- Every slide has one narrative job and one primary claim.
- Titles state takeaways rather than topics.
- Evidence is followed by meaning or consequence.
- Adjacent slides form a coherent sequence without repeated beats.
- Visible copy is audience-facing and contains no production language.

## 4. Visual review

- The deck uses one visual identity and one global palette.
- Secondary reference styles are restricted to their declared slide roles.
- Adjacent slide silhouettes vary without breaking the grid.
- Titles intended for one line do not wrap.
- Text meets the template size or default minimums.
- Crops, focal positions, image resolution, and color grading are consistent.
- The same image is not reused without a deliberate system reason.
- Architecture labels, charts, tables, and exact UI copy are not raster hallucinations.

## 5. PPTX checks

Follow the presentation provider recorded by capability preflight. At minimum:

1. Render every slide.
2. Inspect each slide individually at full size.
3. Use a montage only for deck-level rhythm and consistency.
4. Run the presentation overflow test.
5. Fix unintended overlaps, clipping, wrapping, broken connectors, unresolved placeholders, chart/data mismatches, and inconsistent footers.
6. Confirm `[Sources]` blocks exist in speaker notes where required.
7. Open representative slides that use media and verify their poster frames and crop behavior.

## 6. HyperFrames checks

Run the commands required by the installed HyperFrames skills:

```text
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect
```

For new or materially changed choreography, generate and inspect the animation map. Resolve contrast warnings, accidental overflow, collisions, invisible final states, dead zones, and pacing flags. Confirm every multi-scene transition follows the HyperFrames scene-transition contract.

Render final media with an explicit output path and final quality, for example:

```text
npx hyperframes render --quality high --output <project-relative-output.mp4>
```

## 7. Remotion checks

- Render representative stills at the opening, each scene midpoint, each transition, and the final frame.
- Verify safe margins, text fit, asset loading, and captions before a full render.
- Confirm all animation is derived from frames and deterministic data.
- Confirm no CSS transition or CSS animation is used.
- Verify audio duration, captions, and final composition duration when present.

### Three.js component checks

- Inspect the poster, opening frame, major camera anchors, maximum-depth frame, and final frame.
- Confirm the focal object stays inside slide-safe margins and native overlay text remains readable.
- Check near/far clipping, z-fighting, inverted normals, broken transparency, missing textures, aliasing, shadow noise, and overexposure.
- Confirm materials, lighting, depth treatment, and camera motion follow `DESIGN.md`.
- Confirm `<ThreeCanvas>` has explicit dimensions and all model, camera, material, shader, and procedural animation is driven by `useCurrentFrame()`.
- Render the same representative frame twice and reject nondeterministic differences.
- Verify every model, texture, and environment asset loads locally and carries source and rights metadata.
- Confirm the poster preserves the same claim without motion and reject 3D that is less legible than its 2D alternative.

## 8. Rights and provenance

- User-supplied assets are tracked as local sources.
- External claims and assets have direct source URLs or files.
- Named-company references remain link-only unless the user provides licensed files.
- Outputs use `*-inspired` descriptions and do not imply endorsement.
- Logos, proprietary imagery, exact layouts, and proprietary fonts are not copied without authorization.

## 9. Delivery disclosure

State concisely:

- requested and resolved capability modes;
- any capability that remained unavailable and the fallback the user approved;
- delivered formats;
- which slides contain replaceable images or video;
- which slides are flattened, if any;
- whether animation is native, embedded video, or a separate HTML/video deliverable;
- which embedded videos contain Three.js-rendered 3D and which poster is used as fallback;
- any verified compatibility limitation.

Do not call a deck fully editable if it contains flattened or replaceable-media slides without explaining the distinction.
