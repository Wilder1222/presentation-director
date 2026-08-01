#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureProduction,
  readJson,
  resolveProjectDir,
  sha256,
  stableStringify,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

function parseArgs(argv) {
  const projectDir = argv.find((arg) => !arg.startsWith("--"));
  return { projectDir, json: argv.includes("--json") };
}

function score(checks, resultMap) {
  const passed = checks.filter((check) => resultMap.get(check.id)?.status === "passed").length;
  return { score: checks.length ? Math.round((passed / checks.length) * 100) : 100, passed, total: checks.length };
}

export async function compileQualityScorecard(projectDir) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  if (manifest.version !== "1.7") throw new Error("Quality scorecards require Manifest 1.7.");
  const production = ensureProduction(manifest);
  const [rubric, qaResults, rehearsal, nativeReport] = await Promise.all([
    readJson(workspacePath(root, production.creativePlan.deckRubric, "deck rubric")),
    readJson(workspacePath(root, production.qa.results, "QA results")),
    readJson(workspacePath(root, production.delivery.rehearsal, "delivery rehearsal")),
    readJson(workspacePath(root, production.delivery.nativeCapabilityReport, "native capability report")),
  ]);
  if (qaResults.final?.status !== "passed") throw new Error("Final deck QA must pass before compiling the scorecard.");
  if (rehearsal.status !== "passed") throw new Error("Delivery rehearsal must pass before compiling the scorecard.");
  if (nativeReport.creativeDigest !== production.creativePlan.digest) throw new Error("Native capability report is stale.");

  const artifactResults = new Map();
  for (const slide of manifest.slides || []) {
    const pathValue = qaResults.slides?.[slide.id]?.observation?.path;
    if (!pathValue) throw new Error(`Slide ${slide.id} has no QA observation.`);
    const observation = await readJson(workspacePath(root, pathValue, `slide ${slide.id} observation`));
    for (const result of observation.rubricResults || []) artifactResults.set(result.checkId, result);
  }
  const finalObservationPath = qaResults.final?.observation?.path;
  if (!finalObservationPath) throw new Error("Final deck has no QA observation.");
  const finalObservation = await readJson(workspacePath(root, finalObservationPath, "final deck observation"));
  for (const result of finalObservation.rubricResults || []) artifactResults.set(result.checkId, result);
  const deliveryResults = new Map((rehearsal.rubricResults || []).map((result) => [result.checkId, result]));

  const artifactChecks = rubric.checks.filter((check) => check.dimension !== "delivery");
  const deliveryChecks = rubric.checks.filter((check) => check.dimension === "delivery");
  const artifact = score(artifactChecks, artifactResults);
  const delivery = score(deliveryChecks, deliveryResults);
  const scorecard = {
    schemaVersion: "1.0",
    generatedAt: new Date().toISOString(),
    creativeDigest: production.creativePlan.digest,
    rubricDigest: sha256(stableStringify(rubric)),
    artifactScore: artifact.score,
    deliveryScore: delivery.score,
    artifactChecks: artifact,
    deliveryChecks: delivery,
    nativeCapabilitySummary: nativeReport.summary,
    status: artifact.score === 100 && delivery.score === 100 ? "passed" : "failed",
  };
  await writeJson(workspacePath(root, production.delivery.qualityScorecard, "quality scorecard"), scorecard);
  production.delivery.qualityScorecardStatus = scorecard.status;
  production.delivery.qualityScorecardHash = sha256(stableStringify(scorecard));
  await writeJson(manifestPath, manifest);
  return scorecard;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await compileQualityScorecard(options.projectDir || process.cwd());
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Quality scorecard: artifact ${result.artifactScore}, delivery ${result.deliveryScore}.`);
  } catch (error) {
    console.error(`Quality scorecard failed: ${error.message}`);
    process.exit(1);
  }
}
