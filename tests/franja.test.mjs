// Franja de editoriales del Inicio (2026-11-19, encargo de Aldo): `node --test tests/franja.test.mjs`. Datos reales o sin datos; los logos de prueba son siluetas genéricas
// generadas aquí y viven en una carpeta temporal, nunca en el repositorio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { editorialesDe, EDITORIALES_MIN } from '../catalog.js';
import {
  leerConfig, franjaPlan, franjaHtml, withFranja, logosCss, withLogosCss, editorialesLogosProblems, slugEditorial, copiasPorGrupo, anchoEstimado,
  INICIO, FIN, CSS_INICIO, CSS_FIN, ROTULO, VER, ANCHO_LLENAR
} from '../scripts/franja-datos.mjs';
import { problemasLogosDisco, leerEditorialesJson } from '../scripts/build-editoriales.mjs';

const repo = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, repo), 'utf8');
const json = p => JSON.parse(read(p));
const html = read('index.html');
const css = read('style.css');
const catalogo = json('assets/data/catalog.json');
const raw = json('assets/data/editoriales.json');
const libro = (id, p) => ({ id, p });
const tres = [libro('a', 'Uno Ediciones'), libro('b', 'Dos Casa Editorial'), libro('c', 'Tres Libros')];
const LOGO_OK = { logo: 'assets/img/editoriales/uno-ediciones.svg', alt: 'Logotipo de Uno Ediciones', ancho: 300, alto: 60 };
const sinTexto = s => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const franjaDe = h => h.slice(h.indexOf(INICIO), h.indexOf(FIN) + FIN.length);

test('Franja: index.html es lo que pinta build-editoriales (npm run editoriales) y style.css trae sus marcas de logos', () => {
  const cfg = leerConfig(raw);
  assert.equal(withFranja(html, catalogo.books, cfg), html, 'la franja de index.html es la de catalog.json + editoriales.json');
  assert.equal(withLogosCss(css, catalogo.books, cfg), css, 'las reglas de los logos de style.css son las de editoriales.json');
  assert.ok(html.includes(INICIO) && html.includes(FIN) && css.includes(CSS_INICIO) && css.includes(CSS_FIN));
  const pkg = read('package.json');
  assert.ok(/"editoriales": "node scripts\/build-editoriales\.mjs"/.test(pkg) && /tests\/franja\.test\.mjs/.test(pkg), 'npm run editoriales y esta prueba dentro de npm test');
});

test('Franja: sus editoriales son las del catálogo menos las excluidas; hoy tres (Abismos, Capítulo Siete, Iridiscencias) y «Libro Objeto» no aparece', () => {
  const cfg = leerConfig(raw);
  const plan = franjaPlan(catalogo.books, cfg);
  const todas = editorialesDe(catalogo.books);
  assert.deepEqual(raw.excluir, ['Libro Objeto'], 'Aldo no ha confirmado que «Libro Objeto» sea una editorial');
  assert.deepEqual(plan.lista.map(e => e.nombre), todas.filter(e => e.nombre !== 'Libro Objeto').map(e => e.nombre));
  assert.deepEqual(plan.lista.map(e => e.nombre).sort(), ['Abismos Casa Editorial', 'Capítulo Siete', 'Iridiscencias']);
  assert.equal(plan.mostrar, true);
  const f = franjaDe(html);
  const reales = [...f.matchAll(/<li class="franja-item"><span class="franja-nombre">([^<]+)<\/span><\/li>/g)].map(m => m[1]);
  assert.deepEqual(reales, plan.lista.map(e => e.nombre), 'los elementos reales de la franja (los que lee un lector de pantalla) son esas editoriales, en su orden');
  assert.ok(!/Libro Objeto/.test(f), 'sin «Libro Objeto» en la franja');
  assert.ok(/data-editorial="Libro Objeto"/.test(html), 'el bloque Editoriales del Catálogo no cambia');
});

test('Franja: lista con rótulo, sin enlaces dentro del carril, copias aria-hidden e inert, enlace estático al bloque Editoriales y sin palabras de vínculo', () => {
  const f = franjaDe(html);
  assert.match(f, /<section class="franja" aria-labelledby="franja-rotulo" data-franja>/);
  assert.match(f, new RegExp(`<p class="franja-rotulo" id="franja-rotulo">${ROTULO}</p>`));
  assert.match(f, /<ul class="franja-lista" aria-labelledby="franja-rotulo">/);
  const carril = f.slice(f.indexOf('class="franja-carril"'), f.indexOf('<a class="btn btn--plano btn--sm franja-ver"'));
  assert.ok(!/<a\b|<button\b|tabindex/.test(carril), 'un objetivo en movimiento es inaccesible: nada enfocable dentro del carril');
  assert.ok(/<ul class="franja-lista franja-lista--eco" aria-hidden="true" inert>/.test(f), 'el grupo duplicado va aria-hidden e inert');
  const eco = [...f.matchAll(/<li class="franja-item franja-eco"([^>]*)>/g)];
  assert.ok(eco.length >= 3 && eco.every(m => /aria-hidden="true" inert/.test(m[1])), 'cada copia de ayuda, aria-hidden e inert');
  assert.match(f, new RegExp(`<a class="btn btn--plano btn--sm franja-ver" href="#editoriales"><span>${VER}</span>`));
  assert.ok(html.includes('id="editoriales"'), 'el enlace lleva a un bloque que existe');
  assert.match(f, /<button class="btn btn--contorno btn--sm btn--icono franja-ctl" type="button" data-franja-ctl aria-label="Pausar el movimiento de las editoriales" hidden>/, 'botón de pausa de 44, oculto hasta que franja.js lo cablea');
  assert.ok(!/aliad|socia|oficial|distribuid|asociad|partner|patrocin|respald/i.test(sinTexto(f)), 'el sitio no dice «aliadas», «socias», «oficiales» ni «distribuidores»: no se sabe el vínculo');
  assert.ok(!/gratis|disponible|existencia/i.test(sinTexto(f)));
  assert.ok(ROTULO !== sinTexto(html.match(/<p class="entry-lede">([^<]*)</)[1]) && !/Libros de editoriales independientes/.test(ROTULO), 'no repite el texto del hero');
  // las copias del bucle: un grupo llena la ventana más ancha (1152) según la estimación del generador
  const plan = franjaPlan(catalogo.books, leerConfig(raw));
  assert.ok(copiasPorGrupo(plan.lista) * anchoEstimado(plan.lista) >= ANCHO_LLENAR, 'cada grupo cubre la ventana');
  const grupoA = f.slice(f.indexOf('<ul class="franja-lista" '), f.indexOf('<ul class="franja-lista franja-lista--eco"'));
  const grupoB = f.slice(f.indexOf('<ul class="franja-lista franja-lista--eco"'), f.indexOf('</ul>', f.indexOf('franja-lista--eco')));
  assert.equal((grupoA.match(/<li /g) || []).length, (grupoB.match(/<li /g) || []).length, 'los dos grupos tienen los mismos elementos (el bucle cierra sin salto)');
});

test('Franja: dentro del Inicio, bajo la foto y antes de La casa; el hero no cambia', () => {
  const inicio = html.slice(html.indexOf('<section id="inicio"'), html.indexOf('<section id="casa"'));
  const iFoto = inicio.indexOf('<figure class="entry-media">'), iFranja = inicio.indexOf(INICIO), iFin = inicio.indexOf('</section>');
  assert.ok(iFoto > 0 && iFranja > iFoto && iFranja < iFin, 'la franja va después de la foto y dentro de #inicio (el destino actual del scroll-spy no cambia)');
  for (const marca of ['entry-title', 'entry-lede', 'entry-actions', 'entry-status', 'entry-address']) assert.ok(inicio.indexOf(marca) < iFoto, `${marca} sigue antes de la foto`);
  assert.ok(html.indexOf('data-intro') < html.indexOf(INICIO) && read('assets/js/boot.js').includes('intro-marca'), 'la entrada de marca no se toca');
});

test('Franja: con menos de 3 editoriales no se pinta nada (ni hueco ni encabezado); con el excluido, 3 menos 1 tampoco', () => {
  const vacio = `      ${INICIO}\n      ${FIN}`;
  assert.equal(EDITORIALES_MIN, 3);
  assert.equal(franjaHtml([libro('a', 'Una')], leerConfig(null), '      '), vacio);
  assert.equal(franjaHtml([libro('a', 'Una'), libro('b', 'Dos')], leerConfig(null), '      '), vacio);
  assert.equal(franjaHtml([], leerConfig(null), '      '), vacio);
  assert.equal(franjaHtml([libro('a', 'Una'), libro('b', 'Dos'), libro('c', 'Libro Objeto')], leerConfig({ excluir: ['libro objeto'] }), '      '), vacio, 'tres con una excluida (cualquier grafía): dos, nada');
  assert.equal(franjaHtml([libro('a', 'Una'), libro('b', null), libro('c', '   '), libro('d', 'Dos')], leerConfig(null), '      '), vacio, 'un libro sin editorial no cuenta');
  assert.ok(franjaHtml(tres, leerConfig(null), '      ').includes('class="franja"'), 'tres: sí');
  assert.equal(logosCss([libro('a', 'Una')], leerConfig({ logos: {} })), '', 'sin franja, sin reglas de logos');
});

test('Franja: editoriales.json vacío, ausente o torcido no rompe (Postel): se toma como sin exclusiones y sin logos', () => {
  for (const crudo of [undefined, null, {}, [], 'x', 3, { excluir: 'Libro Objeto' }, { logos: [] }, { logos: 'x', excluir: [1, null, ''] }, { logos: { 'Uno Ediciones': { logo: 'http://x/y.svg' } } }]) {
    const cfg = leerConfig(crudo);
    assert.equal(cfg.excluir.size, 0); assert.equal(cfg.logos.size, 0);
    const plan = franjaPlan(tres, cfg);
    assert.equal(plan.lista.length, 3); assert.ok(plan.lista.every(e => e.logo === null)); assert.equal(plan.mostrar, true);
    assert.ok(franjaHtml(tres, cfg, '  ').includes('franja-nombre'));
  }
  assert.deepEqual(editorialesLogosProblems(undefined), [], 'sin archivo no hay nada que revisar');
  assert.deepEqual(editorialesLogosProblems({}), []);
  assert.deepEqual(editorialesLogosProblems({ excluir: [], logos: {} }), []);
  assert.ok(editorialesLogosProblems([]).length === 1 && editorialesLogosProblems('x').length === 1, 'un archivo que no es objeto se reporta');
  assert.deepEqual(problemasLogosDisco(leerEditorialesJson()), [], 'el editoriales.json real pasa la revisión con el disco');
  assert.deepEqual(raw.logos, {}, 'hoy no hay ningún logo autorizado');
  assert.deepEqual(json('assets/provenance.json').logos, [], 'ni registrado');
});

test('Franja: un logo sin archivo, sin registrar o sin permiso explícito falla; con las tres cosas pasa', () => {
  const cfgRaw = { excluir: [], logos: { 'uno ediciones': LOGO_OK } };
  const reg = { file: 'img/editoriales/uno-ediciones.svg', permiso: 'correo de la editora, 2026-12-03' };
  const con = (existe, registro) => editorialesLogosProblems(cfgRaw, { existe: () => existe, registro: () => registro });
  assert.deepEqual(con(true, reg), []);
  assert.match(con(false, reg).join(), /no existe/, 'sin archivo');
  assert.match(con(true, null).join(), /no está registrado en assets\/provenance\.json/, 'sin registrar');
  assert.match(con(true, { ...reg, permiso: '' }).join(), /sin permiso explícito/, 'registrado sin permiso');
  assert.match(con(true, { file: reg.file }).join(), /sin permiso explícito/, 'registrado sin campo permiso');
  assert.match(con(true, { ...reg, permiso: '   ' }).join(), /sin permiso explícito/);
  const mal = k => editorialesLogosProblems({ logos: { [k]: LOGO_OK } });
  assert.match(mal('Uno Ediciones').join(), /normalizada/, 'la clave va normalizada');
  assert.match(editorialesLogosProblems({ logos: { 'uno ediciones': { ...LOGO_OK, logo: 'assets/img/editoriales/otra.svg' } } }).join(), /debe ser assets\/img\/editoriales\/uno-ediciones/, 'el archivo se llama como la editorial');
  assert.match(editorialesLogosProblems({ logos: { 'uno ediciones': { ...LOGO_OK, logo: 'https://x.test/uno.svg' } } }).join(), /debe ser/, 'solo rutas locales (CSP img-src self; nada de internet)');
  assert.match(editorialesLogosProblems({ logos: { 'uno ediciones': { ...LOGO_OK, alt: '' } } }).join(), /alt/);
  assert.match(editorialesLogosProblems({ logos: { 'uno ediciones': { ...LOGO_OK, ancho: 0 } } }).join(), /ancho y alto/);
  // el disco real: un renglón de logos sin permiso en provenance.json hace fallar la revisión de assets/data/editoriales.json
  assert.ok(/permiso/.test(read('scripts/build-editoriales.mjs')) || /permiso/.test(read('scripts/franja-datos.mjs')));
});

test('Franja: modo logo (de prueba): silueta con máscara, role=img con alt, las copias sin rol, y la regla CSS de la máscara; conviven logo y nombre', () => {
  const cfg = leerConfig({ logos: { 'uno ediciones': LOGO_OK } });
  assert.equal(cfg.logos.size, 1);
  const f = franjaHtml(tres, cfg, '  ');
  assert.match(f, /<li class="franja-item"><span class="franja-logo" data-logo="uno-ediciones" role="img" aria-label="Logotipo de Uno Ediciones"><\/span><\/li>/);
  assert.match(f, /<li class="franja-item"><span class="franja-nombre">Dos Casa Editorial<\/span><\/li>/, 'la que no tiene logo conserva su nombre');
  assert.ok(/<li class="franja-item franja-eco" aria-hidden="true" inert><span class="franja-logo" data-logo="uno-ediciones"><\/span><\/li>/.test(f), 'la copia del logo no lleva rol ni etiqueta');
  const reglas = logosCss(tres, cfg);
  assert.equal(reglas, '.franja-logo[data-logo="uno-ediciones"] { aspect-ratio: 300 / 60; -webkit-mask-image: url("assets/img/editoriales/uno-ediciones.svg"); mask-image: url("assets/img/editoriales/uno-ediciones.svg"); }');
  assert.ok(withLogosCss(css, tres, cfg).includes(reglas));
  assert.ok(copiasPorGrupo(franjaPlan(tres, cfg).lista) >= 1);
  assert.equal(slugEditorial('Capítulo  Siete'), 'capitulo-siete'); assert.equal(slugEditorial('Abismos Casa Editorial'), 'abismos-casa-editorial');
});

test('Franja: scripts/logo-editorial.py falla sin permiso, con editorial ajena, con fondo opaco o con un SVG peligroso; con todo en orden guarda, registra y pasa la revisión', t => {
  const py = spawnSync('python3', ['-c', 'import PIL'], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('sin Python con Pillow'); return; }
  const tmp = mkdtempSync(join(tmpdir(), 'iti-logo-'));
  try {
    mkdirSync(join(tmp, 'assets/data'), { recursive: true });
    for (const f of ['assets/data/catalog.json', 'assets/data/editoriales.json', 'assets/provenance.json']) copyFileSync(new URL(f, repo), join(tmp, f));
    const png = join(tmp, 'sil.png'), opaco = join(tmp, 'opaco.png'), svg = join(tmp, 'sil.svg'), malo = join(tmp, 'malo.svg');
    // silueta de prueba generada aquí (un óvalo con un hueco; NO es la marca de nadie), con márgenes transparentes que el script debe recortar
    assert.equal(spawnSync('python3', ['-c', `from PIL import Image, ImageDraw
im = Image.new('RGBA', (900, 400), (0, 0, 0, 0)); d = ImageDraw.Draw(im); d.ellipse((100, 80, 800, 320), fill=(200, 30, 30, 255)); d.ellipse((380, 160, 520, 240), fill=(0, 0, 0, 0)); im.save(${JSON.stringify(png)})
Image.new('RGB', (900, 400), (255, 255, 255)).save(${JSON.stringify(opaco)})`]).status, 0);
    writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><rect width="200" height="50" rx="10"/></svg>');
    writeFileSync(malo, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><script>alert(1)</script><rect width="200" height="50"/></svg>');
    const run = (archivo, ...a) => spawnSync('python3', [new URL('scripts/logo-editorial.py', repo).pathname, archivo, ...a], { encoding: 'utf8', env: { ...process.env, ITI_RAIZ: tmp } });
    const intacto = () => { const d = JSON.parse(readFileSync(join(tmp, 'assets/data/editoriales.json'), 'utf8')); return Object.keys(d.logos).length === 0 && !existsSync(join(tmp, 'assets/img/editoriales/capitulo-siete.webp')); };
    assert.notEqual(run(png, 'Capítulo Siete').status, 0, 'sin --permiso falla (argumento obligatorio)');
    assert.notEqual(run(png, 'Capítulo Siete', '--permiso', '  ').status, 0, '--permiso vacío falla');
    assert.match(run(png, 'Capítulo Siete', '--permiso', '').stderr, /permiso/);
    assert.notEqual(run(png, 'Una Editorial Inventada', '--permiso', 'correo de la editora, 2026-12-03').status, 0, 'una editorial que no está en el catálogo falla');
    assert.match(run(opaco, 'Capítulo Siete', '--permiso', 'correo de la editora, 2026-12-03').stderr, /transparencia/, 'fondo opaco falla');
    assert.match(run(malo, 'Capítulo Siete', '--permiso', 'correo de la editora, 2026-12-03').stderr, /script/, 'SVG con script falla');
    assert.ok(intacto(), 'ninguno de los fallos escribió nada');
    const r = run(png, 'capitulo  SIETE', '--permiso', 'correo de la editora, 2026-12-03', '--alt', 'Logotipo de Capítulo Siete');
    assert.equal(r.status, 0, r.stderr);
    const data = JSON.parse(readFileSync(join(tmp, 'assets/data/editoriales.json'), 'utf8'));
    assert.deepEqual(Object.keys(data.logos), ['capitulo siete']);
    const l = data.logos['capitulo siete'];
    assert.equal(l.logo, 'assets/img/editoriales/capitulo-siete.webp'); assert.equal(l.alt, 'Logotipo de Capítulo Siete');
    assert.ok(l.ancho / l.alto > 2.7 && l.ancho / l.alto < 3.1, `recortado a lo visible (700×240 ≈ 2.9; salió ${l.ancho}×${l.alto})`);
    assert.deepEqual(data.excluir, ['Libro Objeto'], 'lo que ya había se conserva');
    const prov = JSON.parse(readFileSync(join(tmp, 'assets/provenance.json'), 'utf8'));
    assert.equal(prov.logos.length, 1);
    assert.ok(prov.logos[0].permiso === 'correo de la editora, 2026-12-03' && prov.logos[0].sha256 && prov.logos[0].sourceSha256 && prov.logos[0].date && prov.logos[0].editorial === 'Capítulo Siete');
    const registro = new Map(prov.logos.map(x => [`assets/${x.file}`, x]));
    assert.deepEqual(editorialesLogosProblems(data, { existe: ruta => existsSync(join(tmp, ruta)), registro: ruta => registro.get(ruta) ?? null }), [], 'lo que deja el script pasa la revisión');
    // el WebP es una silueta: ningún color
    assert.equal(spawnSync('python3', ['-c', `from PIL import Image; im = Image.open(${JSON.stringify(join(tmp, 'assets/img/editoriales/capitulo-siete.webp'))}).convert('RGBA'); import sys; sys.exit(0 if all(p[:3] == (0, 0, 0) for p in im.getdata() if p[3] > 0) else 1)`]).status, 0, 'solo cuenta la transparencia: sin colores filtrados');
    // un SVG limpio se guarda tal cual
    assert.equal(run(svg, 'Iridiscencias', '--permiso', 'mensaje de la editorial, 2026-12-04').status, 0);
    const d2 = JSON.parse(readFileSync(join(tmp, 'assets/data/editoriales.json'), 'utf8'));
    assert.equal(d2.logos.iridiscencias.logo, 'assets/img/editoriales/iridiscencias.svg'); assert.equal(d2.logos.iridiscencias.alt, 'Logotipo de Iridiscencias');
    assert.ok(d2.logos.iridiscencias.ancho / d2.logos.iridiscencias.alto === 4);
    // y una franja pintada con esa configuración usa las dos siluetas
    const f = franjaHtml(catalogo.books, leerConfig(d2), '  ');
    assert.ok(/data-logo="capitulo-siete"/.test(f) && /data-logo="iridiscencias"/.test(f) && /franja-nombre">Abismos Casa Editorial/.test(f));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  assert.ok(!existsSync(new URL('assets/img/editoriales/', repo).pathname), 'el repositorio no recibió logos de prueba');
});

test('Franja: movimiento solo con html.motion y sin pausa, solo con transform, a la velocidad del token; sin milisegundos a mano ni estilos en línea', () => {
  const bloque = css.slice(css.indexOf('/* ---------- Franja de editoriales'), css.indexOf(CSS_FIN));
  const animaciones = [...bloque.matchAll(/^(.*?)\{[^}]*\banimation\s*:(?!\s*none)/gm)].map(m => m[1].trim());
  assert.ok(animaciones.length === 1 && /^\.motion \.franja\[data-listo\] \.franja-carril/.test(animaciones[0]), `la única animación va bajo .motion y data-listo (${animaciones})`);
  assert.match(bloque, /html\.franja-quieta \.franja\[data-listo\] \.franja-carril \{ animation: none;/, 'la pausa de la franja la apaga');
  assert.match(bloque, /@keyframes franja-corre \{ to \{ transform: translate3d\(-50%, 0, 0\); \} \}/, 'solo transform, -50 % del carril (dos grupos idénticos)');
  assert.ok(!/@keyframes franja-corre[^}]*(left|margin|width|opacity)/.test(bloque));
  assert.ok(/animation: franja-corre var\(--franja-dur, 40s\) linear infinite/.test(bloque), 'lineal, sin saltos al cerrar');
  assert.ok(/:hover \.franja-carril \{ animation-play-state: paused/.test(bloque) && /:active \.franja-carril/.test(bloque) && /\.franja:focus-within \.franja-carril/.test(bloque) && /:not\(\[data-en-vista\]\)/.test(bloque), 'pausa con el cursor, al presionar, al enfocar dentro y fuera de la vista');
  assert.ok(/@media \(hover: hover\) \{ html\.motion:not\(\.franja-quieta\) \.franja-escena:hover/.test(bloque), 'el hover solo con puntero que lo tiene');
  assert.ok(/mask-image: linear-gradient\(90deg, transparent, var\(--tinta\) var\(--franja-desvanece\), var\(--tinta\) calc\(100% - var\(--franja-desvanece\)\), transparent\)/.test(bloque) && /-webkit-mask-image/.test(bloque), 'bordes desvanecidos con máscara (solo cuenta su opacidad: sin color visible)');
  assert.ok(!/#[0-9a-f]{3,8}\b(?!\))/i.test(bloque) && !/\b\d+ms\b/.test(bloque), 'colores y duraciones de los tokens');
  assert.ok(/color: var\(--tinta-2\)/.test(bloque) && /\.franja-escena:hover \.franja-item \{ color: var\(--tinta\);/.test(bloque) && /\.franja:focus-within \.franja-item \{ color: var\(--tinta\)/.test(bloque), 'tinta-2 y tinta al pasar el cursor o con el foco dentro');
  const tok = json('design/tokens.json').scales.franja;
  assert.equal(tok['franja-velocidad'], '40'); assert.ok(read('tokens.css').includes('--franja-velocidad: 40;'));
  const js = read('franja.js').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/\bsetTimeout\b|\bsetInterval\b|\b\d{3,}\s*(ms)?\b(?!\))/.test(js.replace(/COPIAS_EXTRA_MAX = 12/, '')), 'franja.js sin temporizadores ni milisegundos escritos');
  assert.ok(!/\.style\.transform|\.animate\(|requestAnimationFrame/.test(js), 'el movimiento es CSS: franja.js no mueve nada por JavaScript');
  assert.match(js, /num\('franja-velocidad'/);
  assert.ok(!/\sstyle="/.test(franjaDe(html)), 'sin estilos en línea (CSP)');
  const app = read('app.js'); assert.match(app, /import\('\.\/franja\.js'\)\.then\(m => m\.initFranja\(\)\)/);
  assert.ok(read('scripts/prepare-public.mjs').includes('"franja.js"') && read('tools/preview-site.mjs').includes("'/franja.js'"), 'franja.js se publica y la vista previa lo sirve');
  assert.ok(!/franja-datos/.test(read('scripts/prepare-public.mjs')), 'la lógica del generador no se publica');
  const boot = read('assets/js/boot.js'); assert.match(boot, /iti-franja/); assert.match(boot, /franja-quieta/);
});

test('Franja: sin movimiento se ve quieta, una sola vez y se acomoda en renglones; el botón de pausa solo existe con movimiento; el logo sirve en modo de contraste forzado', () => {
  const bloque = css.slice(css.indexOf('/* ---------- Franja de editoriales'), css.indexOf(CSS_FIN));
  assert.match(bloque, /\.franja-lista \{ display: flex; flex-wrap: wrap; justify-content: center;/, 'base quieta: renglones centrados');
  assert.match(bloque, /\.franja-lista\.franja-lista--eco, \.franja-item\.franja-eco \{ display: none; \}/, 'base quieta: sin copias');
  assert.match(bloque, /\.franja-ctl \{ display: none; flex: none; \}/); assert.match(bloque, /html\.motion \.franja-ctl:not\(\[hidden\]\) \{ display: inline-flex; \}/);
  assert.ok(!/\.franja-carril \{[^}]*width: max-content/.test(bloque.replace(/html\.motion:not\(\.franja-quieta\) \.franja-carril \{[^}]*\}/, '')), 'el carril ancho solo con movimiento');
  assert.match(bloque, /forced-colors: active/);
  assert.ok(read('franja.js').includes("root.classList.contains('motion') && !root.classList.contains('franja-quieta')"));
});

test('docs/EDITORIALES-LOGOS.md y PENDIENTES: pasos del logo con permiso, qué pedir a cada editorial, y los pendientes de Aldo sobre el vínculo y la lista completa', () => {
  const md = read('docs/EDITORIALES-LOGOS.md');
  for (const t of ['scripts/logo-editorial.py', '--permiso', 'npm run editoriales', 'assets/data/editoriales.json', 'provenance.json', 'silueta monocroma', 'no se descargan ni se copian de internet', 'aliadas', 'Libro Objeto', 'SVG']) assert.ok(md.includes(t), t);
  const pend = read('docs/PENDIENTES-NEGOCIO.md');
  for (const t of ['B7', 'vínculo', 'logo', 'permiso', 'Libro Objeto']) assert.ok(pend.includes(t), `PENDIENTES: ${t}`);
});
