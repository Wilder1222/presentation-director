# Reference Library

Use this library for internal visual analysis and style selection. The plugin bundles metadata, Design DNA, and compact previews. Raw PDFs, full-resolution captures, selected renders, and review sheets live inside the active presentation workspace.

## Contents

1. Workspace-local storage
2. Bundled metadata
3. List raw links without downloading
4. Load one raw PDF on demand
5. Render selected PDF pages
6. Refresh previews and provenance
7. Refresh Spotify Design
8. Validate
9. Rights and selection rules

## Workspace-local storage

The default workspace is:

```text
<current-directory>/presentation-director/
```

The reference library is always:

```text
<current-directory>/presentation-director/reference-library/
```

If the current directory is already an initialized `presentation-director` workspace, use it directly. Do not use a user-home, system-drive, global, or shared cache.

The workspace reference library may contain:

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

Every collector accepts `--workspace <presentation-director-path>`. A legacy `--cache-dir` argument is accepted only when it resolves exactly to `<workspace>/reference-library`; external locations are rejected.

## Bundled metadata

- Canonical sources and raw target paths: `assets/reference-library/sources.json`
- Curated slide roles and preview paths: `assets/reference-library/catalog.json`
- SHA-256, byte size, page count, and image dimensions: `assets/reference-library/provenance.json`
- Compact WebP previews: `assets/reference-library/previews/<company>/`

Every PDF catalog entry links `sourceId + page + file + previewFile`. Every web entry links `sourceId + canonical URL + previewFile`. Use `previewFile` for ordinary style selection.

## List raw links without downloading

```text
node <skill-dir>/scripts/collect-reference-library.mjs --workspace <workspace> --list
```

The command lists sources and performs no download. `sources.json` remains the source of truth for official URLs.

## Load one raw PDF on demand

```text
node <skill-dir>/scripts/collect-reference-library.mjs --workspace <workspace> --source <source-id>
```

For a source marked `heavy`, add `--include-heavy`. Use `--company <company-id>` only for an intentional group fetch and `--all` only for a deliberate full refresh. Use `--force` only when replacing an existing workspace object is intentional.

The collector writes through a `.part` file, verifies PDF content type, calculates SHA-256, and updates the workspace-local `cache-manifest.json`. It never deletes another source.

## Render selected PDF pages

After the required raw PDF is present:

```text
python <skill-dir>/scripts/render-selected-references.py --workspace <workspace> --company <catalog-company-id>
```

Use `--force` only when regenerating existing workspace PNG files is intentional.

## Refresh previews and provenance

These commands are for maintainers working in the plugin source repository, not for runtime deck creation. They update packaged preview metadata and must never be invoked by the Skill during a presentation task:

```text
python <skill-dir>/scripts/build-reference-previews.py --workspace <workspace>
python <skill-dir>/scripts/build-reference-provenance.py --workspace <workspace>
```

The first command regenerates bundled WebP previews and updates `previewFile` entries. The second records snapshot hashes, page counts, byte sizes, and dimensions.

## Refresh Spotify Design

Direct access to `spotify.design` timed out during the current snapshot. The source registry keeps canonical Spotify Design URLs and corresponding articles from the official Spotify Design Medium publication.

List available groups without downloading:

```text
powershell -ExecutionPolicy Bypass -File <skill-dir>/scripts/collect-spotify-reference-assets.ps1 -Workspace <workspace>
```

Load one group:

```text
powershell -ExecutionPolicy Bypass -File <skill-dir>/scripts/collect-spotify-reference-assets.ps1 -Workspace <workspace> -Group principles
```

Available groups are `brand`, `principles`, and `systems`. Use `-All` only for an intentional full refresh.

## Validate

Metadata and bundled previews can be validated before raw files are loaded:

```text
python <skill-dir>/scripts/validate-reference-library.py --workspace <workspace>
```

Require and verify every workspace-local original and high-resolution catalog asset:

```text
python <skill-dir>/scripts/validate-reference-library.py --workspace <workspace> --require-cache
```

The packaged snapshot contains 38 registered sources, 12 official PDFs, 104 curated examples, and 104 bundled previews.

## Rights and selection rules

1. Prefer official presentation PDFs, reports, brand guidelines, and first-party design publications.
2. Use official material as internal reference; do not redistribute it as a template.
3. Load a raw source only when the bundled preview and Design DNA are insufficient or the selected style requires source-depth review.
4. Preserve `sourceId`, page number, canonical URL, rights status, and provenance hash.
5. Learn principles only. Do not copy logos, marketing copy, official product renders, proprietary fonts, or exact compositions without authorization.
6. Keep all downloaded and generated reference artifacts inside the active workspace and out of source control.
