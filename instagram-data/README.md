# Repositorio de Datos de Instagram — @libreriaitineranteymasmty

Este directorio contiene los datos estructurados extraídos directamente de la cuenta de Instagram oficial de la librería, listos para integrarse en el sitio web estático.

## Estructura de Datos

- `perfil.json`: Contiene la bio oficial de la cuenta, contadores de publicaciones/seguidores, dirección física estructurada, datos de contacto (WhatsApp) y la lista completa de los 19 Story Highlights activos.
- `posts-extraidos.json`: Archivo de control que almacena los últimos 10 posts analizados con sus captions crudos, hashtags, menciones y conteo de interacciones.
- `eventos.json`: Entidades de tipo "evento" (como presentaciones de libros y conversatorios) extraídas y ordenadas por fecha.
- `talleres.json`: Catálogo de talleres y círculos de lectura detectados, con su correspondiente categorización temática.
- `menciones-frecuentes.json`: Cuentas de colaboradores, fotógrafos y aliados con mayor frecuencia de aparición y su relevancia en el proyecto web.
- `extraccion-log.json`: Historial técnico del scraping realizado (fecha de ejecución, volumen, limitaciones técnicas encontradas).

---

## Directrices para Futuros Agentes de Desarrollo

Al actualizar el contenido del sitio web `index.html` con los datos de esta carpeta, debes respetar las siguientes reglas:

1. **NO Inventar Fechas o Costos**: Si un taller o evento no incluye un día y hora exactos en el post de origen, usa el estado `"recurrente"` o `"proximo"` y utiliza un llamado a la acción genérico (como *"Consultar cupo"* o *"Avisarme"*).
2. **Respetar el Design System**: Antes de modificar cualquier elemento visual en `index.html`, lee [MASTER.md](file:///c:/Proyectos/Itinerante/design-system/libreria-itinerante-y-mas/MASTER.md) y [home.md](file:///c:/Proyectos/Itinerante/design-system/libreria-itinerante-y-mas/pages/home.md). Reutiliza siempre los tokens semánticos definidos en `:root`.
3. **Validación de Enlaces de WhatsApp**: El enlace de WhatsApp principal del sitio es `https://wa.me/528180875940`. Para eventos específicos, añade un texto predeterminado seguro en formato URL-encode (ej. `?text=Hola,%20quiero%20información...`).
4. **Validación de Regresión**: Siempre ejecuta `npm test` después de realizar cambios. Ninguna prueba debe fallar en el entorno local.

---

## Instrucciones para una Nueva Extracción

Cuando se requiera refrescar los datos:
1. Abre un agente con acceso a navegación web.
2. Indícale que visite `https://www.instagram.com/libreriaitineranteymasmty/`.
3. Pídele extraer y sobrescribir los archivos en esta carpeta respetando el esquema de datos actual.
4. Si se encuentra con un "login wall", dile que utilice el HTML guardado en el escritorio como fallback, o que use datos públicos complementarios.
