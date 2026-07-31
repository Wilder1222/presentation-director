# Changelog

All notable changes to Presentation Director are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.9.0]: https://github.com/Wilder1222/presentation-director/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Wilder1222/presentation-director/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Wilder1222/presentation-director/compare/v0.3.0...v0.7.0
[0.3.0]: https://github.com/Wilder1222/presentation-director/releases/tag/v0.3.0
