# Que el sitio se actualice solo desde la hoja de Google

Esta guía es para Aldo y para quien mantenga el sitio. Dice qué hace la automatización, qué hay que preparar **una sola vez** (son unos 40 minutos) y qué hacer cuando algo no sale.

## Qué hace

Cada 30 minutos, una **Acción programada de GitHub** lee la hoja de cálculo de la librería y:

1. **Libros.** Si hay un libro que antes no estaba en el catálogo, lo agrega al sitio y lo pone en **Novedades** con la fecha de ese día. Si un libro ya no está en la hoja, lo quita del catálogo y de Novedades.
2. **Eventos.** Lee la pestaña **Eventos** de la misma hoja. El evento con fecha más próxima aparece como destacado, los demás en la lista por día y los que ya pasaron se guardan como anteriores (24 meses). Un evento que desaparece de la hoja desaparece del sitio.
3. **Avisa por correo** a la cuenta oficial, **un solo correo por revisión** y solo si hay algo que decir: qué se publicó, qué fila no se pudo publicar y cómo corregirla.
4. Si todo está bien, sube los cambios al repositorio con un commit del «Itinerante Bot». Vercel o Cloudflare republican el sitio solos al llegar el commit. **Nadie tiene que avisarle a nadie cuál publicar.**

Lo que **no** hace: no escribe en la hoja, no pide permisos de edición, no guarda registros de asistentes ni cupos, no toca el diseño ni el código del sitio y no publica nada que no pase las mismas revisiones que el sitio ya tiene.

```
 Hoja de Google ──(cada 30 min)──▶ Acción de GitHub ──▶ pruebas ──▶ commit ──▶ sitio
 (libros + Eventos)                       │                                  
                                          └──▶ correo a la cuenta oficial
```

---

## Preparación (una sola vez)

### Paso 1. Convertir el `.xlsx` en una hoja de Google

La automatización lee una **hoja de Google**, no un archivo `.xlsx` suelto. Con la **cuenta oficial** de la librería:

1. Entra a <https://drive.google.com> y sube «Catálogo Itinerante.xlsx» (si ya está ahí, ábrelo).
2. Ábrelo con **Hojas de cálculo de Google** (clic derecho → *Abrir con* → *Hojas de cálculo de Google*).
3. En el menú: **Archivo → Guardar como hoja de cálculo de Google**.
4. Se crea una copia con el icono verde de Hojas. **De aquí en adelante la librería edita solo esa hoja.** El `.xlsx` original ya no se usa.
5. Copia el **ID de la hoja**: es el pedazo largo de la dirección del navegador entre `/d/` y `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`. Lo vas a necesitar en el paso 6.

La primera pestaña debe seguir siendo la de libros, con las columnas de siempre: **Editorial, Título, Autor, Precio, Sinopsis, Género, ISBN, Foto**, con los libros desde la fila 3 (las filas 1 y 2 son título y encabezados). Esa parte no cambia.

### Paso 2. Crear la pestaña «Eventos»

En la misma hoja, abajo a la izquierda, pulsa **＋** y ponle de nombre exactamente **Eventos**.

En la **fila 1** escribe estos encabezados (uno por celda, de la A a la Q). El orden y las mayúsculas o acentos no importan; los nombres sí:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Publicar | Título | Tipo | Fecha | Hora | Fin | Con | Invitado | Colabora | Ciclo | Descripción | Costo | Reserva | Cartel | Encuadre | Alt | Día |

Formato recomendado: selecciona la columna **Fecha** → *Formato → Número → Fecha*; las columnas **Hora** y **Fin** → *Formato → Número → Hora*. Así la hoja guarda fechas y horas de verdad (no texto) y no hay nada que adivinar.

**Un ejemplo de fila** (datos inventados, solo para ver cómo se llena):

| Publicar | Título | Tipo | Fecha | Hora | Fin | Con | Invitado | Colabora | Ciclo | Descripción | Costo | Reserva | Cartel | Encuadre | Alt | Día |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sí | Tarde de ejemplo | Lectura | 21/11/2026 | 6:57 p.m. | 8:30 p.m. | Persona Ficticia | Invitada Inventada | | Letras de ejemplo | Un evento inventado para ver cómo se llena la hoja. | `$90 MXN entrada` ⏎ `$120 MXN con libro` | `https://lu.ma/evento-de-ejemplo` | (enlace del cartel en Drive) | cartel | | sábado |

(Borra la fila de ejemplo antes de publicar de verdad; si se queda, sale en el sitio.)

#### Qué significa cada columna y cómo llenarla

| Columna | Obligatoria | Cómo llenarla |
|---|---|---|
| **Publicar** | no | `sí` o `no`. Vacío cuenta como `sí`. Con `no` el evento se **retira del sitio** sin borrar la fila (sirve para cancelar o esconder). |
| **Título** | sí | Tal cual lo anuncia la librería. |
| **Tipo** | no | Lectura, Juego, Taller, Charla… Solo si el anuncio lo dice. |
| **Fecha** | sí\* | Una fecha real de la hoja, o texto `AAAA-MM-DD` o `DD/MM/AAAA`. **Vacía = propuesta sin fecha** (sale al final como «Propuesta · sin fecha», sin botones). |
| **Hora**, **Fin** | no | Hora real de la hoja, o texto `18:57`, `6:57 p.m.`. Se publica **tal cual** (18:57, no 19:00). **Fin** debe ser posterior a **Hora**. Sin fecha no hay hora. |
| **Con** | no | Quien conduce o imparte. En el sitio sale «Con …». |
| **Invitado** | no | Sale «Invita a …». |
| **Colabora** | no | Sale «Colabora …» (solo en el evento destacado). |
| **Ciclo** | no | Por ejemplo «Letras en vivo». |
| **Descripción** | sí | Un párrafo corto, sin inventar nada que el anuncio no diga. |
| **Costo** | no | **Un renglón por línea dentro de la misma celda** (hasta 4): para saltar de línea en la celda pulsa **Alt+Enter** (Windows) u **Option+Enter** (Mac). Si no hay costo, déjala vacía: el sitio no escribe «gratis» por su cuenta. |
| **Reserva** | no | O un enlace de Luma (`https://lu.ma/…` o `https://luma.com/…`: botón «Registrarme») o un **teléfono de 10 dígitos** (se permiten espacios y guiones: botón «Reservar por WhatsApp»). Vacía = sin botón de reserva. Cualquier otra cosa se rechaza. |
| **Cartel** | no | El enlace de la imagen en Drive (ver paso 3) o su ID. Sin cartel, el evento se publica **sin foto**. |
| **Encuadre** | no | `cartel` si la imagen es un cartel con texto (se muestra entera); `foto` (o vacío) si es una foto a sangre. |
| **Alt** | no | Qué se ve en la imagen, para lectores de pantalla. Si falta en un cartel, se arma «Cartel: título, fecha, hora». |
| **Día** | no | `sábado`, `sáb`… Es un **seguro**: si el día no coincide con la fecha, la fila **no se publica** y llega un correo. Úsala siempre que copies la fecha de un cartel. |

\* «Fecha» debe existir como columna; la celda puede estar vacía.

**Revisiones que se hacen solas** (todas con el motivo exacto en el correo):

- Si la columna **Día**, el título o la descripción dicen «sábado 21» y la fecha cae en otro día, la fila se rechaza.
- Fecha que no existe (31/02), hora inválida, **Fin** antes de **Hora**, reserva que no es de Luma ni de 10 dígitos, costo de más de 4 renglones, falta de título o de descripción: la fila se rechaza y **las demás sí se publican**.
- Un evento con fecha pasada con `Publicar = sí` es válido: se guarda como anterior. Si tiene **más de 24 meses**, se omite.
- Dos filas con el mismo título y la misma fecha: la segunda se rechaza.

### Paso 3. Carteles: una carpeta de Drive

1. En Drive crea una carpeta (por ejemplo «Carteles de eventos») con la cuenta oficial.
2. Sube ahí las imágenes (JPEG, PNG o WebP, hasta 12 MB). La automatización las reduce a WebP de 1200 px de lado mayor sin recortarlas.
3. Clic derecho en la imagen → **Compartir → Copiar enlace** y pégalo en la columna **Cartel** de la fila.

Más abajo, en el paso 5, compartirás esta carpeta con la cuenta de servicio.

### Paso 4. Google Cloud: la «cuenta de servicio» (solo lectura)

Es un usuario robot que solo puede **leer** lo que se le comparta. No tiene acceso a nada más y no cuesta nada.

1. Entra a <https://console.cloud.google.com> con la cuenta oficial.
2. Arriba, selector de proyectos → **Proyecto nuevo** → nombre «itinerante-sync» → **Crear**. Asegúrate de que quede seleccionado.
3. Menú ☰ → **APIs y servicios → Biblioteca**. Busca y pulsa **Habilitar** en:
   - **Google Sheets API**
   - **Google Drive API**
4. Menú ☰ → **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**. Nombre «sync-hoja». En «Otorgar acceso» **no le des ningún rol** (déjalo vacío) → **Listo**.
5. Abre la cuenta recién creada. Verás su **correo**, que termina en `…iam.gserviceaccount.com`. **Cópialo**: lo necesitas en el paso 5.
6. Pestaña **Claves → Agregar clave → Crear clave nueva → JSON → Crear**. Se descarga un archivo `.json`. **Es un secreto**: no lo mandes por chat ni lo subas al repositorio.

### Paso 5. Compartir la hoja y la carpeta con la cuenta de servicio

Con la cuenta oficial:

1. Abre la hoja de Google → botón **Compartir** → pega el correo de la cuenta de servicio (`…iam.gserviceaccount.com`) → rol **Lector** → **Enviar** (desmarca «Notificar» si lo ofrece).
2. Haz lo mismo con la **carpeta de carteles** del paso 3 → **Lector**.

Con **Lector** el robot puede leer pero nunca modificar ni borrar.

### Paso 6. Gmail: la contraseña de aplicación (para los avisos)

Los correos de aviso salen por Gmail de la cuenta oficial.

1. Entra a <https://myaccount.google.com/security> con la cuenta oficial y activa la **verificación en dos pasos** (si no lo está).
2. Entra a <https://myaccount.google.com/apppasswords> (si no aparece, es que falta el paso anterior).
3. Nombre de la aplicación: «Itinerante sync» → **Crear**. Google muestra una contraseña de 16 letras. **Cópiala ahora**: no se vuelve a mostrar.

> La contraseña de aplicación da acceso para **mandar correo como la cuenta oficial**. Trátala como una llave. Si se filtra, se revoca en esa misma página y se crea otra.

### Paso 7. Guardar los secretos en GitHub

En el repositorio de GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Crea estos seis, uno por uno (nombre exacto):

| Nombre | Qué pegar |
|---|---|
| `GOOGLE_SA_KEY` | El **contenido completo** del archivo `.json` del paso 4 (ábrelo con un editor de texto, selecciona todo, copia y pega). |
| `HOJA_ID` | El ID de la hoja del paso 1. |
| `SMTP_USER` | El correo de Gmail de la cuenta oficial (el que mandará los avisos). |
| `SMTP_PASS` | La contraseña de aplicación del paso 6 (las 16 letras, con o sin espacios). |
| `AVISO_A` | A quién avisar. Puede ser la misma cuenta oficial; para varias, sepáralas con coma. |
| `SITIO_URL` | La dirección pública del sitio, para el enlace del correo (opcional, pero útil). |

Opcionales (en **Variables**, no en secretos, si algún día hacen falta): `HOJA_PESTANA_EVENTOS` (si la pestaña no se llama «Eventos») y `NOVEDADES_DIAS` (cuántos días se queda un libro en Novedades; por omisión 120).

### Paso 8. Probar: primero en simulacro, luego de verdad

1. En GitHub: pestaña **Actions → Sincronizar hoja → Run workflow**.
2. Marca la casilla **seco** («Simulacro: no escribe nada…») → **Run workflow**.
3. Cuando termine (1–2 minutos) abre la corrida y revisa el paso **«Leer la hoja y preparar los cambios»**: ahí está el informe de lo que **haría**. Si algo falla, el paso **«Avisar por correo»** imprime el correo que se mandaría y la sección «Errores comunes» de abajo dice qué hacer.
4. Cuando el simulacro se vea bien, repite **Run workflow** **sin** marcar «seco». Ahora sí escribe, pasa las pruebas, sube el commit y manda el correo.

> **La primera vez** el catálogo se toma como punto de partida («línea base»): los libros que ya estaban **no** se marcan como novedades. Solo los libros que se agreguen **después** entran a Novedades. Si la hoja de Google no es idéntica al catálogo actual del sitio (precios, sinopsis, un libro que falta…), el primer commit lo mostrará en la lista de cambios: revísala en el simulacro antes del real.

---

## Cómo se usa el día a día

- **Un libro nuevo:** agrégalo a la hoja de libros. En menos de 40 minutos sale en el catálogo y en Novedades. Si el libro no tiene portada registrada en el sitio, se ve con la portada tipográfica y el correo lo menciona; las portadas se registran aparte (con `data/portadas.json`) por quien mantiene el sitio.
- **Un evento nuevo:** agrega una fila a la pestaña **Eventos** (sube el cartel a la carpeta de Drive y pega su enlace). Si algo está mal, llega un correo que dice **qué fila** y **qué corregir**.
- **Cancelar un evento:** cambia **Publicar** a `no` (o borra la fila).
- **Cambiar un evento:** edita la fila. Ojo: el identificador del evento sale del **título + fecha**; si cambias el título o la fecha, el sitio lo trata como el mismo evento movido (se retira el anterior y se publica el nuevo).
- **Si una fila se rompe** (por ejemplo, borras sin querer la descripción) y ese evento ya estaba publicado, **sigue publicada la versión anterior** hasta que la corrijas.

### Qué correos llegan

| Asunto | Cuándo | Qué hacer |
|---|---|---|
| «Itinerante: se publicó 1 evento y 2 libros nuevos» | Se publicó algo. | Nada. Revisa que se vea bien. |
| «Itinerante: una fila de Eventos no se publicó» | Una fila tiene un error; el resto sí se publicó. | Corrige la fila que dice el correo. Se reintenta sola. |
| «Itinerante: se retiró 1 evento» | Un evento salió de la hoja o se puso `Publicar = no`. | Nada, a menos que fuera sin querer: vuelve a poner la fila. |
| «Itinerante: la sincronización se detuvo» | Algo impidió todo (hoja ilegible, catálogo sospechosamente chico, pruebas fallidas…). **No se cambió nada en el sitio.** | Mira la tabla de abajo. |

Un mismo problema **se avisa una sola vez**, no cada 30 minutos. Si no hay nada nuevo, no llega correo.

---

## Errores comunes y su solución

| Lo que ves | Qué pasó | Solución |
|---|---|---|
| `HOJA_ID no es una hoja de Google (parece un archivo .xlsx…)` | El ID es del `.xlsx` subido a Drive, no de la hoja de Google. | Paso 1: ábrelo y **Guardar como hoja de Google**; usa el ID de la copia nueva en `HOJA_ID`. |
| `Google respondió 403` / `404` al leer la hoja | La cuenta de servicio no tiene acceso, o el ID está mal. | Paso 5: comparte la hoja con el correo de la cuenta de servicio como **Lector**. Revisa `HOJA_ID`. |
| `Google respondió 403` con «API has not been used» / «accessNotConfigured» | Falta habilitar una API. | Paso 4.3: habilita **Google Sheets API** y **Google Drive API** en el mismo proyecto de la clave. |
| `GOOGLE_SA_KEY no es un JSON válido` | El secreto se pegó incompleto o con formato. | Vuelve a pegar **todo** el contenido del `.json` (desde la primera `{` hasta la última `}`). |
| `GOOGLE_SA_KEY no parece la clave JSON de una cuenta de servicio` | Se pegó otro archivo. | Crea una clave nueva (paso 4.6) y pégala. |
| `invalid_grant` al pedir el token | La clave se borró o la cuenta de servicio fue eliminada. | Crea una clave nueva (paso 4.6) y actualiza `GOOGLE_SA_KEY`. |
| `a la pestaña de Eventos le faltan encabezados: Título` (o Fecha) | Se renombró o se movió la fila de encabezados. | La **fila 1** de la pestaña debe tener «Título» y «Fecha». Restáuralos. La sincronización **se detiene** para no borrar eventos por error. |
| La hoja no tiene una pestaña «Eventos»: los eventos no se sincronizaron | La pestaña no existe o tiene otro nombre. | Créala (paso 2) o pon su nombre en la variable `HOJA_PESTANA_EVENTOS`. Los libros sí se sincronizan. |
| `el catálogo pasaría de 41 a N libros (menos de la mitad)` | Alguien borró filas de la hoja, o se cambió el orden de las pestañas. | Casi siempre es un error: restaura la hoja (*Archivo → Historial de versiones*). Si de verdad se redujo, corre el flujo a mano con la casilla **forzar**. |
| `el catálogo nuevo tiene N libros (el mínimo es 10)` | Hoja vacía o pestaña equivocada. | Revisa que la **primera pestaña** sea la de libros, con las columnas de siempre. |
| `el importador de libros falló` | Una columna de libros cambió de lugar o hay un dato raro. | Deja Editorial, Título, Autor, Precio, Sinopsis, Género, ISBN, Foto en ese orden, libros desde la fila 3. |
| Fila: `la fecha 21/11/2026 no cae en lunes (es sábado)` | La columna **Día** (o el texto) no coincide con la fecha. | Corrige la fecha o el día: el cartel manda. |
| Fila: `el texto dice «sábado 28», pero la fecha … cae en sábado 21` | La descripción menciona otra fecha. | Si es otra fecha a propósito, escríbela sin día de la semana («el 28 de noviembre»). |
| Fila: `la fecha «…» no se entiende` | La fecha es texto raro. | Usa una fecha real de la hoja, `AAAA-MM-DD` o `DD/MM/AAAA`. |
| Fila: `la hora «…» no se entiende` | Hora escrita de otra forma. | `18:57` o `6:57 p.m.`, o una celda con formato de hora. |
| Fila: `la reserva no es un enlace de Luma ni un teléfono de 10 dígitos` | Reserva con otro enlace (Eventbrite, Instagram…) o teléfono incompleto. | Solo Luma (`https://lu.ma/…`) o 10 dígitos. Si no hay reserva, déjala vacía. |
| Fila: `falta la descripción` / `falta el título` | Celda vacía. | Llénala. |
| Fila: `repetida: la fila N ya publica…` | Dos filas con el mismo título y fecha. | Borra o cambia una. |
| Aviso: «el enlace del cartel no se entiende» | La celda **Cartel** no tiene un enlace de Drive. | Pega el enlace de *Compartir → Copiar enlace* de la imagen. |
| Aviso sobre un cartel («Google respondió 404…», «no es una imagen JPEG, PNG o WebP», «pesa más de 12 MB», «no se pudo convertir») | La imagen no está compartida con la cuenta de servicio, pesa más de 12 MB o es otro formato (HEIC, PDF). | Mueve la imagen a la carpeta compartida (paso 5) y usa JPEG, PNG o WebP. El evento se publica sin foto mientras tanto. |
| `Las pruebas del sitio no pasaron con los datos nuevos` | Los datos de la hoja rompen una regla del sitio. **No se publicó nada.** | Abre la corrida en GitHub (el correo trae el enlace) y mira el paso «Puerta de calidad»; suele ser un dato raro en una fila. Pásaselo a quien mantiene el sitio. |
| `No se pudo subir el commit` | Alguien cambió la rama al mismo tiempo. | Se reintenta sola en 30 minutos. |
| No llegan correos | Faltan secretos, o la contraseña de aplicación se revocó. | En el registro del paso «Avisar por correo» dice `aviso no enviado: faltan SMTP_USER/SMTP_PASS/AVISO_A` o el tipo de error. Repite el paso 6 y 7. |
| El flujo ya no corre cada 30 min | GitHub **desactiva los flujos programados** de un repositorio público tras 60 días sin actividad. | Actions → «Sincronizar hoja» → **Enable workflow**. (En un repositorio privado no aplica.) |
| Un libro nuevo no sale en Novedades | Aún no pasan 30–40 min, o el libro se agregó con otro título que cambia su identificador. | Espera una corrida. Un libro cuyo título se **corrigió** (mismo ISBN) no cuenta como novedad: es el mismo libro. |

---

## Apagarlo y deshacerlo

- **Apagar:** en GitHub → **Actions → Sincronizar hoja → ⋯ (arriba a la derecha) → Disable workflow**. Para volver a prenderlo, **Enable workflow**. El sitio queda como estaba y se puede seguir editando a mano.
- **Deshacer un cambio:** cada sincronización es **un commit** («Sincroniza desde la hoja: N libros nuevos, M eventos»). Para revertir uno: en GitHub abre el commit → **Revert** (crea un commit que lo deshace), o `git revert <commit>` desde la computadora. Ojo: mientras el flujo siga prendido y la hoja siga igual, la siguiente corrida volverá a escribir lo mismo; apágalo o corrige la hoja antes.
- **Quitar un libro de Novedades sin tocar la hoja:** se quita su renglón de `assets/data/collections.json` (`novedades.entradas`); mientras el libro siga en el catálogo, la sincronización **no** lo vuelve a poner (solo marca como nuevo lo que acaba de llegar).

---

## Límites y riesgos (en claro)

- **Retraso:** hasta 30 minutos de espera más 5–10 minutos de despliegue; cuenta con **30–40 minutos** entre guardar en la hoja y verlo en el sitio. GitHub a veces retrasa las corridas programadas en horas de mucho tráfico.
- **Una persona edita la hoja = el sitio cambia.** No hay aprobación humana intermedia, solo las revisiones automáticas. Por eso existen las guardas (catálogo no menor a la mitad ni a 10 libros, pestaña de eventos con encabezados, pruebas del sitio) y las revisiones de fecha y día. No sustituyen el criterio: **revisa el correo de «se publicó»**.
- **La contraseña de aplicación de Gmail es un secreto** que permite mandar correo como la cuenta oficial. Se guarda solo como secreto de GitHub; si alguien con acceso al repositorio la ve en un flujo malintencionado, podría usarla. Limita quién tiene permiso de escritura al repositorio y revócala si hay dudas.
- **La cuenta de servicio solo lee** (rol **Lector** en la hoja y la carpeta, sin roles en el proyecto). Si su clave se filtra, solo se puede **leer** lo compartido con ella; se revoca en Google Cloud → Cuentas de servicio → Claves.
- **Si renombran columnas** de la pestaña Eventos (por ejemplo, «Título» → «Nombre del evento»), la sincronización **se detiene con un error claro** y no cambia nada. Si renombran otras columnas opcionales, esa información simplemente deja de leerse sin avisar: conserva los nombres de la tabla del paso 2.
- **Los eventos que no vienen de la hoja** (las tres propuestas de siempre, o lo que se suba con la rutina «evento-desde-anuncio») **no se tocan** ni se borran: la hoja solo gobierna los eventos que ella misma publicó.
- **Las portadas de los libros** no vienen de la hoja: se registran en `data/portadas.json`. Un libro nuevo sale con portada tipográfica hasta que alguien registre la suya.
- **Corridas programadas pausadas:** GitHub desactiva los flujos programados tras 60 días sin actividad en repositorios públicos (ver tabla).

---

## Para quien mantiene el código

- Piezas: `.github/workflows/sync-hoja.yml` (el horario, la puerta de calidad, el commit y el correo), `scripts/sync-hoja.mjs` (lee Google, valida y escribe), `scripts/import-inventario.py` (el importador de libros de siempre; acepta `--hoja` y la variable `ITI_RAIZ`), `scripts/imagen-evento.py` (cartel → WebP), `scripts/aviso-correo.py` (el correo) y `tests/sync.test.mjs`.
- **No escribe nada en el repositorio hasta tener todo listo:** trabaja en una carpeta temporal y copia solo lo que cambió, solo dentro de `assets/` y `data/`. La guarda del 50 %, el mínimo de 10 libros, la pestaña rota o el importador con error detienen todo (código de salida 2) sin escribir.
- **Marca de origen:** los eventos que publica la hoja llevan `"origen": "hoja"` en `eventos.json`; los demás no se tocan. La hoja manda sobre los suyos (si desaparece de la hoja, se retira del sitio, y su cartel y su renglón de `provenance.json` también). Los eventos con fecha de más de 24 meses se retiran del archivo.
- **Estado de avisos:** `data/sync-estado.json` guarda huellas de los problemas ya avisados para no repetir el correo en cada corrida. No contiene datos personales.
- **Probar sin credenciales:** `node scripts/sync-hoja.mjs --seco --fixtures tests/fixtures/sync --hoy 2026-11-16` (datos inventados, no escribe nada) y `python3 scripts/aviso-correo.py --seco`. Pruebas: `node --test tests/sync.test.mjs`.
- **Probar con la hoja real** desde una computadora: define `GOOGLE_SA_KEY` y `HOJA_ID` en el entorno y corre `node scripts/sync-hoja.mjs --seco`.
- **La puerta de calidad** corre `tests/site.test.mjs` con los archivos ya actualizados. Esa prueba debe aceptar eventos con fecha y con `"origen": "hoja"` (y, en estos, `imagen: null` cuando no hay cartel) en `assets/data/eventos.json`; si espera solo las tres propuestas de siempre, la puerta falla en cuanto la hoja publique el primer evento y **ningún evento llegará al sitio**.
- Nunca imprimas `GOOGLE_SA_KEY`, tokens ni correos en registros: `redact()` en `sync-hoja.mjs` oculta todo secreto registrado y la prueba de secretos lo verifica.
