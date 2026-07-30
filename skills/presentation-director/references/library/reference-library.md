# Reference Library

Use this library for internal visual analysis and style selection. The plugin bundles only metadata, Design DNA, and compact previews. Raw PDFs, full-resolution captures, and review renders live in an optional external cache and are never required for normal Skill loading.

## Contents

1. Bundled metadata
2. External cache
3. List raw links without downloading
4. Load one raw PDF on demand
5. Render selected PDF pages on demand
6. Refresh compact previews and provenance
7. Refresh Spotify Design on demand
8. Validate
9. Rights and selection rules

## Bundled metadata

- Canonical sources and raw target paths: `assets/reference-library/sources.json`
- Curated slide roles and preview paths: `assets/reference-library/catalog.json`
- SHA-256, byte size, page count, and image dimensions: `assets/reference-library/provenance.json`
- Compact WebP previews: `assets/reference-library/previews/<company>/`

Every PDF catalog entry links `sourceId + page + file + previewFile`. Every web entry links `sourceId + canonical URL + previewFile`. Use `previewFile` for ordinary style selection.

## External cache

Resolution order:

1. An explicit `--cache-dir` argument.
2. `PRESENTATION_REFERENCE_CACHE`.
3. Legacy `CODEX_PRESENTATION_REFERENCE_CACHE` for backward compatibility.
4. `~/.codex/cache/presentation-director/reference-library`.

The cache may contain:

```text
raw/                    downloaded official originals
selected/               presentation-resolution selected pages
selected-contact-sheets/ compact review sheets for selected pages
captures/               full-resolution official web captures
review/                 disposable PDF page renders
contact-sheets/          review sheets
capture-contact-sheets/  web and Spotify review sheets
cache-manifest.json      current local download results
```

Cache absence is valid. The Atlas and bundled previews remain usable.

## List raw links without downloading

```text
node <skill-dir>/scripts/collect-reference-library.mjs --list
```

The default command also lists sources and performs no download. `sources.json` remains the source of truth for official URLs.

## Load one raw PDF on demand

```text
node <skill-dir>/scripts/collect-reference-library.mjs --source <source-id>
```

For a source marked `heavy`, add `--include-heavy`. Use `--company <company-id>` only for an intentional group fetch and `--all` only for a deliberate full refresh. Use `--force` only when replacing an existing cache object is intentional.

The collector writes through a `.part` file, verifies the PDF content type, calculates SHA-256, and updates `cache-manifest.json`. It never deletes another cached source.

## Render selected PDF pages on demand

After the required raw PDF is cached:

```text
python <skill-dir>/scripts/render-selected-references.py --company <catalog-company-id>
```

Use `--force` only when regenerating existing cached PNG files is intentional.

## Refresh compact previews and provenance

These commands are for plugin maintenance, not routine deck creation:

```text
python <skill-dir>/scripts/build-reference-previews.py
python <skill-dir>/scripts/build-reference-provenance.py
```

The first command regenerates bundled WebP previews and updates `previewFile` entries. The second records immutable snapshot hashes, page counts, byte sizes, and dimensions.

## Refresh Spotify Design on demand

Direct access to `spotify.design` timed out during the current snapshot. The source registry keeps canonical Spotify Design URLs and the corresponding articles from the official Spotify Design Medium publication.

List available groups without downloading:

```text
powershell -ExecutionPolicy Bypass -File <skill-dir>/scripts/collect-spotify-reference-assets.ps1
```

Load only one group:

```text
powershell -ExecutionPolicy Bypass -File <skill-dir>/scripts/collect-spotify-reference-assets.ps1 -Group principles
```

Available groups are `brand`, `principles`, and `systems`. Use `-All` only for an intentional full refresh.

## Validate

Metadata and bundled-preview validation works without a cache:

```text
python <skill-dir>/scripts/validate-reference-library.py
```

Require and verify every cached original and high-resolution catalog asset:

```text
python <skill-dir>/scripts/validate-reference-library.py --require-cache
```

The current snapshot contains 38 registered sources, 12 official PDFs, 104 curated examples, and 104 bundled previews. The optional cache contains the original 12 PDFs plus the selected high-resolution and review assets.

## Rights and selection rules

1. Prefer official presentation PDFs, reports, brand guidelines, and first-party design publications.
2. Use official material as internal reference; do not redistribute it as a template.
3. Load a raw source only when the bundled preview and Design DNA are insufficient.
4. Preserve `sourceId`, page number, canonical URL, rights status, and provenance hash.
5. Learn principles only. Do not copy logos, marketing copy, official product renders, proprietary fonts, or exact compositions without authorization.
6. Do not commit or package the external cache.
