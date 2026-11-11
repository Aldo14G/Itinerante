# Itinerante B.4 · «Función de la casa»

> **Estado: promovido a la raíz el 2026-11-01.** B.4 es hoy el sitio canónico (`index.html` en la raíz) y sustituyó al sitio Higgsfield `d599d36a`, archivado en `_archive/models/higgsfield-d599d36a/`. Este brief conserva el contrato de dirección original; donde difiere de lo construido, la nota «Hoy» lo corrige. El sistema vigente está en `DESIGN.md` y `design/tokens.json`. Las rutas del antiguo directorio del prototipo ya no existen: archivos en la raíz, prueba en `tests/site.test.mjs`, servidor en `tools/preview-site.mjs`, capturas en `docs/evidence/`. El sitio aún no está desplegado.

Encargo de Aldo, 29-oct-2026: llevar la maqueta B.3 a una presentación de nivel Higgsfield (página «de más de $10,000»), con motion graphics, transiciones de la sección de libros y del llamado a la acción. Modo: **Persuade**. (Original: ruta aislada que no sustituía `index.html`; hoy sí lo sustituye. Sigue sin reactivar inventario ni integrar Iti IA.)

## Direction contract
**THESIS:** la librería se presenta como una función de cine: el visitante entra a la casa recorriéndola con su propio scroll y sale con una consulta o una ruta. Rechaza la retícula editorial crema + serif de B.3 y el escaparate de tarjetas iguales.

**OWN-WORLD:** paleta tomada de los muros y la luz: noche de piedra (#100d0a), hueso (#f1e8d8), tungsteno de lámpara (#f0b357), turquesa de los libreros (#34b3a5) como campo completo de la Cartelera, terracota del piso (#c45a3c) en acentos. *Hoy:* la noche de piedra ya no pinta ninguna sección; el sitio es claro, con el hero en cal `#fbf8f2` y tonos `light`, `sand` y `brick` por sección (ver `DESIGN.md`). La paleta nocturna queda como base de tokens y como historia. Archivo variable (anchura 62–125) en mayúsculas condensadas como cartón de título; Bodoni Moda itálica solo para una palabra de voz literaria. *Hoy (2026-11-11):* titulares y controles van en Nunito (sistema táctil de `DESIGN.md`), Archivo queda para el texto corrido y las portadas, y Bodoni Moda se retiró. El piso ajedrezado es el único motivo gráfico.

**STORY:** entrar (recorrido) → entender qué es (manifiesto) → mirar la casa cuarto por cuarto (tira de película, foto real vs. recreación rotulada) → ver qué la reúne (Cartelera, propuestas sin fecha) → elegir un tema y preparar la consulta de WhatsApp → resolver la visita con estado abierto/cerrado en hora de Monterrey.

**FIRST VIEWPORT:** fotograma a sangre del pasillo, fundido hacia la cal clara abajo (originalmente oscurecido). «ITINERANTE» condensado al ancho completo en la base; encima, una línea de propuesta, dirección + horario y dos acciones (Cómo llegar primaria tungsteno, WhatsApp secundaria). Cabecera con estado en vivo. Móvil: misma composición vertical, acciones antes del pliegue.

**FORM:** dirección fijada por el brief (Higgsfield + material real); **no se corrió la tirada de conceptos (concept-seed) ni se midió contra desafiantes**, y no hay semilla registrada. Code-led, sin comp aprobado. Interacción firma: secuencia de 145 fotogramas en canvas sincronizada al scroll solo en escritorio (en teléfono el hero es un póster fijo; los 73 fotogramas verticales de `assets/seq-m/` ya no se piden), con el nombre que se abre en anchura como una puerta. Gramática: cortinilla ajedrezada entre capítulos, revelados por máscara, tira horizontal fijada, palabra a palabra en el manifiesto, rodillo de letras al cambiar tema, marquesina ligada a velocidad. Catálogo de muestra (30-oct): búsqueda predictiva, filtros con conteo, orden, rejilla paginada y ficha en panel lateral, con datos de prueba rotulados y portadas propias (sin imágenes de terceros). Es un JSON estático local; no usa `/api/catalog`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Verdad y límites
- Fotos reales: `oficial-*` (lote oficial de Aldo). Fotogramas `0X-*` y la secuencia `seq/` son recreaciones Higgsfield: siempre rotuladas «Recreación IA».
- Cartelera: propuestas sin fecha, cupo ni costo; el CTA es consulta, no reserva.
- Horario habitual lun–sáb 11:00–20:00, domingo cerrado; festivos por WhatsApp.
- Sin precios, reseñas, métricas, inventario ni stock. El catálogo usa el dataset de prueba (500 registros de Amazon_BestSelling) y se rotula «Datos de muestra · no es inventario»; ninguna ficha afirma existencia. La existencia de un libro se confirma con la librería.
- Movimiento reducido / ahorro de datos / botón «Pausar el movimiento»: fotograma fijo, sin fijaciones ni marquesina; todo el contenido y las acciones visibles sin JS.
- Iti IA: existe como API en el Worker (`/api/ai/iti-ia`) pero no está conectada a esta interfaz.

## Cambio de dirección móvil (31-oct-2026)

Encargo de Aldo: la mayoría de la gente verá el sitio en el teléfono, así que en móvil (≤760 px) la experiencia pasa de «función de cine» a **app ligera con estilo liquid glass**, con patrones públicos de las apps de Meta/Instagram y de iOS (barra inferior, hojas, historias, chips), reconstruidos con nuestras fuentes e iconos. No se copia código, iconos ni tipografía de Meta (Instagram Sans es propietaria).

- **Se conserva** en escritorio todo el recorrido cinematográfico.
- **En móvil se reemplaza** el recorrido de fotogramas por un póster fijo (1 petición en lugar de 73, 1.0 MB menos), sin cortinilla ajedrezada. `app.js` no descarga `scenes-desktop.js` (recorrido y cortinilla) con ≤ 760 px.
- **Capa de controles** (única con vidrio): barra inferior de cuatro pestañas, icono de WhatsApp en la cabecera, hoja de la ficha. Nunca sobre el contenido ni sobre el canvas.
- Investigación y receta: ver DESIGN.md → «Móvil».
- Rendimiento móvil: `content-visibility: auto` solo en `.call` y `.visit`; esqueletos estáticos (sin destello) y vidrio sólido en gama media o baja.
