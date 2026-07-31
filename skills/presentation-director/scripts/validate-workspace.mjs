#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCreativeDigest,
  computeDesignDigest,
  computeManifestBuildDigest,
  hashFile,
  inspectBuildRecord,
  sha256,
  stableStringify,
  workspacePath,
} from "./lib/production-state.mjs";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPENDENCY_PATH = path.join(SKILL_DIR, "references", "dependencies.json");
const WORKSPACE_NAME = "presentation-director";
const RENDERERS = new Set([
  "native_ppt",
  "image_slide",
  "svg",
  "ui_capture",
  "hyperframes_video",
  "remotion_video",
]);
const EDITABILITY = new Set(["native", "mixed", "replaceable-media", "flattened"]);
const VIDEO_RENDERERS = new Set(["hyperframes_video", "remotion_video"]);
const THREE_ASSET_KINDS = new Set(["3d-model", "texture", "environment-map"]);
const STYLE_MODES = new Set(["specified", "auto", "recommend"]);
const STYLE_KINDS = new Set(["user-template", "preset", "custom"]);
const REFERENCE_DEPTHS = new Set(["user-source", "preview", "source", "web-research"]);
const RAW_STATUSES = new Set(["not-checked", "not-applicable", "not-available", "loaded"]);
const RESEARCH_STATUSES = new Set(["not-required", "pending", "complete"]);
const TASTE_STATUSES = new Set(["draft", "locked"]);
const CONTENT_SWAP_STATUSES = new Set(["not-run", "revise", "pass"]);
const DELIVERY_CONTRACT = {
  primaryArtifact: "pptx",
  readyToPresent: true,
  narrativeRequired: true,
  visualImpact: "high",
  fidelity: "high",
  editability: "native-first",
  fullPageRaster: "exception-only",
};
const DESIGN_HEADINGS = [
  "## Identity",
  "## Colors",
  "## Typography",
  "## Layout",
  "## Motion",
  "## Do Not",
  "## Rights",
];
const TASTE_HEADINGS = ["## Design Thesis", "## Design DNA", "## Anti-AI Defaults"];
const CREATIVE_ASSET_METHODS = new Set([
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
const CREATIVE_SELECTION_MODES = new Set(["deterministic", "single", "variants"]);

function parseArgs(argv) {
  const projectDir = argv.find((arg) => !arg.startsWith("--"));
  return {
    projectDir,
    allowDraft: argv.includes("--allow-draft"),
    json: argv.includes("--json"),
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function addIssue(issues, severity, code, message, location = "workspace") {
  issues.push({ severity, code, location, message });
}

function isLocalReference(value) {
  return typeof value === "string" && value.length > 0 && !/^https?:\/\//i.test(value);
}

async function validateLocalPath(projectDir, relativePath, issues, location, allowPlanned) {
  if (!isLocalReference(relativePath)) return;
  const resolved = path.resolve(projectDir, relativePath);
  const rootWithSep = `${path.resolve(projectDir)}${path.sep}`;
  if (resolved !== path.resolve(projectDir) && !resolved.startsWith(rootWithSep)) {
    addIssue(issues, "error", "path.outside_workspace", `Path escapes the project: ${relativePath}`, location);
    return;
  }
  if (allowPlanned) return;
  if (!(await exists(resolved))) {
    addIssue(issues, "error", "path.missing", `Referenced file does not exist: ${relativePath}`, location);
  }
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validationFailure(issues) {
  return {
    ok: false,
    issues,
    summary: {
      slides: 0,
      videoSlides: 0,
      videoSeconds: 0,
      threeDSlides: 0,
      transitionStyles: 0,
      capabilityMode: "unresolved",
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
  };
}

async function validateCreativeContract(root, manifest, design, slides, draft, issues) {
  if (!design.includes("## Asset Language")) {
    addIssue(issues, "error", "design.asset_language", "Manifest 1.5 requires a ## Asset Language section in DESIGN.md.");
  }
  const narrative = manifest.narrative;
  const narrativeFields = [
    "communicationJob",
    "audienceStartingPoint",
    "audienceEndState",
    "stakes",
    "arc",
    "turningPointSlideId",
    "resolution",
  ];
  if (!narrative || typeof narrative !== "object" || Array.isArray(narrative)) {
    addIssue(issues, "error", "narrative.missing", "Manifest 1.5 requires a narrative object.");
  } else {
    if (!new Set(["draft", "locked"]).has(narrative.status)) {
      addIssue(issues, "error", "narrative.status", "narrative.status must be draft or locked.");
    }
    for (const key of narrativeFields) {
      if (!nonEmpty(narrative[key])) addIssue(issues, "error", `narrative.${key}`, `${key} is required.`);
      if (!draft && /to be inferred|unresolved|pending/i.test(narrative[key] || "")) {
        addIssue(issues, "error", `narrative.${key}_unresolved`, `${key} is unresolved.`);
      }
    }
    if (!draft && narrative.status !== "locked") {
      addIssue(issues, "error", "narrative.unlocked", "Final delivery requires a locked narrative.");
    }
    if (narrative.turningPointSlideId && slides.length && !slides.some((slide) => slide.id === narrative.turningPointSlideId)) {
      addIssue(issues, "error", "narrative.turning_point", "turningPointSlideId must reference a current slide.");
    }
  }

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slide = slides[slideIndex];
    const location = `slides[${slideIndex}]`;
    const beat = slide.narrativeBeat;
    if (!beat || typeof beat !== "object" || Array.isArray(beat)) {
      addIssue(issues, "error", "slide.narrativeBeat", "Manifest 1.5 requires narrativeBeat on every slide.", location);
    } else {
      for (const key of ["question", "consequence", "evidenceType"]) {
        if (!nonEmpty(beat[key])) addIssue(issues, "error", `slide.narrativeBeat.${key}`, `${key} is required.`, location);
      }
      if (slideIndex < slides.length - 1 && !nonEmpty(beat.bridgeToNext)) {
        addIssue(issues, "error", "slide.narrativeBeat.bridge", "Every non-closing slide requires bridgeToNext.", location);
      }
    }
    const visual = slide.visualPlan;
    if (!visual || typeof visual !== "object" || Array.isArray(visual)) {
      addIssue(issues, "error", "slide.visualPlan", "Manifest 1.5 requires visualPlan on every slide.", location);
    } else {
      for (const key of ["silhouette", "density", "focalMode", "continuityCue"]) {
        if (!nonEmpty(visual[key])) addIssue(issues, "error", `slide.visualPlan.${key}`, `${key} is required.`, location);
      }
      if (typeof visual.visualPeak !== "boolean") {
        addIssue(issues, "error", "slide.visualPlan.visualPeak", "visualPeak must be boolean.", location);
      }
    }

    for (let assetIndex = 0; assetIndex < (slide.assets || []).length; assetIndex += 1) {
      const asset = slide.assets[assetIndex];
      const assetLocation = `${location}.assets[${assetIndex}]`;
      const brief = asset.brief;
      if (!brief || typeof brief !== "object" || Array.isArray(brief)) {
        addIssue(issues, "error", "asset.brief", "Manifest 1.5 requires a structured brief for every asset.", assetLocation);
        continue;
      }
      for (const key of ["purpose", "method", "role", "placement", "continuityKey", "reusePolicy", "selectionMode"]) {
        if (!nonEmpty(brief[key])) addIssue(issues, "error", `asset.brief.${key}`, `${key} is required.`, assetLocation);
      }
      if (!CREATIVE_ASSET_METHODS.has(brief.method)) {
        addIssue(issues, "error", "asset.brief.method", "Asset production method is unsupported.", assetLocation);
      }
      if (!CREATIVE_SELECTION_MODES.has(brief.selectionMode)) {
        addIssue(issues, "error", "asset.brief.selectionMode", "Asset selectionMode is unsupported.", assetLocation);
      }
      if (!Array.isArray(brief.acceptance) || brief.acceptance.length < 2) {
        addIssue(issues, "error", "asset.brief.acceptance", "Asset brief needs at least two acceptance checks.", assetLocation);
      }
      const variantCount = Number(brief.variantCount ?? 1);
      if (!Number.isInteger(variantCount) || variantCount < 1 || variantCount > 4) {
        addIssue(issues, "error", "asset.brief.variantCount", "variantCount must be an integer from 1 to 4.", assetLocation);
      }
      if (brief.selectionMode === "variants" && variantCount < 2) {
        addIssue(issues, "error", "asset.brief.variants", "Variant selection requires at least two candidates.", assetLocation);
      }
      if (!draft && brief.selectionMode === "variants") {
        const selection = asset.selection;
        if (!selection || selection.status !== "selected") {
          addIssue(issues, "error", "asset.selection.missing", "Variant assets require a recorded selection.", assetLocation);
          continue;
        }
        if (!Array.isArray(selection.candidates) || selection.candidates.length < variantCount) {
          addIssue(issues, "error", "asset.selection.candidates", "Recorded candidates do not satisfy variantCount.", assetLocation);
        }
        if (selection.selectedPath !== asset.path || !selection.selectedCandidateId || !selection.reviewer || !selection.rationale) {
          addIssue(issues, "error", "asset.selection.record", "Asset selection must match the canonical path and include reviewer plus rationale.", assetLocation);
        }
        try {
          const selectedPath = workspacePath(root, asset.path, "selected asset");
          if (!(await exists(selectedPath))) {
            addIssue(issues, "error", "asset.selection.output_missing", "Selected canonical asset is missing.", assetLocation);
          } else if (selection.selectedHash !== await hashFile(selectedPath)) {
            addIssue(issues, "error", "asset.selection.changed", "Selected asset changed after approval.", assetLocation);
          }
          for (const candidate of selection.candidates || []) {
            const candidatePath = workspacePath(root, candidate.path, "asset selection candidate");
            if (!(await exists(candidatePath)) || candidate.hash !== await hashFile(candidatePath)) {
              addIssue(issues, "error", "asset.selection.candidate_changed", `Candidate changed or is missing: ${candidate.id}.`, assetLocation);
            }
          }
          const briefPath = workspacePath(root, selection.providerBrief, "selected asset provider brief");
          if (!(await exists(briefPath))) {
            addIssue(issues, "error", "asset.selection.brief_missing", "Provider brief is missing after asset selection.", assetLocation);
          } else if (selection.providerBriefHash !== await hashFile(briefPath)) {
            addIssue(issues, "error", "asset.selection.brief_changed", "Provider brief changed after asset selection.", assetLocation);
          }
        } catch (error) {
          addIssue(issues, "error", "asset.selection.path", error.message, assetLocation);
        }
      }
    }
  }

  const creative = manifest.production?.creativePlan;
  if (!creative || typeof creative !== "object" || Array.isArray(creative)) {
    addIssue(issues, "error", "production.creativePlan", "Manifest 1.5 requires production.creativePlan.");
    return;
  }
  if (!new Set(["pending", "prepared"]).has(creative.status)) {
    addIssue(issues, "error", "production.creativePlan.status", "Creative plan status must be pending or prepared.");
  }
  if (!draft && creative.status !== "prepared") {
    addIssue(issues, "error", "production.creativePlan.unprepared", "Final delivery requires a prepared creative plan.");
  }
  if (creative.status !== "prepared") return;
  const currentDigest = computeCreativeDigest(manifest);
  if (creative.digest !== currentDigest) {
    addIssue(issues, "error", "production.creativePlan.stale", "Narrative, slide content, visual storyboard, or asset intent changed after creative preparation.");
  }
  if (creative.contractVersion !== "1.0") {
    addIssue(issues, "error", "production.creativePlan.contract", "Unsupported creative plan contract version.");
  }
  for (const key of ["narrativeMap", "storyboard", "assetPlan", "report", "providerIndex"]) {
    if (!creative[key] || !/^tmp[\\/]/i.test(creative[key])) {
      addIssue(issues, "error", `production.creativePlan.${key}`, `${key} must be a workspace-relative path under tmp/.`);
      continue;
    }
    await validateLocalPath(root, creative[key], issues, `production.creativePlan.${key}`, false);
    try {
      const artifact = JSON.parse(await readFile(workspacePath(root, creative[key], `creative ${key}`), "utf8"));
      if (artifact.creativeDigest !== creative.digest) {
        addIssue(issues, "error", "production.creativePlan.artifact_digest", `${key} does not match the current creative digest.`);
      }
      const expectedHash = creative.artifactHashes?.[key];
      if (!expectedHash || expectedHash !== sha256(stableStringify(artifact))) {
        addIssue(issues, "error", "production.creativePlan.artifact_changed", `${key} changed after creative preparation.`);
      }
      if (key === "providerIndex") {
        for (const briefRecord of artifact.briefs || []) {
          await validateLocalPath(root, briefRecord.path, issues, `provider brief ${briefRecord.assetKey}`, false);
          const brief = JSON.parse(await readFile(workspacePath(root, briefRecord.path, "provider brief"), "utf8"));
          if (brief.creativeDigest !== creative.digest || briefRecord.digest !== sha256(stableStringify(brief))) {
            addIssue(issues, "error", "production.creativePlan.provider_brief", `Provider brief is stale or changed: ${briefRecord.assetKey}.`);
          }
        }
      }
    } catch (error) {
      addIssue(issues, "error", "production.creativePlan.files", `Cannot validate ${key}: ${error.message}`);
    }
  }
}

export async function validateWorkspace(projectDir, options = {}) {
  const issues = [];
  const root = path.resolve(projectDir);
  const designPath = path.join(root, "DESIGN.md");
  const manifestPath = path.join(root, "presentation.json");

  if (!(await exists(designPath))) addIssue(issues, "error", "design.missing", "DESIGN.md is required.");
  if (!(await exists(manifestPath))) addIssue(issues, "error", "manifest.missing", "presentation.json is required.");
  if (issues.some((issue) => issue.severity === "error")) return validationFailure(issues);

  const design = await readFile(designPath, "utf8");
  for (const heading of DESIGN_HEADINGS) {
    if (!design.includes(heading)) addIssue(issues, "error", "design.heading", `Missing DESIGN.md section: ${heading}`);
  }
  if (/\b(TODO|TBD|unresolved|pending)\b|\{\{.+?\}\}/i.test(design) && !options.allowDraft) {
    addIssue(issues, "error", "design.placeholder", "DESIGN.md contains unresolved placeholders.");
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    addIssue(issues, "error", "manifest.json", `presentation.json is invalid JSON: ${error.message}`);
    return validationFailure(issues);
  }
  let dependencyConfig;
  try {
    dependencyConfig = JSON.parse(await readFile(DEPENDENCY_PATH, "utf8"));
  } catch (error) {
    addIssue(issues, "error", "capabilities.config", `Dependency configuration is invalid: ${error.message}`);
    return validationFailure(issues);
  }

  if (!["1.0", "1.1", "1.2", "1.3", "1.4", "1.5"].includes(manifest.version)) {
    addIssue(issues, "error", "manifest.version", 'version must be "1.0", "1.1", "1.2", "1.3", "1.4", or "1.5".');
  }
  if (["1.1", "1.2", "1.3", "1.4", "1.5"].includes(manifest.version) && !design.includes("## Reference Evidence")) {
    addIssue(issues, "error", "design.reference_evidence", "Manifest 1.1+ requires a ## Reference Evidence section in DESIGN.md.");
  }
  if (["1.3", "1.4", "1.5"].includes(manifest.version)) {
    for (const heading of TASTE_HEADINGS) {
      if (!design.includes(heading)) addIssue(issues, "error", "design.taste_heading", `Manifest 1.3+ requires DESIGN.md section: ${heading}`);
    }
  }
  if (["1.2", "1.3", "1.4", "1.5"].includes(manifest.version)) {
    if (path.basename(root).toLowerCase() !== WORKSPACE_NAME) {
      addIssue(issues, "error", "workspace.location", `Manifest 1.2+ workspace must be named ${WORKSPACE_NAME}.`);
    }
    const expectedStorage = {
      policy: "workspace-local",
      workspace: ".",
      sources: "sources",
      referenceLibrary: "reference-library",
      raw: "reference-library/raw",
      temporary: "tmp",
      output: "output",
    };
    if (!manifest.storage || typeof manifest.storage !== "object" || Array.isArray(manifest.storage)) {
      addIssue(issues, "error", "storage.missing", "Manifest 1.2+ requires workspace-local storage configuration.");
    } else {
      for (const [key, value] of Object.entries(expectedStorage)) {
        if (manifest.storage[key] !== value) {
          addIssue(issues, "error", `storage.${key}`, `storage.${key} must be ${value}.`);
        }
      }
    }
  }
  if (["1.3", "1.4", "1.5"].includes(manifest.version)) {
    if (!manifest.deliveryContract || typeof manifest.deliveryContract !== "object" || Array.isArray(manifest.deliveryContract)) {
      addIssue(issues, "error", "deliveryContract.missing", "Manifest 1.3+ requires deliveryContract.");
    } else {
      for (const [key, value] of Object.entries(DELIVERY_CONTRACT)) {
        if (manifest.deliveryContract[key] !== value) {
          addIssue(
            issues,
            "error",
            `deliveryContract.${key}`,
            `deliveryContract.${key} must be ${JSON.stringify(value)}.`,
          );
        }
      }
    }
  }
  if (!manifest.deck || typeof manifest.deck !== "object") {
    addIssue(issues, "error", "deck.missing", "deck is required in presentation.json.");
  }

  const deck = manifest.deck || {};
  for (const key of ["title", "audience", "objective", "centralTakeaway", "language", "aspectRatio", "primaryReference"]) {
    if (!deck[key] || typeof deck[key] !== "string") addIssue(issues, "error", `deck.${key}`, `deck.${key} is required.`);
  }
  if (!Array.isArray(deck.outputs) || deck.outputs.length === 0) {
    addIssue(issues, "error", "deck.outputs", "deck.outputs must contain at least one output format.");
  }
  if (manifest.status === "final" && (!Array.isArray(deck.outputs) || !deck.outputs.includes("pptx"))) {
    addIssue(issues, "error", "delivery.pptx_required", "Final delivery must include pptx in deck.outputs.");
  }

  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  const draft = options.allowDraft || manifest.status === "planning";
  if (!Array.isArray(manifest.slides)) addIssue(issues, "error", "slides.type", "slides must be an array.");
  if (!draft && slides.length === 0) addIssue(issues, "error", "slides.empty", "A final presentation must contain slides.");
  if (manifest.status === "planning" && !options.allowDraft) {
    addIssue(issues, "error", "status.planning", "Change status from planning before final validation.");
  }

  const styleDecision = manifest.styleDecision;
  if (!styleDecision || typeof styleDecision !== "object" || Array.isArray(styleDecision)) {
    if (["1.1", "1.2", "1.3", "1.4", "1.5"].includes(manifest.version) || !draft) {
      addIssue(issues, "error", "styleDecision.missing", "Manifest 1.1+ requires styleDecision.");
    } else {
      addIssue(issues, "warning", "styleDecision.legacy", "Legacy manifest has no styleDecision record.");
    }
  } else {
    if (!STYLE_MODES.has(styleDecision.mode)) {
      addIssue(issues, "error", "styleDecision.mode", "mode must be specified, auto, or recommend.");
    }
    if (!['pending', 'selected'].includes(styleDecision.status)) {
      addIssue(issues, "error", "styleDecision.status", "status must be pending or selected.");
    }
    if (!Array.isArray(styleDecision.candidates)) {
      addIssue(issues, "error", "styleDecision.candidates", "candidates must be an array.");
    }
    if (!Array.isArray(styleDecision.sources)) {
      addIssue(issues, "error", "styleDecision.sources", "sources must be an array.");
    }
    if (typeof styleDecision.rawAvailable !== "boolean") {
      addIssue(issues, "error", "styleDecision.rawAvailable", "rawAvailable must be boolean.");
    }
    if (!RAW_STATUSES.has(styleDecision.rawStatus)) {
      addIssue(issues, "error", "styleDecision.rawStatus", "rawStatus is unsupported.");
    }
    if (!RESEARCH_STATUSES.has(styleDecision.researchStatus)) {
      addIssue(issues, "error", "styleDecision.researchStatus", "researchStatus is unsupported.");
    }

    if (!draft && styleDecision.status !== "selected") {
      addIssue(issues, "error", "styleDecision.unresolved", "Final delivery requires a selected style direction.");
    }

    if (styleDecision.status === "selected") {
      for (const key of ["selectedId", "selectedKind", "selectedAt", "rationale", "referenceDepth"]) {
        if (!styleDecision[key] || typeof styleDecision[key] !== "string") {
          addIssue(issues, "error", `styleDecision.${key}`, `${key} is required after style selection.`);
        }
      }
      if (styleDecision.selectedKind && !STYLE_KINDS.has(styleDecision.selectedKind)) {
        addIssue(issues, "error", "styleDecision.selectedKind", "selectedKind must be user-template, preset, or custom.");
      }
      if (styleDecision.selectedAt && Number.isNaN(Date.parse(styleDecision.selectedAt))) {
        addIssue(issues, "error", "styleDecision.selectedAt", "selectedAt must be an ISO timestamp.");
      }
      if (styleDecision.referenceDepth && !REFERENCE_DEPTHS.has(styleDecision.referenceDepth)) {
        addIssue(issues, "error", "styleDecision.referenceDepth", "referenceDepth is unsupported.");
      }

      if (styleDecision.mode === "recommend") {
        if (!Array.isArray(styleDecision.candidates) || styleDecision.candidates.length < 2) {
          addIssue(issues, "error", "styleDecision.recommend_candidates", "Recommend mode requires at least two visual candidates.");
        }
        if (!styleDecision.visualBoard || typeof styleDecision.visualBoard !== "string") {
          addIssue(issues, "error", "styleDecision.visualBoard", "Recommend mode requires a local visual comparison board.");
        } else {
          await validateLocalPath(root, styleDecision.visualBoard, issues, "styleDecision.visualBoard", draft);
        }
      }

      if (styleDecision.selectedKind === "user-template" && styleDecision.referenceDepth !== "user-source") {
        addIssue(issues, "error", "styleDecision.template_depth", "A user template must use referenceDepth user-source.");
      }

      if (styleDecision.selectedKind === "preset") {
        if (styleDecision.rawAvailable === true) {
          if (styleDecision.rawStatus !== "loaded") {
            addIssue(issues, "error", "styleDecision.raw_required", "A selected preset with raw sources must load the chosen raw source.");
          }
          if (styleDecision.referenceDepth !== "source") {
            addIssue(issues, "error", "styleDecision.raw_depth", "A loaded preset raw source must use referenceDepth source.");
          }
          const loadedRaw = Array.isArray(styleDecision.sources) && styleDecision.sources.find(
            (source) => source?.sourceId && source?.url && source?.cacheStatus === "loaded",
          );
          if (!loadedRaw) {
            addIssue(issues, "error", "styleDecision.raw_record", "Loaded raw references require sourceId, url, and cacheStatus loaded.");
          } else if (!loadedRaw.cacheFile || !/^reference-library[\\/]raw[\\/]/i.test(loadedRaw.cacheFile)) {
            addIssue(issues, "error", "styleDecision.raw_path", "Loaded raw references require a workspace-relative cacheFile under reference-library/raw.");
          } else {
            await validateLocalPath(root, loadedRaw.cacheFile, issues, "styleDecision.raw", draft);
          }
        } else if (!draft && styleDecision.rawStatus !== "not-available") {
          addIssue(issues, "error", "styleDecision.raw_unavailable", "Preset styles without raw links must declare rawStatus not-available.");
        }
      }

      if (styleDecision.selectedKind === "custom") {
        if (styleDecision.referenceDepth !== "web-research") {
          addIssue(issues, "error", "styleDecision.custom_depth", "Custom styles must use referenceDepth web-research.");
        }
        if (styleDecision.researchStatus !== "complete") {
          addIssue(issues, "error", "styleDecision.custom_research", "Custom styles require completed web reference research.");
        }
        const styleSources = Array.isArray(styleDecision.sources) ? styleDecision.sources : [];
        if (styleSources.length < 2) {
          addIssue(issues, "error", "styleDecision.custom_sources", "Custom styles require at least two direct reference sources.");
        }
        if (!styleSources.some((source) => ["official", "first-party"].includes(source?.authority))) {
          addIssue(issues, "error", "styleDecision.custom_authority", "Custom style research requires at least one official or first-party source.");
        }
        for (let index = 0; index < styleSources.length; index += 1) {
          const source = styleSources[index];
          if (!source?.url || !/^https?:\/\//i.test(source.url)) {
            addIssue(issues, "error", "styleDecision.source_url", "Custom style sources require direct HTTP(S) URLs.", `styleDecision.sources[${index}]`);
          }
        }
      }

      for (let index = 0; index < (styleDecision.sources || []).length; index += 1) {
        const source = styleDecision.sources[index];
        if (source?.path) await validateLocalPath(root, source.path, issues, `styleDecision.sources[${index}]`, draft);
        if (source?.cacheFile) {
          await validateLocalPath(root, source.cacheFile, issues, `styleDecision.sources[${index}]`, draft);
        }
      }
    }
  }

  const tasteProfile = manifest.tasteProfile;
  if (["1.3", "1.4", "1.5"].includes(manifest.version)) {
    if (!tasteProfile || typeof tasteProfile !== "object" || Array.isArray(tasteProfile)) {
      addIssue(issues, "error", "tasteProfile.missing", "Manifest 1.3+ requires tasteProfile.");
    } else {
      if (!TASTE_STATUSES.has(tasteProfile.status)) {
        addIssue(issues, "error", "tasteProfile.status", "status must be draft or locked.");
      }
      if (!CONTENT_SWAP_STATUSES.has(tasteProfile.contentSwapTest)) {
        addIssue(issues, "error", "tasteProfile.contentSwapTest", "contentSwapTest must be not-run, revise, or pass.");
      }
      for (const key of ["tensions", "signatureMoves", "antiDefaults"]) {
        if (!Array.isArray(tasteProfile[key])) {
          addIssue(issues, "error", `tasteProfile.${key}`, `${key} must be an array.`);
        }
      }

      const tensions = Array.isArray(tasteProfile.tensions) ? tasteProfile.tensions : [];
      const signatureMoves = Array.isArray(tasteProfile.signatureMoves) ? tasteProfile.signatureMoves : [];
      const antiDefaults = Array.isArray(tasteProfile.antiDefaults) ? tasteProfile.antiDefaults : [];
      if (tensions.some((item) => typeof item !== "string" || !item.trim())) {
        addIssue(issues, "error", "tasteProfile.tensions", "Every tension must be a non-empty string.");
      }
      if (antiDefaults.some((item) => typeof item !== "string" || !item.trim())) {
        addIssue(issues, "error", "tasteProfile.antiDefaults", "Every anti-default must be a non-empty string.");
      }
      if (new Set(antiDefaults.map((item) => String(item).toLowerCase())).size !== antiDefaults.length) {
        addIssue(issues, "error", "tasteProfile.antiDefaults_duplicate", "antiDefaults must not contain duplicates.");
      }
      if (signatureMoves.length > 2) {
        addIssue(issues, "error", "tasteProfile.signatureMoves_limit", "Use no more than two signature moves.");
      }
      for (let index = 0; index < signatureMoves.length; index += 1) {
        const move = signatureMoves[index];
        if (!move || typeof move !== "object" || Array.isArray(move)) {
          addIssue(issues, "error", "tasteProfile.signatureMove", "Each signature move must be an object.", `tasteProfile.signatureMoves[${index}]`);
          continue;
        }
        for (const key of ["name", "purpose", "scope"]) {
          if (!move[key] || typeof move[key] !== "string") {
            addIssue(issues, "error", `tasteProfile.signatureMove_${key}`, `Signature move ${key} is required.`, `tasteProfile.signatureMoves[${index}]`);
          }
        }
      }

      if (!draft) {
        if (tasteProfile.status !== "locked") {
          addIssue(issues, "error", "tasteProfile.unlocked", "Final delivery requires a locked tasteProfile.");
        }
        for (const key of ["designThesis", "contentMotif", "authorshipNote"]) {
          if (!tasteProfile[key] || typeof tasteProfile[key] !== "string") {
            addIssue(issues, "error", `tasteProfile.${key}`, `${key} is required for final delivery.`);
          }
        }
        if (tensions.length < 1 || tensions.length > 2) {
          addIssue(issues, "error", "tasteProfile.tensions_count", "Final delivery requires one or two productive tensions.");
        }
        if (signatureMoves.length < 1) {
          addIssue(issues, "error", "tasteProfile.signatureMoves_count", "Final delivery requires one or two signature moves.");
        }
        if (antiDefaults.length < 3) {
          addIssue(issues, "error", "tasteProfile.antiDefaults_count", "Final delivery requires at least three task-specific anti-defaults.");
        }
        if (tasteProfile.contentSwapTest !== "pass") {
          addIssue(issues, "error", "tasteProfile.contentSwap_failed", "Final delivery requires contentSwapTest pass.");
        }
      }
    }
  }

  const capabilityProfile = manifest.capabilityProfile;
  if (!capabilityProfile || typeof capabilityProfile !== "object" || Array.isArray(capabilityProfile)) {
    if (!draft) addIssue(issues, "error", "capabilities.missing", "Final delivery requires capabilityProfile.");
  } else if (!draft || capabilityProfile.checkedAt) {
    for (const key of ["platform", "requestedMode", "resolvedMode", "checkedAt"]) {
      if (!capabilityProfile[key] || typeof capabilityProfile[key] !== "string") {
        addIssue(issues, "error", `capabilities.${key}`, `capabilityProfile.${key} is required.`);
      }
    }
    if (capabilityProfile.checkedAt && Number.isNaN(Date.parse(capabilityProfile.checkedAt))) {
      addIssue(issues, "error", "capabilities.checkedAt", "capabilityProfile.checkedAt must be an ISO timestamp.");
    }
    for (const key of ["required", "available", "missing"]) {
      if (!Array.isArray(capabilityProfile[key]) || capabilityProfile[key].some((item) => typeof item !== "string")) {
        addIssue(issues, "error", `capabilities.${key}`, `capabilityProfile.${key} must be an array of strings.`);
      }
    }
    if (typeof capabilityProfile.taskReady !== "boolean") {
      addIssue(issues, "error", "capabilities.taskReady", "capabilityProfile.taskReady must be boolean.");
    }
    if (typeof capabilityProfile.fallbacksApproved !== "boolean") {
      addIssue(issues, "error", "capabilities.fallbacksApproved", "capabilityProfile.fallbacksApproved must be boolean.");
    }
    const missingCapabilities = Array.isArray(capabilityProfile.missing) ? capabilityProfile.missing : [];
    const requiredCapabilities = Array.isArray(capabilityProfile.required) ? capabilityProfile.required : [];
    const availableCapabilities = Array.isArray(capabilityProfile.available) ? capabilityProfile.available : [];
    const knownCapabilities = new Set(Object.keys(dependencyConfig.capabilities || {}));
    const knownProfiles = new Set((dependencyConfig.profiles || []).map((profile) => profile.id));
    for (const modeKey of ["requestedMode", "resolvedMode"]) {
      if (capabilityProfile[modeKey] && !knownProfiles.has(capabilityProfile[modeKey])) {
        addIssue(issues, "error", `capabilities.${modeKey}`, `Unknown capability profile: ${capabilityProfile[modeKey]}.`);
      }
    }
    for (const [key, values] of [["required", requiredCapabilities], ["available", availableCapabilities], ["missing", missingCapabilities]]) {
      for (const capability of values) {
        if (!knownCapabilities.has(capability)) {
          addIssue(issues, "error", `capabilities.${key}`, `Unknown capability in ${key}: ${capability}.`);
        }
      }
    }
    const expectedMissing = requiredCapabilities.filter((capability) => !availableCapabilities.includes(capability)).sort();
    if (JSON.stringify([...missingCapabilities].sort()) !== JSON.stringify(expectedMissing)) {
      addIssue(issues, "error", "capabilities.missing_set", "missing must equal required capabilities that are not available.");
    }
    const requestedProfile = (dependencyConfig.profiles || []).find((profile) => profile.id === capabilityProfile.requestedMode);
    for (const capability of requestedProfile?.requires || []) {
      if (!requiredCapabilities.includes(capability)) {
        addIssue(issues, "error", "capabilities.required_set", `requestedMode requires ${capability}, but it is absent from required.`);
      }
    }
    if (capabilityProfile.taskReady !== (missingCapabilities.length === 0)) {
      addIssue(issues, "error", "capabilities.readiness", "taskReady must match whether required capabilities are missing.");
    }
    if (!draft && missingCapabilities.length > 0 && capabilityProfile.fallbacksApproved !== true) {
      addIssue(
        issues,
        "error",
        "capabilities.unapproved_fallback",
        "Missing required capabilities need explicit fallback approval before final delivery.",
      );
    }
    if (!draft && missingCapabilities.length > 0 && capabilityProfile.fallbacksApproved === true) {
      const fallbackPath = path.join(root, "tmp", "fallback-reasons.txt");
      if (!(await exists(fallbackPath)) || !(await readFile(fallbackPath, "utf8")).trim()) {
        addIssue(
          issues,
          "error",
          "capabilities.fallback_record",
          "Approved fallbacks require a non-empty tmp/fallback-reasons.txt record.",
        );
      }
    }
  }

  const ids = new Set();
  const patterns = [];
  const transitions = new Set();
  let videoSlides = 0;
  let videoSeconds = 0;
  let threeDSlides = 0;
  const availableCapabilities = new Set(Array.isArray(capabilityProfile?.available) ? capabilityProfile.available : []);
  const rendererCapabilities = dependencyConfig.rendererCapabilities || {};

  if (!draft && !availableCapabilities.has("presentation")) {
    addIssue(
      issues,
      "error",
      "delivery.presentation_capability",
      "Final PPTX delivery requires the presentation capability to be available.",
    );
  }

  if (!draft && styleDecision?.selectedKind === "custom") {
    const requiredCapabilities = new Set(Array.isArray(capabilityProfile?.required) ? capabilityProfile.required : []);
    if (!requiredCapabilities.has("reference_research") || !availableCapabilities.has("reference_research")) {
      addIssue(
        issues,
        "error",
        "capabilities.reference_research",
        "Custom style research requires reference_research in both capabilityProfile.required and available.",
      );
    }
  }

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const location = `slides[${index}]`;
    for (const key of ["id", "role", "title", "claim", "renderer", "layoutPattern", "editability"]) {
      if (!slide[key] || typeof slide[key] !== "string") addIssue(issues, "error", `slide.${key}`, `${key} is required.`, location);
    }

    if (slide.id) {
      if (ids.has(slide.id)) addIssue(issues, "error", "slide.id_duplicate", `Duplicate slide id: ${slide.id}`, location);
      ids.add(slide.id);
      if (!/^[a-z0-9][a-z0-9_-]*$/i.test(slide.id)) {
        addIssue(issues, "error", "slide.id_format", `Invalid slide id: ${slide.id}`, location);
      }
    }
    if (slide.renderer && !RENDERERS.has(slide.renderer)) {
      addIssue(issues, "error", "slide.renderer", `Unsupported renderer: ${slide.renderer}`, location);
    }
    for (const requiredCapability of rendererCapabilities[slide.renderer] || []) {
      if (!draft && !availableCapabilities.has(requiredCapability)) {
        addIssue(
          issues,
          "error",
          "capabilities.renderer_unavailable",
          `Renderer ${slide.renderer} requires unavailable capability: ${requiredCapability}.`,
          location,
        );
      }
    }
    if (slide.editability && !EDITABILITY.has(slide.editability)) {
      addIssue(issues, "error", "slide.editability", `Unsupported editability: ${slide.editability}`, location);
    }
    if (!slide.content || typeof slide.content !== "object" || Array.isArray(slide.content)) {
      addIssue(issues, "error", "slide.content", "content must be an object, even when empty.", location);
    }
    if (/architecture|diagram|data|chart/i.test(slide.role || "") && slide.renderer === "image_slide") {
      addIssue(issues, "error", "slide.raster_facts", "Architecture and data slides must not use image_slide.", location);
    }
    if (slide.renderer === "image_slide" && slide.editability !== "flattened") {
      addIssue(issues, "error", "slide.image_editability", "image_slide must declare editability as flattened.", location);
    }
    if (
      ["1.3", "1.4", "1.5"].includes(manifest.version)
      && slide.renderer === "image_slide"
      && (
        typeof slide.rasterExceptionReason !== "string"
        || !slide.rasterExceptionReason.trim()
      )
    ) {
      addIssue(
        issues,
        "error",
        "slide.raster_exception_reason",
        "Manifest 1.3+ requires rasterExceptionReason for every full-page image slide.",
        location,
      );
    }
    if (VIDEO_RENDERERS.has(slide.renderer) && slide.editability !== "replaceable-media") {
      addIssue(
        issues,
        "error",
        "slide.video_editability",
        "Video slides must declare editability as replaceable-media.",
        location,
      );
    }
    if (slide.threeD !== undefined) {
      threeDSlides += 1;
      if (slide.renderer !== "remotion_video") {
        addIssue(issues, "error", "three.renderer", "threeD is supported only on remotion_video slides.", location);
      }
      if (!draft && !availableCapabilities.has("three_d")) {
        addIssue(
          issues,
          "error",
          "capabilities.three_unavailable",
          "threeD requires the three_d capability to be available in capabilityProfile.",
          location,
        );
      }
      if (!design.includes("## 3D Direction")) {
        addIssue(issues, "error", "design.3d_direction", "3D slides require a ## 3D Direction section in DESIGN.md.", location);
      }
      if (!slide.threeD || typeof slide.threeD !== "object" || Array.isArray(slide.threeD)) {
        addIssue(issues, "error", "three.object", "threeD must be an object.", location);
      } else {
        if (slide.threeD.runtime !== "remotion-three") {
          addIssue(issues, "error", "three.runtime", "threeD.runtime must be remotion-three.", location);
        }
        for (const key of ["purpose", "scenePath", "fallback"]) {
          if (!slide.threeD[key] || typeof slide.threeD[key] !== "string") {
            addIssue(issues, "error", `three.${key}`, `threeD.${key} is required.`, location);
          }
        }
        await validateLocalPath(root, slide.threeD.scenePath, issues, location, draft);
      }
    }
    if ((slide.title || "").length > 70) {
      addIssue(issues, "warning", "slide.title_length", "Title may wrap; shorten it or change the layout.", location);
    }

    patterns.push(slide.layoutPattern);
    const assets = Array.isArray(slide.assets) ? slide.assets : [];
    for (let assetIndex = 0; assetIndex < assets.length; assetIndex += 1) {
      const asset = assets[assetIndex];
      const assetLocation = `${location}.assets[${assetIndex}]`;
      if (!asset.id || !asset.kind) addIssue(issues, "error", "asset.identity", "Asset id and kind are required.", assetLocation);
      if (!asset.path) addIssue(issues, "error", "asset.path", "Asset path is required.", assetLocation);
      if (!["planned", "ready", "rejected"].includes(asset.status)) {
        addIssue(issues, "error", "asset.status", "Asset status must be planned, ready, or rejected.", assetLocation);
      }
      if (!draft && asset.status !== "ready") {
        addIssue(issues, "error", "asset.not_ready", "Final presentations may reference only ready assets.", assetLocation);
      }
      if (THREE_ASSET_KINDS.has(asset.kind)) {
        if (!asset.source || typeof asset.source !== "string") {
          addIssue(issues, "error", "asset.3d_source", "3D models, textures, and environment maps require source metadata.", assetLocation);
        }
        if (!asset.rights || typeof asset.rights !== "string") {
          addIssue(issues, "error", "asset.3d_rights", "3D models, textures, and environment maps require rights metadata.", assetLocation);
        }
      }
      await validateLocalPath(root, asset.path, issues, assetLocation, draft && asset.status === "planned");
    }

    const sources = Array.isArray(slide.sources) ? slide.sources : [];
    if (slide.claimKind === "external" && sources.length === 0) {
      addIssue(issues, "error", "slide.sources", "External claims require at least one source.", location);
    }
    for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
      const source = sources[sourceIndex];
      const sourceLocation = `${location}.sources[${sourceIndex}]`;
      if (!source.url && !source.path) addIssue(issues, "error", "source.location", "Source url or path is required.", sourceLocation);
      if (source.path) await validateLocalPath(root, source.path, issues, sourceLocation, false);
    }

    if (VIDEO_RENDERERS.has(slide.renderer)) {
      videoSlides += 1;
      const expectedEngine = slide.renderer === "hyperframes_video" ? "hyperframes" : "remotion";
      if (!slide.motion || slide.motion.engine !== expectedEngine) {
        addIssue(issues, "error", "motion.engine", `motion.engine must be ${expectedEngine}.`, location);
      }
      const duration = Number(slide.motion?.durationSeconds);
      if (!Number.isFinite(duration) || duration <= 0) {
        addIssue(issues, "error", "motion.duration", "Video slides require a positive durationSeconds.", location);
      } else {
        videoSeconds += duration;
      }
      if (!slide.posterFrame) addIssue(issues, "error", "motion.poster", "Video slides require a posterFrame fallback.", location);
      await validateLocalPath(root, slide.posterFrame, issues, location, draft);
    }
    if (slide.motion?.transition) transitions.add(slide.motion.transition);
  }

  for (let index = 2; index < patterns.length; index += 1) {
    if (patterns[index] && patterns[index] === patterns[index - 1] && patterns[index] === patterns[index - 2]) {
      addIssue(issues, "warning", "layout.repetition", `Three adjacent slides reuse ${patterns[index]}.`, `slides[${index}]`);
    }
  }

  const budget = manifest.motionBudget || {};
  for (const key of ["maxVideoSlides", "maxTotalVideoSeconds", "maxTransitionStyles"]) {
    if (!Number.isFinite(Number(budget[key]))) addIssue(issues, "error", `motionBudget.${key}`, `${key} must be numeric.`);
  }
  if (videoSlides > Number(budget.maxVideoSlides)) {
    addIssue(issues, "error", "motionBudget.videoSlides", `${videoSlides} video slides exceed the budget of ${budget.maxVideoSlides}.`);
  }
  if (videoSeconds > Number(budget.maxTotalVideoSeconds)) {
    addIssue(issues, "error", "motionBudget.duration", `${videoSeconds}s of video exceeds the budget of ${budget.maxTotalVideoSeconds}s.`);
  }
  if (transitions.size > Number(budget.maxTransitionStyles)) {
    addIssue(issues, "error", "motionBudget.transitions", `${transitions.size} transition styles exceed the budget of ${budget.maxTransitionStyles}.`);
  }

  if (manifest.version === "1.5") {
    await validateCreativeContract(root, manifest, design, slides, draft, issues);
  }

  if (["1.4", "1.5"].includes(manifest.version)) {
    const production = manifest.production;
    if (!production || typeof production !== "object" || Array.isArray(production)) {
      addIssue(issues, "error", "production.missing", "Manifest 1.4+ requires the production optimization contract.");
    } else {
      const designLock = production.designLock;
      if (!designLock || typeof designLock !== "object" || Array.isArray(designLock)) {
        addIssue(issues, "error", "production.designLock", "production.designLock is required.");
      } else {
        if (!new Set(["pending", "locked"]).has(designLock.status)) {
          addIssue(issues, "error", "production.designLock.status", "Design lock status must be pending or locked.");
        }
        if (!Number.isInteger(designLock.requiredSampleCount) || designLock.requiredSampleCount < 1 || designLock.requiredSampleCount > 4) {
          addIssue(issues, "error", "production.designLock.sample_count", "requiredSampleCount must be an integer from 1 to 4.");
        }
        if (!Array.isArray(designLock.samples)) {
          addIssue(issues, "error", "production.designLock.samples", "Design lock samples must be an array.");
        }
        if (!draft && designLock.status !== "locked") {
          addIssue(issues, "error", "production.designLock.unlocked", "Final delivery requires approved representative design samples.");
        }
        if (designLock.status === "locked") {
          if (!designLock.lockedAt || Number.isNaN(Date.parse(designLock.lockedAt))) {
            addIssue(issues, "error", "production.designLock.lockedAt", "A locked design requires an ISO lockedAt timestamp.");
          }
          if (!new Set(["user", "team", "auto-review"]).has(designLock.approvedBy)) {
            addIssue(issues, "error", "production.designLock.approvedBy", "approvedBy must be user, team, or auto-review.");
          }
          if (!/^[a-f0-9]{64}$/i.test(designLock.designDigest || "")) {
            addIssue(issues, "error", "production.designLock.digest", "A locked design requires a SHA-256 designDigest.");
          } else if (designLock.designDigest !== computeDesignDigest(manifest, design)) {
            addIssue(issues, "error", "production.designLock.stale", "DESIGN.md or its design contract changed after sample approval.");
          }
          if (manifest.version === "1.5" && designLock.creativeDigest !== production.creativePlan?.digest) {
            addIssue(issues, "error", "production.designLock.creative_digest", "Design lock must cover the current creative plan.");
          }
          const expectedSampleCount = Math.min(4, slides.length);
          if (designLock.requiredSampleCount !== expectedSampleCount) {
            addIssue(
              issues,
              "error",
              "production.designLock.required_count",
              `requiredSampleCount must be ${expectedSampleCount} for this deck.`,
            );
          }
          const samples = Array.isArray(designLock.samples) ? designLock.samples : [];
          if (samples.length !== expectedSampleCount) {
            addIssue(issues, "error", "production.designLock.samples_missing", `Design lock requires ${expectedSampleCount} sample(s).`);
          }
          const sampleIds = new Set();
          for (let index = 0; index < samples.length; index += 1) {
            const sample = samples[index];
            const location = `production.designLock.samples[${index}]`;
            if (!sample?.slideId || !ids.has(sample.slideId)) {
              addIssue(issues, "error", "production.designLock.slide", "Sample slideId must reference a manifest slide.", location);
            } else if (sampleIds.has(sample.slideId)) {
              addIssue(issues, "error", "production.designLock.duplicate", `Duplicate sample slide: ${sample.slideId}`, location);
            }
            sampleIds.add(sample?.slideId);
            if (!sample?.artifact || !sample?.artifactHash) {
              addIssue(issues, "error", "production.designLock.artifact", "Sample artifact and artifactHash are required.", location);
              continue;
            }
            await validateLocalPath(root, sample.artifact, issues, location, false);
            try {
              const artifactPath = workspacePath(root, sample.artifact, "approved sample");
              if (await exists(artifactPath)) {
                const currentHash = await hashFile(artifactPath);
                if (currentHash !== sample.artifactHash) {
                  addIssue(issues, "error", "production.designLock.artifact_changed", `Approved sample changed: ${sample.artifact}`, location);
                }
              }
            } catch {
              // validateLocalPath already records the workspace boundary error.
            }
          }
          if (slides[0]?.id && !sampleIds.has(slides[0].id)) {
            addIssue(issues, "error", "production.designLock.opening", "Representative samples must include the opening slide.");
          }
          const sampleRoles = new Set(samples.map((sample) => sample?.role).filter(Boolean));
          const availableRoles = new Set(slides.map((slide) => slide.role).filter(Boolean));
          if (sampleRoles.size < Math.min(3, expectedSampleCount, availableRoles.size)) {
            addIssue(issues, "error", "production.designLock.role_coverage", "Representative samples do not cover enough distinct slide roles.");
          }
          if (slides.some((slide) => slide.renderer !== "native_ppt") && !samples.some((sample) => sample.renderer !== "native_ppt")) {
            addIssue(issues, "error", "production.designLock.specialist", "Include a specialist-rendered slide in the representative samples.");
          }
        }
      }

      const build = production.build;
      if (!build || typeof build !== "object" || Array.isArray(build)) {
        addIssue(issues, "error", "production.build", "production.build is required.");
      } else {
        if (build.strategy !== "incremental-content-addressed") {
          addIssue(issues, "error", "production.build.strategy", "Build strategy must be incremental-content-addressed.");
        }
        if (!Number.isInteger(build.maxParallelWorkers) || build.maxParallelWorkers < 1 || build.maxParallelWorkers > 8) {
          addIssue(issues, "error", "production.build.workers", "maxParallelWorkers must be an integer from 1 to 8.");
        }
        for (const key of ["cacheState", "plan", "taskGraph"]) {
          if (!build[key] || !/^tmp[\\/]/i.test(build[key])) {
            addIssue(issues, "error", `production.build.${key}`, `${key} must be a workspace-relative path under tmp/.`);
          } else {
            await validateLocalPath(root, build[key], issues, `production.build.${key}`, draft);
          }
        }
        if (!draft && (!build.lastPreparedAt || Number.isNaN(Date.parse(build.lastPreparedAt)))) {
          addIssue(issues, "error", "production.build.prepared", "Final delivery requires a current build plan timestamp.");
        }
        if (!draft && build.plan && build.cacheState) {
          try {
            const [plan, state] = await Promise.all([
              JSON.parse(await readFile(workspacePath(root, build.plan, "build plan"), "utf8")),
              JSON.parse(await readFile(workspacePath(root, build.cacheState, "build cache"), "utf8")),
            ]);
            if (plan.designDigest !== designLock?.designDigest || state.designDigest !== designLock?.designDigest) {
              addIssue(issues, "error", "production.build.design_digest", "Build plan and cache state must match the current design lock.");
            }
            if (plan.manifestDigest !== computeManifestBuildDigest(manifest)) {
              addIssue(issues, "error", "production.build.manifest_digest", "Build plan is stale because presentation.json changed.");
            }
            if (manifest.version === "1.5" && plan.creativeDigest !== production.creativePlan?.digest) {
              addIssue(issues, "error", "production.build.creative_digest", "Build plan does not match the current creative plan.");
            }
            const plannedIds = new Set((plan.slides || []).map((slide) => slide.slideId));
            if (plannedIds.size !== slides.length || slides.some((slide) => !plannedIds.has(slide.id))) {
              addIssue(issues, "error", "production.build.slide_set", "Build plan must cover every current slide exactly once.");
            }
            for (const planned of plan.slides || []) {
              const record = state.slides?.[planned.slideId];
              const inspection = await inspectBuildRecord(root, planned, record);
              if (!inspection.valid) {
                addIssue(issues, "error", "production.build.incomplete", `Current build for ${planned.slideId} is invalid: ${inspection.problems.join("; ")}.`);
              }
            }
          } catch (error) {
            addIssue(issues, "error", "production.build.files", `Cannot validate build plan or cache state: ${error.message}`);
          }
        }
      }

      const qa = production.qa;
      if (!qa || typeof qa !== "object" || Array.isArray(qa)) {
        addIssue(issues, "error", "production.qa", "production.qa is required.");
      } else {
        if (qa.strategy !== "risk-based-plus-final-full" || qa.finalFullReviewRequired !== true) {
          addIssue(issues, "error", "production.qa.strategy", "QA must use risk-based iteration plus a mandatory final full review.");
        }
        for (const key of ["plan", "results", "ledger"]) {
          if (!qa[key] || !/^tmp[\\/]/i.test(qa[key])) {
            addIssue(issues, "error", `production.qa.${key}`, `${key} must be a workspace-relative path under tmp/.`);
          } else {
            await validateLocalPath(root, qa[key], issues, `production.qa.${key}`, draft);
          }
        }
        if (!draft) {
          if (qa.finalFullReview?.status !== "passed") {
            addIssue(issues, "error", "production.qa.final", "Final delivery requires a passed full-deck review.");
          }
          if (!qa.finalFullReview?.completedAt || Number.isNaN(Date.parse(qa.finalFullReview.completedAt))) {
            addIssue(issues, "error", "production.qa.completedAt", "Final review requires an ISO completedAt timestamp.");
          }
          if (!qa.finalFullReview?.reviewer) {
            addIssue(issues, "error", "production.qa.reviewer", "Final review requires a reviewer.");
          }
          try {
            const [qaPlan, qaResults] = await Promise.all([
              JSON.parse(await readFile(workspacePath(root, qa.plan, "QA plan"), "utf8")),
              JSON.parse(await readFile(workspacePath(root, qa.results, "QA results"), "utf8")),
            ]);
            const plannedQaIds = new Set((qaPlan.slides || []).map((slide) => slide.slideId));
            if (plannedQaIds.size !== slides.length || slides.some((slide) => !plannedQaIds.has(slide.id))) {
              addIssue(issues, "error", "production.qa.slide_set", "QA plan must cover every current slide.");
            }
            if ((qaPlan.slides || []).some((slide) => slide.finalRequired !== true)) {
              addIssue(issues, "error", "production.qa.final_scope", "Every slide must be included in final QA.");
            }
            for (const slide of slides) {
              if (qaResults.slides?.[slide.id]?.status !== "passed") {
                addIssue(issues, "error", "production.qa.slide_failed", `Slide ${slide.id} has not passed final QA.`);
              }
            }
            if (qaResults.final?.status !== "passed" || qaResults.final?.planGeneratedAt !== qaPlan.generatedAt) {
              addIssue(issues, "error", "production.qa.stale_final", "Final QA result must pass against the current QA plan.");
            }
          } catch (error) {
            addIssue(issues, "error", "production.qa.files", `Cannot validate QA plan or results: ${error.message}`);
          }
        }
      }
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  return {
    ok: errors === 0,
    issues,
    summary: {
      slides: slides.length,
      videoSlides,
      videoSeconds,
      threeDSlides,
      transitionStyles: transitions.size,
      capabilityMode: capabilityProfile?.resolvedMode || "unresolved",
      errors,
      warnings,
    },
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.projectDir) {
    const current = path.resolve(process.cwd());
    args.projectDir = path.basename(current).toLowerCase() === WORKSPACE_NAME && await exists(path.join(current, "presentation.json"))
      ? current
      : path.join(current, WORKSPACE_NAME);
  }

  const result = await validateWorkspace(args.projectDir, { allowDraft: args.allowDraft });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const issue of result.issues) {
      console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.location}: ${issue.message}`);
    }
    console.log(
      `Validation ${result.ok ? "passed" : "failed"}: ${result.summary.errors || 0} error(s), ${result.summary.warnings || 0} warning(s).`,
    );
  }
  process.exit(result.ok ? 0 : 1);
}
