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
cultural, su catálogo (el inventario real) y medios directos para preguntar o
planear una visita.

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
- En el teléfono la primera vista es un perfil (nombre, estado de hoy, dirección
  y «Cómo llegar» como única acción de contacto) sin burbujas de historias (se
  retiraron el 2026-11-11). La navegación vive en una barra inferior de vidrio con
  **tres casillas** con nombre: Inicio, Catálogo y Mi lista; el resto de los
  destinos (Eventos y talleres, Novedades si hay llegadas, Café y té, La casa, Visita, el
  horario, WhatsApp y las redes) está en el menú ☰. El orden de la página es
  Inicio (con La casa), Catálogo, Eventos y talleres, Novedades (solo con
  llegadas), Café y té, Visita y pie. En Eventos y talleres (antes Cartelera), «Compartir» es
  local: no envía nada ni muestra contadores, reseñas o reacciones. «Me interesa»
  se retiró el 2026-11-13: no servía a la persona ni a la librería.
- Crítica minimalista aprobada por Aldo el 2026-11-13: cada cosa se dice una vez.
  El Catálogo va titular → «Buscar en el catálogo» → chips Narrativa · Poesía ·
  Ensayo → carrusel 3D → «Preguntar por {colección}» (sin «Pregúntanos»; el
  recorrido volvió ligero sobre los mismos chips el 2026-11-13: conector, palomita
  en las hojeadas y «N de 3 paradas hojeadas», un dato local, nunca un ranking); la rejilla de Explorar muestra los 41 títulos sin
  paginar, cada tarjeta con título y «autor · precio» (sin tarjeta que voltea); la
  ficha es una sola (sin «modo redes»); no hay cita, llamado suelto ni
  antetítulos; el pie no repite la dirección ni «Cómo llegar».
- Novedades es un capítulo propio que **solo existe con llegadas registradas**
  (crítica minimalista del 2026-11-13; antes mostraba el catálogo de la A a la Z
  bajo un titular que prometía otra cosa). Las llegadas se registran en
  `novedades.entradas` de `assets/data/collections.json`, un renglón por libro
  con `{ "id": "…", "llegada": "AAAA-MM-DD" }`; **se actualiza añadiendo renglones
  a ese archivo**, sin tocar HTML ni JS. Sin entradas válidas no existen la
  sección, su enlace de la barra, su fila del menú ni el control del inicio. Con
  entradas, la tira muestra esas llegadas (lo más reciente primero) y solo ellas
  pueden ser «Nuevo», con su punto y el control del inicio. Cada libro abre la
  ficha de siempre. No es un ranking ni una promesa de existencia.
- **Hoy la lista de llegadas está vacía** (la librería aún no registra fechas). La fecha no
  se imprime; solo ordena (lo más reciente primero) y decide qué lleva «Nuevo». Las cifras que
  se muestran con llegadas («3 llegaron en las últimas dos semanas», «3 novedades desde tu
  visita») son conteos reales de esa lista frente a la última vez que la persona vio la
  sección en su dispositivo: no se inventa ninguna.
- **Café y té** (`#cafe`, 2026-11-13): la carta de la sala en un carrusel (Café ·
  Té), con los cafés y tés habituales de cualquier cafetería que indicó Aldo. Es
  una **carta genérica sin precios** hasta que la librería los dé: con
  `precio: null` no se imprime nada de precio (ni «por confirmar»); cuando haya
  un precio real se muestra «$NN MXN» marcado como dato de la carta. Se edita en
  `assets/data/menu.json` sin tocar HTML ni JS (añadir «Para comer» es añadir un
  objeto); su origen queda en `assets/provenance.json` (`menuData`). La consulta
  es «Preguntar por la carta» por WhatsApp; sin fotos de producto.
- Eventos y talleres van en el mismo carrusel 3D que el Catálogo (2026-11-13):
  la propuesta del centro muestra su descripción y una sola fila de acciones
  («Preguntar por WhatsApp» y «Compartir»); las fechas siguen saliendo solo de
  `data-fecha` en el marcado.
- El precio de la hoja de la librería se muestra en la ficha, bajo el carrusel 3D del Catálogo
  y bajo cada tarjeta de la rejilla («autor · $250 MXN»); va marcado como dato de la hoja
  (`data-fuente="hoja"`) y la existencia se sigue confirmando por WhatsApp.
- El catálogo es el inventario real de la librería (41 libros) con búsqueda local;
  no depende de ningún servicio para funcionar.
- El recorrido audiovisual acompaña la entrada y las secciones de la casa; la
  lectura del catálogo y la información de visita deben permanecer calmadas y
  operables.

## Capabilities and Constraints

- `index.html` es la única superficie web pública y permanece como sitio estático
  mantenible con CSS local y JavaScript nativo. No existe una segunda home; el
  sitio anterior está archivado en `_archive/models/higgsfield-d599d36a/`.
- Catálogo hoy: `assets/data/catalog.json` (los 41 libros del inventario) con
  búsqueda por autor, título, editorial e ISBN, filtros de Género y Editorial con
  conteo y ficha, todo en el navegador. No consulta `/api/catalog`.
- Iti IA existe como API en el Worker (`/api/ai/iti-ia`), pero **no está
  integrada en la interfaz**: el sitio no promete ni ofrece conversación con
  Iti IA. Conectarla y definir el contrato de datos del catálogo es trabajo
  pendiente.
- No existe un checkout público. La existencia de un libro siempre se confirma
  con la librería.
- No se publican precios, existencias, fechas, cupos, reseñas, calificaciones,
  alianzas ni recomendaciones sin una fuente verificable.
- **Catálogo real (2026-11-12):** el catálogo es el inventario que la librería
  lleva en su hoja «Catálogo Itinerante.xlsx» (41 títulos de editoriales
  independientes). Título, autor, editorial, género, ISBN, sinopsis y precio
  salen de esa hoja; el precio es el de la librería y se muestra en la ficha,
  pero la existencia se sigue confirmando por WhatsApp. Se importa con
  `python3 scripts/import-inventario.py RUTA.xlsx`. Las portadas salen de bases
  públicas (Goodreads y Amazon), revisadas a mano una por una; su fuente queda en
  `data/portadas.json`. Sin portada encontrada, el libro usa la portada
  tipográfica. Los 500 registros de prueba ya no están en el sitio.
- Los datos de prueba no pueden presentarse como inventario real.
- La plantilla no imprime avisos de maqueta («Recreación IA», «Foto real», «Datos de
  muestra», «Imagen ilustrativa»): decisión de Aldo del 2026-11-10. La procedencia de
  cada imagen sigue registrada como dato (`data-kind` en el marcado y
  `assets/provenance.json`). Las recreaciones ya se sustituyeron por fotos reales de
  la casa (2026-11-10) y la muestra por el inventario real (2026-11-12).
- El movimiento es complementario: el contenido, la navegación y las acciones
  deben funcionar sin video ni JavaScript de escenas.

## Brand Commitments

- El nombre público es Librería Itinerante y Más.
- La voz es cálida, culta y práctica.
- El espacio, su arquitectura y sus fotografías reales son parte de la identidad
  del producto y no deben sustituirse por una librería genérica.
- El sistema visual vigente es «Itinerante Líquido» (`DESIGN.md`, desde el
  2026-11-13): la paleta del logo, turquesa (#7ac4b4) y blanco, con tema claro y
  oscuro automáticos; lo rústico de la casa vive en las fotos, no en los tokens.
  Minimalista al modo de Apple: la letra del sistema (Inter alojada de respaldo),
  la escala de Apple HIG y el vidrio solo en lo que flota, siempre con respaldo
  opaco. Nunito y Archivo, el sistema táctil y el canon anterior (Claude Design y
  Higgsfield) son historia.

## Evidence on Hand

- Fotografías reales de la casa en `assets/img/` (lote oficial, cuenta oficial de Instagram y
  fotos de Aldo; sin recreaciones desde 2026-11-10); origen de cada imagen en
  `assets/provenance.json`. La secuencia de fotogramas generados se retiró y el inicio es una
  foto fija.
- Inventario real en `assets/data/catalog.json` (41 libros importados de la hoja
  «Catálogo Itinerante.xlsx» de la librería; copia fiel en
  `data/inventario-itinerante.json`). Los registros de prueba del CSV de Amazon ya
  no están en el sitio.
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
