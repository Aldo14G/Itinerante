# Itinerante B.4 · Función de la casa

> **Estado: promovido a la raíz el 2026-11-01.** Esto ya no es un prototipo aislado: `index.html` en la raíz es el sitio canónico y sustituyó al sitio Higgsfield `d599d36a` (archivado en `_archive/models/higgsfield-d599d36a/`, ignorado por git; recuperable en la historia de git). No está desplegado todavía.

## Archivos

Todo vive en la raíz del repositorio:

- `index.html`, `style.css`, `mobile.css` (solo ≤ 760 px), `tokens.css` (generado), `app.js`, `catalog.js`, `motion.js`, `scenes-desktop.js`.
- `app.js` contiene las escenas comunes, el menú, Libros y el estado de apertura. `scenes-desktop.js` (recorrido de fotogramas del hero y cortinilla) se carga con `import()` solo en escritorio con movimiento; `catalog.js` al acercarse a `#catalogo`.
- `assets/`: `data/catalog.json`, `fonts/`, `img/`, `seq/` (145 fotogramas), `seq-m/` (73 verticales; solo `m001` se pide como póster), `js/boot.js` y `provenance.json`.
- `DESIGN.md` y `design/tokens.json`: sistema construido. `docs/B4-BRIEF.md`: contrato de dirección original. `docs/evidence/`: capturas de escritorio, móvil y sin movimiento.

## Comandos

```bash
node tools/preview-site.mjs      # http://127.0.0.1:8094/ (PORT para cambiarlo)
npm test                         # incluye tests/site.test.mjs
npm run tokens                   # regenera tokens.css desde design/tokens.json
npm run tokens:check             # falla si tokens.css está desactualizado
```

El servidor solo sirve `index.html`, los CSS y JS del sitio y `assets/` (sin `provenance.json`), con la CSP de producción y gzip. No sirve la API ni `docs/`. Para sitio más API: `npm run cf:dev`.

`tests/site.test.mjs` cubre los mensajes de WhatsApp, la codificación, el estado de apertura en hora de Monterrey, la existencia de los recursos, el rotulado de las recreaciones, la poda de relleno, los esqueletos y el contraste de los tonos.

## Peso

La primera vista carga el póster, las fuentes, CSS y JS (~0.35 MB). En escritorio, los fotogramas del recorrido (4.7 MB) se piden al quedar libre el navegador o al primer gesto; solo se conservan los fotogramas clave y una ventana alrededor del actual, y no se piden con movimiento reducido ni con ahorro de datos. En teléfono no se piden fotogramas (los 1.2 MB de `seq-m/` quedan en disco sin uso salvo el póster). El catálogo (160 KB de datos) se carga al acercarse a la sección.

## Qué no es

- El catálogo es de muestra (500 registros de prueba) y no consulta `/api/catalog`.
- Iti IA no está conectada a la interfaz.
- No hay precios, existencias, fechas ni reseñas.

Pendientes y decisiones: `CONTEXT.md` y `docs/CONTINUITY.md`.
