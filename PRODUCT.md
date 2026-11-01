# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El usuario principal es una persona en Monterrey que quiere descubrir libros,
actividades y un espacio cultural independiente antes de decidir visitarlo. Su
trabajo principal es entender qué ofrece la librería, reconocer si el lugar es
para ella y abrir una conversación útil antes de trasladarse.

## Product Purpose

Librería Itinerante y Más conecta el descubrimiento editorial digital con una
visita al espacio físico. La superficie pública presenta la librería, su vida
cultural, un catálogo de muestra y medios directos para preguntar o planear una
visita.

El resultado buscado no es completar una compra en línea: es provocar una visita
informada o una conversación concreta con la librería.

## Positioning

La experiencia presenta la librería como una función de cine: un recorrido
reconocible por el espacio real que termina en una consulta por WhatsApp o en
una ruta a la casa. No se posiciona como marketplace, ecommerce ni asistente
genérico.

## Operating Context

- Estado: el sitio B.4 fue promovido a la raíz el 2026-11-01 y aún no está
  desplegado.
- La persona puede explorar el sitio antes de visitar la librería y confirmar
  existencias o detalles mediante WhatsApp (528180875940).
- Dirección: Mariano Matamoros Pte. 421, Centro, Monterrey. Horario habitual de
  lunes a sábado de 11:00 a 20:00; domingo cerrado; festivos por WhatsApp. El
  estado abierto o cerrado se calcula con la hora de Monterrey.
- La Cartelera comunica la existencia de actividades como propuestas, sin
  fechas, cupos o estados que todavía no estén verificados.
- El catálogo es una muestra estática de 500 registros de prueba con búsqueda
  local; no depende de ningún servicio para funcionar.
- El recorrido audiovisual acompaña la entrada y las secciones de la casa; la
  lectura del catálogo y la información de visita deben permanecer calmadas y
  operables.

## Capabilities and Constraints

- `index.html` es la única superficie web pública y permanece como sitio estático
  mantenible con CSS local y JavaScript nativo. No existe una segunda home; el
  sitio anterior está archivado en `_archive/models/higgsfield-d599d36a/`.
- Catálogo hoy: `assets/data/catalog.json` con búsqueda por autor, título, ISBN y
  editorial, filtros con conteo y ficha, todo en el navegador. Cada registro se
  rotula «Datos de muestra · no es inventario». No consulta `/api/catalog`.
- Iti IA existe como API en el Worker (`/api/ai/iti-ia`), pero **no está
  integrada en la interfaz**: el sitio no promete ni ofrece conversación con
  Iti IA. Conectarla y definir el contrato de datos del catálogo es trabajo
  pendiente.
- No existe un checkout público. La existencia de un libro siempre se confirma
  con la librería.
- No se publican precios, existencias, fechas, cupos, reseñas, calificaciones,
  alianzas ni recomendaciones sin una fuente verificable.
- Los datos de prueba no pueden presentarse como inventario real.
- Las imágenes se rotulan «Foto real» o «Recreación IA», sin excepción.
- El movimiento es complementario: el contenido, la navegación y las acciones
  deben funcionar sin video ni JavaScript de escenas.

## Brand Commitments

- El nombre público es Librería Itinerante y Más.
- La voz es cálida, culta y práctica.
- El espacio, su arquitectura y sus fotografías reales son parte de la identidad
  del producto y no deben sustituirse por una librería genérica.
- El sistema visual vigente es B.4 (`DESIGN.md`): cal cálida, ladrillo,
  turquesa de los libreros y tungsteno, con Archivo y una voz literaria en
  Bodoni Moda cursiva. El canon anterior (Claude Design y Higgsfield) es
  historia.

## Evidence on Hand

- Fotografías oficiales del espacio (`assets/img/oficial-*`) y recreaciones
  rotuladas; origen de cada imagen en `assets/provenance.json`.
- Secuencia de 145 fotogramas para escritorio (`assets/seq/`) y su versión
  vertical (`assets/seq-m/`).
- Catálogo de prueba en `assets/data/catalog.json` (fuente: CSV
  Amazon_BestSelling_Books_500, registros de prueba).
- Capturas de revisión en `docs/evidence/`.
- Fuente entregada por el usuario en `Documentación del proyecto Iti.zip`,
  preservada fuera de la superficie desplegable.
- Taxonomía controlada en `data/taxonomy.controlled.json` y contrato de catálogo
  en `docs/BOOK_DATA_AND_RAG.md` (los usa la API, no la UI actual).
- No hay testimonios, métricas de éxito, inventario público completo ni promesas
  comerciales verificadas que puedan fabricarse para reforzar la página.

## Product Principles

1. Convertir curiosidad digital en una visita o conversación concreta.
2. Mantener la experiencia anclada en el espacio y los materiales reales.
3. Presentar únicamente información verificable y hacer visible la incertidumbre.
4. Usar el movimiento para orientar, nunca para bloquear lectura o acción.
5. No prometer en la interfaz lo que todavía no está conectado.

## Accessibility & Inclusion

La experiencia completa debe poder recorrerse con teclado, foco visible,
controles táctiles suficientes y estructura semántica. Debe respetar
`prefers-reduced-motion`, ahorro de datos y el botón «Pausar el movimiento» del
pie, usando fotogramas estáticos sin ocultar contenido ni acciones.
