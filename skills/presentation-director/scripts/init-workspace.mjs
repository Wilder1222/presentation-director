#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkCapabilities, writeCapabilityProfile } from "./check-capabilities.mjs";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = path.join(SKILL_DIR, "assets", "workspace-template");
const WORKSPACE_NAME = "presentation-director";
const PROJECT_DIRS = [
  "sources/input",
  "assets/generated/images",
  "assets/generated/ui",
  "assets/models",
  "assets/textures",
  "diagrams",
  "motion/hyperframes",
  "motion/remotion",
  "motion/remotion/three",
  "output",
  "reference-library/raw",
  "reference-library/selected",
  "reference-library/captures",
  "reference-library/review",
  "reference-library/contact-sheets",
  "tmp",
  "tmp/style-discovery",
  "tmp/style-discovery/research",
];

function usage() {
  console.error(
    "Usage: node scripts/init-workspace.mjs [parent-dir|presentation-director] [--title <title>] [--language <tag>] " +
      "[--platform <name>] [--profile <id>] [--require <capability[,capability]>] [--refresh-capabilities]",
  );
}

function parseArgs(argv) {
  const args = [...argv];
  const target = args[0] && !args[0].startsWith("--") ? args.shift() : undefined;
  const options = {
    title: "Untitled presentation",
    language: "zh-CN",
    platform: "auto",
    profile: "full-studio",
    required: [],
    refreshCapabilities: false,
  };

  while (args.length) {
    const flag = args.shift();
    if (flag === "--refresh-capabilities") {
      options.refreshCapabilities = true;
      continue;
    }
    const value = args.shift();
    if (!value || !["--title", "--language", "--platform", "--profile", "--require"].includes(flag)) {
      usage();
      process.exit(2);
    }
    if (flag === "--title") options.title = value;
    if (flag === "--language") options.language = value;
    if (flag === "--platform") options.platform = value;
    if (flag === "--profile") options.profile = value;
    if (flag === "--require") {
      options.required.push(...value.split(",").map((item) => item.trim()).filter(Boolean));
    }
  }

  return { target, options };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfMissing(source, destination) {
  if (await exists(destination)) return false;
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  return true;
}

export async function initWorkspace(targetDir, options = {}) {
  const requested = path.resolve(targetDir || process.cwd());
  const projectDir = path.basename(requested).toLowerCase() === WORKSPACE_NAME
    ? requested
    : path.join(requested, WORKSPACE_NAME);
  if (projectDir === path.parse(projectDir).root) {
    throw new Error("Refusing to initialize a filesystem root.");
  }

  const resolved = {
    title: options.title || "Untitled presentation",
    language: options.language || "zh-CN",
    platform: options.platform || "auto",
    profile: options.profile || "full-studio",
    required: options.required || [],
  };

  await mkdir(projectDir, { recursive: true });
  await Promise.all(PROJECT_DIRS.map((dir) => mkdir(path.join(projectDir, dir), { recursive: true })));

  const created = [];
  const templateFiles = ["DESIGN.md", "presentation.json", "tmp/source-notes.txt", "tmp/qa-ledger.txt"];
  for (const relative of templateFiles) {
    const didCopy = await copyIfMissing(path.join(TEMPLATE_DIR, relative), path.join(projectDir, relative));
    if (didCopy) created.push(relative);
  }

  const manifestPath = path.join(projectDir, "presentation.json");
  if (created.includes("presentation.json")) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.deck.title = resolved.title;
    manifest.deck.language = resolved.language;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  let capabilityReport;
  if (created.includes("presentation.json") || options.refreshCapabilities) {
    capabilityReport = await checkCapabilities({
      projectDir,
      platform: resolved.platform,
      profile: resolved.profile,
      required: resolved.required,
    });
    await writeCapabilityProfile(projectDir, capabilityReport);
  }

  return { projectDir, created, capabilityReport };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const { target, options } = parseArgs(process.argv.slice(2));
  try {
    const result = await initWorkspace(target || process.cwd(), options);
    console.log(`Presentation workspace ready: ${result.projectDir}`);
    console.log(result.created.length ? `Created: ${result.created.join(", ")}` : "No files overwritten.");
    if (result.capabilityReport) {
      console.log(
        `Capability mode: ${result.capabilityReport.resolvedMode} ` +
          `(requested ${result.capabilityReport.requestedMode})`,
      );
      for (const capability of result.capabilityReport.missing) {
        console.log(`Missing ${capability}: ${result.capabilityReport.installGuidance[capability]}`);
        console.log(`Fallback impact: ${result.capabilityReport.fallbackImpact[capability]}`);
      }
      if (!result.capabilityReport.taskReady) {
        console.log("Install missing capabilities or obtain explicit fallback approval before asset generation.");
      }
    }
  } catch (error) {
    console.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}
