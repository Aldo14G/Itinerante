# Agenda Cultural Redesign Spec

This spec defines the next redesign for `#eventos`, titled "Agenda cultural - Talleres, lecturas y escena viva." The goal is to reduce text density, fix the right fade alignment, and introduce a cinematic rail inspired by streaming panels while keeping the Itinerante design system intact.

## Product Goal

Users should understand the cultural offer in under five seconds: what activity exists, what mood it has, and how to reserve. The section must feel active and editorial, not like a text-heavy notice board.

## Content Model

Each event card should use this compact structure:

- `title`: max 42 characters or two short lines.
- `type`: one label such as `Taller`, `Lectura`, `Escena`, or `Foto`.
- `status`: one short phrase, for example `Cupo por confirmar`.
- `summary`: one sentence, max 110 characters.
- `meta`: up to three chips: `Presencial`, `Comunidad`, `WhatsApp`.
- `image`: one demo image from `docs/gemini-demo-image-specs.md`.
- `cta`: short action, preferably `Reservar`.

Move long explanatory copy out of cards. Keep the section intro to one headline and one compact supporting sentence.

## Layout Direction

- Use an image-first horizontal carousel with scroll snap.
- Card ratio: 4:3 image area with a bottom overlay for title, summary, chips, and CTA.
- Desktop card width: `min(420px, 82vw)`. Mobile width: `84vw`.
- Keep one primary CTA per card and avoid secondary links inside the card.
- The right fade belongs to the scroll container only. It must not cover the heading, CTA, or active card text.
- Fade width: `48px` desktop, `28px` mobile. Use `pointer-events: none`.
- The fade should blend from transparent into `var(--color-hero)` or the section background token, not a hardcoded hex.

## Carousel Motion

Use `800ms transition` for panel movement and opacity, not for autoplay frequency. The recommended automatic cadence is `4.8s dwell` per card.

- Auto-advance only after the user has not interacted.
- Pause on hover, focus, pointerdown, touch drag, or when the tab is hidden.
- Disable auto-advance under `prefers-reduced-motion: reduce`.
- Manual arrows and dots must remain available even when autoplay is disabled.
- Use transform and opacity only. Do not animate layout, width, height, or scroll-padding.
- Interaction hover/focus transitions should stay in the existing 180-300ms budget.

## Visual Treatment

- Images carry the primary emotion; text is the caption layer.
- Overlay: deep ink/teal gradient from bottom to transparent, no heavy opaque block.
- Text contrast must pass on image backgrounds. Add a local text shadow only if needed.
- Use `--it-amber-500` for small emphasis, `--it-teal-400` for active states, and paper tones for readable text.
- Do not introduce purple, magenta, neon blue, or unrelated gradients.

## Accessibility

- Carousel wrapper: `role="region"` with an `aria-label` that names the agenda.
- Rail items: semantic list structure or equivalent grouped slides.
- Controls: buttons with labels such as `Evento anterior`, `Siguiente evento`, and `Ir al evento 2`.
- Touch targets: minimum `44px`.
- Do not announce every autoplay move with `aria-live`; only announce manual changes if needed.

## Acceptance Criteria

- The first event card is understandable without reading a paragraph.
- Right fade is visually aligned with the rail edge on desktop and mobile.
- Autoplay feels calm: `800ms transition`, `4.8s dwell`, and pauses on user interaction.
- Reduced motion users receive a static, manually controlled rail.
- All colors come from the Itinerante token system.
- Harness tests cover the spec before implementation.
