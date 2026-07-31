#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCreativeDigest,
  computeDesignDigest,
  ensureProduction,
  exists,
  hashFile,
  readJson,
  resolveProjectDir,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";
import { readFile } from "node:fs/promises";

function usage() {
  console.error(
    "Usage: node scripts/lock-design.mjs [project-dir] --approved-by <user|team|auto-review> " +
      "--sample <slide-id=workspace-relative-artifact> [--sample ...] [--json]",
  );
}

function parseArgs(argv) {
  const options = { projectDir: undefined, approvedBy: undefined, samples: [], json: false };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--json") {
      options.json = true;
      continue;
    }
    const value = args.shift();
    if (!value || !["--approved-by", "--sample"].includes(flag)) {
      usage();
      process.exit(2);
    }
    if (flag === "--approved-by") options.approvedBy = value;
    if (flag === "--sample") {
      const separator = value.indexOf("=");
      if (separator < 1 || separator === value.length - 1) {
        throw new Error(`Invalid sample mapping: ${value}`);
      }
      options.samples.push({ slideId: value.slice(0, separator), artifact: value.slice(separator + 1) });
    }
  }
  return options;
}

function unresolvedDesign(design) {
  return /\b(TODO|TBD|unresolved|pending)\b|\{\{.+?\}\}/i.test(design);
}

export async function lockDesign(projectDir, options) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const designPath = path.join(root, "DESIGN.md");
  if (!(await exists(manifestPath)) || !(await exists(designPath))) {
    throw new Error(`DESIGN.md and presentation.json are required in ${root}`);
  }
  if (!new Set(["user", "team", "auto-review"]).has(options.approvedBy)) {
    throw new Error("--approved-by must be user, team, or auto-review.");
  }

  const manifest = await readJson(manifestPath);
  const design = await readFile(designPath, "utf8");
  const production = ensureProduction(manifest);
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  if (!slides.length) throw new Error("Define the slide plan before locking design.");
  if (manifest.styleDecision?.status !== "selected") {
    throw new Error("Select the visual direction before locking design.");
  }
  if (manifest.tasteProfile?.status !== "locked" || manifest.tasteProfile?.contentSwapTest !== "pass") {
    throw new Error("Lock tasteProfile and pass the content-swap test before locking design.");
  }
  if (unresolvedDesign(design)) throw new Error("DESIGN.md still contains unresolved planning language.");
  if (manifest.version === "1.5") {
    if (production.creativePlan.status !== "prepared") {
      throw new Error("Prepare the Manifest 1.5 creative plan before locking representative samples.");
    }
    if (production.creativePlan.digest !== computeCreativeDigest(manifest)) {
      throw new Error("The narrative, slide content, storyboard, or asset plan changed; run prepare-creative.mjs again.");
    }
    for (const key of ["narrativeMap", "storyboard", "assetPlan", "report", "providerIndex"]) {
      const relativePath = production.creativePlan[key];
      if (!relativePath || !(await exists(workspacePath(root, relativePath, `creative plan ${key}`)))) {
        throw new Error(`Creative plan output is missing: ${key}`);
      }
    }
  }

  const requiredSampleCount = Math.min(4, slides.length);
  const uniqueIds = new Set(options.samples.map((sample) => sample.slideId));
  if (uniqueIds.size !== options.samples.length) throw new Error("Representative sample slide ids must be unique.");
  if (options.samples.length < requiredSampleCount) {
    throw new Error(`Design lock requires ${requiredSampleCount} representative sample(s).`);
  }
  if (options.samples.length > requiredSampleCount) {
    throw new Error(`Design lock uses exactly ${requiredSampleCount} representative sample(s) for this deck.`);
  }
  if (!uniqueIds.has(slides[0].id)) throw new Error(`Representative samples must include the opening slide ${slides[0].id}.`);

  const slideMap = new Map(slides.map((slide) => [slide.id, slide]));
  const samples = [];
  for (const sample of options.samples) {
    const slide = slideMap.get(sample.slideId);
    if (!slide) throw new Error(`Unknown representative slide: ${sample.slideId}`);
    const target = workspacePath(root, sample.artifact, `sample ${sample.slideId}`);
    if (!(await exists(target))) throw new Error(`Representative sample does not exist: ${sample.artifact}`);
    samples.push({
      slideId: slide.id,
      role: slide.role,
      renderer: slide.renderer,
      artifact: sample.artifact.replace(/\\/g, "/"),
      artifactHash: await hashFile(target),
    });
  }

  const roleCount = new Set(samples.map((sample) => sample.role)).size;
  const availableRoleCount = new Set(slides.map((slide) => slide.role)).size;
  if (roleCount < Math.min(3, requiredSampleCount, availableRoleCount)) {
    throw new Error("Representative samples must cover at least three distinct slide roles when the deck permits it.");
  }
  const hasSpecialistSlide = slides.some((slide) => slide.renderer !== "native_ppt");
  if (hasSpecialistSlide && !samples.some((sample) => sample.renderer !== "native_ppt")) {
    throw new Error("Include at least one specialist-rendered representative sample.");
  }

  const lockedAt = new Date().toISOString();
  manifest.version = manifest.version === "1.5" ? "1.5" : "1.4";
  production.designLock = {
    status: "locked",
    requiredSampleCount,
    lockedAt,
    approvedBy: options.approvedBy,
    creativeDigest: manifest.version === "1.5" ? production.creativePlan.digest : null,
    designDigest: computeDesignDigest(manifest, design),
    samples: samples.map((sample) => ({ ...sample, approvedAt: lockedAt })),
  };
  production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  await writeJson(manifestPath, manifest);
  return production.designLock;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await lockDesign(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Design locked with ${result.samples.length} representative samples (${result.designDigest.slice(0, 12)}).`);
  } catch (error) {
    console.error(`Design lock failed: ${error.message}`);
    process.exit(1);
  }
}
