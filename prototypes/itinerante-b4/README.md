# Maqueta B.4 · Función de la casa

Prototipo aislado de la landing de Librería Itinerante y Más. No sustituye `index.html` ni se publica.

```bash
node prototypes/itinerante-b4/preview.mjs
```

Abre http://127.0.0.1:8094/. El servidor solo sirve `index.html`, `style.css`, `app.js` y `assets/`. BRIEF, DESIGN y la carpeta de evidencias no se exponen.

```bash
node --test prototypes/itinerante-b4/check.mjs
```

La prueba cubre los mensajes de WhatsApp, la codificación, el estado de apertura en hora de Monterrey, la existencia de los recursos y el rotulado de las recreaciones.

- `BRIEF.md`: contrato de dirección.
- `DESIGN.md`: sistema construido.
- `assets/provenance.json`: origen de cada imagen.
- `evidence/`: capturas de escritorio, móvil y sin movimiento del 29-oct-2026.

Peso: la primera vista carga el póster, las fuentes, CSS y JS (~0.35 MB). Los fotogramas del recorrido (4.7 MB en escritorio, 1.2 MB en teléfono) se piden al quedar libre el navegador o al primer gesto, solo se conservan los fotogramas clave y una ventana alrededor del actual, y no se piden con movimiento reducido ni con ahorro de datos. El catálogo (160 KB de datos) se carga al acercarse a la sección.
