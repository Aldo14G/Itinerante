# Frente nuevo en /nuevo (SPEC v2)

La landing nueva vive en `/nuevo`. La landing estática anterior sigue en `/` hasta llegar a paridad; la API no cambia.

## Cómo está hecha

- `src/frente/pagina.tsx`: la página en React 19. `scripts/build-nuevo.mjs` la renderiza a HTML estático (`renderToStaticMarkup`) con el CSS y el JS en línea, y escribe `src/app/nuevo/documento.generado.ts`.
- `src/app/nuevo/route.ts`: sirve ese HTML como estático con regeneración cada hora (ISR). En cada regeneración resuelve los bloques fechados (`<fecha-hasta>` / `<fecha-desde>`) con el día de Monterrey (`src/frente/fechas.ts`). El navegador repite la regla (`src/frente/cliente.js`) por si el HTML viene de caché.
- El navegador no descarga React ni Next: unos 3 KB de JS en línea (fechas, scroll-spy, buscador y contador, ficha con `<dialog>`, carta plegada en el teléfono). Sin JS se lee todo y el filtro por editorial funciona con CSS.
- Astryx 0.7.17 (fijo, solo en devDependencies): `defineTheme` → `src/frente/tema-itinerante.css` (`npm run tema:astryx`). No se usan componentes de Astryx en el navegador porque su JS rompía el presupuesto de peso (SPEC v2 §6.2).

## Datos

- `src/frente/negocio.json`: dirección, teléfono, redes, `horario` (con `confirmado`: en true sale una vez en Visita y en el JSON-LD; en false no se imprime) y fotos de Visita con crédito y permiso.
- `src/frente/eventos.json`: fuente de verdad de Eventos (fecha ISO, imagen local o null, `registroUrl` opcional, `instagramUrl`, recurrencia). `scripts/sync-instagram.mjs` puede proponer imagen y permalink desde la Instagram API with Instagram Login; apagado sin variables de entorno, y no escribe fechas. `src/frente/correcciones.json`: datos de catálogo de fuente pública citada (nunca precios).
- `assets/data/*.json`: catálogo, carta, colecciones (`novedades.entradas`), merch y preguntas, compartidos con la landing anterior.
- `src/frente/frases-vetadas.json`: frases que `tests/frente.test.mjs` prohíbe en el HTML.

## Comandos

```bash
npm ci --ignore-scripts
npm run nuevo            # regenera documento.generado.ts tras cambiar datos, pagina.tsx, nuevo.css o cliente.js
node scripts/prepare-public.mjs && npx next build && npx next start -p 3100
# http://localhost:3100/nuevo  (la anterior en /)
npm test                 # incluye tests/frente.test.mjs (HTML al día, conteos, frases vetadas, fechas)
```
