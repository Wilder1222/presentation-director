#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CREATIVE_CONTRACT_VERSION,
  computeCreativeDigest,
  ensureProduction,
  exists,
  readJson,
  resolveProjectDir,
  sha256,
  stableStringify,
  workspacePath,
  writeJson,
} from "./lib/production-state.mjs";

const DENSITIES = new Set(["low", "medium", "high"]);
const FOCAL_MODES = new Set(["type", "image", "diagram", "data", "ui", "motion", "mixed"]);
const EVIDENCE_TYPES = new Set(["reasoning", "source", "data", "product", "demo", "testimony", "none"]);
const ASSET_METHODS = new Set([
  "image-generation",
  "sourced-image",
  "ui-capture",
  "diagram",
  "short-motion",
  "video",
  "3d-model",
  "3d-material",
  "native",
]);
const ASSET_ROLES = new Set(["hero", "evidence", "support", "background", "diagram", "ui", "motion", "model", "texture"]);
const REUSE_POLICIES = new Set(["single-use", "system-reuse", "derived-variant"]);
const SELECTION_MODES = new Set(["deterministic", "single", "variants"]);
const REQUIRED_NARRATIVE_FIELDS = [
  "communicationJob",
  "audienceStartingPoint",
  "audienceEndState",
  "stakes",
  "arc",
  "turningPointSlideId",
  "resolution",
];

function usage() {
  console.error("Usage: node scripts/prepare-creative.mjs [project-dir] [--strict] [--json]");
}

function parseArgs(argv) {
  const options = { projectDir: undefined, strict: false, json: false };
  const args = [...argv];
  if (args[0] && !args[0].startsWith("--")) options.projectDir = args.shift();
  for (const flag of args) {
    if (flag === "--strict") options.strict = true;
    else if (flag === "--json") options.json = true;
    else {
      usage();
      process.exit(2);
    }
  }
  return options;
}

function addIssue(issues, severity, code, message, location = "creative-plan") {
  issues.push({ severity, code, message, location });
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function expectedFocalModes(renderer) {
  return {
    image_slide: new Set(["image", "mixed"]),
    svg: new Set(["diagram", "data", "mixed"]),
    ui_capture: new Set(["ui", "mixed"]),
    hyperframes_video: new Set(["motion", "mixed"]),
    remotion_video: new Set(["motion", "mixed"]),
  }[renderer];
}

function requiredCapabilities(method) {
  return {
    "image-generation": ["image_generation", "raster_processing"],
    "sourced-image": ["raster_processing"],
    "ui-capture": ["ui_capture", "raster_processing"],
    diagram: ["svg_optimization"],
    "short-motion": ["short_motion", "media_tooling"],
    video: ["video", "media_tooling"],
    "3d-model": ["video", "media_tooling", "three_d"],
    "3d-material": ["video", "media_tooling", "three_d"],
    native: ["presentation"],
  }[method] || [];
}

function validateNarrative(manifest, slides, issues) {
  const narrative = manifest.narrative;
  if (!narrative || typeof narrative !== "object" || Array.isArray(narrative)) {
    addIssue(issues, "error", "narrative.missing", "Manifest 1.5 creative planning requires a narrative object.", "narrative");
    return;
  }
  if (narrative.status !== "locked") {
    addIssue(issues, "error", "narrative.status", "Lock the narrative before preparing creative production.", "narrative.status");
  }
  for (const key of REQUIRED_NARRATIVE_FIELDS) {
    if (!nonEmpty(narrative[key])) addIssue(issues, "error", `narrative.${key}`, `${key} is required.`, `narrative.${key}`);
  }
  const ids = new Set(slides.map((slide) => slide.id));
  if (narrative.turningPointSlideId && !ids.has(narrative.turningPointSlideId)) {
    addIssue(issues, "error", "narrative.turning_point", "turningPointSlideId must reference a current slide.", "narrative.turningPointSlideId");
  }
  if (nonEmpty(narrative.communicationJob) && narrative.communicationJob.trim().length < 24) {
    addIssue(issues, "warning", "narrative.job_short", "The communication job may be too vague to constrain the deck.", "narrative.communicationJob");
  }
}

function validateSlides(slides, issues) {
  const duplicateFields = { title: new Map(), claim: new Map(), question: new Map() };
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const location = `slides[${index}]`;
    const beat = slide.narrativeBeat;
    if (!beat || typeof beat !== "object" || Array.isArray(beat)) {
      addIssue(issues, "error", "slide.narrativeBeat", "Every slide needs a narrativeBeat object.", location);
    } else {
      for (const key of ["question", "consequence"]) {
        if (!nonEmpty(beat[key])) addIssue(issues, "error", `slide.narrativeBeat.${key}`, `${key} is required.`, location);
      }
      if (index < slides.length - 1 && !nonEmpty(beat.bridgeToNext)) {
        addIssue(issues, "error", "slide.narrativeBeat.bridge", "Every non-closing slide needs bridgeToNext.", location);
      }
      if (!EVIDENCE_TYPES.has(beat.evidenceType)) {
        addIssue(issues, "error", "slide.narrativeBeat.evidence", `evidenceType must be one of ${[...EVIDENCE_TYPES].join(", ")}.`, location);
      }
      const questionKey = normalized(beat.question);
      if (questionKey) {
        if (duplicateFields.question.has(questionKey)) {
          addIssue(issues, "warning", "narrative.duplicate_question", `Question repeats slide ${duplicateFields.question.get(questionKey)}.`, location);
        } else duplicateFields.question.set(questionKey, slide.id);
      }
    }

    const visual = slide.visualPlan;
    if (!visual || typeof visual !== "object" || Array.isArray(visual)) {
      addIssue(issues, "error", "slide.visualPlan", "Every slide needs a visualPlan object.", location);
    } else {
      if (!nonEmpty(visual.silhouette)) addIssue(issues, "error", "slide.visualPlan.silhouette", "silhouette is required.", location);
      if (!DENSITIES.has(visual.density)) addIssue(issues, "error", "slide.visualPlan.density", "density must be low, medium, or high.", location);
      if (!FOCAL_MODES.has(visual.focalMode)) addIssue(issues, "error", "slide.visualPlan.focalMode", "focalMode is unsupported.", location);
      if (typeof visual.visualPeak !== "boolean") addIssue(issues, "error", "slide.visualPlan.visualPeak", "visualPeak must be boolean.", location);
      if (!nonEmpty(visual.continuityCue)) addIssue(issues, "error", "slide.visualPlan.continuityCue", "continuityCue is required.", location);
      const allowed = expectedFocalModes(slide.renderer);
      if (allowed && visual.focalMode && !allowed.has(visual.focalMode)) {
        addIssue(issues, "error", "slide.visualPlan.renderer_mismatch", `${slide.renderer} is incompatible with focalMode ${visual.focalMode}.`, location);
      }
    }

    for (const field of ["title", "claim"]) {
      const key = normalized(slide[field]);
      if (!key) continue;
      if (duplicateFields[field].has(key)) {
        addIssue(issues, "warning", `narrative.duplicate_${field}`, `${field} repeats slide ${duplicateFields[field].get(key)}.`, location);
      } else duplicateFields[field].set(key, slide.id);
    }
  }

  for (let index = 2; index < slides.length; index += 1) {
    const current = slides[index].visualPlan || {};
    const previous = slides[index - 1].visualPlan || {};
    const before = slides[index - 2].visualPlan || {};
    if (current.silhouette && current.silhouette === previous.silhouette && current.silhouette === before.silhouette) {
      addIssue(issues, "warning", "storyboard.silhouette_repetition", `Three adjacent slides repeat ${current.silhouette}.`, `slides[${index}]`);
    }
    if (current.density === "high" && previous.density === "high" && before.density === "high") {
      addIssue(issues, "warning", "storyboard.density_fatigue", "Three adjacent high-density slides create reading fatigue.", `slides[${index}]`);
    }
  }

  const peaks = slides.filter((slide) => slide.visualPlan?.visualPeak).length;
  const minimum = slides.length >= 8 ? 2 : slides.length ? 1 : 0;
  const maximum = Math.max(2, Math.ceil(slides.length / 4));
  if (peaks < minimum) addIssue(issues, "warning", "storyboard.peaks_low", `Plan at least ${minimum} visual peak(s) for this deck.`, "slides");
  if (peaks > maximum) addIssue(issues, "warning", "storyboard.peaks_high", `${peaks} visual peaks leave too little contrast; target at most ${maximum}.`, "slides");
}

function compileAssets(slides, issues) {
  const assets = [];
  const keys = new Set();
  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slide = slides[slideIndex];
    for (let assetIndex = 0; assetIndex < (slide.assets || []).length; assetIndex += 1) {
      const asset = slide.assets[assetIndex];
      const location = `slides[${slideIndex}].assets[${assetIndex}]`;
      if (!/^[a-z0-9][a-z0-9_-]*$/i.test(asset.id || "")) {
        addIssue(issues, "error", "asset.id_format", "Asset id must be filesystem-safe.", location);
      }
      const key = `${slide.id}:${asset.id}`;
      if (keys.has(key)) addIssue(issues, "error", "asset.duplicate", `Duplicate asset key ${key}.`, location);
      keys.add(key);
      const brief = asset.brief;
      if (!brief || typeof brief !== "object" || Array.isArray(brief)) {
        addIssue(issues, "error", "asset.brief", "Every asset needs a structured brief.", location);
        continue;
      }
      for (const field of ["purpose", "method", "role", "placement", "continuityKey", "reusePolicy", "selectionMode"]) {
        if (!nonEmpty(brief[field])) addIssue(issues, "error", `asset.brief.${field}`, `${field} is required.`, location);
      }
      if (!ASSET_METHODS.has(brief.method)) addIssue(issues, "error", "asset.brief.method", "Asset production method is unsupported.", location);
      if (!ASSET_ROLES.has(brief.role)) addIssue(issues, "error", "asset.brief.role", "Asset role is unsupported.", location);
      if (!REUSE_POLICIES.has(brief.reusePolicy)) addIssue(issues, "error", "asset.brief.reusePolicy", "reusePolicy is unsupported.", location);
      if (!SELECTION_MODES.has(brief.selectionMode)) addIssue(issues, "error", "asset.brief.selectionMode", "selectionMode is unsupported.", location);
      if (!Array.isArray(brief.acceptance) || brief.acceptance.length < 2 || brief.acceptance.some((item) => !nonEmpty(item))) {
        addIssue(issues, "error", "asset.brief.acceptance", "Provide at least two concrete asset acceptance checks.", location);
      }
      const variantCount = Number(brief.variantCount ?? 1);
      if (!Number.isInteger(variantCount) || variantCount < 1 || variantCount > 4) {
        addIssue(issues, "error", "asset.brief.variantCount", "variantCount must be an integer from 1 to 4.", location);
      }
      if (brief.selectionMode === "variants" && variantCount < 2) {
        addIssue(issues, "error", "asset.brief.variants", "Variant selection requires at least two candidates.", location);
      }
      if (brief.selectionMode !== "variants" && variantCount !== 1) {
        addIssue(issues, "error", "asset.brief.single_variant", "deterministic and single selection modes use variantCount 1.", location);
      }
      const dependencies = Array.isArray(brief.dependencies) ? brief.dependencies : [];
      if (dependencies.some((item) => !nonEmpty(item))) addIssue(issues, "error", "asset.brief.dependencies", "dependencies must be asset keys.", location);
      assets.push({
        key,
        slideId: slide.id,
        slideRole: slide.role,
        claim: slide.claim,
        renderer: slide.renderer,
        id: asset.id,
        kind: asset.kind,
        output: asset.path,
        status: asset.status,
        method: brief.method,
        role: brief.role,
        purpose: brief.purpose,
        placement: brief.placement,
        aspectRatio: brief.aspectRatio || null,
        continuityKey: brief.continuityKey,
        reusePolicy: brief.reusePolicy,
        selectionMode: brief.selectionMode,
        variantCount,
        dependencies,
        acceptance: brief.acceptance || [],
        mustAvoid: brief.mustAvoid || [],
        requiredCapabilities: requiredCapabilities(brief.method),
      });
    }
  }

  const byKey = new Map(assets.map((asset) => [asset.key, asset]));
  for (const asset of assets) {
    for (const dependency of asset.dependencies) {
      if (!byKey.has(dependency)) addIssue(issues, "error", "asset.dependency_missing", `${asset.key} depends on unknown asset ${dependency}.`, asset.key);
      if (dependency === asset.key) addIssue(issues, "error", "asset.dependency_self", `${asset.key} cannot depend on itself.`, asset.key);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(key, stack = []) {
    if (visiting.has(key)) {
      addIssue(issues, "error", "asset.dependency_cycle", `Asset dependency cycle: ${[...stack, key].join(" -> ")}.`, key);
      return;
    }
    if (visited.has(key) || !byKey.has(key)) return;
    visiting.add(key);
    for (const dependency of byKey.get(key).dependencies) visit(dependency, [...stack, key]);
    visiting.delete(key);
    visited.add(key);
  }
  for (const key of byKey.keys()) visit(key);
  return assets;
}

function buildAssetExecutionWaves(assets) {
  const remaining = new Map(assets.map((asset) => [asset.key, asset]));
  const completed = new Set();
  const waves = [];
  while (remaining.size) {
    const ready = [...remaining.values()]
      .filter((asset) => asset.dependencies.every((dependency) => completed.has(dependency)))
      .sort((a, b) => a.key.localeCompare(b.key));
    if (!ready.length) break;
    waves.push({
      wave: waves.length + 1,
      assets: ready.map((asset) => ({
        key: asset.key,
        method: asset.method,
        output: asset.output,
        requiredCapabilities: asset.requiredCapabilities,
      })),
    });
    for (const asset of ready) {
      remaining.delete(asset.key);
      completed.add(asset.key);
    }
  }
  return waves;
}

function buildNarrativeMap(manifest, slides, generatedAt, digest) {
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    communicationJob: manifest.narrative.communicationJob,
    audienceStartingPoint: manifest.narrative.audienceStartingPoint,
    audienceEndState: manifest.narrative.audienceEndState,
    stakes: manifest.narrative.stakes,
    arc: manifest.narrative.arc,
    turningPointSlideId: manifest.narrative.turningPointSlideId,
    resolution: manifest.narrative.resolution,
    titleSequence: slides.map((slide) => slide.title),
    beats: slides.map((slide, index) => ({
      order: index + 1,
      slideId: slide.id,
      role: slide.role,
      question: slide.narrativeBeat.question,
      answer: slide.claim,
      evidenceType: slide.narrativeBeat.evidenceType,
      consequence: slide.narrativeBeat.consequence,
      bridgeToNext: slide.narrativeBeat.bridgeToNext || null,
    })),
  };
}

function buildStoryboard(slides, generatedAt, digest) {
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    slides: slides.map((slide, index) => ({
      order: index + 1,
      slideId: slide.id,
      role: slide.role,
      layoutPattern: slide.layoutPattern,
      renderer: slide.renderer,
      silhouette: slide.visualPlan.silhouette,
      density: slide.visualPlan.density,
      focalMode: slide.visualPlan.focalMode,
      visualPeak: slide.visualPlan.visualPeak,
      continuityCue: slide.visualPlan.continuityCue,
    })),
  };
}

function buildProviderBrief(manifest, slide, asset, generatedAt, digest) {
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  const index = slides.findIndex((item) => item.id === slide.id);
  const previous = index > 0 ? slides[index - 1] : null;
  const next = index >= 0 && index < slides.length - 1 ? slides[index + 1] : null;
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    designSource: "DESIGN.md",
    tasteProfile: manifest.tasteProfile,
    narrative: {
      communicationJob: manifest.narrative.communicationJob,
      audienceStartingPoint: manifest.narrative.audienceStartingPoint,
      audienceEndState: manifest.narrative.audienceEndState,
      stakes: manifest.narrative.stakes,
      arc: manifest.narrative.arc,
      turningPointSlideId: manifest.narrative.turningPointSlideId,
      resolution: manifest.narrative.resolution,
    },
    slide: {
      id: slide.id,
      role: slide.role,
      title: slide.title,
      claim: slide.claim,
      content: slide.content || {},
      narrativeBeat: slide.narrativeBeat,
      visualPlan: slide.visualPlan,
      relationshipToPrevious: previous?.narrativeBeat?.bridgeToNext || manifest.narrative.audienceStartingPoint,
      relationshipToNext: slide.narrativeBeat.bridgeToNext || manifest.narrative.resolution,
      previousSlide: previous ? { id: previous.id, title: previous.title, claim: previous.claim } : null,
      nextSlide: next ? { id: next.id, title: next.title, claim: next.claim } : null,
    },
    asset,
    output: asset.output,
    prohibited: [...new Set([...(asset.mustAvoid || []), ...(manifest.tasteProfile?.antiDefaults || [])])],
    acceptance: asset.acceptance,
  };
}

export async function prepareCreative(projectDir, options = {}) {
  const root = resolveProjectDir(projectDir);
  const manifestPath = path.join(root, "presentation.json");
  const designPath = path.join(root, "DESIGN.md");
  if (!(await exists(manifestPath)) || !(await exists(designPath))) {
    throw new Error(`DESIGN.md and presentation.json are required in ${root}`);
  }
  const [manifest, design] = await Promise.all([readJson(manifestPath), readFile(designPath, "utf8")]);
  if (manifest.styleDecision?.status !== "selected") throw new Error("Select the visual direction before preparing the creative plan.");
  if (manifest.tasteProfile?.status !== "locked" || manifest.tasteProfile?.contentSwapTest !== "pass") {
    throw new Error("Lock tasteProfile and pass the content-swap test before preparing the creative plan.");
  }
  if (!design.includes("## Asset Language")) throw new Error("DESIGN.md needs a locked ## Asset Language section.");
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  if (!slides.length) throw new Error("Define the slide sequence before preparing the creative plan.");

  const issues = [];
  validateNarrative(manifest, slides, issues);
  validateSlides(slides, issues);
  const assets = compileAssets(slides, issues);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  if (errors.length || (options.strict && warnings.length)) {
    const relevant = errors.length ? errors : warnings;
    throw new Error(relevant.map((issue) => `${issue.code} at ${issue.location}: ${issue.message}`).join("\n"));
  }

  manifest.version = "1.5";
  const digest = computeCreativeDigest(manifest);
  const production = ensureProduction(manifest);
  const previousDigest = production.creativePlan.digest;
  const generatedAt = previousDigest === digest && production.creativePlan.preparedAt
    ? production.creativePlan.preparedAt
    : new Date().toISOString();
  const narrativeMap = buildNarrativeMap(manifest, slides, generatedAt, digest);
  const storyboard = buildStoryboard(slides, generatedAt, digest);
  const assetPlan = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    assets,
    executionWaves: buildAssetExecutionWaves(assets),
  };
  const providerBriefs = [];
  for (const asset of assets) {
    const slide = slides.find((item) => item.id === asset.slideId);
    const briefPath = `tmp/provider-briefs/${slide.id}/${asset.id}.json`;
    const providerBrief = buildProviderBrief(manifest, slide, asset, generatedAt, digest);
    await writeJson(
      workspacePath(root, briefPath, `provider brief ${asset.key}`),
      providerBrief,
    );
    providerBriefs.push({ assetKey: asset.key, path: briefPath, digest: sha256(stableStringify(providerBrief)) });
  }
  const providerIndexPath = "tmp/provider-briefs/index.json";
  const providerIndex = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    briefs: providerBriefs,
  };
  await writeJson(workspacePath(root, providerIndexPath, "provider brief index"), providerIndex);
  const report = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    ready: true,
    metrics: {
      slides: slides.length,
      assets: assets.length,
      providerBriefs: providerBriefs.length,
      assetWaves: assetPlan.executionWaves.length,
      visualPeaks: slides.filter((slide) => slide.visualPlan.visualPeak).length,
      continuityFamilies: new Set(assets.map((asset) => asset.continuityKey)).size,
    },
    issues,
  };
  production.creativePlan = {
    status: "prepared",
    contractVersion: CREATIVE_CONTRACT_VERSION,
    preparedAt: generatedAt,
    digest,
    narrativeMap: "tmp/creative/narrative-map.json",
    storyboard: "tmp/creative/storyboard.json",
    assetPlan: "tmp/creative/asset-plan.json",
    report: "tmp/creative/report.json",
    providerBriefsRoot: "tmp/provider-briefs",
    providerIndex: providerIndexPath,
    artifactHashes: {
      narrativeMap: sha256(stableStringify(narrativeMap)),
      storyboard: sha256(stableStringify(storyboard)),
      assetPlan: sha256(stableStringify(assetPlan)),
      report: sha256(stableStringify(report)),
      providerIndex: sha256(stableStringify(providerIndex)),
    },
    warnings: warnings.length,
  };
  if (production.designLock.status === "locked" && previousDigest !== digest) {
    production.designLock = {
      ...production.designLock,
      status: "pending",
      lockedAt: null,
      approvedBy: null,
      designDigest: null,
      creativeDigest: null,
      samples: [],
    };
    production.qa.finalFullReview = { status: "pending", completedAt: null, reviewer: null };
  }
  await Promise.all([
    writeJson(workspacePath(root, production.creativePlan.narrativeMap, "narrative map"), narrativeMap),
    writeJson(workspacePath(root, production.creativePlan.storyboard, "storyboard"), storyboard),
    writeJson(workspacePath(root, production.creativePlan.assetPlan, "asset plan"), assetPlan),
    writeJson(workspacePath(root, production.creativePlan.report, "creative report"), report),
    writeJson(manifestPath, manifest),
  ]);
  return { root, digest, narrativeMap, storyboard, assetPlan, providerBriefs, report };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await prepareCreative(options.projectDir || process.cwd(), options);
    if (options.json) console.log(JSON.stringify(result.report, null, 2));
    else {
      console.log(
        `Creative plan prepared: ${result.report.metrics.slides} slides, ${result.report.metrics.assets} assets in ` +
          `${result.report.metrics.assetWaves} wave(s), ${result.providerBriefs.length} provider briefs, ` +
          `${result.report.issues.length} warning(s).`,
      );
    }
  } catch (error) {
    console.error(`Creative planning failed: ${error.message}`);
    process.exit(1);
  }
}
