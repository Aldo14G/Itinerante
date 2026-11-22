# Frente en React 19 + Astryx (oleada 1)

La landing nueva vive en `/nuevo` (App Router, `src/app/nuevo/`). La landing estática anterior sigue en `/` hasta llegar a paridad; la API no cambia.

## Cómo correrla

```bash
npm ci --ignore-scripts
node scripts/prepare-public.mjs   # genera public/ (gitignored) para la landing anterior y los assets
npx next build
npx next start -p 3100            # http://localhost:3100/nuevo  (la anterior en /)
npm test                          # incluye tests/frente.test.mjs
```

## Piezas

- `src/frente/datos.ts`: datos reales (41 títulos, 21 productos de la carta, colecciones de `collections.json`, eventos de `src/frente/eventos-oficiales.json`). Lo desconocido queda `null`/`[pendiente]` en datos y notas, nunca en la interfaz.
- `src/frente/paleta.mjs` + `scripts/check-contraste.mjs` (`npm run contraste`): pares de color AA.
- `src/frente/tema.mjs` + `scripts/build-tema-astryx.mjs` (`npm run tema:astryx`): el tema `itinerante` se precompila a `src/app/nuevo/tema-itinerante.css`; `<html>` lleva `data-astryx-theme="itinerante"`. No se usa `<Theme>` en tiempo de ejecución (metía el generador de temas en el bundle).
- `scripts/build-textos-astryx.mjs` (`npm run textos:astryx`): recorta el catálogo es-ES de Astryx a las claves que se usan.
- `src/app/nuevo/capas.css`: orden de capas; la base propia queda por debajo de los componentes de Astryx.
- Astryx fijado a `0.7.17` exacto.

## Reglas que hay que mantener

- Contenido en el HTML del servidor (SSG con `revalidate = 3600`), legible sin JS.
- Novedades no se pinta (ni su enlace) mientras `NOVEDADES` esté vacío.
- La tarjeta del 6.º Aniversario se oculta desde el 2026-11-28 (America/Monterrey): filtro en el render (ISR) y `SoloHasta` en cliente para el HTML ya cacheado.
- Sin estado «Abierto/Cerrado» (no hay horario oficial).
- Interruptor de movimiento compartido con la landing anterior (`localStorage['iti-b4-motion']`).

## Desviaciones conocidas de la spec

- Ficha: `Dialog` a pantalla completa en móvil en lugar de `BottomSheet`.
- Carta: listas propias en lugar de `MetadataList` (menos JS).
- Movimiento reducido forzado: `reducedMotion: 'always'` no es público en 0.7.17; se usa `html[data-movimiento='quieto']` y la propiedad `--_astryx-reduced-motion`.
- Tipografía: se mantiene Inter (sin Fraunces). Sin modo oscuro.
