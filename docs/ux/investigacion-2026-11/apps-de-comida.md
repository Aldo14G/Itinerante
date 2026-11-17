# Uber Eats y DiDi Food: cómo nombran y acomodan una carta de cafetería (2026-11-17)

**Advertencia: es referencia de estructura, no de código, texto ni imagen.** Aldo pidió (2026-11-17) que los nombres y el acomodo de la carta de Café y té (`#cafe`) sigan los estándares de las apps de comida que la gente ya usa en Monterrey. De Uber Eats y DiDi Food se tomó **cómo se organiza una carta** (nombres de categoría, orden, fila con el precio bajo el nombre, una o dos columnas) y se midió; **no se copió nada**: ni HTML, CSS o JavaScript, ni textos de sus tiendas, ni logotipos, ni fotos. El sitio no carga nada de sus dominios.

## Qué se pudo medir y qué no

La toma fue de solo lectura, sin sesión ni carrito (2026-11-17, UTC); los archivos viven fuera del repositorio (scratchpad de la sesión: `rea-delivery/`, con `INFORME.md`, `descargado/` y `capturas/`).

| Fuente | Resultado |
|---|---|
| **DiDi Food, páginas públicas de tienda** (`web.didiglobal.com/mx/food/monterrey-nle/<tienda>/<id>/`) | Medidas con Chromium (Playwright) en iPhone 393 × 659 (toque) y 1440 × 900: 15 cafeterías del área de Monterrey, 618 productos (categorías, productos, precios, descripciones, cajas y tipografía). Las fotos no cargan (su dominio de imágenes está bloqueado en la red de la sesión): se midió el hueco de la foto, no la foto. |
| DiDi, guías para restaurantes | Descargadas (cómo se arma una categoría y un platillo). |
| **Uber Eats, páginas de tienda** | **No medidas**: redirigen a un reto anti-bot, que no se intentó saltar. Solo hay nombres de categoría por el índice de un buscador y las páginas de ciudad y categoría (que listan tiendas, no menús). |
| Uber, documentación para comercios | Bloqueada en la red de la sesión; solo resúmenes del buscador (fotos de 5:4 a 6:4, un producto por foto; categorías por tipo de platillo; descripción breve y opcional). |

**Consecuencia:** lo de DiDi está medido; lo de Uber Eats son nombres de categoría y convenciones sin verificar en pantalla (la fila con la foto a la derecha y la barra de categorías fija del teléfono son conocimiento previo, no comprobado ese día).

## Hallazgos (estructura)

1. **Bebidas antes que comida** en las cafeterías (10 de 15 en DiDi; también en Uber Eats). La comida va primero solo en bistrós y restaurantes.
2. **El café aparte de lo que no lleva café**: «Bebidas con Café / Bebidas sin Café», «Bebidas de café / Bebidas sin café», «With Coffee / Non-Coffee», «Alternativas al café».
3. **El chocolate va en «sin café»** en las tres tiendas que separan con y sin café.
4. **Aguas frescas y limonadas** van aparte del café o al final de las bebidas; una categoría de un solo producto es un antipatrón visible (una tienda con siete categorías de un renglón).
5. **«Postres»** es el nombre más repetido para lo dulce; para lo salado no hay uno dominante («Salado», «Alimentos», «Sandwiches»).
6. **Fila de producto (DiDi, medido):** nombre (600 18/20), **precio justo debajo** (4 px; 500 16/24), descripción después (14/20, sin recorte); foto cuadrada de 144 a la derecha; **una columna en el teléfono y dos en escritorio**; 16 px entre filas; el encabezado de categoría es solo su nombre, sin conteo.
7. **Frío o caliente** se dice una vez, en la categoría o en el nombre, no repetido en cada producto. El tamaño o la unidad viajan en el nombre; no hay un campo «c/u».
8. **Sin foto, DiDi conserva el hueco gris** de 144 px (la fila solo baja de alto) y **publica sin precio como `MX$0.00`**: las dos cosas que no hay que copiar.

## Qué se tomó para el sitio

| De las apps | En el sitio | Dónde |
|---|---|---|
| Bebidas primero, café aparte de lo que no lleva café, luego Salado y Postres | Cafés · Bebidas sin café · Salado · Postres | `assets/data/menu.json` |
| Chocolate y aguas frescas con lo que no lleva café | Chocolate al principio y «Aguas frescas» al final de «Bebidas sin café» | `assets/data/menu.json` |
| Un nombre corto en la barra cuando el de la categoría es largo | Campo `chip` («Sin café»), con el nombre completo como `aria-label` | `chipNode`, `menuProblems` |
| Frío o caliente, una vez | Nota del grupo: «Los tés, fríos o calientes.» | `assets/data/menu.json` |
| Fila: nombre, precio debajo, descripción; foto cuadrada a la derecha | Fila entre líneas finas; precio en Subheadline 600 `turquesa-texto`; foto de 96 / 120 si la hay | `productNode`, `.ct-prod` |
| Una columna en el teléfono, dos en escritorio | Una columna hasta 760 y dos desde 761 | `.ct-rejilla` |

## Qué no se tomó (y por qué)

- **«Lo más pedido», *Featured items*, «#1 más gustado» y cualquier ranking:** el sitio no tiene datos de venta y no inventa cifras (`PRODUCT.md`).
- **Promociones, combos, secciones de temporada, donativos, carrito, botón «+», calificaciones y costo de envío:** la carta es para leer en la sala; se pide en la barra.
- **`MX$0.00` o «$0» para lo que no tiene precio:** sin precio de la librería no se imprime nada.
- **El hueco gris de la foto ausente:** sin foto, la fila no reserva su columna.
- **El formato `MX$65.00`:** es formato de cobro; el sitio usa «$65 MXN».
- **Textos, logotipos e imágenes de las apps o de sus tiendas:** solo la estructura.

## Fuentes

DiDi Food, tiendas medidas (todas bajo `https://web.didiglobal.com/mx/food/monterrey-nle/`): `cafeteria-bonmoon/5764616772070934346/`, `flora-cafe/5764616241080438165/`, `cafe-naranja/5764607725632489899/`, `forbidden-coffee/5764607677347659852/`, `black-honey-cafe/5764607624210022714/`, `cafe-royal/5764607695274115196/`, `caffe-latte/5764607604077363285/`, `el-despertar-cafe/5764615224796385268/`, `holy-coffee/5764614458220219567/`, `kaia-bistro-cafe/5764607661564493898/`, `punto-barrio-cafe-y-bebidas/5764611225590434676/`, `restaurante-cafe-victoria/5764607586117357130/`, `cafeteria-maria/5764610797083558653/`, `jugos-cafe-olivares/5764609691590853853/`, `cafeteria-san-jose-express-mitras/5764608610169259776/`. Guías de DiDi para restaurantes: `https://web.didiglobal.com/co/restaurantes/aprende-como-manejar-tu-menu.pdf`, `https://web.didiglobal.com/mx/food/restaurantes/preguntas-frecuentes/como-agregar-una-categoria-en-el-menu/`.

Uber Eats (por el índice de un buscador, sin abrir): `https://www.ubereats.com/mx/store/forbidden-coffee/oh8c2MD8S12eXpAwWVRrsQ`, `https://www.ubereats.com/store/mood-coffee/AEkJ5NmSQJ-eXYvm-2mLUw`, `https://www.ubereats.com/store/jun-cafe/K1Ni0l0LSKOUVGqxaf26wg`; documentación para comercios (resumen del buscador): `https://help.uber.com/merchants-and-restaurants/article/merchant-submitted-menu-catalog-photo-guidelines`.

Sin licencia que permita copiar código, textos o imágenes: solo se tomó la estructura. Decisión y medidas del sitio en `DESIGN.md`, «Carta al modo de las apps de comida» (2026-11-17).
