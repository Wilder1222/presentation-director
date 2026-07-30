#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const METADATA_DIR = path.join(SKILL_DIR, "assets", "reference-library");
const SOURCES_PATH = path.join(METADATA_DIR, "sources.json");
const PRIMARY_CACHE_ENV = "PRESENTATION_REFERENCE_CACHE";
const LEGACY_CACHE_ENV = "CODEX_PRESENTATION_REFERENCE_CACHE";

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  if (!argv[index + 1] || argv[index + 1].startsWith("--")) throw new Error(`${flag} requires a value`);
  return argv[index + 1];
}

function parseArgs(argv) {
  return {
    includeHeavy: argv.includes("--include-heavy"),
    force: argv.includes("--force"),
    all: argv.includes("--all"),
    list: argv.includes("--list"),
    company: valueAfter(argv, "--company"),
    source: valueAfter(argv, "--source"),
    cacheDir: valueAfter(argv, "--cache-dir"),
  };
}

function resolveCacheDir(explicit) {
  return path.resolve(
    explicit ||
      process.env[PRIMARY_CACHE_ENV] ||
      process.env[LEGACY_CACHE_ENV] ||
      path.join(os.homedir(), ".codex", "cache", "presentation-director", "reference-library"),
  );
}

function safeCachePath(cacheDir, relative) {
  const destination = path.resolve(cacheDir, relative);
  const rootWithSep = `${path.resolve(cacheDir)}${path.sep}`;
  if (destination !== path.resolve(cacheDir) && !destination.startsWith(rootWithSep)) {
    throw new Error(`Unsafe cache destination: ${relative}`);
  }
  return destination;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function download(source, options, cacheDir) {
  const destination = safeCachePath(cacheDir, source.file);
  if ((await exists(destination)) && !options.force) {
    const info = await stat(destination);
    return { id: source.id, status: "existing", file: source.file, bytes: info.size, sha256: await sha256(destination), url: source.url };
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const partial = `${destination}.part`;
  await rm(partial, { force: true });
  const response = await fetch(source.url, {
    redirect: "follow",
    headers: { "user-agent": "Presentation-Director/1.0 on-demand reference cache" },
    signal: AbortSignal.timeout(15 * 60 * 1000),
  });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error(`${source.id}: expected PDF, got ${contentType || "unknown content type"}`);
  }
  if (!response.body) throw new Error(`${source.id}: empty response body`);

  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial, { flags: "wx" }));
    await rename(partial, destination);
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }

  const info = await stat(destination);
  return { id: source.id, status: "downloaded", file: source.file, bytes: info.size, sha256: await sha256(destination), url: source.url, contentType };
}

async function updateCacheManifest(cacheDir, newResults) {
  const manifestPath = path.join(cacheDir, "cache-manifest.json");
  let previous = { results: [] };
  if (await exists(manifestPath)) {
    try {
      previous = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch {
      previous = { results: [] };
    }
  }
  const merged = new Map((previous.results || []).map((entry) => [entry.id, entry]));
  for (const result of newResults) merged.set(result.id, result);
  const manifest = {
    version: "1.0",
    updatedAt: new Date().toISOString(),
    manualOnDemandCache: true,
    results: [...merged.values()].sort((a, b) => a.id.localeCompare(b.id)),
  };
  await mkdir(cacheDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const options = parseArgs(process.argv.slice(2));
const cacheDir = resolveCacheDir(options.cacheDir);
const config = JSON.parse(await readFile(SOURCES_PATH, "utf8"));
const pdfSources = config.sources.filter((source) => source.kind === "official_pdf");

if (options.list || (!options.source && !options.company && !options.all)) {
  for (const source of pdfSources) {
    const cached = await exists(safeCachePath(cacheDir, source.file));
    console.log(`${cached ? "cached " : "remote "} ${source.id} -> ${source.url}`);
  }
  console.log(`cacheDir=${cacheDir}`);
  console.log("Download one item with --source <source-id>. Use --all only for an intentional full refresh.");
  process.exit(0);
}

let queue = pdfSources.filter((source) => {
  if (options.source && source.id !== options.source) return false;
  if (options.company && source.company !== options.company) return false;
  return true;
});
if (options.source && queue.length === 0) throw new Error(`Unknown PDF source id: ${options.source}`);

const skipped = [];
queue = queue.filter((source) => {
  if (source.heavy && !options.includeHeavy) {
    skipped.push({ id: source.id, status: "skipped-heavy", url: source.url });
    return false;
  }
  return true;
});

const results = [];
for (const source of queue) {
  console.log(`Collecting ${source.id}...`);
  try {
    results.push(await download(source, options, cacheDir));
  } catch (error) {
    results.push({ id: source.id, status: "error", url: source.url, error: error.message });
  }
}
results.push(...skipped);
await updateCacheManifest(cacheDir, results);
for (const result of results) console.log(`${result.status.padEnd(13)} ${result.id}${result.bytes ? ` (${result.bytes} bytes)` : ""}`);
console.log(`cacheDir=${cacheDir}`);
if (results.some((result) => result.status === "error")) process.exit(1);
