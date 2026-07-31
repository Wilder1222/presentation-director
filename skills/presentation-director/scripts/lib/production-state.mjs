import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const WORKSPACE_NAME = "presentation-director";
export const BUILD_CONTRACT_VERSION = "1.0";
export const CREATIVE_CONTRACT_VERSION = "1.0";

export async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function resolveProjectDir(explicit = process.cwd()) {
  const candidate = path.resolve(explicit);
  return path.basename(candidate).toLowerCase() === WORKSPACE_NAME
    ? candidate
    : path.join(candidate, WORKSPACE_NAME);
}

export function workspacePath(projectDir, relativePath, label = "path") {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new Error(`${label} must be a non-empty workspace-relative path.`);
  }
  if (/^https?:\/\//i.test(relativePath)) {
    throw new Error(`${label} must be local, not a URL: ${relativePath}`);
  }
  const root = path.resolve(projectDir);
  const resolved = path.resolve(root, relativePath);
  const rootWithSep = `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error(`${label} escapes the presentation workspace: ${relativePath}`);
  }
  return resolved;
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashFile(target) {
  return sha256(await readFile(target));
}

export async function hashPath(target) {
  const metadata = await stat(target);
  if (metadata.isFile()) return hashFile(target);
  if (!metadata.isDirectory()) return sha256(`${metadata.mode}:${metadata.size}`);
  const entries = await readdir(target, { withFileTypes: true });
  const snapshots = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (new Set([".git", "node_modules", "output", "tmp"]).has(entry.name)) continue;
    const child = path.join(target, entry.name);
    snapshots.push([entry.name, await hashPath(child)]);
  }
  return sha256(stableStringify(snapshots));
}

export async function readJson(target) {
  return JSON.parse(await readFile(target, "utf8"));
}

export async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function computeDesignDigest(manifest, design) {
  const style = manifest.styleDecision || {};
  const deck = manifest.deck || {};
  const normalized = {
    design: String(design).replace(/\r\n/g, "\n").trim(),
    styleDecision: {
      mode: style.mode,
      selectedId: style.selectedId,
      selectedKind: style.selectedKind,
      rationale: style.rationale,
      referenceDepth: style.referenceDepth,
      sources: style.sources || [],
    },
    tasteProfile: manifest.tasteProfile || {},
    deck: {
      aspectRatio: deck.aspectRatio,
      primaryReference: deck.primaryReference,
      secondaryReferences: deck.secondaryReferences || [],
    },
    motionBudget: manifest.motionBudget || {},
    creativePlanDigest: manifest.production?.creativePlan?.digest || null,
  };
  return sha256(stableStringify(normalized));
}

function contentShape(value) {
  if (Array.isArray(value)) {
    return { type: "array", length: value.length, items: value.map(contentShape) };
  }
  if (value && typeof value === "object") {
    return {
      type: "object",
      fields: Object.fromEntries(Object.keys(value).sort().map((key) => [key, contentShape(value[key])])),
    };
  }
  return { type: value === null ? "null" : typeof value };
}

function creativeAssetSnapshot(asset) {
  return {
    id: asset?.id,
    kind: asset?.kind,
    brief: asset?.brief || null,
    sourcePath: asset?.sourcePath || null,
    inputPaths: asset?.inputPaths || [],
    source: asset?.source || null,
    rights: asset?.rights || null,
  };
}

export function creativeSourceSnapshot(manifest) {
  const deck = manifest.deck || {};
  return {
    contractVersion: CREATIVE_CONTRACT_VERSION,
    deck: {
      audience: deck.audience,
      objective: deck.objective,
      centralTakeaway: deck.centralTakeaway,
      language: deck.language,
      aspectRatio: deck.aspectRatio,
    },
    narrative: manifest.narrative || null,
    slides: (manifest.slides || []).map((slide) => ({
      id: slide.id,
      role: slide.role,
      claimKind: slide.claimKind,
      claim: slide.claim,
      title: slide.title,
      layoutPattern: slide.layoutPattern,
      renderer: slide.renderer,
      editability: slide.editability,
      narrativeBeat: slide.narrativeBeat || null,
      visualPlan: slide.visualPlan || null,
      contentShape: contentShape(slide.content || {}),
      contentDigest: sha256(stableStringify(slide.content || {})),
      assets: (slide.assets || []).map(creativeAssetSnapshot),
      motion: slide.motion ? {
        engine: slide.motion.engine,
        pattern: slide.motion.pattern,
        durationSeconds: slide.motion.durationSeconds,
        purpose: slide.motion.purpose,
      } : null,
      threeD: slide.threeD ? {
        runtime: slide.threeD.runtime,
        purpose: slide.threeD.purpose,
        fallback: slide.threeD.fallback,
      } : null,
    })),
  };
}

export function computeCreativeDigest(manifest) {
  return sha256(stableStringify(creativeSourceSnapshot(manifest)));
}

export function computeManifestBuildDigest(manifest) {
  const capability = manifest.capabilityProfile || {};
  return sha256(stableStringify({
    version: manifest.version,
    deliveryContract: manifest.deliveryContract,
    deck: manifest.deck,
    styleDecision: manifest.styleDecision,
    tasteProfile: manifest.tasteProfile,
    capabilityProfile: {
      requestedMode: capability.requestedMode,
      resolvedMode: capability.resolvedMode,
      required: capability.required || [],
      available: capability.available || [],
      missing: capability.missing || [],
      fallbacksApproved: capability.fallbacksApproved,
    },
    motionBudget: manifest.motionBudget,
    slides: manifest.slides || [],
  }));
}

export function slideBuildCapsule(slide) {
  return slide.buildCapsule || `tmp/slide-builds/${slide.id}`;
}

export function expectedOutputPaths(slide) {
  const outputs = [slideBuildCapsule(slide)];
  for (const asset of Array.isArray(slide.assets) ? slide.assets : []) {
    if (asset?.path && asset.status !== "rejected") outputs.push(asset.path);
  }
  if (slide.posterFrame) outputs.push(slide.posterFrame);
  return [...new Set(outputs)];
}

export async function inspectBuildRecord(projectDir, planned, record) {
  const problems = [];
  if (record?.status !== "complete") problems.push("record is not complete");
  if (record?.inputHash !== planned.inputHash) problems.push("input hash does not match the current plan");
  const expected = (planned.outputs || []).map((output) => output.path);
  const recorded = Array.isArray(record?.outputs) ? record.outputs : [];
  if (recorded.length !== expected.length) problems.push("recorded output set does not match the current plan");
  for (const relativePath of expected) {
    const snapshot = recorded.find((item) => item.path === relativePath);
    if (!snapshot?.hash) {
      problems.push(`missing recorded hash for ${relativePath}`);
      continue;
    }
    const target = workspacePath(projectDir, relativePath, "recorded build output");
    if (!(await exists(target))) {
      problems.push(`output is missing: ${relativePath}`);
      continue;
    }
    if (await hashPath(target) !== snapshot.hash) problems.push(`output changed after recording: ${relativePath}`);
  }
  return { valid: problems.length === 0, problems };
}

export function productionDefaults() {
  return {
    creativePlan: {
      status: "pending",
      contractVersion: CREATIVE_CONTRACT_VERSION,
      preparedAt: null,
      digest: null,
      narrativeMap: "tmp/creative/narrative-map.json",
      storyboard: "tmp/creative/storyboard.json",
      assetPlan: "tmp/creative/asset-plan.json",
      report: "tmp/creative/report.json",
      providerBriefsRoot: "tmp/provider-briefs",
      providerIndex: "tmp/provider-briefs/index.json",
      artifactHashes: {},
      warnings: 0,
    },
    designLock: {
      status: "pending",
      requiredSampleCount: 4,
      lockedAt: null,
      approvedBy: null,
      creativeDigest: null,
      designDigest: null,
      samples: [],
    },
    build: {
      strategy: "incremental-content-addressed",
      cacheState: "tmp/build-cache/state.json",
      plan: "tmp/build-plan.json",
      taskGraph: "tmp/task-graph.json",
      maxParallelWorkers: 4,
      lastPreparedAt: null,
      lastRecordedAt: null,
    },
    qa: {
      strategy: "risk-based-plus-final-full",
      plan: "tmp/qa-plan.json",
      results: "tmp/qa-results.json",
      ledger: "tmp/qa-ledger.txt",
      finalFullReviewRequired: true,
      finalFullReview: {
        status: "pending",
        completedAt: null,
        reviewer: null,
      },
    },
  };
}

export function ensureProduction(manifest) {
  const defaults = productionDefaults();
  manifest.production = manifest.production || {};
  manifest.production.creativePlan = {
    ...defaults.creativePlan,
    ...(manifest.production.creativePlan || {}),
  };
  manifest.production.designLock = {
    ...defaults.designLock,
    ...(manifest.production.designLock || {}),
  };
  manifest.production.build = {
    ...defaults.build,
    ...(manifest.production.build || {}),
  };
  manifest.production.qa = {
    ...defaults.qa,
    ...(manifest.production.qa || {}),
    finalFullReview: {
      ...defaults.qa.finalFullReview,
      ...(manifest.production.qa?.finalFullReview || {}),
    },
  };
  return manifest.production;
}
