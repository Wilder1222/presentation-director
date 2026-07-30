# Presentation Design Contract

## Identity

- Status: planning
- Style name: neutral-editorial
- Primary reference: user-template-or-neutral
- Secondary references: none
- Communication tone: clear, restrained, evidence-led

## Colors

- Canvas: `#F4F2ED`
- Primary text: `#171717`
- Secondary text: `#5C5C58`
- Accent: `#4F46E5`
- Hairline: `#D6D2C8`

Use the accent on no more than 10% of a typical slide. A user template overrides this palette.

## Typography

- Display: use the supplied template font; otherwise use Aptos Display or a locally available humanist sans.
- Body: use the supplied template font; otherwise use Aptos or Arial.
- Minimum sizes without a template: 50 pt deck title, 35 pt slide title, 24 pt subhead, 16 pt body.
- Keep intended one-line titles on one line.

## Layout

- Canvas: 16:9
- Safe margins: equal left and right margins, at least 5% of slide width.
- Density: low to medium.
- Default composition: one dominant visual relationship, not a grid of UI cards.
- Vary adjacent silhouettes while preserving the same grid and hierarchy.

## Motion

- Tempo: restrained.
- Preferred: dissolve, masked reveal, progressive build, continuous spatial change.
- Budget: at most 3 video slides, 45 total seconds, and 2 transition styles.
- Build every static hero frame before animating it.

## 3D Direction

- Enabled: no; use only when depth, camera position, or object assembly explains the claim.
- Focal object and hero angle: none by default.
- Camera: restrained field of view, a stable target, and manifest-defined anchors.
- Materials and lighting: inherit the deck palette and prioritize form readability over spectacle.
- Depth and overlays: reserve slide-safe negative space for native titles and labels.
- Performance: local GLB/glTF assets, capped pixel ratio, limited postprocessing, and a static poster fallback.
- Determinism: all Remotion 3D animation derives from `useCurrentFrame()` and manifest inputs.

## Do Not

- Do not use generic blue gradients, glassmorphism, neon circuitry, or decorative icon grids by default.
- Do not use image generation for exact diagrams, charts, tables, or UI copy.
- Do not animate every slide.
- Do not mix multiple company palettes.
- Do not expose production notes as visible slide copy.

## Rights

- Treat named-company references as internal design analysis only.
- Use `*-inspired` labels and abstract principles rather than copying protected assets.
- Use company logos, proprietary imagery, or proprietary fonts only when the user supplies them with appropriate rights.
