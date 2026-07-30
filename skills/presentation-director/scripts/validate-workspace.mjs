#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export async function validateWorkspace(projectDir, options = {}) {
  const issues = [];
  const root = path.resolve(projectDir);
  const designPath = path.join(root, "DESIGN.md");
  const manifestPath = path.join(root, "presentation.json");

  if (!(await exists(designPath))) addIssue(issues, "error", "design.missing", "DESIGN.md is required.");
  if (!(await exists(manifestPath))) addIssue(issues, "error", "manifest.missing", "presentation.json is required.");
  if (issues.some((issue) => issue.severity === "error")) return { ok: false, issues, summary: {} };

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
    return { ok: false, issues, summary: {} };
  }
  let dependencyConfig;
  try {
    dependencyConfig = JSON.parse(await readFile(DEPENDENCY_PATH, "utf8"));
  } catch (error) {
    addIssue(issues, "error", "capabilities.config", `Dependency configuration is invalid: ${error.message}`);
    return { ok: false, issues, summary: {} };
  }

  if (!["1.0", "1.1", "1.2", "1.3"].includes(manifest.version)) {
    addIssue(issues, "error", "manifest.version", 'version must be "1.0", "1.1", "1.2", or "1.3".');
  }
  if (["1.1", "1.2", "1.3"].includes(manifest.version) && !design.includes("## Reference Evidence")) {
    addIssue(issues, "error", "design.reference_evidence", "Manifest 1.1+ requires a ## Reference Evidence section in DESIGN.md.");
  }
  if (manifest.version === "1.3") {
    for (const heading of TASTE_HEADINGS) {
      if (!design.includes(heading)) addIssue(issues, "error", "design.taste_heading", `Manifest 1.3 requires DESIGN.md section: ${heading}`);
    }
  }
  if (["1.2", "1.3"].includes(manifest.version)) {
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
  if (manifest.version === "1.3") {
    if (!manifest.deliveryContract || typeof manifest.deliveryContract !== "object" || Array.isArray(manifest.deliveryContract)) {
      addIssue(issues, "error", "deliveryContract.missing", "Manifest 1.3 requires deliveryContract.");
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
    if (["1.1", "1.2", "1.3"].includes(manifest.version) || !draft) {
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
  if (manifest.version === "1.3") {
    if (!tasteProfile || typeof tasteProfile !== "object" || Array.isArray(tasteProfile)) {
      addIssue(issues, "error", "tasteProfile.missing", "Manifest 1.3 requires tasteProfile.");
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
      manifest.version === "1.3"
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
        "Manifest 1.3 requires rasterExceptionReason for every full-page image slide.",
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
