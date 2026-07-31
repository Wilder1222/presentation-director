import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { computeCreativeDigest } from "../skills/presentation-director/scripts/lib/production-state.mjs";
import { initWorkspace } from "../skills/presentation-director/scripts/init-workspace.mjs";
import { lockDesign } from "../skills/presentation-director/scripts/lock-design.mjs";
import { prepareCreative } from "../skills/presentation-director/scripts/prepare-creative.mjs";
import { recordAssetSelection } from "../skills/presentation-director/scripts/record-asset-selection.mjs";
import { validateWorkspace } from "../skills/presentation-director/scripts/validate-workspace.mjs";

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const DESIGN = `# Presentation Design Contract

## Identity
Restrained evidence-led product story with one warm signal color.

## Design Thesis
Make governance feel inspectable but humane through visible proof checkpoints.

## Design DNA
Evidence rails, deliberate quiet frames, and one product-state reveal.

## Anti-AI Defaults
No generic glow, feature-card walls, or decorative neural meshes.

## Reference Evidence
Internal test reference; no copied assets.

## Colors
Warm white, charcoal, muted green, and one coral decision signal.

## Typography
Humanist display sans paired with a compact reading sans.

## Layout
Asymmetric evidence rail with generous slide-safe margins.

## Asset Language
Generated concepts use the trace-family continuity key; sourced proof stays visibly distinct.

## Motion
Static first; progressive reveal only where sequence explains the runtime.

## Do Not
Do not flatten exact claims, architecture labels, charts, or tables.

## Rights
All test content and candidate assets are original.
`;

function beat(question, evidenceType, consequence, bridgeToNext = null) {
  return { question, evidenceType, consequence, bridgeToNext };
}

function visual(silhouette, density, focalMode, visualPeak, continuityCue) {
  return { silhouette, density, focalMode, visualPeak, continuityCue };
}

function slide(id, role, title, claim, layoutPattern, renderer, narrativeBeat, visualPlan, assets = []) {
  return {
    id,
    role,
    claimKind: "original",
    claim,
    title,
    layoutPattern,
    renderer,
    editability: renderer === "image_slide" ? "flattened" : renderer === "svg" ? "mixed" : "native",
    ...(renderer === "image_slide" ? { rasterExceptionReason: "The product-state collage needs one continuous generated composition." } : {}),
    narrativeBeat,
    visualPlan,
    content: {},
    assets,
    sources: [],
  };
}

async function createCreativeProject() {
  const parent = await mkdtemp(path.join(REPO_ROOT, ".test-workspace-"));
  const initialized = await initWorkspace(parent, {
    title: "Creative planning test",
    language: "en-US",
    platform: "generic",
    profile: "director-core",
  });
  const manifestPath = path.join(initialized.projectDir, "presentation.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.status = "planning";
  manifest.deck = {
    title: "A governed agent runtime",
    audience: "Enterprise technology leaders",
    objective: "Approve a focused pilot",
    centralTakeaway: "Visible control makes agent automation adoptable.",
    language: "en-US",
    aspectRatio: "16:9",
    primaryReference: "test-editorial-inspired",
    secondaryReferences: [],
    outputs: ["pptx"],
  };
  manifest.styleDecision = {
    mode: "auto",
    status: "selected",
    selectedId: "test-editorial-inspired",
    selectedKind: "preset",
    selectedAt: "2026-07-31T00:00:00.000Z",
    rationale: "A restrained editorial system fits an evidence-led decision narrative.",
    visualBoard: null,
    candidates: [],
    referenceDepth: "preview",
    rawAvailable: false,
    rawStatus: "not-available",
    researchStatus: "not-required",
    sources: [],
  };
  manifest.tasteProfile = {
    status: "locked",
    designThesis: "Make governance inspectable but humane through visible proof checkpoints.",
    contentMotif: "Evaluation checkpoints",
    tensions: ["clinical/humane"],
    signatureMoves: [{ name: "Evidence rail", purpose: "Keep proof beside claims", scope: "Evidence slides" }],
    antiDefaults: ["generic-ai-glow", "feature-card-wall", "decorative-neural-mesh"],
    contentSwapTest: "pass",
    authorshipNote: "The evidence rail turns provenance into the recurring composition device.",
  };
  manifest.narrative = {
    status: "locked",
    communicationJob: "By the end, enterprise technology leaders should approve a focused pilot because visible control makes agent automation adoptable.",
    audienceStartingPoint: "Interested in automation but concerned about opaque execution risk.",
    audienceEndState: "Confident that a bounded pilot can prove value without sacrificing governance.",
    stakes: "Without visible controls, promising agent workflows remain blocked from production.",
    arc: "risk -> runtime control -> product proof -> pilot decision",
    turningPointSlideId: "s03",
    resolution: "Approve one governed workflow with explicit success and stop criteria.",
  };
  manifest.slides = [
    slide(
      "s01",
      "opening",
      "Automation can scale without hiding control",
      "Control can be designed into agent automation.",
      "single-hero",
      "native_ppt",
      beat("Can automation scale without becoming opaque?", "reasoning", "The problem shifts from capability to visible control.", "Where does the hidden risk actually enter?"),
      visual("single-hero", "low", "type", true, "Opening evidence rail begins as a single rule."),
    ),
    slide(
      "s02",
      "problem",
      "The risk accumulates at every invisible handoff",
      "Ungoverned handoffs create operational risk.",
      "asymmetric-evidence",
      "native_ppt",
      beat("Where does hidden execution risk accumulate?", "reasoning", "Each handoff needs an inspectable checkpoint.", "What would a runtime look like if control surrounded execution?"),
      visual("asymmetric-evidence", "medium", "data", false, "The evidence rail gains one checkpoint per handoff."),
    ),
    slide(
      "s03",
      "product-reveal",
      "The runtime makes every decision inspectable",
      "A governed runtime exposes intent, action, and evidence in one product state.",
      "product-state-reveal",
      "image_slide",
      beat("Can control become a visible product behavior?", "product", "The product turns governance from policy into an operating surface.", "How is that control organized under the surface?"),
      visual("product-state-reveal", "low", "image", true, "The evidence rail becomes a visible product trace."),
      [{
        id: "runtime-hero",
        kind: "image",
        path: "assets/generated/images/runtime-hero.webp",
        status: "planned",
        brief: {
          purpose: "Show the governed runtime as one coherent product state.",
          method: "image-generation",
          role: "hero",
          placement: "Full field with native title safe zone at top left.",
          aspectRatio: "16:9",
          continuityKey: "trace-family",
          reusePolicy: "single-use",
          selectionMode: "variants",
          variantCount: 2,
          dependencies: [],
          acceptance: ["Control trace is the first focal point", "No text, logos, or generic AI glow"],
          mustAvoid: ["dashboard card wall", "neon circuitry"],
        },
      }],
    ),
    slide(
      "s04",
      "architecture",
      "Governance surrounds every execution layer",
      "The architecture applies control before, during, and after execution.",
      "layered-architecture",
      "svg",
      beat("How is visible control enforced across the stack?", "reasoning", "The same checkpoints connect product behavior to runtime enforcement.", "What is the safest way to prove this system?"),
      visual("layered-architecture", "high", "diagram", false, "The trace-family becomes explicit control edges."),
      [{
        id: "runtime-architecture",
        kind: "svg",
        path: "diagrams/runtime-architecture.svg",
        status: "planned",
        brief: {
          purpose: "Explain the control path across experience, runtime, tools, and observability.",
          method: "diagram",
          role: "diagram",
          placement: "Centered 12-column field beneath a native takeaway title.",
          continuityKey: "trace-family",
          reusePolicy: "derived-variant",
          selectionMode: "deterministic",
          variantCount: 1,
          dependencies: ["s03:runtime-hero"],
          acceptance: ["Every edge has one declared semantic", "All labels remain editable or vector-clean"],
          mustAvoid: ["unlabeled arrows", "decorative topology"],
        },
      }],
    ),
    slide(
      "s05",
      "decision",
      "Start with one workflow and explicit stop criteria",
      "A bounded pilot proves value while preserving control.",
      "decision-path",
      "native_ppt",
      beat("How should the organization begin?", "reasoning", "One bounded workflow creates a reversible, evidence-led decision."),
      visual("decision-path", "medium", "mixed", false, "The evidence rail resolves into pilot gates."),
    ),
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(initialized.projectDir, "DESIGN.md"), DESIGN);
  return { parent, projectDir: initialized.projectDir, manifestPath };
}

test("A new workspace is a valid Manifest 1.5 draft with local creative directories", async (t) => {
  const parent = await mkdtemp(path.join(REPO_ROOT, ".test-workspace-init-"));
  t.after(async () => rm(parent, { recursive: true, force: true }));
  const initialized = await initWorkspace(parent, {
    title: "Creative Draft",
    language: "en-US",
    platform: "codex",
    profile: "director-core",
  });
  const manifest = JSON.parse(await readFile(path.join(initialized.projectDir, "presentation.json"), "utf8"));
  assert.equal(manifest.version, "1.5");
  assert.equal(manifest.production.creativePlan.status, "pending");
  for (const relativePath of ["tmp/creative", "tmp/provider-briefs"]) {
    assert.equal((await stat(path.join(initialized.projectDir, relativePath))).isDirectory(), true);
  }
  const validation = await validateWorkspace(initialized.projectDir, { allowDraft: true });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
});

test("Manifest 1.5 compiles narrative, storyboard, assets, provider briefs, and asset selection", async (t) => {
  const { parent, projectDir, manifestPath } = await createCreativeProject();
  t.after(async () => rm(parent, { recursive: true, force: true }));

  const prepared = await prepareCreative(projectDir, { strict: true });
  assert.equal(prepared.report.ready, true);
  assert.equal(prepared.report.metrics.slides, 5);
  assert.equal(prepared.report.metrics.assets, 2);
  assert.equal(prepared.report.metrics.assetWaves, 2);
  assert.deepEqual(prepared.assetPlan.executionWaves.map((wave) => wave.assets.map((asset) => asset.key)), [
    ["s03:runtime-hero"],
    ["s04:runtime-architecture"],
  ]);
  assert.equal(prepared.providerBriefs.length, 2);
  assert.equal(prepared.report.issues.length, 0);

  const providerBriefPath = path.join(projectDir, "tmp", "provider-briefs", "s03", "runtime-hero.json");
  const providerBrief = JSON.parse(await readFile(providerBriefPath, "utf8"));
  assert.equal(providerBrief.asset.continuityKey, "trace-family");
  assert.equal(providerBrief.narrative.communicationJob, prepared.narrativeMap.communicationJob);
  assert.equal(providerBrief.slide.relationshipToPrevious, prepared.narrativeMap.beats[1].bridgeToNext);
  assert.equal(providerBrief.slide.relationshipToNext, "How is that control organized under the surface?");

  const candidatesDir = path.join(projectDir, "tmp", "creative", "candidates");
  await mkdir(candidatesDir, { recursive: true });
  await writeFile(path.join(candidatesDir, "hero-a.webp"), "candidate-a");
  await writeFile(path.join(candidatesDir, "hero-b.webp"), "candidate-b");
  const selection = await recordAssetSelection(projectDir, {
    slideId: "s03",
    assetId: "runtime-hero",
    candidates: [
      { id: "a", path: "tmp/creative/candidates/hero-a.webp" },
      { id: "b", path: "tmp/creative/candidates/hero-b.webp" },
    ],
    selectedId: "b",
    reviewer: "creative-director",
    rationale: "Candidate B preserves the title safe zone and makes the control trace the first focal point.",
  });
  assert.equal(selection.selectedCandidateId, "b");
  assert.equal(await readFile(path.join(projectDir, "assets", "generated", "images", "runtime-hero.webp"), "utf8"), "candidate-b");

  const selectedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(selectedManifest.slides[2].assets[0].status, "ready");
  assert.equal(selectedManifest.production.creativePlan.digest, computeCreativeDigest(selectedManifest));
  const selectedBriefHash = selectedManifest.slides[2].assets[0].selection.providerBriefHash;
  const preparedAgain = await prepareCreative(projectDir, { strict: true });
  const idempotentManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(preparedAgain.digest, prepared.digest);
  assert.equal(idempotentManifest.production.creativePlan.preparedAt, selectedManifest.production.creativePlan.preparedAt);
  assert.equal(idempotentManifest.slides[2].assets[0].selection.providerBriefHash, selectedBriefHash);

  await mkdir(path.join(projectDir, "tmp", "design-lock"), { recursive: true });
  const samples = [];
  for (const id of ["s01", "s02", "s03", "s04"]) {
    const artifact = `tmp/design-lock/${id}.png`;
    await writeFile(path.join(projectDir, artifact), `sample-${id}`);
    samples.push({ slideId: id, artifact });
  }
  const designLock = await lockDesign(projectDir, { approvedBy: "auto-review", samples });
  assert.equal(designLock.creativeDigest, prepared.digest);

  const draftValidation = await validateWorkspace(projectDir, { allowDraft: true });
  assert.equal(draftValidation.ok, true, JSON.stringify(draftValidation.issues, null, 2));

  const originalProviderBrief = await readFile(providerBriefPath, "utf8");
  const changedProviderBrief = JSON.parse(originalProviderBrief);
  changedProviderBrief.asset.purpose = "Tampered purpose";
  await writeFile(providerBriefPath, `${JSON.stringify(changedProviderBrief, null, 2)}\n`);
  const tamperedValidation = await validateWorkspace(projectDir, { allowDraft: true });
  assert.ok(tamperedValidation.issues.some((issue) => issue.code === "production.creativePlan.provider_brief"));
  await writeFile(providerBriefPath, originalProviderBrief);

  const changedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  changedManifest.narrative.stakes = "A materially different business risk changes the story.";
  await writeFile(manifestPath, `${JSON.stringify(changedManifest, null, 2)}\n`);
  await assert.rejects(
    lockDesign(projectDir, { approvedBy: "auto-review", samples }),
    /run prepare-creative\.mjs again/,
  );

  await prepareCreative(projectDir, { strict: true });
  const titleChangedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  titleChangedManifest.slides[0].title = "A changed takeaway must invalidate compiled briefs";
  await writeFile(manifestPath, `${JSON.stringify(titleChangedManifest, null, 2)}\n`);
  await assert.rejects(
    lockDesign(projectDir, { approvedBy: "auto-review", samples }),
    /run prepare-creative\.mjs again/,
  );
});
