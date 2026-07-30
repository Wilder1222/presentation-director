"""Resolve the workspace-local reference library used by Presentation Director."""

from __future__ import annotations

from pathlib import Path


WORKSPACE_NAME = "presentation-director"
REFERENCE_LIBRARY_NAME = "reference-library"


def resolve_workspace_dir(explicit: str | None = None) -> Path:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate.name.lower() == WORKSPACE_NAME:
            return candidate
        return (candidate / WORKSPACE_NAME).resolve()

    current = Path.cwd().resolve()
    if current.name.lower() == WORKSPACE_NAME and (current / "presentation.json").is_file():
        return current
    return (current / WORKSPACE_NAME).resolve()


def resolve_cache_dir(explicit: str | None = None, workspace: str | None = None) -> Path:
    workspace_root = resolve_workspace_dir(workspace)
    expected = (workspace_root / REFERENCE_LIBRARY_NAME).resolve()
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate != expected:
            raise ValueError(
                f"Reference cache must be workspace-local: expected {expected}, got {candidate}"
            )
    return expected


def safe_cache_path(cache_dir: Path, relative: str) -> Path:
    root = cache_dir.resolve()
    target = (root / relative).resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Path escapes reference library: {relative}")
    return target
