# Logos de editoriales para la franja del Inicio

Creado el 2026-11-19 (encargo de Aldo: una franja de editoriales en el Inicio al modo de la franja de marcas de Vercel).

**Estado hoy: sin logos.** La franja usa el **nombre de cada editorial o espacio en tipografía** (Inter / letra del sistema, peso 600), que es un dato verdadero:
sale de `assets/data/catalog.json` (campo `p`) y, desde el 2026-11-20, de `colaboran` en `assets/data/editoriales.json`. Los logos son marcas de terceros: **no se descargan ni se copian de internet** y no hay ninguno autorizado.

## Qué dice y qué no dice el sitio

- Dice, con colaboraciones (hoy), «Editoriales y espacios con los que compartimos libros y eventos» (sin cifra; redacción **pendiente de aprobación de Aldo**, `docs/PENDIENTES-NEGOCIO.md`, B8) y los nombres;
  sin colaboraciones, «Editoriales en el catálogo». Debajo, «Ver los libros por editorial», que lleva al bloque «Editoriales» del Catálogo.
- **No dice «aliadas», «socias», «oficiales», «distribuidoras», «asociadas», «patrocinadores» ni «gratis»**: no sabemos el vínculo exacto con cada nombre. Aparecer en la franja significa
  una de dos cosas: hay libros de esa editorial en el catálogo, o la librería la nombra como colaboración (`colaboran`).
- Cuando Aldo confirme el vínculo, se pregunta si se puede decir y cómo (ver `docs/PENDIENTES-NEGOCIO.md`, B7) antes de tocar el rótulo.

## Qué editoriales aparecen

Las del catálogo, derivadas por `editorialesDe` (`catalog.js`), **menos** las de `excluir` en `assets/data/editoriales.json`. Hoy se excluye «Libro Objeto»:
puede ser un formato y no una editorial (pendiente B1). La franja crece sola cuando se importan más libros (`python3 scripts/import-inventario.py`, después
`npm run editoriales`). Con menos de 3 editoriales no se pinta nada.

## Colaboraciones: editoriales y espacios fuera del catálogo (2026-11-20)

`assets/data/editoriales.json` → `colaboran`: lista de `{ "nombre", "tipo": "editorial" | "espacio", "fuente"?: "https://…" }`. Van **después** de las del catálogo, en el orden del archivo.

- **Añadir una cafetería u otro espacio** = añadir un objeto y correr `npm run editoriales`: no se toca HTML ni JS. Ejemplo: `{ "nombre": "Nombre exacto", "tipo": "espacio", "fuente": "https://…" }`.
- **Solo entra lo que Aldo confirma o consta en una publicación pública.** La `fuente` (no se imprime) es esa publicación; sin fuente pública va sin el campo y se anota en `docs/PENDIENTES-NEGOCIO.md` (B8). Instagram pide sesión: lo que solo se vea ahí lo trae Aldo.
- Hoy: **Ediciones Tres Caminos** (editorial; fuente: su página de Facebook, que agradece a quienes llenaron la librería el sábado 19 de julio para «Tarde de Letras VII») y **Liminal** (espacio; sin fuente pública).
- Postel: una entrada torcida (sin nombre, `tipo` distinto, no es objeto) se ignora; una `fuente` que no sea https se pierde pero la entrada se queda; un nombre repetido (mayúsculas, acentos y espacios no distinguen) cuenta una vez;
  una que ya es editorial del catálogo no se repite; las de `excluir` no aparecen. `editorialesLogosProblems` (y `npm run editoriales`) le dice a quien edita qué está torcido.
- Con colaboraciones a la vista, el rótulo es «Editoriales y espacios con los que compartimos libros y eventos»; sin ellas, «Editoriales en el catálogo». El mínimo de 3 cuenta lo que se ve.
- Un logo de una colaboración se carga igual (`logo-editorial.py` acepta su nombre) y **con permiso del espacio o la editorial**.

## Qué pedir a cada editorial (para tener un logo con permiso)

1. **Permiso por escrito** (correo o mensaje de WhatsApp de quien lleve la editorial) para mostrar su logo en el sitio de la librería, junto a los demás, con el
   único fin de indicar que hay libros suyos en el catálogo. Guarda el mensaje; el script pide quién lo autorizó y cuándo.
2. **El logo en SVG** (mejor) **o en PNG con fondo transparente**, de al menos 600 px de ancho. Un solo color basta: el sitio lo pinta como **silueta monocroma** en la tinta
   suave del tema (claro y oscuro), así que no hace falta una versión por tema ni una versión «negativa».
3. **Que sea horizontal** (proporción de 1:2 a 8:1) y **recortado al logo**, sin márgenes. Si el logo tiene versión horizontal y versión apilada, la horizontal.
4. Que diga si hay **condiciones de uso** (no deformar, espacio libre, nombre exacto de la editorial).

Un JPG o un PNG con fondo blanco no sirve: la silueta saldría como un rectángulo.

## Cómo cargar un logo (ya con permiso)

```
python3 scripts/logo-editorial.py RUTA/logo.svg "Capítulo Siete" --permiso "correo de Fulana (editora), 2026-12-03" --alt "Logotipo de Capítulo Siete"
npm run editoriales
npm test
```

- El nombre es el del catálogo o el de una entrada de `colaboran` (mayúsculas y acentos no importan). Si no coincide con ninguna, el script falla y lista las que hay.
- **`--permiso` es obligatorio.** Sin él (o vacío) el script falla y no escribe nada.
- El script guarda `assets/img/editoriales/<clave>.svg` (o `.webp`, recortado a lo visible y reducido a una silueta de hasta 168 px de alto), añade la entrada a
  `assets/data/editoriales.json` (`logos`: clave normalizada → `{ logo, alt, ancho, alto }`) y registra el archivo en `assets/provenance.json` → `logos` con
  el permiso, la fecha y las huellas.
- Un SVG se revisa (sin scripts, eventos ni referencias externas; con `viewBox`) y se guarda tal cual: pide que venga ya recortado al logo.
- Con el logo, esa editorial se pinta con su silueta (`mask-image`, color `tinta-2`, a `tinta` al pasar el cursor) en lugar del nombre; la accesibilidad la da el `alt`.
  La CSP no cambia (`img-src 'self'`); las reglas CSS de cada máscara las genera `npm run editoriales` en `style.css` (entre `franja-logos:inicio` y `franja-logos:fin`).
- Pueden convivir editoriales con logo y editoriales con nombre en la misma franja.

## Qué revisa `npm test` (y `npm run editoriales`)

`editorialesLogosProblems` (`scripts/franja-datos.mjs`): la clave de cada logo está normalizada; el archivo cumple `assets/img/editoriales/<clave>.svg|webp`;
**existe**; **está registrado en `assets/provenance.json` → `logos`** y ese renglón **trae `permiso`**. Un logo sin archivo, sin registro o sin permiso rompe la prueba
y `npm run editoriales` se niega a pintar la franja. No hay forma de publicar un logo sin dejar escrito quién lo autorizó.

## Quitar un logo

Borra su entrada de `logos` en `assets/data/editoriales.json`, su archivo y su renglón de `assets/provenance.json` → `logos`, y corre `npm run editoriales`
(la franja vuelve al nombre en tipografía).
