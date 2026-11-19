# Mapa de Visita con Google (Maps Embed API) — pasos para Aldo

Estado al 2026-11-19: el código está listo y **apagado**. Mientras `assets/data/sitio.json → mapa.clave` esté vacía, el sitio sigue mostrando el mapa SVG de OpenStreetMap y no carga nada de Google. Nadie ha creado ni pedido la clave desde el repositorio: la crea Aldo en su cuenta de Google Cloud.

## Qué se monta y cuándo

- Iframe en **modo `place`**: `https://www.google.com/maps/embed/v1/place?key=<CLAVE>&q=<consulta>&language=es&region=MX`. Consulta: «Librería Itinerante y Más, Mariano Matamoros Pte. 421, Centro, Monterrey» (`mapa.consulta` en el mismo archivo).
- Solo al acercarse a Visita (a 700 px, con el navegador en reposo) y solo con una clave que tenga forma de clave de Google (`AIza` + 35 caracteres). Antes de eso no se pide nada a Google.
- Mientras el iframe carga se sigue viendo el SVG; al cargar, el SVG deja de verse y el pie dice «Mapa de Google Maps». Misma caja (240 de alto en el teléfono, 260 en tableta, 2:1 en la columna de la rejilla desde 1024): sin saltos.
- Iframe con `title` accesible, `loading="lazy"` y `referrerpolicy="strict-origin-when-cross-origin"`.
- La CSP del sitio (`index.html`) solo añade `frame-src https://www.google.com`. Si Google exigiera otro host para el modo `place` el mapa saldría en blanco y la consola mostraría la violación: habría que añadirlo (no pude verificarlo contra la documentación oficial desde la red de la sesión; ver «Sin verificar»).

## Crear la clave (Google Cloud Console)

1. Entra a <https://console.cloud.google.com/> con la cuenta de la librería y **crea un proyecto** (p. ej. «Itinerante sitio»). Si te pide **cuenta de facturación**, vincúlala: la Maps Embed API no cobra por uso (Google la lista como sin cargo y sin límite), pero la consola exige una cuenta de facturación activa para usar Maps Platform.
2. **APIs y servicios → Biblioteca →** busca **«Maps Embed API»** → **Habilitar**. (Es una API distinta de «Maps JavaScript API»; solo esta hace falta.)
3. **APIs y servicios → Credenciales → Crear credenciales → Clave de API.** Copia la clave (empieza con `AIza`).
4. Abre la clave y en **Restricciones de la aplicación** elige **«Sitios web» (referentes HTTP)** y agrega **solo tu dominio**, con y sin comodín de ruta, p. ej. `https://tu-dominio.com/*` y, si usas `www`, `https://www.tu-dominio.com/*`. Mientras pruebas, agrega también el dominio de vista previa de Cloudflare (`https://*.workers.dev/*` o el que uses) y quítalo al terminar.
5. En **Restricciones de la API** elige **«Restringir clave»** y marca **solo «Maps Embed API»**. Guarda.
6. **Cuota y gasto:** en **APIs y servicios → Maps Embed API → Cuotas** no hace falta tocar nada (sin cargo); por prudencia crea en **Facturación → Presupuestos y alertas** un presupuesto de, por ejemplo, 1 USD con alertas al 50 % y 100 % para enterarte si alguien usa la cuenta para otra API. Una clave restringida a una sola API no puede gastar en otras.
7. Una clave del Embed API es **pública por diseño** (viaja en la URL del iframe, cualquiera la ve en el HTML): lo que la protege es la restricción por referente y por API. Por eso vive en `assets/data/sitio.json` y no es un secreto del Worker. No la pegues en otras APIs ni sin restricciones.

## Dónde pegarla

`assets/data/sitio.json`:

```json
{ "mapa": { "clave": "AIza…tu clave…", "consulta": "Librería Itinerante y Más, Mariano Matamoros Pte. 421, Centro, Monterrey" } }
```

Es el único lugar. Después `npm test` (la prueba exige que el repositorio traiga la clave **vacía** mientras no se decida lo contrario: al pegar una clave real, actualiza esa aserción en `tests/site.test.mjs`, «mapa de Visita con la Maps Embed API») y despliega cuando decidas (nadie despliega sin que lo pidas).

## Probar con la clave real

1. `node tools/preview-site.mjs` y abre <http://127.0.0.1:8094/#visita>: el referente será `http://127.0.0.1:8094/`, que **no** está en tu restricción; agrega temporalmente `http://127.0.0.1:8094/*` en el paso 4 o prueba directamente en el dominio.
2. Verifica a ojo: el pin en la dirección correcta, idioma español, que no aparezca «Google Maps Platform rechazó la solicitud» (clave o restricción mal puesta; el navegador no puede detectarlo y mostrará ese mensaje dentro del mapa) y que «Cómo llegar» sigue funcionando.
3. `node tools/qa/mapa.mjs http://127.0.0.1:8094/` repite las pruebas con una clave falsa y red interceptada (no sale a Google).

## Privacidad (pendiente de negocio)

Con la clave puesta, quien llegue a Visita carga una página de Google dentro del sitio: Google puede recibir la IP y el agente del navegador y guardar cookies propias (cookies de terceros; los navegadores que las bloquean pueden mostrar el mapa igual). El sitio no guarda nada de eso, pero **hace falta un aviso de privacidad** que lo diga antes de encender la clave (decisión de negocio, no hecha): qué se carga, de quién, y que no hace falta cargarlo para ver la dirección y el botón «Cómo llegar» (que siguen en la página sin Google). Mientras no exista el aviso, deja la clave vacía.

## Límites conocidos

- Si el navegador bloquea a Google (un bloqueador, sin red) el iframe dispara `load` igual con la página de error del navegador, y el sitio no puede distinguirlo (otro origen): el SVG ya se ocultó. «Cómo llegar» (botón primario) sigue en la página.
- Una clave mal restringida o sin la API habilitada muestra el error de Google dentro del mapa; revisa los pasos 2, 4 y 5.

## Sin verificar desde esta sesión

La red de la sesión no alcanzó `developers.google.com`, así que lo siguiente viene de conocimiento previo y no se contrastó con la documentación vigente: el formato de la URL de `place` y sus parámetros opcionales `language` y `region`, que la Maps Embed API no tiene costo ni tope, que el iframe solo necesita `frame-src https://www.google.com`, y los nombres de los menús de Cloud Console. Revisa <https://developers.google.com/maps/documentation/embed/get-started> antes de encender la clave.
