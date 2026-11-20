# Pendientes de negocio (lo que solo Aldo puede responder)

Creado el 2026-11-19. **Regla:** el sitio solo dice lo que Aldo ha confirmado. Lo que no está aquí abajo contestado no se publica, ni como pregunta frecuente, ni como dato en el JSON-LD, ni como texto. Cuando Aldo responda un campo:

1. Escribe la respuesta en el campo «Respuesta de Aldo» (o en el chat; quien lo registre la copia aquí con la fecha).
2. Si es una pregunta frecuente, se añade un objeto a `assets/data/faq.json` (id, pregunta, respuesta en el tono de `PRODUCT.md`, «Voz y textos») y se corre `npm run faq`. `scripts/build-faq.mjs` rechaza hoy estos temas a propósito; al confirmarlos se quita su patrón de `PROHIBIDO` en el mismo cambio y se anota aquí.
3. Si es un dato del negocio que toca otro sitio (ficha de Google, JSON-LD), se actualiza ahí y se registra en `docs/DOMINIO.md`.

**Hechos confirmados hasta hoy** (lo único que puede decir el sitio): (a) con el consumo del café se puede quedar uno a leer en la sala; (b) si alguien busca una obra que no está, la librería puede pedirla (sin prometer ejemplar ni plazos); (c) el horario habitual y la dirección ya publicados; (d) el contacto es WhatsApp, Instagram, Facebook y correo; (e) los 41 libros son de editoriales independientes.

## A. Preguntas frecuentes por confirmar

Cada una con la redacción propuesta de la pregunta (como aparecería en Visita) y un campo vacío.

### A1. Formas de pago y tarjeta
- **Pregunta propuesta:** «¿Aceptan tarjeta?» y, si aplica, «¿Cómo puedo pagar?»
- **Falta saber:** si se acepta tarjeta de débito y crédito, efectivo, transferencia u otra forma; si hay mínimo de compra; si el café se paga igual que los libros.
- **Respuesta de Aldo:**

### A2. Factura
- **Pregunta propuesta:** «¿Dan factura?»
- **Falta saber:** si se factura, con qué datos y en cuánto tiempo debe pedirse (el día de la compra o después); a quién escribir.
- **Respuesta de Aldo:**

### A3. Accesibilidad del local
- **Pregunta propuesta:** «¿El local es accesible?»
- **Falta saber:** si hay escalones o rampa en la entrada y entre la sala y la barra; si una silla de ruedas o un andador pasa entre los libreros; si hay baño accesible. Es un dato que ayuda a decidir la visita: se pide en concreto, no como «sí/no».
- **Respuesta de Aldo:**

### A4. Estacionamiento
- **Pregunta propuesta:** «¿Hay estacionamiento?»
- **Falta saber:** si hay estacionamiento propio o convenio cercano, o dónde conviene dejar el coche en la calle; si conviene llegar en transporte público (qué ruta o estación queda cerca).
- **Respuesta de Aldo:**

### A5. Envíos
- **Pregunta propuesta:** «¿Hacen envíos?»
- **Falta saber:** si se envían libros y a dónde (Monterrey, país), con qué paquetería, a qué costo y cómo se pide (WhatsApp); si se entrega en mano en el área metropolitana.
- **Respuesta de Aldo:**

### A6. Tarjetas de regalo
- **Pregunta propuesta:** «¿Venden tarjetas de regalo?»
- **Falta saber:** si existen, de qué montos, si vencen y cómo se compran.
- **Respuesta de Aldo:**

### A7. Política de apartado
- **Pregunta propuesta:** «¿Puedo apartar un libro?»
- **Falta saber:** si se aparta, por cuánto tiempo, si requiere anticipo y cómo se pide. Hoy el sitio solo dice «Consultar disponibilidad» por WhatsApp: no promete ejemplar.
- **Respuesta de Aldo:**

### A8. Mascotas
- **Pregunta propuesta:** «¿Puedo ir con mi mascota?»
- **Falta saber:** si se admiten mascotas en la sala y en la barra y con qué condiciones (con correa, tamaño).
- **Respuesta de Aldo:**

### A9. Edad y niñas y niños
- **Pregunta propuesta:** «¿Pueden ir niñas y niños?» (y, si hay talleres con edad mínima, «¿Para qué edades son los talleres?»)
- **Falta saber:** si hay libros o actividades para niñas y niños, edad mínima de algún taller, si deben ir acompañados.
- **Respuesta de Aldo:**

### A10. ¿Dónde están? (decisión, no dato)
- **Estado:** omitida. La dirección, la calle de enfrente y el mapa ya están arriba en Visita; la pregunta repetiría el dato. Se añadiría solo si aporta algo distinto (por ejemplo, una referencia para encontrar la puerta).
- **Referencia para encontrar la puerta (opcional):**
- **Respuesta de Aldo:**

## B. Otros pendientes de esta entrega

### B1. Editorial «Libro Objeto» y el título sin editorial
- **Qué se ve:** el bloque «Editoriales» del Catálogo sale de `assets/data/catalog.json` tal cual: Abismos Casa Editorial (19), Iridiscencias (10), Capítulo Siete (10) y «Libro Objeto» (1). En la hoja, «Libro Objeto» está en la columna Editorial, pero puede ser un tipo de edición y no un nombre de editorial. Además, «Las ruinas de la caza» (Alfredo Leal) no trae editorial en la hoja, por eso la nota dice «4 editoriales · 40 de los 41 títulos».
- **Falta saber:** si «Libro Objeto» es una editorial o un formato; la editorial de «Las ruinas de la caza». Se corrige en la hoja «Catálogo Itinerante.xlsx» y se reimporta (`python3 scripts/import-inventario.py`); el bloque se regenera con `npm run editoriales`.
- **Respuesta de Aldo:**

### B2. Merch (artículos de la librería)
- **Falta:** el listado de artículos (nombre, tipo, precio, foto y texto alternativo, si se puede consultar o es por encargo). La plantilla y los comandos están en `docs/MERCH.md`. Mientras no haya productos válidos, la sección no existe en el sitio.
- **Respuesta de Aldo:**

### B3. Dominio de producción
- **Falta:** el dominio, y quién lo compra y registra (no se compra ni se registra desde este repositorio). Mientras tanto el sitio sigue con `noindex,nofollow`. El flujo está en `docs/DOMINIO.md`.
- **Respuesta de Aldo:**

### B4. Imagen para compartir (og:image)
- **Falta:** confirmar que la foto elegida de la casa y el logo (1200×630) son los que quiere que vean en WhatsApp, Instagram y Facebook al compartir el enlace.
- **Respuesta de Aldo:**

### B5. Ficha de Google Business Profile
- **Falta:** que Aldo (o quien administre la ficha) verifique que nombre, dirección y horario coinciden letra por letra con el sitio (ver «NAP» en `docs/DOMINIO.md`) y que decida si publica el teléfono de WhatsApp en la ficha. Falta también el **enlace de la ficha en Google Maps** (hoy el JSON-LD usa una búsqueda por nombre y dirección en `hasMap`; con el enlace de la ficha se sustituye) y si el WhatsApp es además el teléfono de voz de la librería (el JSON-LD lo publica como `telephone`, porque es el único número publicado).
- **Dirección distinta en los listados públicos (2026-11-20):** el sitio dice **Mariano Matamoros 421** (confirmado por Aldo con su enlace de Maps), pero los listados públicos de **Google, Waze y Facebook** y la ficha de **Capítulo Siete** todavía muestran **«Padre Mier 836A Pte.»**
  (la dirección anterior; la carta impresa de Café Itinerante también la trae). Hay que **unificar el NAP** (nombre, dirección, teléfono) en todos esos sitios con la dirección de Matamoros 421: Google Business Profile, Waze, la página de Facebook y, con Capítulo Siete, pedirles que corrijan su ficha. Mientras
  no coincidan, el sitio y los listados se contradicen y se debilita la ficha de Google. Esto lo hace quien administra cada ficha: no se corrige desde el repositorio. Dirección actual y NAP: `docs/DOMINIO.md`.
- **Respuesta de Aldo:**

### B6. Aviso de privacidad (mapa de Google)
- **Falta:** el texto del aviso de privacidad antes de encender la clave del mapa de Google (ver `docs/MAPA-GOOGLE.md` y `PRODUCT.md`).
- **Respuesta de Aldo:**

### B7. Franja de editoriales del Inicio: lista completa, vínculo y logos (2026-11-19)
- **Qué se ve:** en el Inicio, bajo la foto, una franja con las editoriales del catálogo: **Abismos Casa Editorial, Capítulo Siete e Iridiscencias**, con su nombre en tipografía
  (desde el 2026-11-20 se suman las colaboraciones de B8 y el rótulo es el de B8; sin colaboraciones sería «Editoriales en el catálogo»; debajo, «Ver los libros por editorial»). «Libro Objeto» no aparece hasta que se resuelva B1. Con menos de 3 editoriales la franja no se pinta.
  El sitio **no dice «aliadas», «socias», «oficiales» ni «distribuidores»**: solo que hay libros de esas editoriales en el catálogo.
- **Falta saber, 1: la lista completa.** ¿Con qué otras editoriales trabaja la librería además de las de los 41 títulos? Una franja de 3 nombres repetidos en bucle se ve corta; con 6 a 8
  nombres reales se ve como una franja de verdad. Se añaden importando sus libros a la hoja (`python3 scripts/import-inventario.py`) y corriendo `npm run editoriales`: la franja crece sola.
  Mientras no estén sus libros en el catálogo, no aparecen (la franja solo muestra editoriales con libros en `catalog.json`).
  - **Lista de editoriales con las que trabaja la librería:**
- **Falta saber, 2: qué vínculo se puede decir con verdad.** Para cada editorial: ¿la librería les compra directo, es distribuidora, consigna, o las consigue por un tercero? ¿Qué palabra
  aprueban ellas y Aldo («disponemos de sus libros», «trabajamos con», «distribuimos»…)? Mientras no se confirme, el rótulo se queda en «Editoriales en el catálogo».
  - **Vínculo que se puede decir (por editorial):**
- **Falta saber, 3: logos con permiso.** Para cada editorial, un logo en SVG (o PNG con fondo transparente) **y su permiso por escrito** para mostrarlo en el sitio. Qué pedirles y cómo cargarlo:
  `docs/EDITORIALES-LOGOS.md` (`python3 scripts/logo-editorial.py … --permiso "…"`, que registra quién lo autorizó). Sin permiso, el sitio sigue con el nombre en tipografía; nunca se copia un logo de internet.
  - **Logos con permiso (editorial · archivo · quién lo autorizó y cuándo):**
- **Respuesta de Aldo:**

### B8. Colaboraciones en la franja: cafeterías y espacios con evento conjunto, Liminal y el rótulo (2026-11-20)
- **Encargo de Aldo:** «Investiga a partir de Instagram las asociaciones que tiene la marca. Una era Tres Caminos, edición Tres Caminos, Liminal, todas las cafeterías con las que también tienen evento conjunto, y a partir de ello ponerlas como en el carrusel.»
- **Lo que NO se pudo verificar:** **Instagram no se pudo leer** (pide iniciar sesión y el acceso fue denegado; no se intentó saltarlo), así que **no hay ninguna cafetería en la franja**: no se inventó ninguna. Tampoco se pudo confirmar a Liminal por una fuente pública (ver abajo).
- **Qué se ve hoy** (en `assets/data/editoriales.json` → `colaboran`; la franja = editoriales del catálogo + `colaboran`, en ese orden):
  - **Ediciones Tres Caminos** (editorial): consta en público. Su página de Facebook (https://www.facebook.com/EdicionesTresCaminos/) agradece a quienes llenaron la Librería Itinerante y más el sábado 19 de julio para «Tarde de Letras VII» (evento conjunto). Esa publicación es la `fuente` (no se imprime).
  - **Liminal** (espacio: café-librería en el centro de Monterrey): lo nombra Aldo como colaboración; **no hay evento conjunto confirmado en fuentes públicas**, así que va **sin `fuente`**. Una nota de Telediario lo describe como librería con literatura japonesa y café, pero no habla de la colaboración.
  - Cada nombre, en tipografía (sin logos de terceros; el pipeline con `--permiso` sigue igual y ahora también admite los de `colaboran`). No son enlaces.
- **Redacción nueva, pendiente de aprobación de Aldo:** el rótulo de la franja con colaboraciones es **«Editoriales y espacios con los que compartimos libros y eventos»** (sin cifra; sin «aliadas», «socias», «oficiales», «distribuidoras», «asociadas», «patrocinadores» ni «gratis»; «en el catálogo» ya no era cierto de Liminal). Sin colaboraciones a la vista el rótulo vuelve a «Editoriales en el catálogo». Si Aldo prefiere otra redacción, se cambia `ROTULO_COLABORA` en `scripts/franja-datos.mjs` y se corre `npm run editoriales`.
- **Falta saber, 1: la lista de cafeterías y espacios con evento conjunto.** Para cada una: **nombre exacto** (como lo escriben en público), **cuál fue el evento** y **su fecha o la publicación de origen** (enlace de Instagram, Facebook o Luma). Se añaden como un objeto más a `colaboran` (`{ "nombre": "…", "tipo": "espacio", "fuente": "https://…" }`) y se corre `npm run editoriales`: no se toca HTML ni JS. Sin ese dato no se publica ninguna.
  - **Cafeterías y espacios (nombre · evento · fecha o enlace de la publicación):**
- **Falta saber, 2: confirmar Liminal.** ¿Hubo o hay evento conjunto, o es otro tipo de colaboración? ¿Está bien nombrarlo «Liminal» (nombre exacto) y con qué publicación se puede respaldar? Mientras no se confirme, el sitio lo nombra solo porque Aldo lo pidió; el rótulo no promete más que «compartimos libros y eventos».
  - **Liminal (qué se puede decir y dónde consta):**
- **Falta saber, 3: «Tres Caminos» y «edición Tres Caminos».** Aldo escribió «Tres Caminos, edición Tres Caminos». Se entendió como **Ediciones Tres Caminos** (la editorial). Si «Tres Caminos» es además otro espacio (por ejemplo un café), hay que decirlo y dar su nombre exacto; si es una sola, queda como está.
  - **Aclaración:**
- **Falta saber, 4: el rótulo.** Confirmar «Editoriales y espacios con los que compartimos libros y eventos» o dar otra redacción; y, para cada nombre, si se puede decir un vínculo más preciso (ver B7).
  - **Rótulo aprobado:**
- **Respuesta de Aldo:**
