# Librería Itinerante Design Standard

> Fuente de verdad visual. La composición canónica es el prototipo `Itinerante Home cinematico.dc.html` de Claude Design. Higgsfield aporta únicamente el recorrido, los posters y el movimiento, sin reemplazar la identidad ni la arquitectura local.

## Posicionamiento

Librería Itinerante y Más es una librería cultural independiente de Monterrey. La interfaz debe sentirse cercana, clara y memorable: un recorrido documental por el espacio real que conduce a libros, actividades, catálogo y visita.

## Dirección bloqueada

- Paleta: turquesa `#5dc4b4`, verde profundo `#0d4a45`, tinta `#061a18`, menta `#9de3da`, papel `#fdfcf8` y ámbar `#e8a020` sólo como acento.
- Tipografía: Playfair Display para titulares y momentos editoriales; Inter para lectura, navegación y controles.
- Composición: capítulos numerados, superficies verde profundo, jerarquía editorial, fotografía real y tarjetas translúcidas contenidas.
- Movimiento: una toma continua controlada por scroll, con poster estático y salida completa para movimiento reducido.
- Voz: cálida, culta y práctica. Nunca estética SaaS, marketplace, IA genérica ni plantilla saturada.

## Jerarquía de fuentes visuales

1. Fotografías reales en `images/cinematic/real-space-*`.
2. Medios web aprobados y optimizados en `images/cinematic/runtime/`.
3. Composición preservada en `Itinerante Home cinematico.dc.html`, dentro de `_archive/root-loose/Documentación del proyecto Iti.zip`.
4. La extracción `_archive/imports/higgsfield-d599d36a-2026-08-29/` es referencia de medios y mecánica, no de layout o contenido.
5. `_archive/models/mixed-legacy-index-2026-09-04.html` conserva una referencia funcional, pero no vuelve a producción como monolito.

## Componentes

- Navegación: lockup compacto, una acción destacada de WhatsApp y una barra única de cuatro capítulos numerados.
- Recorrido: `scroll-scrub` de pantalla completa compartido por Entrada, Experiencia, Comunidad y Agenda; el video no reproduce solo y su tiempo sigue el scroll nativo, con siete fotogramas locales como hitos y respaldo.
- Experiencia: introducción editorial y cuatro maneras de habitar la librería.
- Agenda: lista sobria sin fechas, cupos ni estados inventados.
- Galería: mosaico de cinco vistas del espacio real.
- Catálogo: búsqueda y taxonomía controlada; existencia siempre confirmada con la librería.
- Iti IA: acceso persistente mediante píldora flotante (icono + etiqueta, 56 px); el diálogo permanece modal y contextual —se abre desde el hero, el catálogo o la píldora—, nunca una conversación flotante permanente. Cada recomendado ofrece "Ver ficha" hacia la obra.
- Visita: dirección y dos acciones directas, mapa y WhatsApp.

## Accesibilidad y rendimiento

- Controles de al menos 44 px, foco visible, HTML semántico y texto alternativo específico.
- Sin autoplay, sonido, secuestro de scroll ni `transition: all`.
- Respetar `prefers-reduced-motion` y `Save-Data`; mantener poster antes y en lugar del video.
- Cargar recursos posteriores de forma diferida y conservar el catálogo como DOM normal.
- No integrar SDKs ni llamadas a dominios de Higgsfield en producción.

## Datos y verdad

No publicar precios, existencia, fechas, cupos, reseñas, calificaciones, alianzas ni recomendaciones sin fuente verificable. Los fixtures deben identificarse como datos de prueba y jamás presentarse como inventario.
