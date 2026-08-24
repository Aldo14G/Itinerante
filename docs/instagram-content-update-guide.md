# Guía de Actualización de Contenido desde Instagram

Esta guía detalla el proceso para mantener sincronizada la información del sitio web de **Librería Itinerante y Más** con las novedades, talleres y eventos publicados en la cuenta de Instagram oficial **@libreriaitineranteymasmty**.

---

## 1. Frecuencia de Sincronización Recomendada

Se aconseja realizar este proceso **cada 15 días** o antes de eventos culturales importantes (bazaares, inauguración de talleres de temporada, etc.).

---

## 2. Procedimiento de Actualización Paso a Paso

### Paso 2.1: Extracción de Datos
1. Utilizar un agente con capacidad de navegación automatizada o realizar la extracción manual de los últimos posts (captions, menciones, enlaces en bio y Story Highlights).
2. Actualizar los JSON de control correspondientes en el directorio [instagram-data/](file:///c:/Proyectos/Itinerante/instagram-data/):
   - `perfil.json`: si cambia la bio o los Story Highlights principales.
   - `eventos.json`: agregar o modificar los eventos de la agenda cultural.
   - `talleres.json`: actualizar los talleres recurrentes y activos.

### Paso 2.2: Actualización de index.html
1. **Talleres y Eventos (`#eventos`)**:
   - Abrir [index.html](file:///c:/Proyectos/Itinerante/index.html) y buscar la sección `<section id="eventos" class="events-section">`.
   - Modificar las tarjetas `<article class="event-card">` mapeando las propiedades obtenidas:
     - `event-status`: Estado del registro (ej. "Inscripciones abiertas", "Próximamente", "16 de Julio").
     - `event-title`: Título del evento o taller (máx. 35 caracteres).
     - `event-description`: Resumen del evento (máx. 90 caracteres).
     - `event-meta`: Píldoras de metadatos (formato, tipo de evento).
     - `event-cta` (href): Enlace directo de WhatsApp con mensaje personalizado, o enlace de registro directo (`https://bit.ly/xxxx`).

2. **Aliados (`#aliados`)**:
   - Buscar `<section id="aliados" class="allies-section">` en [index.html](file:///c:/Proyectos/Itinerante/index.html).
   - Actualizar las tarjetas de la lista `<ul class="allies-grid">` con los nombres, enlaces de perfil de Instagram o sitios web de los aliados reales verificados.

### Paso 2.3: Validación y Pruebas
1. Ejecutar las pruebas locales en la terminal:
   ```bash
   npm test
   ```
2. Verificar que no haya errores de regresión ni fallos de aserción en el CSS/HTML.
3. Iniciar el servidor local de previsualización:
   ```bash
   npm run preview
   ```
4. Visitar `http://127.0.0.1:8080/` y comprobar visualmente en desktop y mobile:
   - Que las tarjetas de eventos se rendericen correctamente y el carrusel funcione suavemente.
   - Que el degradado de fondo (`--event-bg`) sea legible y coherente con el color asignado.
   - Que todos los enlaces tengan el atributo `target="_blank" rel="noopener"`.
   - Que no haya errores de consola del navegador o recursos bloqueados por la política CSP.

---

## 3. Resolución de Problemas y Casos de Borde (Edge Cases)

| Problema | Solución Recomendada |
|----------|----------------------|
| **El taller no tiene fecha definida.** | Usar `event-status: "Próximamente"` o `event-status: "Comunidad"` y cambiar el texto del CTA a *"Avisarme"*. |
| **No se cuenta con imágenes del aliado.** | Utilizar los placeholders SVG locales en la carpeta `images/aliados/` que corresponden a la paleta de colores de la marca. |
| **El enlace de WhatsApp no funciona.** | Asegurarse de que no contenga espacios ni caracteres especiales sin codificar. Usar `encodeURIComponent` para el mensaje personalizado. |
| **Los tests fallan por límites de movimiento.** | Revisar que no se hayan introducido estilos en línea o delays de animación que excedan el presupuesto de movimiento (Motion Budget) definido de 250ms/300ms en `tests/site.test.mjs`. |
