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
cultural, una ruta de exploración del catálogo y medios directos para preguntar
o planear una visita.

El resultado buscado no es completar una compra en línea: es provocar una visita
informada o una conversación concreta con la librería.

## Positioning

La experiencia une un recorrido reconocible por el espacio real con un catálogo
consultable e Iti IA, una ayuda contextual limitada a la información recuperada
del propio catálogo. No se posiciona como marketplace, ecommerce ni asistente
genérico.

## Operating Context

- La persona puede explorar el sitio antes de visitar la librería y confirmar
  existencias o detalles mediante WhatsApp.
- La agenda cultural comunica la existencia de actividades sin presentar fechas,
  cupos o estados que todavía no estén verificados.
- El catálogo y la conversación con Iti IA dependen de servicios internos que
  pueden no estar disponibles durante una visita al sitio; la superficie pública
  debe seguir orientando a la persona en esos estados.
- El recorrido audiovisual acompaña la entrada, la experiencia, la comunidad y
  la agenda; la lectura del catálogo y la información de visita deben permanecer
  calmadas y operables.

## Capabilities and Constraints

- `index.html` es la única superficie web pública y permanece como sitio estático
  mantenible con CSS local y JavaScript nativo.
- La búsqueda del catálogo usa una taxonomía controlada y el endpoint same-origin
  `/api/catalog`.
- Iti IA es una ayuda contextual del catálogo mediante `/api/ai/iti-ia`; no es una
  interfaz pública independiente.
- No existe un checkout público. La existencia de un libro siempre se confirma
  con la librería.
- No se publican precios, existencias, fechas, cupos, reseñas, alianzas o
  recomendaciones sin una fuente verificable.
- Los datos de prueba no pueden presentarse como inventario real.
- El movimiento es complementario: el contenido, la navegación y las acciones
  deben funcionar sin video.

## Brand Commitments

- El nombre público es Librería Itinerante y Más.
- La voz es cálida, culta y práctica.
- El espacio, su arquitectura y sus fotografías reales son parte de la identidad
  del producto y no deben sustituirse por una librería genérica.
- Claude Design conserva la autoridad de composición; Higgsfield aporta medios y
  movimiento, no producto, contenido ni arquitectura de interfaz.

## Evidence on Hand

- Fotografías del espacio real en `images/cinematic/real-space-*`.
- Siete fotogramas aprobados y medios optimizados en
  `images/cinematic/runtime/`.
- Fuente entregada por el usuario en `Documentación del proyecto Iti.zip`,
  preservada fuera de la superficie desplegable.
- Taxonomía controlada en `data/taxonomy.controlled.json`.
- Contrato de catálogo y recuperación en `docs/BOOK_DATA_AND_RAG.md`.
- No hay testimonios, métricas de éxito, inventario público completo ni promesas
  comerciales verificadas que puedan fabricarse para reforzar la página.

## Product Principles

1. Convertir curiosidad digital en una visita o conversación concreta.
2. Mantener la experiencia anclada en el espacio y los materiales reales.
3. Presentar únicamente información verificable y hacer visible la incertidumbre.
4. Usar el movimiento para orientar, nunca para bloquear lectura o acción.
5. Mantener catálogo e Iti IA útiles incluso cuando sus servicios fallen.

## Accessibility & Inclusion

La experiencia completa debe poder recorrerse con teclado, foco visible,
controles táctiles suficientes y estructura semántica. Debe respetar
`prefers-reduced-motion`, ahorro de datos y condiciones de batería baja, usando
fotogramas estáticos sin ocultar contenido ni acciones.
