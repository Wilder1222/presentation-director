#!/usr/bin/env node

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCreativeDigest,
  ensureProduction,
  exists,
  hashFile,
  readJson,
  resolveProjectDir,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

function usage() {
  console.error(
    "Usage: node scripts/record-asset-selection.mjs [project-dir] --slide <id> --asset <id> " +
      "--candidate <candidate-id=workspace-path> [--candidate ...] --selected <candidate-id> " +
      "--reviewer <name> --rationale <text> [--json]",
  );
}

function parseArgs(argv) {
  const options = {
    projectDir: undefined,
    slideId: undefined,
    assetId: undefined,
    candidates: [],
    selectedId: undefined,
    reviewer: undefined,
    rationale: undefined,
    json: false,
  };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--json") {
      options.json = true;
      continue;
    }
    const value = args.shift();
    if (!value || !["--slide", "--asset", "--candidate", "--selected", "--reviewer", "--rationale"].includes(flag)) {
      usage();
      process.exit(2);
    }
    if (flag === "--slide") options.slideId = value;
    if (flag === "--asset") options.assetId = value;
    if (flag === "--selected") options.selectedId = value;
    if (flag === "--reviewer") options.reviewer = value;
    if (flag === "--rationale") options.rationale = value;
    if (flag === "--candidate") {
      const separator = value.indexOf("=");
      if (separator < 1 || separator === value.length - 1) throw new Error(`Invalid candidate mapping: ${value}`);
      options.candidates.push({ id: value.slice(0, separator), path: value.slice(separator + 1) });
    }
  }
  for (const [key, value] of Object.entries({
    "--slide": options.slideId,
    "--asset": options.assetId,
    "--selected": options.selectedId,
    "--reviewer": options.reviewer,
    "--rationale": options.rationale,
  })) {
    if (!value) throw new Error(`${key} is required.`);
  }
  if (!options.candidates.length) throw new Error("At least one --candidate is required.");
  return options;
}

export async function recordAssetSelection(projectDir, options = {}) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  const production = ensureProduction(manifest);
  if (manifest.version !== "1.5" || production.creativePlan.status !== "prepared") {
    throw new Error("Prepare a Manifest 1.5 creative plan before selecting asset variants.");
  }
  if (production.creativePlan.digest !== computeCreativeDigest(manifest)) {
    throw new Error("The creative plan is stale; run prepare-creative.mjs again.");
  }
  const slide = (manifest.slides || []).find((item) => item.id === options.slideId);
  if (!slide) throw new Error(`Unknown slide: ${options.slideId}`);
  const asset = (slide.assets || []).find((item) => item.id === options.assetId);
  if (!asset) throw new Error(`Unknown asset ${options.slideId}:${options.assetId}`);
  const selectionMode = asset.brief?.selectionMode;
  const requiredCandidates = selectionMode === "variants" ? Number(asset.brief?.variantCount ?? 2) : 1;
  const ids = new Set(options.candidates.map((candidate) => candidate.id));
  if (ids.size !== options.candidates.length) throw new Error("Candidate ids must be unique.");
  if (options.candidates.length < requiredCandidates) {
    throw new Error(`${selectionMode} selection requires at least ${requiredCandidates} candidate(s).`);
  }
  if (!ids.has(options.selectedId)) throw new Error(`Selected candidate is not present: ${options.selectedId}`);
  if (!options.rationale || options.rationale.trim().length < 12) {
    throw new Error("Selection rationale must explain the visual or communication reason.");
  }

  const candidates = [];
  for (const candidate of options.candidates) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(candidate.id)) throw new Error(`Invalid candidate id: ${candidate.id}`);
    const target = workspacePath(root, candidate.path, `asset candidate ${candidate.id}`);
    if (!(await exists(target))) throw new Error(`Asset candidate does not exist: ${candidate.path}`);
    candidates.push({
      id: candidate.id,
      path: candidate.path.replace(/\\/g, "/"),
      hash: await hashFile(target),
    });
  }
  const selected = candidates.find((candidate) => candidate.id === options.selectedId);
  const selectedSource = workspacePath(root, selected.path, "selected asset candidate");
  const canonicalTarget = workspacePath(root, asset.path, "canonical asset output");
  await mkdir(path.dirname(canonicalTarget), { recursive: true });
  if (path.resolve(selectedSource) !== path.resolve(canonicalTarget)) await copyFile(selectedSource, canonicalTarget);
  const selectedHash = await hashFile(canonicalTarget);

  const providerBriefPath = `tmp/provider-briefs/${slide.id}/${asset.id}.json`;
  const providerBrief = workspacePath(root, providerBriefPath, "provider brief");
  if (!(await exists(providerBrief))) throw new Error(`Provider brief is missing: ${providerBriefPath}`);
  const selectedAt = new Date().toISOString();
  const record = {
    status: "selected",
    selectedAt,
    reviewer: options.reviewer,
    rationale: options.rationale,
    selectedCandidateId: selected.id,
    selectedPath: asset.path.replace(/\\/g, "/"),
    selectedHash,
    providerBrief: providerBriefPath,
    providerBriefHash: await hashFile(providerBrief),
    candidates,
  };
  asset.status = "ready";
  asset.selection = record;

  const selectionsPath = workspacePath(root, "tmp/asset-selections.json", "asset selections");
  const selections = await exists(selectionsPath)
    ? await readJson(selectionsPath)
    : { schemaVersion: "1.0", creativeDigest: production.creativePlan.digest, assets: {} };
  if (selections.creativeDigest !== production.creativePlan.digest) {
    selections.creativeDigest = production.creativePlan.digest;
    selections.assets = {};
  }
  selections.assets[`${slide.id}:${asset.id}`] = record;
  selections.updatedAt = selectedAt;
  production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  await Promise.all([writeJson(selectionsPath, selections), writeJson(manifestPath, manifest)]);
  return record;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await recordAssetSelection(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Selected ${result.selectedCandidateId}; canonical asset updated at ${result.selectedPath}.`);
  } catch (error) {
    console.error(`Asset selection failed: ${error.message}`);
    process.exit(1);
  }
}
