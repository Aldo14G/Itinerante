# Gemini Demo Image Specs

Use this file to generate temporary demo images for `#eventos` and `#galeria` without mixing visual styles. These assets are placeholders until real photos are available.

## Global Art Direction

- Style: photoreal editorial photography, independent cultural bookstore, warm community atmosphere, Monterrey-inspired but not literal tourist imagery.
- Palette: teal, amber, paper, and deep ink. Images may include natural wood, paper texture, books, coffee, notebooks, cameras, and soft practical lights.
- Mood: cultured, intimate, active, and human. Avoid glossy corporate stock-photo energy.
- Composition: leave 35-45% quiet negative space for UI overlays. Subjects must not sit under the bottom caption area.
- Do not generate embedded typography, readable book titles, logos, watermarks, dates, posters, QR codes, or fake brand marks.
- People may appear naturally, but avoid close facial portraits unless the person is clearly generic and not celebrity-like.

## Output Contract

- Source generation target: event images `1600x1200` at 4:3, book images `1200x1600` at 3:4, center-safe crop.
- Published site asset: `.webp`, quality 82, max 900px long edge, under 150 KB per file.
- Destination folders: `images/events/` and `images/books/`.
- File names below are canonical. Wire them into `index.html` only after the files exist.

## Gemini Prompt Template

Use this structure for every generation:

```text
Create a photoreal editorial demo image for Libreria Itinerante y Mas, an independent cultural bookstore. Scene: [specific scene]. Visual direction: warm natural light, teal and amber accents, paper texture, deep ink shadows, human and community-centered, premium editorial composition. Leave quiet negative space for a website card overlay. No text in image, no readable titles, no logos, no watermarks.

Negative prompt: fake poster text, readable book covers, brand logos, distorted hands, extra fingers, plastic skin, over-saturated colors, corporate stock photo, neon purple gradients, cluttered background, cropped faces, watermark.
```

## Agenda Cultural Assets

### Escritura Creativa

- File: `images/events/escritura-creativa-demo.webp`
- Scene: small writing workshop table inside a bookstore, notebooks open, fountain pens, marked pages, hands writing, shelves softly out of focus.
- Alt text: `Mesa de taller de escritura con libretas, libros y luz calida.`

### Circulo de Lectura

- File: `images/events/circulo-lectura-demo.webp`
- Scene: small reading circle in a bookstore cafe, people seated with books, warm lamps, mugs, soft teal details, faces secondary.
- Alt text: `Circulo de lectura en libreria con libros, cafe y ambiente comunitario.`

### Teatro Gestual

- File: `images/events/teatro-gestual-demo.webp`
- Scene: intimate rehearsal corner with expressive hands and body movement, neutral masks on a table, bookshelves and amber stage light.
- Alt text: `Ensayo de teatro gestual en espacio cultural con luz escenica.`

### Fotografia Narrativa

- File: `images/events/fotografia-narrativa-demo.webp`
- Scene: camera, printed photos, contact sheets, and people arranging a visual sequence on a table inside the bookstore.
- Alt text: `Taller de fotografia narrativa con camara y fotografias impresas.`

## Book Category Assets

- `images/books/poesia-latinoamericana-demo.webp`: slim poetry books, paper texture, teal cloth, dried flower, quiet contemplative mood.
- `images/books/narrativa-mexicana-demo.webp`: warm novel stack, amber reading lamp, ceramic cup, bookstore shelves in soft focus.
- `images/books/ensayo-contemporaneo-demo.webp`: open books, tabs, notebook, ink pen, composed editorial desk.
- `images/books/cronica-testimonio-demo.webp`: field notebook, city map fragments, newspaper texture, documentary feel.
- `images/books/ficcion-fantasia-demo.webp`: stack of novels with moody teal shadows, subtle bookmark, imaginative but grounded.
- `images/books/historia-mexico-demo.webp`: archival papers, generic old photographs, map texture, sober amber light.
- `images/books/arte-fotografia-demo.webp`: photo monographs, contact sheet, camera lens, clean gallery-like composition.
- `images/books/literatura-infantil-demo.webp`: picture books, colored paper shapes, warm family-friendly table, not cartoonish.

For each book image, keep covers generic and unreadable. Do not invent authors, publishers, or book titles.

## Review Checklist

- Image looks like one visual system with the Itinerante palette.
- No embedded text or fake event information appears.
- Main subject remains clear in mobile crop.
- Overlay area has enough contrast for white or paper text.
- Asset name matches the canonical path exactly.
