# Home Page Override

Applies to `index.html`, the current one-page site.

## Section Order

1. Hero: brand, promise, primary CTA, WhatsApp CTA.
2. Chapter navigation: sticky narrative spine for the long page.
3. Transformation: compact promise that explains why the place matters.
4. Experience: books, cafe, workshops/events.
5. Events: horizontal cultural rail.
6. Catalog: book categories and Instagram CTA.
7. Reviews: community proof.
8. FAQ: common visit, catalog, and agenda questions.
9. Location: address, how-it-works, and map/WhatsApp actions.
10. Footer: compact brand and social links.

## Home Page Rules

- Keep the hero as the strongest first-viewport brand signal.
- The hero uses the official logo with the animated border treatment. Do not replace the first viewport brand mark with generated imagery unless there is a real, approved photo direction.
- Keep `#experiencia`, `#eventos`, `#galeria`, and `#ubicacion` as stable chapter anchors.
- Events should not invent exact dates. Use status labels until real schedules are provided.
- Transformation and FAQ are supporting chapters; do not add them to the chapter nav unless the page becomes much longer.
- Prefer real photos for future event cards. Until then, use demo assets generated from `docs/gemini-demo-image-specs.md` or controlled gradient cards from the brand palette.
- Do not add another full-width dark section directly after Events; follow with paper or soft paper.

## Premium Page Architecture

- Use `docs/premium-site-architecture.md` as the reference for adapting `web-component-intelligence` patterns.
- The chapter nav should make the page feel like a guided cultural product, not a generic one-page scroll.
- Do not duplicate `#experiencia`, `#eventos`, `#galeria`, or `#ubicacion` in the primary navbar. The top navbar is brand plus WhatsApp only.
- Do not introduce React, Next.js, GSAP, or external animation libraries until there is a real product need and a matching harness update.

## Agenda Cultural Carousel

- Treat `#eventos` as an image-first cultural rail, not a paragraph-heavy card grid.
- Keep event card copy compact: title, one-sentence summary, up to three chips, and one CTA.
- Use the `800ms transition` rule for panel movement only. Autoplay should use `4.8s dwell`, pause on user interaction, and stop under `prefers-reduced-motion`.
- The right fade belongs to the rail edge. It must not cover heading text, card captions, or CTAs.
- Use `docs/events-section-redesign-spec.md` as the implementation brief before changing the Agenda cultural UI.

## Catalog Discovery

- Treat `#galeria` as a discovery surface: search first, filter second, grid third.
- Keep filters as compact chips with clear active state and `aria-pressed`.
- Book cards should expose genre, availability, reading mood, short tags, and one WhatsApp CTA.
- Real book images must keep the same metadata inside the cover area through a readable editorial overlay.
- Do not invent prices, ISBNs, stock counts, rankings, or delivery promises until real inventory data exists.
- If the catalog becomes dynamic, preserve the current no-build fallback and add harness checks before introducing external APIs.
