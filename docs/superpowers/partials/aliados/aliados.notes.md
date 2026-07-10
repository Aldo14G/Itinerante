# Aliados & Comunidad — notas de integración (Task A)

Partial autocontenido. El orquestador integra; este partial NO toca `index.html` ni `tests/`.

## (a) Ancla de inserción en `index.html`

Insertar la `<section id="aliados">` completa (de `aliados.section.html`):

- **Después** del cierre `</section>` de `<section class="trust-section">` (reseñas, ~línea 2254 en adelante).
- **Antes** de `<section class="faq-section">` (~línea 2393).

El CSS (`aliados.styles.css`) se pega dentro del `<style>` de `index.html`, junto a las reglas de `.trust-section` / `.faq-section` (no al final suelto).

Nota de banda: `trust-section` y `faq-section` definen sus propios fondos; `#aliados` usa `--surface-soft` como banda de contraste, siguiendo la alternancia paper/soft de MASTER.md. Si en integración quedan dos bandas `soft` contiguas, cambiar a `--surface-paper` es un swap de una línea.

Gobernanza: `#aliados` es sección secundaria — **NO** se agrega a `chapter-nav` (único dueño de navegación: Experiencia, Agenda, Libros, Visita).

## (b) Assets SVG a crear en `images/aliados/`

8 logos placeholder locales (CSP restringe imágenes a `'self' data: blob:`). Viewbox sugerido 140×64 (coincide con `width`/`height` del HTML). Estilo: monograma + nombre en Playfair, paleta paper/teal, para swap 1:1 con los logos reales.

| Archivo | Aliado |
|---|---|
| `images/aliados/editorial-aliada.svg` | Editorial Aliada |
| `images/aliados/cafe-vecino.svg` | Café Vecino |
| `images/aliados/colectivo-lector.svg` | Colectivo Lector |
| `images/aliados/biblioteca-amiga.svg` | Biblioteca Amiga |
| `images/aliados/sello-independiente.svg` | Sello Independiente |
| `images/aliados/taller-de-letras.svg` | Taller de Letras |
| `images/aliados/foro-cultural.svg` | Foro Cultural |
| `images/aliados/distribuidora-local.svg` | Distribuidora Local |

## (c) Test propuesto para `tests/site.test.mjs`

```js
test('allies section: structure, tokens, motion budget', () => {
  assert.match(html, /<section id="aliados" class="allies-section"/);
  assert.match(html, /id="allies-title"/);
  assert.ok(/\.allies-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.ally-link', 450);
});
```

Los logos locales (sin URLs externas) quedan cubiertos por el test global de assets locales.

## (d) Hallazgos de la inspección de curaclimate.com y cómo se aplicaron

Inspección de "THE CURA ECOSYSTEM" (2026-07-09, vía WebFetch):

- **8 partners** en celdas uniformes, cada celda envuelta en un `<a>` clicable → replicado: 8 `<li class="ally-card">` con `<a class="ally-link">` de celda completa (target ≥44px).
- **4 columnas en desktop** (2 filas de 4), colapsando en tablet/mobile → aplicado con la escalera 2 col (base) → 3 col (≥641px) → 4 col (≥1025px) de la spec canónica; en desktop los 8 aliados forman exactamente 2×4 como en curaclimate.
- **Proporción uniforme de celdas** (cuadrado-ish, logo centrado) → `display: grid; place-items: center; min-height: 96px` en la card y logos 140×64 con `max-width: 100%`.
- **Gaps numéricos no extraíbles** del markup remoto → se mantienen los canónicos: 24px base, 20px en ≥641px.
- **Hover por link** (cursor pointer, estado interactivo) → adaptado a los presupuestos de Itinerante: `scale(1.025)` en 300ms `cubic-bezier(.2,.8,.2,1)` + logos grayscale→color en 200ms. Se **ignoraron** por completo sus colores y tipografía; todo color viene de tokens `var(--*)`.

Extras sobre la spec canónica (sin violar restricciones):

- `list-style: none; margin: 0; padding: 0` en `.allies-grid` (reset del `<ul>`).
- `:focus-visible` en `.ally-link` (outline `--brand-dark`) y el mismo revelado de color del logo con foco, por accesibilidad de teclado.
- `prefers-reduced-motion` también anula la transición de `.ally-logo`.
- Helpers `.section-inner/.section-head/.section-eyebrow/.section-lead` no existen en `index.html` (el sitio usa `.section-kicker/.section-copy/.story-shell`); se definieron con scope `.allies-section ...` para no colisionar, espejando los estilos existentes.
