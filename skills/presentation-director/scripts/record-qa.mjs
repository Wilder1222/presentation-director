#!/usr/bin/env node

import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeManifestBuildDigest,
  ensureProduction,
  exists,
  inspectBuildRecord,
  readJson,
  resolveProjectDir,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

function usage() {
  console.error(
    "Usage: node scripts/record-qa.mjs [project-dir] (--slide <id> | --final) " +
      "--status <passed|failed> --reviewer <name> --note <text> [--json]",
  );
}

function parseArgs(argv) {
  const options = {
    projectDir: undefined,
    slideId: undefined,
    final: false,
    status: undefined,
    reviewer: undefined,
    note: undefined,
    json: false,
  };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--final") options.final = true;
    else if (flag === "--json") options.json = true;
    else if (["--slide", "--status", "--reviewer", "--note"].includes(flag)) {
      const value = args.shift();
      if (!value) {
        usage();
        process.exit(2);
      }
      if (flag === "--slide") options.slideId = value;
      if (flag === "--status") options.status = value;
      if (flag === "--reviewer") options.reviewer = value;
      if (flag === "--note") options.note = value;
    } else {
      usage();
      process.exit(2);
    }
  }
  if (options.final === Boolean(options.slideId)) throw new Error("Choose exactly one of --slide or --final.");
  if (!new Set(["passed", "failed"]).has(options.status)) throw new Error("--status must be passed or failed.");
  if (!options.reviewer || !options.note) throw new Error("--reviewer and --note are required.");
  return options;
}

export async function recordQa(projectDir, options = {}) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  const production = ensureProduction(manifest);
  const qaPlanPath = workspacePath(root, production.qa.plan, "QA plan");
  const buildPlanPath = workspacePath(root, production.build.plan, "build plan");
  if (!(await exists(qaPlanPath)) || !(await exists(buildPlanPath))) {
    throw new Error("Prepare the build before recording QA.");
  }
  const [qaPlan, buildPlan] = await Promise.all([readJson(qaPlanPath), readJson(buildPlanPath)]);
  if (buildPlan.designDigest !== production.designLock.designDigest) {
    throw new Error("QA plan is stale because the design lock changed.");
  }
  if (buildPlan.manifestDigest !== computeManifestBuildDigest(manifest)) {
    throw new Error("QA plan is stale because presentation.json changed.");
  }
  const resultsPath = workspacePath(root, production.qa.results, "QA results");
  const results = await exists(resultsPath)
    ? await readJson(resultsPath)
    : { schemaVersion: "1.0", slides: {}, final: { status: "pending", completedAt: null, reviewer: null, note: null } };
  const reviewedAt = new Date().toISOString();

  if (options.slideId) {
    const slide = qaPlan.slides.find((item) => item.slideId === options.slideId);
    if (!slide) throw new Error(`Unknown slide in QA plan: ${options.slideId}`);
    results.slides[options.slideId] = {
      status: options.status,
      reviewedAt,
      reviewer: options.reviewer,
      note: options.note,
      riskLevel: slide.risk.level,
      planGeneratedAt: qaPlan.generatedAt,
    };
    results.final = { status: "pending", completedAt: null, reviewer: null, note: null };
    production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  } else {
    if (options.status === "passed") {
      const slideIds = (manifest.slides || []).map((slide) => slide.id);
      const missingQa = slideIds.filter((id) => results.slides[id]?.status !== "passed");
      if (missingQa.length) throw new Error(`Final QA cannot pass; slide reviews are missing or failed: ${missingQa.join(", ")}`);
      const statePath = workspacePath(root, production.build.cacheState, "cache state");
      if (!(await exists(statePath))) throw new Error("Final QA cannot pass before completed builds are recorded.");
      const state = await readJson(statePath);
      const incomplete = [];
      for (const slide of buildPlan.slides) {
        const inspection = await inspectBuildRecord(root, slide, state.slides?.[slide.slideId]);
        if (!inspection.valid) incomplete.push(`${slide.slideId} (${inspection.problems.join("; ")})`);
      }
      if (incomplete.length) throw new Error(`Final QA cannot pass; current builds are incomplete: ${incomplete.join(", ")}`);
    }
    results.final = {
      status: options.status,
      completedAt: reviewedAt,
      reviewer: options.reviewer,
      note: options.note,
      planGeneratedAt: qaPlan.generatedAt,
    };
    production.qa.finalFullReview = {
      status: options.status,
      completedAt: reviewedAt,
      reviewer: options.reviewer,
    };
  }
  results.updatedAt = reviewedAt;
  const ledgerPath = workspacePath(root, production.qa.ledger, "QA ledger");
  const scope = options.slideId || "deck-final";
  const ledgerLine = `${reviewedAt} | ${options.status} | ${scope} | ${options.note.replace(/[\r\n]+/g, " ")} | ${options.reviewer}\n`;
  await Promise.all([
    writeJson(resultsPath, results),
    writeJson(manifestPath, manifest),
    appendFile(ledgerPath, ledgerLine, "utf8"),
  ]);
  return options.slideId ? results.slides[options.slideId] : results.final;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await recordQa(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`${options.slideId || "Final deck"} QA recorded as ${result.status}.`);
  } catch (error) {
    console.error(`QA recording failed: ${error.message}`);
    process.exit(1);
  }
}
