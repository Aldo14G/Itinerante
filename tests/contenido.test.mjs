// Contenido nuevo del 2026-11-19: preguntas frecuentes de Visita, Editoriales del Catálogo, Merch (oculto hasta tener productos) y marca/SEO
// listos para el dominio (sin dominio). Todo con datos reales o sin datos: `node --test tests/contenido.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validMerch, merchProblems, merchMessage, merchWaUrl, precioMerch, validFotoMerch, merchCard, merchSection, MERCH_URL } from '../merch.js';
import { problemasDisco as merchDisco } from '../scripts/check-merch.mjs';
import { editorialesDe, editorialesPlan, editorialesNota, editorialKey, titulosLabel, EDITORIALES_MIN, filterBooks } from '../catalog.js';
import { editorialesHtml, withEditoriales, VISIBLES, INICIO as ED_INICIO, FIN as ED_FIN } from '../scripts/build-editoriales.mjs';
import { faqProblems, faqHtml, withFaq, respuestaHtml, anclasDe, idsDe, FAQ_MAX, INICIO as FAQ_INICIO, FIN as FAQ_FIN } from '../scripts/build-faq.mjs';

const repo = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, repo), 'utf8');
const json = p => JSON.parse(read(p));
const html = read('index.html');
const pendientes = read('docs/PENDIENTES-NEGOCIO.md');

// ---------------------------------------------------------------- 1. Preguntas frecuentes
test('FAQ: faq.json pasa la revisión (con las anclas de index.html) y index.html es lo que pinta build-faq (npm run faq)', () => {
  const faq = json('assets/data/faq.json');
  assert.deepEqual(faqProblems(faq, { ids: idsDe(html) }), [], 'faq.json válido y con anclas que existen');
  assert.equal(withFaq(html, faq), html, 'el bloque de index.html es el de faq.json');
  assert.ok(html.includes(FAQ_INICIO) && html.includes(FAQ_FIN));
  const pkg = read('package.json');
  assert.ok(/"faq": "node scripts\/build-faq\.mjs"/.test(pkg) && /"faq:check": "node scripts\/build-faq\.mjs --check"/.test(pkg), 'npm run faq y faq:check');
  assert.ok(/tests\/contenido\.test\.mjs/.test(pkg), 'este archivo corre dentro de npm test');
});

test('FAQ: solo las respuestas confirmadas por Aldo (leer con el café, pedir la obra, horario y festivos ya publicados); «¿Dónde están?» se omite por redundante', () => {
  const faq = json('assets/data/faq.json');
  assert.deepEqual(faq.preguntas.map(p => p.id), ['libro', 'leer', 'horario', 'festivos']);
  assert.deepEqual(faq.preguntas.map(p => p.pregunta), ['¿Tienen el libro que busco?', '¿Puedo quedarme a leer?', '¿A qué hora abren?', '¿Abren en días festivos?']);
  const r = Object.fromEntries(faq.preguntas.map(p => [p.id, p.respuesta]));
  assert.match(r.leer, /^Sí\. Con tu café, puedes quedarte a leer en la sala\./, 'quedarse a leer va siempre con el consumo del café');
  assert.match(r.libro, /Consultar disponibilidad/); assert.match(r.libro, /te lo podemos pedir/);
  assert.match(r.festivos, /Pregúntanos antes por WhatsApp/);
  assert.ok(!/\d{1,2}:\d{2}/.test(r.horario), 'el horario no se duplica: se remite a su sitio');
  assert.ok(!faq.preguntas.some(p => /d[oó]nde/i.test(p.pregunta)), '«¿Dónde están?» repetiría la dirección que ya está arriba');
  assert.ok(faq.preguntas.length <= FAQ_MAX);
  // «nosotros»: la casa habla en primera persona del plural y a la persona de tú
  assert.ok(!/la librería (confirma|tiene|pide)/i.test(JSON.stringify(faq)));
});

test('FAQ: el validador rechaza lo no confirmado, las promesas, las anclas rotas y el HTML', () => {
  const ok = { preguntas: [{ id: 'a', pregunta: '¿Algo?', respuesta: 'Una respuesta de prueba con [enlace](#cafe) y nada más.' }] };
  assert.deepEqual(faqProblems(ok, { ids: new Set(['cafe']) }), []);
  const malo = r => faqProblems({ preguntas: [{ id: 'a', pregunta: '¿Algo?', respuesta: r }] }, { ids: new Set(['cafe']) });
  for (const [txt, re] of [
    ['Aceptamos tarjeta de crédito y débito en la caja.', /pagos o factura/], ['Emitimos factura si la pides al pagar la cuenta.', /pagos o factura/],
    ['Tenemos estacionamiento propio para quien nos visita.', /estacionamiento o accesibilidad/], ['El local es accesible para silla de ruedas.', /estacionamiento o accesibilidad/],
    ['Hacemos envíos a todo el país con paquetería local.', /envíos/], ['Puedes apartar tu libro por una semana entera.', /apartado/], ['Vienen bien las mascotas y los niños a la sala.', /apartado, mascotas/],
    ['Quedarte a leer en la sala es gratis para todos.', /gratis/], ['El libro está disponible hoy mismo en la tienda.', /disponibilidad/], ['Te lo conseguimos en cinco días hábiles, sin falta.', /plazo/]
  ]) assert.ok(malo(txt).some(p => re.test(p)), `rechaza: ${txt} → ${malo(txt)}`);
  assert.ok(malo('Mira <b>esto</b> con calma, por favor ahora.').some(p => /enlaces/.test(p)), 'nada de HTML');
  assert.ok(malo('Mira [esto](https://example.com) con calma, por favor.').some(p => /enlaces/.test(p)), 'nada de URL externas');
  assert.ok(malo('Mira [esto](#no-existe) con calma, por favor ahora.').some(p => /#no-existe no existe/.test(p)), 'ancla inexistente');
  assert.ok(faqProblems({ preguntas: [{ id: 'A b', pregunta: 'Algo', respuesta: 'corta' }, { id: 'a', pregunta: '¿Dos?', respuesta: 'x'.repeat(400) }] }).length >= 4);
  assert.ok(faqProblems({ preguntas: [] }).length && faqProblems(null).length, 'sin preguntas no hay bloque');
  const ocho = { preguntas: Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, pregunta: `¿Pregunta ${i}?`, respuesta: 'Una respuesta de prueba sin más detalle aquí.' })) };
  assert.ok(faqProblems(ocho).some(p => /máximo es 7/.test(p)), 'Hick: ≤ 7');
  const dup = { preguntas: [ok.preguntas[0], ok.preguntas[0]] };
  assert.ok(faqProblems(dup).some(p => /repetido/.test(p)));
});

test('FAQ: el marcado es details/summary nativo, con titular h3, grupo con nombre, enlaces escapados y sin nada si no hay preguntas', () => {
  const faq = json('assets/data/faq.json');
  const bloque = html.slice(html.indexOf(FAQ_INICIO), html.indexOf(FAQ_FIN));
  assert.match(bloque, /<h3 class="faq-tit" id="faq-title">Preguntas frecuentes<\/h3>/);
  assert.match(bloque, /<div class="faq-lista" role="group" aria-labelledby="faq-title">/);
  assert.equal([...bloque.matchAll(/<details class="faq-item" id="faq-[a-z-]+">/g)].length, faq.preguntas.length);
  assert.equal([...bloque.matchAll(/<summary class="faq-preg"><span>[^<]+<\/span><svg class="ic faq-chev" aria-hidden="true"><use href="#i-chev"\/><\/svg><\/summary>/g)].length, faq.preguntas.length);
  assert.ok(!/<details[^>]*\sopen\b/.test(bloque), 'todas cerradas al cargar');
  assert.ok(/<symbol id="i-chev"/.test(html), 'el chevron está en el sprite');
  assert.equal(respuestaHtml('Ve a [la carta](#cafe) <ya> & "luego"'), 'Ve a <a href="#cafe">la carta</a> &lt;ya&gt; &amp; &quot;luego&quot;');
  assert.deepEqual(anclasDe('a [x](#uno) b [y](#dos-2)'), ['uno', 'dos-2']);
  assert.equal(faqHtml({ preguntas: [] }, '  ').trim(), `${FAQ_INICIO}\n  ${FAQ_FIN}`, 'sin preguntas válidas no se pinta nada');
  assert.equal(html.match(/<h1\b/g).length, 1, 'un solo h1 en la página');
  // el bloque va en Visita, tras el mapa y la foto (orden del marcado = orden del teléfono) y antes del pie
  const visita = html.slice(html.indexOf('<section id="visita"'), html.indexOf('</main>'));
  assert.ok(visita.indexOf('visit-map') < visita.indexOf('visit-arrival') && visita.indexOf('visit-arrival') < visita.indexOf(FAQ_INICIO), 'FAQ después de mapa y foto');
  assert.ok(html.indexOf(FAQ_FIN) < html.indexOf('<footer class="ftr"'), 'FAQ antes de Contacto');
  // las anclas de las respuestas existen: #catalogo, #cafe, #horario, #contacto
  const ids = idsDe(html);
  for (const a of ['catalogo', 'cafe', 'horario', 'contacto']) assert.ok(ids.has(a), `#${a} existe`);
});

test('FAQ: CSS: summary de 56, chevron que gira y fundido de la respuesta solo con movimiento, hover solo con puntero que flota, foco visible', () => {
  const css = read('style.css').replace(/\s+/g, ' ');
  assert.match(css, /\.faq-preg \{[^}]*min-height: var\(--alto-lg\);/);
  assert.match(css, /\.motion \.faq-chev \{ transition: transform var\(--dur-rapida\) var\(--curva-salida\); \}/);
  assert.match(css, /\.motion \.faq-item\[open\] > \.faq-resp \{ animation: faq-entra var\(--dur-rapida\) var\(--curva-salida\); \}/);
  assert.ok(!/(^|[^.])\.faq-chev \{[^}]*transition/.test(css.replace(/\.motion \.faq-chev \{[^}]*\}/, '')), 'ninguna transición del chevron fuera de .motion');
  assert.match(css, /@media \(hover: hover\) \{ \.faq-preg:hover > span/);
  assert.match(css, /\.faq-preg:focus-visible \{ outline: 2px solid transparent; box-shadow: var\(--anillo-foco\); \}/);
  assert.match(css, /\.visit-faq \{ grid-column: 1 \/ -1; grid-row: 4;[^}]*grid-template-columns: subgrid;/);
  assert.match(css, /\.visit-faq > \.faq-tit \{ grid-column: 1 \/ span 6; \}\s*\.visit-faq > \.faq-lista \{ grid-column: 7 \/ -1;/);
});

test('Pendientes de negocio: cada pregunta que falta confirmar tiene su redacción y un campo vacío para la respuesta; nada de eso está publicado', () => {
  for (const tema of ['formas de pago', 'tarjeta', 'factura', 'accesibilidad', 'estacionamiento', 'envíos', 'tarjetas de regalo', 'apartado', 'mascotas', 'edad']) {
    assert.ok(new RegExp(tema, 'i').test(pendientes), `PENDIENTES-NEGOCIO.md trae: ${tema}`);
  }
  assert.ok((pendientes.match(/\*\*Respuesta de Aldo:\*\*\s*$/gm) || []).length >= 9, 'un campo vacío «Respuesta de Aldo:» por pregunta');
  assert.ok(!/gratis|garantiz/i.test(read('assets/data/faq.json')));
});

// ---------------------------------------------------------------- 2. Editoriales
const catalogo = json('assets/data/catalog.json');
const libro = (id, p) => ({ id, t: `Libro ${id}`, a: 'Autor', p });

test('Editoriales: salen de catalog.json (campo `p`): cada una existe, los conteos suman los libros con editorial y el orden es estable (títulos y luego alfabético)', () => {
  const plan = editorialesPlan(catalogo.books);
  const reales = new Set(catalogo.books.map(b => b.p).filter(Boolean));
  assert.deepEqual(new Set(plan.lista.map(e => e.nombre)), reales, 'las editoriales del bloque son las del catálogo, ni una más ni una menos');
  for (const e of plan.lista) assert.equal(e.titulos, catalogo.books.filter(b => b.p === e.nombre).length, `${e.nombre}: conteo`);
  assert.equal(plan.conEditorial, catalogo.books.filter(b => b.p).length);
  assert.equal(plan.total, catalogo.books.length);
  assert.deepEqual(plan.lista.map(e => [e.nombre, e.titulos]), [['Abismos Casa Editorial', 19], ['Capítulo Siete', 10], ['Iridiscencias', 10], ['Libro Objeto', 1]], 'más títulos primero y, a igualdad, alfabético');
  assert.equal(plan.mostrar, true, `hay ${plan.lista.length} ≥ ${EDITORIALES_MIN} editoriales: el bloque se pinta`);
  assert.equal(editorialesNota(plan), '4 editoriales · 40 de los 41 títulos', 'la nota dice solo lo que es cierto: un título no trae editorial en la hoja');
  assert.deepEqual(editorialesDe(catalogo.books), editorialesDe([...catalogo.books].reverse()), 'el orden no depende del orden del catálogo');
  // el filtro Editorial de Explorar con el nombre de una fila da exactamente sus títulos
  for (const e of plan.lista) assert.equal(filterBooks(catalogo.books, { p: new Set(e.variantes) }).length, e.titulos, `${e.nombre}: el filtro devuelve sus ${e.titulos} títulos`);
});

test('Editoriales: dos grafías son la misma solo si difieren en mayúsculas, acentos o espacios; nombres distintos no se mezclan; sin inventar', () => {
  const lista = editorialesDe([libro('a', 'Capítulo Siete'), libro('b', 'capitulo  siete'), libro('c', 'Capítulo Siete'), libro('d', 'Capítulo 7'), libro('e', null), libro('f', '   '), libro('g', 'Abismos')]);
  assert.deepEqual(lista.map(e => [e.nombre, e.titulos, e.variantes]), [['Capítulo Siete', 3, ['Capítulo Siete', 'capitulo siete']], ['Abismos', 1, ['Abismos']], ['Capítulo 7', 1, ['Capítulo 7']]]);
  assert.equal(editorialKey('  Capítulo   Siete '), editorialKey('capitulo siete'));
  assert.notEqual(editorialKey('Capítulo 7'), editorialKey('Capítulo Siete'), 'un número no es una grafía de una palabra: no se normaliza');
  assert.equal(titulosLabel(1), '1 título'); assert.equal(titulosLabel(19), '19 títulos');
  assert.equal(editorialesNota({ lista: [1, 2, 3], conEditorial: 41, total: 41 }), '3 editoriales · 41 títulos');
});

test('Editoriales: con menos de 3 no se pinta el bloque (ni hueco ni encabezado); con más de 7, las primeras 7 y «Ver las N editoriales»', () => {
  const vacio = `      ${ED_INICIO}\n      ${ED_FIN}`;
  assert.equal(editorialesHtml([libro('a', 'Una')], '      '), vacio, 'una sola editorial: nada');
  assert.equal(editorialesHtml([libro('a', 'Una'), libro('b', 'Dos')], '      '), vacio, 'dos: nada');
  assert.equal(editorialesHtml([], '      '), vacio);
  assert.ok(editorialesHtml([libro('a', 'Una'), libro('b', 'Dos'), libro('c', 'Tres')], '      ').includes('class="edit"'), 'tres: sí');
  const doce = editorialesHtml(Array.from({ length: 12 }, (_, i) => libro(`l${i}`, `Editorial ${String.fromCharCode(65 + i)}`)), '      ');
  assert.equal((doce.match(/class="edit-fila"/g) || []).length, 12);
  assert.equal(VISIBLES, 7);
  assert.match(doce, /<details class="edit-resto">\s*<summary class="edit-resto-btn"><span class="edit-resto-abrir">Ver las 12 editoriales<\/span><span class="edit-resto-cerrar">Ver menos editoriales<\/span><\/summary>/);
  const antes = doce.slice(0, doce.indexOf('<details'));
  assert.equal((antes.match(/class="edit-fila"/g) || []).length, 7, 'siete a la vista (Hick)');
  const raro = editorialesHtml([libro('a', 'A & B <i>"x"</i>'), libro('b', 'Dos'), libro('c', 'Tres')], '      ');
  assert.ok(raro.includes('data-editorial="A &amp; B &lt;i&gt;&quot;x&quot;&lt;/i&gt;"'), 'el nombre se escapa');
});

test('Editoriales: index.html es lo que pinta build-editoriales (npm run editoriales); va dentro de #libros, tras Explorar y antes del cierre, sin entrada en la barra, el menú ni la barra inferior', () => {
  assert.equal(withEditoriales(html, catalogo.books), html, 'el bloque de index.html es el del catálogo');
  assert.ok(/"editoriales": "node scripts\/build-editoriales\.mjs"/.test(read('package.json')) && /"editoriales:check": "node scripts\/build-editoriales\.mjs --check"/.test(read('package.json')));
  const libros = html.slice(html.indexOf('<section id="libros"'), html.indexOf('<section id="cartelera"'));
  const i = libros.indexOf('id="editoriales"');
  assert.ok(i > libros.indexOf('id="catalogo"') && i < libros.indexOf('class="books-foot"'), 'después de Explorar, antes del cierre');
  assert.match(libros, /<h3 class="edit-tit" id="edit-title">Editoriales <em>independientes, una por una<\/em><\/h3>/);
  assert.match(libros, /<p class="edit-nota">4 editoriales · 40 de los 41 títulos<\/p>/);
  assert.equal([...libros.matchAll(/<a class="edit-fila" href="#catalogo" data-editorial="([^"]+)">/g)].length, 4, 'sin JavaScript cada editorial es un enlace a #catalogo');
  const chrome = [html.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0], html.match(/<dialog class="menu"[\s\S]*?<\/dialog>/)[0], html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)?.[0] ?? ''].join('\n');
  assert.ok(!/editorial/i.test(chrome), 'la barra, el ☰ y la barra inferior no ganan una entrada (Hick/Miller)');
  assert.equal(html.match(/<h1\b/g).length, 1);
});

test('Editoriales: el gestor del clic abre Explorar con el filtro (teléfono: hoja y foco de vuelta a la fila; escritorio: baja a la rejilla) y el catálogo atiende el evento', () => {
  const app = read('app.js'), cat = read('catalog.js');
  assert.match(app, /a\[data-editorial\]/); assert.match(app, /new CustomEvent\('iti:filtrar-editorial', \{ detail \}\)/);
  assert.match(app, /if \(!a \|\| a\.dataset\.editorial !== undefined\) return;/, 'el gestor genérico de #catalogo no pisa a las editoriales');
  assert.match(app, /\(origen\?\.isConnected \? origen : \$\('\[data-ex-open\]'\)\)\?\.focus\(\{ preventScroll: true \}\)/, 'al cerrar la hoja el foco vuelve a la fila de origen');
  assert.match(cat, /document\.addEventListener\('iti:filtrar-editorial'/);
  assert.match(cat, /state\.q = ''; input\.value = ''; state\.k\.clear\(\); state\.g\.clear\(\); state\.f\.clear\(\);[^\n]*\n\s*state\.p = variantes;/, 'quita búsqueda y demás filtros: el resultado son exactamente sus títulos');
  assert.ok(!/setTimeout|setInterval/.test(app.slice(app.indexOf("a[data-editorial]"), app.indexOf("a[data-editorial]") + 1500)), 'ningún milisegundo escrito a mano');
});

// ---------------------------------------------------------------- 3. Merch (preparado, oculto hasta tener productos)
const prod = (o = {}) => ({ id: 'playera', nombre: 'Playera con logo', tipo: 'Playera', descripcion: null, precio: 250, foto: null, disponibilidad: null, ...o });

test('Merch: merch.json real pasa la revisión con el disco; hoy sin productos no hay NADA en index.html (ni sección, ni enlaces, ni clase)', () => {
  const data = json('assets/data/merch.json');
  assert.deepEqual(merchDisco(data), [], 'merch.json válido (con disco: cada foto existe y está registrada como real)');
  assert.equal(MERCH_URL, 'assets/data/merch.json');
  assert.ok(Array.isArray(data.productos), 'productos es una lista');
  assert.equal(validMerch(data).length, data.productos.length, 'todos los productos del repositorio son válidos');
  // La sección la monta merch.js solo con productos válidos: el HTML estático no trae rastro (ni para lectores ni para la barra).
  assert.ok(!/id="merch"|href="#merch"|data-merch|has-merch|class="merch/.test(html), 'index.html no trae sección, enlaces ni clase de Merch');
  const css = read('style.css');
  assert.ok(!/<[^>]*merch/i.test(read('mobile.css')) && /\.merch \{/.test(css), 'el CSS está listo para cuando aparezca');
  assert.ok(/"merch:check": "node scripts\/check-merch\.mjs"/.test(read('package.json')));
});

test('Merch: validación (Postel): id repetido, precio, foto, disponibilidad y huecos; merchProblems lo reporta todo', () => {
  assert.deepEqual(validMerch(null), []); assert.deepEqual(validMerch({}), []); assert.deepEqual(validMerch({ productos: 'x' }), []);
  const lista = validMerch({ productos: [prod(), prod({ nombre: 'Otra' }), prod({ id: 'Mal Id' }), prod({ id: 'sin-nombre', nombre: '  ' }), null, 3, prod({ id: 'taza', nombre: 'Taza', tipo: 'Taza', precio: -4, disponibilidad: 'agotado', foto: { src: 'https://x.test/a.jpg', alt: 'x' } }), prod({ id: 'bolsa', nombre: 'Bolsa', precio: 85.5, disponibilidad: 'encargo', descripcion: ' Tela. ', foto: { src: 'assets/img/merch/bolsa.webp', chica: 'assets/img/merch/bolsa-600.webp', alt: 'Bolsa de tela' } })] });
  assert.deepEqual(lista.map(p => p.id), ['playera', 'taza', 'bolsa'], 'id repetido: gana el primero; id mal escrito, sin nombre o no objeto: fuera');
  assert.equal(lista[0].nombre, 'Playera con logo');
  assert.deepEqual([lista[1].precio, lista[1].disponibilidad, lista[1].foto], [null, null, null], 'precio negativo, disponibilidad desconocida y foto no local: se toman como vacíos');
  assert.deepEqual([lista[2].precio, lista[2].disponibilidad, lista[2].descripcion, lista[2].foto], [85.5, 'encargo', 'Tela.', { src: 'assets/img/merch/bolsa.webp', alt: 'Bolsa de tela', chica: 'assets/img/merch/bolsa-600.webp' }]);
  for (const bad of [{ src: 'assets/img/merch/a.webp' }, { src: 'assets/img/merch/a.webp', alt: '  ' }, { src: '//cdn.test/a.webp', alt: 'x' }, { src: 'assets/img/merch/../x.webp', alt: 'x' }, { src: 'assets/img/portadas/a.webp', alt: 'x' }, null, 'x']) assert.equal(validFotoMerch(bad), null, JSON.stringify(bad));
  assert.equal(precioMerch(85), '$85 MXN'); assert.equal(precioMerch(85.5), '$85.50 MXN');
  for (const bad of [0, -1, NaN, Infinity, '85', null, undefined, 1e6]) assert.equal(precioMerch(bad), null, `precio inválido: ${bad}`);
  const pr = merchProblems({ productos: [prod({ id: 'A b', nombre: '', tipo: '', precio: 0, disponibilidad: 'hay ', foto: { src: 'x' } }), prod(), prod()] }, { fotoExiste: () => false, fotoRegistrada: () => false });
  for (const re of [/id en minúsculas/, /falta el nombre/, /falta el tipo/, /precio es un número positivo/, /disponibilidad es "hay", "encargo" o null/, /foto necesita src local/, /id repetido/]) assert.ok(pr.some(p => re.test(p)), `reporta ${re}: ${pr.join(' | ')}`);
  const conFoto = merchProblems({ productos: [prod({ foto: { src: 'assets/img/merch/playera.webp', alt: 'x' } })] }, { fotoExiste: () => false, fotoRegistrada: () => false });
  assert.deepEqual(conFoto.map(p => p.replace(/^[^:]+: /, '')), ['la foto assets/img/merch/playera.webp no existe en el disco', 'la foto assets/img/merch/playera.webp no está registrada como real en assets/provenance.json']);
  assert.deepEqual(merchProblems({ productos: [] }), [], 'vacío es válido'); assert.ok(merchProblems(null).length && merchProblems({}).length);
});

test('Merch: la tarjeta es «Consultar disponibilidad» por WhatsApp con producto y precio escritos; nunca afirma existencias; sin precio no imprime nada', () => {
  assert.equal(merchMessage(prod()), 'Hola, quiero consultar la disponibilidad de «Playera con logo» ($250 MXN).');
  assert.equal(merchMessage(prod({ precio: null })), 'Hola, quiero consultar la disponibilidad de «Playera con logo».');
  assert.equal(merchMessage(prod({ disponibilidad: 'encargo' })), 'Hola, quiero consultar la disponibilidad de «Playera con logo» (por encargo, $250 MXN).');
  assert.equal(merchMessage(prod({ disponibilidad: 'hay' })), merchMessage(prod()), '«hay» no cambia nada: el sitio no afirma existencias');
  const url = merchWaUrl(prod({ nombre: 'Taza «Itinerante» & más' }));
  assert.ok(url.startsWith('https://wa.me/528180875940?text=') && decodeURIComponent(url).includes('Taza «Itinerante» & más'), 'número de la librería y texto codificado');
  const js = read('merch.js').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/\bdisponible\b|existencia|agotad|gratis|en stock/i.test(js.replace(/consultar (la |su )?disponibilidad/gi, '').replace(/el sitio nunca afirma existencias/gi, '')), 'ningún texto de merch.js afirma existencias');
  assert.ok(!/setTimeout|setInterval|localStorage/.test(js), 'ningún milisegundo escrito a mano ni almacenamiento');
  assert.ok(/fetch\(MERCH_URL\)/.test(js) && !/https?:\/\/(?!wa\.me)/.test(js.replace(/http:\/\/www\.w3\.org\/2000\/svg/, '')), 'solo lee su JSON y solo habla con wa.me');
  assert.ok(/data-fuente|dataset\.fuente = 'merch'/.test(js));
});

test('Merch: la sección se monta en app.js solo con productos válidos (zona del destino actual y enlaces al aparecer), se sirve y se publica', () => {
  const app = read('app.js'), m = read('merch.js');
  assert.match(m, /if \(!productos\.length \|\| !visita\) return false;/);
  assert.match(m, /visita\.before\(merchSection\(productos\)\)/, 'entre Café y Visita');
  assert.match(m, /document\.dispatchEvent\(new CustomEvent\('iti:merch'/);
  assert.match(app, /document\.addEventListener\('iti:merch', \(\) => \{\s*zones\.push\(\{ hash: '#merch'/);
  assert.match(app, /navLinks\.push\(\.\.\.\$\$\('\.hdr-nav a\[href="#merch"\], \.menu-row\[href="#merch"\]'\)\)/);
  assert.match(app, /whenIdle\(\(\) => import\('\.\/merch\.js'\)\.then\(m => m\.initMerch\(\)\)\.catch\(\(\) => \{\}\), \{ timeout: 3000 \}\)/);
  assert.ok(!/tabbar/.test(m), 'sin entrada en la barra inferior');
  const pub = read('scripts/prepare-public.mjs'), prev = read('tools/preview-site.mjs');
  assert.ok(/"merch\.js"/.test(pub) && /"assets\/data\/merch\.json"/.test(pub) && /"assets\/data\/faq\.json"/.test(pub), 'prepare-public publica merch.js y los JSON');
  assert.ok(prev.includes("'/merch.js'"), 'la vista previa sirve merch.js');
  assert.equal(typeof merchCard, 'function'); assert.equal(typeof merchSection, 'function');
});

test('Merch: scripts/foto-merch.py da de alta un artículo con su foto cuadrada (1200 y 600), la registra como real y el resultado pasa la revisión; falla sin --alt o sin nombre', t => {
  const py = spawnSync('python3', ['-c', 'import PIL'], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('sin Python con Pillow'); return; }
  const tmp = mkdtempSync(join(tmpdir(), 'iti-merch-'));
  try {
    mkdirSync(join(tmp, 'assets/data'), { recursive: true });
    copyFileSync(new URL('assets/data/merch.json', repo), join(tmp, 'assets/data/merch.json')); copyFileSync(new URL('assets/provenance.json', repo), join(tmp, 'assets/provenance.json'));
    const foto = join(tmp, 'foto.jpg');
    assert.equal(spawnSync('python3', ['-c', `from PIL import Image; Image.new('RGB', (1800, 1400), (200, 120, 40)).save(${JSON.stringify(foto)})`]).status, 0);
    const run = (...a) => spawnSync('python3', [new URL('scripts/foto-merch.py', repo).pathname, foto, ...a], { encoding: 'utf8', env: { ...process.env, ITI_RAIZ: tmp } });
    assert.notEqual(run('playera').status, 0, 'sin --alt falla'); assert.notEqual(run('playera', '--alt', '  ').status, 0, '--alt vacío falla');
    assert.notEqual(run('playera', '--alt', 'Playera').status, 0, 'artículo nuevo sin --nombre y --tipo falla');
    const r = run('playera-logo', '--alt', 'Playera naranja', '--nombre', 'Playera con logo', '--tipo', 'Playera', '--precio', '250', '--disponibilidad', 'encargo');
    assert.equal(r.status, 0, r.stderr);
    const data = JSON.parse(readFileSync(join(tmp, 'assets/data/merch.json'), 'utf8'));
    assert.deepEqual(data.productos, [{ id: 'playera-logo', nombre: 'Playera con logo', tipo: 'Playera', descripcion: null, precio: 250, foto: { src: 'assets/img/merch/playera-logo.webp', chica: 'assets/img/merch/playera-logo-600.webp', alt: 'Playera naranja' }, disponibilidad: 'encargo' }]);
    const prov = JSON.parse(readFileSync(join(tmp, 'assets/provenance.json'), 'utf8'));
    const regs = prov.real.filter(f => /^img\/merch\/playera-logo/.test(f.file));
    assert.equal(regs.length, 2);
    assert.ok(regs.every(f => /aportada por Aldo/.test(f.author) && f.sourceSha256 && f.sha256 && f.date), 'las dos registradas con autor, fecha y huellas');
    assert.ok(regs.some(f => /recorte cuadrado al centro de 1800x1400/.test(f.origin)), 'con el recorte');
    const reales = new Set(prov.real.map(f => `assets/${f.file}`));
    assert.deepEqual(merchProblems(data, { fotoExiste: src => existsSync(join(tmp, src)), fotoRegistrada: src => reales.has(src) }), [], 'lo que deja el script pasa la revisión');
    assert.equal(validMerch(data).length, 1);
    // volver a cargar la foto la sustituye y no duplica el registro
    assert.equal(run('playera-logo', '--alt', 'Playera vista de espalda').status, 0);
    const data2 = JSON.parse(readFileSync(join(tmp, 'assets/data/merch.json'), 'utf8')), prov2 = JSON.parse(readFileSync(join(tmp, 'assets/provenance.json'), 'utf8'));
    assert.equal(data2.productos.length, 1); assert.equal(data2.productos[0].foto.alt, 'Playera vista de espalda'); assert.equal(data2.productos[0].precio, 250, 'los campos que no se piden se quedan');
    assert.equal(prov2.real.filter(f => /^img\/merch\/playera-logo/.test(f.file)).length, 2);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  assert.ok(!existsSync(new URL('assets/img/merch/', repo).pathname), 'el repositorio no recibió fotos de prueba');
});

test('docs/MERCH.md: plantilla de columnas y comandos', () => {
  const md = read('docs/MERCH.md');
  for (const col of ['Nombre', 'Tipo', 'Precio', 'Foto', 'Texto alternativo', 'Disponibilidad', 'Notas']) assert.ok(md.includes(`**${col}`), `columna ${col}`);
  for (const cmd of ['scripts/foto-merch.py', 'npm run merch:check', 'tools/preview-site.mjs']) assert.ok(md.includes(cmd), cmd);
  assert.ok(/nunca afirma que haya existencias/.test(md));
});
