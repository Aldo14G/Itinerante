# Dominio, marca y SEO: cómo salir a producción

Creado el 2026-11-19. **Estado hoy:** el dominio de producción no está decidido y el sitio no está desplegado. El repositorio está **sin dominio y con `noindex,nofollow` a propósito** (`<meta name="robots" content="noindex,nofollow">` en `index.html`; `robots.txt` deja rastrear todo menos `/api/`, para que los buscadores lean ese `noindex`). **No se compra ni se registra ningún dominio desde este repositorio**, y nada de lo que sigue se ejecuta solo: son pasos que hace Aldo (o quien administre su cuenta de Cloudflare y de Google) cuando el dominio exista.

## 1. Qué deja listo el repositorio

| Pieza | Dónde | Qué hace |
|---|---|---|
| `scripts/set-dominio.mjs` | raíz de scripts | Con `https://dominio` escribe `canonical`, `og:url`, `og:image` (absoluta, con ancho, alto y `alt`), `twitter:card`, `url` e `image` del JSON-LD, la línea `Sitemap:` de `robots.txt` y `sitemap.xml` (una sola URL, sin `#secciones`). **No retira el `noindex`**: solo `--indexar` lo hace. Idempotente; cambiar de dominio sustituye el anterior. |
| `--check` | mismo script | Con el dominio (y `--indexar` si aplica) falla si los archivos no son lo que escribiría; sin argumentos comprueba el estado actual del repositorio (sin dominio, con `noindex`): `npm run dominio:check`, que también corre dentro de `npm test`. |
| `--reset` | mismo script | Vuelve al estado sin dominio (con `noindex`, sin `sitemap.xml` ni `Sitemap:`). |
| `assets/img/compartir.jpg` | 1200 × 630 | El logo (630 × 630) y un recorte de la foto real de la sala (570 × 630), sin texto añadido; hecha con `python3 scripts/marca-imagenes.py` y registrada en `assets/provenance.json`. Es la `og:image` cuando hay dominio. |
| `manifest.webmanifest` + `assets/img/icono-192.png` e `icono-512.png` | raíz | Nombre, idioma `es-MX`, iconos del logo y colores de los tokens (`display: "browser"`: es un sitio, no una app instalable). |
| `404.html` + `404.css` | raíz | Página 404 del sistema (inicio y WhatsApp). `wrangler.jsonc` → `assets.not_found_handling: "404-page"` hace que Cloudflare la sirva, con estado 404, para cualquier ruta que no existe. `node tools/preview-site.mjs` hace lo mismo en local. |
| JSON-LD | `index.html` | `BookStore` y `CafeOrCoffeeShop`: nombre, descripción, dirección, WhatsApp como teléfono, correo, horario (una prueba lo compara minuto a minuto con la tabla y el estado de apertura del sitio), `hasMap` y `sameAs` (Instagram y Facebook). **Sin** reseñas, calificaciones, precios, código postal ni nada que Aldo no haya confirmado. |
| `lang="es-MX"`, un solo `h1`, `alt` en toda imagen, CSP sin aflojar | `index.html` | Comprobado por `tests/contenido.test.mjs`. |

## 2. Flujo, en orden

1. **Decidir el dominio** (Aldo) y quién lo compra y registra. Mejor un solo dominio principal (con o sin `www`) y los demás, redirigidos a él.
2. **Cloudflare (dominio y DNS).** Agregar el dominio a Cloudflare (si se registra ahí, Cloudflare Registrar lo deja ya en su DNS; si se compra en otro registrador, cambiar los *nameservers* a los que Cloudflare indique). En **Workers & Pages → el Worker `libreria-itinerante` → Settings → Domains & Routes → Add → Custom domain**, escribir el dominio; Cloudflare crea el registro DNS y el certificado. (Alternativa en código, que *no* está activada: añadir a `wrangler.jsonc` `"routes": [{ "pattern": "dominio.mx", "custom_domain": true }]`.) Activar **SSL/TLS → Always Use HTTPS**; el HSTS ya va en `worker/_headers`.
3. **Redirigir los dominios secundarios.** Si hay otros (`.com`, `.com.mx`, `www` si el principal es el *apex*, o al revés): agregar cada uno a Cloudflare con un registro DNS proxied y crear una **Redirect Rule** (Rules → Redirect Rules → Single redirect): «el nombre de host es el secundario» → *Dynamic* `concat("https://dominio-principal", http.request.uri.path)` con estado **301** y *Preserve query string*. Así cada ruta cae en la misma ruta del principal y el buscador junta las señales en un solo sitio.
4. **En el repositorio, con la rama de trabajo** (nada se despliega todavía):
   ```sh
   node scripts/set-dominio.mjs https://dominio.mx          # canonical, og:*, twitter:card, Sitemap, sitemap.xml, JSON-LD; sigue el noindex
   node scripts/set-dominio.mjs https://dominio.mx --check
   npm test
   ```
   Comprobar con `node tools/preview-site.mjs` y «ver código fuente»: un solo `canonical`, `og:image` con el dominio, `noindex` aún presente.
5. **Día de salir a producción** (cuando Aldo lo pida): `node scripts/set-dominio.mjs https://dominio.mx --indexar`, `npm test` y, solo entonces, el despliegue (`npm run cf:deploy`, que Aldo pide; este repositorio no despliega solo). Si algo falla, `--reset` y se vuelve al estado sin dominio.
6. **Quitar la copia de `workers.dev`** (`"workers_dev": false` en `wrangler.jsonc`, o una redirección): con `--indexar` el HTML es indexable también en esa dirección y compite con el dominio.
7. **Google Search Console.** Agregar una propiedad de tipo **Dominio** (la verificación es un registro DNS TXT que se añade en Cloudflare), enviar `https://dominio.mx/sitemap.xml` y, con la página ya indexable, pedir la inspección de `https://dominio.mx/`. (No enviar el sitemap mientras siga el `noindex`: Search Console marca las URL como «excluidas por noindex».)
8. **Bing Webmaster Tools.** Importar el sitio desde Search Console (o verificar con un registro DNS) y enviar el mismo `sitemap.xml`.
9. **Rich Results Test / validador de Schema.org** (manuales, en el navegador) sobre la URL final para revisar el JSON-LD.

## 3. Ficha de Google Business Profile (mismos nombre, dirección y horario: NAP)

Que los datos de la ficha coincidan **letra por letra** con los del sitio (Google y los buscadores los cruzan). Lo publicado hoy:

| Dato | Texto del sitio |
|---|---|
| **Nombre** | Librería Itinerante y Más |
| **Dirección** | Mariano Matamoros Pte. 421, Centro, Monterrey, Nuevo León (entre Juan Aldama e Ignacio Rayón) |
| **Teléfono** | +52 81 8087 5940 (`528180875940`, el número de WhatsApp que publica el sitio; confirmar con Aldo que es el que quiere en la ficha) |
| **Horario habitual** | Lunes a sábado, 11:00 a 20:00; domingo, cerrado. Días festivos: se pregunta por WhatsApp (en la ficha, usar «horario especial» solo cuando Aldo lo confirme) |
| **Sitio web** | `https://dominio.mx/` (el principal; el mismo del `canonical`) |
| **Redes** | Instagram `libreriaitineranteymasmty`; Facebook (el perfil enlazado en el pie) |

Notas: la descripción de la ficha usa los hechos del sitio («libros de editoriales independientes, café, eventos y talleres en el centro de Monterrey»), sin adjetivos ni promesas (nada de «gratis», «disponible» ni plazos). Cuando Aldo tenga el enlace de su ficha de Maps, sustituir el `hasMap` del JSON-LD por ese enlace. **No se ejecuta nada de esto desde el repositorio.**

## 4. Pendientes que dependen de Aldo

Están en `docs/PENDIENTES-NEGOCIO.md` (B3 dominio, B4 imagen para compartir, B5 ficha de Google, B6 aviso de privacidad del mapa de Google).
