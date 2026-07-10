# Harness Engineering

Harness Engineering is the safety protocol for improving this static site without guessing. Every UX/UI or architecture change should move through the same loop: capture the current invariant, make one narrow change, then verify the invariant still holds.

## Current Harness

- `npm test` and `npm run harness` run Node's built-in test runner.
- `tests/site.test.mjs` verifies page metadata, critical sections, contact actions, local assets, inline script syntax, CSP, external link safety, Firebase Hosting security headers, design-system presence, event-section coherence, navigation order, and motion budgets.
- The harness has no third-party dependencies, so it can run on any machine with Node 22+.

## Guardrails

- **Motion budget:** anchor navigation must not use global smooth scrolling. Reveals, event cards, book cards, event CTA details, dots, and section transitions must stay inside their timing budgets.
- **Ambient animation:** long-running animation is allowed only on decorative selectors such as logo draw, scroll hint, logo frame, and WhatsApp pulse. Reduced motion must collapse animation and transition durations.
- **Navigation contract:** the chapter nav must match page flow: `Experiencia -> Agenda -> Libros -> Visita`.
- **Design source of truth:** `design-system/libreria-itinerante-y-mas/MASTER.md` and `pages/home.md` must exist and remain aligned with Itinerante tokens.
- **Premium architecture contract:** `docs/premium-site-architecture.md` maps `web-component-intelligence` patterns to Itinerante, including the sticky chapter nav and no-premature-framework rule.
- **No Tailwind runtime:** critical hero layout and type must be owned by local CSS, and `cdn.tailwindcss.com` must not appear in `index.html` or CSP.
- **Single navigation owner:** the primary navbar owns identity plus WhatsApp only. `chapter-nav` is the only module that owns section links.
- **Events contract:** `#eventos` must keep semantic list roles, token-based colors, 44px CTA touch targets, scroll hint, and on-brand gradients.
- **Agenda redesign contract:** `docs/events-section-redesign-spec.md` defines the next image-first carousel. `800ms` is the panel transition duration, while autoplay must dwell for `4.8s`, pause on user interaction, and respect reduced motion.
- **Agenda continuation brief:** `docs/agenda-cultural-continuation-instructions.md` is the handoff checklist for the next Codex/Gemini slice.
- **Gemini asset contract:** `docs/gemini-demo-image-specs.md` defines demo image prompts, canonical paths, negative prompts, and alt text for event and book assets.
- **Asset weight budget:** generated `.webp` files must be real WebP content, stay under 150 KB each, and stay under 1.4 MB total for current event/catalog demo images.
- **Book discovery contract:** `#galeria` must keep search, filter chips, result count, empty state, enriched book metadata, image overlays, and WhatsApp consultation actions. Real cover images must still expose genre, availability, mood, tags, and CTA inside the card. This is the current competitive layer inspired by modern book discovery surfaces.
- **Component intelligence evidence:** `web-intel/itinerante/2026-07-05/analysis.md` stores the static component evidence for the current page.

## Change Protocol

1. Name the user-facing behavior being improved.
2. Add or update a harness check for what must not break.
3. Make the smallest architectural or visual change that delivers the behavior.
4. Run `npm.cmd test` on Windows or `npm test` where npm scripts are executable.
5. For visual changes, inspect desktop and mobile layouts before deploying.
6. If a change intentionally violates a guardrail, update the design standard and harness in the same slice.

## Next Deepening Candidates

- Extract design tokens and repeated section spacing from inline styles into one style module inside `index.html`.
- Move catalog data behind a small `BOOKS` data interface that keeps rendering logic local.
- Replace inline hover handlers with class-based states so interaction behavior has one place to live.
- Add a browser-backed visual smoke command for desktop and mobile overflow checks when the environment supports it.
- Replace fragile regex checks with DOM/CSS parsers if the project migrates to React, TypeScript, or a build-time Tailwind pipeline.
- Keep generated assets inside the page weight budget before wiring them into `index.html`.
- Upgrade the book discovery console into real inventory search only after there is a trusted data source for titles, prices, ISBNs, and availability.
