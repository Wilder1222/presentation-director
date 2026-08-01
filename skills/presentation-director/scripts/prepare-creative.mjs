#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CREATIVE_CONTRACT_VERSION,
  computeCreativeDigest,
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
const REGION_PRIORITIES = new Set(["primary", "secondary", "support"]);
const CONTENT_PREFERENCE_SOURCES = new Set(["specified", "inferred", "default"]);
const CONTENT_COMPRESSION = new Set(["low", "medium", "high"]);
const EVIDENCE_ORDERS = new Set(["before-claim", "after-claim", "contextual"]);
const NOTES_DETAIL = new Set(["low", "medium", "high"]);
const DELIVERY_MODES = new Set(["live", "async", "self-guided"]);
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

function safeStableId(prefix, preferred, payload) {
  if (preferred && /^[a-z0-9][a-z0-9_-]*$/i.test(preferred)) return preferred;
  return `${prefix}-${sha256(stableStringify(payload)).slice(0, 12)}`;
}

function validatePageDesign(slide, issues, location) {
  const design = slide.pageDesign;
  if (!design || typeof design !== "object" || Array.isArray(design)) {
    addIssue(issues, "error", "slide.pageDesign", "Manifest 1.6 requires a renderer-neutral pageDesign object.", location);
    return;
  }
  for (const key of ["designIntent", "backgroundLayer", "layoutLayer", "contentLayer", "focalPoint"]) {
    if (!nonEmpty(design[key])) addIssue(issues, "error", `slide.pageDesign.${key}`, `${key} is required.`, location);
  }
  const negativeSpace = Number(design.negativeSpaceTarget);
  if (!Number.isFinite(negativeSpace) || negativeSpace < 0.1 || negativeSpace > 0.8) {
    addIssue(issues, "error", "slide.pageDesign.negativeSpaceTarget", "negativeSpaceTarget must be from 0.1 to 0.8.", location);
  }
  const regions = Array.isArray(design.regions) ? design.regions : [];
  if (regions.length < 2 || regions.length > 8) {
    addIssue(issues, "error", "slide.pageDesign.regions", "Define two to eight semantic page regions.", location);
  }
  const regionIds = new Set();
  for (let index = 0; index < regions.length; index += 1) {
    const region = regions[index];
    const regionLocation = `${location}.pageDesign.regions[${index}]`;
    for (const key of ["id", "role", "anchor", "span"]) {
      if (!nonEmpty(region?.[key])) addIssue(issues, "error", `slide.pageDesign.region.${key}`, `${key} is required.`, regionLocation);
    }
    if (region?.id && regionIds.has(region.id)) addIssue(issues, "error", "slide.pageDesign.region.duplicate", `Duplicate region id ${region.id}.`, regionLocation);
    if (region?.id) regionIds.add(region.id);
    if (!REGION_PRIORITIES.has(region?.priority)) {
      addIssue(issues, "error", "slide.pageDesign.region.priority", "priority must be primary, secondary, or support.", regionLocation);
    }
  }
  const readingPath = Array.isArray(design.readingPath) ? design.readingPath : [];
  if (readingPath.length < 2 || readingPath.some((id) => !regionIds.has(id))) {
    addIssue(issues, "error", "slide.pageDesign.readingPath", "readingPath must reference at least two declared region ids.", location);
  }
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
    addIssue(issues, "error", "narrative.missing", "Manifest 1.6 creative planning requires a narrative object.", "narrative");
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
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(slide.claimId || "")) {
      addIssue(issues, "error", "slide.claimId", "Every slide needs a stable filesystem-safe claimId.", location);
    }
    if (slide.claimKind === "external" && !(slide.sources || []).length) {
      addIssue(issues, "error", "slide.sources", "External claims require at least one source.", location);
    }
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

    validatePageDesign(slide, issues, location);

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

function validateContentPreferenceAndDelivery(manifest, slides, issues) {
  const preference = manifest.contentPreference;
  if (!preference || typeof preference !== "object" || Array.isArray(preference)) {
    addIssue(issues, "error", "contentPreference.missing", "Manifest 1.7 creative planning requires contentPreference.", "contentPreference");
  } else {
    if (preference.status !== "locked") addIssue(issues, "error", "contentPreference.status", "Lock contentPreference before creative production.", "contentPreference.status");
    if (!CONTENT_PREFERENCE_SOURCES.has(preference.source)) addIssue(issues, "error", "contentPreference.source", "source must be specified, inferred, or default.", "contentPreference.source");
    if (!CONTENT_COMPRESSION.has(preference.compression)) addIssue(issues, "error", "contentPreference.compression", "compression must be low, medium, or high.", "contentPreference.compression");
    if (!EVIDENCE_ORDERS.has(preference.evidenceOrder)) addIssue(issues, "error", "contentPreference.evidenceOrder", "evidenceOrder must be before-claim, after-claim, or contextual.", "contentPreference.evidenceOrder");
    if (!NOTES_DETAIL.has(preference.speakerNotesDetail)) addIssue(issues, "error", "contentPreference.speakerNotesDetail", "speakerNotesDetail must be low, medium, or high.", "contentPreference.speakerNotesDetail");
    for (const key of ["prefers", "avoids"]) {
      if (!Array.isArray(preference[key]) || !preference[key].length || preference[key].some((item) => !nonEmpty(item))) {
        addIssue(issues, "error", `contentPreference.${key}`, `${key} must contain at least one concrete preference.`, `contentPreference.${key}`);
      }
    }
    if (preference.source === "inferred" && !nonEmpty(preference.inferenceNote)) {
      addIssue(issues, "error", "contentPreference.inferenceNote", "Inferred content preferences need a concise inferenceNote.", "contentPreference.inferenceNote");
    }
  }

  const delivery = manifest.delivery;
  if (!delivery || typeof delivery !== "object" || Array.isArray(delivery)) {
    addIssue(issues, "error", "delivery.missing", "Manifest 1.7 creative planning requires a delivery contract.", "delivery");
    return;
  }
  if (delivery.status !== "locked") addIssue(issues, "error", "delivery.status", "Lock the delivery plan before creative production.", "delivery.status");
  if (!DELIVERY_MODES.has(delivery.mode)) addIssue(issues, "error", "delivery.mode", "mode must be live, async, or self-guided.", "delivery.mode");
  if (!nonEmpty(delivery.presenterGoal)) addIssue(issues, "error", "delivery.presenterGoal", "presenterGoal is required.", "delivery.presenterGoal");
  const totalSeconds = Number(delivery.totalSeconds);
  const reserveSeconds = Number(delivery.reserveSeconds);
  const tolerance = Number(delivery.timingTolerance);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) addIssue(issues, "error", "delivery.totalSeconds", "totalSeconds must be positive.", "delivery.totalSeconds");
  if (!Number.isFinite(reserveSeconds) || reserveSeconds < 0 || reserveSeconds >= totalSeconds) addIssue(issues, "error", "delivery.reserveSeconds", "reserveSeconds must be non-negative and lower than totalSeconds.", "delivery.reserveSeconds");
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 0.3) addIssue(issues, "error", "delivery.timingTolerance", "timingTolerance must be from 0 to 0.3.", "delivery.timingTolerance");
  if (!Array.isArray(delivery.acceptanceCriteria) || delivery.acceptanceCriteria.some((item) => !nonEmpty(item))) addIssue(issues, "error", "delivery.acceptanceCriteria", "acceptanceCriteria must be an array of non-empty delivery requirements.", "delivery.acceptanceCriteria");

  let plannedSeconds = 0;
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const location = `slides[${index}].delivery`;
    const plan = slide.delivery;
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
      addIssue(issues, "error", "slide.delivery", "Every slide needs a delivery plan.", location);
      continue;
    }
    const timeBudget = Number(plan.timeBudgetSeconds);
    if (!Number.isFinite(timeBudget) || timeBudget <= 0) addIssue(issues, "error", "slide.delivery.timeBudgetSeconds", "timeBudgetSeconds must be positive.", location);
    else plannedSeconds += timeBudget;
    if (!nonEmpty(plan.spokenDetail)) addIssue(issues, "error", "slide.delivery.spokenDetail", "spokenDetail must state what the presenter adds beyond visible copy.", location);
    if (index < slides.length - 1 && !nonEmpty(plan.transitionLine)) addIssue(issues, "error", "slide.delivery.transitionLine", "Every non-closing slide needs a transitionLine.", location);
    if (plan.acceptanceCriteria !== undefined && (!Array.isArray(plan.acceptanceCriteria) || plan.acceptanceCriteria.some((item) => !nonEmpty(item)))) addIssue(issues, "error", "slide.delivery.acceptanceCriteria", "acceptanceCriteria must be an array of non-empty delivery requirements.", location);
    const regionIds = new Set((slide.pageDesign?.regions || []).map((region) => region.id));
    const cues = Array.isArray(plan.attentionCues) ? plan.attentionCues : [];
    if (!cues.length) addIssue(issues, "error", "slide.delivery.attentionCues", "Every slide needs at least one attention cue.", location);
    for (let cueIndex = 0; cueIndex < cues.length; cueIndex += 1) {
      const cue = cues[cueIndex];
      const cueLocation = `${location}.attentionCues[${cueIndex}]`;
      if (!Number.isFinite(Number(cue?.atSeconds)) || Number(cue.atSeconds) < 0 || Number(cue.atSeconds) >= timeBudget) {
        addIssue(issues, "error", "slide.delivery.cue_time", "Cue time must fall inside the slide time budget.", cueLocation);
      }
      if (!regionIds.has(cue?.target)) addIssue(issues, "error", "slide.delivery.cue_target", "Cue target must reference a pageDesign region id.", cueLocation);
      if (!nonEmpty(cue?.purpose)) addIssue(issues, "error", "slide.delivery.cue_purpose", "Cue purpose is required.", cueLocation);
    }
  }
  if (Number.isFinite(totalSeconds) && Number.isFinite(reserveSeconds) && plannedSeconds + reserveSeconds !== totalSeconds) {
    addIssue(issues, "error", "delivery.budget_sum", `Slide budgets (${plannedSeconds}s) plus reserve (${reserveSeconds}s) must equal totalSeconds (${totalSeconds}s).`, "delivery");
  }
}

async function hydrateEvidenceSources(root, slides, issues) {
  const registry = new Map();
  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slide = slides[slideIndex];
    slide.claimId = safeStableId("claim", slide.claimId || `claim-${slide.id}`, {
      slideId: slide.id,
      claim: slide.claim,
    });
    for (let sourceIndex = 0; sourceIndex < (slide.sources || []).length; sourceIndex += 1) {
      const source = slide.sources[sourceIndex];
      const location = `slides[${slideIndex}].sources[${sourceIndex}]`;
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        addIssue(issues, "error", "source.object", "Sources must be objects.", location);
        continue;
      }
      if (!nonEmpty(source.label)) addIssue(issues, "error", "source.label", "Source label is required.", location);
      if (!nonEmpty(source.path) && !nonEmpty(source.url)) {
        addIssue(issues, "error", "source.location", "Source path or URL is required.", location);
        continue;
      }
      if (source.path && source.url) addIssue(issues, "error", "source.ambiguous", "Use path or URL, not both.", location);
      const identity = {
        label: source.label,
        path: source.path || null,
        url: source.url || null,
        usage: source.usage || null,
      };
      source.id = safeStableId("src", source.id, identity);
      if (source.path) {
        try {
          const target = workspacePath(root, source.path, `source ${source.id}`);
          if (!(await exists(target))) addIssue(issues, "error", "source.missing", `Source file is missing: ${source.path}.`, location);
          else source.contentHash = await hashPath(target);
        } catch (error) {
          addIssue(issues, "error", "source.path", error.message, location);
        }
      } else {
        source.contentHash = sha256(stableStringify(identity));
      }
      const prior = registry.get(source.id);
      if (prior && stableStringify(prior) !== stableStringify(source)) {
        addIssue(issues, "error", "source.id_conflict", `Source id ${source.id} resolves to conflicting records.`, location);
      } else registry.set(source.id, source);
    }
  }
  return [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function buildEvidenceArtifacts(manifest, slides, sources, generatedAt, digest) {
  const claims = slides.map((slide) => ({
    id: slide.claimId,
    slideId: slide.id,
    kind: slide.claimKind,
    text: slide.claim,
    title: slide.title,
    evidenceType: slide.narrativeBeat.evidenceType,
    sourceIds: (slide.sources || []).map((source) => source.id),
    audienceQuestion: slide.narrativeBeat.question,
    consequence: slide.narrativeBeat.consequence,
    contentDigest: sha256(stableStringify(slide.content || {})),
  }));
  const evidenceBundle = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    audience: manifest.deck.audience,
    objective: manifest.deck.objective,
    centralTakeaway: manifest.deck.centralTakeaway,
    sources,
    claims,
  };
  const contentAlignment = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    slides: slides.map((slide) => ({
      slideId: slide.id,
      claimId: slide.claimId,
      sourceIds: (slide.sources || []).map((source) => source.id),
      assetIds: (slide.assets || []).map((asset) => `${slide.id}:${asset.id}`),
      motionSegmentIds: (slide.motion?.segments || []).map((segment, index) =>
        safeStableId("segment", segment?.id || `${slide.id}-segment-${index + 1}`, { slideId: slide.id, index }),
      ),
    })),
  };
  return { evidenceBundle, contentAlignment };
}

function buildPageDesignArtifacts(slides, generatedAt, digest) {
  const designs = slides.map((slide, index) => ({
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    order: index + 1,
    slideId: slide.id,
    role: slide.role,
    renderer: slide.renderer,
    layoutPattern: slide.layoutPattern,
    visualPlan: slide.visualPlan,
    pageDesign: slide.pageDesign,
  }));
  const index = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    designs: designs.map((design) => ({
      slideId: design.slideId,
      path: `tmp/design/page-design/${design.slideId}.json`,
      digest: sha256(stableStringify(design)),
    })),
  };
  return { designs, index };
}

function buildContentPreferenceArtifact(manifest, generatedAt, digest) {
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    audience: manifest.deck.audience,
    objective: manifest.deck.objective,
    ...manifest.contentPreference,
  };
}

function buildDeliveryPlan(manifest, slides, generatedAt, digest) {
  const plannedSpeakingSeconds = slides.reduce((total, slide) => total + Number(slide.delivery.timeBudgetSeconds), 0);
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    mode: manifest.delivery.mode,
    presenterGoal: manifest.delivery.presenterGoal,
    totalSeconds: Number(manifest.delivery.totalSeconds),
    plannedSpeakingSeconds,
    reserveSeconds: Number(manifest.delivery.reserveSeconds),
    timingTolerance: Number(manifest.delivery.timingTolerance),
    slides: slides.map((slide, index) => ({
      order: index + 1,
      slideId: slide.id,
      title: slide.title,
      claim: slide.claim,
      timeBudgetSeconds: Number(slide.delivery.timeBudgetSeconds),
      spokenDetail: slide.delivery.spokenDetail,
      attentionCues: slide.delivery.attentionCues,
      transitionLine: slide.delivery.transitionLine || null,
      acceptanceCriteria: slide.delivery.acceptanceCriteria || [],
    })),
  };
}

function buildDeckRubric(manifest, slides, generatedAt, digest) {
  const checks = [
    {
      id: "deck-central-takeaway",
      scope: "deck",
      dimension: "artifact",
      severity: "blocking",
      requirement: `The deck makes this takeaway unavoidable: ${manifest.deck.centralTakeaway}`,
      evidenceIds: slides.map((slide) => slide.claimId),
    },
    {
      id: "deck-audience-transition",
      scope: "deck",
      dimension: "artifact",
      severity: "blocking",
      requirement: `The narrative moves ${manifest.deck.audience} from \"${manifest.narrative.audienceStartingPoint}\" to \"${manifest.narrative.audienceEndState}\".`,
      evidenceIds: slides.map((slide) => slide.claimId),
    },
    ...((manifest.deck.acceptanceCriteria || []).map((requirement, index) => ({
      id: `deck-custom-${String(index + 1).padStart(2, "0")}`,
      scope: "deck",
      dimension: "artifact",
      severity: "blocking",
      requirement,
      evidenceIds: [],
    }))),
    {
      id: "deck-time-budget",
      scope: "deck",
      dimension: "delivery",
      severity: "blocking",
      requirement: `The rehearsed deck fits ${manifest.delivery.totalSeconds} seconds including ${manifest.delivery.reserveSeconds} seconds of reserve within a ${Math.round(manifest.delivery.timingTolerance * 100)}% timing tolerance.`,
      evidenceIds: [],
    },
    ...((manifest.delivery.acceptanceCriteria || []).map((requirement, index) => ({
      id: `deck-delivery-custom-${String(index + 1).padStart(2, "0")}`,
      scope: "deck",
      dimension: "delivery",
      severity: "blocking",
      requirement,
      evidenceIds: [],
    }))),
  ];
  for (const slide of slides) {
    const sourceIds = (slide.sources || []).map((source) => source.id);
    checks.push(
      {
        id: `${slide.id}-claim-visible`,
        scope: "slide",
        slideId: slide.id,
        dimension: "artifact",
        severity: "blocking",
        requirement: `The audience can recover the claim \"${slide.claim}\" from the rendered slide without speaker explanation.`,
        evidenceIds: [slide.claimId],
        sourceIds,
      },
      {
        id: `${slide.id}-question-answered`,
        scope: "slide",
        slideId: slide.id,
        dimension: "artifact",
        severity: "blocking",
        requirement: `The slide visibly answers \"${slide.narrativeBeat.question}\".`,
        evidenceIds: [slide.claimId],
        sourceIds,
      },
      {
        id: `${slide.id}-design-intent`,
        scope: "slide",
        slideId: slide.id,
        dimension: "artifact",
        severity: "blocking",
        requirement: `The rendered composition implements this page-design intent: ${slide.pageDesign.designIntent}`,
        evidenceIds: [],
        sourceIds: [],
      },
    );
    for (let index = 0; index < (slide.delivery.acceptanceCriteria || []).length; index += 1) {
      checks.push({
        id: `${slide.id}-delivery-custom-${String(index + 1).padStart(2, "0")}`,
        scope: "slide",
        slideId: slide.id,
        dimension: "delivery",
        severity: "blocking",
        requirement: slide.delivery.acceptanceCriteria[index],
        evidenceIds: [slide.claimId],
      });
    }
    if (slide.claimKind === "external") {
      checks.push({
        id: `${slide.id}-source-grounding`,
        scope: "slide",
        slideId: slide.id,
        dimension: "artifact",
        severity: "blocking",
        requirement: "Every material external claim is supported by the declared source and mirrored in speaker notes.",
        evidenceIds: [slide.claimId],
        sourceIds,
      });
    }
    for (let index = 0; index < (slide.acceptanceCriteria || []).length; index += 1) {
      checks.push({
        id: `${slide.id}-custom-${String(index + 1).padStart(2, "0")}`,
        scope: "slide",
        slideId: slide.id,
        dimension: "artifact",
        severity: "blocking",
        requirement: slide.acceptanceCriteria[index],
        evidenceIds: [slide.claimId],
        sourceIds,
      });
    }
    checks.push(
      {
        id: `${slide.id}-delivery-timing`,
        scope: "slide",
        slideId: slide.id,
        dimension: "delivery",
        severity: "blocking",
        requirement: `The presenter completes this slide within ${slide.delivery.timeBudgetSeconds} seconds, allowing the deck-level timing tolerance.`,
        evidenceIds: [],
      },
      {
        id: `${slide.id}-spoken-complement`,
        scope: "slide",
        slideId: slide.id,
        dimension: "delivery",
        severity: "blocking",
        requirement: `The spoken layer adds this detail instead of reading visible copy: ${slide.delivery.spokenDetail}`,
        evidenceIds: [slide.claimId],
      },
      {
        id: `${slide.id}-attention-cues`,
        scope: "slide",
        slideId: slide.id,
        dimension: "delivery",
        severity: "blocking",
        requirement: `The delivery directs attention in this order: ${slide.delivery.attentionCues.map((cue) => `${cue.atSeconds}s→${cue.target} (${cue.purpose})`).join("; ")}`,
        evidenceIds: [],
      },
    );
  }
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    evaluation: "binary-instance-specific",
    checks,
  };
}

function buildProviderBrief(manifest, slide, asset, generatedAt, digest) {
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  const index = slides.findIndex((item) => item.id === slide.id);
  const previous = index > 0 ? slides[index - 1] : null;
  const next = index >= 0 && index < slides.length - 1 ? slides[index + 1] : null;
  const { status: _productionStatus, ...assetContract } = asset;
  return {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    designSource: "DESIGN.md",
    tasteProfile: manifest.tasteProfile,
    contentPreference: manifest.contentPreference,
    deliveryPlanPath: "tmp/delivery/delivery-plan.json",
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
      pageDesign: slide.pageDesign,
      pageDesignPath: `tmp/design/page-design/${slide.id}.json`,
      delivery: slide.delivery,
      claimId: slide.claimId,
      sourceIds: (slide.sources || []).map((source) => source.id),
      relationshipToPrevious: previous?.narrativeBeat?.bridgeToNext || manifest.narrative.audienceStartingPoint,
      relationshipToNext: slide.narrativeBeat.bridgeToNext || manifest.narrative.resolution,
      previousSlide: previous ? { id: previous.id, title: previous.title, claim: previous.claim } : null,
      nextSlide: next ? { id: next.id, title: next.title, claim: next.claim } : null,
    },
    asset: assetContract,
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
  const sources = await hydrateEvidenceSources(root, slides, issues);
  validateNarrative(manifest, slides, issues);
  validateContentPreferenceAndDelivery(manifest, slides, issues);
  validateSlides(slides, issues);
  const assets = compileAssets(slides, issues);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  if (errors.length || (options.strict && warnings.length)) {
    const relevant = errors.length ? errors : warnings;
    throw new Error(relevant.map((issue) => `${issue.code} at ${issue.location}: ${issue.message}`).join("\n"));
  }

  manifest.version = "1.7";
  const digest = computeCreativeDigest(manifest);
  const production = ensureProduction(manifest);
  const previousDigest = production.creativePlan.digest;
  const generatedAt = previousDigest === digest && production.creativePlan.preparedAt
    ? production.creativePlan.preparedAt
    : new Date().toISOString();
  const narrativeMap = buildNarrativeMap(manifest, slides, generatedAt, digest);
  const storyboard = buildStoryboard(slides, generatedAt, digest);
  const { evidenceBundle, contentAlignment } = buildEvidenceArtifacts(manifest, slides, sources, generatedAt, digest);
  const pageDesignArtifacts = buildPageDesignArtifacts(slides, generatedAt, digest);
  const contentPreference = buildContentPreferenceArtifact(manifest, generatedAt, digest);
  const deliveryPlan = buildDeliveryPlan(manifest, slides, generatedAt, digest);
  const deckRubric = buildDeckRubric(manifest, slides, generatedAt, digest);
  const assetPlan = {
    schemaVersion: CREATIVE_CONTRACT_VERSION,
    generatedAt,
    creativeDigest: digest,
    assets,
    executionWaves: buildAssetExecutionWaves(assets),
  };
  const providerBriefs = [];
  for (const pageDesign of pageDesignArtifacts.designs) {
    await writeJson(
      workspacePath(root, `tmp/design/page-design/${pageDesign.slideId}.json`, `page design ${pageDesign.slideId}`),
      pageDesign,
    );
  }
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
      evidenceSources: evidenceBundle.sources.length,
      evidenceClaims: evidenceBundle.claims.length,
      rubricChecks: deckRubric.checks.length,
      pageDesigns: pageDesignArtifacts.designs.length,
      deliverySeconds: deliveryPlan.totalSeconds,
      deliveryReserveSeconds: deliveryPlan.reserveSeconds,
      deliveryChecks: deckRubric.checks.filter((check) => check.dimension === "delivery").length,
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
    evidenceBundle: "tmp/evidence/evidence-bundle.json",
    contentAlignment: "tmp/evidence/content-alignment.json",
    pageDesignIndex: "tmp/design/page-design/index.json",
    deckRubric: "tmp/qa/deck-rubric.json",
    contentPreference: "tmp/preferences/content-preference.json",
    deliveryPlan: "tmp/delivery/delivery-plan.json",
    report: "tmp/creative/report.json",
    providerBriefsRoot: "tmp/provider-briefs",
    providerIndex: providerIndexPath,
    artifactHashes: {
      narrativeMap: sha256(stableStringify(narrativeMap)),
      storyboard: sha256(stableStringify(storyboard)),
      assetPlan: sha256(stableStringify(assetPlan)),
      evidenceBundle: sha256(stableStringify(evidenceBundle)),
      contentAlignment: sha256(stableStringify(contentAlignment)),
      pageDesignIndex: sha256(stableStringify(pageDesignArtifacts.index)),
      deckRubric: sha256(stableStringify(deckRubric)),
      contentPreference: sha256(stableStringify(contentPreference)),
      deliveryPlan: sha256(stableStringify(deliveryPlan)),
      report: sha256(stableStringify(report)),
      providerIndex: sha256(stableStringify(providerIndex)),
    },
    warnings: warnings.length,
  };
  if (previousDigest !== digest) {
    production.delivery = {
      ...production.delivery,
      rehearsalStatus: "pending",
      rehearsalHash: null,
      qualityScorecardStatus: "pending",
      qualityScorecardHash: null,
      nativeCapabilityStatus: "pending",
      nativeCapabilityHash: null,
    };
  }
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
    writeJson(workspacePath(root, production.creativePlan.evidenceBundle, "evidence bundle"), evidenceBundle),
    writeJson(workspacePath(root, production.creativePlan.contentAlignment, "content alignment"), contentAlignment),
    writeJson(workspacePath(root, production.creativePlan.pageDesignIndex, "page design index"), pageDesignArtifacts.index),
    writeJson(workspacePath(root, production.creativePlan.deckRubric, "deck rubric"), deckRubric),
    writeJson(workspacePath(root, production.creativePlan.contentPreference, "content preference"), contentPreference),
    writeJson(workspacePath(root, production.creativePlan.deliveryPlan, "delivery plan"), deliveryPlan),
    writeJson(workspacePath(root, production.creativePlan.report, "creative report"), report),
    writeJson(manifestPath, manifest),
  ]);
  return {
    root,
    digest,
    narrativeMap,
    storyboard,
    evidenceBundle,
    contentAlignment,
    pageDesignIndex: pageDesignArtifacts.index,
    contentPreference,
    deliveryPlan,
    deckRubric,
    assetPlan,
    providerBriefs,
    report,
  };
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
          `${result.report.metrics.rubricChecks} task-specific checks, ` +
          `${result.report.issues.length} warning(s).`,
      );
    }
  } catch (error) {
    console.error(`Creative planning failed: ${error.message}`);
    process.exit(1);
  }
}
