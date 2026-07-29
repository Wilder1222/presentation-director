"""Resolve the optional external reference cache used by Presentation Director."""

from __future__ import annotations

import os
from pathlib import Path


CACHE_ENV = "CODEX_PRESENTATION_REFERENCE_CACHE"
DEFAULT_RELATIVE_CACHE = Path(".codex") / "cache" / "codex-presentation-director" / "reference-library"


def resolve_cache_dir(explicit: str | None = None) -> Path:
    if explicit:
        return Path(explicit).expanduser().resolve()
    configured = os.environ.get(CACHE_ENV)
    if configured:
        return Path(configured).expanduser().resolve()
    return (Path.home() / DEFAULT_RELATIVE_CACHE).resolve()


def safe_cache_path(cache_dir: Path, relative: str) -> Path:
    root = cache_dir.resolve()
    target = (root / relative).resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Path escapes reference cache: {relative}")
    return target
