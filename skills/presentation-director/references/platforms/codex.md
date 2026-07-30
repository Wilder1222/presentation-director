# Codex Adapter

Use this adapter when the host is Codex Desktop or Codex CLI.

## Preflight

Run before creating `DESIGN.md`:

```text
node <skill-dir>/scripts/check-capabilities.mjs --platform codex --project <project-dir> --profile <profile> --write
```

Use `full-studio` for general full capability and add `--require three_d` only when the requested deck needs Three.js.

## Installation prompts

- Treat the current available-skills inventory and the preflight report as authoritative.
- When a missing provider has a verified Codex Marketplace identity and the host exposes a native install-suggestion action, use that action.
- Otherwise direct the user to Codex Plugins with the exact provider label from `dependencies.json`.
- After installation, start a new task when Codex requires capability rediscovery, then rerun preflight.
- Do not add ordinary plugin dependencies to `agents/openai.yaml`; its dependency schema currently represents MCP tools only.

Never claim Full Studio while `capabilityProfile.taskReady` is false.
