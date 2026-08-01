#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeManifestBuildDigest,
  ensureProduction,
  exists,
  hashPath,
  readJson,
  resolveProjectDir,
  slideBuildCapsule,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

function usage() {
  console.error("Usage: node scripts/record-build.mjs [project-dir] (--all | --slide <id[,id]>) [--json]");
}

function parseArgs(argv) {
  const options = { projectDir: undefined, all: false, slides: [], json: false };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--all") options.all = true;
    else if (flag === "--json") options.json = true;
    else if (flag === "--slide") {
      const value = args.shift();
      if (!value) {
        usage();
        process.exit(2);
      }
      options.slides.push(...value.split(",").map((item) => item.trim()).filter(Boolean));
    } else {
      usage();
      process.exit(2);
    }
  }
  if (options.all === (options.slides.length > 0)) {
    throw new Error("Choose exactly one of --all or --slide.");
  }
  return options;
}

function validateNativeCapabilities(receipt, slideId) {
  const capability = receipt.nativeCapabilities;
  const keys = [
    "nativeText",
    "nativeShapes",
    "nativeCharts",
    "replaceableSvg",
    "replaceableImages",
    "embeddedVideo",
    "flattened",
  ];
  if (!capability || typeof capability !== "object" || Array.isArray(capability)) {
    throw new Error(`Cannot record ${slideId}; Manifest 1.7 receipts require nativeCapabilities.`);
  }
  for (const key of keys) {
    if (typeof capability[key] !== "boolean") throw new Error(`Cannot record ${slideId}; nativeCapabilities.${key} must be boolean.`);
  }
  if (!Array.isArray(capability.losses) || capability.losses.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`Cannot record ${slideId}; nativeCapabilities.losses must be an array of concrete strings.`);
  }
  return capability;
}

export async function recordBuild(projectDir, options = {}) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  const production = ensureProduction(manifest);
  const planPath = workspacePath(root, production.build.plan, "build plan");
  if (!(await exists(planPath))) throw new Error("Prepare the build before recording completed work.");
  const plan = await readJson(planPath);
  if (plan.designDigest !== production.designLock.designDigest) {
    throw new Error("Build plan is stale because the design lock changed.");
  }
  if (plan.manifestDigest !== computeManifestBuildDigest(manifest)) {
    throw new Error("Build plan is stale because presentation.json changed.");
  }
  const selectedIds = options.all
    ? plan.slides.filter((item) => item.status === "dirty").map((item) => item.slideId)
    : [...new Set(options.slides || [])];
  const selectedPlans = selectedIds.map((id) => {
    const item = plan.slides.find((slide) => slide.slideId === id);
    if (!item) throw new Error(`Slide is not present in the prepared build plan: ${id}`);
    return item;
  });

  const recorded = [];
  for (const slidePlan of selectedPlans) {
    const slide = (manifest.slides || []).find((item) => item.id === slidePlan.slideId);
    const capsulePath = workspacePath(root, slideBuildCapsule(slide), `slide ${slidePlan.slideId} build capsule`);
    const receiptPath = path.join(capsulePath, "receipt.json");
    if (!(await exists(receiptPath))) {
      throw new Error(`Cannot record ${slidePlan.slideId}; build capsule receipt is missing: ${slideBuildCapsule(slide)}/receipt.json`);
    }
    let receipt;
    try {
      receipt = JSON.parse(await readFile(receiptPath, "utf8"));
    } catch (error) {
      throw new Error(`Cannot record ${slidePlan.slideId}; invalid build receipt: ${error.message}`);
    }
    if (receipt.slideId !== slidePlan.slideId || receipt.renderer !== slidePlan.renderer || receipt.inputHash !== slidePlan.inputHash || receipt.status !== "complete") {
      throw new Error(`Cannot record ${slidePlan.slideId}; receipt must match slideId, renderer, inputHash, and complete status from the current plan.`);
    }
    if (manifest.version === "1.7" && receipt.schemaVersion !== "1.1") {
      throw new Error(`Cannot record ${slidePlan.slideId}; Manifest 1.7 receipts require schemaVersion 1.1.`);
    }
    const nativeCapabilities = manifest.version === "1.7"
      ? validateNativeCapabilities(receipt, slidePlan.slideId)
      : receipt.nativeCapabilities || null;
    const outputs = [];
    for (const output of slidePlan.outputs || []) {
      const target = workspacePath(root, output.path, `slide ${slidePlan.slideId} output`);
      if (!(await exists(target))) throw new Error(`Cannot record ${slidePlan.slideId}; output is missing: ${output.path}`);
      outputs.push({ path: output.path, hash: await hashPath(target) });
    }
    recorded.push({
      slideId: slidePlan.slideId,
      status: "complete",
      renderer: slidePlan.renderer,
      inputHash: slidePlan.inputHash,
      outputs,
      nativeCapabilities,
      sourceFiles: Array.isArray(receipt.sourceFiles) ? receipt.sourceFiles : [],
      preview: receipt.preview || null,
      completedAt: new Date().toISOString(),
    });
  }

  const statePath = workspacePath(root, production.build.cacheState, "cache state");
  const state = await exists(statePath)
    ? await readJson(statePath)
    : { schemaVersion: "1.0", designDigest: production.designLock.designDigest, slides: {} };
  if (state.designDigest !== production.designLock.designDigest) {
    state.designDigest = production.designLock.designDigest;
    state.slides = {};
  }
  for (const record of recorded) state.slides[record.slideId] = record;
  state.updatedAt = new Date().toISOString();
  production.build.lastRecordedAt = state.updatedAt;
  production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  production.delivery = {
    ...production.delivery,
    rehearsalStatus: "pending",
    rehearsalHash: null,
    qualityScorecardStatus: "pending",
    qualityScorecardHash: null,
    nativeCapabilityStatus: "pending",
    nativeCapabilityHash: null,
  };
  await Promise.all([writeJson(statePath, state), writeJson(manifestPath, manifest)]);
  return { recorded, statePath: production.build.cacheState };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await recordBuild(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Recorded ${result.recorded.length} completed slide build(s) in ${result.statePath}.`);
  } catch (error) {
    console.error(`Build recording failed: ${error.message}`);
    process.exit(1);
  }
}
