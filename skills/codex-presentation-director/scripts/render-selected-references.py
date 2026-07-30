#!/usr/bin/env python3
"""Render the catalog's selected PDF pages into presentation-ready PNG files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import fitz

sys.dont_write_bytecode = True

from reference_cache import resolve_cache_dir, safe_cache_path


ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "assets" / "reference-library"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dpi", type=int, default=120)
    parser.add_argument("--company", help="Render one company or role-pack id from catalog.json")
    parser.add_argument("--cache-dir")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cache = resolve_cache_dir(args.cache_dir)
    catalog = json.loads((METADATA / "catalog.json").read_text(encoding="utf-8"))
    sources_doc = json.loads((METADATA / "sources.json").read_text(encoding="utf-8"))
    sources = {item["id"]: item for item in sources_doc["sources"]}
    opened: dict[Path, fitz.Document] = {}
    rendered = 0
    skipped = 0

    try:
        for entry in catalog["entries"]:
            if args.company and entry["company"] != args.company:
                continue
            if entry.get("page") is None:
                continue

            source = sources[entry["sourceId"]]
            source_path = safe_cache_path(cache, source["file"])
            output_path = safe_cache_path(cache, entry["file"])
            output_path.parent.mkdir(parents=True, exist_ok=True)
            if output_path.exists() and not args.force:
                skipped += 1
                continue

            document = opened.get(source_path)
            if document is None:
                document = fitz.open(source_path)
                opened[source_path] = document

            page_index = int(entry["page"]) - 1
            if page_index < 0 or page_index >= document.page_count:
                raise IndexError(f"Invalid page {entry['page']} for {entry['sourceId']}")

            page = document.load_page(page_index)
            scale = args.dpi / 72.0
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            pixmap.save(output_path)
            rendered += 1
            print(f"rendered {entry['id']} -> {entry['file']}")
    finally:
        for document in opened.values():
            document.close()

    print(f"done: rendered={rendered}, skipped={skipped}, dpi={args.dpi}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
