// Contenido nuevo del 2026-11-19: preguntas frecuentes de Visita, Editoriales del Catálogo, Merch (oculto hasta tener productos) y marca/SEO
// listos para el dominio (sin dominio). Todo con datos reales o sin datos: `node --test tests/contenido.test.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
