# Cirugía de Layout: curaclimate.com → Itinerante — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o superpowers:executing-plans para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Trasplantar los 3 patrones de composición que curaclimate.com tiene y que a Itinerante le faltan —grid de aliados, grid de prensa, y banda CTA/boletín— al `index.html` estático, usando 100% los tokens, tipografía y tono editorial ya existentes de Itinerante.

**Architecture:** Sitio estático de un solo `index.html` con `<style>` inline y JS vanilla. Cada sección nueva se construye como un *partial* aislado (fragmento HTML + CSS con scope) en su propio git worktree por un agente en paralelo; el orquestador integra los partials secuencialmente en `index.html` y corre el harness. Sin React, sin build, sin Tailwind.

**Tech Stack:** HTML5 semántico, CSS con custom properties (`--it-*`/`--brand`), JavaScript vanilla, harness `node --test tests/*.test.mjs`. Fuentes: Playfair Display (headings) + Inter (cuerpo), ya cargadas.

---

## 1. Realidad verificada del proyecto (NO negociable)

Confirmado leyendo los archivos fuente:

- `package.json` → `"itinerante-static-site"`. Scripts: `preview` (server estático), `test`/`harness` (`node --test tests/*.test.mjs`). **No hay build.**
- `CONTEXT.md` → *"static HTML, CSS tokens, local CSS, and vanilla JavaScript... Tailwind CDN is intentionally not part of the runtime."*
- `index.html` ya define todos los tokens en `:root` (`--brand`, `--brand-dark`, `--brand-hero`, `--amber`, `--paper`, y el puente `--it-teal-400/600/900`, `--it-amber-500`, `--it-paper-50/100`, `--it-ink-900`).
- `MASTER.md` → navbar = marca + WhatsApp únicamente; `chapter-nav` es el **único dueño** de la navegación por secciones (`Experiencia`, `Agenda`, `Libros`, `Visita`); bandas alternadas paper/white/dark-teal/soft; motion 200ms color / 300-450ms cards; `cubic-bezier(.2,.8,.2,1)`; contraste WCAG, targets 44px, sin emojis estructurales.

### Constraints duras que cambian el diseño

1. **CSP requiere ajuste quirúrgico para el signup real.** El `<meta http-equiv="Content-Security-Policy">` actual incluye `form-action 'none'` y `connect-src 'none'`. **Decisión del usuario (2026-07-09): signup REAL.** → El Boletín es un `<form>` manejado 100% por JS (`preventDefault` + `fetch` a la REST API de Firestore). Cambio mínimo de CSP: `connect-src 'none'` → `connect-src https://firestore.googleapis.com`. `form-action 'none'` se queda (no hay envío nativo; es defensa en profundidad). Proyecto Firebase: `libreria-itineranteymas` (confirmado en `.firebaserc`).
2. **CSP restringe imágenes a `'self' data: blob:`.** → Los logos de aliados y las imágenes de prensa deben ser **archivos locales en `images/`** o **SVG inline / data URI**. URLs de logos externos serían bloqueadas.
3. **El harness valida presupuestos de motion.** Toda transición nueva debe respetar 200ms (color) / ≤450ms (cards). El test `assertMotionBudget` fallará si se excede.
4. **Todos los assets deben ser locales** (el test `localAssetValues()` verifica que no haya rutas externas fuera de las permitidas).

---

## 2. Decisión de alcance

Itinerante ya tiene: hero, `#experiencia` (3 columnas), `#eventos` (rail), `#galeria` (catálogo con búsqueda), `trust-section` (reseñas), `faq-section`, `#ubicacion`, `site-footer`. Clonar el layout completo de curaclimate **duplicaría** estas secciones y rompería la regla de "una sola casa cultural".

**Alcance recomendado (este plan):** las 3 secciones genuinamente nuevas, mapeadas al mundo de la librería cultural:

| Sección curaclimate | → Sección Itinerante | Valor nuevo |
|---|---|---|
| "THE CURA ECOSYSTEM" — grid de 8 logos de partners | **Aliados & Comunidad** — grid de editoriales, cafés, colectivos, bibliotecas | Prueba de comunidad/ecosistema local |
| Grid de 4 cards de prensa/noticias | **En los Medios / Prensa** — grid de menciones, reseñas destacadas, notas | Credibilidad editorial |
| Banda CTA + newsletter | **Boletín Cultural** — banda CTA con WhatsApp/mailto (CSP-safe) | Captura de comunidad recurrente |

**Opcional (no en este plan salvo que lo pidas):** enriquecer el hero con un *stat callout* estilo curaclimate ("X años · Y libros · Z talleres"). Se puede añadir como Agente D si quieres ir más amplio.

---

## 3. Estructura de archivos

Cada agente produce, en su worktree, un partial autocontenido que el orquestador integra:

```
docs/superpowers/partials/          (staging, temporal, ignorado en integración)
├── aliados/
│   ├── aliados.section.html         # <section> completa
│   ├── aliados.styles.css           # bloque CSS (se pega dentro del <style> de index.html)
│   └── aliados.notes.md             # anclas de inserción + assets requeridos
├── prensa/
│   ├── prensa.section.html
│   ├── prensa.styles.css
│   └── prensa.notes.md
└── boletin/
    ├── boletin.section.html
    ├── boletin.styles.css
    └── boletin.notes.md

index.html                           # el orquestador integra aquí (secuencial)
tests/site.test.mjs                  # el orquestador añade asserts por sección
images/aliados/*                     # logos locales (SVG/PNG) que cada agente especifica
```

**Puntos de inserción en `index.html` (anclas actuales):**
- **Aliados & Comunidad** → después de `trust-section` (línea ~2391, cierre `</section>`), antes de `faq-section`.
- **En los Medios** → después de `#eventos` (cierre ~2190), antes de `#galeria`. *(prensa como continuación de agenda cultural)*
- **Boletín Cultural** → después de `#ubicacion` (cierre ~2486), antes de `<footer class="site-footer">`.

**Gobernanza de navegación:** estas 3 secciones son secundarias. **NO** se agregan a `chapter-nav` (que mantiene sus 4 capítulos core). Esto respeta la regla de "único dueño" de MASTER.md.

---

## 4. Estrategia de ejecución paralela (worktrees)

**Mecanismo:** herramienta nativa `EnterWorktree` (NO `git worktree add` manual — regla de using-git-worktrees).

3 dominios independientes → 3 agentes en paralelo. Cada uno:
1. Entra a su worktree aislado (rama `feat/clone-aliados`, `feat/clone-prensa`, `feat/clone-boletin`).
2. Inspecciona curaclimate.com para su patrón (estructura/espaciado/layout — NO colores).
3. Escribe su partial (HTML + CSS + notes) usando SOLO tokens/clases de Itinerante.
4. Escribe los asserts de harness propuestos en `*.notes.md` (el orquestador los aplica en integración para evitar colisiones en `tests/site.test.mjs`).
5. Devuelve un resumen: qué construyó, qué assets locales necesita, anclas de inserción.

**Por qué partials y no editar `index.html` directo:** 3 agentes editando el mismo archivo colisionan. Partials aislados → integración secuencial sin conflictos de merge.

---

## Task A: Agente "Aliados & Comunidad"

**Files:**
- Create: `docs/superpowers/partials/aliados/aliados.section.html`
- Create: `docs/superpowers/partials/aliados/aliados.styles.css`
- Create: `docs/superpowers/partials/aliados/aliados.notes.md`

- [ ] **Step 1: Inspeccionar el patrón en curaclimate**
  Abrir https://www.curaclimate.com/, localizar "THE CURA ECOSYSTEM". Extraer SOLO: número de columnas por breakpoint, gap del grid, tamaño/relación de las celdas de logo, alineación, comportamiento hover. Ignorar sus colores y tipografía.

- [ ] **Step 2: Construir la `<section>` con estructura de Itinerante**
  Estructura objetivo (adaptar clases al estilo BEM-ish existente `*-section`):
```html
<section id="aliados" class="allies-section" aria-labelledby="allies-title">
  <div class="section-inner">
    <div class="section-head">
      <p class="section-eyebrow">Comunidad</p>
      <h2 id="allies-title" class="section-title">Tejemos librería con otros.</h2>
      <p class="section-lead">Editoriales independientes, cafés, colectivos y bibliotecas que caminan con nosotros.</p>
    </div>
    <ul class="allies-grid" role="list">
      <li class="ally-card">
        <a class="ally-link" href="#" aria-label="Nombre del aliado">
          <img class="ally-logo" src="images/aliados/placeholder.svg" alt="Nombre del aliado" loading="lazy" width="140" height="64">
        </a>
      </li>
      <!-- repetir 6-8 celdas -->
    </ul>
  </div>
</section>
```

- [ ] **Step 3: CSS con tokens de Itinerante**
  Reglas objetivo (banda alternante: usar `--surface-soft` o `--surface-paper` según lo que quede antes de FAQ):
```css
.allies-section { background: var(--surface-soft); padding: 76px 0; }
.allies-grid {
  display: grid; gap: 24px;
  grid-template-columns: repeat(2, 1fr);
}
@media (min-width: 641px) { .allies-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
@media (min-width: 1025px) { .allies-grid { grid-template-columns: repeat(4, 1fr); } }
.ally-card { background: var(--surface-paper); border: 1px solid rgba(93,196,180,.18);
  border-radius: var(--radius); display: grid; place-items: center; min-height: 96px; }
.ally-link { display: grid; place-items: center; width: 100%; height: 100%;
  min-height: 44px; padding: 16px; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.ally-card:hover .ally-link { transform: scale(1.025); }
.ally-logo { max-width: 100%; height: auto; filter: grayscale(1); opacity: .8;
  transition: filter .2s ease, opacity .2s ease; }
.ally-card:hover .ally-logo { filter: grayscale(0); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .ally-link { transition: none; } }
```
  Restricciones: hover scale ≤1.025 (estándar de cards), motion color 200ms, card 300ms. Logos locales en `images/aliados/` (SVG preferido, o data URI).

- [ ] **Step 4: Escribir `aliados.notes.md`**
  Documentar: ancla de inserción (después de `trust-section`, antes de `faq-section`), lista exacta de archivos de logo que hay que crear en `images/aliados/`, y los asserts de harness propuestos:
```js
test('allies section: structure, tokens, motion budget', () => {
  assert.match(html, /<section id="aliados" class="allies-section"/);
  assert.match(html, /id="allies-title"/);
  assert.ok(/\.allies-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.ally-link', 450);
  // logos locales, sin URLs externas: cubierto por el test global de assets locales
});
```

- [ ] **Step 5: Commit en el worktree**
```bash
git add docs/superpowers/partials/aliados/
git commit -m "feat(aliados): partial de grid Aliados & Comunidad"
```

**Return del agente:** resumen de estructura, lista de assets de logo requeridos, anclas, y el bloque de test propuesto.

---

## Task B: Agente "En los Medios / Prensa"

**Files:**
- Create: `docs/superpowers/partials/prensa/prensa.section.html`
- Create: `docs/superpowers/partials/prensa/prensa.styles.css`
- Create: `docs/superpowers/partials/prensa/prensa.notes.md`

- [ ] **Step 1: Inspeccionar el grid de noticias de curaclimate**
  Localizar la sección de 4 cards de prensa. Extraer: layout de card (imagen arriba, título, meta, link), columnas por breakpoint, gap, comportamiento hover (lift). Ignorar colores.

- [ ] **Step 2: Construir la `<section>`**
  Reutilizar el patrón "Book Image Overlay" de Itinerante (overlay editorial oscuro sobre imagen real):
```html
<section id="prensa" class="press-section" aria-labelledby="press-title">
  <div class="section-inner">
    <div class="section-head">
      <p class="section-eyebrow">En los medios</p>
      <h2 id="press-title" class="section-title">Lo que se cuenta de la carreta.</h2>
    </div>
    <ul class="press-grid" role="list">
      <li class="press-card">
        <a class="press-card-link" href="#" aria-labelledby="press-1-title">
          <div class="press-media">
            <img src="images/prensa/nota-1.jpg" alt="" loading="lazy" width="480" height="300">
            <span class="press-source">Medio · 2026</span>
          </div>
          <h3 id="press-1-title" class="press-card-title">Titular de la nota destacada</h3>
          <p class="press-excerpt">Una frase que resume la mención o reseña.</p>
          <span class="press-readmore">Leer nota →</span>
        </a>
      </li>
      <!-- repetir 3-4 cards -->
    </ul>
  </div>
</section>
```

- [ ] **Step 3: CSS con tokens**
```css
.press-section { background: var(--surface-paper); padding: 80px 0; }
.press-grid { display: grid; gap: 24px; grid-template-columns: 1fr; }
@media (min-width: 641px) { .press-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1025px) { .press-grid { grid-template-columns: repeat(3, 1fr); } }
.press-card { background: var(--surface-paper); border-radius: var(--radius);
  box-shadow: var(--shadow-sm); overflow: hidden;
  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease; }
.press-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.press-card-link { display: block; color: var(--text-primary); text-decoration: none; }
.press-media { position: relative; }
.press-media img { display: block; width: 100%; height: auto; }
.press-source { position: absolute; left: 12px; bottom: 12px;
  background: rgba(13,74,69,.82); color: var(--paper);
  font: 500 .78rem/1 'Inter', sans-serif; padding: 6px 10px; border-radius: 999px; }
.press-card-title { font-family: 'Playfair Display', serif; font-size: 1.25rem;
  margin: 16px 16px 8px; }
.press-excerpt { font-family: 'Inter', sans-serif; color: var(--text-md); margin: 0 16px; }
.press-readmore { display: inline-block; margin: 12px 16px 20px;
  color: var(--color-brand-strong); font-weight: 600;
  transition: color .2s ease; min-height: 44px; }
@media (prefers-reduced-motion: reduce) { .press-card { transition: none; } }
```
  Restricción: lift ≤2px, motion card 300ms, color 200ms. Imágenes locales en `images/prensa/`.

- [ ] **Step 4: Escribir `prensa.notes.md`**
  Ancla (después de `#eventos`, antes de `#galeria`), imágenes requeridas en `images/prensa/`, y asserts propuestos:
```js
test('press section: structure and motion budget', () => {
  assert.match(html, /<section id="prensa" class="press-section"/);
  assert.match(html, /id="press-title"/);
  assert.ok(/\.press-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.press-card', 450);
});
```

- [ ] **Step 5: Commit**
```bash
git add docs/superpowers/partials/prensa/
git commit -m "feat(prensa): partial de grid En los Medios"
```

**Return del agente:** estructura, imágenes requeridas, anclas, test propuesto.

---

## Task C: Agente "Boletín Cultural" (signup REAL con Firestore)

**Decisión del usuario:** signup real con email guardado. Backend: Firestore del proyecto `libreria-itineranteymas`, vía REST API + `fetch` vanilla (sin SDK externo — `script-src 'self'` lo prohíbe y así se mantiene).

**Files:**
- Create: `docs/superpowers/partials/boletin/boletin.section.html`
- Create: `docs/superpowers/partials/boletin/boletin.styles.css`
- Create: `docs/superpowers/partials/boletin/boletin.script.js` (se integra al `<script>` inline de index.html)
- Create: `docs/superpowers/partials/boletin/boletin.notes.md`
- Create: `docs/superpowers/partials/boletin/firestore.rules` (propuesta de reglas)

- [ ] **Step 1: Inspeccionar la banda CTA+newsletter de curaclimate**
  Extraer: layout de la banda (headline grande + subtexto + input/botón), centrado vs. split, padding, jerarquía. Ignorar colores.

- [ ] **Step 2: Construir la `<section>` — form manejado por JS**
  Banda oscura editorial (`--color-hero` = teal-900):
```html
<section id="boletin" class="newsletter-section" aria-labelledby="newsletter-title">
  <div class="section-inner newsletter-inner">
    <div class="newsletter-copy">
      <p class="section-eyebrow newsletter-eyebrow">Boletín cultural</p>
      <h2 id="newsletter-title" class="newsletter-title">Una carta de la librería, cada mes.</h2>
      <p class="newsletter-lead">Recomendaciones curadas, talleres y novedades de la carreta. Sin ruido, sin spam.</p>
    </div>
    <form id="newsletterForm" class="newsletter-form" novalidate>
      <label class="newsletter-label" for="newsletterEmail">Tu correo</label>
      <div class="newsletter-row">
        <input id="newsletterEmail" class="newsletter-input" type="email"
               name="email" placeholder="tucorreo@ejemplo.mx"
               autocomplete="email" required aria-describedby="newsletterMsg">
        <button type="submit" class="newsletter-cta" id="newsletterSubmit">Suscribirme</button>
      </div>
      <p id="newsletterMsg" class="newsletter-msg" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
```
  Nota CSP: el form usa `preventDefault` + `fetch` — nunca envío nativo, así `form-action 'none'` se queda intacto.

- [ ] **Step 3: JS vanilla (fetch a Firestore REST)**
```js
// Boletín: alta de suscriptor vía Firestore REST (sin SDK)
const NEWSLETTER_ENDPOINT =
  'https://firestore.googleapis.com/v1/projects/libreria-itineranteymas/databases/(default)/documents/boletin_suscriptores?key=FIREBASE_WEB_API_KEY';

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const input = document.getElementById('newsletterEmail');
  const msg = document.getElementById('newsletterMsg');
  const btn = document.getElementById('newsletterSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = 'Revisa tu correo, algo no cuadra.';
      return;
    }
    btn.disabled = true;
    msg.textContent = 'Guardando tu lugar en la lista…';
    try {
      const res = await fetch(NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            email: { stringValue: email },
            creadoEn: { timestampValue: new Date().toISOString() },
            origen: { stringValue: 'sitio-itinerante' }
          }
        })
      });
      if (!res.ok) throw new Error('firestore ' + res.status);
      form.reset();
      msg.textContent = 'Listo. La próxima carta llega a tu correo.';
    } catch (err) {
      msg.textContent = 'No pudimos guardarlo. Intenta de nuevo o escríbenos por WhatsApp.';
    } finally {
      btn.disabled = false;
    }
  });
}
initNewsletter();
```
  `FIREBASE_WEB_API_KEY` la resuelve el orquestador en integración (Step D-0). La API key web de Firebase es pública por diseño; la seguridad vive en las reglas.

- [ ] **Step 4: Reglas de Firestore (create-only, validadas)**
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boletin_suscriptores/{docId} {
      allow read, update, delete: if false;
      allow create: if request.resource.data.keys().hasOnly(['email', 'creadoEn', 'origen'])
        && request.resource.data.email is string
        && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$')
        && request.resource.data.email.size() < 120
        && request.resource.data.origen == 'sitio-itinerante';
    }
  }
}
```
  Nadie puede leer la lista desde el cliente; solo crear documentos válidos.

- [ ] **Step 5: CSS con tokens**
```css
.newsletter-section { background: var(--color-hero); color: var(--paper); padding: 72px 0; }
.newsletter-inner { display: grid; gap: 28px; align-items: center; }
@media (min-width: 861px) { .newsletter-inner { grid-template-columns: 1.2fr 1fr; gap: 48px; } }
.newsletter-eyebrow { color: var(--brand-light); }
.newsletter-title { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 3vw, 2.2rem);
  color: var(--paper); margin: 0 0 10px; }
.newsletter-lead { font-family: 'Inter', sans-serif; color: rgba(253,252,248,.82); margin: 0; }
.newsletter-label { position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; }
.newsletter-row { display: flex; flex-wrap: wrap; gap: 12px; }
.newsletter-input { flex: 1 1 220px; min-height: 48px; padding: 12px 16px;
  border-radius: var(--radius); border: 1px solid rgba(253,252,248,.35);
  background: rgba(253,252,248,.08); color: var(--paper);
  font: 400 1rem 'Inter', sans-serif; transition: border-color .2s ease; }
.newsletter-input::placeholder { color: rgba(253,252,248,.55); }
.newsletter-input:focus { outline: 2px solid var(--brand-light); outline-offset: 2px;
  border-color: var(--brand-light); }
.newsletter-cta { min-height: 48px; display: inline-flex; align-items: center;
  background: var(--paper); color: var(--color-hero); font: 600 1rem 'Inter', sans-serif;
  padding: 12px 26px; border: 0; border-radius: var(--radius); cursor: pointer;
  transition: transform .2s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }
.newsletter-cta:hover { transform: translateY(-2px); }
.newsletter-cta:disabled { opacity: .6; transform: none; cursor: wait; }
.newsletter-msg { min-height: 1.4em; margin: 10px 0 0;
  font: 400 .9rem 'Inter', sans-serif; color: var(--brand-light); }
@media (prefers-reduced-motion: reduce) { .newsletter-cta { transition: none; } }
```
  Restricción: contraste WCAG sobre teal-900, targets ≥44px, motion ≤200ms en el CTA, foco visible.

- [ ] **Step 6: Escribir `boletin.notes.md`**
  Documentar: ancla (después de `#ubicacion`, antes de `site-footer`), el cambio de CSP requerido (`connect-src https://firestore.googleapis.com`), dónde inyectar el JS, y asserts propuestos:
```js
test('newsletter band: real signup wired to Firestore, CSP updated', () => {
  assert.match(html, /<section id="boletin" class="newsletter-section"/);
  assert.match(html, /id="newsletterForm"/);
  assert.match(html, /aria-live="polite"/);
  // CSP permite Firestore y solo Firestore en connect-src
  assert.match(html, /connect-src https:\/\/firestore\.googleapis\.com/);
  // El form no depende de envío nativo
  assert.match(html, /form-action 'none'/);
  assertMotionBudget('.newsletter-cta', 300);
});
```

- [ ] **Step 7: Commit**
```bash
git add docs/superpowers/partials/boletin/
git commit -m "feat(boletin): partial de Boletín Cultural con signup real a Firestore"
```

**Return del agente:** estructura, endpoint y reglas propuestas, cambio CSP exacto, ancla, test propuesto.

---

## Task D (orquestador): Integración secuencial

Ejecuta el orquestador (yo) tras recibir los 3 returns. Uno a la vez para evitar colisiones en `index.html` y `tests/site.test.mjs`.

- [ ] **Step 0: Infraestructura Firebase para el boletín**
  1. Obtener la API key web: `npx firebase apps:sdkconfig web --project libreria-itineranteymas` (si la CLI no está autenticada, pedirla al usuario desde la consola de Firebase → Configuración del proyecto → Web API Key).
  2. Sustituir `FIREBASE_WEB_API_KEY` en el JS del boletín.
  3. Añadir a `firebase.json` el bloque `"firestore": { "rules": "firestore.rules" }` y crear `firestore.rules` en la raíz con las reglas de la Task C.
  4. Desplegar reglas: `npx firebase deploy --only firestore:rules --project libreria-itineranteymas`.
  5. Editar la CSP en `index.html`: `connect-src 'none'` → `connect-src https://firestore.googleapis.com`.

- [ ] **Step 1: Crear assets locales** que los agentes reportaron (`images/aliados/*`, `images/prensa/*`). **Decisión del usuario: placeholders por ahora** — generar SVG locales editoriales (monograma + nombre del aliado en Playfair, paleta paper/teal) con los nombres de archivo definitivos, para swap 1:1 cuando lleguen los assets reales.

- [ ] **Step 2: Insertar CSS** de cada partial dentro del `<style>` de `index.html`, junto a las reglas de sección afines (no al final suelto).

- [ ] **Step 3: Insertar cada `<section>`** en su ancla exacta (ver §3), en orden: prensa (tras `#eventos`), aliados (tras `trust-section`), boletín (tras `#ubicacion`).

- [ ] **Step 4: Añadir los 3 bloques de test** a `tests/site.test.mjs`.

- [ ] **Step 5: Correr el harness**
```bash
npm.cmd test
```
  Expected: PASS, incluidos los 3 tests nuevos + todos los existentes (sin regresiones).

- [ ] **Step 6: Verificación visual** con el server de preview + browser tools; screenshot de cada banda nueva en mobile/desktop para confirmar tokens, contraste y responsividad.

- [ ] **Step 7: Commit de integración** en `main` (o rama de feature) con resumen.

---

## 5. Decisiones de gobernanza (RESUELTAS por el usuario, 2026-07-09)

1. **Boletín = signup REAL** con Firestore (`libreria-itineranteymas`), fetch vanilla, reglas create-only, CSP ampliada solo a `https://firestore.googleapis.com`. Ver Task C.
2. **Assets = placeholders SVG locales por ahora**, con nombres de archivo definitivos para swap 1:1 después.
3. **`chapter-nav` intacto** — las 3 secciones nuevas no entran a la navegación por capítulos.
4. **Copy propuesto por Claude** (aprobado el enfoque; el usuario ajusta después si quiere). Copy canónico:

### Copy canónico de las 3 secciones

Tono: editorial, cálido, primera persona plural, local (Monterrey), sin marketing agresivo — el registro que usan las buenas librerías independientes: voz de casa, no de tienda.

**Aliados & Comunidad (`#aliados`)**
- Eyebrow: `Comunidad`
- Título: `Tejemos librería con otros.`
- Lead: `Editoriales independientes, cafés, colectivos y bibliotecas que caminan con la carreta.`
- Placeholders de aliados (8): Editorial Aliada, Café Vecino, Colectivo Lector, Biblioteca Amiga, Sello Independiente, Taller de Letras, Foro Cultural, Distribuidora Local.

**En los Medios (`#prensa`)**
- Eyebrow: `En los medios`
- Título: `Lo que se cuenta de la carreta.`
- Lead: `Notas, reseñas y menciones que nos han acompañado en el camino.`
- Cards placeholder (3): titulares tipo `Una librería que camina el centro de Monterrey`, `Los talleres que están reuniendo lectores`, `Café, libros y comunidad en un mismo lugar` — fuente `Medio · 2026`, link `Leer nota →`.

**Boletín Cultural (`#boletin`)**
- Eyebrow: `Boletín cultural`
- Título: `Una carta de la librería, cada mes.`
- Lead: `Recomendaciones curadas, talleres y novedades de la carreta. Sin ruido, sin spam.`
- Botón: `Suscribirme` · Éxito: `Listo. La próxima carta llega a tu correo.` · Error: `No pudimos guardarlo. Intenta de nuevo o escríbenos por WhatsApp.`

---

## 6. Self-review (writing-plans)

- **Cobertura del alcance:** las 3 secciones nuevas (Aliados, Prensa, Boletín) tienen cada una su Task A/B/C + integración en Task D. ✅
- **Sin placeholders de código:** cada task incluye HTML, CSS y asserts concretos. Los textos/imágenes de contenido están marcados explícitamente como placeholders a confirmar (§5), no como código faltante. ✅
- **Consistencia de tipos/nombres:** clases (`allies-section`/`allies-grid`/`ally-card`, `press-section`/`press-card`, `newsletter-section`/`newsletter-cta`) y anclas (`#aliados`, `#prensa`, `#boletin`) son consistentes entre HTML, CSS y tests. ✅
- **Constraints del proyecto:** vanilla HTML/CSS/JS, tokens existentes, sin Tailwind, CSP-safe, motion budgets, chapter-nav intacto. ✅
