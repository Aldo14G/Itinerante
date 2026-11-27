# Libreria Itinerante y Mas

## Única ruta oficial: /nuevo

Decisión de Aldo del 2026-11-24: trabajar siempre en
**[http://localhost:3108/nuevo](http://localhost:3108/nuevo)**;
[`#cafe`](http://localhost:3108/nuevo#cafe) abre la sección de café.
Las mejoras se hacen en `src/frente/`, con la dirección «La camioneta» v4.2 de
`DESIGN.md`. `scripts/build-nuevo.mjs` genera el documento que sirve
`src/app/nuevo/route.ts`; el archivo generado no se edita a mano.

El checkout verificado es `C:/Users/aldog/AppData/Local/Temp/Itinerante-pr8-lista-eventos`,
rama `agent/claude/landing-v4-camioneta`. Antes de reanudar, comprobar rama,
árbol y proceso del puerto 3108: la ruta temporal puede cambiar entre sesiones.

- `npm run dev`: genera `/nuevo` e inicia Next en el puerto 3108.
- `npm run preview`, `preview:site` y `preview:static`: alias del mismo arranque.
- `npm run nuevo:check`: verifica el documento generado.
- `npm run test:frente`: comprueba el contenido y comportamiento de `/nuevo`.
- `npm run test:rutas`: comprueba las redirecciones y sus límites.

`/`, `/index`, `/index.html`, `/prototypes/*` y `/_archive/*` redirigen a `/nuevo`
con estado 308, conservando consultas. Las anclas compartidas, como `#cafe`,
se conservan en el navegador. B.4, Higgsfield y `index.html` son fuentes
históricas sin mejoras ni vista previa activa. No usar sus servidores estáticos
o builds para revisar ni publicar la página vigente. Sin commit ni despliegue
autorizado por esta decisión local. Ver el contrato de `AGENTS.md`.

Cloudflare Workers sirve la portada en `/` con los mismos filtros de catálogo que
Next. En Cloudflare los enlaces de `/nuevo` redirigen a `/` con su consulta.
`npm run cf:dev` verifica en local y `npm run cf:preview -- --name nuevo` genera
una vista previa de Cloudflare. Tras verificarla, `npm run cf:deploy` publica.
Configura `PUBLIC_SITE_ORIGIN` con el origen HTTPS de producción para emitir
la URL canónica e indexar ese origen. Firebase y los CLI estáticos históricos
siguen bloqueados. `prepare-public.mjs` se conserva por compatibilidad histórica.
