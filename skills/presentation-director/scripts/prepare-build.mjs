#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_CONTRACT_VERSION,
  computeCreativeDigest,
  computeDesignDigest,
  computeManifestBuildDigest,
  ensureProduction,
  exists,
  expectedOutputPaths,
  hashPath,
  readJson,
  resolveProjectDir,
  sha256,
  stableStringify,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

function usage() {
  console.error(
    "Usage: node scripts/prepare-build.mjs [project-dir] [--max-workers <1-8>] [--json]",
  );
}

function parseArgs(argv) {
  const options = { projectDir: undefined, maxWorkers: undefined, json: false };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  while (args.length) {
    const flag = args.shift();
    if (flag === "--json") {
      options.json = true;
      continue;
    }
    const value = args.shift();
    if (flag !== "--max-workers" || !value) {
      usage();
      process.exit(2);
    }
    options.maxWorkers = Number(value);
  }
  if (options.maxWorkers !== undefined && (!Number.isInteger(options.maxWorkers) || options.maxWorkers < 1 || options.maxWorkers > 8)) {
    throw new Error("--max-workers must be an integer from 1 to 8.");
  }
  return options;
}

function inputPaths(slide) {
  const paths = [];
  for (const source of Array.isArray(slide.sources) ? slide.sources : []) {
    if (source?.path) paths.push(source.path);
  }
  for (const item of Array.isArray(slide.inputPaths) ? slide.inputPaths : []) paths.push(item);
  for (const asset of Array.isArray(slide.assets) ? slide.assets : []) {
    if (asset?.sourcePath) paths.push(asset.sourcePath);
    for (const item of Array.isArray(asset?.inputPaths) ? asset.inputPaths : []) paths.push(item);
  }
  if (slide.threeD?.scenePath) paths.push(slide.threeD.scenePath);
  if (slide.motion?.sourcePath) paths.push(slide.motion.sourcePath);
  return [...new Set(paths.filter(Boolean))];
}

async function snapshotInputs(root, slide) {
  const snapshots = [];
  for (const relativePath of inputPaths(slide).sort()) {
    const target = workspacePath(root, relativePath, `slide ${slide.id} input`);
    snapshots.push({
      path: relativePath.replace(/\\/g, "/"),
      hash: await exists(target) ? await hashPath(target) : "missing",
    });
  }
  return snapshots;
}

async function snapshotOutputs(root, outputPaths) {
  const snapshots = [];
  for (const relativePath of outputPaths) {
    const target = workspacePath(root, relativePath, "build output");
    snapshots.push({
      path: relativePath.replace(/\\/g, "/"),
      exists: await exists(target),
      hash: await exists(target) ? await hashPath(target) : null,
    });
  }
  return snapshots;
}

function slideRisk(slide) {
  let score = 1;
  const reasons = [];
  const rendererRisk = {
    native_ppt: 0,
    svg: 1,
    image_slide: 2,
    ui_capture: 2,
    hyperframes_video: 3,
    remotion_video: 3,
  };
  const rendererPoints = rendererRisk[slide.renderer] ?? 2;
  score += rendererPoints;
  if (rendererPoints) reasons.push(`${slide.renderer} requires specialist rendering`);
  if (slide.threeD) {
    score += 2;
    reasons.push("3D camera, model, material, and poster checks");
  }
  if (slide.claimKind === "external") {
    score += 2;
    reasons.push("externally sourced claim");
  }
  if (slide.editability === "flattened") {
    score += 2;
    reasons.push("full-page raster exception");
  }
  if ((slide.title || "").length > 55) {
    score += 1;
    reasons.push("long takeaway title");
  }
  if ((slide.assets || []).length > 2) {
    score += 1;
    reasons.push("multiple coordinated assets");
  }
  if (slide.visualPlan?.visualPeak === true) {
    score += 1;
    reasons.push("declared visual peak");
  }
  return {
    score,
    level: score >= 6 ? "high" : score >= 3 ? "medium" : "low",
    reasons,
  };
}

function workerRole(slide) {
  if (slide.threeD) return "spatial-motion-designer";
  return {
    native_ppt: "powerpoint-slide-engineer",
    image_slide: "visual-asset-designer",
    svg: "diagram-engineer",
    ui_capture: "product-ui-designer",
    hyperframes_video: "short-motion-designer",
    remotion_video: "video-designer",
  }[slide.renderer] || "slide-engineer";
}

function buildTaskGraph(slidePlans, maxParallelWorkers, generatedAt) {
  const tasks = [];
  for (const plan of slidePlans.filter((item) => item.status === "dirty")) {
    tasks.push({
      id: `produce:${plan.slideId}`,
      type: "slide-production",
      slideId: plan.slideId,
      agentRole: plan.agentRole,
      status: "pending",
      dependsOn: [],
      cacheKey: plan.inputHash,
      writes: plan.outputs.map((item) => item.path),
      forbiddenWrites: ["DESIGN.md", "presentation.json", "tmp/build-cache/state.json"],
    });
  }
  const productionTasks = tasks.map((task) => task.id);
  tasks.push({
    id: "assemble:pptx",
    type: "deck-assembly",
    agentRole: "director",
    status: "pending",
    dependsOn: productionTasks,
    writes: ["output/"],
  });
  for (const plan of slidePlans.filter((item) => item.risk.level !== "low" || item.status === "dirty")) {
    tasks.push({
      id: `qa:${plan.slideId}`,
      type: "slide-qa",
      slideId: plan.slideId,
      agentRole: "reviewer",
      status: "pending",
      dependsOn: plan.status === "dirty" ? [`produce:${plan.slideId}`] : [],
      riskLevel: plan.risk.level,
      writes: [`tmp/qa/observations/${plan.slideId}/`, `tmp/qa/repairs/${plan.slideId}/`],
      forbiddenWrites: ["DESIGN.md", "presentation.json", "tmp/qa-results.json", "tmp/qa-ledger.txt"],
    });
  }
  tasks.push({
    id: "qa:deck-final",
    type: "full-deck-qa",
    agentRole: "director-reviewer",
    status: "pending",
    dependsOn: ["assemble:pptx", ...tasks.filter((task) => task.type === "slide-qa").map((task) => task.id)],
    writes: ["tmp/qa-results.json", "tmp/qa-ledger.txt"],
  });
  tasks.push({
    id: "report:native-capability",
    type: "delivery-report",
    agentRole: "director",
    status: "pending",
    dependsOn: ["assemble:pptx"],
    writes: ["tmp/delivery/native-capability-audit.json", "output/native-capability-report.json"],
  });
  tasks.push({
    id: "rehearse:delivery",
    type: "delivery-rehearsal",
    agentRole: "presenter-reviewer",
    status: "pending",
    dependsOn: ["assemble:pptx"],
    writes: ["tmp/delivery/rehearsal.json"],
  });
  tasks.push({
    id: "report:quality-scorecard",
    type: "quality-scorecard",
    agentRole: "director-reviewer",
    status: "pending",
    dependsOn: ["qa:deck-final", "report:native-capability", "rehearse:delivery"],
    writes: ["output/quality-scorecard.json"],
  });
  return {
    schemaVersion: "1.0",
    generatedAt,
    maxParallelWorkers,
    coordination: {
      startWorkersAfter: "production.designLock.status=locked",
      directorOwns: [
        "DESIGN.md",
        "presentation.json",
        "tmp/build-cache/state.json",
        "tmp/qa-results.json",
        "tmp/qa-ledger.txt",
        "output/",
        "final assembly",
      ],
      workersMayWriteOnlyDeclaredPaths: true,
      directorRecordsBuildAfterWorkerCompletion: true,
    },
    tasks,
  };
}

function buildQaPlan(slidePlans, generatedAt, rubric, qaContract) {
  const artifactChecks = rubric.checks.filter((check) => check.dimension !== "delivery");
  const deliveryChecks = rubric.checks.filter((check) => check.dimension === "delivery");
  return {
    schemaVersion: deliveryChecks.length ? "1.2" : "1.1",
    generatedAt,
    strategy: "risk-based-plus-final-full",
    iterationPolicy: "Review every dirty slide and every medium/high-risk cached slide.",
    finalPolicy: "Review every slide at full size and open-check the final PPTX.",
    rubric: qaContract.rubric,
    rubricDigest: sha256(stableStringify(rubric)),
    observationPolicy: {
      required: true,
      root: qaContract.observationsRoot,
      repairRoot: qaContract.repairsRoot,
      strategy: qaContract.repairStrategy,
      maxRounds: qaContract.maxRepairRounds,
      wholeSlideRedesignAllowed: false,
    },
    deckCheckIds: artifactChecks.filter((check) => check.scope === "deck").map((check) => check.id),
    deliveryCheckIds: deliveryChecks.map((check) => check.id),
    slides: slidePlans.map((item) => ({
      slideId: item.slideId,
      risk: item.risk,
      dirty: item.status === "dirty",
      iterationRequired: item.status === "dirty" || item.risk.level !== "low",
      finalRequired: true,
      rubricCheckIds: artifactChecks
        .filter((check) => check.scope === "slide" && check.slideId === item.slideId)
        .map((check) => check.id),
      deliveryCheckIds: deliveryChecks
        .filter((check) => check.scope === "slide" && check.slideId === item.slideId)
        .map((check) => check.id),
    })),
  };
}

export async function prepareBuild(projectDir, options = {}) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const designPath = path.join(root, "DESIGN.md");
  if (!(await exists(manifestPath)) || !(await exists(designPath))) {
    throw new Error(`DESIGN.md and presentation.json are required in ${root}`);
  }
  const manifest = await readJson(manifestPath);
  const design = await readFile(designPath, "utf8");
  const production = ensureProduction(manifest);
  if (["1.5", "1.6", "1.7"].includes(manifest.version)) {
    if (production.creativePlan.status !== "prepared") {
      throw new Error("Prepare the creative plan before preparing production.");
    }
    if (production.creativePlan.digest !== computeCreativeDigest(manifest)) {
      throw new Error("The creative plan is stale; run prepare-creative.mjs and re-lock representative samples.");
    }
    if (production.designLock.creativeDigest !== production.creativePlan.digest) {
      throw new Error("The design lock does not cover the current creative plan; regenerate representative samples.");
    }
  }
  const currentDesignDigest = computeDesignDigest(manifest, design);
  if (production.designLock.status !== "locked") throw new Error("Lock representative design samples before preparing production.");
  if (production.designLock.designDigest !== currentDesignDigest) {
    throw new Error("DESIGN.md or the design contract changed after approval; regenerate samples and lock design again.");
  }
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  if (!slides.length) throw new Error("No slides are defined in presentation.json.");
  const rubric = ["1.6", "1.7"].includes(manifest.version)
    ? await readJson(workspacePath(root, production.creativePlan.deckRubric, "deck rubric"))
    : { checks: [] };

  const statePath = workspacePath(root, production.build.cacheState, "cache state");
  const previousState = await exists(statePath)
    ? await readJson(statePath)
    : { schemaVersion: "1.0", designDigest: null, slides: {} };
  const capabilityFingerprint = {
    requestedMode: manifest.capabilityProfile?.requestedMode,
    resolvedMode: manifest.capabilityProfile?.resolvedMode,
    available: [...(manifest.capabilityProfile?.available || [])].sort(),
  };
  const slidePlans = [];
  for (const slide of slides) {
    const inputs = await snapshotInputs(root, slide);
    const inputHash = sha256(stableStringify({
      buildContractVersion: BUILD_CONTRACT_VERSION,
      manifestVersion: manifest.version,
      designDigest: currentDesignDigest,
      capabilityFingerprint,
      slide,
      inputs,
    }));
    const outputPaths = expectedOutputPaths(slide);
    const outputs = await snapshotOutputs(root, outputPaths);
    const previous = previousState.slides?.[slide.id];
    const previousOutputs = Array.isArray(previous?.outputs) ? previous.outputs : [];
    const outputsIntact = previousOutputs.length === outputs.length && outputs.every((current) => {
      const record = previousOutputs.find((item) => item.path === current.path);
      return current.exists && current.hash === record?.hash;
    });
    const cached = previous?.inputHash === inputHash && previous?.status === "complete" && outputsIntact;
    slidePlans.push({
      slideId: slide.id,
      role: slide.role,
      renderer: slide.renderer,
      agentRole: workerRole(slide),
      status: cached ? "cached" : "dirty",
      reason: cached ? "input-and-output-hashes-match" : previous ? "input-or-output-changed" : "not-built",
      inputHash,
      inputs,
      outputs,
      risk: slideRisk(slide),
    });
  }

  const outputOwners = [];
  for (const slidePlan of slidePlans) {
    for (const output of slidePlan.outputs) {
      const resolved = workspacePath(root, output.path, `slide ${slidePlan.slideId} output`);
      const ownershipKey = process.platform === "win32" ? resolved.toLowerCase() : resolved;
      const overlap = outputOwners.find((item) =>
        ownershipKey === item.key ||
        ownershipKey.startsWith(`${item.key}${path.sep}`) ||
        item.key.startsWith(`${ownershipKey}${path.sep}`),
      );
      if (overlap && overlap.slideId !== slidePlan.slideId) {
        throw new Error(
          `Slides ${overlap.slideId} and ${slidePlan.slideId} have overlapping output paths ` +
            `(${overlap.path} and ${output.path}). Give every worker an exclusive file or directory.`,
        );
      }
      outputOwners.push({ key: ownershipKey, path: output.path, slideId: slidePlan.slideId });
    }
  }

  const generatedAt = new Date().toISOString();
  const maxParallelWorkers = options.maxWorkers || production.build.maxParallelWorkers || 4;
  production.build.maxParallelWorkers = maxParallelWorkers;
  production.build.lastPreparedAt = generatedAt;
  production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  manifest.version = ["1.5", "1.6", "1.7"].includes(manifest.version) ? manifest.version : "1.4";

  const plan = {
    schemaVersion: "1.0",
    generatedAt,
    designDigest: currentDesignDigest,
    creativeDigest: ["1.5", "1.6", "1.7"].includes(manifest.version) ? production.creativePlan.digest : null,
    manifestDigest: computeManifestBuildDigest(manifest),
    capabilityFingerprint,
    maxParallelWorkers,
    summary: {
      slides: slidePlans.length,
      dirty: slidePlans.filter((item) => item.status === "dirty").length,
      cached: slidePlans.filter((item) => item.status === "cached").length,
      highRisk: slidePlans.filter((item) => item.risk.level === "high").length,
    },
    slides: slidePlans,
  };
  const taskGraph = buildTaskGraph(slidePlans, maxParallelWorkers, generatedAt);
  const qaPlan = ["1.6", "1.7"].includes(manifest.version)
    ? buildQaPlan(slidePlans, generatedAt, rubric, production.qa)
    : {
        schemaVersion: "1.0",
        generatedAt,
        strategy: "risk-based-plus-final-full",
        iterationPolicy: "Review every dirty slide and every medium/high-risk cached slide.",
        finalPolicy: "Review every slide at full size and open-check the final PPTX.",
        slides: slidePlans.map((item) => ({
          slideId: item.slideId,
          risk: item.risk,
          dirty: item.status === "dirty",
          iterationRequired: item.status === "dirty" || item.risk.level !== "low",
          finalRequired: true,
        })),
      };
  await Promise.all([
    writeJson(workspacePath(root, production.build.plan, "build plan"), plan),
    writeJson(workspacePath(root, production.build.taskGraph, "task graph"), taskGraph),
    writeJson(workspacePath(root, production.qa.plan, "QA plan"), qaPlan),
    writeJson(manifestPath, manifest),
  ]);
  return { root, plan, taskGraph, qaPlan };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await prepareBuild(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result.plan, null, 2));
    else {
      console.log(
        `Build prepared: ${result.plan.summary.dirty} dirty, ${result.plan.summary.cached} cached, ` +
          `${result.plan.summary.highRisk} high-risk slide(s); up to ${result.plan.maxParallelWorkers} workers.`,
      );
    }
  } catch (error) {
    console.error(`Build preparation failed: ${error.message}`);
    process.exit(1);
  }
}
