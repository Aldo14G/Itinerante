# Partial "En los Medios / Prensa" — notas de integración

Task B del plan `docs/superpowers/plans/2026-07-09-curaclimate-layout-clone.md`.

## (a) Ancla de inserción en `index.html`

- **HTML:** insertar `prensa.section.html` **después del cierre** de `<section id="eventos" class="events-section">` (cierre `</section>` ~línea 2186, justo antes del comentario `GALERÍA DE LIBROS` ~línea 2189) y **antes** de `<section id="galeria" class="catalog-section">` (~línea 2192).
- **CSS:** pegar `prensa.styles.css` dentro del `<style>` de `index.html`, junto a las reglas afines — entre el bloque `.events-*` y el bloque `.catalog-*` — no al final suelto.
- **Ritmo de bandas:** `#eventos` es banda oscura (`--color-hero`) y `#galeria` abre con gradiente `--surface-soft → --surface-paper`; la prensa en `--surface-paper` mantiene la alternancia oscuro → paper → soft.
- **Navegación:** NO agregar `#prensa` a `chapter-nav` (regla de "único dueño" de MASTER.md; sección secundaria).
- **Nota de clases:** `index.html` no define `.section-inner/.section-head/.section-eyebrow/.section-lead` (usa `.section-kicker/.section-copy/.story-shell`). El CSS del partial las define **scoped bajo `.press-section`** replicando ese patrón, así el pegado no toca reglas globales. `.section-title` sí existe globalmente y se reutiliza tal cual.
- El partial usa la clase `reveal` ya existente en index.html para la animación de entrada; si el orquestador prefiere no animar, basta quitarla (no hay CSS propio que dependa de ella).

## (b) Imágenes a crear en `images/prensa/`

Placeholders SVG locales (CSP: `img-src 'self' data: blob:` — nada externo). Nombres definitivos para swap 1:1 cuando lleguen los assets reales:

| Archivo | Uso | Especificación sugerida |
|---|---|---|
| `images/prensa/nota-1.svg` | Card "Una librería que camina el centro de Monterrey" | 480×300 (16:10), estilo editorial: fondo `#F0EDE4`, monograma/ilustración lineal en `#0D4A45`, acento `#E8A020` |
| `images/prensa/nota-2.svg` | Card "Los talleres que están reuniendo lectores" | ídem |
| `images/prensa/nota-3.svg` | Card "Café, libros y comunidad en un mismo lugar" | ídem |

Los `<img>` llevan `width="480" height="300"`, `loading="lazy"` y `alt=""` (decorativas: el titular ya nombra la nota y el `<a>` usa `aria-labelledby` al `<h3>`).

## (c) Test propuesto para `tests/site.test.mjs`

```js
test('press section: structure and motion budget', () => {
  assert.match(html, /<section id="prensa" class="press-section"/);
  assert.match(html, /id="press-title"/);
  assert.ok(/\.press-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.press-card', 450);
});
```

## (d) Hallazgos de la inspección de curaclimate.com y cómo se aplicaron

Inspección vía WebFetch de https://www.curaclimate.com/ (solo patrón, ignorando colores/tipografía):

| Hallazgo (curaclimate) | Aplicación en Itinerante |
|---|---|
| Card: imagen full-width arriba → etiqueta de categoría → titular → link "Read Article" con icono direccional | Mismo orden vertical: `.press-media` (imagen full-width) → `.press-card-title` → `.press-excerpt` → `.press-readmore` con flecha tipográfica `→` (sin icono SVG extra) |
| Etiqueta de categoría por card ("News", "Announcements") | Se traduce a la píldora `.press-source` ("Medio · 2026"), como overlay oscuro sobre la imagen — patrón "Book Image Overlay" ya existente en la marca |
| Imágenes apaisadas ~16:9, tratamiento consistente entre cards | `aspect-ratio: 480/300` + `object-fit: cover` para uniformidad y cero CLS |
| Hover: lift de card con realce de sombra | `translateY(-2px)` + `--shadow-sm → --shadow-md`, transición 300ms `cubic-bezier(.2,.8,.2,1)` (dentro del presupuesto ≤450ms y del lift ≤2px de MASTER.md) |
| Grid de ~2 columnas en desktop, 1 en móvil, gap moderado | **Divergencia deliberada:** con 3 cards, 2 columnas dejaría una huérfana; se mantiene la spec canónica del plan: 1 col → 2 cols (≥641px) → 3 cols (≥1025px), gap 24px |
| Toda la card es clicable (affordance de link) | `<a class="press-card-link">` envuelve todo el contenido; `focus-visible` con outline de marca; `.press-readmore` con `min-height: 44px` |

Ajustes propios de la marca (no de curaclimate): `padding: 80px 24px` en la sección (las secciones hermanas llevan el padding horizontal en el `<section>`, no en el shell), `padding-block: 60px` en móvil (rango 48–66px de MASTER.md), `prefers-reduced-motion` anula transición y transform, tipografía solo Playfair Display (titulares) + Inter (meta/cuerpo), cero hex nuevos salvo el rgba del overlay derivado de `--brand-hero` (patrón ya usado en index.html).
