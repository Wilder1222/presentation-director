#!/usr/bin/env node

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PLUGIN_ROOT = path.resolve(SKILL_DIR, "..", "..");
const REFERENCES_DIR = path.join(SKILL_DIR, "references");
const DEPENDENCIES_PATH = path.join(REFERENCES_DIR, "dependencies.json");
const CODEX_MANIFEST_PATH = path.join(PLUGIN_ROOT, ".codex-plugin", "plugin.json");
const CLAUDE_MANIFEST_PATH = path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
const GEMINI_MANIFEST_PATH = path.join(PLUGIN_ROOT, "gemini-extension.json");
const BANNED_DOCS = new Set(["readme.md", "installation_guide.md", "quick_reference.md", "changelog.md"]);

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(target)));
    if (entry.isFile()) output.push(target);
  }
  return output;
}

function relativeFromSkill(target) {
  return path.relative(SKILL_DIR, target).split(path.sep).join("/");
}

function issue(issues, code, message, target = "skill") {
  issues.push({ code, target, message });
}

async function readJson(target, issues, label) {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    issue(issues, "json.invalid", `${label} is not valid JSON: ${error.message}`, path.relative(PLUGIN_ROOT, target));
    return null;
  }
}

async function validateMarkdownLinks(files, issues) {
  const linkPattern = /\[[^\]]+\]\((?!https?:\/\/|#)([^)]+)\)/g;
  for (const file of files.filter((item) => item.toLowerCase().endsWith(".md"))) {
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(linkPattern)) {
      const rawTarget = match[1].split("#")[0];
      if (!rawTarget) continue;
      const resolved = path.resolve(path.dirname(file), rawTarget);
      if (!(await exists(resolved))) {
        issue(issues, "link.missing", `Local Markdown link does not resolve: ${rawTarget}`, relativeFromSkill(file));
      }
    }
  }
}

export async function validateSkillStructure() {
  const issues = [];
  const skillPath = path.join(SKILL_DIR, "SKILL.md");
  const agentPath = path.join(SKILL_DIR, "agents", "openai.yaml");

  for (const required of [
    skillPath,
    agentPath,
    REFERENCES_DIR,
    path.join(SKILL_DIR, "scripts"),
    path.join(SKILL_DIR, "assets"),
    DEPENDENCIES_PATH,
    CODEX_MANIFEST_PATH,
    CLAUDE_MANIFEST_PATH,
    GEMINI_MANIFEST_PATH,
  ]) {
    if (!(await exists(required))) issue(issues, "required.missing", "Required skill resource is missing.", relativeFromSkill(required));
  }
  if (issues.length) return { ok: false, issues };

  const skill = await readFile(skillPath, "utf8");
  const skillLines = skill.split(/\r?\n/).length;
  if (skillLines > 500) issue(issues, "skill.too_long", `SKILL.md has ${skillLines} lines; keep it at or below 500.`, "SKILL.md");

  const allFiles = await walk(SKILL_DIR);
  for (const file of allFiles) {
    const basename = path.basename(file).toLowerCase();
    if (BANNED_DOCS.has(basename)) {
      issue(issues, "docs.extraneous", "User-facing or auxiliary documentation must stay outside the skill folder.", relativeFromSkill(file));
    }
    if (basename.endsWith(".pyc") || relativeFromSkill(file).split("/").includes("__pycache__")) {
      issue(issues, "cache.generated", "Generated Python cache files must not be packaged with the skill.", relativeFromSkill(file));
    }
  }

  const referenceFiles = await walk(REFERENCES_DIR);
  for (const file of referenceFiles) {
    const relative = relativeFromSkill(file);
    if (!skill.includes(relative)) {
      issue(issues, "reference.not_linked", "Every reference file must be linked directly from SKILL.md for progressive disclosure.", relative);
    }
    if (file.toLowerCase().endsWith(".md")) {
      const content = await readFile(file, "utf8");
      const lines = content.split(/\r?\n/).length;
      if (lines > 100 && !/^## Contents\s*$/m.test(content)) {
        issue(issues, "reference.no_contents", `Markdown reference has ${lines} lines but no Contents section.`, relative);
      }
    }
  }

  await validateMarkdownLinks(allFiles, issues);

  const openaiYaml = await readFile(agentPath, "utf8");
  const shortDescription = openaiYaml.match(/^\s*short_description:\s*"([^"]+)"\s*$/m)?.[1];
  if (!shortDescription || shortDescription.length < 25 || shortDescription.length > 64) {
    issue(issues, "agent.short_description", "agents/openai.yaml short_description must contain 25-64 characters.", "agents/openai.yaml");
  }
  const defaultPrompt = openaiYaml.match(/^\s*default_prompt:\s*"([^"]+)"\s*$/m)?.[1];
  if (!defaultPrompt?.includes("$codex-presentation-director")) {
    issue(issues, "agent.default_prompt", "default_prompt must explicitly invoke $codex-presentation-director.", "agents/openai.yaml");
  }

  const dependencies = await readJson(DEPENDENCIES_PATH, issues, "references/dependencies.json");
  const codexManifest = await readJson(CODEX_MANIFEST_PATH, issues, ".codex-plugin/plugin.json");
  const claudeManifest = await readJson(CLAUDE_MANIFEST_PATH, issues, ".claude-plugin/plugin.json");
  const geminiManifest = await readJson(GEMINI_MANIFEST_PATH, issues, "gemini-extension.json");

  if (dependencies) {
    const capabilityIds = new Set(Object.keys(dependencies.capabilities ?? {}));
    const profiles = Array.isArray(dependencies.profiles) ? dependencies.profiles : [];
    if (!profiles.some((profile) => profile.id === dependencies.defaultProfile)) {
      issue(issues, "dependencies.default_profile", "defaultProfile must match a declared profile.", "references/dependencies.json");
    }
    for (const profile of profiles) {
      for (const capability of profile.requires ?? []) {
        if (!capabilityIds.has(capability)) {
          issue(issues, "dependencies.unknown_capability", `Profile ${profile.id} requires unknown capability ${capability}.`, "references/dependencies.json");
        }
      }
    }
    for (const [renderer, required] of Object.entries(dependencies.rendererCapabilities ?? {})) {
      if (!Array.isArray(required)) {
        issue(issues, "dependencies.renderer_contract", `Renderer ${renderer} must map to an array.`, "references/dependencies.json");
        continue;
      }
      for (const capability of required) {
        if (!capabilityIds.has(capability)) {
          issue(issues, "dependencies.unknown_capability", `Renderer ${renderer} requires unknown capability ${capability}.`, "references/dependencies.json");
        }
      }
    }
    for (const [id, capability] of Object.entries(dependencies.capabilities ?? {})) {
      if (!Array.isArray(capability.providers) || capability.providers.length === 0) {
        issue(issues, "dependencies.providers", `Capability ${id} must declare at least one detectable provider.`, "references/dependencies.json");
      }
      for (const platform of ["codex", "claude-code", "copilot", "gemini", "cursor", "generic"]) {
        if (!capability.install?.[platform]) {
          issue(issues, "dependencies.install_guidance", `Capability ${id} is missing ${platform} install guidance.`, "references/dependencies.json");
        }
      }
    }
  }

  const versions = [codexManifest?.version, claudeManifest?.version, geminiManifest?.version].filter(Boolean);
  const baseVersions = versions.map((version) => version.split("+")[0]);
  if (versions.length !== 3 || new Set(baseVersions).size !== 1) {
    issue(
      issues,
      "manifest.version_mismatch",
      "Codex, Claude Code, and Gemini manifests must use the same base version; a Codex cachebuster suffix is allowed.",
      "plugin manifests",
    );
  }
  if (claudeManifest?.name !== "presentation-director") {
    issue(issues, "manifest.claude_name", "Claude Code plugin name must be presentation-director.", ".claude-plugin/plugin.json");
  }
  if (geminiManifest?.name !== "codex-presentation-director") {
    issue(issues, "manifest.gemini_name", "Gemini extension name must be codex-presentation-director.", "gemini-extension.json");
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      skillLines,
      references: referenceFiles.length,
      files: allFiles.length,
    },
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const result = await validateSkillStructure();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const item of result.issues) console.log(`ERROR ${item.code} ${item.target}: ${item.message}`);
    if (result.ok) {
      console.log(
        `Skill structure valid: ${result.summary.skillLines} SKILL.md lines, ${result.summary.references} references, ${result.summary.files} packaged files.`,
      );
    }
  }
  process.exit(result.ok ? 0 : 1);
}
