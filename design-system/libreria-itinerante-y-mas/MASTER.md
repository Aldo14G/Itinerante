# Librería Itinerante Design Standard

> Fuente de verdad visual: Casa editorial, autorizada por Aldo el 27-oct-2026 en `.impeccable/direction-casa-editorial.md` e implementada en `index.html` y sus CSS/JS locales. El estudio `web-intel/awwwards-libreria/2026-10-27/PLAN.md` conserva su carácter histórico; la autorización posterior permite aplicar esa dirección. `DESIGN.md` contiene los tokens normativos y `.impeccable/design.json` sus extensiones.

## Posicionamiento

Librería Itinerante y Más es una librería cultural independiente de Monterrey. La interfaz presenta una casa real, sus libros y sus encuentros, y conduce a una visita informada o una conversación concreta.

## Dirección bloqueada

- Paleta conservada: turquesa `#5dc4b4`, verde profundo `#0d4a45`, tinta `#061a18`, menta `#9de3da`, papel `#fdfcf8` y ámbar `#e8a020` como señal puntual.
- Playfair Display para titulares y momentos editoriales; Inter para lectura, navegación y controles. Fuentes autoalojadas en `assets/fonts/`.
- Casa editorial alterna un ingreso audiovisual breve, Experiencia y Galería sobre papel, Agenda sobre verde profundo y Visita sobre tinta opaca. La fotografía documental lleva el relato después del umbral.
- Las superficies son planas y opacas; la profundidad proviene del tono, el espacio y la proporción. El velo del umbral protege el texto sin trasladarse a los capítulos de lectura.
- La voz es cálida, culta y práctica. No adoptar estética SaaS, marketplace, IA genérica ni una plantilla saturada.

## Jerarquía de fuentes visuales

1. Seis fotografías oficiales: originales privados en `_archive/reference-inputs/2026-10-27-official-interiors/`, doce derivados WebP sin ampliación en `images/gallery/oficial-*`. `docs/official-photo-derivatives.json` registra rutas, dimensiones y SHA-256 de origen. Son evidencia documental; las portadas visibles no acreditan stock actual.
2. Medios aprobados de `images/cinematic/runtime/`: recreaciones generadas con Higgsfield, distintas de las fotografías oficiales. Sirven únicamente al umbral cinematográfico y nunca se rotulan como fotografías reales.
3. `.impeccable/direction-casa-editorial.md` recoge la autorización y el contrato de cinco puntos. El plan y el inventario en `web-intel/awwwards-libreria/2026-10-27/` explican la investigación y la curaduría anteriores.
4. El prototipo `Itinerante Home cinematico.dc.html` en `_archive/root-loose/Documentación del proyecto Iti.zip`, `_archive/imports/higgsfield-d599d36a-2026-08-29/`, las fotos anteriores de `_archive/cinematic-process/` y `_archive/models/` son referencias históricas; no sustituyen la composición aprobada.

## Componentes

- Cabecera tinta opaca: marca compacta, WhatsApp y cinco anchors (Inicio, Experiencia, Agenda, Galería, Visita). El capítulo visible usa menta y `aria-current`; el menú compacto maneja foco, Escape y `inert`.
- Ingreso: datos prácticos antes del titular original «Una casa para leer, conversar y volver.», WhatsApp y Cómo llegar, retrato oficial de la sala con marco de papel y anchura máxima de 320 px, dentro de sus 390 px de origen. Sin tarjeta demo ni hitos de fase.
- Umbral: `scroll-scrub` limitado a Inicio y su breve salida (38svh escritorio, 18svh móvil, sin salida adicional con movimiento reducido). Video opcional desde 1024 px, cargado tras interacción real, sin autoplay, loop ni sonido. Siete fotogramas con carga bajo demanda y versiones móviles, incluidas 04–07. Una línea fina indica progreso; no hay píldoras de fases.
- Experiencia: dos aperturas editoriales alternadas con foto y texto sobre papel; libros, café y comunidad sin presentar un catálogo activo.
- Agenda: lista sobre verde profundo, sin fechas, cupos o estados inventados; WhatsApp e Instagram para preguntar y consultar anuncios.
- Galería: composición editorial de las seis fotografías oficiales sobre papel, con pies descriptivos y tamaños limitados por el origen. Imágenes amplias con `srcset` 480/800/1200/1600; originales pequeños conservados como detalles.
- Visita: fondo tinta opaco, dirección, horario habitual en lista de definición, festivos por confirmar, mapa de Google Maps diferido y acciones Cómo llegar/WhatsApp. Sin video detrás.
- Catálogo e Iti IA: en pausa en `features/catalog-iti-ia/`; no se publican ni se enlazan. Al volver, requieren inventario real y servicio publicado, taxonomía controlada, existencia confirmada por la librería y diálogo contextual. Sus contratos históricos en DESIGN.md no definen componentes activos de esta landing.

## Accesibilidad y rendimiento

- Controles de al menos 44 px; botones principales de 48 px; foco ámbar de 3 px con separación de 4 px y respaldo tinta.
- Texto habitual auxiliar desde 0.875rem; datos del hero llegan a 0.8rem en la variante más compacta. No introducir texto menor.
- Sin autoplay, sonido, secuestro de scroll ni `transition: all`.
- `prefers-reduced-motion`, `Save-Data`, batería baja y el control nativo de movimiento mantienen una ruta completa sin video; los fotogramas estáticos no sustituyen texto o acciones.
- Solo el primer fotograma tiene `fetchpriority="high"`; fotos documentales y medios posteriores se difieren. Marca visible con `images/brand/logo-96.webp`.
- No SDKs ni solicitudes a Higgsfield en producción. HTML estático, CSS local y JavaScript nativo.
- Publicar únicamente `public/`, generada por `npm run build:public`; no publicar originales ni archivos del archivo histórico.

## Datos y verdad

No publicar precios, existencia, fechas, cupos, reseñas, calificaciones, alianzas ni recomendaciones sin fuente verificable. Los fixtures deben identificarse como datos de prueba y jamás presentarse como inventario. El horario proviene de la ficha de Google Maps de la librería (confirmado por Aldo el 27-oct-2026); los días festivos se confirman por WhatsApp.
