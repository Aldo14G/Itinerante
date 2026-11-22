// Frente nuevo (/nuevo, SPEC v2): datos reales, HTML generado al día, conteos de Visita, frases vetadas y bloques fechados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { LIBROS, CARTA, NOVEDADES, MERCH, NEGOCIO, NOMBRE_TIENDA, RECURRENTES, FECHADOS, tiposDeTienda, editorialesConFiltro, eventosFechados } from '../src/frente/datos.ts';
import { aplicarFechas, hoyMonterrey } from '../src/frente/fechas.ts';
import { DOCUMENTO } from '../src/app/nuevo/documento.generado.ts';

const vetadas = JSON.parse(readFileSync(new URL('../src/frente/frases-vetadas.json', import.meta.url), 'utf8'));
const HOY = '2026-11-22';
const html = (hoy = HOY) => aplicarFechas(DOCUMENTO, hoy);
const sinOcultos = (h) => h.replace(/<fecha-desde[^>]*hidden=""[^>]*>[\s\S]*?<\/fecha-desde>/g, '');
const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function textoVisible(h) {
  return sinOcultos(h)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/(div|p|span)>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}
const cuenta = (s, re) => (s.match(re) ?? []).length;
const seccion = (h, id) => {
  const i = h.indexOf(`<section id="${id}"`);
  return i < 0 ? '' : h.slice(i, h.indexOf('</section>', i));
};

test('datos reales: 41 libros, 21 productos de la carta, sin novedades ni merch hoy', () => {
  assert.equal(LIBROS.length, 41);
  assert.equal(CARTA.reduce((n, c) => n + c.productos.length, 0), 21);
  assert.equal(NOVEDADES.length, 0);
  assert.equal(MERCH.length, 0);
  assert.equal(NOMBRE_TIENDA, 'Libros', 'sin merch el menú dice «Libros» (S-18)');
});

test('el HTML generado está al día con datos y código', () => {
  execFileSync(process.execPath, ['--import', 'tsx/esm', 'scripts/build-nuevo.mjs', '--check'], { stdio: 'pipe' });
});

test('la página no carga JS de framework: solo el script en línea', () => {
  assert.equal(cuenta(DOCUMENTO, /<script[^>]+src=/g), 0);
  assert.equal(cuenta(DOCUMENTO, /<link[^>]+rel="stylesheet"/g), 0);
});

test('frases vetadas: 0 en el texto visible y «apartar»/switch/localStorage en ningún lado del HTML', () => {
  for (const hoy of [HOY, '2026-11-28']) {
    const visible = sinAcentos(textoVisible(html(hoy)));
    for (const f of vetadas.texto) assert.ok(!visible.includes(sinAcentos(f)), `frase vetada visible: «${f}» (${hoy})`);
    assert.equal(cuenta(visible, /\bver libro\b/g), 0, '«Ver libro» suelto (S-10)');
    const interfaz = sinAcentos(textoVisible(html(hoy).replace(/<p class="libro-sinopsis">[\s\S]*?<\/p>/g, ' ')));
    for (const f of vetadas.fueraDeSinopsis) assert.ok(!interfaz.includes(sinAcentos(f)), `en la interfaz: «${f}» (S-21)`);
    const todo = sinAcentos(html(hoy));
    for (const f of vetadas.html) assert.ok(!todo.includes(sinAcentos(f)), `en el HTML: «${f}»`);
  }
});

test('Visita concentra el contacto: «Matamoros» 1 vez, 1 enlace a Maps, teléfono 1 vez, FB oficial', () => {
  const h = html();
  const visible = textoVisible(h);
  assert.equal(cuenta(visible, /Matamoros/g), 1);
  assert.equal(cuenta(h, /href="https:\/\/www\.google\.com\/maps/g), 1);
  assert.equal(cuenta(visible, /81 8087 5940/g), 1);
  assert.ok(seccion(h, 'visita').includes('Matamoros'));
  assert.ok(seccion(h, 'visita').includes(`href="${NEGOCIO.facebook}"`));
  assert.equal(cuenta(h, /facebook\.com/g), 2, 'Facebook: el enlace de Visita y sameAs del JSON-LD');
  assert.ok(!/<footer[\s\S]*Matamoros[\s\S]*<\/footer>/.test(h));
});

test('horario sin confirmar: no se imprime ni va al JSON-LD; nunca Abierto/Cerrado', () => {
  assert.equal(NEGOCIO.horario.confirmado, false);
  const h = html();
  const visible = textoVisible(h);
  assert.ok(visible.includes('Confírmalo por WhatsApp antes de venir'));
  assert.ok(!/11:00/.test(visible) && !/Cerrado/i.test(visible));
  assert.ok(!h.includes('openingHours'));
});

test('tienda: 41 tarjetas en el HTML, un solo enlace por tarjeta, un solo contador «41 libros»', () => {
  const t = seccion(html(), 'tienda');
  const tarjetas = t.split('<li class="libro"').slice(1);
  assert.equal(tarjetas.length, 41);
  for (const c of tarjetas) assert.equal(cuenta(c.split('</li>')[0], /<a /g), 1);
  assert.equal(cuenta(textoVisible(html()), /\b41 (libros|títulos)\b/g), 1);
  assert.equal(cuenta(t, /class="portada-tipografica" aria-hidden="true"/g), 9, '9 libros sin portada, placeholder oculto al lector');
  assert.equal(cuenta(t, /<img [^>]*alt=""/g), 32, 'las portadas reales no repiten el título');
});

test('filtros: ninguno con menos de 2 elementos; sin fila de tipos con un solo tipo', () => {
  assert.ok(tiposDeTienda().length < 2);
  assert.ok(!html().includes('name="tipo"'));
  for (const e of editorialesConFiltro()) assert.ok(e.n >= 2);
  assert.ok(!html().includes('value="libro-objeto"'));
});

test('«Las ruinas de la caza»: sin campos vacíos, con su género de fuente citada y sin precio inventado', () => {
  const l = LIBROS.find((x) => x.id === 'las-ruinas-de-la-caza-alfredo-leal');
  assert.equal(l.genero, 'Narrativa');
  assert.equal(l.precio, null);
  const c = html().split('id="libro-las-ruinas-de-la-caza-alfredo-leal"')[1].split('</li>')[0];
  assert.ok(!c.includes('libro-precio') && !c.includes('Editorial') && c.includes('Narrativa'));
  assert.ok(!/<dd>\s*<\/dd>/.test(html()));
});

test('las anclas viejas aterrizan en su bloque nuevo', () => {
  const h = html();
  assert.ok(seccion(h, 'eventos').includes('id="cartelera"'));
  assert.ok(seccion(h, 'tienda').includes('id="libros"'));
  assert.ok(seccion(h, 'visita').includes('id="cafe"'));
});

test('el Club de Dibujo sale una sola vez, en Eventos, con su fuente oficial', () => {
  const h = html();
  assert.equal(cuenta(textoVisible(h), /Club de Dibujo y Pintura/g), 1);
  assert.ok(seccion(h, 'eventos').includes('Club de Dibujo y Pintura'));
  for (const e of [...FECHADOS, ...RECURRENTES]) assert.match(e.fuente, /^https:\/\/www\.instagram\.com\/libreriaitineranteymasmty\/p\//);
});

test('fecha: el 27 nov se ve el Aniversario y el CTA «Ver eventos»; desde el 28 se va y el CTA lleva a la tienda', () => {
  const dia27 = html('2026-11-27');
  assert.ok(dia27.includes('6.º Aniversario') && dia27.includes('Hora por anunciar') && dia27.includes('En la librería'));
  assert.match(dia27, /<a class="boton boton-primario" href="#eventos">Ver eventos<\/a>/);
  assert.ok(!dia27.includes('add-to-calendar') && !dia27.includes('.ics'));
  assert.ok(!textoVisible(dia27.replace(/<fecha-desde[^>]*hidden=""[^>]*>[\s\S]*?<\/fecha-desde>/g, '')).includes('Ver libros'), 'el CTA del día 28 va oculto');
  assert.match(dia27, /<fecha-desde d="2026-11-28" hidden="">/, 'y listo para el navegador si este HTML sigue en caché');
  const dia28 = html('2026-11-28');
  assert.ok(!dia28.includes('6.º Aniversario'));
  assert.match(dia28, /<a class="boton boton-primario" href="#tienda">Ver libros<\/a>/);
  assert.ok(!dia28.includes('Ver eventos'));
  const nav28 = textoVisible(dia28.match(/<ul class="menu">([\s\S]*?)<\/ul>/)[1]).trim();
  assert.equal(nav28, 'Actividades Libros Visita', 'solo con recurrentes, Eventos se llama «Actividades»');
  assert.ok(!textoVisible(html('2026-11-27')).includes('Actividades'));
  assert.equal(eventosFechados('2026-11-27').length, 1);
  assert.equal(eventosFechados('2026-11-28').length, 0);
});

test('hoyMonterrey usa la hora de Monterrey (UTC−6), no la del servidor', () => {
  assert.equal(hoyMonterrey(new Date('2026-11-28T05:59:00Z')), '2026-11-27');
  assert.equal(hoyMonterrey(new Date('2026-11-28T06:00:00Z')), '2026-11-28');
});

test('sin personalización: menú de 3 ítems sin «Inicio» y sin switch', () => {
  const nav = html().match(/<ul class="menu">([\s\S]*?)<\/ul>/)[1];
  assert.equal(cuenta(nav, /<a /g), 3);
  assert.ok(!/Inicio/.test(nav));
});

test('tema Astryx al día, contraste AA y Astryx fijado a 0.7.17 sin AGENTS.md de Astryx', () => {
  execFileSync(process.execPath, ['scripts/build-tema-astryx.mjs', '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/check-contraste.mjs'], { stdio: 'pipe' });
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies['@astryxdesign/core'], '0.7.17');
  assert.ok(!/astryx/i.test(readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8')));
});
