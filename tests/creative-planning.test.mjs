import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { computeCreativeDigest } from "../skills/presentation-director/scripts/lib/production-state.mjs";
import { compileNativeCapabilityReport } from "../skills/presentation-director/scripts/compile-native-capability-report.mjs";
import { compileQualityScorecard } from "../skills/presentation-director/scripts/compile-quality-scorecard.mjs";
import { initWorkspace } from "../skills/presentation-director/scripts/init-workspace.mjs";
import { lockDesign } from "../skills/presentation-director/scripts/lock-design.mjs";
import { prepareBuild } from "../skills/presentation-director/scripts/prepare-build.mjs";
import { prepareCreative } from "../skills/presentation-director/scripts/prepare-creative.mjs";
import { recordAssetSelection } from "../skills/presentation-director/scripts/record-asset-selection.mjs";
import { recordBuild } from "../skills/presentation-director/scripts/record-build.mjs";
import { recordDeliveryRehearsal } from "../skills/presentation-director/scripts/record-delivery-rehearsal.mjs";
import { recordQa } from "../skills/presentation-director/scripts/record-qa.mjs";
import { recordRenderObservation } from "../skills/presentation-director/scripts/record-render-observation.mjs";
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

function pageDesign(role, focalPoint = "primary") {
  return {
    designIntent: `Make the ${role} message legible through one dominant visual hierarchy.`,
    backgroundLayer: "Use the locked warm-white or charcoal field without decorative texture.",
    layoutLayer: "Use the 12-column safe grid and preserve a deliberate asymmetric evidence rail.",
    contentLayer: "Keep the takeaway native and place evidence inside one supporting region.",
    focalPoint,
    negativeSpaceTarget: 0.38,
    regions: [
      { id: "takeaway", role: "headline", anchor: "top-left", span: "7 columns", priority: "primary" },
      { id: "evidence", role: "proof", anchor: "center-right", span: "5 columns", priority: "secondary" },
    ],
    readingPath: ["takeaway", "evidence"],
  };
}

function nativeCapabilities(renderer) {
  return {
    nativeText: renderer !== "image_slide",
    nativeShapes: renderer === "native_ppt",
    nativeCharts: false,
    replaceableSvg: renderer === "svg",
    replaceableImages: renderer === "image_slide",
    embeddedVideo: renderer === "hyperframes_video" || renderer === "remotion_video",
    flattened: renderer === "image_slide",
    losses: renderer === "image_slide" ? ["The full-field generated composition is not editable as native slide objects."] : [],
  };
}

function slide(id, role, title, claim, layoutPattern, renderer, narrativeBeat, visualPlan, assets = []) {
  const design = pageDesign(role, renderer === "svg" ? "evidence" : "takeaway");
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
    pageDesign: design,
    delivery: {
      timeBudgetSeconds: 60,
      spokenDetail: `Add the concrete implication behind the ${role} claim without reading the slide title aloud.`,
      attentionCues: [{ atSeconds: 8, target: design.focalPoint, purpose: "Direct attention to the evidence that makes the claim memorable." }],
      transitionLine: role === "decision" ? null : "Use the unresolved question to move into the next proof step.",
    },
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
    acceptanceCriteria: ["The final recommendation is explicit and reversible."],
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
  manifest.contentPreference = {
    status: "locked",
    source: "inferred",
    compression: "high",
    evidenceOrder: "after-claim",
    prefers: ["giant-conclusion", "product-proof", "reversible-decision"],
    avoids: ["long-background", "generic-market-context"],
    speakerNotesDetail: "high",
    inferenceNote: "The brief prioritizes a decisive pilot recommendation, visible proof, and concise executive pacing.",
  };
  manifest.delivery = {
    status: "locked",
    mode: "live",
    totalSeconds: 330,
    reserveSeconds: 30,
    presenterGoal: "Secure approval for a governed pilot without over-explaining the architecture.",
    timingTolerance: 0.15,
    acceptanceCriteria: ["The presenter ends with an explicit approval request."],
  };
  manifest.capabilityProfile = {
    platform: "generic",
    requestedMode: "director-core",
    resolvedMode: "director-core",
    checkedAt: "2026-08-01T00:00:00.000Z",
    required: ["presentation"],
    available: ["presentation", "image_generation", "raster_processing", "svg_optimization"],
    missing: [],
    taskReady: true,
    fallbacksApproved: false,
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
  manifest.slides[1].claimKind = "external";
  manifest.slides[1].sources = [{
    label: "Governed handoff test evidence",
    path: "raw/references/governed-handoff.txt",
    usage: "Supports the operational-risk claim on slide s02.",
  }];
  await mkdir(path.join(initialized.projectDir, "raw", "references"), { recursive: true });
  await writeFile(path.join(initialized.projectDir, "raw", "references", "governed-handoff.txt"), "Visible handoff controls reduce unowned execution risk.\n");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(initialized.projectDir, "DESIGN.md"), DESIGN);
  return { parent, projectDir: initialized.projectDir, manifestPath };
}

test("A new workspace is a valid Manifest 1.7 draft with local delivery-contract directories", async (t) => {
  const parent = await mkdtemp(path.join(REPO_ROOT, ".test-workspace-init-"));
  t.after(async () => rm(parent, { recursive: true, force: true }));
  const initialized = await initWorkspace(parent, {
    title: "Creative Draft",
    language: "en-US",
    platform: "codex",
    profile: "director-core",
  });
  const manifest = JSON.parse(await readFile(path.join(initialized.projectDir, "presentation.json"), "utf8"));
  assert.equal(manifest.version, "1.7");
  assert.equal(manifest.production.creativePlan.status, "pending");
  for (const relativePath of [
    "tmp/creative",
    "tmp/provider-briefs",
    "tmp/evidence",
    "tmp/preferences",
    "tmp/delivery",
    "tmp/design/page-design",
    "tmp/qa/observations",
    "tmp/qa/repairs",
    "tmp/qa/inputs",
  ]) {
    assert.equal((await stat(path.join(initialized.projectDir, relativePath))).isDirectory(), true);
  }
  const validation = await validateWorkspace(initialized.projectDir, { allowDraft: true });
  assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
});

test("Manifest 1.7 compiles evidence, content preferences, delivery timing, page design, rubric, and provider briefs", async (t) => {
  const { parent, projectDir, manifestPath } = await createCreativeProject();
  t.after(async () => rm(parent, { recursive: true, force: true }));

  const prepared = await prepareCreative(projectDir, { strict: true });
  assert.equal(prepared.report.ready, true);
  assert.equal(prepared.report.metrics.slides, 5);
  assert.equal(prepared.report.metrics.assets, 2);
  assert.equal(prepared.report.metrics.assetWaves, 2);
  assert.equal(prepared.report.metrics.evidenceSources, 1);
  assert.equal(prepared.report.metrics.evidenceClaims, 5);
  assert.equal(prepared.report.metrics.pageDesigns, 5);
  assert.equal(prepared.report.metrics.rubricChecks, 36);
  assert.equal(prepared.report.metrics.deliveryChecks, 17);
  assert.equal(prepared.deliveryPlan.totalSeconds, 330);
  assert.equal(prepared.contentPreference.compression, "high");
  assert.deepEqual(prepared.assetPlan.executionWaves.map((wave) => wave.assets.map((asset) => asset.key)), [
    ["s03:runtime-hero"],
    ["s04:runtime-architecture"],
  ]);
  assert.equal(prepared.providerBriefs.length, 2);
  assert.equal(prepared.report.issues.length, 0);
  assert.equal(prepared.evidenceBundle.sources.length, 1);
  assert.equal(prepared.contentAlignment.slides[1].sourceIds.length, 1);
  assert.equal(prepared.pageDesignIndex.designs.length, 5);
  assert.ok(prepared.deckRubric.checks.some((check) => check.id === "s02-source-grounding"));
  assert.ok(prepared.deckRubric.checks.some((check) => check.id === "deck-delivery-custom-01"));

  const providerBriefPath = path.join(projectDir, "tmp", "provider-briefs", "s03", "runtime-hero.json");
  const providerBrief = JSON.parse(await readFile(providerBriefPath, "utf8"));
  assert.equal(providerBrief.asset.continuityKey, "trace-family");
  assert.equal(providerBrief.narrative.communicationJob, prepared.narrativeMap.communicationJob);
  assert.equal(providerBrief.slide.relationshipToPrevious, prepared.narrativeMap.beats[1].bridgeToNext);
  assert.equal(providerBrief.slide.relationshipToNext, "How is that control organized under the surface?");
  assert.equal(providerBrief.slide.pageDesignPath, "tmp/design/page-design/s03.json");
  assert.equal(providerBrief.slide.claimId, "claim-s03");
  assert.equal(providerBrief.contentPreference.speakerNotesDetail, "high");
  assert.equal(providerBrief.slide.delivery.timeBudgetSeconds, 60);

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

test("Manifest 1.7 binds artifact QA, delivery rehearsal, native capability reporting, and dual scorecards", async (t) => {
  const { parent, projectDir, manifestPath } = await createCreativeProject();
  t.after(async () => rm(parent, { recursive: true, force: true }));

  await prepareCreative(projectDir, { strict: true });
  await mkdir(path.join(projectDir, "tmp", "creative", "candidates"), { recursive: true });
  await writeFile(path.join(projectDir, "tmp", "creative", "candidates", "hero-a.webp"), "candidate-a");
  await writeFile(path.join(projectDir, "tmp", "creative", "candidates", "hero-b.webp"), "candidate-b");
  await recordAssetSelection(projectDir, {
    slideId: "s03",
    assetId: "runtime-hero",
    candidates: [
      { id: "a", path: "tmp/creative/candidates/hero-a.webp" },
      { id: "b", path: "tmp/creative/candidates/hero-b.webp" },
    ],
    selectedId: "b",
    reviewer: "test-director",
    rationale: "Candidate B preserves the title safe zone and gives the trace a clear focal role.",
  });
  await mkdir(path.join(projectDir, "diagrams"), { recursive: true });
  await writeFile(path.join(projectDir, "diagrams", "runtime-architecture.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.slides[3].assets[0].status = "ready";
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const prepared = await prepareCreative(projectDir, { strict: true });

  await mkdir(path.join(projectDir, "tmp", "design-lock"), { recursive: true });
  const samples = [];
  for (const id of ["s01", "s02", "s03", "s04"]) {
    const artifact = `tmp/design-lock/${id}.png`;
    await writeFile(path.join(projectDir, artifact), `sample-${id}`);
    samples.push({ slideId: id, artifact });
  }
  await lockDesign(projectDir, { approvedBy: "auto-review", samples });
  const build = await prepareBuild(projectDir, { maxWorkers: 2 });
  const s01 = build.plan.slides.find((slidePlan) => slidePlan.slideId === "s01");
  const capsule = path.join(projectDir, "tmp", "slide-builds", "s01");
  await mkdir(capsule, { recursive: true });
  await writeFile(path.join(capsule, "slide-source.json"), JSON.stringify({ title: "s01" }));
  await writeFile(path.join(capsule, "preview.png"), "preview-before-repair");
  await writeFile(path.join(capsule, "receipt.json"), JSON.stringify({
    schemaVersion: "1.1",
    slideId: "s01",
    renderer: s01.renderer,
    inputHash: s01.inputHash,
    status: "complete",
    sourceFiles: ["slide-source.json"],
    preview: "preview.png",
    nativeCapabilities: nativeCapabilities(s01.renderer),
  }));
  await recordBuild(projectDir, { all: false, slides: ["s01"] });

  const slideChecks = prepared.deckRubric.checks.filter((check) => check.dimension === "artifact" && check.scope === "slide" && check.slideId === "s01");
  const failed = await recordRenderObservation(projectDir, {
    scope: "slide",
    slideId: "s01",
    round: 1,
    status: "failed",
    reviewer: "visual-reviewer",
    summary: "The claim is present but the reading order hides it behind supporting evidence.",
    artifact: "tmp/slide-builds/s01/preview.png",
    findings: [{
      id: "finding-reading-order",
      severity: "error",
      category: "hierarchy",
      target: "takeaway",
      description: "The supporting proof reads before the slide claim.",
      evidence: "At full size the first fixation lands on the right evidence block.",
    }],
    rubricResults: slideChecks.map((check, index) => ({
      checkId: check.id,
      status: index === 0 ? "failed" : "passed",
      evidence: index === 0 ? "The title is visually subordinate." : "The rendered slide visibly satisfies this check.",
    })),
    repairPlan: {
      strategy: "minimal",
      actions: [{
        id: "repair-takeaway-hierarchy",
        target: "takeaway",
        operation: "adjust-typography",
        rationale: "Increase title scale and reduce supporting proof contrast without changing the composition.",
      }],
    },
  });
  assert.equal(failed.observation.status, "failed");
  assert.equal(failed.repair.strategy, "minimal");
  assert.equal((await stat(path.join(projectDir, failed.repairPath))).isFile(), true);
  await assert.rejects(
    recordQa(projectDir, {
      slideId: "s01",
      final: false,
      status: "passed",
      reviewer: "visual-reviewer",
      note: "A failed observation cannot pass QA.",
      observation: failed.observationPath,
    }),
    /status must match/,
  );

  await writeFile(path.join(capsule, "preview.png"), "preview-after-minimal-typography-repair");
  await recordBuild(projectDir, { all: false, slides: ["s01"] });
  const passed = await recordRenderObservation(projectDir, {
    scope: "slide",
    slideId: "s01",
    round: 2,
    status: "passed",
    reviewer: "visual-reviewer",
    summary: "The repaired hierarchy makes the claim the first fixation and preserves the page design.",
    artifact: "tmp/slide-builds/s01/preview.png",
    findings: [],
    rubricResults: slideChecks.map((check) => ({
      checkId: check.id,
      status: "passed",
      evidence: "The corrected full-size render visibly satisfies this requirement.",
    })),
  });
  const qa = await recordQa(projectDir, {
    slideId: "s01",
    final: false,
    status: "passed",
    reviewer: "visual-reviewer",
    note: "Round-two render passed all blocking checks.",
    observation: passed.observationPath,
  });
  assert.equal(qa.status, "passed");
  assert.equal(qa.observation.round, 2);

  for (const slidePlan of build.plan.slides.filter((item) => item.slideId !== "s01")) {
    const slideCapsule = path.join(projectDir, "tmp", "slide-builds", slidePlan.slideId);
    await mkdir(slideCapsule, { recursive: true });
    await writeFile(path.join(slideCapsule, "slide-source.json"), JSON.stringify({ title: slidePlan.slideId }));
    await writeFile(path.join(slideCapsule, "preview.png"), `preview-${slidePlan.slideId}`);
    await writeFile(path.join(slideCapsule, "receipt.json"), JSON.stringify({
      schemaVersion: "1.1",
      slideId: slidePlan.slideId,
      renderer: slidePlan.renderer,
      inputHash: slidePlan.inputHash,
      status: "complete",
      sourceFiles: ["slide-source.json"],
      preview: "preview.png",
      nativeCapabilities: nativeCapabilities(slidePlan.renderer),
    }));
  }
  await recordBuild(projectDir, { all: true, slides: [] });
  for (const slidePlan of build.plan.slides.filter((item) => item.slideId !== "s01")) {
    const checks = prepared.deckRubric.checks.filter((check) => check.dimension === "artifact" && check.scope === "slide" && check.slideId === slidePlan.slideId);
    const observation = await recordRenderObservation(projectDir, {
      scope: "slide",
      slideId: slidePlan.slideId,
      round: 1,
      status: "passed",
      reviewer: "visual-reviewer",
      summary: "The full-size render passes its task-specific communication and design checks.",
      artifact: `tmp/slide-builds/${slidePlan.slideId}/preview.png`,
      findings: [],
      rubricResults: checks.map((check) => ({
        checkId: check.id,
        status: "passed",
        evidence: "The exact full-size render visibly satisfies this requirement.",
      })),
    });
    await recordQa(projectDir, {
      slideId: slidePlan.slideId,
      final: false,
      status: "passed",
      reviewer: "visual-reviewer",
      note: "Full-size render passed all blocking checks.",
      observation: observation.observationPath,
    });
  }

  await mkdir(path.join(projectDir, "output"), { recursive: true });
  await writeFile(path.join(projectDir, "output", "governed-runtime.pptx"), "test-pptx-package");
  const deckChecks = prepared.deckRubric.checks.filter((check) => check.dimension === "artifact" && check.scope === "deck");
  const deckObservation = await recordRenderObservation(projectDir, {
    scope: "deck",
    round: 1,
    status: "passed",
    reviewer: "test-director",
    summary: "The assembled deck resolves the communication job and opens as the reviewed artifact.",
    artifact: "output/governed-runtime.pptx",
    findings: [],
    rubricResults: deckChecks.map((check) => ({
      checkId: check.id,
      status: "passed",
      evidence: "The title sequence and final recommendation visibly satisfy this deck-level requirement.",
    })),
  });
  await recordQa(projectDir, {
    slideId: undefined,
    final: true,
    status: "passed",
    reviewer: "test-director",
    note: "Every slide and the assembled PPTX passed the compiled rubric.",
    observation: deckObservation.observationPath,
  });
  const nativeReport = await compileNativeCapabilityReport(projectDir, {
    artifact: "output/governed-runtime.pptx",
    reviewer: "powerpoint-open-check",
    summary: "The final assembled PPTX was opened and every slide was audited for actual editability.",
    slides: build.plan.slides.map((slidePlan) => {
      const capability = nativeCapabilities(slidePlan.renderer);
      return {
        slideId: slidePlan.slideId,
        nativeCapabilities: slidePlan.slideId === "s04"
          ? { ...capability, losses: ["One SVG filter was rasterized during final PPTX assembly."] }
          : capability,
      };
    }),
  });
  assert.equal(nativeReport.summary.native, 3);
  assert.equal(nativeReport.summary.mixed, 1);
  assert.equal(nativeReport.summary.flattened, 1);
  assert.equal(nativeReport.summary.changedDuringAssembly, 1);
  assert.equal(nativeReport.slides.find((slide) => slide.slideId === "s04").assemblyChanges[0].field, "losses");
  const deliveryChecks = prepared.deckRubric.checks.filter((check) => check.dimension === "delivery");
  const rehearsal = await recordDeliveryRehearsal(projectDir, {
    status: "passed",
    reviewer: "presenter-reviewer",
    summary: "The live run preserved the intended attention sequence and completed inside the six-minute envelope.",
    actualTotalSeconds: 300,
    reserveUsedSeconds: 20,
    slides: prepared.deliveryPlan.slides.map((slidePlan) => ({ slideId: slidePlan.slideId, actualSeconds: 56 })),
    rubricResults: deliveryChecks.map((check) => ({
      checkId: check.id,
      status: "passed",
      evidence: "The timed rehearsal and cue log satisfy this delivery requirement.",
    })),
  });
  assert.equal(rehearsal.status, "passed");
  const scorecard = await compileQualityScorecard(projectDir);
  assert.equal(scorecard.artifactScore, 100);
  assert.equal(scorecard.deliveryScore, 100);
  const finalManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  finalManifest.status = "final";
  await writeFile(manifestPath, `${JSON.stringify(finalManifest, null, 2)}\n`);
  const finalValidation = await validateWorkspace(projectDir);
  assert.equal(finalValidation.ok, true, JSON.stringify(finalValidation.issues, null, 2));
});
