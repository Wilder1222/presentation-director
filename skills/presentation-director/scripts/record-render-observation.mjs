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

const OBSERVATION_STATUSES = new Set(["passed", "failed"]);
const RUBRIC_STATUSES = new Set(["passed", "failed", "not-applicable"]);
const FINDING_SEVERITIES = new Set(["blocking", "error", "warning", "note"]);
const REPAIR_OPERATIONS = new Set([
  "adjust-copy",
  "adjust-layout",
  "adjust-typography",
  "replace-asset",
  "repair-connector",
  "simplify-diagram",
  "adjust-motion",
  "degrade-renderer",
  "other-minimal",
]);

function usage() {
  console.error("Usage: node scripts/record-render-observation.mjs [project-dir] --input <workspace-relative-json> [--json]");
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

function validateRubricResults(requiredChecks, results) {
  if (!Array.isArray(results)) throw new Error("rubricResults must be an array.");
  const requiredIds = new Set(requiredChecks.map((check) => check.id));
  const byId = new Map();
  for (const result of results) {
    if (!nonEmpty(result?.checkId) || !RUBRIC_STATUSES.has(result?.status) || !nonEmpty(result?.evidence)) {
      throw new Error("Every rubric result needs checkId, status, and concrete evidence.");
    }
    if (byId.has(result.checkId)) throw new Error(`Duplicate rubric result: ${result.checkId}.`);
    if (!requiredIds.has(result.checkId)) throw new Error(`Rubric result is not in the current scope: ${result.checkId}.`);
    byId.set(result.checkId, result);
  }
  for (const check of requiredChecks) {
    const result = byId.get(check.id);
    if (!result) throw new Error(`Missing rubric result: ${check.id}.`);
    if (check.severity === "blocking" && result.status === "not-applicable") {
      throw new Error(`Blocking rubric check cannot be not-applicable: ${check.id}.`);
    }
  }
  return byId;
}

function validateFindings(findings) {
  if (!Array.isArray(findings)) throw new Error("findings must be an array.");
  const ids = new Set();
  for (const finding of findings) {
    for (const key of ["id", "severity", "category", "target", "description", "evidence"]) {
      if (!nonEmpty(finding?.[key])) throw new Error(`Every finding needs ${key}.`);
    }
    if (!FINDING_SEVERITIES.has(finding.severity)) throw new Error(`Unsupported finding severity: ${finding.severity}.`);
    if (ids.has(finding.id)) throw new Error(`Duplicate finding id: ${finding.id}.`);
    ids.add(finding.id);
  }
}

function validateRepairPlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("A failed observation needs repairPlan.");
  if (plan.strategy !== "minimal") throw new Error("repairPlan.strategy must be minimal.");
  if (!Array.isArray(plan.actions) || !plan.actions.length) throw new Error("repairPlan.actions must contain at least one action.");
  const ids = new Set();
  for (const action of plan.actions) {
    for (const key of ["id", "target", "operation", "rationale"]) {
      if (!nonEmpty(action?.[key])) throw new Error(`Every repair action needs ${key}.`);
    }
    if (!REPAIR_OPERATIONS.has(action.operation)) throw new Error(`Unsupported repair operation: ${action.operation}.`);
    if (ids.has(action.id)) throw new Error(`Duplicate repair action id: ${action.id}.`);
    ids.add(action.id);
    if (/whole[- ]slide|redesign.*slide/i.test(`${action.operation} ${action.rationale}`)) {
      throw new Error("Repair actions must be minimal; whole-slide redesign is not allowed in the repair loop.");
    }
  }
}

export async function recordRenderObservation(projectDir, input) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  if (!["1.6", "1.7"].includes(manifest.version)) throw new Error("Render observations require Manifest 1.6+.");
  const production = ensureProduction(manifest);
  const [buildPlan, qaPlan, rubric] = await Promise.all([
    readJson(workspacePath(root, production.build.plan, "build plan")),
    readJson(workspacePath(root, production.qa.plan, "QA plan")),
    readJson(workspacePath(root, production.creativePlan.deckRubric, "deck rubric")),
  ]);
  if (buildPlan.manifestDigest !== computeManifestBuildDigest(manifest)) throw new Error("Build and QA plans are stale.");
  if (buildPlan.designDigest !== production.designLock.designDigest) throw new Error("Design lock changed after build preparation.");
  if (rubric.creativeDigest !== production.creativePlan.digest) throw new Error("Deck rubric is stale.");

  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Observation input must be an object.");
  if (!new Set(["slide", "deck"]).has(input.scope)) throw new Error("scope must be slide or deck.");
  if (!OBSERVATION_STATUSES.has(input.status)) throw new Error("status must be passed or failed.");
  if (!nonEmpty(input.reviewer) || !nonEmpty(input.summary)) throw new Error("reviewer and summary are required.");
  if (!nonEmpty(input.artifact)) throw new Error("artifact is required.");
  validateFindings(input.findings);

  const maxRounds = Number(production.qa.maxRepairRounds || 2);
  const round = Number(input.round || 1);
  if (!Number.isInteger(round) || round < 1 || round > maxRounds) {
    throw new Error(`round must be an integer from 1 to ${maxRounds}.`);
  }
  const scopeId = input.scope === "slide" ? input.slideId : "deck-final";
  if (!nonEmpty(scopeId)) throw new Error("slideId is required for slide observations.");
  const slidePlan = input.scope === "slide" ? buildPlan.slides.find((slide) => slide.slideId === input.slideId) : null;
  if (input.scope === "slide" && !slidePlan) throw new Error(`Unknown slide in current build plan: ${input.slideId}.`);
  if (input.scope === "slide" && !qaPlan.slides.some((slide) => slide.slideId === input.slideId)) {
    throw new Error(`Unknown slide in current QA plan: ${input.slideId}.`);
  }

  if (round > 1) {
    const previousPath = `tmp/qa/observations/${scopeId}/r${round - 1}.json`;
    if (!(await exists(workspacePath(root, previousPath, "previous observation")))) {
      throw new Error(`Round ${round} requires ${previousPath}.`);
    }
    const previous = await readJson(workspacePath(root, previousPath, "previous observation"));
    if (previous.status !== "failed") throw new Error("A new repair round is allowed only after a failed observation.");
  }

  const artifactPath = workspacePath(root, input.artifact, "observed artifact");
  if (!(await exists(artifactPath))) throw new Error(`Observed artifact is missing: ${input.artifact}.`);
  const requiredChecks = rubric.checks.filter((check) =>
    check.dimension !== "delivery" && (input.scope === "slide" ? check.scope === "slide" && check.slideId === input.slideId : check.scope === "deck"),
  );
  const rubricById = validateRubricResults(requiredChecks, input.rubricResults);
  const blockingFailures = requiredChecks.filter((check) => rubricById.get(check.id)?.status !== "passed");
  const severeFindings = input.findings.filter((finding) => new Set(["blocking", "error"]).has(finding.severity));
  if (input.status === "passed" && (blockingFailures.length || severeFindings.length)) {
    throw new Error("A passed observation cannot contain blocking rubric failures or severe findings.");
  }
  if (input.status === "failed" && !blockingFailures.length && !input.findings.length) {
    throw new Error("A failed observation needs a failed rubric check or a concrete finding.");
  }
  const repairAllowed = input.status === "failed" && round < maxRounds && input.repairable !== false;
  if (repairAllowed) validateRepairPlan(input.repairPlan);
  if (input.status === "passed" && input.repairPlan) throw new Error("A passed observation cannot declare a repairPlan.");

  const observedAt = new Date().toISOString();
  const observationPath = `tmp/qa/observations/${scopeId}/r${round}.json`;
  const repairPath = repairAllowed ? `tmp/qa/repairs/${scopeId}/r${round}.json` : null;
  const observation = {
    schemaVersion: "1.0",
    observedAt,
    scope: input.scope,
    scopeId,
    slideId: input.scope === "slide" ? input.slideId : null,
    round,
    status: input.status,
    reviewer: input.reviewer,
    summary: input.summary,
    artifact: input.artifact,
    artifactHash: await hashPath(artifactPath),
    findings: input.findings,
    rubricResults: input.rubricResults,
    rubricDigest: sha256(stableStringify(rubric)),
    planGeneratedAt: qaPlan.generatedAt,
    manifestDigest: buildPlan.manifestDigest,
    designDigest: buildPlan.designDigest,
    inputHash: slidePlan?.inputHash || null,
    repairPlan: repairPath,
    repairExhausted: input.status === "failed" && !repairAllowed,
  };
  await writeJson(workspacePath(root, observationPath, "observation output"), observation);
  let repair = null;
  if (repairAllowed) {
    repair = {
      schemaVersion: "1.0",
      createdAt: observedAt,
      scope: input.scope,
      scopeId,
      slideId: observation.slideId,
      round,
      strategy: "minimal",
      observation: observationPath,
      observationHash: sha256(stableStringify(observation)),
      actions: input.repairPlan.actions,
    };
    await writeJson(workspacePath(root, repairPath, "repair plan output"), repair);
  }
  return { observationPath, observation, repairPath, repair };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = resolveProjectDir(options.projectDir || process.cwd());
    const input = await readJson(workspacePath(root, options.input, "observation input"));
    const result = await recordRenderObservation(root, input);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`${result.observation.scopeId} render observation recorded as ${result.observation.status}.`);
  } catch (error) {
    console.error(`Render observation failed: ${error.message}`);
    process.exit(1);
  }
}
