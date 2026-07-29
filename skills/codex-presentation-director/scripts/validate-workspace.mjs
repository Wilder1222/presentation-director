#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const DESIGN_HEADINGS = [
  "## Identity",
  "## Colors",
  "## Typography",
  "## Layout",
  "## Motion",
  "## Do Not",
  "## Rights",
];

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
  if (allowPlanned) return;
  const resolved = path.resolve(projectDir, relativePath);
  const rootWithSep = `${path.resolve(projectDir)}${path.sep}`;
  if (resolved !== path.resolve(projectDir) && !resolved.startsWith(rootWithSep)) {
    addIssue(issues, "error", "path.outside_workspace", `Path escapes the project: ${relativePath}`, location);
    return;
  }
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
  if (/\b(TODO|TBD)\b|\{\{.+?\}\}/i.test(design) && !options.allowDraft) {
    addIssue(issues, "error", "design.placeholder", "DESIGN.md contains unresolved placeholders.");
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    addIssue(issues, "error", "manifest.json", `presentation.json is invalid JSON: ${error.message}`);
    return { ok: false, issues, summary: {} };
  }

  if (manifest.version !== "1.0") addIssue(issues, "error", "manifest.version", 'version must be "1.0".');
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

  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  const draft = options.allowDraft || manifest.status === "planning";
  if (!Array.isArray(manifest.slides)) addIssue(issues, "error", "slides.type", "slides must be an array.");
  if (!draft && slides.length === 0) addIssue(issues, "error", "slides.empty", "A final presentation must contain slides.");
  if (manifest.status === "planning" && !options.allowDraft) {
    addIssue(issues, "error", "status.planning", "Change status from planning before final validation.");
  }

  const ids = new Set();
  const patterns = [];
  const transitions = new Set();
  let videoSlides = 0;
  let videoSeconds = 0;

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
    if (VIDEO_RENDERERS.has(slide.renderer) && slide.editability !== "replaceable-media") {
      addIssue(
        issues,
        "error",
        "slide.video_editability",
        "Video slides must declare editability as replaceable-media.",
        location,
      );
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
    summary: { slides: slides.length, videoSlides, videoSeconds, transitionStyles: transitions.size, errors, warnings },
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.projectDir) {
    console.error("Usage: node scripts/validate-workspace.mjs <project-dir> [--allow-draft] [--json]");
    process.exit(2);
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
