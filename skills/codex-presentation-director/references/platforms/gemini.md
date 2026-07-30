# Gemini CLI Adapter

Use this adapter when the host is Gemini CLI.

## Distribution

The repository includes `gemini-extension.json` and the shared `skills/` directory. Install from a GitHub URL or local repository path with `gemini extensions install`, then restart the CLI session.

`PRESENTATION_REFERENCE_CACHE` is declared as an optional extension setting so Gemini can pass it through its environment sanitization layer.

## Dependency behavior

- Run `check-capabilities.mjs --platform gemini` before asset generation.
- Gemini extensions do not provide this project with a universal dependency resolver for other extensions; use explicit installation guidance from the capability report.
- Rerun preflight after installing or enabling an extension.
- Do not continue with missing requested capabilities unless the user approves a documented fallback.
