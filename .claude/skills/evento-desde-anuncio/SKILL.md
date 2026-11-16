---
name: evento-desde-anuncio
description: Rutina para pasar un anuncio de la librería (cartel o captura de Instagram, con su pie de publicación) a un evento del sitio en `assets/data/eventos.json`. Úsala cuando Aldo mande un cartel, una captura de Instagram o el enlace de una publicación y pida «sube este evento», «extrae los datos del anuncio», «agrega esta tarde de letras», «actualiza eventos con lo de Instagram» o parecido. Lee el cartel, normaliza fecha, hora, costo y reserva, comprueba incoherencias, pide confirmación con una tabla, prepara la imagen y publica. Nunca completa lo que el anuncio no dice.
---

# /evento-desde-anuncio — del cartel de Instagram al sitio

La librería anuncia sus eventos con carteles cuadrados en Instagram. Esta rutina convierte uno de esos anuncios en un renglón de `assets/data/eventos.json` sin inventar nada.

## 0. Qué se necesita

- **El cartel**: de preferencia el **archivo original** de la imagen. Una captura de pantalla sirve para leer los datos, pero trae la interfaz de Instagram encima (iconos de silencio, de etiquetas, barra de «me gusta») y no se publica tal cual.
- **El pie de la publicación completo** (el texto bajo la imagen). En la captura suele venir cortado en «… más»: pide el texto entero o trabaja solo con lo visible.
- Opcional: el enlace de la publicación (para `fuente`) y el enlace de Luma, si el registro va por Luma.

**Instagram no se puede leer solo.** El perfil exige iniciar sesión (comprobado el 2026-11-16: redirige a `accounts/login`) y no se intenta saltarlo. La rutina parte de lo que Aldo manda. La vía oficial para automatizarlo es la API de Instagram con una cuenta profesional y un token de la librería; mientras no exista, es manual.

## 1. Leer el cartel (estética habitual de la librería)

Los carteles siguen un patrón; busca cada dato en su sitio y anota **de dónde salió** (cartel o pie):

| Dato | Dónde suele estar | Campo |
|---|---|---|
| Nombre del evento, entre comillas y con número romano («Tarde de Letras XVII») | Cabecera, letra roja de máquina | `titulo` |
| «Desde la Librería Itinerante y Más» | Bajo el nombre | no se copia: es la sede |
| Ciclo, con asterisco («*Letras en vivo») | Segundo titular | `ciclo` (sin el asterisco) |
| Persona invitada | Sobre o junto al retrato | `invitado` |
| Quién conduce o imparte | Casi siempre **solo en el pie** de la publicación | `con` |
| Fecha y hora («21 / NOVIEMBRE / 26 - SÁBADO 6:57 P.M.») | Franja bajo el retrato | `fecha`, `hora` |
| «Covers: …» | Bajo la fecha | `costo` (un renglón por precio) |
| «Reserva por WhatsApp o llama al …» | Renglón rojo | `reserva` |
| Dirección | Pie del cartel | no se copia si es Matamoros 421; si es otra sede, avisa |
| Editorial o colectivo que acompaña (logo) | Esquinas inferiores | `colabora` |

## 2. Normalizar

- **Fecha** → `AAAA-MM-DD`. El año viene en dos cifras («26» = 2026).
- **Hora** → 24 h, `HH:MM`, **tal cual** («6:57 P.M.» = `18:57`; no se redondea). `fin` solo si el anuncio lo dice.
- **Costo** → lista de renglones con la redacción del cartel y «MXN»: `["$90 MXN entrada", "$120 MXN con libro en PDF", "$160 MXN con libro en físico"]`. Si no hay costo en el anuncio, el campo no existe (no se escribe «gratis» ni «entrada libre»).
- **Reserva** → `{ "tipo": "whatsapp", "telefono": "8115006246" }` (10 dígitos, sin guiones) o `{ "tipo": "luma", "url": "https://lu.ma/…" }`. Si el anuncio no dice cómo reservar: `null`.
- **Tipo** (Lectura, Taller, Charla, Presentación, Música, Juego…): solo si el anuncio lo dice o Aldo lo indica. No se deduce del retrato.
- **Descripción**: una o dos frases armadas **solo** con lo que dicen el cartel y el pie. Si el pie está cortado, no se completa.
- **`id`**: el título en minúsculas, sin acentos, con guiones (`tarde-de-letras-xvii`).

## 3. Comprobar antes de preguntar

1. **El día de la semana coincide con la fecha** (`python3 -c "import datetime; print(datetime.date(2026,11,21).strftime('%A'))"`). Si no coincide, hay una errata en el cartel: no elijas tú, pregunta.
2. **La fecha es futura** (hora de Monterrey). Un evento pasado no se publica.
3. **El teléfono de reserva** tiene 10 dígitos. Compáralo con el WhatsApp del sitio (`wa.me/52…` en `index.html`): si es otro número, dilo: puede ser el de quien organiza.
4. **Nombres propios** letra por letra contra el cartel y el pie (acentos incluidos). Si cartel y pie difieren, pregunta.
5. **Nada de lo que escribiste falta en el anuncio.** Repasa cada campo y su origen.

## 4. Confirmar con Aldo

Muestra una tabla campo · valor · de dónde salió, y debajo **solo las dudas reales** (dato ausente, incoherencia, texto cortado). No se publica sin su visto bueno a esa tabla.

## 5. La imagen

- Usa el **original**. Si solo hay captura, recorta el cartel sin la interfaz de Instagram; si algún icono cae sobre el cartel, pide el original antes de publicar.
- Guarda en `assets/img/eventos/<id>.webp`, lado mayor ≤ 1200 px, y regístrala en `assets/provenance.json` como real, con origen «cartel publicado por la librería en Instagram, aportado por Aldo» y la fecha.
- El evento lleva `"encuadre": "cartel"`: el sitio lo muestra entero y cuadrado, nunca recortado.
- El `alt` dice lo que anuncia el cartel: título, persona invitada, fecha y hora.
- Un cartel puede traer el **retrato de una persona** y **logos de terceros**. Es material que la librería ya publicó; aun así, confirma con Aldo que puede ir en el sitio.

## 6. Publicar

1. Añade el renglón a `assets/data/eventos.json` (formato y validador en `AGENTS.md`, apartado de `feed.js`).
2. `npm test` (valida fecha, hora, imagen registrada y reserva) y `node tools/qa/feed.mjs URL` contra una vista previa.
3. Mira Eventos y el inicio en iPhone 16 y en escritorio: destacado, bloque de fecha, costo, botón de reserva y el aviso «Próximo: …».
4. Commit, push y `main`, como cualquier cambio del sitio.

## 7. Después del evento

El sitio deja de mostrarlo solo cuando pasa su fecha. El renglón y su imagen se pueden quedar en el JSON como archivo, o borrarse en la siguiente carga.
