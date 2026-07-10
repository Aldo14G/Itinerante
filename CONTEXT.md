# Project Context

## Domain Terms

- **Primary Navbar**: fixed top module for brand identity and the highest-value contact action. It does not own section navigation.
- **Chapter Navigation**: sticky module after the hero. It is the single owner of section links for the page narrative: `Experiencia`, `Agenda`, `Libros`, and `Visita`.
- **Agenda Cultural**: events and workshops section anchored at `#eventos`.
- **Catalog Discovery**: searchable and filterable book discovery section anchored at `#galeria`.
- **Book Image Overlay**: metadata layer inside each real book image. It carries genre, availability, mood, tags, and WhatsApp consultation so cover images never become context-free decoration.

## Architecture Decisions In Force

- Section navigation has one owner: `chapter-nav`.
- The primary navbar remains brand plus WhatsApp only.
- Real book images in `#galeria` must include the Book Image Overlay.
- The site remains static HTML, CSS tokens, local CSS, and vanilla JavaScript until real data needs justify a deeper migration. Tailwind CDN is intentionally not part of the runtime.
