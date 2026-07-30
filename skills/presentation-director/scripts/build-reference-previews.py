#!/usr/bin/env python3
"""Create compact bundled WebP previews from workspace-local high-resolution files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

sys.dont_write_bytecode = True

from reference_cache import resolve_cache_dir, safe_cache_path


ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "assets" / "reference-library"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir")
    parser.add_argument("--workspace")
    parser.add_argument("--max-edge", type=int, default=1200)
    parser.add_argument("--quality", type=int, default=78)
    return parser.parse_args()


def main() -> int:
    options = parse_args()
    cache = resolve_cache_dir(options.cache_dir, options.workspace)
    catalog_path = METADATA / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    created = 0

    for entry in catalog["entries"]:
        source = safe_cache_path(cache, entry["file"])
        if not source.is_file():
            raise FileNotFoundError(source)
        preview_relative = f"previews/{entry['company']}/{entry['id']}.webp"
        preview = METADATA / preview_relative
        preview.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as image:
            rendered = ImageOps.exif_transpose(image).convert("RGB")
            rendered.thumbnail((options.max_edge, options.max_edge), Image.Resampling.LANCZOS)
            rendered.save(preview, "WEBP", quality=options.quality, method=6)
        entry["previewFile"] = preview_relative
        created += 1

    catalog_path.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"created previews={created}, maxEdge={options.max_edge}, quality={options.quality}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
