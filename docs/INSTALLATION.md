# Installation and Capabilities

This guide covers host installation, capability profiles, provider detection, and fallback behavior for Presentation Director.

[Back to README](../README.md) · [Architecture](ARCHITECTURE.md) · [Development](DEVELOPMENT.md)

## Requirements

- Codex Desktop/CLI, Claude Code, GitHub Copilot, Gemini CLI, Cursor, or another Agent Skills-compatible host.
- Node.js 18 or newer for workspace and capability validation scripts.
- Access to this repository from the environment where the Agent runs.
- The specialist capabilities required by the selected production profile.

Three.js dependencies are optional and should be installed only in presentation projects that use 3D.

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
| `visual-studio` | Static Studio, image generation, and browser-based UI capture. |
| `motion-studio` | Visual Studio, short motion, and multi-scene video. |
| `full-studio` | Complete general workflow; 3D remains on demand. |
| `spatial-studio` | Full Studio plus Three.js, React Three Fiber, and `@remotion/three`. |

The profile names describe verified capability sets. A partial installation must never be reported as Full Studio.

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
- Command providers must be available on `PATH`.
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
