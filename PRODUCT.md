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
  llegadas), Café y té, Visita y pie. En Eventos y talleres (antes Cartelera), «Compartir» (solo
  en el destacado) es local: no envía nada ni muestra contadores, reseñas o reacciones. «Me interesa»
  se retiró el 2026-11-13: no servía a la persona ni a la librería.
- Crítica minimalista aprobada por Aldo el 2026-11-13: cada cosa se dice una vez.
  El Catálogo va titular → «Buscar en el catálogo» → chips Narrativa · Poesía ·
  Ensayo → carrusel 3D (sin «Pregúntanos»; el
  recorrido volvió ligero sobre los mismos chips el 2026-11-13: conector, palomita
  en las hojeadas y el estado del recorrido —«3 paradas por recorrer», «Llevas N de 3 paradas», «Recorriste las 3 paradas» desde el 2026-11-18—, un dato local, nunca un ranking); la rejilla de Explorar muestra los 41 títulos sin
  paginar (en tableta y escritorio, plegada a dos filas con «Ver los 41 títulos» hasta que la persona la despliega, busca o
  filtra; no se esconde inventario ni se inventa orden), cada tarjeta con título y «autor · precio» (sin tarjeta que voltea); la
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
  último vistazo»; «vistazo» y no «visita» desde el 2026-11-18: la visita es a la casa) son conteos reales de esa lista frente a la última vez que la persona vio la
  sección en su dispositivo: no se inventa ninguna.
- **Café y té** (`#cafe`; parrilla por categorías desde el 2026-11-16, antes un carrusel): la
  carta de la sala, **transcrita de la carta impresa de Café Itinerante que mandó Aldo**:
  Cafés (con precio), Tés y aguas (los precios de los tés y de las «Aguas frescas»
  estaban tapados por una etiqueta en la foto: `precio: null`, no se imprime nada, ni «por
  confirmar»), Dulce (empanadas a $35 c/u, tarta del día $70) y Salado. Cada precio
  impreso se muestra «$NN MXN» marcado como dato de la carta; no se inventan platillos,
  descripciones ni precios. Se edita en `assets/data/menu.json` sin tocar HTML ni JS
  (añadir «Para comer» es añadir un objeto); su origen queda en `assets/provenance.json`
  (`menuData`). Sin fotos de producto todavía (cuando las haya, `foto` por producto). El cierre «Pídelo en la
  barra de la sala.» + «Cómo llegar» volvió el 2026-11-17: Aldo confirmó que el café se sirve en la
  librería (Matamoros 421; la carta impresa trae una dirección anterior, «Padre Mier 836A Pte.»).
  **Quedarse a leer en la sala va con el consumo del café** (decisión de Aldo, 2026-11-18): el
  sitio lo dice siempre con esa condición («Con tu café, puedes quedarte a leer en la sala.») y
  nunca promete «gratis».
- **Eventos y talleres** (2026-11-16: destacado y lista por día, antes un carrusel; datos en
  `assets/data/eventos.json`): solo se publica lo que el anuncio de la librería dice (fecha,
  hora, quién conduce, invitado, colaboración, costo tal como lo da), y lo que falta no se
  completa. **El registro es por enlace a Luma** («Registrarme», una página de Luma que
  se abre en otra pestaña) **o por WhatsApp** («Reservar por WhatsApp», con el mensaje ya
  escrito) cuando el anuncio lo dice; sin dato de reserva, sin botón. Es la excepción a «el
  contacto vive en el pie», por ser la función del objeto. **El sitio no guarda registros ni
  muestra cupos, asistentes ni «quedan N lugares»**; no carga nada de Luma (ni marcos ni
  scripts) y descarta un enlace de registro que no sea de Luma. Una propuesta sin fecha
  confirmada sigue diciendo «Propuesta · sin fecha» y no lleva reserva ni calendario. Cada
  evento con fecha ofrece «Añadir al calendario» (un archivo `.ics` armado en el
  navegador) y, el destacado, «Compartir» (local). El próximo evento vigente se avisa
  en el inicio («Próximo: Sáb 21 nov · título») y con un punto en «Eventos».
  **El sitio muestra lo reciente y archiva 24 meses** (2026-11-16): un evento que ya
  pasó se muestra en «Eventos anteriores» (solo título, fecha, tipo, quién y la
  portada; sin reserva, calendario ni costo) durante 24 meses y luego deja de
  mostrarse; Novedades muestra solo las llegadas de los últimos 45 días. Ni lo uno
  ni lo otro muestra asistentes, cupos ni «quedan N lugares»; no se anuncia nada que
  no esté en los datos.
- **Contacto en un solo lugar** (decisión de Aldo, 2026-11-13: «Los contactos irán
  en un solo lugar específico para no sobresaltar el área»): el pie es el bloque
  «Contacto» (WhatsApp, Instagram, Facebook y Correo, con la línea «Escríbenos para
  preguntar por un libro, la carta o la próxima fecha de un taller.»). Inicio,
  Catálogo, Eventos, Café y Visita no repiten llamados a WhatsApp; «Cómo llegar»
  sigue como la acción primaria. Conservan su WhatsApp, por ser la función de su
  objeto, la ficha del libro (confirmar existencia), «Reservar por WhatsApp» en el
  evento que lo trae (2026-11-16), «Enviar mi lista por
  WhatsApp», la salida del estado vacío y del error de Explorar, y la fila de
  contacto del menú ☰; el enlace «Instagram» de la entradilla de Eventos dice dónde
  se anuncian las fechas.
- El precio de la hoja de la librería se muestra en la ficha, bajo el carrusel 3D del Catálogo
  y bajo cada tarjeta de la rejilla («autor · $250 MXN»); va marcado como dato de la hoja
  (`data-fuente="hoja"`) y la existencia se sigue confirmando por WhatsApp.
- **Preguntas frecuentes, Editoriales y Merch (2026-11-19; aprobado por Aldo).** *Preguntas frecuentes* (en Visita, tras el mapa y la foto): solo respuestas
  confirmadas —quedarse a leer con el café (sin «gratis»), pedir la obra que no está (sin plazos ni promesa de ejemplar), el horario y los festivos que ya publica
  el sitio—; lo que falta (pagos, factura, accesibilidad, estacionamiento, envíos, tarjetas de regalo, apartado, mascotas, edad) está en
  `docs/PENDIENTES-NEGOCIO.md` con su redacción propuesta y un campo vacío para la respuesta de Aldo. *Editoriales* (dentro del Catálogo, sin entrada en la barra):
  las editoriales reales del inventario con su número de títulos; cada una abre Explorar con su filtro. *Merch* (**oculto hasta tener productos**): artículos de la
  librería con la misma regla de verdad del catálogo —nunca se afirma existencia: «Consultar disponibilidad» por WhatsApp con el producto y su precio ya escritos—;
  sin productos válidos no existen ni la sección ni sus enlaces (`docs/MERCH.md`).
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
- La voz es cálida, culta y práctica; su guía está en «Voz y textos», abajo.
- El espacio, su arquitectura y sus fotografías reales son parte de la identidad
  del producto y no deben sustituirse por una librería genérica.
- El sistema visual vigente es «Itinerante Líquido» (`DESIGN.md`, desde el
  2026-11-13): la paleta del logo, turquesa (#7ac4b4) y blanco, con tema claro y
  oscuro automáticos; lo rústico de la casa vive en las fotos, no en los tokens.
  Minimalista al modo de Apple: la letra del sistema (Inter alojada de respaldo),
  la escala de Apple HIG y el vidrio solo en lo que flota, siempre con respaldo
  opaco. Nunito y Archivo, el sistema táctil y el canon anterior (Claude Design y
  Higgsfield) son historia.

## Voz y textos (curaduría del 2026-11-18; decisiones de Aldo)

Pedido de Aldo: «Deben ser textos que acompañen al lector o al usuario, no nada más una explicación de "esta es una
imagen"… Algo que acompañe al proyecto y que sea orgánico.» Regla madre: **el texto acompaña lo que la persona hace
en ese momento** (hojear, elegir, guardar, venir, quedarse); no explica la pantalla ni repite la foto.

**La página está dedicada únicamente a la divulgación del negocio**: libros, eventos y talleres, y el café.

| # | Principio | Así no | Así sí |
|---|---|---|---|
| 1 | **Acompaña el momento, no la pantalla.** Cada texto responde «¿qué estoy haciendo y qué sigue?». | «Así se ve llegar a la sala» | «Pasando el arco está la sala, con la barra del café.» |
| 2 | **Un pie de foto acompaña lo que la persona hace en ese espacio** (hojear, leer con su café, los eventos y talleres). El nombre del cuarto orienta; la línea de abajo acompaña. Si no hay nada verdadero que acompañar, va solo el nombre. La decoración (gong, ajedrez, globo terráqueo) no es el foco. El `alt` es otra cosa: describe la imagen. | «El globo terráqueo» + «Por si la novela te lleva lejos…» | «Los libreros» + «Recorre los lomos; si no alcanzas uno, pide ayuda.» |
| 3 | **Habla la casa, en «nosotros»; tú eres quien lee.** | «La librería confirma si lo tienen.» (además, sin concordancia) | «Antes de venir, te confirmamos si lo tenemos.» |
| 4 | **Un dato verdadero vale más que un adjetivo.** Nada se inventa; si una línea necesita un dato que no tenemos, se escribe sin él o se queda como estaba. | «…en una casa de piedra del centro de Monterrey» | «Libros de editoriales independientes, café, eventos y talleres en el centro.» |
| 5 | **Cada titular toma postura.** El patrón «Nombre *frase*» funciona cuando la frase dice algo de esta casa; un lugar («en la sala») no es una frase. | «Café y té *en la sala*» | «Café y té *para quedarse un rato*» (con su condición en la entradilla) |
| 6 | **Empieza por lo que sí.** En estados vacíos y esperas, primero el para qué o la salida. | «No hay títulos con esa combinación.» · «0 de 3 paradas hojeadas» | «No está en el catálogo, pero te lo podemos pedir.» · «3 paradas por recorrer» |
| 7 | **Los controles son literales; la voz vive alrededor.** Botones, filtros, rótulos de ficha y avisos de sistema dicen su acción y nada más. | Cambiar «Preguntar por WhatsApp» por «Platiquemos» | Botón «Preguntar por WhatsApp»; al lado: «Escríbenos por WhatsApp: te ayudamos a buscar tu libro o a pedirlo.» |
| 8 | **Corto y medido para el teléfono.** Una idea por frase; la frase del titular cabe en un renglón a 393 y 375 px; sin muletillas («descubre», «sumérgete», «experiencia», «único», «ideal»), sin superlativos, sin emojis. | — | Se mide con Playwright antes de publicar (titulares, botones y entradillas a 393 y 375). |

**Lo que se dice** (datos verdaderos que acompañan):
- **Libros de editoriales independientes**, café, eventos y talleres.
- **En el centro** (de Monterrey). Sin fechas ni «desde…».
- **Quedarse a leer en la sala va con el consumo del café**: siempre con la condición («con tu café»), nunca «gratis».
- **Libros sobre pedido**: si alguien busca una obra que no está en ese momento, la librería se la puede pedir. Se dice donde
  acompaña (estado vacío y error de Explorar, cierre del Catálogo), sin plazos ni precios: «te lo podemos pedir».
- La existencia se confirma con la casa: en la ficha, el botón **«Consultar disponibilidad»** (WhatsApp con el mensaje ya escrito; decisión de Aldo del 2026-11-19, que retiró la nota «Antes de venir, te confirmamos si lo tenemos.» porque el botón ya lo dice). Que un libro esté en el catálogo no dice que haya ejemplar: nada dice «disponible» ni «en existencia».
- Sin resultados en Explorar: «No encontramos coincidencias para «…».» y «te lo podemos pedir» (sin plazos), o, con filtros, «Quitar filtros» primero.

**Lo que no se dice**:
- «Itinerante» es solo el nombre y el logo: nada del origen del nombre, de viajes ni de «almas viajeras».
- Ni «Barrio Antiguo», ni fechas de llegada a la casa, ni «desde…».
- La casa no se describe como rústica, de piedra o antigua, ni se cuenta qué fue antes (las fotos y sus `alt` muestran lo
  que se ve; el texto habla del negocio).
- Los textos de los eventos son de la librería (`assets/data/eventos.json`): no se reescriben; solo sus `alt`, que deben
  coincidir con `index.html`.

Inventario y tabla de cambios de la curaduría: `DESIGN.md`, «Curaduría de textos».

### Decisiones del 2026-11-19 (Aldo)

1. Ficha: «Consultar disponibilidad» al WhatsApp real; se retira «Antes de venir, te confirmamos si lo tenemos.».
2. Ajedrez: el pie de La casa queda solo «Ajedrez» (sin línea) hasta que haya actividades confirmadas.
3. Entrada animada: solo en la primera visita, breve y sin bloquear la navegación; se omite con movimiento reducido, «Pausar el movimiento», ahorro de datos y al abrir un enlace directo a una sección o ficha.
4. Pasillo: su `alt` describe lo observable sin el patio ni repetir el pie.

### Decisiones posteriores del 2026-11-19 (Aldo)

5. Barra inferior: vuelve la cápsula flotante (la anclada se retiró). Catálogo lleva al mismo sitio (`#libros`) desde todas las entradas.
6. Mapa de Visita con Google (Maps Embed API, modo `place`) cuando Aldo cree la clave; mientras tanto, el mapa SVG de OpenStreetMap. **Qué implica para quien visita:** con la clave puesta, al llegar a Visita el navegador carga una página de Google dentro del sitio; Google puede recibir la IP y el agente del navegador y guardar cookies propias (de terceros). El sitio no guarda nada de eso. **Pendiente de negocio: un aviso de privacidad** que lo diga antes de encender la clave (qué se carga, de quién y que la dirección y «Cómo llegar» no dependen de ello). Pasos de la clave: `docs/MAPA-GOOGLE.md`.

### Decisiones del 2026-11-19 (tercera tanda, Aldo)

Hechos confirmados por Aldo hasta hoy —**lo único que puede decir el sitio**—: (a) con el consumo del café se puede quedar uno a leer en la sala; (b) si alguien busca una obra que no está, la librería puede pedirla (sin prometer ejemplar ni plazos); (c) el horario habitual y la dirección ya publicados; (d) el contacto es WhatsApp, Instagram, Facebook y correo; (e) los 41 libros son de editoriales independientes. Nada más sobre pagos, factura, accesibilidad, estacionamiento, festivos (el sitio ya dice «¿Vienes en día festivo? Pregúntanos antes por WhatsApp.»), envíos, merch o tarjetas de regalo.

1. **Preguntas frecuentes** dentro de Visita (`details/summary` nativos, desde `assets/data/faq.json`), solo con respuestas verdaderas; lo no confirmado queda como pendiente documentado (`docs/PENDIENTES-NEGOCIO.md`), nunca como texto del sitio.
2. **Editoriales** dentro del Catálogo (sin entrada en la barra, el ☰ ni la barra inferior), con datos reales de `catalog.json`; con menos de 3 editoriales no se pinta.
3. **Merch** preparado y oculto hasta tener productos; el sitio nunca afirma existencias.
4. **Marca y SEO listos para el dominio, sin dominio**: el sitio sigue con `noindex,nofollow` a propósito; `scripts/set-dominio.mjs` lo retira solo con `--indexar`; no se compra ni se registra ningún dominio desde el repositorio (`docs/DOMINIO.md`).

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
`prefers-reduced-motion`, ahorro de datos y el interruptor «Pausar el movimiento»
(al pie de la página y al final del menú ☰), usando fotogramas estáticos sin ocultar contenido ni acciones.
