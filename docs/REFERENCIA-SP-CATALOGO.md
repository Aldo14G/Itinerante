# Referencia: catálogo de spdistribuciones.com (WordPress)

Estudio pasivo del 2026-10-31 con unas 13 peticiones espaciadas, respetando `robots.txt` (permite todo). Solo se anotan nombres de campos, recuentos y cabeceras. **No se importa ningún dato, imagen, texto ni marca** de ese sitio y no se apunta ningún extractor a su API. Sirve como referencia de arquitectura y de patrones de interacción.

## Cómo está construido

| Capa | Observado | Evidencia |
|---|---|---|
| CMS | WordPress 6.8, WooCommerce 10.2, tema Divi 4.27 (Theme Builder, módulo Shop) | meta `generator`, clases `et_pb_shop`, rutas en `/wp-content/` |
| Búsqueda | Advanced Woo Search Pro (AJAX) | `.aws-container`, `?wc-ajax=aws_action` |
| Filtros | Ninguno: solo `orderby` y paginación | formularios `aws-search-form` y `woocommerce-ordering` |
| Servidor | nginx + PHP, brotli, microcaché | cabeceras `server`, `x-microcache`; sin CSP ni HSTS |
| Rendimiento (una carga en frío) | TTFB 2.1 s, load 8.5 s, 54 recursos, ~2.3 MB | panel de red |
| Imágenes | JPG 250×353, `loading="lazy"`, sin WebP/AVIF | `srcset` de WordPress |

## Datos y API

- `/catalogo/` es HTML renderizado en el servidor: 15 productos por página, 140 páginas (`?product-page=N`). **No usa la Store API**; esta existe y es pública, pero la interfaz no la llama.
- Búsqueda predictiva: `POST /?wc-ajax=aws_action` (`action, keyword, aws_id, aws_filter, page, lang, typedata=json`). Mínimo 1 carácter, debounce de 300 ms, ~29 KB por consulta, sin caché. Mensajes configurables: «No se encontraron libros», «Ver todos los resultados».
- Campos por producto en la respuesta de búsqueda: `id, title, excerpt, link, image, price, categories, tags, brands, on_sale, sku, stock_status, featured, rating, reviews, variations, add_to_cart`.
- Cada cambio de orden o de página cuesta un documento HTML completo.
- Recuentos que no cuadran: la lista dice 2128, la API 2130 y el atributo ISBN tiene 2925 términos.

## Taxonomía

181 categorías, 47 etiquetas y 9 atributos globales. Autor, género y colección comparten `product_cat`; la editorial vive en `product_tag` y además existe `pa_editorial`. El ISBN es un atributo con un término por libro. **Lección:** el libro debe ser la entidad; autor, editorial, género, colección y formato, tablas tipadas; ISBN, páginas y año, campos simples.

## Qué tomamos (patrones, reescritos con nuestro código)

- Búsqueda predictiva con una última fila «Ver los N resultados» que lleva a la lista completa. **Aplicado en B.4.**
- Contador de resultados y selector de orden visibles. Ya existían.
- Mensaje vacío específico. Ya existía, con salida a WhatsApp.

## Qué evitamos

- Recarga completa por cada orden o página: B.4 filtra en el cliente y reserva el espacio con skeletons (salto de altura al abrir el catálogo: 58 px).
- Mostrar agotados con precio: B.4 no afirma existencia ni precio; la ficha termina en una consulta a la librería.
- Búsqueda desde 1 carácter con 29 KB por tecla: B.4 sugiere desde 2 caracteres y solo con datos ya cargados.
- Cargar scripts de checkout, Select2, PhotoSwipe y flexslider en un listado.
- `user-scalable=0` en el viewport (impide ampliar).
- Un facetado sin conteos ni URL: B.4 ya tiene facetas con conteo; falta dar URL a los filtros.

## Pendiente (viene de esta referencia)

1. URL con estado para filtros y búsqueda (`?q=&genero=`) en el catálogo.
2. Reglas de indexación: solo combinaciones útiles (género, editorial, autor) indexables; el resto `noindex`.
3. Modelo `libro` con tablas tipadas en el backend (D1 o Postgres), sin sobrecargar categorías.
