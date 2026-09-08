# Repository Guidelines

## Project Structure & Module Organization

This repository is a static Firebase Hosting site for Libreria Itinerante y Mas. The main application lives in `index.html`; its canonical composition is the adapted Higgsfield `d599d36a` model. Local styles and behavior live in `assets/css/higgsfield-site.css` and `assets/js/higgsfield-site.js`. The previous mixed model is read-only history under `_archive/models/`. Static assets are stored at the repository root; `Logo.png` is the favicon and `Logo.webp` is the lightweight visible brand image. Firebase config is in `firebase.json` and `.firebaserc`. Harness docs live in `docs/`, design rules in `design-system/`, and regression checks in `tests/`.

Avoid generated build output in the root. Keep reusable styles and scripts under `assets/`; do not resume UI work in the archived mixed model.

## Build, Test, and Development Commands

- `firebase emulators:start --only hosting`: serves the site locally through Firebase Hosting behavior.
- `firebase deploy --only hosting`: deploys the static site to the configured `itinerante-e428c` project.
- `npm run preview`: serves the static site at `http://127.0.0.1:8080/`.
- `npm test`: runs the Harness Engineering regression checks.

There is no build step at present. `index.html` is served directly.

## Coding Style & Naming Conventions

Use 2-space indentation for HTML, CSS, and JavaScript. Keep copy in Spanish unless a section is intentionally bilingual. Prefer semantic sections with descriptive `id` values such as `#eventos`, `#contacto`, or `#catalogo`.

CSS custom properties belong in `:root`; reuse the Higgsfield turquoise, ink, paper, and coral variables before adding colors. Keep critical layout, spacing, typography, and state styles in local CSS; do not reintroduce Tailwind CDN or Higgsfield SDK dependencies.

Before UI changes, read `design-system/libreria-itinerante-y-mas/MASTER.md` and then `design-system/libreria-itinerante-y-mas/pages/home.md` for landing-specific rules.

## Testing Guidelines

Node's built-in test runner powers the Harness Engineering checks in `tests/site.test.mjs`. Before deployment, run `npm test` and manually verify:

- Desktop and mobile layouts render correctly.
- Navigation anchors scroll to the intended sections.
- Images load from local paths allowed by the CSP.
- Browser console has no errors.
- Firebase headers and CSP do not block required assets.

Use Lighthouse or browser accessibility checks for major visual changes.

## Commit & Pull Request Guidelines

This folder does not currently contain Git history, so use clear imperative commits such as `Update contact section` or `Tighten Firebase security headers`. Pull requests should include a short description, screenshots for visual changes, test notes, and any Firebase configuration impact.

## Security & Configuration Tips

Do not expose service-account credentials in public hosting. `firebase.json` already ignores `*.json` during deploy; keep credentials out of screenshots, issues, and client-side code.
