# Boletín Cultural — notas de integración (Task C)

Partial autocontenido de la banda CTA + newsletter con signup REAL a Firestore
(proyecto `libreria-itineranteymas`) vía REST API + `fetch` vanilla. Sin SDK,
sin CDNs, sin envío nativo del form.

## (a) Ancla de inserción del HTML

Insertar `boletin.section.html` en `index.html`:

- **Después** del cierre de `<section id="ubicacion" class="visit-section">` (su `</section>`).
- **Antes** de `<footer class="site-footer">`.

Gobernanza: sección secundaria — **NO** se agrega a `chapter-nav` (regla de único dueño de MASTER.md).

## (b) Cambio de CSP requerido

En el `<meta http-equiv="Content-Security-Policy">` de `index.html`:

- `connect-src 'none'` → `connect-src https://firestore.googleapis.com`
  (solo Firestore; nada más se amplía).
- `form-action 'none'` **se queda intacto**: el form nunca hace envío nativo.
  El submit se maneja 100% en JS con `preventDefault()` + `fetch`, así que
  `form-action 'none'` funciona como defensa en profundidad — si el JS fallara
  o alguien intentara forzar un envío nativo, el navegador lo bloquea.
- `script-src 'self' 'unsafe-inline'` no cambia (no se cargan SDKs externos).

## (c) Dónde inyectar el JS

El contenido de `boletin.script.js` se pega **dentro del `<script>` inline
existente** de `index.html` (al final del bloque, junto a las demás
inicializaciones). No crear un `<script src>` nuevo ni archivo separado.

Antes de integrar, el orquestador sustituye el placeholder literal
`FIREBASE_WEB_API_KEY` en `NEWSLETTER_ENDPOINT` por la Web API Key real del
proyecto (`npx firebase apps:sdkconfig web --project libreria-itineranteymas`
o consola de Firebase → Configuración del proyecto → Web API Key). La API key
web es pública por diseño; la seguridad vive en `firestore.rules`
(create-only, campos validados, lectura prohibida desde cliente).

## (d) Bloque de test propuesto (para `tests/site.test.mjs`)

```js
test('newsletter band: real signup wired to Firestore, CSP updated', () => {
  assert.match(html, /<section id="boletin" class="newsletter-section"/);
  assert.match(html, /id="newsletterForm"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /connect-src https:\/\/firestore\.googleapis\.com/);
  assert.match(html, /form-action 'none'/);
  assertMotionBudget('.newsletter-cta', 300);
});
```

## (e) Hallazgos de la inspección (curaclimate.com, 2026-07-09)

Del patrón de banda CTA/newsletter (solo layout — colores y tipografía ignorados):

- **Dos zonas en desktop:** división asimétrica implícita — contenido ancla la
  zona izquierda, el form ocupa la porción derecha. El foco visual cae en el
  input. → Replicado con `grid-template-columns: 1.2fr 1fr` a partir de 861px.
- **Apilado en mobile:** una sola columna con elementos apilados:
  headline → subtexto → input+botón → mensaje de confirmación/error debajo
  del form. → Replicado con el grid de una columna por defecto y
  `#newsletterMsg` bajo la fila input/botón.
- **Jerarquía:** headline de acción domina; el input es el punto focal de
  interacción; feedback textual debajo del form. → Replicado con
  `aria-live="polite"` en el mensaje de estado.
- **Padding:** banda con padding vertical sustancial que la separa de las
  secciones adyacentes, y espaciado generoso entre headline y controles.
  → Replicado con `padding: 72px 0` y `gap: 28px/48px`.
- **Adaptación a Itinerante:** en lugar de imagen de fondo (curaclimate usa
  una en la zona izquierda), la banda usa el teal-900 editorial
  (`--color-hero`) para mantener el ritmo de bandas alternadas de MASTER.md.

Restricciones respetadas: solo tokens de `:root`, contraste WCAG sobre
teal-900 (`--paper` y `--brand-light` sobre `#0D4A45`), targets ≥44px
(input y CTA `min-height: 48px`), motion ≤200ms en el CTA con
`prefers-reduced-motion` cubierto, foco visible con outline de 2px.
