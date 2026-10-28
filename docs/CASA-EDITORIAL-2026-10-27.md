# Casa editorial · entrega local

27 de octubre de 2026. Implementación del plan REA autorizada por Aldo, con las seis fotografías oficiales y la identidad existente. **Estado: implementado y verificado localmente; sin commit, push ni despliegue.**

## Resultado

- Umbral cinematográfico reducido: un ingreso, 38svh de recorrido adicional en escritorio y 18svh en móvil; las secciones de lectura ya no viven sobre el video.
- Datos de visita antes del titular, WhatsApp y Cómo llegar; fotografía de la sala en tamaño contenido, sin ampliar el original.
- Experiencia y Galería sobre papel; Agenda verde profundo; Visita tinta, sin fondo audiovisual.
- Cinco secciones y anchors actuales conservados; catálogo e Iti IA continúan pausados.
- Sin kicker decorativo, tarjeta de recorrido redundante ni hitos que se superponían con el hero.
- Menú con foco inicial y Tab correctos; estados hover opacos y contrastados; áreas interactivas de al menos44px; captions/lectura auxiliar ≥14px.
- Movimiento opcional con control nativo, preferencia del sistema, ahorro de datos y batería baja. No se solicita MP4 al abrir la página; se carga tras interacción y solo en escritorio elegible.
- Los fotogramas se activan bajo demanda; las variantes móviles04–07 ya se seleccionan. El scroll usa geometría medida por ResizeObserver, evitando lecturas de layout en cada evento.

## Archivos y procedencia

Aplicación: `index.html`, `assets/css/higgsfield-site.css`, `assets/js/higgsfield-site.js`. Caché versionada como `20261027-casa-3`.

Medios: doce derivados `images/gallery/oficial-*.webp`, codificados por `python -B scripts/prepare-official-photos.py`. Fuentes y SHA-256 en `docs/official-photo-derivatives.json`. Los seis originales se conservan sin cambios en `_archive/reference-inputs/2026-10-27-official-interiors/`; no se publican. No hubo generación de imágenes ni renders nuevos de HyperFrames. El recorrido reutiliza las recreaciones ya aprobadas, separadas de las fotografías documentales.

Documentos sincronizados: `DESIGN.md` y tokens, `.impeccable/design.json`, MASTER/home, `PRODUCT.md` y `AGENTS.md`. Dirección en `.impeccable/direction-casa-editorial.md`. No se modificó backend, credenciales, Firebase, Vercel o dependencias.

## Verificación

- `npm test`: **86/86**, cero fallos. Se actualizaron solo los contratos visuales que el plan sustituye; permanecen seguridad, allowlist, accesibilidad y lógica del catálogo pausado.
- `npm run build:public`: **42 archivos, 10.06MiB totales**, incluidos ambos videos y variantes que no se descargan al inicio.
- Playwright CLI: **nueve tamaños** (320×568,390×844,430×932,620×900,820×1180,844×390,1280×720,1440×900,1920×1080) y seis modos adicionales: movimiento reducido, ahorro de datos, batería baja, sin JS, texto200% y medios bloqueados.
- Nueve tamaños: cero desbordamientos, hallazgos axe, errores JS, violaciones CSP o controles medidos menores de44px. El horario queda en el primer pantallazo en todos; el CTA principal también, incluido844×390.
- Regresión reproducible en `tests/browser-local.mjs`: cuatro viewports, teclado/Tab/Escape,20 destinos de capítulo, captions≥14px, scrubbing adelante/atrás, botón que descarga el video y404 de rutas privadas. Pasó mediante Playwright CLI. Error de seek <0.015s en las tres posiciones.
- Capturas de Ubicación muestran el mapa cargado y el pin del negocio. Las capturas fullPage muestran el flujo general: Chrome puede omitir el canvas del iframe cuando queda fuera del viewport.
- Se verificaron404 locales en .env, .git, instrucciones, research, originales archivados y parciales de catálogo. Los hashes de las seis fotos originales permanecen iguales.
- Revisión independiente de Impeccable: **disposition: ship**, sin material_fixes en el alcance visual examinado; documentación revisada y sincronizada separadamente.

### Rendimiento observado

| Medición local | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---|---|---|
| Móvil |86|100|100|100|2.8s|340ms|0|
| Escritorio |100|100|100|100|0.7s|40ms|0.005|

Son muestras de laboratorio local, sujetas a máquina/caché y otros procesos; no representan estadísticas de visitantes. La muestra móvil se tomó antes del último ajuste de1.2px en los metadatos de320px; dicho ajuste y el cache-bump final se comprobaron con la regresión de navegador.

En390px la carga inicial propia pasó de aproximadamente852KiB en la auditoría anterior a337KiB en la comprobación actual, cerca de60% menos. El video no forma parte de esa carga inicial. En pantallas menores de1024px, la muestra más alta de esta matriz fue398KiB.

El objetivo aspiracional móvil de LCP≤2.5s y TBT≤200ms aún no se alcanza en esta muestra. No se añadió más maquinaria de animación para intentar mejorar un número. CLS móvil0 y desktop0.005 cumplen el objetivo de estabilidad≤0.1.

El detector estático marcó seis imágenes diferidas sin src inicial; son fotogramas decorativos con data-src que el runtime activa y el build incluye. Sus otras señales fueron escenario full-bleed, resets y fuente Inter fijada por la identidad. No se interpretan como fotografías ausentes ni razón para cambiar de marca. Las fuentes y estados reales se verificaron en navegador.

## Preview y continuidad

Preview preparado en `http://127.0.0.1:5087/`, exclusivamente con la carpeta generada public/. Proceso Node11964 al cerrar esta entrega; terminarlo con `Stop-Process -Id 11964` si todavía corresponde a esta sesión. No iniciar una copia nueva si el puerto ya tiene un proceso distinto.

Para recrearlo desde la raíz:

```powershell
npm run build:public
node --input-type=module -e "import {resolve} from 'node:path';import {createPreviewServer} from './tools/static-server.mjs';createPreviewServer({root:resolve('public'),port:5087}).listen(5087,'127.0.0.1')"
```

`tests/browser-local.mjs` permite usar una instalación existente de Playwright mediante PLAYWRIGHT_MODULE y SITE_BASE_URL. Exporta checkLanding para ejecutarlo también con `playwright-cli run-code`, que fue el método utilizado aquí. No requiere backend ni llamadas de IA.

Evidencia y respaldo de la versión anterior: `.tmp-audit/casa-editorial-2026-10-27/` (`before/`, `tests.txt`, `browser-final.json`, `regression-results.json`, `lighthouse-*.json`, capturas y `reviewer-verdict.md`). No publicar esa carpeta.

## Límites pendientes de otra fase

- Producción no fue alterada. Headers HTTP, revocación de la llave expuesta previamente y estado del rewrite/servicio de Cloud Run requieren comprobación en su entorno correspondiente.
- Las cuatro fotos pequeñas conservan la resolución recibida. Se presentan contenidas; una futura ampliación exige un original mayor, no una reinterpretación generativa.
- No se certificó WCAG completa con lector de pantalla/hardware físico ni se realizó un escaneo integral del backend.
