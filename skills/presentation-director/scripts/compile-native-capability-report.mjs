#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeManifestBuildDigest,
  ensureProduction,
  exists,
  hashPath,
  inspectBuildRecord,
  readJson,
  resolveProjectDir,
  sha256,
  stableStringify,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

const BOOLEAN_FIELDS = [
  "nativeText",
  "nativeShapes",
  "nativeCharts",
  "replaceableSvg",
  "replaceableImages",
  "embeddedVideo",
  "flattened",
];

function usage() {
  console.error("Usage: node scripts/compile-native-capability-report.mjs [project-dir] [--input <workspace-relative-json>] [--json]");
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
  return options;
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCapabilities(capability, label) {
  if (!capability || typeof capability !== "object" || Array.isArray(capability)) throw new Error(`${label} needs nativeCapabilities.`);
  for (const key of BOOLEAN_FIELDS) {
    if (typeof capability[key] !== "boolean") throw new Error(`${label} nativeCapabilities.${key} must be boolean.`);
  }
  if (!Array.isArray(capability.losses) || capability.losses.some((item) => !nonEmpty(item))) throw new Error(`${label} nativeCapabilities.losses must be an array of concrete strings.`);
  return capability;
}

function classify(capability) {
  if (capability.flattened) return "flattened";
  if (capability.replaceableSvg || capability.replaceableImages || capability.embeddedVideo || capability.losses.length) return "mixed";
  return "native";
}

function assemblyChanges(buildCapability, finalCapability) {
  const changes = BOOLEAN_FIELDS
    .filter((key) => buildCapability[key] !== finalCapability[key])
    .map((key) => ({ field: key, build: buildCapability[key], final: finalCapability[key] }));
  const buildLosses = new Set(buildCapability.losses);
  for (const loss of finalCapability.losses) {
    if (!buildLosses.has(loss)) changes.push({ field: "losses", build: null, final: loss });
  }
  return changes;
}

export async function compileNativeCapabilityReport(projectDir, auditInput = null) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const manifest = await readJson(manifestPath);
  if (manifest.version !== "1.7") throw new Error("Native capability reporting requires Manifest 1.7.");
  const production = ensureProduction(manifest);
  const [buildPlan, state] = await Promise.all([
    readJson(workspacePath(root, production.build.plan, "build plan")),
    readJson(workspacePath(root, production.build.cacheState, "build cache")),
  ]);
  if (buildPlan.manifestDigest !== computeManifestBuildDigest(manifest)) throw new Error("Build plan is stale.");
  const input = auditInput || await readJson(workspacePath(root, production.delivery.nativeCapabilityAudit, "native capability audit"));
  if (!input || typeof input !== "object" || Array.isArray(input) || !nonEmpty(input.artifact) || !nonEmpty(input.reviewer) || !nonEmpty(input.summary)) {
    throw new Error("Final assembly audit requires artifact, reviewer, summary, and per-slide native capabilities.");
  }
  const artifactPath = workspacePath(root, input.artifact, "audited final presentation");
  if (!(await exists(artifactPath))) throw new Error(`Audited final presentation is missing: ${input.artifact}.`);

  const auditedById = new Map();
  for (const slide of Array.isArray(input.slides) ? input.slides : []) {
    if (!nonEmpty(slide?.slideId) || auditedById.has(slide.slideId)) throw new Error("Final assembly audit slide ids must be unique and non-empty.");
    auditedById.set(slide.slideId, validateCapabilities(slide.nativeCapabilities, `Audit slide ${slide.slideId}`));
  }
  if (auditedById.size !== buildPlan.slides.length || buildPlan.slides.some((slide) => !auditedById.has(slide.slideId))) {
    throw new Error("Final assembly audit must cover every current slide exactly once.");
  }

  const auditedAt = new Date().toISOString();
  const audit = {
    schemaVersion: "1.0",
    auditedAt,
    reviewer: input.reviewer,
    summary: input.summary,
    artifact: input.artifact.replace(/\\/g, "/"),
    artifactHash: await hashPath(artifactPath),
    creativeDigest: production.creativePlan.digest,
    manifestDigest: buildPlan.manifestDigest,
    slides: buildPlan.slides.map((planned) => ({
      slideId: planned.slideId,
      nativeCapabilities: auditedById.get(planned.slideId),
    })),
  };
  await writeJson(workspacePath(root, production.delivery.nativeCapabilityAudit, "native capability audit"), audit);

  const slides = [];
  for (const planned of buildPlan.slides) {
    const record = state.slides?.[planned.slideId];
    const inspection = await inspectBuildRecord(root, planned, record);
    if (!inspection.valid) throw new Error(`Cannot report ${planned.slideId}: ${inspection.problems.join("; ")}.`);
    const buildCapability = validateCapabilities(record.nativeCapabilities, `Build record ${planned.slideId}`);
    const finalCapability = auditedById.get(planned.slideId);
    slides.push({
      slideId: planned.slideId,
      renderer: planned.renderer,
      editability: (manifest.slides || []).find((slide) => slide.id === planned.slideId)?.editability || null,
      classification: classify(finalCapability),
      nativeText: finalCapability.nativeText,
      nativeShapes: finalCapability.nativeShapes,
      nativeCharts: finalCapability.nativeCharts,
      replaceableSvg: finalCapability.replaceableSvg,
      replaceableImages: finalCapability.replaceableImages,
      embeddedVideo: finalCapability.embeddedVideo,
      flattened: finalCapability.flattened,
      conversionLosses: finalCapability.losses,
      assemblyChanges: assemblyChanges(buildCapability, finalCapability),
      buildCapabilities: buildCapability,
      sourceFiles: record.sourceFiles || [],
    });
  }
  const report = {
    schemaVersion: "1.1",
    generatedAt: auditedAt,
    creativeDigest: production.creativePlan.digest,
    manifestDigest: buildPlan.manifestDigest,
    auditedArtifact: audit.artifact,
    auditedArtifactHash: audit.artifactHash,
    audit: production.delivery.nativeCapabilityAudit,
    auditDigest: sha256(stableStringify(audit)),
    reviewer: audit.reviewer,
    summary: {
      slides: slides.length,
      native: slides.filter((slide) => slide.classification === "native").length,
      mixed: slides.filter((slide) => slide.classification === "mixed").length,
      flattened: slides.filter((slide) => slide.classification === "flattened").length,
      withConversionLoss: slides.filter((slide) => slide.conversionLosses.length).length,
      changedDuringAssembly: slides.filter((slide) => slide.assemblyChanges.length).length,
    },
    slides,
  };
  await writeJson(workspacePath(root, production.delivery.nativeCapabilityReport, "native capability report"), report);
  production.delivery.nativeCapabilityStatus = "complete";
  production.delivery.nativeCapabilityHash = sha256(stableStringify(report));
  production.delivery.qualityScorecardStatus = "pending";
  production.delivery.qualityScorecardHash = null;
  await writeJson(manifestPath, manifest);
  return report;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = resolveProjectDir(options.projectDir || process.cwd());
    const input = options.input ? await readJson(workspacePath(root, options.input, "native capability audit input")) : null;
    const result = await compileNativeCapabilityReport(root, input);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else console.log(`Native capability report: ${result.summary.native} native, ${result.summary.mixed} mixed, ${result.summary.flattened} flattened; ${result.summary.changedDuringAssembly} changed during assembly.`);
  } catch (error) {
    console.error(`Native capability reporting failed: ${error.message}`);
    process.exit(1);
  }
}
