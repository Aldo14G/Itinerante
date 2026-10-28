# Prompt para Claude Code · Cuaderno de margen

Copia todo lo que está debajo de la línea y pégalo en Claude Code desde la raíz del repo `C:\Proyectos\Itinerante`, con la rama `agent/atenea/casa-editorial-base` ya descargada.

---

Implementa la dirección de arte aprobada «Cuaderno de margen» en la landing de Librería Itinerante y más. Es un frontend estático (`index.html`, `assets/css`, `assets/js`, `images`) que se construye con `npm run build:public` en `public/` y se publica en Firebase.

## Rama y alcance

- Crea la rama `agent/cuaderno-de-margen` desde `agent/atenea/casa-editorial-base`. Esa base tiene el frontend actual «Casa editorial».
- Solo frontend. No toques el backend (`src/`, Iti IA, API del catálogo, configuración de Supabase o del backend de Firebase). El catálogo e Iti IA siguen pausados.
- Al terminar, sube la rama y abre un PR contra `agent/atenea/casa-editorial-base`. No hagas merge ni deploy.

## Material en esta carpeta (`docs/cuaderno-de-margen/`)

- `spec/SPEC-v2.md`: es el spec obligatorio, versión 2.1, con su registro de cambios arriba. Contiene los tokens de paleta con sus contrastes, la selección de fotos por sección, el copy reescrito, los requisitos P0, P1 y P2 (incluida la verificación P0.4 de contenido pendiente) y los espacios N1–N8 para notas a mano.
- `spec/CRITICA-SPEC.md`: la crítica completa, con 21 señales de diseño genérico de IA que hay que eliminar.
- `spec/RESUMEN-ALDO-v2.md`: resumen corto.
- `spec/v2/`: imagen de la paleta, hojas de contacto con la foto que va en cada sección, recortes, `fotos.json`, `palette.json` y `palette_check.py` para verificar el contraste.
- `fotos/`: fotos oficiales. `ig-01` a `ig-18` vienen del Instagram @libreriaitineranteymasmty a 1080 px; de ellas, `ig-01` a `ig-13` muestran el lugar y `ig-14` a `ig-18` son gráficos. `maps-01` es la fachada actual. Los créditos y las fuentes están en `fotos/SOURCES.md`.

Importa las fotos que el spec selecciona como derivados optimizados con el mismo método de `scripts/prepare-official-photos.py` y `docs/official-photo-derivatives.json`: registra la fuente y el SHA-256 de cada una. Asegúrate de que `docs/` y estos originales nunca entren al build público; agrega un test 404 para `docs/cuaderno-de-margen/`.

## Decisiones del dueño (obligatorias, ya reflejadas en el spec 2.1)

- **Fotos:** solo fotos oficiales de Instagram y Google Maps, más las tres `oficial-*` actuales, que el dueño confirmó que son de la sede actual en Matamoros.
- **Nada generado:** quita las recreaciones de Higgsfield, los fotogramas, el MP4 y el código del scrub.
- **Sede anterior:** nunca uses fotos de ella. `maps-02` a `maps-05` quedan fuera.
- **Lo que hay en la casa:**
  - No hay gong; no aparece en ningún lado. Ajedrez sí.
  - Hay café. La carta se llama «Café Itinerante»; los precios y una foto de la carta actual están pendientes.
  - Venden libros usados y nuevos, y el letrero «Libros desde $10» sigue vigente.
  - Los murales del venado y de las raíces son permanentes; el autor está pendiente.
- **Papel picado:** es decoración de temporada de Día de Muertos. Va como capa estacional apagada por defecto (`data-temporada="muertos"`), no en la paleta base.
- **Talleres:** solo la plantilla «Próximamente», sin nombres ni fechas inventadas.
- **Historia y nombre:**
  - La historia de la casa se cuenta solo desde su estética, sin hechos ni fechas inventadas.
  - No menciones la sede anterior (Padre Mier) ni la frase «Desde marzo de 2026».
  - No hay línea sobre la van. El logo con la van se queda como marca.
- **Pendientes:** los cierres de Navidad y Año Nuevo, las notas a mano N1–N8, el autor del mural, los permisos de las fotos y los autores de las `oficial-*`. Déjalos como espacios marcados en el código según el spec, nunca como texto visible de relleno. La verificación P0.4 debe fallar si alguno sale publicado.
- **Créditos:** da crédito visible a @sharonmirelesgong y @alfonso_boeta.

## Barra de calidad

Debe sentirse como una obra de arte digital hecha para esta librería, no como una plantilla. Elimina todas las señales de diseño genérico de IA que lista la crítica: copy en tríadas, hero de plantilla con pastillas y marco girado, simetría genérica y kickers decorativos. Usa tu criterio en la implementación: el spec describe el resultado, no los pasos.

Mantén las garantías que ya existen:
- Contraste WCAG AA, comprobado con `python spec/v2/palette_check.py`.
- Teclado y foco.
- Áreas táctiles de al menos 44 px.
- Movimiento reducido.
- Lectura sin JS.
- CSP.
- 404 en rutas privadas.
- Sin desbordamiento horizontal de 320 a 1920 px.

## Terminado cuando

- `npm test` pasa. Actualiza solo los contratos visuales que el spec reemplaza.
- `npm run build:public` funciona.
- Agregaste tests para los requisitos P0.
- El PR incluye capturas de escritorio y móvil de cada sección y una lista corta de lo que sigue pendiente.

## Reglas del repo

- Autor del commit: `Aldo G Pineda <gioaldo101@gmail.com>`, con el trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Copy en español con acentos correctos y sin mojibake.
- Nunca subas secretos ni archivos `.env`.
- Sin force push.
