#!/usr/bin/env python3
"""Validate reference metadata and workspace-local reference objects."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

sys.dont_write_bytecode = True

from reference_cache import resolve_cache_dir, safe_cache_path


ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "assets" / "reference-library"


def args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir")
    parser.add_argument("--workspace")
    parser.add_argument("--require-cache", action="store_true")
    parser.add_argument("--skip-hash", action="store_true")
    return parser.parse_args()


def load(name: str) -> dict:
    return json.loads((METADATA / name).read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_metadata_path(relative: str) -> Path:
    root = METADATA.resolve()
    target = (root / relative).resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Path escapes reference metadata: {relative}")
    return target


def main() -> int:
    options = args()
    cache = resolve_cache_dir(options.cache_dir, options.workspace)
    source_doc = load("sources.json")
    catalog = load("catalog.json")
    provenance = load("provenance.json")
    errors: list[str] = []
    source_ids: set[str] = set()
    source_map: dict[str, dict] = {}
    original_map = {entry["sourceId"]: entry for entry in provenance["originals"]}
    asset_map = {entry["catalogId"]: entry for entry in provenance["catalogAssets"]}
    missing_cache = 0
    verified_cache = 0

    for source in source_doc["sources"]:
        source_id = source["id"]
        if source_id in source_ids:
            errors.append(f"duplicate source id: {source_id}")
        source_ids.add(source_id)
        source_map[source_id] = source
        file_name = source.get("file")
        asset_directory = source.get("assetDirectory")
        status = source.get("captureStatus", "")
        if status.startswith("blocked") and file_name is not None:
            errors.append(f"blocked capture should not claim a local file: {source_id}")
        if status.startswith("ready") and not file_name and not asset_directory:
            errors.append(f"ready capture has no local file or asset directory: {source_id}")
        if asset_directory:
            directory = safe_cache_path(cache, asset_directory)
            if not directory.is_dir():
                missing_cache += 1
                if options.require_cache:
                    errors.append(f"missing cached source asset directory: {asset_directory}")
        if source.get("kind") != "official_pdf":
            continue
        expected = original_map.get(source_id)
        if not expected:
            errors.append(f"provenance missing original: {source_id}")
            continue
        if expected.get("file") != file_name:
            errors.append(f"provenance path mismatch: {source_id}")
        path = safe_cache_path(cache, file_name)
        if not path.is_file():
            missing_cache += 1
            if options.require_cache:
                errors.append(f"missing cached original: {file_name}")
            continue
        verified_cache += 1
        if path.stat().st_size != expected.get("bytes"):
            errors.append(f"byte-size mismatch: {source_id}")
        if not options.skip_hash and sha256(path) != expected.get("sha256"):
            errors.append(f"SHA-256 mismatch: {source_id}")

    entry_ids: set[str] = set()
    entry_files: set[str] = set()
    company_counts: dict[str, int] = {}
    for entry in catalog["entries"]:
        entry_id = entry["id"]
        file_name = entry["file"]
        if entry_id in entry_ids:
            errors.append(f"duplicate catalog id: {entry_id}")
        if file_name in entry_files:
            errors.append(f"duplicate catalog file: {file_name}")
        entry_ids.add(entry_id)
        entry_files.add(file_name)
        company_counts[entry["company"]] = company_counts.get(entry["company"], 0) + 1
        source = source_map.get(entry["sourceId"])
        if not source:
            errors.append(f"unknown catalog source: {entry['sourceId']}")
            continue
        if source["company"] != entry["company"]:
            errors.append(f"company mismatch: {entry_id}")
        expected = asset_map.get(entry_id)
        if not expected:
            errors.append(f"provenance missing catalog asset: {entry_id}")
            continue
        if expected.get("cacheFile") != file_name:
            errors.append(f"catalog provenance path mismatch: {entry_id}")
        preview_relative = entry.get("previewFile")
        if not preview_relative:
            errors.append(f"catalog preview missing: {entry_id}")
        elif expected.get("previewFile") != preview_relative:
            errors.append(f"preview provenance path mismatch: {entry_id}")
        else:
            preview = safe_metadata_path(preview_relative)
            if not preview.is_file():
                errors.append(f"missing bundled preview: {preview_relative}")
            else:
                try:
                    with Image.open(preview) as image:
                        preview_size = image.size
                    if preview_size != (expected.get("previewWidth"), expected.get("previewHeight")):
                        errors.append(f"preview dimension mismatch: {entry_id}")
                    if preview.stat().st_size != expected.get("previewBytes"):
                        errors.append(f"preview byte-size mismatch: {entry_id}")
                    if not options.skip_hash and sha256(preview) != expected.get("previewSha256"):
                        errors.append(f"preview SHA-256 mismatch: {entry_id}")
                except Exception as exc:  # noqa: BLE001
                    errors.append(f"invalid bundled preview {preview_relative}: {exc}")
        page_number = entry.get("page")
        if page_number is not None:
            original = original_map.get(entry["sourceId"], {})
            page_count = int(original.get("pageCount", 0))
            if not 1 <= int(page_number) <= page_count:
                errors.append(f"page out of bounds: {entry_id}")
        path = safe_cache_path(cache, file_name)
        if not path.is_file():
            missing_cache += 1
            if options.require_cache:
                errors.append(f"missing cached catalog asset: {file_name}")
            continue
        verified_cache += 1
        try:
            with Image.open(path) as image:
                width, height = image.size
            if (width, height) != (expected.get("cacheWidth"), expected.get("cacheHeight")):
                errors.append(f"image dimension mismatch: {entry_id}")
            if max(width, height) < 1000:
                errors.append(f"catalog image too small ({width}x{height}): {file_name}")
            if path.stat().st_size != expected.get("cacheBytes"):
                errors.append(f"catalog byte-size mismatch: {entry_id}")
            if not options.skip_hash and sha256(path) != expected.get("cacheSha256"):
                errors.append(f"catalog SHA-256 mismatch: {entry_id}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"invalid catalog image {file_name}: {exc}")

    if errors:
        print("reference library validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    cache_mode = "complete" if missing_cache == 0 else "metadata-only-or-partial"
    print(
        "reference library valid: "
        f"sources={len(source_ids)}, catalog={len(entry_ids)}, cache={cache_mode}, "
        f"verified={verified_cache}, missing={missing_cache}, cacheDir={cache}, "
        + ", ".join(f"{company}={count}" for company, count in sorted(company_counts.items()))
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
