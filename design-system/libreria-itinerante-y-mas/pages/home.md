# Home Page Override

Aplica a `index.html`, única superficie pública oficial. Tokens en `DESIGN.md`; reglas globales en `../MASTER.md`.

## Modelo canónico

Casa editorial, aprobada por Aldo el 27-oct-2026 en `.impeccable/direction-casa-editorial.md`: un umbral audiovisual breve conduce a fotografía documental y lectura calmada. Se conserva la identidad Playfair Display/Inter y verde/tinta/menta/papel/ámbar. El plan `web-intel/awwwards-libreria/2026-10-27/PLAN.md` documenta la propuesta histórica ahora autorizada; el HTML/CSS/JS local muestra cómo se implementó.

## Orden

1. Inicio: dirección y horario antes del titular original «Una casa para leer, conversar y volver.», WhatsApp y Cómo llegar, retrato oficial contenido y control nativo de movimiento.
2. Experiencia: papel, dos aperturas alternadas de fotografía/texto, libros, café y comunidad.
3. Agenda: verde profundo, lista cultural, consultas por WhatsApp y anuncios en Instagram.
4. Galería: papel, seis fotografías oficiales y pies documentales.
5. Visita: tinta opaca, dirección, horario, mapa y acciones directas; después, footer compacto.

## Reglas

- Mantener los anchors `#inicio`, `#experiencia`, `#eventos`, `#galeria` y `#ubicacion` y exactamente cinco elementos `<section>`; ni el contenedor audiovisual ni el footer añaden secciones.
- La cabecera es tinta opaca. El capítulo visible se identifica con `aria-current` y menta; en pantallas compactas el menú conserva teclado, foco, Escape y estado expandido.
- Limitar `bg-walkthrough-*` a Inicio y la salida corta del umbral: 38svh escritorio y 18svh móvil, sin salida adicional con movimiento reducido. Sin autoplay, loop, sonido ni secuestro de scroll. El video requiere pantalla de al menos 1024 px e interacción real, además de no tener movimiento reducido, ahorro de datos o batería baja.
- Los siete fotogramas `01-entrada-pasillo` a `07-transicion-libros` se cargan al necesitarlos; las variantes móviles incluyen 04–07. Los medios son recreaciones generadas, nunca fotografías reales. El primer fotograma ofrece respaldo desde el inicio.
- Mantener un control nativo para reducir movimiento; respetar siempre `prefers-reduced-motion`. Sin video, todos los anchors, datos y acciones siguen disponibles.
- No recuperar las píldoras de fases, tarjeta demo ni grandes paneles transparentes del modelo anterior. Experiencia/Galería son papel; Agenda es verde; Visita es tinta opaca y no lleva medios detrás.
- Usar las seis fotos oficiales y doce derivados sin ampliación de `images/gallery/oficial-*`, con procedencia en `docs/official-photo-derivatives.json`. Los originales privados de `_archive/reference-inputs/2026-10-27-official-interiors/` nunca entran en `public/`. El retrato de sala mide como máximo 320 px, el detalle de estantes 224 px, encuentro 390 px y mesa compartida 397 px; no ampliar para llenar una retícula.
- No copiar SDKs, marcas, assets, textos o claims de Miu Miu/Noho ni dependencias de Higgsfield.
- Catálogo e Iti IA siguen en pausa en `features/catalog-iti-ia/`: no se publican ni se enlazan. Se reactivan solo con inventario real y backend publicado, actualizando PRODUCT.md, esta página y los tests; al volver usan `/api/catalog`, `/api/ai/iti-ia` y los slugs de `data/taxonomy.controlled.json`.
- El único iframe permitido es Google Maps en Visita, con `loading="lazy"`. No mostrar datos de prueba como inventario ni inventar disponibilidad.

## Criterio de aceptación

La página debe reconocerse como la casa editorial de Itinerante aun sin video: datos prácticos en el primer viewport, titular original y dos acciones, fotografías oficiales reconocibles y dentro de su resolución, alternancia papel/verde/tinta, agenda honesta y visita operable. Verificar móvil y escritorio, anchors, menú con teclado, foco visible, recursos diferidos y ausencia de errores de consola. Los tests locales no sustituyen revisión visual ni autorización de despliegue.
