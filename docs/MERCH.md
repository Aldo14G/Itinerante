# Merch: cómo se carga (preparado, oculto hasta tener productos)

Creado el 2026-11-19. Aldo tiene artículos pero aún no están catalogados. El mecanismo ya está construido (`merch.js`, `assets/data/merch.json`, `scripts/foto-merch.py`, `scripts/check-merch.mjs`) y **mientras no haya productos válidos, no existe nada**: ni la sección `#merch` en el DOM, ni su entrada en la barra de escritorio ni en el ☰, ni su zona en el destino actual (scroll-spy). Con el primer producto válido, la sección aparece sola entre Café y Visita y su entrada («Merch») en la barra y en el ☰. No hay carrito ni pagos, y **el sitio nunca afirma que haya existencias**: la tarjeta es un enlace a WhatsApp, «Consultar disponibilidad», con el producto y su precio ya escritos (como la ficha del libro).

## 1. Qué debe llenar Aldo (una fila por artículo)

| Columna | Qué es | Obligatoria | Ejemplo |
|---|---|---|---|
| **Nombre** | Cómo se llama el artículo (hasta 80 caracteres) | sí | Playera con logo |
| **Tipo** | Playera, Taza, Bolsa, Cuaderno… (hasta 40) | sí | Playera |
| **Precio** (MXN) | Número, sin signo. Sin precio no se imprime nada (ni «$0» ni «por confirmar») | no | 250 |
| **Foto** | Foto del artículo, de preferencia cuadrada o que se pueda recortar al centro | no (sin ella la tarjeta lleva un icono) | `playera.jpg` |
| **Texto alternativo (alt)** | Lo que se ve en la foto, para quien no la ve («Playera blanca con el logo de la librería en el pecho») | sí, si hay foto | Playera blanca con el logo |
| **Disponibilidad** | `hay`, `encargo` o vacío. **No es existencia**: «encargo» rotula «Por encargo» en la tarjeta; «hay» es una nota de la librería para ella y no imprime nada | no | encargo |
| **Descripción** | Una línea sobre el artículo (hasta 200 caracteres) | no | Algodón, talla única |
| **Notas** | Lo que Aldo quiera dejar anotado (no se publica) | no | Quedan pocas, pedir más en diciembre |

Si una columna obligatoria no está, el artículo no se publica (y `npm run merch:check` dice cuál falta).

## 2. Comandos

Requisitos: Python con Pillow (el mismo que `scripts/foto-carta.py`).

```sh
# Dar de alta un artículo nuevo con su foto (recorta al centro a cuadrado, guarda assets/img/merch/<id>.webp de ≤ 1200 y <id>-600.webp,
# las registra como «foto aportada por Aldo» en assets/provenance.json y escribe el artículo en assets/data/merch.json):
python3 scripts/foto-merch.py RUTA/playera.jpg playera-logo --alt "Playera blanca con el logo" \
  --nombre "Playera con logo" --tipo Playera --precio 250 --disponibilidad encargo --descripcion "Algodón, talla única"

# Cambiar solo la foto de uno que ya existe (los campos que no des por opción se quedan como están):
python3 scripts/foto-merch.py RUTA/otra-foto.jpg playera-logo --alt "Playera vista de espalda"

# Revisar el JSON y que cada foto exista y esté registrada (también corre dentro de `npm test`):
npm run merch:check

# Verlo en el navegador:
node tools/preview-site.mjs        # http://127.0.0.1:8094/
```

Un artículo **sin foto** se puede escribir a mano en `assets/data/merch.json` (`foto: null`; el `id` va en minúsculas, cifras y guiones). Un artículo se quita borrándolo de la lista; con la lista vacía, la sección deja de existir.

## 3. Reglas del sitio con los datos (Postel)

- Un `id` repetido se pinta una vez (gana el primero). Un precio que no sea un número positivo se toma como «sin precio». Una foto que no sea local (`assets/img/merch/…`) o no lleve `alt` se descarta (queda el icono). Una `disponibilidad` desconocida se toma como vacía. `merch:check` y `npm test` sí reportan todo eso como error para corregirlo en el origen.
- Si una foto falla al cargar, se retira y queda el icono de la tarjeta.
- Ningún texto dice «disponible», «en existencia», «agotado» ni «gratis».
- La tarjeta abre WhatsApp en otra pestaña con: «Hola, quiero consultar la disponibilidad de «Nombre» (por encargo, $250 MXN).» («por encargo» solo si lo es; sin precio, sin esa parte).

## 4. Dónde está el diseño

Presentación como rejilla de tarjetas del sistema (TarjetaLibro adaptada): foto cuadrada, tipo, nombre, descripción, precio en su renglón y «Consultar disponibilidad» al pie; 2 columnas en el teléfono, 3 desde 761 px y 4 desde 1024 (3 de las 12 columnas cada una). Se decidió **consulta directa** (la tarjeta es el enlace) y no una ficha en hoja: la ficha del libro está hecha para sinopsis, datos y relacionados, y un artículo no los tiene; con la consulta directa el trayecto es un toque. Medidas y razones: `DESIGN.md`, «Preguntas frecuentes, Editoriales, Merch y marca para el dominio» (2026-11-19). Componente: `design/componentes.json` (`tarjeta-merch`). Pruebas: `tests/contenido.test.mjs` y `tools/qa/contenido.mjs` (con productos de prueba solo en el arnés: nunca están en el repositorio).
