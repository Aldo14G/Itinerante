# Experiencia Unificada + Optimización de Scroll — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Unificar las secciones "Transforma tu visita" y "Experiencia" en una sola banda con la composición de curaclimate (intro sticky + cards numeradas con hover animado), y eliminar las causas medidas de scroll pesado.

**Architecture:** Sitio estático de un solo `index.html` (3,600 líneas, 137KB) con CSS inline y JS vanilla. Cambios quirúrgicos: un swap de dos `<section>` por una, reducción de efectos de pintura costosos, y `content-visibility` para no renderizar lo que está fuera de viewport. Sin frameworks, sin build.

**Tech Stack:** HTML5, CSS custom properties (tokens `--it-*`), JS vanilla, harness `node --test`. Playfair Display + Inter.

---

## 0. Diagnóstico medido (base del plan — no asumido)

Inspección real de `index.html` (2026-07-10):

| Hallazgo | Medición | Impacto en scroll |
|---|---|---|
| `backdrop-filter` | 7 reglas (12 con `-webkit-`): navbar `blur(16px) saturate(180%)` **fijo sobre todo el scroll**, chapter-nav `blur(18px) saturate(160%)` sticky, + 5 en cards/overlays (8–12px) | **Alto** — cada frame de scroll recompone el blur de elementos fixed/sticky |
| `content-visibility` | 0 usos en 11 secciones | **Alto** — el navegador calcula layout/paint de las ~9 secciones fuera de viewport en cada frame |
| `transition: all` | 3 usos (líneas 1260, 2150, 2156) | Medio — anima propiedades no intencionadas (layout props) |
| Animaciones `infinite` | 4: `bounce` (hero), `border-flow` ×2 (**anima `background-position` de gradientes = repaint continuo**), `waPing` (FAB) | Medio — `border-flow` repinta aunque la sección no se vea |
| Imágenes | 18 `<img>`, 15 lazy; ~1.4MB total; hero 184KB **sin preload** | Bajo-medio — 3 imgs eager sin priorización |
| Página | 137KB HTML inline, un solo documento largo | Contexto — hace el resto más grave |

**Restricciones del harness que este plan respeta:**
- `id="experiencia"`, `id="transformacion-title"`, `id="experiencia-title"` deben existir (test "home narrative", líneas 408–422 de `site.test.mjs`)
- ≥3 elementos `.experience-panel` (línea 423) y `assertMotionBudget('.experience-panel', 300)` (línea 431)
- El diseño unificado **conserva los tres ids y la clase** → no requiere tocar esos asserts.

**⚠️ Coordinación previa:** hay una sesión paralela arreglando los 2 tests del hero (`.hero-visual`) que edita `index.html` y posiblemente `tests/site.test.mjs`. **Task 0 es obligatoria antes de tocar nada.**

---

## Task 0: Sincronizar con la sesión paralela del hero

**Files:** ninguno (solo git)

- [ ] **Step 1:** Verificar si la sesión del hero terminó: `git branch -a` y buscar su rama/worktree; revisar notificación de la tarea `task_9d3f9d3c`.
- [ ] **Step 2:** Si terminó → merge de su rama a `main` ANTES de empezar. Si sigue corriendo → los cambios de este plan evitan la zona del hero (líneas ~109–420 CSS hero y HTML `<section class="hero">`); documentar que el merge posterior puede requerir resolución en `tests/site.test.mjs`.
- [ ] **Step 3:** `npm.cmd test` para fijar la línea base del momento (hoy: 22 pass / 2 fail del hero).

---

## Task A: Unificar "Transforma tu visita" + "Experiencia" (composición curaclimate)

**Files:**
- Modify: `index.html` — HTML líneas ~2283–2359 (las dos `<section>` actuales → una), CSS `.transform-grid`/`.benefit-*` (~línea 430–475) y `.experience-*` (~476–530)

### Diseño objetivo

Composición split tipo curaclimate (misma familia que `#aliados`): **intro sticky a la izquierda, cards a la derecha**. Cada beneficio numerado (01/02/03) se fusiona con su card fotográfica correspondiente — son la misma idea contada dos veces:

| Beneficio 01–03 (se fusiona) | Card fotográfica (absorbe) | Card resultante |
|---|---|---|
| 01 Curaduría cercana | Libros | `01 · LIBROS` — "Curaduría cercana" + copy largo del panel |
| 02 Tiempo para estar | Café | `02 · CAFÉ` — "Tiempo para estar" + copy largo del panel |
| 03 Agenda viva | Talleres | `03 · TALLERES` — "Agenda viva" + copy largo del panel |

**Copy que se consolida (decisión editorial a validar con el usuario):** los títulos de panel ("Curaduría para encontrar algo propio", "Una pausa entre estantes", "Escena cultural en pequeño formato") pasan a ser el `<p>` corto de cada card si se prefiere conservarlos; los párrafos cortos de beneficio se eliminan por duplicar a los largos.

- [ ] **Step 1: Reemplazar las dos secciones por la unificada**

```html
<!-- ══════════════════════════════════════
     EXPERIENCIA — unificada (Transforma tu visita + Tres maneras)
══════════════════════════════════════ -->
<section id="experiencia" class="story-section story-section--soft experience-section" aria-labelledby="transformacion-title">
  <div class="story-shell experience-layout">
    <div class="experience-intro reveal">
      <p class="section-kicker eyebrow-pill">Transforma tu visita</p>
      <h2 id="transformacion-title" class="section-title">Un lugar para leer, conversar y volver.</h2>
      <p class="section-copy">
        Itinerante funciona como una casa cultural compacta: entras por un libro, te quedas por el café,
        y vuelves por la conversación que se arma alrededor de la lectura.
      </p>
      <p id="experiencia-title" class="experience-subtitle">Tres maneras de habitar la librería.</p>
    </div>

    <div class="experience-grid">
      <article class="experience-panel reveal">
        <div class="experience-media">
          <img src="images/books/poesia-latinoamericana-demo.webp" alt="Selección ilustrada de libros de poesía y narrativa" width="900" height="900" loading="lazy" decoding="async">
        </div>
        <div class="experience-panel-body">
          <span class="experience-num">01 · Libros</span>
          <h3>Curaduría cercana</h3>
          <p>Narrativa, poesía, ensayo, crónica e infantil ordenados como rutas de lectura, no como inventario frío.</p>
        </div>
      </article>
      <article class="experience-panel reveal">
        <div class="experience-media">
          <img src="images/books/narrativa-mexicana-demo.webp" alt="Selección editorial para leer con café en la librería" width="900" height="900" loading="lazy" decoding="async">
        </div>
        <div class="experience-panel-body">
          <span class="experience-num">02 · Café</span>
          <h3>Tiempo para estar</h3>
          <p>Un espacio tranquilo para hojear, esperar a alguien o dejar que una recomendación encuentre su momento.</p>
        </div>
      </article>
      <article class="experience-panel reveal">
        <div class="experience-media">
          <img src="images/events/escritura-creativa-demo.webp" alt="Ilustración de materiales para taller de escritura creativa" width="900" height="900" loading="lazy" decoding="async">
        </div>
        <div class="experience-panel-body">
          <span class="experience-num">03 · Talleres</span>
          <h3>Agenda viva</h3>
          <p>Lecturas, escritura, teatro, fotografía y conversación para que la librería también sea punto de encuentro.</p>
        </div>
      </article>
    </div>
  </div>
</section>
```

Notas: se conservan `id="experiencia"`, `id="transformacion-title"`, `id="experiencia-title"` y 3× `.experience-panel` → los asserts existentes del harness siguen válidos sin tocarlos.

- [ ] **Step 2: CSS del layout unificado** (reemplaza `.transform-grid`, `.benefit-row`, `.benefit-item` y ajusta `.experience-*`)

```css
/* ── Experiencia unificada: intro sticky + cards (patrón curaclimate) ── */
.experience-layout {
  display: grid;
  gap: 44px;
  align-items: start;
}
@media (min-width: 1025px) {
  .experience-layout { grid-template-columns: minmax(300px, 1fr) 2.1fr; gap: 56px; }
  .experience-intro { position: sticky; top: 132px; }
}
.experience-subtitle {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  color: var(--brand-hero);
  margin: 26px 0 0;
}
.experience-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: 1fr;
}
@media (min-width: 641px) {
  .experience-grid { grid-template-columns: repeat(3, 1fr); }
}
.experience-media { overflow: hidden; }
.experience-media img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  transition: transform .3s cubic-bezier(.2,.8,.2,1);
}
.experience-panel:hover .experience-media img { transform: scale(1.04); }
.experience-num {
  font: 700 .72rem/1 'Inter', sans-serif;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--brand-dark);
}
/* Entrada escalonada (mismo patrón que #aliados) */
.experience-grid .reveal:nth-child(2) { transition-delay: .08s; }
.experience-grid .reveal:nth-child(3) { transition-delay: .16s; }
```

Se conservan las reglas existentes de `.experience-panel` (fondo, radio, sombra, hover ≤300ms) — solo se añade el zoom de imagen y el número. **Presupuesto de motion respetado: todo ≤300ms en `.experience-panel`.**

- [ ] **Step 3: Limpiar huérfanos creados por ESTE cambio (solo estos)**
  Grep para confirmar que quedaron sin uso y borrar: `.transform-grid`, `.transform-panel`, `.benefit-row`, `.benefit-item`, `.section-heading--split` (verificar que ninguna otra sección la usa antes de borrar). No tocar nada más.

- [ ] **Step 4: Verificar**
```bash
npm.cmd test
```
Expected: mismos resultados que la línea base de Task 0 (los asserts de ids/panels siguen pasando). Verificación visual: sticky del intro al hacer scroll, stagger de cards, zoom en hover.

- [ ] **Step 5: Commit**
```bash
git add index.html && git commit -m "feat(experiencia): unifica Transforma tu visita + Experiencia en composición curaclimate"
```

---

## Task B: Optimización de scroll (quirúrgica, basada en mediciones)

**Files:**
- Modify: `index.html` (solo las reglas listadas)

- [ ] **Step 1: Abaratar los blurs fijos/sticky (mayor costo por frame)**
  - Navbar (línea ~95): `blur(16px) saturate(180%)` → `blur(8px)` y subir opacidad del fondo para compensar: `background: rgba(253,252,248,.95)`.
  - Chapter-nav (línea ~179): `blur(18px) saturate(160%)` → `blur(8px)` con fondo `rgba(253,252,248,.95)`.
  - Los 5 backdrop-filter de cards/overlays (8–12px): **no tocar** — están en elementos pequeños que no se recomponen en scroll.

- [ ] **Step 2: `content-visibility` para secciones bajo el pliegue**
```css
/* Render diferido: el navegador salta layout/paint de secciones fuera de viewport */
#prensa, #galeria, .trust-section, #aliados, #boletin, .faq-section, #ubicacion, .site-footer {
  content-visibility: auto;
  contain-intrinsic-size: auto 720px;
}
```
  Nota: NO aplicar a `#eventos` (su rail tiene scroll-sync JS que necesita medidas reales) ni a `#experiencia` (sticky interno). Verificar que los anchors del chapter-nav siguen navegando bien (`content-visibility` respeta scroll-to-anchor en navegadores actuales; probar los 4 links).

- [ ] **Step 3: Enumerar los 3 `transition: all`**
  - Línea ~1260: → `transition: transform .24s cubic-bezier(.2,.8,.2,1), box-shadow .24s ease, background .24s ease;` (ajustar a las propiedades que realmente cambian en su :hover — verificar antes).
  - Líneas ~2150, 2156 (dots del carrusel): → `transition: background .2s ease, transform .2s ease;`

- [ ] **Step 4: Pausar `border-flow` fuera de viewport**
  Las 2 reglas (líneas ~347, 360) animan `background-position` en loop infinito. Añadir al observer de reveal existente (o crear uno mínimo) la clase que controla la animación:
```css
.border-flow-anim { animation-play-state: paused; }
.border-flow-anim.in-view { animation-play-state: running; }
```
  Si los elementos son del hero (siempre arriba), alternativa más simple: dejarlos como están y solo documentar. **Decidir tras identificar los selectores exactos en el step — no complicar si el costo real es bajo.**

- [ ] **Step 5: Priorizar el hero y completar atributos de imagen**
  - `<head>`: `<link rel="preload" as="image" href="images/hero/itinerante-hero-cinematic.webp">` (solo si el hero-fix de la sesión paralela reintroduce esa imagen en el hero; si no, preload de la imagen LCP que quede).
  - Los 3 `<img>` sin `loading="lazy"`: dejar eager solo el LCP (hero/logo) con `fetchpriority="high"`; lazy el resto. `decoding="async"` donde falte.

- [ ] **Step 6: Verificar rendimiento (criterio medible)**
  En el preview con DevTools (o usuario en su navegador): grabar 5s de scroll en Performance. Criterio de éxito: sin frames >50ms atribuibles a paint/composite del navbar, y "Rendering: Paint flashing" ya no ilumina la página completa al hacer scroll. Harness: `npm.cmd test` sin regresiones.

- [ ] **Step 7: Commit**
```bash
git add index.html && git commit -m "perf: content-visibility, blurs reducidos y transitions enumeradas para scroll fluido"
```

---

## Task C: Mejores animaciones (extender el patrón ya aprobado)

**Files:**
- Modify: `index.html` (CSS de prensa; reveal ya existente)

- [ ] **Step 1: Stagger en el grid de prensa** (mismo patrón que `#aliados`/experiencia)
```css
.press-grid .reveal:nth-child(2) { transition-delay: .08s; }
.press-grid .reveal:nth-child(3) { transition-delay: .16s; }
```

- [ ] **Step 2: Micro-interacción en "Leer nota →"** (flecha desliza al hover, estilo curaclimate)
```css
.press-readmore { gap: 6px; }
.press-readmore::after { content: ''; }
.press-card-link:hover .press-readmore { transform: translateX(4px); transition: transform .2s cubic-bezier(.2,.8,.2,1); }
```
  (Aplicar el transform al elemento correcto para no mover el layout; verificar presupuesto ≤450ms del test de prensa.)

- [ ] **Step 3: Verificar y commit**
```bash
npm.cmd test
git add index.html && git commit -m "feat(motion): stagger en prensa y micro-interacción en enlaces de nota"
```

---

## Criterios de éxito globales

1. `npm.cmd test` — sin regresiones vs. línea base de Task 0; los asserts de `#experiencia`/ids/panels pasan sin modificarse.
2. Una sola sección Experiencia con todo el contenido consolidado (nada de copy perdido sin decisión explícita).
3. Scroll: paint flashing localizado (no página completa); navbar sin `saturate()` caro.
4. Chapter-nav navega a las 4 anclas con `content-visibility` activo.
5. Alternancia de bandas intacta (la sección unificada hereda `--surface-soft`; la banda paper de "transformación" desaparece → verificar que hero(oscuro) → experiencia(soft) → eventos(oscuro) alterna bien).

## Self-review (writing-plans)

- **Cobertura:** unificación (Task A), inspección+optimización (Task B, basada en 6 mediciones concretas), mejores animaciones (Task C), coordinación con sesión paralela (Task 0). ✅
- **Sin placeholders:** HTML y CSS completos en cada step; los dos puntos abiertos (border-flow y preload del hero) tienen criterio de decisión explícito, no "TBD". ✅
- **Consistencia de nombres:** `.experience-layout/.experience-intro/.experience-media/.experience-num/.experience-subtitle` consistentes entre HTML, CSS y este documento; ids del harness conservados. ✅
- **Karpathy:** cambios trazables al request; no se tocan los 5 backdrop-filter baratos ni sombras; huérfanos solo los creados por el propio cambio; criterios verificables por task. ✅
