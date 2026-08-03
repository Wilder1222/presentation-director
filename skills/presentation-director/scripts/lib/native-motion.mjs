export const NATIVE_MOTION_CONTRACT_VERSION = "1.0";

export const NATIVE_TRANSITIONS = new Set(["none", "fade", "morph"]);
export const NATIVE_ANIMATION_EFFECTS = new Set(["appear", "fade", "wipe", "float-in", "zoom", "grow-shrink"]);
export const NATIVE_ANIMATION_PHASES = new Set(["entrance", "emphasis"]);
export const NATIVE_ANIMATION_TRIGGERS = new Set(["on-click", "with-previous", "after-previous"]);
export const NATIVE_DIRECTIONS = new Set(["none", "from-left", "from-right", "from-top", "from-bottom"]);

const TRANSITION_STYLES = ["fade", "morph"];

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function includesAny(text, terms) {
  return terms.filter((term) => text.includes(term));
}

function regionByRole(slide, roles, fallbackIndex = 0) {
  const regions = Array.isArray(slide.pageDesign?.regions) ? slide.pageDesign.regions : [];
  const match = regions.find((region) => roles.some((role) => normalized(region.role).includes(role)));
  return match?.id || regions[fallbackIndex]?.id || regions[0]?.id || "takeaway";
}

function contentText(slide) {
  const contentKeys = slide.content && typeof slide.content === "object" && !Array.isArray(slide.content)
    ? Object.keys(slide.content).join(" ")
    : "";
  return normalized([
    slide.role,
    slide.layoutPattern,
    slide.title,
    slide.claim,
    slide.narrativeBeat?.question,
    slide.visualPlan?.silhouette,
    slide.visualPlan?.focalMode,
    contentKeys,
  ].filter(Boolean).join(" "));
}

function hasContinuity(slide, previous) {
  if (!previous) return false;
  const currentIds = new Set((slide.pageDesign?.regions || []).map((region) => region.id));
  return (previous.pageDesign?.regions || []).some((region) => currentIds.has(region.id));
}

function motionSignals(slide, index, previous) {
  const text = contentText(slide);
  const role = normalized(slide.role);
  const signals = {
    opening: index === 0 || includesAny(`${role} ${text}`, ["opening", "hero", "cover", "封面", "开场", "product reveal", "产品揭晓"]).length > 0,
    section: includesAny(`${role} ${text}`, ["section", "chapter", "章节", "分章"]).length > 0,
    reveal: includesAny(`${role} ${text}`, ["reveal", "launch", "product", "statement", "揭示", "发布", "产品", "主张"]).length > 0,
    sequence: includesAny(`${role} ${text}`, [
      "architecture", "workflow", "process", "pipeline", "roadmap", "timeline", "layer", "flow", "lifecycle",
      "架构", "工作流", "流程", "管线", "路线", "时间线", "分层", "数据流", "生命周期",
    ]).length > 0,
    comparison: includesAny(`${role} ${text}`, [
      "compare", "comparison", "before", "after", "tradeoff", "option", "对比", "比较", "前后", "差异", "权衡", "选项",
    ]).length > 0,
    data: includesAny(`${role} ${text}`, [
      "metric", "kpi", "chart", "data", "performance", "growth", "指标", "数据", "图表", "性能", "增长",
    ]).length > 0,
    demo: includesAny(`${role} ${text}`, [
      "demo", "ui", "interaction", "product state", "feature", "演示", "界面", "交互", "产品状态", "功能",
    ]).length > 0,
    continuity: hasContinuity(slide, previous),
  };
  return { text, signals };
}

function transitionFor(signals, index) {
  if (signals.comparison && signals.continuity && index > 0) {
    return {
      effect: "morph",
      durationSeconds: 0.8,
      purpose: "Preserve shared anchors while making the meaningful change visible.",
      rationale: "The slide reads as a before/after or option change and shares semantic regions with the previous slide.",
    };
  }
  return {
    effect: "fade",
    durationSeconds: signals.opening || signals.section ? 0.7 : 0.55,
    purpose: signals.opening || signals.section
      ? "Reset attention for a new narrative beat."
      : "Move to the next claim without competing with the slide content.",
    rationale: signals.opening
      ? "Opening slides need a restrained entrance that establishes the deck's visual tempo."
      : signals.section
        ? "Section changes need a clear reset with the same deck-wide transition family."
        : "Fade is the safest native transition when the slide does not require spatial continuity.",
  };
}

function addAnimation(animations, slide, target, effect, phase, trigger, durationSeconds, direction, purpose, rationale) {
  if (!target) return;
  animations.push({
    id: `${slide.id}-${target}-${phase}-${animations.length + 1}`,
    target,
    targetType: "page-region",
    effect,
    phase,
    trigger,
    durationSeconds,
    delaySeconds: 0,
    direction,
    purpose,
    rationale,
  });
}

function animationFor(manifest, slide, index, previous, signals) {
  if (["image_slide", "hyperframes_video", "remotion_video"].includes(slide.renderer)) return [];
  const animations = [];
  const titleTarget = regionByRole(slide, ["headline", "title", "takeaway"]);
  const visualTarget = regionByRole(slide, ["diagram", "proof", "visual", "image", "data", "ui"], 1);
  const maxSteps = Number(manifest.motionBudget?.maxNativeAnimationStepsPerSlide || 4);
  addAnimation(
    animations,
    slide,
    titleTarget,
    "fade",
    "entrance",
    "with-previous",
    0.4,
    "none",
    "Let the audience read the takeaway before the supporting detail arrives.",
    "Every editable slide gets one quiet title entrance to establish reading order.",
  );
  if (signals.sequence || signals.data) {
    addAnimation(
      animations,
      slide,
      visualTarget,
      "wipe",
      "entrance",
      "after-previous",
      0.65,
      "from-left",
      signals.data ? "Reveal the evidence in the same direction as the data story." : "Build the system in dependency order.",
      signals.data ? "The slide contains a data or metric signal that benefits from a controlled reading direction." : "The role or content names a sequence, layer, process, or flow.",
    );
  } else if (signals.comparison) {
    addAnimation(
      animations,
      slide,
      visualTarget,
      "fade",
      "emphasis",
      "after-previous",
      0.5,
      "none",
      "Bring the changed attribute into focus after the shared anchors settle.",
      "A comparison is clearer when the difference is emphasized after the common frame appears.",
    );
  } else if (signals.reveal || signals.opening || slide.visualPlan?.visualPeak) {
    addAnimation(
      animations,
      slide,
      visualTarget,
      "fade",
      "entrance",
      "after-previous",
      0.6,
      "none",
      "Reveal the primary visual only after the claim is established.",
      "The slide is a reveal or declared visual peak; a restrained second beat creates hierarchy without spectacle.",
    );
  }
  return animations.slice(0, Number.isInteger(maxSteps) && maxSteps > 0 ? maxSteps : 4);
}

function planFor(manifest, slide, index, slides) {
  const previous = index > 0 ? slides[index - 1] : null;
  const existing = slide.nativeMotion;
  if (existing?.mode === "off") {
    return {
      schemaVersion: NATIVE_MOTION_CONTRACT_VERSION,
      status: "locked",
      mode: "off",
      source: "user",
      selectionBasis: ["User explicitly disabled native element animation and transitions for this slide."],
      transition: {
        effect: "none",
        durationSeconds: 0,
        advance: "on-click",
        purpose: "Keep the slide static.",
        rationale: "Explicit user instruction.",
      },
      animations: [],
      fallback: "Keep all slide objects visible and static.",
    };
  }
  if (existing?.mode === "specified") return { ...existing, schemaVersion: NATIVE_MOTION_CONTRACT_VERSION, status: "locked", source: "user" };

  const { text, signals } = motionSignals(slide, index, previous);
  const transition = transitionFor(signals, index);
  const animations = animationFor(manifest, slide, index, previous, signals);
  const signalLabels = Object.entries(signals)
    .filter(([, active]) => active)
    .map(([name]) => name);
  return {
    schemaVersion: NATIVE_MOTION_CONTRACT_VERSION,
    status: "locked",
    mode: "auto",
    source: "content-heuristic",
    selectionBasis: [
      `Signals: ${signalLabels.length ? signalLabels.join(", ") : "calm content"}.`,
      `Matched content: ${text.slice(0, 180) || "none"}.`,
    ],
    transition: {
      effect: transition.effect,
      durationSeconds: transition.durationSeconds,
      advance: "on-click",
      purpose: transition.purpose,
      rationale: transition.rationale,
    },
    animations,
    fallback: "If the host cannot apply the native effect, keep the final visible state and record the loss in the build receipt.",
  };
}

function animationPriority(slide, plan, index) {
  const { signals } = motionSignals(slide, index, null);
  return (slide.visualPlan?.visualPeak ? 10 : 0)
    + (signals.opening ? 8 : 0)
    + (signals.reveal ? 5 : 0)
    + (signals.sequence ? 5 : 0)
    + (signals.comparison ? 4 : 0)
    + (signals.data ? 3 : 0)
    + (plan.animations.length ? 2 : 0);
}

export function applyNativeMotion(manifest, slides) {
  const plans = slides.map((slide, index) => planFor(manifest, slide, index, slides));
  const maxSlides = Number(manifest.motionBudget?.maxNativeAnimatedSlides ?? 6);
  const autoCandidates = plans
    .map((plan, index) => ({ plan, index, slide: slides[index] }))
    .filter(({ plan }) => plan.mode === "auto" && plan.animations.length)
    .sort((a, b) => animationPriority(b.slide, b.plan, b.index) - animationPriority(a.slide, a.plan, a.index) || a.index - b.index);
  const keep = new Set(autoCandidates.slice(0, Number.isInteger(maxSlides) && maxSlides >= 0 ? maxSlides : 6).map((item) => item.index));
  for (const [index, plan] of plans.entries()) {
    if (plan.mode === "auto" && plan.animations.length && !keep.has(index)) {
      plan.animations = [];
      plan.selectionBasis = [...plan.selectionBasis, "Native animation budget kept this slide static while preserving its transition."];
    }
    slides[index].nativeMotion = plan;
  }
  return plans;
}

export function validateNativeMotionPlan(slide, plan, options = {}) {
  const errors = [];
  const location = options.location || `slides.${slide.id}.nativeMotion`;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return [`${location}: nativeMotion must be an object.`];
  if (plan.schemaVersion !== NATIVE_MOTION_CONTRACT_VERSION) errors.push(`${location}: schemaVersion must be ${NATIVE_MOTION_CONTRACT_VERSION}.`);
  if (!new Set(["auto", "specified", "off"]).has(plan.mode)) errors.push(`${location}: mode must be auto, specified, or off.`);
  if (!new Set(["locked"]).has(plan.status)) errors.push(`${location}: status must be locked after creative compilation.`);
  if (!Array.isArray(plan.selectionBasis) || !plan.selectionBasis.length || plan.selectionBasis.some((item) => !nonEmpty(item))) errors.push(`${location}: selectionBasis must contain concrete rationale.`);
  const transition = plan.transition;
  if (!transition || typeof transition !== "object" || Array.isArray(transition)) errors.push(`${location}.transition: transition is required.`);
  else {
    if (!NATIVE_TRANSITIONS.has(transition.effect)) errors.push(`${location}.transition.effect: unsupported native transition.`);
    if (!Number.isFinite(Number(transition.durationSeconds)) || Number(transition.durationSeconds) < 0 || Number(transition.durationSeconds) > 3) errors.push(`${location}.transition.durationSeconds: must be from 0 to 3 seconds.`);
    if (transition.advance !== "on-click") errors.push(`${location}.transition.advance: only on-click is supported by the native contract.`);
    for (const key of ["purpose", "rationale"]) if (!nonEmpty(transition[key])) errors.push(`${location}.transition.${key}: required.`);
  }
  const regions = new Set((slide.pageDesign?.regions || []).map((region) => region.id));
  const animations = Array.isArray(plan.animations) ? plan.animations : [];
  const maxSteps = Number(options.maxSteps ?? 4);
  if (animations.length > maxSteps) errors.push(`${location}.animations: no more than ${maxSteps} native animation steps are allowed.`);
  const ids = new Set();
  for (const [index, animation] of animations.entries()) {
    const itemLocation = `${location}.animations[${index}]`;
    for (const key of ["id", "target", "purpose", "rationale"]) if (!nonEmpty(animation?.[key])) errors.push(`${itemLocation}.${key}: required.`);
    if (ids.has(animation?.id)) errors.push(`${itemLocation}.id: duplicate animation id.`);
    if (animation?.id) ids.add(animation.id);
    if (!regions.has(animation?.target)) errors.push(`${itemLocation}.target: must reference a pageDesign region.`);
    if (!NATIVE_ANIMATION_EFFECTS.has(animation?.effect)) errors.push(`${itemLocation}.effect: unsupported native animation effect.`);
    if (!NATIVE_ANIMATION_PHASES.has(animation?.phase)) errors.push(`${itemLocation}.phase: unsupported animation phase.`);
    if (!NATIVE_ANIMATION_TRIGGERS.has(animation?.trigger)) errors.push(`${itemLocation}.trigger: unsupported animation trigger.`);
    if (!NATIVE_DIRECTIONS.has(animation?.direction)) errors.push(`${itemLocation}.direction: unsupported animation direction.`);
    if (!Number.isFinite(Number(animation?.durationSeconds)) || Number(animation.durationSeconds) <= 0 || Number(animation.durationSeconds) > 3) errors.push(`${itemLocation}.durationSeconds: must be from 0 to 3 seconds.`);
    if (!Number.isFinite(Number(animation?.delaySeconds)) || Number(animation.delaySeconds) < 0 || Number(animation.delaySeconds) > 3) errors.push(`${itemLocation}.delaySeconds: must be from 0 to 3 seconds.`);
  }
  if (!nonEmpty(plan.fallback)) errors.push(`${location}.fallback: required.`);
  return errors;
}

export function buildNativeMotionPlan(manifest, slides, generatedAt, creativeDigest) {
  const plans = slides.map((slide, index) => ({
    order: index + 1,
    slideId: slide.id,
    role: slide.role,
    renderer: slide.renderer,
    claim: slide.claim,
    title: slide.title,
    plan: slide.nativeMotion,
  }));
  const transitions = [...new Set(plans.map((item) => item.plan?.transition?.effect).filter((effect) => effect && effect !== "none"))];
  return {
    schemaVersion: NATIVE_MOTION_CONTRACT_VERSION,
    generatedAt,
    creativeDigest,
    policy: {
      mode: "content-heuristic",
      maxNativeAnimatedSlides: Number(manifest.motionBudget?.maxNativeAnimatedSlides ?? 6),
      maxNativeAnimationStepsPerSlide: Number(manifest.motionBudget?.maxNativeAnimationStepsPerSlide ?? 4),
      transitionStyles: transitions,
      fallback: "static-final-state",
    },
    slides: plans,
  };
}
