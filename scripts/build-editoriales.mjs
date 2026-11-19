// El bloque «Editoriales» del Catálogo (#libros) pintado en index.html desde assets/data/catalog.json (2026-11-19).
// node scripts/build-editoriales.mjs          reescribe lo que va entre <!-- editoriales:inicio --> y <!-- editoriales:fin -->
// node scripts/build-editoriales.mjs --check  sale con 1 si index.html no coincide con el catálogo (lo corre también npm test)
// Mismo patrón que la carta y las preguntas frecuentes: el catálogo real es la fuente (campo `p` de cada libro; la lógica pura vive en catalog.js:
// editorialesDe, editorialesPlan). Llega pintado: sin JavaScript cada editorial es un enlace a #catalogo; con JavaScript, app.js abre Explorar con el
// filtro de esa editorial ya aplicado. Con menos de EDITORIALES_MIN editoriales (hoy hay 4) no se pinta nada: ni hueco ni encabezado.
// Para actualizarlo: se corrige la hoja de la librería, se reimporta (python3 scripts/import-inventario.py) y se corre `npm run editoriales`.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editorialesPlan, editorialesNota, titulosLabel } from '../catalog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const INDEX_PATH = join(root, 'index.html');
export const CATALOG_PATH = join(root, 'assets/data/catalog.json');
export const INICIO = '<!-- editoriales:inicio · generadas desde assets/data/catalog.json con `npm run editoriales`; no se editan a mano -->';
export const FIN = '<!-- editoriales:fin -->';
export const VISIBLES = 7; // Hick: no más de 7 opciones a la vista; el resto, tras «Ver las N editoriales»

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function filaHtml(e, ind) {
  return `${ind}<li><a class="edit-fila" href="#catalogo" data-editorial="${esc(e.nombre)}"><span class="edit-nom">${esc(e.nombre)}</span><span class="sr-only">, </span><span class="edit-n">${titulosLabel(e.titulos)}</span><svg class="ic edit-ir" aria-hidden="true"><use href="#t-chevron"/></svg></a></li>`;
}

/** El marcado del bloque con la sangría `ind`; vacío si hay menos de EDITORIALES_MIN editoriales. `books`: el arreglo `books` de catalog.json. */
export function editorialesHtml(books, ind = '      ') {
  const plan = editorialesPlan(books);
  if (!plan.mostrar) return `${ind}${INICIO}\n${ind}${FIN}`;
  const vista = plan.lista.slice(0, VISIBLES), resto = plan.lista.slice(VISIBLES);
  const lista = [
    `${ind}  <ul class="edit-lista" aria-labelledby="edit-title">`,
    ...vista.map(e => filaHtml(e, `${ind}    `)),
    ...(resto.length ? [
      `${ind}    <li class="edit-mas">`,
      `${ind}      <details class="edit-resto">`,
      `${ind}        <summary class="edit-resto-btn"><span class="edit-resto-abrir">Ver las ${plan.lista.length} editoriales</span><span class="edit-resto-cerrar">Ver menos editoriales</span></summary>`,
      `${ind}        <ul class="edit-lista edit-lista--resto">`,
      ...resto.map(e => filaHtml(e, `${ind}          `)),
      `${ind}        </ul>`,
      `${ind}      </details>`,
      `${ind}    </li>`
    ] : []),
    `${ind}  </ul>`
  ];
  return [
    `${ind}${INICIO}`,
    `${ind}<div class="edit" id="editoriales" data-editoriales>`,
    `${ind}  <div class="edit-head">`,
    `${ind}    <h3 class="edit-tit" id="edit-title">Editoriales <em>independientes, una por una</em></h3>`,
    `${ind}    <p class="edit-nota">${esc(editorialesNota(plan))}</p>`,
    `${ind}  </div>`,
    ...lista,
    `${ind}</div>`,
    `${ind}${FIN}`
  ].join('\n');
}

/** index.html con el bloque de `books` entre sus marcas. */
export function withEditoriales(html, books) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas de Editoriales (<!-- editoriales:inicio … --> y <!-- editoriales:fin -->)');
  const lineStart = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(lineStart, a);
  return html.slice(0, lineStart) + editorialesHtml(books, ind) + html.slice(b + FIN.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(INDEX_PATH, 'utf8');
  const { books } = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const next = withEditoriales(html, books);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('El bloque Editoriales de index.html no coincide con assets/data/catalog.json. Ejecuta "npm run editoriales".'); process.exit(1); }
    console.log('editoriales al día');
  } else {
    writeFileSync(INDEX_PATH, next);
    const plan = editorialesPlan(books);
    console.log(plan.mostrar ? `editoriales pintadas en index.html (${plan.lista.length}; ${editorialesNota(plan)})` : `menos de 3 editoriales (${plan.lista.length}): el bloque no se pinta`);
  }
}
