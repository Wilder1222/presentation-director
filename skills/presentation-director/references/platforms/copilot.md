# GitHub Copilot Adapter

Use this adapter with GitHub Copilot CLI, Copilot cloud agent, or VS Code agent mode.

## Distribution

Copilot can load the shared Agent Skill directly. For CLI installation from the repository, use the supported skill installer against:

```text
skills/presentation-director/SKILL.md
```

For repository-local discovery, package or copy the skill to `.github/skills/presentation-director/` or `.agents/skills/presentation-director/` without changing its internal relative paths.

## Dependency behavior

- Run `check-capabilities.mjs --platform copilot` before asset generation.
- Treat scripts and local CLI packages as providers only when detected by preflight.
- Copilot does not provide this project with a universal cross-plugin dependency resolver; show verified installation instructions rather than guessing package or marketplace names.
- Require explicit fallback approval before replacing a requested renderer.
