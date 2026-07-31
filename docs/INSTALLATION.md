# Installation and Capabilities

This guide covers host installation, capability profiles, provider detection, and fallback behavior for Presentation Director.

[Back to README](../README.md) · [Architecture](ARCHITECTURE.md) · [Development](DEVELOPMENT.md)

## Requirements

- Codex Desktop/CLI, Claude Code, GitHub Copilot, Gemini CLI, Cursor, or another Agent Skills-compatible host.
- Node.js 18 or newer for workspace and capability validation scripts.
- Access to this repository from the environment where the Agent runs.
- The specialist capabilities required by the selected production profile.

Full Studio also checks production-grade raster processing, SVG optimization, deterministic graph layout, and media inspection. Install Node packages inside the presentation workspace. Portable Graphviz and FFmpeg binaries may live under `presentation-director/tools/`; the checker records their resolved paths. Three.js remains optional and should be installed only in projects that use 3D.

Browser or web-research capability is required on demand when a selected visual direction is not represented by the bundled Design Atlas.

## Workspace location

Presentation Director creates `./presentation-director/` under the current directory. Copied inputs, raw references, generated assets, browser captures, renderer source projects, temporary records, and final outputs stay inside that workspace. No user-home or system-global reference cache is used.

## Install in Codex

Add the Presentation Director marketplace:

```powershell
codex plugin marketplace add Wilder1222/presentation-director --ref main
```

Install the plugin:

```powershell
codex plugin add presentation-director@wilder1222-plugins
```

Open a new Codex task after installation so the Skill can be discovered.

Invoke it with:

```text
Use $presentation-director to create a presentation from this brief.
```

## Other Agent hosts

The repository contains a Claude Code plugin manifest, a Gemini extension manifest, and a standards-based `SKILL.md` that GitHub Copilot and Cursor can discover from a supported skills directory.

| Host | Adapter | Installation approach |
|---|---|---|
| Claude Code | `.claude-plugin/plugin.json` | Add the repository as a trusted plugin source or copy the Skill into a configured Claude skills directory. |
| Gemini CLI | `gemini-extension.json` | Install or link the repository as an extension so the root `skills/` directory is visible. |
| GitHub Copilot | `SKILL.md` | Copy or link `skills/presentation-director` into a Copilot-supported Agent Skills directory. |
| Cursor | `SKILL.md` | Copy or link `skills/presentation-director` into a Cursor-supported Agent Skills directory. |

The canonical Skill remains under `skills/presentation-director`; host adapters must not fork its behavior. Run preflight with `--platform claude-code`, `copilot`, `gemini`, or `cursor` after installation.

## Capability profiles

Presentation Director is useful on its own for narrative, reference selection, manifests, routing, and review. Complete production workflows depend on specialist providers.

| Profile | Required capabilities |
|---|---|
| `director-core` | Planning, reference selection, routing, and review contracts. |
| `static-studio` | Editable presentation output. |
| `visual-studio` | Static Studio, image generation, browser UI capture, and Sharp raster processing. |
| `motion-studio` | Visual Studio, short motion, multi-scene video, FFmpeg, and ffprobe. |
| `full-studio` | Motion Studio plus SVGO and Graphviz production tooling; 3D remains on demand. |
| `spatial-studio` | Full Studio plus Three.js, type definitions, React Three Fiber, and `@remotion/three`. |

`reference_research` is an on-demand capability rather than a production profile. After selecting a custom style, rerun preflight with `--require reference_research` so the Agent can search official sites and direct web sources.

The profile names describe verified capability sets. A partial installation must never be reported as Full Studio.

Install project-local Node production tools when the selected profile requires them:

```powershell
Set-Location .\presentation-director
npm install sharp svgo
npm install three @types/three @react-three/fiber @remotion/three  # only for Spatial Studio
```

Install Graphviz and FFmpeg normally, or keep portable executables beneath `presentation-director/tools/`. Required command pairs are `dot` and `ffmpeg` + `ffprobe`.

## Capability preflight

Run preflight for an existing presentation project:

```powershell
node .\skills\presentation-director\scripts\check-capabilities.mjs `
  --platform codex `
  --project D:\presentations\agent-platform `
  --profile full-studio `
  --write
```

The checker records what is actually available instead of assuming that a documented integration is installed:

- Skills must be discoverable in a supported skills directory.
- Project packages must exist under `node_modules`.
- Command providers must be available on `PATH` or discoverable beneath the active workspace's `tools/` directory.
- A dependency declaration alone does not count as an installation.

When a required capability is missing, the checker reports:

- The requested and currently resolved profiles.
- The missing capability and the output it blocks.
- Installation guidance for the active Agent host.
- The exact effect of using a fallback.

## Missing providers and fallbacks

Production must pause when a required provider is missing. The Agent should use a verified native installation action when the host exposes one; otherwise it should present the platform-specific instructions from the dependency registry.

A fallback may be used only after the user explicitly approves the loss of capability. Rerun preflight with:

```powershell
node .\skills\presentation-director\scripts\check-capabilities.mjs `
  --platform codex `
  --project D:\presentations\agent-platform `
  --profile full-studio `
  --approve-fallbacks `
  --write
```

Unsupported renderers must then be replaced in `presentation.json`. The final delivery should state the resolved capability profile and any approved downgrade.

## Capability responsibilities

Presentation Director coordinates:

- Narrative planning and slide roles.
- Design direction and reference selection.
- Renderer and motion routing.
- Asset planning and editability declarations.
- Source, copyright, and brand boundaries.
- Screenshot, structure, and motion review.

Specialist providers perform:

- Editable PowerPoint construction.
- Image generation.
- Browser-based UI rendering and capture.
- SVG and graph rendering.
- Short-form animation.
- Multi-scene video and optional 3D composition.

Presentation Director does not reimplement image models, browser tooling, video engines, or PowerPoint XML.
