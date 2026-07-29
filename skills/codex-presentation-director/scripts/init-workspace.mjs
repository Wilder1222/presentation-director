#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = path.join(SKILL_DIR, "assets", "workspace-template");
const PROJECT_DIRS = [
  "assets/generated/images",
  "assets/generated/ui",
  "diagrams",
  "motion/hyperframes",
  "motion/remotion",
  "output",
  "tmp",
];

function usage() {
  console.error(
    "Usage: node scripts/init-workspace.mjs <project-dir> [--title <title>] [--language <tag>]",
  );
}

function parseArgs(argv) {
  const args = [...argv];
  const target = args.shift();
  const options = { title: "Untitled presentation", language: "zh-CN" };

  while (args.length) {
    const flag = args.shift();
    const value = args.shift();
    if (!value || !["--title", "--language"].includes(flag)) {
      usage();
      process.exit(2);
    }
    if (flag === "--title") options.title = value;
    if (flag === "--language") options.language = value;
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
  if (!targetDir) throw new Error("A project directory is required.");

  const projectDir = path.resolve(targetDir);
  if (projectDir === path.parse(projectDir).root) {
    throw new Error("Refusing to initialize a filesystem root.");
  }

  const resolved = {
    title: options.title || "Untitled presentation",
    language: options.language || "zh-CN",
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

  return { projectDir, created };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const { target, options } = parseArgs(process.argv.slice(2));
  if (!target) {
    usage();
    process.exit(2);
  }

  try {
    const result = await initWorkspace(target, options);
    console.log(`Presentation workspace ready: ${result.projectDir}`);
    console.log(result.created.length ? `Created: ${result.created.join(", ")}` : "No files overwritten.");
  } catch (error) {
    console.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}
