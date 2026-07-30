#!/usr/bin/env python3
"""Build the small, distributable provenance index for an external binary cache."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import date
from pathlib import Path

import fitz
from PIL import Image

sys.dont_write_bytecode = True

from reference_cache import CACHE_ENV, resolve_cache_dir, safe_cache_path


ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "assets" / "reference-library"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir")
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    options = parse_args()
    cache = resolve_cache_dir(options.cache_dir)
    sources = json.loads((METADATA / "sources.json").read_text(encoding="utf-8"))["sources"]
    catalog = json.loads((METADATA / "catalog.json").read_text(encoding="utf-8"))["entries"]

    originals = []
    for source in sources:
        if source.get("kind") != "official_pdf" or not source.get("file"):
            continue
        path = safe_cache_path(cache, source["file"])
        if not path.is_file():
            raise FileNotFoundError(path)
        with fitz.open(path) as document:
            page_count = document.page_count
        originals.append(
            {
                "sourceId": source["id"],
                "file": source["file"],
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
                "pageCount": page_count,
            }
        )

    assets = []
    for entry in catalog:
        path = safe_cache_path(cache, entry["file"])
        if not path.is_file():
            raise FileNotFoundError(path)
        with Image.open(path) as image:
            width, height = image.size
        preview_relative = entry.get("previewFile")
        if not preview_relative:
            raise ValueError(f"catalog entry has no previewFile: {entry['id']}")
        preview = (METADATA / preview_relative).resolve()
        if METADATA.resolve() not in preview.parents or not preview.is_file():
            raise FileNotFoundError(preview)
        with Image.open(preview) as image:
            preview_width, preview_height = image.size
        assets.append(
            {
                "catalogId": entry["id"],
                "cacheFile": entry["file"],
                "cacheBytes": path.stat().st_size,
                "cacheSha256": sha256(path),
                "cacheWidth": width,
                "cacheHeight": height,
                "previewFile": preview_relative,
                "previewBytes": preview.stat().st_size,
                "previewSha256": sha256(preview),
                "previewWidth": preview_width,
                "previewHeight": preview_height,
            }
        )

    document = {
        "version": "1.0",
        "snapshotDate": date.today().isoformat(),
        "cachePolicy": {
            "bundled": False,
            "environmentVariable": CACHE_ENV,
            "defaultLocation": "~/.codex/cache/codex-presentation-director/reference-library",
        },
        "originals": originals,
        "catalogAssets": assets,
    }
    output = METADATA / "provenance.json"
    output.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {output}: originals={len(originals)}, catalogAssets={len(assets)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
