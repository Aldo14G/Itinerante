# Agenda Cultural Continuation Instructions

Use these instructions to continue the next proposed slice: modernize `#eventos` into an image-first cultural carousel using the existing Harness Engineering workflow.

## Objective

Turn "Agenda cultural - Talleres, lecturas y escena viva" into a premium discovery module for workshops and events. It should feel cinematic, calm, local, and editorial. Reduce text density, fix the right fade, and introduce carousel behavior without making the page feel slow.

## Required Context

Read these files before editing:

1. `AGENTS.md`
2. `design-system/libreria-itinerante-y-mas/MASTER.md`
3. `design-system/libreria-itinerante-y-mas/pages/home.md`
4. `docs/events-section-redesign-spec.md`
5. `docs/gemini-demo-image-specs.md`
6. `docs/harness-engineering.md`
7. `tests/site.test.mjs`

Recommended skills for the next agent:

- `$web-component-intelligence`: use for component inventory and premium carousel behavior.
- `$design-system`: preserve Itinerante tokens and component rules.
- `$ui-styling`: refine responsive layout, focus states, controls, and visual hierarchy.
- `$tdd`: add the harness check before changing behavior.

## Gemini Asset Step

Generate the four event demo images from `docs/gemini-demo-image-specs.md`:

- `images/events/escritura-creativa-demo.webp`
- `images/events/circulo-lectura-demo.webp`
- `images/events/teatro-gestual-demo.webp`
- `images/events/fotografia-narrativa-demo.webp`

Use the exact canonical paths. Do not wire image paths into `index.html` until the files exist locally. Images must contain no embedded text, logos, fake posters, dates, QR codes, or readable book covers.

## Implementation Slice

1. Add a failing harness test in `tests/site.test.mjs` for the new event carousel contract.
2. Refactor `#eventos` markup into a carousel region:
   - `role="region"` with a clear `aria-label`.
   - Semantic list or grouped slides.
   - Previous, next, and dot controls with accessible labels.
   - One WhatsApp CTA per card.
3. Compress event copy:
   - Title: two short lines maximum.
   - Summary: max 110 characters.
   - Meta: up to three chips.
4. Replace gradient-only cards with image-first cards when demo assets exist.
5. Keep a token-based gradient fallback for missing images.
6. Fix the right fade:
   - Fade belongs only to the rail edge.
   - Desktop width: `48px`.
   - Mobile width: `28px`.
   - Use `pointer-events: none`.
   - Use `var(--color-hero)`, not hardcoded hex.
7. Add carousel behavior:
   - `800ms transition` for panel movement.
   - `4.8s dwell` for autoplay cadence.
   - Pause on hover, focus, pointerdown, touch drag, and hidden tab.
   - Disable autoplay under `prefers-reduced-motion: reduce`.
   - Manual controls must always work.

## Suggested Harness Checks

Add or extend tests for:

- `#eventos` has `role="region"` and carousel controls.
- Controls have labels: `Evento anterior`, `Siguiente evento`, `Ir al evento 1`.
- Event cards use compact content fields and no long paragraph blocks.
- Motion constants include `800` and `4800`.
- Reduced motion disables autoplay logic.
- Right fade CSS uses `pointer-events: none` and `var(--color-hero)`.
- Local assets exist only after they are referenced.

## Visual QA

Run:

```powershell
npm.cmd test
```

Then verify in Chrome or the in-app browser:

- Desktop: `1366x900`, carousel text does not sit under the fade.
- Mobile: `390x844`, one card is readable, controls fit, no horizontal page overflow.
- Search/catalog section still works after editing event scripts.
- Browser console has no JavaScript errors.

## Do Not Do

- Do not use `0.8s` as autoplay interval.
- Do not add fake dates, prices, schedules, or stock claims.
- Do not introduce purple, neon blue, magenta, or unrelated gradients.
- Do not depend on external images, APIs, or new build tooling for this slice.
- Do not remove the existing `#eventos`, `#galeria`, or `#ubicacion` anchors.

## Ready Prompt For The Next Codex Turn

```text
Continue the Agenda cultural modernization for Libreria Itinerante y Mas.
Use AGENTS.md, the Itinerante design system, docs/events-section-redesign-spec.md,
docs/gemini-demo-image-specs.md, and this continuation file.

Implement the next vertical slice with TDD:
1. Add a failing harness test for the image-first event carousel.
2. Refactor #eventos into an accessible carousel region with compact cards.
3. Use 800ms transition and 4.8s dwell, pausing on interaction and reduced motion.
4. Keep token-based colors and a gradient fallback if demo images are not present.
5. Run npm.cmd test and verify desktop/mobile layout.
```
