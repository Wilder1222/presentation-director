import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkCapabilities } from "../skills/presentation-director/scripts/check-capabilities.mjs";
import { initWorkspace } from "../skills/presentation-director/scripts/init-workspace.mjs";
import { lockDesign } from "../skills/presentation-director/scripts/lock-design.mjs";
import { prepareBuild } from "../skills/presentation-director/scripts/prepare-build.mjs";
import { recordBuild } from "../skills/presentation-director/scripts/record-build.mjs";
import { recordQa } from "../skills/presentation-director/scripts/record-qa.mjs";
import { validateWorkspace } from "../skills/presentation-director/scripts/validate-workspace.mjs";

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function createProject() {
  const parent = await mkdtemp(path.join(REPO_ROOT, ".test-workspace-"));
  const result = await initWorkspace(parent, {
    title: "Production optimization test",
    language: "en-US",
    platform: "generic",
    profile: "director-core",
  });
  return { parent, projectDir: result.projectDir };
}

function finalManifest() {
  return {
    version: "1.4",
    status: "final",
    storage: {
      policy: "workspace-local",
      workspace: ".",
      sources: "sources",
      referenceLibrary: "reference-library",
      raw: "reference-library/raw",
      temporary: "tmp",
      output: "output",
    },
    deliveryContract: {
      primaryArtifact: "pptx",
      readyToPresent: true,
      narrativeRequired: true,
      visualImpact: "high",
      fidelity: "high",
      editability: "native-first",
      fullPageRaster: "exception-only",
    },
    deck: {
      title: "A governed agent runtime",
      audience: "Enterprise technology leaders",
      objective: "Approve a pilot",
      centralTakeaway: "Governed agents can automate repeatable work without losing control.",
      language: "en-US",
      aspectRatio: "16:9",
      primaryReference: "test-editorial-inspired",
      secondaryReferences: [],
      outputs: ["pptx"],
    },
    styleDecision: {
      mode: "auto",
      status: "selected",
      selectedId: "test-editorial-inspired",
      selectedKind: "preset",
      selectedAt: "2026-07-31T00:00:00.000Z",
      rationale: "The evidence-led narrative needs restrained editorial hierarchy.",
      visualBoard: null,
      candidates: [],
      referenceDepth: "preview",
      rawAvailable: false,
      rawStatus: "not-available",
      researchStatus: "not-required",
      sources: [],
    },
    tasteProfile: {
      status: "locked",
      designThesis: "Use evidence checkpoints to make governance inspectable and calm.",
      contentMotif: "Evidence checkpoints",
      tensions: ["clinical/humane"],
      signatureMoves: [{ name: "Evidence rail", purpose: "Keep proof beside claims", scope: "Evidence slides" }],
      antiDefaults: ["generic-ai-glow", "feature-card-wall", "decorative-neural-mesh"],
      contentSwapTest: "pass",
      authorshipNote: "The evidence rail turns provenance into the recurring structure.",
    },
    capabilityProfile: {
      platform: "generic",
      requestedMode: "static-studio",
      resolvedMode: "static-studio",
      checkedAt: "2026-07-31T00:00:00.000Z",
      required: ["presentation"],
      available: ["presentation", "svg_optimization"],
      missing: [],
      taskReady: true,
      fallbacksApproved: false,
    },
    production: {},
    motionBudget: { maxVideoSlides: 3, maxTotalVideoSeconds: 45, maxTransitionStyles: 2 },
    slides: [
      {
        id: "s01",
        role: "opening",
        claimKind: "original",
        claim: "Control can be designed into automation.",
        title: "Automation does not have to trade away control",
        layoutPattern: "single-hero",
        renderer: "native_ppt",
        editability: "native",
        content: {},
        assets: [],
        sources: [],
      },
      {
        id: "s02",
        role: "problem",
        claimKind: "original",
        claim: "Ungoverned handoffs create hidden risk.",
        title: "The risk lives in the handoffs",
        layoutPattern: "asymmetric-evidence",
        renderer: "native_ppt",
        editability: "native",
        content: {},
        assets: [],
        sources: [],
      },
      {
        id: "s03",
        role: "architecture",
        claimKind: "original",
        claim: "Governance surrounds every execution step.",
        title: "Control is part of the runtime",
        layoutPattern: "layered-architecture",
        renderer: "svg",
        editability: "mixed",
        content: {},
        assets: [{ id: "architecture", kind: "svg", path: "diagrams/architecture.svg", status: "ready" }],
        sources: [],
      },
      {
        id: "s04",
        role: "decision",
        claimKind: "original",
        claim: "A focused pilot proves value safely.",
        title: "Start with one governed workflow",
        layoutPattern: "decision-path",
        renderer: "native_ppt",
        editability: "native",
        content: {},
        assets: [],
        sources: [],
      },
    ],
  };
}

const DESIGN = `# Presentation Design Contract

## Identity
Editorial evidence system with restrained hierarchy.

## Design Thesis
Use evidence checkpoints to make governance inspectable and calm.

## Design DNA
Evidence rails and one controlled architecture cutaway.

## Anti-AI Defaults
No generic glow, feature-card walls, or decorative neural meshes.

## Reference Evidence
Internal test reference with no copied assets.

## Colors
Warm white, charcoal, and one semantic green.

## Typography
Humanist sans with decisive display scale.

## Layout
Asymmetric evidence rail with generous safe margins.

## Motion
Static-first with no motion required for this test.

## Do Not
Do not flatten text, diagrams, or claims.

## Rights
All test content is original.
`;

test("Manifest 1.4 production lock, cache, task graph, and QA form a valid final workflow", async (t) => {
  const { parent, projectDir } = await createProject();
  t.after(async () => rm(parent, { recursive: true, force: true }));

  await writeFile(path.join(projectDir, "presentation.json"), `${JSON.stringify(finalManifest(), null, 2)}\n`);
  await writeFile(path.join(projectDir, "DESIGN.md"), DESIGN);
  await mkdir(path.join(projectDir, "tmp", "design-lock"), { recursive: true });
  await mkdir(path.join(projectDir, "diagrams"), { recursive: true });
  await writeFile(path.join(projectDir, "diagrams", "architecture.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
  const sampleMappings = [];
  for (const id of ["s01", "s02", "s03", "s04"]) {
    const relative = `tmp/design-lock/${id}.png`;
    await writeFile(path.join(projectDir, relative), `sample-${id}`);
    sampleMappings.push({ slideId: id, artifact: relative });
  }

  const designLock = await lockDesign(projectDir, { approvedBy: "auto-review", samples: sampleMappings });
  assert.equal(designLock.status, "locked");
  assert.equal(designLock.samples.length, 4);

  const firstPlan = await prepareBuild(projectDir, { maxWorkers: 3 });
  assert.equal(firstPlan.plan.summary.dirty, 4);
  assert.equal(firstPlan.taskGraph.maxParallelWorkers, 3);
  assert.ok(firstPlan.taskGraph.tasks.some((task) => task.id === "produce:s03"));

  for (const slide of firstPlan.plan.slides) {
    const capsule = path.join(projectDir, "tmp", "slide-builds", slide.slideId);
    await mkdir(capsule, { recursive: true });
    await writeFile(path.join(capsule, "slide-source.json"), JSON.stringify({ title: slide.slideId }));
    await writeFile(path.join(capsule, "preview.png"), `preview-${slide.slideId}`);
    await writeFile(path.join(capsule, "receipt.json"), JSON.stringify({
      schemaVersion: "1.0",
      slideId: slide.slideId,
      renderer: slide.renderer,
      inputHash: slide.inputHash,
      status: "complete",
      sourceFiles: ["slide-source.json"],
      preview: "preview.png",
    }));
  }

  const recorded = await recordBuild(projectDir, { all: true, slides: [] });
  assert.equal(recorded.recorded.length, 4);

  const secondPlan = await prepareBuild(projectDir, { maxWorkers: 3 });
  assert.equal(secondPlan.plan.summary.cached, 4);
  assert.equal(secondPlan.plan.summary.dirty, 0);

  for (const id of ["s01", "s02", "s03", "s04"]) {
    await recordQa(projectDir, {
      slideId: id,
      final: false,
      status: "passed",
      reviewer: "test-reviewer",
      note: "Full-size slide inspection passed",
    });
  }
  await writeFile(path.join(projectDir, "diagrams", "architecture.svg"), "<svg>tampered</svg>");
  await assert.rejects(
    recordQa(projectDir, {
      final: true,
      status: "passed",
      reviewer: "test-director",
      note: "This should fail because an output changed",
    }),
    /output changed after recording/,
  );
  await writeFile(path.join(projectDir, "diagrams", "architecture.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
  const finalQa = await recordQa(projectDir, {
    final: true,
    status: "passed",
    reviewer: "test-director",
    note: "All slides and final deck open-check passed",
  });
  assert.equal(finalQa.status, "passed");

  const validation = await validateWorkspace(projectDir);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));

  const taskGraph = JSON.parse(await readFile(path.join(projectDir, "tmp", "task-graph.json"), "utf8"));
  assert.equal(taskGraph.coordination.workersMayWriteOnlyDeclaredPaths, true);
  assert.ok(taskGraph.coordination.directorOwns.includes("presentation.json"));

  const manifest = JSON.parse(await readFile(path.join(projectDir, "presentation.json"), "utf8"));
  manifest.slides[3].assets.push({
    id: "nested-conflict",
    kind: "svg",
    path: "tmp/slide-builds/s03/nested.svg",
    status: "planned",
  });
  await writeFile(path.join(projectDir, "presentation.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(prepareBuild(projectDir, { maxWorkers: 3 }), /overlapping output paths/);
});

test("Capability preflight detects project-local production tools and the complete Three.js package set", async (t) => {
  const { parent, projectDir } = await createProject();
  t.after(async () => rm(parent, { recursive: true, force: true }));

  const parentSharp = path.join(parent, "node_modules", "sharp");
  await mkdir(parentSharp, { recursive: true });
  await writeFile(path.join(parentSharp, "package.json"), JSON.stringify({ name: "sharp", version: "1.0.0" }));
  const parentOnlyReport = await checkCapabilities({
    projectDir,
    platform: "generic",
    profile: "director-core",
    required: ["raster_processing"],
  });
  assert.deepEqual(parentOnlyReport.missing, ["raster_processing"]);

  for (const packageName of ["sharp", "svgo", "three", "@types/three", "@react-three/fiber", "@remotion/three"]) {
    const packageDir = path.join(projectDir, "node_modules", ...packageName.split("/"));
    await mkdir(packageDir, { recursive: true });
    await writeFile(path.join(packageDir, "package.json"), JSON.stringify({ name: packageName, version: "1.0.0" }));
  }
  const toolsDir = path.join(projectDir, "tools", "portable", "bin");
  await mkdir(toolsDir, { recursive: true });
  const extension = process.platform === "win32" ? ".cmd" : "";
  for (const command of ["dot", "ffmpeg", "ffprobe"]) {
    await writeFile(path.join(toolsDir, `${command}${extension}`), "test tool");
  }

  const report = await checkCapabilities({
    projectDir,
    platform: "generic",
    profile: "director-core",
    required: ["raster_processing", "svg_optimization", "diagram_graph", "media_tooling", "three_d"],
  });
  assert.deepEqual(report.missing, []);
  assert.equal(report.taskReady, true);
  assert.ok(report.toolPaths.dot);
  assert.ok(report.toolPaths.ffmpeg);
  assert.ok(report.toolPaths.ffprobe);
});
