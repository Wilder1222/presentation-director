#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeManifestBuildDigest,
  ensureProduction,
  exists,
  hashPath,
  readJson,
  resolveProjectDir,
  sha256,
  stableStringify,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

const STATUSES = new Set(["passed", "failed"]);

function usage() {
  console.error("Usage: node scripts/record-delivery-rehearsal.mjs [project-dir] --input <workspace-relative-json> [--json]");
}

function parseArgs(argv) {
  const options = { projectDir: undefined, input: undefined, json: false };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--json") options.json = true;
    else if (flag === "--input") options.input = args.shift();
    else {
      usage();
      process.exit(2);
    }
  }
  if (!options.input) throw new Error("--input is required.");
  return options;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateResults(checks, results) {
  if (!Array.isArray(results)) throw new Error("rubricResults must be an array.");
  const requiredIds = new Set(checks.map((check) => check.id));
  const resultMap = new Map();
  for (const result of results) {
    if (!requiredIds.has(result?.checkId) || !STATUSES.has(result?.status) || !nonEmpty(result?.evidence)) {
      throw new Error("Every delivery rubric result needs a current checkId, passed/failed status, and concrete evidence.");
    }
    if (resultMap.has(result.checkId)) throw new Error(`Duplicate delivery rubric result: ${result.checkId}.`);
    resultMap.set(result.checkId, result);
  }
  for (const check of checks) {
    if (!resultMap.has(check.id)) throw new Error(`Missing delivery rubric result: ${check.id}.`);
  }
  return resultMap;
}

export async function recordDeliveryRehearsal(projectDir, input) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  if (manifest.version !== "1.7") throw new Error("Delivery rehearsal requires Manifest 1.7.");
  const production = ensureProduction(manifest);
  const [buildPlan, deliveryPlan, rubric, qaResults] = await Promise.all([
    readJson(workspacePath(root, production.build.plan, "build plan")),
    readJson(workspacePath(root, production.creativePlan.deliveryPlan, "delivery plan")),
    readJson(workspacePath(root, production.creativePlan.deckRubric, "deck rubric")),
    readJson(workspacePath(root, production.qa.results, "QA results")),
  ]);
  if (buildPlan.manifestDigest !== computeManifestBuildDigest(manifest)) throw new Error("Build plan is stale; prepare production again before rehearsal.");
  if (deliveryPlan.creativeDigest !== production.creativePlan.digest) throw new Error("Delivery plan is stale.");
  if (qaResults.final?.status !== "passed" || !nonEmpty(qaResults.final?.observation?.path)) throw new Error("Final deck observation and QA must pass before rehearsal.");
  const finalObservation = await readJson(workspacePath(root, qaResults.final.observation.path, "final deck observation"));
  const finalArtifactPath = workspacePath(root, finalObservation.artifact, "rehearsed final presentation");
  if (!(await exists(finalArtifactPath)) || finalObservation.artifactHash !== await hashPath(finalArtifactPath)) throw new Error("Final observed presentation changed before rehearsal.");
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Rehearsal input must be an object.");
  if (!STATUSES.has(input.status) || !nonEmpty(input.reviewer) || !nonEmpty(input.summary)) {
    throw new Error("status, reviewer, and summary are required for delivery rehearsal.");
  }

  const plannedById = new Map(deliveryPlan.slides.map((slide) => [slide.slideId, slide]));
  const rehearsedSlides = Array.isArray(input.slides) ? input.slides : [];
  const actualById = new Map();
  for (const slide of rehearsedSlides) {
    if (!plannedById.has(slide?.slideId) || actualById.has(slide.slideId) || !Number.isFinite(Number(slide.actualSeconds)) || Number(slide.actualSeconds) <= 0) {
      throw new Error("Each rehearsed slide needs a unique current slideId and positive actualSeconds.");
    }
    actualById.set(slide.slideId, Number(slide.actualSeconds));
  }
  for (const slide of deliveryPlan.slides) {
    if (!actualById.has(slide.slideId)) throw new Error(`Missing rehearsal timing for ${slide.slideId}.`);
  }
  if (actualById.size !== deliveryPlan.slides.length) throw new Error("Rehearsal timing contains an unknown slide.");

  const reserveUsedSeconds = Number(input.reserveUsedSeconds || 0);
  const actualTotalSeconds = Number(input.actualTotalSeconds);
  const measuredSlideSeconds = [...actualById.values()].reduce((total, seconds) => total + seconds, 0);
  if (!Number.isFinite(reserveUsedSeconds) || reserveUsedSeconds < 0 || !Number.isFinite(actualTotalSeconds) || actualTotalSeconds <= 0) {
    throw new Error("actualTotalSeconds must be positive and reserveUsedSeconds must be non-negative.");
  }
  if (reserveUsedSeconds > deliveryPlan.reserveSeconds) throw new Error("reserveUsedSeconds cannot exceed the planned reserve.");
  if (Math.abs(actualTotalSeconds - measuredSlideSeconds - reserveUsedSeconds) > 0.01) {
    throw new Error("actualTotalSeconds must equal measured slide seconds plus reserveUsedSeconds.");
  }

  const deliveryChecks = rubric.checks.filter((check) => check.dimension === "delivery");
  const resultMap = validateResults(deliveryChecks, input.rubricResults);
  const tolerance = Number(deliveryPlan.timingTolerance);
  const timingFailures = deliveryPlan.slides.filter((slide) => actualById.get(slide.slideId) > slide.timeBudgetSeconds * (1 + tolerance));
  const totalTooLong = actualTotalSeconds > deliveryPlan.totalSeconds * (1 + tolerance);
  const failedChecks = deliveryChecks.filter((check) => resultMap.get(check.id).status !== "passed");
  if (input.status === "passed" && (timingFailures.length || totalTooLong || failedChecks.length)) {
    throw new Error("A passing rehearsal cannot exceed timing tolerance or fail a delivery rubric check.");
  }
  if (input.status === "failed" && !timingFailures.length && !totalTooLong && !failedChecks.length) {
    throw new Error("A failed rehearsal needs a timing overrun or failed delivery rubric check.");
  }

  const rehearsal = {
    schemaVersion: "1.0",
    rehearsedAt: new Date().toISOString(),
    status: input.status,
    reviewer: input.reviewer,
    summary: input.summary,
    creativeDigest: production.creativePlan.digest,
    manifestDigest: buildPlan.manifestDigest,
    deliveryPlanDigest: sha256(stableStringify(deliveryPlan)),
    rubricDigest: sha256(stableStringify(rubric)),
    finalObservation: qaResults.final.observation.path,
    finalObservationHash: sha256(stableStringify(finalObservation)),
    artifact: finalObservation.artifact,
    artifactHash: finalObservation.artifactHash,
    actualTotalSeconds,
    reserveUsedSeconds,
    timingTolerance: tolerance,
    slides: deliveryPlan.slides.map((slide) => ({
      slideId: slide.slideId,
      budgetSeconds: slide.timeBudgetSeconds,
      actualSeconds: actualById.get(slide.slideId),
      withinTolerance: actualById.get(slide.slideId) <= slide.timeBudgetSeconds * (1 + tolerance),
    })),
    rubricResults: input.rubricResults,
  };
  await writeJson(workspacePath(root, production.delivery.rehearsal, "delivery rehearsal"), rehearsal);
  production.delivery.rehearsalStatus = rehearsal.status;
  production.delivery.rehearsalHash = sha256(stableStringify(rehearsal));
  production.delivery.qualityScorecardStatus = "pending";
  production.delivery.qualityScorecardHash = null;
  await writeJson(manifestPath, manifest);
  return rehearsal;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = resolveProjectDir(options.projectDir || process.cwd());
    const input = await readJson(workspacePath(root, options.input, "rehearsal input"));
    const result = await recordDeliveryRehearsal(root, input);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Delivery rehearsal recorded as ${result.status} at ${result.actualTotalSeconds}s.`);
  } catch (error) {
    console.error(`Delivery rehearsal failed: ${error.message}`);
    process.exit(1);
  }
}
