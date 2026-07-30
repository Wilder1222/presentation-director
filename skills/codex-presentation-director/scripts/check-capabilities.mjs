#!/usr/bin/env node

import { access, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPENDENCY_PATH = path.join(SKILL_DIR, "references", "dependencies.json");
const SKIP_DIRECTORIES = new Set([
  ".git",
  "assets",
  "node_modules",
  "output",
  "previews",
  "raw",
  "selected",
  "tmp",
]);

function usage() {
  console.error(
    "Usage: node scripts/check-capabilities.mjs [--platform <name>] [--project <dir>] " +
      "[--profile <id>] [--require <capability[,capability]>] [--write] " +
      "[--approve-fallbacks] [--allow-incomplete] [--json]",
  );
}

function parseArgs(argv) {
  const options = {
    platform: "auto",
    projectDir: process.cwd(),
    profile: undefined,
    required: [],
    write: false,
    approveFallbacks: false,
    allowIncomplete: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (["--write", "--approve-fallbacks", "--allow-incomplete", "--json"].includes(flag)) {
      if (flag === "--write") options.write = true;
      if (flag === "--approve-fallbacks") options.approveFallbacks = true;
      if (flag === "--allow-incomplete") options.allowIncomplete = true;
      if (flag === "--json") options.json = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || !["--platform", "--project", "--profile", "--require"].includes(flag)) {
      usage();
      process.exit(2);
    }
    index += 1;
    if (flag === "--platform") options.platform = value;
    if (flag === "--project") options.projectDir = value;
    if (flag === "--profile") options.profile = value;
    if (flag === "--require") {
      options.required.push(...value.split(",").map((item) => item.trim()).filter(Boolean));
    }
  }

  return options;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadDependencyManifest() {
  return JSON.parse(await readFile(DEPENDENCY_PATH, "utf8"));
}

async function detectPlatform(explicit) {
  if (explicit && explicit !== "auto") return explicit;
  if (process.env.PRESENTATION_AGENT_PLATFORM) return process.env.PRESENTATION_AGENT_PLATFORM;
  if (process.env.CLAUDECODE || process.env.CLAUDE_CODE_ENTRYPOINT) return "claude-code";
  if (process.env.GEMINI_CLI) return "gemini";
  if (process.env.CURSOR_AGENT) return "cursor";
  if (process.env.GITHUB_COPILOT) return "copilot";
  if (process.env.CODEX_HOME || process.env.CODEX_THREAD_ID) return "codex";

  const home = os.homedir();
  const candidates = [];
  for (const [platform, target] of [
    ["codex", path.join(home, ".codex")],
    ["claude-code", path.join(home, ".claude")],
    ["gemini", path.join(home, ".gemini")],
    ["cursor", path.join(home, ".cursor")],
    ["copilot", path.join(home, ".copilot")],
  ]) {
    if (await exists(target)) candidates.push(platform);
  }
  return candidates.length === 1 ? candidates[0] : "generic";
}

function platformSkillRoots(platform, projectDir) {
  const home = os.homedir();
  const roots = [
    path.join(SKILL_DIR, ".."),
    path.join(projectDir, ".agents", "skills"),
  ];

  const platformRoots = {
    codex: [
      path.join(home, ".codex", "skills"),
      path.join(home, ".agents", "skills"),
      path.join(home, ".codex", "plugins", "cache"),
    ],
    "claude-code": [
      path.join(home, ".claude", "skills"),
      path.join(home, ".claude", "plugins", "cache"),
      path.join(projectDir, ".claude", "skills"),
    ],
    copilot: [
      path.join(home, ".copilot", "skills"),
      path.join(home, ".agents", "skills"),
      path.join(projectDir, ".github", "skills"),
    ],
    gemini: [
      path.join(home, ".gemini", "skills"),
      path.join(home, ".gemini", "extensions"),
      path.join(projectDir, ".gemini", "skills"),
    ],
    cursor: [
      path.join(home, ".cursor", "skills"),
      path.join(home, ".agents", "skills"),
      path.join(projectDir, ".cursor", "skills"),
    ],
    generic: [
      path.join(home, ".agents", "skills"),
      path.join(home, ".claude", "skills"),
      path.join(home, ".codex", "skills"),
      path.join(home, ".copilot", "skills"),
      path.join(home, ".cursor", "skills"),
      path.join(home, ".gemini", "skills"),
    ],
  };

  roots.push(...(platformRoots[platform] || platformRoots.generic));
  if (process.env.PRESENTATION_SKILL_PATHS) {
    roots.push(...process.env.PRESENTATION_SKILL_PATHS.split(path.delimiter).filter(Boolean));
  }
  return [...new Set(roots.map((item) => path.resolve(item)))];
}

async function collectSkillFiles(root, output, depth = 0) {
  if (depth > 9 || !(await exists(root))) return;
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === "skill.md") output.push(target);
    if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name.toLowerCase())) {
      await collectSkillFiles(target, output, depth + 1);
    }
  }
}

async function collectSkills(roots) {
  const files = [];
  for (const root of roots) await collectSkillFiles(root, files);

  const skills = new Map();
  for (const file of [...new Set(files)]) {
    const basename = normalize(path.basename(path.dirname(file)));
    if (basename) skills.set(basename, file);
    try {
      const contents = await readFile(file, "utf8");
      const frontmatterName = contents.match(/^name:\s*["']?([^\r\n"']+)/m)?.[1];
      if (frontmatterName) skills.set(normalize(frontmatterName), file);
    } catch {
      // Ignore unreadable third-party skills and continue with other evidence.
    }
  }
  return skills;
}

async function collectPackages(projectDir, config) {
  const packages = new Set();
  const candidates = new Set();
  for (const capability of Object.values(config.capabilities)) {
    for (const provider of capability.providers) {
      if (provider.kind.startsWith("package-")) {
        for (const value of provider.values) candidates.add(normalize(value));
      }
    }
  }

  let current = path.resolve(projectDir);
  while (true) {
    for (const name of candidates) {
      const packageManifest = path.join(current, "node_modules", ...name.split("/"), "package.json");
      if (await exists(packageManifest)) packages.add(name);
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return packages;
}

async function collectCommands() {
  const commands = new Set();
  const searchPaths = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];
  const candidates = ["hyperframes", "libreoffice", "playwright", "remotion", "soffice"];

  for (const command of candidates) {
    for (const directory of searchPaths) {
      let found = false;
      for (const extension of extensions) {
        if (await exists(path.join(directory, `${command}${extension.toLowerCase()}`)) ||
            await exists(path.join(directory, `${command}${extension.toUpperCase()}`))) {
          commands.add(command);
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }
  return commands;
}

function evaluateProvider(provider, inventory) {
  const values = provider.values.map(normalize);
  const [kind, quantifier] = provider.kind.split("-");
  const source = kind === "skill" ? inventory.skills : kind === "package" ? inventory.packages : inventory.commands;
  const matches = values.filter((value) => source.has(value));
  const satisfied = quantifier === "all" ? matches.length === values.length : matches.length > 0;
  return { satisfied, matches };
}

function evaluateCapabilities(config, inventory) {
  const results = {};
  for (const [id, capability] of Object.entries(config.capabilities)) {
    const checks = capability.providers.map((provider) => evaluateProvider(provider, inventory));
    const matched = checks.find((item) => item.satisfied);
    results[id] = {
      available: Boolean(matched),
      evidence: matched?.matches || [],
    };
  }
  return results;
}

function profileById(config, id) {
  return config.profiles.find((profile) => profile.id === id);
}

function resolveProfile(config, capabilityResults) {
  let resolved = config.profiles[0];
  for (const profile of config.profiles) {
    if (profile.requires.every((id) => capabilityResults[id]?.available)) resolved = profile;
  }
  return resolved;
}

async function existingCapabilityProfile(projectDir) {
  const manifestPath = path.join(projectDir, "presentation.json");
  if (!(await exists(manifestPath))) return undefined;
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    return manifest.capabilityProfile;
  } catch {
    return undefined;
  }
}

function sameMissingSet(previous, report) {
  if (!previous || previous.requestedMode !== report.requestedMode) return false;
  return JSON.stringify([...(previous.missing || [])].sort()) === JSON.stringify([...report.missing].sort());
}

export async function checkCapabilities(options = {}) {
  const config = await loadDependencyManifest();
  const projectDir = path.resolve(options.projectDir || process.cwd());
  const platform = await detectPlatform(options.platform || "auto");
  const requestedMode = options.profile || config.defaultProfile;
  const requestedProfile = profileById(config, requestedMode);
  if (!requestedProfile) throw new Error(`Unknown capability profile: ${requestedMode}`);

  const skills = await collectSkills(platformSkillRoots(platform, projectDir));
  const packages = await collectPackages(projectDir, config);
  const commands = await collectCommands();
  const capabilityResults = evaluateCapabilities(config, { skills, packages, commands });
  const required = [...new Set([...requestedProfile.requires, ...(options.required || [])])];
  for (const id of required) {
    if (!config.capabilities[id]) throw new Error(`Unknown required capability: ${id}`);
  }

  const available = Object.keys(config.capabilities).filter((id) => capabilityResults[id].available);
  const missing = required.filter((id) => !capabilityResults[id].available);
  const resolvedMode = resolveProfile(config, capabilityResults).id;
  const report = {
    platform,
    requestedMode,
    resolvedMode,
    checkedAt: new Date().toISOString(),
    required,
    available,
    missing,
    taskReady: missing.length === 0,
    fallbacksApproved: false,
    evidence: Object.fromEntries(
      Object.entries(capabilityResults).map(([id, result]) => [id, result.evidence]),
    ),
    installGuidance: Object.fromEntries(
      missing.map((id) => [id, config.capabilities[id].install[platform] || config.capabilities[id].install.generic]),
    ),
    fallbackImpact: Object.fromEntries(
      missing.map((id) => [id, config.capabilities[id].fallback]),
    ),
  };

  const previous = await existingCapabilityProfile(projectDir);
  report.fallbacksApproved = Boolean(
    missing.length > 0 &&
      (options.approveFallbacks || (previous?.fallbacksApproved && sameMissingSet(previous, report))),
  );
  return report;
}

export async function writeCapabilityProfile(projectDir, report) {
  const manifestPath = path.join(path.resolve(projectDir), "presentation.json");
  if (!(await exists(manifestPath))) throw new Error(`presentation.json not found in ${projectDir}`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const {
    evidence: _evidence,
    installGuidance: _installGuidance,
    fallbackImpact: _fallbackImpact,
    ...profile
  } = report;
  manifest.capabilityProfile = profile;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function printHumanReport(report, config) {
  console.log("Presentation Director capability check");
  console.log(`Platform: ${report.platform}`);
  console.log(`Requested mode: ${report.requestedMode}`);
  console.log(`Resolved mode: ${report.resolvedMode}`);
  for (const [id, capability] of Object.entries(config.capabilities)) {
    const available = report.available.includes(id);
    const evidence = report.evidence[id]?.length ? ` (${report.evidence[id].join(", ")})` : "";
    console.log(`${available ? "✓" : "✗"} ${capability.label}${evidence}`);
  }
  if (report.missing.length) {
    console.log("\nMissing capabilities required for this request:");
    for (const id of report.missing) {
      console.log(`- ${config.capabilities[id].label}: ${report.installGuidance[id]}`);
      console.log(`  Fallback impact: ${config.capabilities[id].fallback}`);
    }
  }
  const readiness = report.taskReady
    ? "ready"
    : report.fallbacksApproved
      ? "ready only with the explicitly approved fallbacks"
      : "blocked until installation or explicit fallback approval";
  console.log(`\nTask readiness: ${readiness}`);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const options = parseArgs(process.argv.slice(2));
  try {
    const config = await loadDependencyManifest();
    const report = await checkCapabilities(options);
    if (options.write) await writeCapabilityProfile(options.projectDir, report);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printHumanReport(report, config);
    process.exit(report.taskReady || report.fallbacksApproved || options.allowIncomplete ? 0 : 1);
  } catch (error) {
    console.error(`Capability check failed: ${error.message}`);
    process.exit(2);
  }
}
