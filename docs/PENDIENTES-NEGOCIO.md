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
- **Falta:** que Aldo (o quien administre la ficha) verifique que nombre, dirección y horario coinciden letra por letra con el sitio (ver «NAP» en `docs/DOMINIO.md`) y que decida si publica el teléfono de WhatsApp en la ficha.
- **Respuesta de Aldo:**

### B6. Aviso de privacidad (mapa de Google)
- **Falta:** el texto del aviso de privacidad antes de encender la clave del mapa de Google (ver `docs/MAPA-GOOGLE.md` y `PRODUCT.md`).
- **Respuesta de Aldo:**
