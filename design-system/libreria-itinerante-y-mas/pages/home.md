# Home Page Override

Aplica a `index.html`, única superficie pública oficial.

## Modelo canónico

El prototipo `Itinerante Home cinematico.dc.html` de Claude Design es la base de composición y trabajo. Su lenguaje editorial se implementa en el HTML estático mantenible; Higgsfield se limita a la capa audiovisual. Los contratos locales de accesibilidad, seguridad, catálogo e Iti IA permanecen intactos.

## Orden

1. Recorrido cinematográfico: entrada y presentación.
2. Navegación por capítulos.
3. Experiencia: libros, café, agenda y comunidad.
4. Agenda cultural.
5. Galería del espacio real.
6. Catálogo vivo e Iti IA.
7. Visita y footer compacto.

## Reglas

- Mantener los anchors `#inicio`, `#experiencia`, `#eventos`, `#galeria`, `#catalogo` y `#ubicacion`.
- Mantener seis elementos `<section>`; el footer no es una sección.
- El video `bg-walkthrough-*` permanece como fondo compartido desde Entrada hasta Agenda, sin atributo autoplay ni loop, y responde al scroll nativo.
- Los siete fotogramas `01-entrada-pasillo` a `07-transicion-libros` forman la secuencia de respaldo y marcan los hitos del recorrido.
- En movimiento reducido, ahorro de datos y batería baja se conserva la experiencia completa con fotogramas estáticos; Catálogo y Visita nunca llevan video detrás.
- No copiar SDKs, navegación generada, contenido de plantilla ni dependencias del proyecto Higgsfield.
- Usar exclusivamente imágenes locales con procedencia preservada.
- Mantener catálogo e Iti IA en los endpoints same-origin `/api/catalog` y `/api/ai/iti-ia`.
- Los chips usan los slugs de `data/taxonomy.controlled.json`; no crear vocabularios paralelos.
- No mostrar datos de prueba como inventario ni inventar disponibilidad.

## Criterio de aceptación

La página debe reconocerse como el diseño editorial cinematográfico aun sin video: verde profundo, menta, papel y ámbar; Playfair Display e Inter; capítulos numerados; hero de marca; experiencia editorial; agenda en lista; galería real; catálogo operativo e Iti IA contextual.
