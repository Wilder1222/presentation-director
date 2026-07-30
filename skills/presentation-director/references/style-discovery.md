# Style Discovery and Reference Research

## Contents

1. Select a decision mode
2. Score the presentation characteristics
3. Build visual candidates
4. Resolve the selected reference
5. Load preset raw sources
6. Research a custom direction
7. Record the decision
8. Rights and failure rules

## 1. Select a decision mode

Set exactly one `styleDecision.mode`:

- `specified`: the user supplies a PPTX/POTX, brand system, named style, or usable visual reference.
- `auto`: the user delegates the choice, requests a one-shot result, or asks to avoid intermediate confirmation.
- `recommend`: the user requests alternatives, or gives no style direction and has not delegated the choice. This is the default for an unspecified style.

Do not ask the user to choose a mode when their wording already makes it clear.

## 2. Score the presentation characteristics

Evaluate each direction against the communication job rather than superficial taste:

- audience and decision stakes;
- objective and desired action;
- narrative type;
- content density and evidence load;
- importance of product imagery, UI, data, or architecture;
- editability and template constraints;
- presentation environment and output format;
- motion usefulness;
- brand sensitivity and rights constraints.

Prefer the smallest visual system that can express the material clearly. Do not recommend a cinematic product-launch style for a dense regulatory review, or a consulting grid for an emotional product reveal.

## 3. Build visual candidates

For `recommend`, create three materially different but task-appropriate directions. Two are acceptable only when a third would be artificial.

Each candidate must include:

- stable id and human-readable name;
- `preset` or `custom` kind;
- one-sentence fit rationale;
- palette, typography, density, composition, imagery, diagram, and motion cues;
- best-fit slide roles and important tradeoffs;
- 3 representative frames: cover, core content, and the deck's hardest visual role;
- source or generation status.

Create one comparison board at `tmp/style-discovery/options.webp` or `.png`. Use bundled catalog previews for preset directions. A custom direction may use an original, clearly labeled concept frame; it must not pretend to be sourced material. Keep all candidates at the same aspect ratio and scale so the comparison is fair.

Present the board with concise labels and wait for a choice. Do not write the final `DESIGN.md` or produce deck assets while `styleDecision.status` is `pending`.

For `auto`, select one direction using the score above, record the rationale, and continue without a confirmation checkpoint. A single proof frame is optional but useful for high-visibility work.

For `specified`, preserve the supplied system. If the user names a company or aesthetic rather than supplying a template, treat it as a preset only when a matching Atlas entry exists; otherwise treat it as custom.

## 4. Resolve the selected reference

After selection, set:

- `selectedId` and `selectedKind`;
- `selectedAt` as an ISO timestamp;
- `rationale`;
- `referenceDepth`;
- raw and research statuses;
- selected source records.

Then complete reference resolution before writing the final design contract.

## 5. Load preset raw sources

For a selected `preset` Atlas:

1. Read its `source_ids`.
2. Resolve those ids through `assets/reference-library/sources.json`.
3. If one or more entries are `official_pdf`, choose the smallest useful set for the planned slide roles, normally one and never more than three without a clear reason.
4. Run `collect-reference-library.mjs --source <source-id>` for each chosen source. Add `--include-heavy` when the chosen source is marked heavy.
5. Use `catalog.json` to identify the relevant pages and render only those pages when higher-resolution inspection is needed.
6. Record each source id, canonical URL, cache file, selected pages, rights, and `cacheStatus: loaded`.
7. Set `rawAvailable: true`, `rawStatus: loaded`, and `referenceDepth: source`.

When no Atlas source resolves to an official raw document, set `rawAvailable: false`, `rawStatus: not-available`, and use bundled previews plus canonical web sources.

Do not download all raw files. A selected preset requires selected-source loading, not a full cache warm-up.

## 6. Research a custom direction

For `selectedKind: custom`, rerun capability preflight with `--require reference_research --write`. Do not claim completed research when that capability is unavailable.

Use Google or the host's available web search for discovery, then open and cite direct sources. Search in this order:

1. Official company, product, event, newsroom, investor, or design-system pages.
2. Official brand guidelines, presentation PDFs, first-party design publications, and official videos.
3. Reputable design case studies or technical documentation that identify their sources.
4. General inspiration sites only as secondary discovery material, never as the sole authority.

Collect 3-6 strong references rather than a large unfiltered set. At least one must be official or first-party. If none exists, report that limitation and ask the user before relying only on secondary references.

For each source, record:

- title, direct URL, publisher, authority, and retrieval date;
- what was learned about hierarchy, layout, type, color, imagery, diagrams, or motion;
- rights and reuse boundary;
- the slide roles it may influence.

Save temporary captures and notes under `tmp/style-discovery/research/`. Do not add task-specific research to the global Atlas automatically. Set `researchStatus: complete` and `referenceDepth: web-research` only after the source set is sufficient.

Search-result pages are discovery tools, not final citations. Preserve direct official URLs in `presentation.json` and speaker notes when a source materially influences the deck.

## 7. Record the decision

Use this shape in `presentation.json`:

```json
{
  "styleDecision": {
    "mode": "recommend",
    "status": "selected",
    "selectedId": "openai-editorial-inspired",
    "selectedKind": "preset",
    "selectedAt": "2026-07-30T12:00:00.000Z",
    "rationale": "Editorial hierarchy fits an evidence-led enterprise AI narrative.",
    "visualBoard": "tmp/style-discovery/options.webp",
    "candidates": [
      { "id": "openai-editorial-inspired", "name": "Editorial Intelligence", "kind": "preset" },
      { "id": "ibm-engineered-grid-inspired", "name": "Engineered Evidence", "kind": "preset" },
      { "id": "calm-operating-system", "name": "Calm Operating System", "kind": "custom" }
    ],
    "referenceDepth": "source",
    "rawAvailable": true,
    "rawStatus": "loaded",
    "researchStatus": "not-required",
    "sources": []
  }
}
```

For `auto`, candidates and a visual board are optional. For `recommend`, include at least two candidates and a local visual board. For `specified`, record whether the source is a user template, preset Atlas, or researched custom direction.

Mirror the selected direction and reference evidence into `DESIGN.md`. Candidate styles must not leak into the final design contract.

## 8. Rights and failure rules

- Learn principles; do not copy exact compositions, protected identity, logos, marketing copy, proprietary imagery, or unlicensed fonts.
- Use `*-inspired` names and do not imply endorsement.
- If a selected preset raw source fails to load, report the failure and stop reference resolution. Continue with preview-only evidence only after explicit user approval and record the exception.
- If custom web research cannot establish a sufficiently authoritative direction, ask the user to choose a preset, supply references, or approve the limited evidence.
- Do not silently substitute another style because research or download failed.
