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
cultural, los datos para visitarla (dirección, horario habitual y mapa) y medios
directos para preguntar por un libro o planear una visita.

El resultado buscado no es completar una compra en línea: es provocar una visita
informada o una conversación concreta con la librería.

## Positioning

La experiencia une un recorrido reconocible por el espacio real con una
conversación directa con la librería. El catálogo consultable e Iti IA (ayuda
contextual limitada al propio catálogo) están en pausa hasta contar con
inventario real y servicio publicado. No se posiciona como marketplace,
ecommerce ni asistente genérico.

## Operating Context

- La persona puede explorar el sitio antes de visitar la librería y confirmar
  existencias o detalles mediante WhatsApp.
- La agenda cultural comunica la existencia de actividades sin presentar fechas,
  cupos o estados que todavía no estén verificados.
- El horario habitual (lunes a sábado de 11:00 a 20:00, domingo cerrado) lo
  aportó Aldo el 27 de octubre de 2026 a partir de la ficha de Google Maps de la
  librería; los días festivos se confirman por WhatsApp.
- La composición Casa editorial aprobada el 27 de octubre de 2026 limita el
  recorrido audiovisual a un umbral de entrada breve. Experiencia y Galería
  usan papel y fotografía documental; Agenda usa verde profundo y Visita tinta
  opaca, con información y acciones siempre operables sin video.

## Capabilities and Constraints

- `index.html` es la única superficie web pública y permanece como sitio estático
  mantenible con CSS local y JavaScript nativo.
- Solo se publica `public/`, generada por `npm run build:public` con una allowlist
  de lo que `index.html` referencia; la raíz del repositorio nunca se publica.
- Catálogo e Iti IA están en pausa en `features/catalog-iti-ia/`: no se publican
  ni se enlazan. Vuelven solo con inventario real y backend publicado; al volver,
  conservan la taxonomía controlada y los endpoints same-origin `/api/catalog` y
  `/api/ai/iti-ia`.
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
- La dirección Casa editorial aprobada en `.impeccable/direction-casa-editorial.md`
  rige la composición vigente, conservando Playfair Display, Inter y la paleta
  de la librería. Higgsfield aporta medios generados y movimiento, no producto,
  contenido ni arquitectura de interfaz.

## Evidence on Hand

- Seis fotografías oficiales entregadas por Aldo: originales preservados en
  `_archive/reference-inputs/2026-10-27-official-interiors/` y doce derivados
  WebP sin ampliación en `images/gallery/oficial-*`. Dimensiones, rutas y hashes
  de origen constan en `docs/official-photo-derivatives.json`. Los originales no
  se publican. Las fotografías anteriores en `_archive/cinematic-process/real-space-*`
  permanecen como referencia histórica; la landing vigente usa el lote oficial.
  Solo las fotografías documentales pueden presentarse como «foto real».
- Siete fotogramas aprobados y medios optimizados en
  `images/cinematic/runtime/`: son recreaciones generadas con Higgsfield a partir
  de las fotos reales, y nunca se rotulan como fotografías. Los hitos posteriores
  se cargan al necesitarlos, incluidos los encuadres móviles de 04 a 07. El video
  es opcional desde 1024 px, después de interacción, sin autoplay ni loop; se
  conserva respaldo estático con movimiento reducido, ahorro de datos o batería
  baja y un control nativo para reducir movimiento.
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
5. No mostrar funciones que todavía no pueden cumplir lo que prometen.

## Accessibility & Inclusion

La experiencia completa debe poder recorrerse con teclado, foco visible,
controles táctiles suficientes y estructura semántica. Debe respetar
`prefers-reduced-motion`, ahorro de datos y condiciones de batería baja, usando
fotogramas estáticos sin ocultar contenido ni acciones.
