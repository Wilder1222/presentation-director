# Native PowerPoint Motion Contract

Manifest 1.7 automatically compiles a native motion plan for every slide. The plan is a small, renderer-neutral instruction set for the presentation provider: it names a PowerPoint transition, object-level effects, semantic page-region targets, timing, trigger order, purpose, and fallback behavior.

The contract is deliberately separate from `motion`. `motion` describes HyperFrames or Remotion media; `nativeMotion` describes effects that remain inside the PPTX and can be edited or removed in PowerPoint.

## Selection behavior

When a slide does not provide a `nativeMotion` override, the Director selects a plan from the slide's role, title, claim, content keys, visual peak, focal mode, and continuity with the previous slide:

- Opening, section, and calm statement slides use a restrained `fade` transition.
- Before/after, comparison, option, and trade-off slides use `morph` when semantic regions are shared with the previous slide; otherwise they fall back to `fade`.
- Architecture, process, workflow, roadmap, timeline, data, and metric slides reveal the title first and then `wipe` the primary diagram or evidence region from the left.
- Product, hero, reveal, demo, and visual-peak slides reveal the title first and then the primary visual with a restrained `fade`.
- Image and video slides receive the deck transition but do not pretend that flattened media has editable internal objects.

The selector records its signals and rationale in `selectionBasis`; it never chooses an effect only because it looks decorative. A deck-wide budget caps animated slides and animation steps per slide. The default budget is six animated slides, four steps per slide, and two transition families.

## Manifest shape

```json
{
  "nativeMotion": {
    "schemaVersion": "1.0",
    "status": "locked",
    "mode": "auto",
    "source": "content-heuristic",
    "selectionBasis": [
      "Signals: sequence, data.",
      "Matched content: architecture runtime data flow."
    ],
    "transition": {
      "effect": "fade",
      "durationSeconds": 0.55,
      "advance": "on-click",
      "purpose": "Move to the next claim without competing with the slide content.",
      "rationale": "Fade is the safest native transition when spatial continuity is not required."
    },
    "animations": [
      {
        "id": "s04-takeaway-entrance-1",
        "target": "takeaway",
        "targetType": "page-region",
        "effect": "fade",
        "phase": "entrance",
        "trigger": "with-previous",
        "durationSeconds": 0.4,
        "delaySeconds": 0,
        "direction": "none",
        "purpose": "Let the audience read the takeaway before the supporting detail arrives.",
        "rationale": "Every editable slide gets one quiet title entrance to establish reading order."
      }
    ],
    "fallback": "If the host cannot apply the native effect, keep the final visible state and record the loss in the build receipt."
  }
}
```

Supported native transitions are `none`, `fade`, and `morph`. Supported object effects are `appear`, `fade`, `wipe`, `float-in`, `zoom`, and `grow-shrink`. Direction is explicit and limited to `from-left`, `from-right`, `from-top`, `from-bottom`, or `none`.

## Provider responsibilities

The presentation provider reads `tmp/motion/native-motion-plan.json` and the per-slide `nativeMotion` section in each provider brief. It must:

1. Build the complete static slide first.
2. Map each `target` to the corresponding page-design region and native PowerPoint object(s).
3. Apply the declared transition and object effects with the declared trigger order and duration.
4. Preserve the final visible state when animation is disabled or unsupported.
5. Write a Manifest 1.7 build receipt containing `nativeMotion.status`, the exact `planHash`, `transitionApplied`, every `appliedAnimationIds` value, and concrete `losses` when a fallback occurs.

The final opened PPTX audit repeats those fields. The native-capability report exposes motion fallbacks and any changes introduced during final assembly.

## Explicit overrides

Use `"mode": "off"` for a deliberately static slide. Use `"mode": "specified"` only when a human or a supplied template requires a known effect sequence. Specified plans are validated against the same effect, target, duration, and budget rules as automatically selected plans.

Do not use native animation for perpetual motion, decorative particles, random fly-ins, bounce/elastic novelty, or any effect that does not clarify sequence, state change, product use, or a meaningful reveal.
