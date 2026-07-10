# Libreria Itinerante Design Standard

> Source of truth: before changing UI, read this file. Then check `design-system/libreria-itinerante-y-mas/pages/[page].md`; page rules override only where they are more specific.

## Product Positioning

Libreria Itinerante y Mas is an independent cultural bookstore in Monterrey. The interface must feel editorial, warm, community-led, and practical. Avoid mixing unrelated AI-generated looks. Every section should feel like part of one cultural house: books, cafe, workshops, events, reviews, and location.

## Design Decision Rules

| Situation | Pattern | Avoid |
|-----------|---------|-------|
| Primary brand moment | Editorial hero with logo/photo asset | Abstract gradients with no real brand signal |
| Repeated cultural offerings | Horizontal rail with scroll-snap cards | Dense grids that feel like admin dashboards |
| Community proof | Reviews, ratings, event participation cues | Generic marketing claims |
| Calls to action | One primary action plus one contextual secondary | Three or more equal CTAs |
| New colors | Extend token layers first | One-off hex values inside sections |
| Animation | 180-300ms ease, opacity, lift, subtle scale | Slow effects, jitter, layout-shifting hovers |

## Token Architecture

Use three layers: primitive tokens, semantic tokens, then component tokens. In `index.html`, current variables live in `:root`; future work should move toward this naming without changing everything at once.

### Primitive Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--it-teal-400` | `#5DC4B4` | Brand bright |
| `--it-teal-600` | `#2A8F84` | Brand action |
| `--it-teal-900` | `#0D4A45` | Brand hero |
| `--it-amber-500` | `#E8A020` | Warm accent |
| `--it-paper-50` | `#FDFCF8` | Main paper |
| `--it-paper-100` | `#F0EDE4` | Alternating band |
| `--it-ink-900` | `#0D2520` | Primary text |

### Semantic Tokens

| Token | Maps To | Usage |
|-------|---------|-------|
| `--color-brand` | `--it-teal-400` | Main brand actions |
| `--color-brand-strong` | `--it-teal-600` | Hover, active, nav |
| `--color-hero` | `--it-teal-900` | Dark editorial surfaces |
| `--color-accent` | `--it-amber-500` | Ratings, highlights |
| `--surface-paper` | `--it-paper-50` | Body background |
| `--surface-soft` | `--it-paper-100` | Section contrast |
| `--text-primary` | `--it-ink-900` | Readable copy |

## Typography

Use `Playfair Display` for editorial headings and `Inter` for navigation, body, controls, and metadata. Do not introduce new font families without updating this file. Headings should be expressive; controls should be quiet and legible.

## Component Standards

### Navigation

Fixed top nav, paper backdrop, small logo, and one primary WhatsApp action. It must not duplicate section links from the chapter nav. Do not add large dropdowns or marketing-style nav.

### Chapter Navigation

Use a sticky chapter nav after the hero when the page needs premium long-form hierarchy. It is the single owner of section navigation: `Experiencia`, `Agenda`, `Libros`, and `Visita`. Keep it compact, horizontally scrollable on mobile, token-based, and below the fixed primary nav.

### Buttons

Primary buttons use filled paper or brand teal depending on surface. Secondary buttons use a clear border. Button hovers may lift up to `2px`; they must not resize siblings.

### Event Cards

Use horizontal rail cards with scroll-snap, dark editorial overlays, status pills, concise copy, and one CTA. Cards may use scale up to `1.025` on hover because the rail has overflow space. Keep text scannable: title, one sentence, metadata, CTA.

### Catalog Discovery

Book browsing should feel curated and searchable, not like a static poster grid. Use a compact search control, filter chips, a result count, and book cards with genre, availability, mood, tags, and one WhatsApp consultation CTA. When a card uses a real cover image, keep that metadata inside the cover through a readable dark editorial overlay. Keep the language editorial and local; avoid mimicking mass-market pricing or fake inventory precision.

### Content Bands

Alternate paper, white, dark teal, and soft paper bands. Avoid nested cards inside cards. Section padding should sit in the 56-86px range on desktop and 48-66px on mobile.

## Motion

Default transitions: `200ms` for color and focus, `300-450ms` for cards. Use `cubic-bezier(.2,.8,.2,1)` for premium lift. Add `prefers-reduced-motion` support before introducing larger animated systems.

## Accessibility

Maintain contrast for text on dark teal and paper surfaces. Interactive elements need semantic tags, visible focus, and at least 44px touch target height. Never use emoji as structural icons.

## AI Contributor Rules

Before changing UI:
1. Name the page and pattern being changed.
2. Check this design standard and page override.
3. Reuse existing tokens/classes first.
4. Add or update a harness test for critical structure.
5. Run `npm.cmd test`.

If a recommendation from `ui-ux-pro-max` conflicts with the brand tokens above, keep the Itinerante tokens and record the reason here before changing them.
