# Web Component Intelligence Adaptation

This blueprint adapts the premium product-page grammar from `web-component-intelligence` to Libreria Itinerante y Mas. It is not a clone of any third-party page. Do not copy proprietary code, media, copy, marks, APIs, or protected assets.

## Architecture Thesis

Itinerante should read as a cultural product with a clear narrative arc, not as a set of unrelated blocks. The page should move through chaptered storytelling:

1. Brand promise: what Itinerante is and why it matters.
2. Transformation: why the visit changes from browsing into staying, asking, and returning.
3. Experience: books, cafe, workshops, and community in one place.
4. Agenda: current cultural activity and reservation path.
5. Catalog: searchable book discovery and WhatsApp consultation.
6. Trust: reviews and community proof.
7. FAQ: practical objections before contacting or visiting.
8. Visit: address, how-it-works, map, and direct contact.

The navigation architecture has one clear seam: the primary navbar handles brand identity and the main contact action; the chapter navigation is the only interface for moving between page sections. Do not duplicate section links in both places.

## Technology Choice

Keep the current stack until a real data source or multi-page app requires migration:

- static HTML served by Firebase Hosting
- CSS custom properties for design tokens
- local CSS for critical layout, type, motion, and section modules
- vanilla JavaScript for discovery, carousel, and lightbox behavior
- Node built-in tests for Harness Engineering

This gives the site premium interaction quality without adding React, Next.js, Tailwind runtime, GSAP, or a build step prematurely.

## Patterns To Adopt

- Primary navbar with brand identity and one high-value WhatsApp action.
- Sticky chapter navigation after the hero as the only section-navigation module.
- Media-led or visual-first sections with sparse copy.
- A cinematic hero image or illustration may be generated for the project when it is original, locally saved, text-free, and aligned to the Itinerante tokens.
- One primary action per module.
- Compact trust and specs-style proof, not generic marketing claims.
- FAQ and how-it-works modules should answer practical visit/catalog/agenda questions, not generic marketing objections.
- Motion grammar based on opacity, transform, and short timing budgets.
- Reduced-motion fallback before adding larger animation systems.

## Patterns To Avoid

- Do not duplicate section navigation in the primary navbar and chapter nav.
- Do not copy proprietary source code or visual assets from reference sites.
- Do not invent stock, prices, ISBNs, schedules, or delivery promises.
- Do not introduce new colors outside the Itinerante token system.
- Do not reintroduce Tailwind CDN for a handful of utility classes; keep critical styles local unless a real build pipeline is justified.
- Do not add external APIs until inventory, events, or booking data is real.
- Do not make every section a floating card; keep a clear page rhythm.

## Implementation Order

1. Keep the primary navbar focused on identity plus WhatsApp.
2. Keep chapter navigation as the single owner of section anchors.
3. Upgrade `#eventos` into the image-first carousel described in `docs/events-section-redesign-spec.md`.
4. Replace gradient placeholders with Gemini demo assets once local files exist.
5. Add FAQ or visit-specs only after the core agenda and catalog hierarchy is stable.
6. Re-run the web-component-intelligence analyzer after each architectural slice.
