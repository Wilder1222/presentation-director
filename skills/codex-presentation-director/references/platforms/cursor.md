# Cursor Adapter

Use this adapter in Cursor IDE or Cursor CLI.

## Distribution

Import or copy the complete skill directory to `.cursor/skills/codex-presentation-director/` for a project installation, or to the corresponding user skill directory. Preserve `references/`, `scripts/`, and `assets/` beside `SKILL.md`.

## Dependency behavior

- Run `check-capabilities.mjs --platform cursor` before asset generation.
- Cursor image generation can satisfy `image_generation` only when it is enabled and discoverable to the agent.
- Browser, motion, and presentation providers must be detected as Skills, packages, or commands.
- Show the report's verified installation guidance for missing capabilities.
- Require explicit fallback approval and change the renderer before final delivery.
