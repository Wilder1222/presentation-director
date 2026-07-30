# Claude Code Adapter

Use this adapter when the host is Claude Code.

## Distribution

The repository includes `.claude-plugin/plugin.json`. Claude Code discovers the shared `skills/` directory at the plugin root.

For local testing:

```text
claude --plugin-dir <repository-root>
```

Invoke the bundled skill through the plugin namespace shown by Claude Code.

## Dependency behavior

- Run `check-capabilities.mjs --platform claude-code` before generating assets.
- Claude Code can auto-resolve dependencies declared in `.claude-plugin/plugin.json`, but declare only verified plugin names and tested semver ranges.
- This distribution intentionally does not fabricate dependencies for providers that lack a verified Claude marketplace identity.
- For unresolved capabilities, show the preflight installation guidance and rerun the check after installation.
- If the user explicitly accepts a fallback, record that approval and replace unsupported renderers with static alternatives.
