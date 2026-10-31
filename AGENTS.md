# Repository Guidelines

## Project Structure & Module Organization

This repository is the static site for Libreria Itinerante y Mas plus a small API. **Cloudflare is the deploy target**: `wrangler.jsonc` serves `public/` as Workers Static Assets and runs `worker/index.ts` only for `/api/*` (`/api/catalog`, `/api/ai/iti-ia`). Vercel (`vercel.json`, `src/app/api/*`) and Firebase Hosting (`firebase.json`) are legacy and kept only until Cloudflare is validated in production; the Next routes duplicate the Worker and will be deleted afterwards. The main application lives in `index.html`; its canonical composition is the adapted Higgsfield `d599d36a` model. Local styles and behavior live in `assets/css/higgsfield-site.css` and `assets/js/higgsfield-site.js`. The previous mixed model is read-only history under `_archive/models/`. Static assets are stored at the repository root; `Logo.png` is the favicon and `Logo.webp` is the lightweight visible brand image. Firebase config is in `firebase.json` and `.firebaserc`. Harness docs live in `docs/`, design rules in `design-system/`, and regression checks in `tests/`.

Avoid generated build output in the root. Keep reusable styles and scripts under `assets/`; do not resume UI work in the archived mixed model.

## Build, Test, and Development Commands

- `firebase emulators:start --only hosting`: serves the site locally through Firebase Hosting behavior.
- `npm run cf:dev`: builds `public/` (allow-list: index.html, assets/, images/, logos, `_headers`) and serves site + API with `wrangler dev`.
- `npm run cf:deploy`: builds `public/` and runs `wrangler deploy`. Optional secret: `npx wrangler secret put GEMINI_API_KEY` (without it Iti IA answers with the local ranking).
- Legacy: `firebase deploy --only hosting` publishes the same `public/` with no API.
- Iti IA protection (Worker): Origin and body-size check from `src/lib/api-guard.ts` (`ITI_IA_ALLOWED_ORIGINS`, `ITI_IA_MAX_BODY_BYTES`) plus Cloudflare Rate Limiting bindings `IA_PER_IP` (10/min) and `IA_GLOBAL` (120/min), enforced per Cloudflare location, not as a strict global cap. The Next route keeps the in-memory limiter.
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
