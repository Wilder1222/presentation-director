# Creative Planning Contract

## Purpose

Manifest 1.5 compiles the story, visual rhythm, asset decomposition, and specialist handoffs before production begins. This gate improves narrative continuity and material quality without adding a heavy rendering dependency.

## Author the source fields

Lock `narrative` with:

- `communicationJob`, `audienceStartingPoint`, and `audienceEndState`;
- `stakes`, `arc`, `turningPointSlideId`, and `resolution`;
- `status: locked` only after the title sequence forms a causal argument.

Every slide requires:

```json
{
  "narrativeBeat": {
    "question": "What question is live at this point?",
    "evidenceType": "data",
    "consequence": "Why the answer matters now",
    "bridgeToNext": "What the next slide must resolve"
  },
  "visualPlan": {
    "silhouette": "asymmetric-evidence-field",
    "density": "medium",
    "focalMode": "data",
    "visualPeak": false,
    "continuityCue": "The evidence margin advances one checkpoint"
  }
}
```

`evidenceType` is `reasoning`, `source`, `data`, `product`, `demo`, `testimony`, or `none`. `density` is `low`, `medium`, or `high`; `focalMode` is `type`, `image`, `diagram`, `data`, `ui`, `motion`, or `mixed`.

Every asset requires a brief with `purpose`, `method`, `role`, `placement`, `continuityKey`, `reusePolicy`, `selectionMode`, `variantCount`, `dependencies`, and at least two concrete `acceptance` checks. Use:

- `deterministic` for exact diagrams, charts, and defined UI states;
- `single` for low-risk supporting assets;
- `variants` with two to four candidates for hero, concept, material, or other high-impact generative work.

## Compile before production

Run:

```text
node <skill-dir>/scripts/prepare-creative.mjs <project-dir> --strict
```

Resolve all issues. The compiler writes:

- `tmp/creative/narrative-map.json` for the causal title and beat sequence;
- `tmp/creative/storyboard.json` for silhouette, density, focal mode, and visual peaks;
- `tmp/creative/asset-plan.json` for methods, dependencies, continuity families, outputs, and safe execution waves;
- `tmp/provider-briefs/<slide-id>/<asset-id>.json` for immutable provider handoffs;
- `tmp/creative/report.json` and `tmp/provider-briefs/index.json` for validation.

Any later change to the narrative, slide title, claim or content, renderer, visual plan, asset brief, motion intent, or 3D intent makes the creative plan stale. Recompile before locking design or preparing a build.

## Produce and select assets

Give each provider its generated JSON brief plus `DESIGN.md`; do not rewrite the prompt freehand. Keep candidate outputs inside the project workspace.

For every `variants` asset, record the inspected candidate set and canonical choice. The same command may optionally preserve review evidence for `single` or `deterministic` assets:

```text
node <skill-dir>/scripts/record-asset-selection.mjs <project-dir> \
  --slide s01 --asset hero-product \
  --candidate a=assets/generated/images/candidates/hero-a.webp \
  --candidate b=assets/generated/images/candidates/hero-b.webp \
  --selected b --reviewer director \
  --rationale "B preserves the title safe zone and makes the product mechanism legible."
```

The command hashes every candidate and provider brief, copies the selection to the asset's canonical path, and records provenance in both `presentation.json` and `tmp/asset-selections.json`.

## Lock and review

Run `lock-design.mjs` only after the creative plan is current. Manifest 1.5 stores its digest in the representative design lock and build plan. A cache hit never replaces narrative, continuity, crop, material, or visual-quality review.
