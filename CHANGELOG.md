# Changelog

All notable changes to Presentation Director are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2026-08-01

### Added

- Manifest 1.7 Content Preference DNA for compression, evidence order, preferred and rejected content moves, speaker-note depth, and traceable inference notes.
- A compiled delivery plan with deck duration, reserve, per-slide time budgets, complementary spoken detail, semantic attention cues, and transition lines.
- Delivery-specific rubric checks evaluated by a timed rehearsal instead of static render inspection.
- `record-delivery-rehearsal.mjs` with current-plan hashes, per-slide timing evidence, tolerance enforcement, and concrete delivery rubric results.
- Manifest 1.7 build-receipt declarations for native text, shapes, charts, replaceable SVG/images, embedded video, flattened output, and conversion losses.
- A final-PPTX native-capability audit that compares opened assembled slides with build receipts, binds the report to the final file hash, and exposes assembly-stage losses.
- `output/native-capability-report.json` and `output/quality-scorecard.json`, including independent artifact and delivery scores.

### Changed

- Creative contract 1.2 now compiles content preferences and delivery timing into immutable provider handoffs.
- QA plans separate artifact checks from delivery checks, while the production task graph adds director-owned rehearsal and reporting tasks after parallel slide work.
- Final Manifest 1.7 validation requires a current passing rehearsal, complete native-capability report, and 100-point artifact and delivery scores.
- Marketplace metadata and user/developer documentation now describe rehearsed delivery and transparent editability.

### Compatibility

- Manifest 1.4–1.6 validation paths remain supported for unchanged legacy evidence. The current creative compiler targets 1.7, and new workspaces use Manifest 1.7.
- Existing Manifest 1.6 projects can upgrade by adding `contentPreference`, deck and slide `delivery` records, rerunning creative/build preparation, adding `nativeCapabilities` to build receipts, and completing rehearsal plus final report compilation.
- Version 0.11.0 adds no heavy runtime dependency; all new planning, rehearsal, and reporting behavior uses the existing local Node.js orchestration layer.

## [0.10.0] - 2026-08-01

### Added

- Manifest 1.6 evidence bundles with stable claim/source IDs, source hashes, and content-to-asset/motion alignment.
- Renderer-neutral Page Design IR with semantic regions, reading paths, focal intent, layered composition guidance, and negative-space targets.
- A compiled deck-specific binary rubric covering the communication job, audience transition, visible claims, live questions, design intent, source grounding, and custom acceptance criteria.
- Exact render observations bound to artifact, build, design, input, and rubric hashes.
- A bounded two-round minimal-repair loop for copy, layout, typography, assets, connectors, diagrams, motion, and controlled renderer fallback.
- Final validation that requires a current passing observation for every slide and the assembled deck.

### Changed

- Creative compilation now emits evidence, alignment, per-slide page-design, and deck-rubric artifacts alongside narrative, storyboard, asset, and provider-brief records.
- Provider briefs now include stable claim/source IDs and the current per-slide Page Design IR path.
- QA plans now carry task-specific rubric IDs and an explicit observation/repair policy.
- Documentation and tests now describe the full evidence-to-render quality contract.

### Compatibility

- Manifest 1.4 production projects and Manifest 1.5 creative projects remain supported by their existing validation paths.
- New workspaces use Manifest 1.6. Existing Manifest 1.5 projects can upgrade by adding `pageDesign` per slide, then rerunning `prepare-creative.mjs --strict`, representative design locking, build preparation, render observation, and QA.
- Version 0.10.0 adds no heavy runtime dependency; the new contracts and repair loop use the existing local Node.js orchestration layer.

## [0.9.0] - 2026-07-31

### Added

- Manifest 1.5 creative compilation before representative samples and parallel production.
- A locked narrative blueprint with audience starting and ending states, stakes, turning point, arc, and resolution.
- Per-slide narrative beats and visual plans for questions, consequences, bridges, silhouettes, density, focal mode, continuity, and visual peaks.
- Dependency-aware asset decomposition with production methods, continuity families, reuse policies, selection modes, concrete acceptance checks, and safe execution waves.
- Content-addressed narrative maps, storyboards, asset plans, reports, and immutable provider briefs generated under the project workspace.
- Asset candidate selection records that preserve provider-brief, candidate, and canonical output hashes.
- Integration tests covering creative compilation, brief integrity, variant selection, stale-plan rejection, and creative-aware design locking.

### Changed

- Representative design locks and incremental build plans now bind to the current creative digest.
- Specialist providers now receive compiler-generated briefs instead of freehand production prompts.
- Final validation now rejects stale creative plans, modified creative artifacts or provider briefs, incomplete variant-selection evidence, and altered selected outputs.
- New workspaces include project-local `tmp/creative/` and `tmp/provider-briefs/` directories.

### Compatibility

- Manifest 1.0–1.4 workspaces remain readable by the validator.
- New workspaces use Manifest 1.5; upgrade an existing project by adding the narrative, slide visual-planning, and structured asset-brief fields, then run `prepare-creative.mjs --strict`.
- Version 0.9.0 adds no heavy runtime dependency; it orchestrates the providers and production tools already declared by the selected capability profile.

## [0.8.0] - 2026-07-31

### Added

- Representative sample approval and a content-addressed design lock before full-deck production.
- Incremental slide builds based on design, manifest, input, and output hashes.
- Bounded parallel task graphs with isolated slide build capsules and exclusive output ownership.
- Risk-based iteration review plus mandatory final full-deck QA evidence.
- Production capability detection for Sharp, SVGO, Graphviz, FFmpeg, and ffprobe.
- Project-local tool discovery beneath `presentation-director/tools/`.
- Integration tests covering design lock, cache reuse, parallel planning, QA, and capability detection.
- Manifest 1.4 production state and validation contracts.

### Changed

- Full Studio now verifies production raster, SVG, graph-layout, and media tooling.
- Spatial Studio now requires `@types/three` alongside Three.js, React Three Fiber, and `@remotion/three`.
- Final validation rejects stale design locks, missing or changed build outputs, invalid receipts, overlapping worker paths, missing slide QA, and absent final review.

### Compatibility

- Manifest 1.0–1.3 workspaces remain readable by the validator.
- New workspaces use Manifest 1.4 and its production evidence requirements.
- Existing users should rerun capability preflight after updating to 0.8.0.

## [0.7.0] - 2026-07-30

### Added

- Ready-to-present, narrative-led, high-fidelity, native-first delivery contract.
- Adaptive style selection with automatic, candidate, and user-specified modes.
- Content-specific Design DNA, anti-default rules, and content-swap validation.
- Workspace-local raw reference loading with traceable source links.
- Optional deterministic Three.js scenes inside the Remotion route.
- Cross-host adapters for Codex, Claude Code, Gemini CLI, Copilot, and Cursor.

### Changed

- Renamed the plugin and repository to `presentation-director`.
- Split architecture, installation, Design Atlas, and developer material out of the product README.

## [0.3.0] - 2026-07-29

### Added

- Codex marketplace metadata, icon, and showcase screenshots.
- Capability profiles, provider preflight, and explicit fallback approvals.
- MIT license.

[0.11.0]: https://github.com/Wilder1222/presentation-director/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Wilder1222/presentation-director/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Wilder1222/presentation-director/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Wilder1222/presentation-director/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Wilder1222/presentation-director/compare/v0.3.0...v0.7.0
[0.3.0]: https://github.com/Wilder1222/presentation-director/releases/tag/v0.3.0
