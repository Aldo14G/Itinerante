// Frente nuevo (/nuevo, SPEC v2): datos reales, HTML generado al día, conteos de Visita, frases vetadas y bloques fechados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gzipSync } from 'node:zlib';
import { LIBROS, CARTA, NOVEDADES, MERCH, NEGOCIO, NOMBRE_TIENDA, RECURRENTES, FECHADOS, EVENTOS, DESTACADOS, editorialesCatalogo, generosColeccion, eventosFechados, enlaceLuma, planTienda } from '../src/frente/datos.ts';
import { poseVitrina, transformVitrina, destinoGesto, teclaVitrina, anchoPieza, pasoVitrina } from '../src/frente/vitrina.js';
import { BloqueTienda, Eventos, Pagina } from '../src/frente/pagina.tsx';
import { procesarFilas } from '../scripts/sync-hoja.mjs';
import { talleresDeHoja } from '../src/frente/datos.ts';
import { recomendarLibros } from '../src/frente/recomendaciones.js';
import { librosConsulta, parseConsulta } from '../src/frente/consulta.ts';
import { aplicarFechas, hoyMonterrey, cabeceraIsr, cacheVencido, REVALIDATE_SEGUNDOS, EXPIRE_SEGUNDOS } from '../src/frente/fechas.ts';
import { proponer, redactar, syncActivo } from '../src/frente/instagram-sync.ts';
import { DOCUMENTO } from '../src/app/nuevo/documento.generado.ts';
import { GET } from '../src/app/nuevo/route.ts';

const vetadas = JSON.parse(readFileSync(new URL('../src/frente/frases-vetadas.json', import.meta.url), 'utf8'));
const HOY = '2026-11-22';
const html = (hoy = HOY) => aplicarFechas(DOCUMENTO, hoy);
const sinScript = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '');
const sinOcultos = (h) => h.replace(/<fecha-desde[^>]*hidden=""[^>]*>[\s\S]*?<\/fecha-desde>/g, '');
const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function textoVisible(h) {
  return sinOcultos(h)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<(svg|i)[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/\1>/g, ' ')
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

test('recomendaciones: el perfil, la exploración y el feedback cambian la selección del inventario real', () => {
  const catalogo = LIBROS.map(l => ({ id: l.id, a: l.autor, p: l.editorial, g: l.colecciones, i: l.ordenPortada }));
  const poesia = new Set(['poesia']);
  const votos = new Map();
  const porGenero = recomendarLibros(catalogo, poesia, false, votos);
  assert.equal(porGenero.length, 3);
  assert.ok(porGenero.every(({ libro, razon }) => libro.g.includes('poesia') && razon === 'genero'));
  const narrativa = recomendarLibros(catalogo, new Set(['narrativa']), false, votos);
  assert.ok(narrativa.every(({ libro }) => libro.g.includes('narrativa')));
  assert.notDeepEqual(narrativa.map(({ libro }) => libro.id), porGenero.map(({ libro }) => libro.id));
  const historialNarrativa = new Map(narrativa.map(({ libro }) => [libro.id, 'si']));
  const cambio = recomendarLibros(catalogo, poesia, false, historialNarrativa);
  assert.equal(cambio.length, 3);
  assert.ok(cambio.every(({ libro }) => libro.g.includes('poesia')));
  const explorarConHistorial = recomendarLibros(catalogo, poesia, true, historialNarrativa);
  assert.ok(explorarConHistorial.slice(0, 2).every(({ libro }) => libro.g.includes('poesia')));
  assert.equal(explorarConHistorial[2].razon, 'explorar');
  const poesiaAgotada = new Map(catalogo.filter(l => l.g.includes('poesia')).map(l => [l.id, 'no']));
  assert.deepEqual(recomendarLibros(catalogo, poesia, false, poesiaAgotada), []);
  const fueraDePoesia = recomendarLibros(catalogo, poesia, true, poesiaAgotada);
  assert.equal(fueraDePoesia.length, 1);
  assert.equal(fueraDePoesia[0].razon, 'explorar');
  const variada = recomendarLibros(catalogo, poesia, true, votos);
  assert.ok(variada.slice(0, 2).every(({ libro }) => libro.g.includes('poesia')));
  assert.equal(variada[2].razon, 'explorar');
  votos.set(porGenero[0].libro.id, 'no');
  votos.set(porGenero[1].libro.id, 'si');
  const afinada = recomendarLibros(catalogo, poesia, false, votos);
  assert.equal(afinada[0].libro.id, porGenero[1].libro.id);
  assert.equal(afinada[0].razon, 'gusto');
  assert.ok(afinada.every(({ libro }) => libro.id !== porGenero[0].libro.id));
  assert.deepEqual(recomendarLibros(catalogo, poesia, false, new Map(catalogo.map(libro => [libro.id, 'no']))), []);
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
    // El título verificado en el programa oficial no es la propuesta genérica de noviembre.
    const visible = sinAcentos(textoVisible(html(hoy).replace(
      '<h3 id="titulo-circulo-lectura-mitopoietica">Círculo de Lectura Mitopoiética</h3>', '',
    )));
    for (const f of vetadas.texto) assert.ok(!visible.includes(sinAcentos(f)), `frase vetada visible: «${f}» (${hoy})`);
    assert.equal(cuenta(visible, /\bver libro\b/g), 0, '«Ver libro» suelto (S-10)');
    const interfaz = sinAcentos(textoVisible(html(hoy).replace(/<p class="libro-sinopsis">[\s\S]*?<\/p>/g, ' ')));
    for (const f of vetadas.fueraDeSinopsis) assert.ok(!interfaz.includes(sinAcentos(f)), `en la interfaz: «${f}» (S-21)`);
    const todo = sinAcentos(html(hoy));
    for (const f of vetadas.html) assert.ok(!todo.includes(sinAcentos(f)), `en el HTML: «${f}»`);
  }
});

test('El pie concentra el contacto: «Matamoros» 1 vez, 1 enlace a Maps, teléfono 1 vez, FB oficial', () => {
  const h = html();
  const visible = textoVisible(h);
  assert.equal(cuenta(visible, /Matamoros/g), 1);
  assert.equal(cuenta(h, /href="https:\/\/www\.google\.com\/maps/g), 1);
  assert.equal(cuenta(visible, /81 8087 5940/g), 1);
  assert.ok(seccion(h, 'visita').includes('Matamoros'));
  const pie = h.slice(h.indexOf('<footer'), h.indexOf('</footer>'));
  assert.ok(pie.includes(`href="${NEGOCIO.facebook}"`));
  assert.ok(!seccion(h, 'visita').includes('class="contacto"'));
  assert.equal(cuenta(h, /facebook\.com/g), 2, 'Facebook: el enlace del pie y sameAs del JSON-LD');
  assert.ok(!/<footer[\s\S]*Matamoros[\s\S]*<\/footer>/.test(h));
});

test('la portada omite la frase visible y el pie acredita la autoría y la licencia elegida', () => {
  const h = html();
  assert.doesNotMatch(seccion(h, 'inicio'), /id="linea"|Libros de editoriales independientes y café en el Centro de Monterrey\./);
  const pie = h.slice(h.indexOf('<footer'));
  assert.match(pie, /Página creada por Aldo G\. Martinez Pineda/);
  assert.doesNotMatch(pie, /Fotos del espacio|Portadas y carteles/);
  assert.match(pie, /Diseño y textos originales · <a href="https:\/\/creativecommons\.org\/licenses\/by-nc-nd\/4\.0\/deed\.es" rel="license">CC BY-NC-ND 4\.0<\/a>/);
});

test('horario confirmado: un solo campo, una vez en Visita y en el JSON-LD; nunca Abierto/Cerrado en vivo', () => {
  assert.equal(NEGOCIO.horario.confirmado, true);
  const h = html();
  const visible = textoVisible(h);
  assert.equal(cuenta(visible, /11:00–20:00/g), 1);
  assert.ok(seccion(h, 'visita').includes('11:00–20:00'));
  assert.ok(!visible.includes('Confírmalo por WhatsApp'));
  const interfaz = textoVisible(h.replace(/<p class="libro-sinopsis">[\s\S]*?<\/p>/g, ' '));
  assert.ok(!/abierto|abre (hoy|mañana)|cerrado ahora|cierra (hoy|en)/i.test(interfaz));
  const ld = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(ld.openingHours, NEGOCIO.horario.openingHours);
});

test('catálogo: 41 libros en el HTML, un enlace por tarjeta, placeholders sin título', () => {
  const t = seccion(html(), 'libros');
  const tarjetas = t.split('<article class="libro"').slice(1);
  assert.equal(tarjetas.length, 41);
  for (const c of tarjetas) assert.equal(cuenta(c.split('</article>')[0], /<a /g), 1);
  assert.ok(cuenta(textoVisible(html()), /\b41 libros\b/g) >= 1);
  assert.equal(cuenta(t, /class="sin-portada" aria-hidden="true"/g), 9, '9 libros sin portada, placeholder oculto al lector');
  assert.equal(cuenta(t, /<img [^>]*alt=""/g), 32, 'las portadas reales no repiten el título');
  const primero = t.split('<article class="libro"')[1];
  assert.ok(primero.includes('<img '), 'la primera tarjeta trae portada real');
  const sin = t.split('class="sin-portada"')[1].split('</div>')[0];
  assert.ok(!LIBROS.filter((l) => !l.portada).some((l) => sin.includes(l.titulo)), 'el placeholder no repite el título');
});

test('filtros: colecciones reales y todas las editoriales, incluida la de un libro', () => {
  const g = generosColeccion();
  assert.deepEqual(g.map((x) => [x.id, x.n]), [['narrativa', 26], ['poesia', 8], ['ensayo', 9]]);
  const eds = editorialesCatalogo();
  assert.equal(eds.length, 4);
  assert.equal(eds.find((e) => e.nombre === 'Libro Objeto').n, 1);
  assert.equal(LIBROS.filter((l) => !l.editorial).length, 1);
  const dom = sinScript(html());
  assert.ok(!dom.includes('id="tienda"'), 'sin productos publicados la sección no existe');
  assert.ok(!dom.includes('próximamente'), 'sin la línea «Merch: próximamente.»');
  assert.ok(dom.includes('data-v="poesia"') && dom.includes('data-v="Libro Objeto"'));
  assert.ok(!dom.includes('class="c3d"'));
});

test('«Las ruinas de la caza»: sin campos vacíos, con su género de fuente citada y sin precio inventado', () => {
  const l = LIBROS.find((x) => x.id === 'las-ruinas-de-la-caza-alfredo-leal');
  assert.equal(l.genero, 'Narrativa');
  assert.equal(l.precio, null);
  assert.equal(l.editorial, null);
  const c = html().split('id="libros"')[1].split('data-id="las-ruinas-de-la-caza-alfredo-leal"')[1].split('</li>')[0];
  assert.ok(!c.includes('class="precio"') && !c.includes('>Editorial<') && !c.includes('Precio en tienda'));
  assert.ok(!/<dd>\s*<\/dd>/.test(html()));
  assert.equal(cuenta(html(), /Precio en tienda/g), 0);
});

test('las anclas viejas aterrizan en su bloque nuevo', () => {
  const h = html();
  assert.ok(seccion(h, 'eventos').includes('id="cartelera"'));
  assert.ok(seccion(h, 'libros').includes('id="catalogo"'));
  assert.match(h, /<section id="cafe"[\s\S]*<section id="visita"[\s\S]*<\/main><footer class="pie-pagina" id="contacto">/);
});

test('Aniversario y Club de Dibujo comparten el carrusel y conservan sus enlaces', () => {
  const eventos = seccion(html('2026-11-27'), 'eventos');
  assert.equal(cuenta(textoVisible(eventos), /Club de Dibujo y Pintura/g), 1);
  assert.match(eventos, /id="talleres"/);
  assert.match(eventos, /id="agenda-eventos"[\s\S]*id="evento-aniversario-6"[\s\S]*data-taller=""[\s\S]*id="evento-club-dibujo-pintura"/);
  for (const e of [...FECHADOS, ...RECURRENTES]) assert.match(e.instagramUrl, /^https:\/\/www\.instagram\.com\/libreriaitineranteymasmty\/p\//);
  assert.equal(cuenta(eventos, /Registrarme por WhatsApp/g), 1);
  assert.equal(cuenta(eventos, /Ver detalles en Instagram/g), 1);
  assert.match(eventos, /https:\/\/wa\.me\/\d+\?text=[^"]*Mi%20nombre%20es%3A%20/);
});

test('la agenda oficial ordena los horarios fijos y enlaza con sus facilitadores', () => {
  const programa = [
    ['actuacion-gestual-lunes', '20:00–22:00'],
    ['actuacion-gestual-martes', '20:00–22:00'],
    ['taller-cuento-escritura-creativa', '19:00–21:00'],
    ['taller-dibujo-ninos', '11:30–14:00'],
    ['club-cine-manifestarte', '12:30–14:00'],
    ['club-dibujo-pintura', '14:00–16:00'],
    ['circulo-lectura-mitopoietica', '16:30–18:30'],
  ];
  const ids = new Set(programa.map(([id]) => id));
  assert.deepEqual(RECURRENTES.filter((e) => ids.has(e.id)).map((e) => [e.id, e.hora]), programa);
  const agenda = seccion(html('2026-11-28'), 'eventos');
  assert.doesNotMatch(agenda, /id="evento-aniversario-6"/);
  assert.equal(cuenta(agenda, /Consultar en Instagram/g), 6);
  assert.match(agenda, /id="titulo-circulo-lectura-mitopoietica">Círculo de Lectura Mitopoiética</);
  assert.match(agenda, /www\.instagram\.com\/marobaker\//);
  assert.match(agenda, /DgN_kbtI-bm\/"[^>]*>Ver la agenda semanal en Instagram/);
});

test('el Club usa el cartel oficial y la reseña reciente queda fuera de las próximas actividades', () => {
  const club = EVENTOS.find((evento) => evento.id === 'club-dibujo-pintura');
  const prov = JSON.parse(readFileSync(new URL('../assets/provenance.json', import.meta.url), 'utf8'));
  const imagen = prov.real.find((f) => '/assets/' + f.file === club.imagen);
  assert.equal(imagen.source, club.instagramUrl);
  const eventos = seccion(html(), 'eventos');
  assert.ok(eventos.includes(`src="${club.imagen}"`));
  const reseña = eventos.slice(eventos.indexOf('</ol>'));
  assert.match(reseña, /Así fue[\s\S]*Sábado de Poesía[\s\S]*dateTime="2026-11-23"[\s\S]*DgGEB7zlX7k/);
  assert.doesNotMatch(reseña, /Registrarme/);
});

test('cada actividad del programa oficial tiene un cartel local completo con procedencia', () => {
  const anuncios = ['DgN_kbtI-bm/', 'DgBRv40IC_N/'];
  const publicadas = EVENTOS.filter((evento) => anuncios.some((anuncio) => evento.instagramUrl.endsWith(anuncio)));
  const carteles = JSON.parse(readFileSync(new URL('../assets/provenance.json', import.meta.url), 'utf8')).real;
  assert.equal(publicadas.length, 8);
  assert.equal(new Set(publicadas.map((evento) => evento.imagen)).size, 7);
  for (const evento of publicadas) {
    assert.match(evento.imagen, /^\/assets\/img\/eventos\/.+-cartel\.webp$/);
    assert.ok(carteles.some((cartel) => '/assets/' + cartel.file === evento.imagen && cartel.source === evento.instagramUrl));
    assert.ok(statSync(new URL('..' + evento.imagen, import.meta.url)).isFile());
  }
});

test('un taller de Google Sheets llega a /nuevo con su cartel, horario y registro', () => {
  const filas = procesarFilas([
    ['Publicar', 'Título', 'Tipo', 'Fecha', 'Hora', 'Fin', 'Con', 'Descripción', 'Costo', 'Reserva', 'Cartel', 'Lugar', 'Incluye'],
    ['sí', 'Taller de prueba', 'Taller', '2026-11-27', '14:00', '16:00', 'Persona de prueba', 'Descripción del anuncio.', 150, 'https://luma.com/prueba', 'https://drive.google.com/file/d/123456789012345678/view', 'En la librería', 'Material'],
    ['no', 'Taller retirado', 'Taller', '2026-11-27', '14:00', '', '', 'Descripción del anuncio.'],
  ], { hoy: '2026-11-24' }).validos.map(({ evento }) => evento);
  const [taller] = talleresDeHoja(filas, EVENTOS);
  assert.equal(filas.length, 1);
  assert.equal(taller.hora, '14:00–16:00');
  assert.equal(taller.organizador, 'Persona de prueba');
  assert.equal(taller.lugar, 'En la librería');
  assert.equal(taller.incluye, 'Material');
  assert.equal(taller.costo, '$150 MXN');
  assert.equal(taller.registroUrl, 'https://luma.com/prueba');
  assert.equal(taller.imagen, '/assets/img/eventos/taller-de-prueba-2026-11-27.webp');
  const muestra = renderToStaticMarkup(createElement(Eventos, { agenda: [taller] }));
  assert.match(muestra, /Descripción del anuncio/);
  assert.equal(cuenta(muestra.match(/<article[\s\S]*?<\/article>/)[0], /<a /g), 1);
  assert.ok(!aplicarFechas(muestra, '2026-11-28').includes('Taller de prueba'));
  assert.deepEqual(talleresDeHoja([{ ...filas[0], titulo: EVENTOS.find(e => e.id === 'club-dibujo-pintura').titulo }], EVENTOS), []);
  assert.deepEqual(talleresDeHoja([{ ...filas[0], fecha: null }, { ...filas[0], tipo: 'Lectura' }], EVENTOS), []);
  assert.equal(talleresDeHoja([{ ...filas[0], reserva: { tipo: 'whatsapp', telefono: '8112345678' } }], EVENTOS)[0].registroWhatsApp, false);
});

test('plantilla de talleres: cartel local, fecha y una sola acción', () => {
  const club = EVENTOS.find((evento) => evento.id === 'club-dibujo-pintura');
  const cartel = '/assets/img/talleres/prueba.webp';
  const taller = { ...club, id: 'prueba-taller', fecha: '2026-11-27', imagen: cartel, descripcion: 'Una descripción del anuncio.', registroUrl: 'https://luma.com/prueba-taller' };
  const muestra = renderToStaticMarkup(createElement(Eventos, { agenda: [taller] }));
  assert.ok(muestra.includes('src="' + cartel + '"'));
  assert.match(muestra, /agenda-horario[\s\S]*<time/);
  assert.ok(muestra.includes('dateTime="2026-11-27"'));
  assert.ok(muestra.includes('Una descripción del anuncio.'));
  assert.equal(cuenta(muestra.match(/<article[\s\S]*?<\/article>/)[0], /<a /g), 1);
  assert.ok(muestra.includes('https://luma.com/prueba-taller'));
  assert.ok(!aplicarFechas(muestra, '2026-11-28').includes('id="evento-prueba-taller"'));
});

test('La agenda conserva la sección al expirar un evento y admite el enlace oficial de Luma', () => {
  const eventos = seccion(html('2026-11-27'), 'eventos');
  assert.match(eventos, /<ol class="agenda-eventos[^"]*" role="list"[^>]*>/);
  assert.match(eventos, /id="evento-aniversario-6"/);
  assert.match(eventos, /class="agenda-controles" hidden=""[\s\S]*Actividad anterior[\s\S]*Actividad siguiente/);
  assert.doesNotMatch(seccion(html('2026-11-28'), 'eventos'), /id="evento-aniversario-6"/);
  assert.equal(enlaceLuma('https://lu.ma/confirmado'), 'https://lu.ma/confirmado');
  for (const url of ['http://luma.com/demo', 'https://luma.com.ejemplo.org/demo', 'https://forms.gle/demo', 'https://x@y.luma.com/demo', 'https://luma.com/']) {
    assert.equal(enlaceLuma(url), null, url);
  }
});

test('el aniversario caduca y la portada conserva los accesos al catálogo y la agenda', () => {
  const dia27 = html('2026-11-27');
  const dia28 = html('2026-11-28');
  assert.ok(dia27.includes('6.º Aniversario') && dia27.includes('Hora por anunciar') && dia27.includes('En la librería'));
  assert.ok(!dia27.includes('add-to-calendar') && !dia27.includes('.ics'));
  assert.ok(!dia28.includes('6.º Aniversario'));
  for (const h of [dia27, dia28]) {
    const portada = seccion(h, 'inicio');
    assert.match(portada, /class="boton boton--tinta" href="#libros">Explorar catálogo[\s\S]*class="boton boton--borde" href="#eventos">Ver agenda/);
  }
  const nav28 = textoVisible(dia28.match(/<nav aria-label="Secciones">([\s\S]*?)<\/nav>/)[1]).replace(/\s+/g, ' ').trim();
  assert.equal(nav28, 'Agenda Libros Café Visita');
  assert.ok(!textoVisible(html('2026-11-27')).includes('Actividades'));
  assert.equal(eventosFechados('2026-11-27').length, 1);
  assert.equal(eventosFechados('2026-11-28').length, 0);
});

test('hoyMonterrey usa la hora de Monterrey (UTC−6), no la del servidor', () => {
  assert.equal(hoyMonterrey(new Date('2026-11-28T05:59:00Z')), '2026-11-27');
  assert.equal(hoyMonterrey(new Date('2026-11-28T06:00:00Z')), '2026-11-28');
});

test('cabecera: Agenda reúne las actividades en un solo enlace', () => {
  const nav = html().match(/<nav aria-label="Secciones">([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...nav.matchAll(/href="(#[^"]+)"/g)].map((m) => m[1]), ['#eventos', '#libros', '#cafe', '#visita']);
  assert.ok(!/>Inicio</.test(nav));
});

test('eventos: orden por fecha, fecha larga visible, sin datos ajenos', () => {
  const h = html();
  const ev = seccion(h, 'eventos');
  assert.ok(seccion(h, 'destacados').includes('aria-roledescription="carrusel"'));
  assert.ok(h.indexOf('id="eventos"') < h.indexOf('id="talleres"'));
  assert.match(ev, /<time dateTime="2026-11-27">viernes, 27 de noviembre de 2026<\/time>/);
  assert.ok(textoVisible(ev).includes('viernes, 27 de noviembre de 2026'));
  assert.ok(ev.includes('Hora por anunciar'));
  assert.ok(ev.includes('Santiago González') && ev.includes('$150 MXN'));
  assert.equal(cuenta(h, /forms\.gle/g), 1, 'el formulario de renta vive una vez, en Visita');
  assert.ok(h.slice(h.indexOf('<footer')).includes('forms.gle'));
  assert.ok(!ev.includes('forms.gle'));
  assert.ok(!h.includes('Skribh') && !/piel de los recuerdos/i.test(h));
  assert.equal(EVENTOS.filter((e) => e.registroUrl).length, 0);
  assert.ok(EVENTOS.every((e) => e.imagen == null || e.imagen.startsWith('/assets/')));
});

test('carta: una tarjeta por producto, fotografía y precio según los datos', () => {
  const barra = seccion(html(), 'cafe');
  assert.ok(barra.includes('id="carta-categorias"'));
  assert.match(barra, /<a class="carta-categoria" href="#carta-completa">Toda la carta<\/a>/);
  assert.ok(seccion(html(), 'visita').includes('href="#cafe"'));
  assert.equal(cuenta(barra, /class="carta-panel"/g), CARTA.length);
  assert.equal(cuenta(barra, /class="carta-categoria"/g), CARTA.length + 1);
  for (const categoria of CARTA) {
    assert.ok(barra.includes(categoria.nombre));
    assert.ok(barra.includes('href="#carta-' + categoria.id + '"'));
    assert.ok(barra.includes('id="carta-' + categoria.id + '"'));
    for (const producto of categoria.productos) {
      const tarjeta = barra.split(`data-producto="${producto.id}"`)[1].split('</li>')[0];
      assert.ok(tarjeta.includes(producto.nombre), producto.nombre);
      assert.equal(tarjeta.includes('carta-producto-foto'), Boolean(producto.foto), producto.nombre);
      assert.equal(tarjeta.includes('carta-precio'), producto.precio != null, producto.nombre);
    }
  }
  assert.ok(barra.includes('Hierbabuena') && barra.includes('Té verde') && barra.includes('Aguas frescas'));
  assert.ok(!barra.includes('Los tés'));
  const carta = barra.slice(barra.indexOf('id="carta-completa"'), barra.indexOf('class="menu-vitrina"'));
  assert.equal(cuenta(carta, /class="carta-precio"/g), CARTA.flatMap((categoria) => categoria.productos).filter((producto) => producto.precio != null).length);
  assert.ok(!barra.includes('$0 MXN'));
});

test('carta: una fotografía configurada aparece en la tarjeta de su producto con texto alternativo', () => {
  const producto = CARTA[0].productos[0];
  const fotoAnterior = producto.foto;
  try {
    producto.foto = { src: '/assets/img/carta/foto-de-prueba.webp', alt: 'Café de olla en una taza' };
    const carta = seccion(renderToStaticMarkup(createElement(Pagina, { css: '', js: '' })), 'cafe');
    const tarjeta = carta.split(`data-producto="${producto.id}"`)[1].split('</li>')[0];
    assert.match(tarjeta, /class="carta-producto-foto"[^>]*src="\/assets\/img\/carta\/foto-de-prueba\.webp"[^>]*alt="Café de olla en una taza"/);
    assert.equal(cuenta(carta, /foto-de-prueba\.webp/g), 1);
  } finally {
    producto.foto = fotoAnterior;
  }
});

test('con dos productos de un tipo el hueco se vuelve tarjetas y la línea deja de nombrarlo', () => {
  assert.equal(MERCH.length, 0);
  const hoy = planTienda([]);
  assert.equal(hoy.linea, 'Merch y talleres: próximamente.');
  assert.equal(hoy.sello, true);
  assert.ok(hoy.huecos.every((h) => h.tarjetas == null));
  const muestra = [
    { id: 'm1', nombre: 'Producto de muestra 1', tipo: 'merch', precio: 80 },
    { id: 'm2', nombre: 'Producto de muestra 2', tipo: 'merch', precio: null },
  ];
  const plan = planTienda(muestra);
  assert.equal(plan.huecos.find((h) => h.id === 'merch').tarjetas.length, 2);
  assert.equal(plan.huecos.find((h) => h.id === 'talleres').tarjetas, null);
  assert.equal(plan.linea, 'Talleres: próximamente.');
  assert.ok(!plan.linea.includes('Merch'));
  const htmlPlan = renderToStaticMarkup(createElement(BloqueTienda, { plan }));
  assert.match(htmlPlan, /Producto de muestra 1/);
  assert.match(htmlPlan, /\$80 MXN/);
  assert.ok(!htmlPlan.includes('Producto de muestra 2</h3></li>') || !htmlPlan.includes('class="precio">'));
  assert.equal(cuenta(htmlPlan.split('Producto de muestra 2')[1] || '', /class="precio"/g), 0);
  assert.ok(!/Merch y talleres/.test(htmlPlan));
  const vacio = renderToStaticMarkup(createElement(BloqueTienda, { plan: hoy }));
  assert.equal(vacio, '', 'sin productos la sección no se pinta');
});

test('Visita solo muestra la foto con permiso registrado y conserva su texto alternativo', () => {
  assert.equal(NEGOCIO.fotos[0].permisoRegistrado, false);
  assert.equal(NEGOCIO.fotos[1].permisoRegistrado, true);
  const h = html();
  assert.ok(!h.includes('oficial-rincon'), 'sin permiso no entra a la página');
  assert.ok(h.includes('/assets/img/01-entrada-pasillo-800.webp'));
  assert.ok(seccion(h, 'visita').includes(NEGOCIO.fotos[1].alt));
  const prov = JSON.parse(readFileSync(new URL('../assets/provenance.json', import.meta.url), 'utf8'));
  const reg = prov.real.find((f) => f.file === 'img/oficial-rincon-800.webp');
  assert.equal(reg.permiso, false);
});

test('portadas con srcset y la página a 390 px transfiere como mucho 700 KB de imágenes', () => {
  const ancha = LIBROS.find((l) => l.portada && l.portada.ancho > 600);
  assert.match(ancha.portada.srcset, /-360\.webp 360w/);
  assert.match(ancha.portada.srcset, /-600\.webp 600w/);
  const corta = LIBROS.find((l) => l.portada && l.portada.ancho <= 600);
  assert.equal(corta.portada.srcset, null);
  const elegido = (srcset, slot) => {
    const cands = srcset.split(',').map((s) => {
      const partes = s.trim().split(/\s+/);
      return { url: partes[0], w: parseInt(partes[1], 10) };
    }).sort((a, b) => a.w - b.w);
    return (cands.find((c) => c.w >= slot) || cands[cands.length - 1]).url;
  };
  const peso = (url) => statSync(new URL(`..${url.startsWith('/') ? '' : '/'}${url}`, import.meta.url)).size;
  let total = peso('/assets/img/logo-96.webp');
  for (const l of LIBROS) {
    if (!l.portada) continue;
    const slot = Math.ceil(390 * 0.46);
    total += peso(l.portada.srcset ? elegido(l.portada.srcset, slot * 2) : l.portada.src);
  }
  for (const f of NEGOCIO.fotos) total += peso(elegido(f.srcset, Math.ceil(390 * 0.92 * 2)));
  assert.ok(total <= 700 * 1024, `imágenes a 390 px y dpr 2: ${Math.round(total / 1024)} KB`);
});

test('caché: stale-while-revalidate de 3600 y, tras dos horas, el 28 ya no trae el Aniversario', () => {
  assert.equal(REVALIDATE_SEGUNDOS, 3600);
  assert.equal(EXPIRE_SEGUNDOS, 7200);
  assert.equal(cabeceraIsr(), 's-maxage=3600, stale-while-revalidate=3600');
  const cfg = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
  assert.match(cfg, /expireTime:\s*7200/);
  assert.match(readFileSync(new URL('../src/app/nuevo/route.ts', import.meta.url), 'utf8'), /export const revalidate = 3600/);
  const generado = new Date('2026-11-28T04:00:00Z');
  const pedido = new Date('2026-11-28T06:05:00Z');
  assert.equal(hoyMonterrey(generado), '2026-11-27');
  assert.equal(hoyMonterrey(pedido), '2026-11-28');
  assert.equal(cacheVencido(generado, pedido), true);
  assert.ok(!html('2026-11-28').includes('6.º Aniversario'));
});

test('sync de Instagram apagado: solo propone imagen y permalink, nunca una fecha', () => {
  assert.equal(syncActivo({}), false);
  assert.equal(syncActivo({ INSTAGRAM_SYNC: '1', INSTAGRAM_USER_ID: '1' }), false);
  const token = 'IGQVJsecreto-de-prueba-que-no-es-real-1234567890';
  assert.equal(redactar(`falló access_token=${token}&fields=id`), 'falló access_token=REDACTED&fields=id');
  const eventos = [{ id: 'aniversario-6', instagramUrl: 'https://www.instagram.com/libreriaitineranteymasmty/p/DgBRv40IC_N/', imagen: null, fecha: '2026-11-27' }];
  const media = [{
    id: '1',
    caption: 'Nos vemos el 2030-01-01',
    permalink: 'https://www.instagram.com/libreriaitineranteymasmty/p/DgBRv40IC_N/?img_index=1',
    timestamp: '2030-01-01T00:00:00+0000',
    media_type: 'IMAGE',
    thumbnail_url: 'https://cdn.example/thumb.jpg',
    media_url: 'https://cdn.example/full.jpg',
  }];
  const propuestas = proponer(eventos, media);
  assert.equal(propuestas.length, 1);
  assert.equal(propuestas[0].imagen, 'https://cdn.example/thumb.jpg');
  assert.equal(propuestas[0].origenImagen, 'thumbnail_url');
  assert.equal(eventos[0].fecha, '2026-11-27');
  assert.ok(!JSON.stringify(propuestas).includes('2030'));
  assert.ok(!('fecha' in propuestas[0]));
  const soloUrl = proponer(eventos, [{ permalink: eventos[0].instagramUrl, media_url: 'https://cdn.example/full.jpg' }]);
  assert.equal(soloUrl[0].origenImagen, 'media_url');
  const conLocal = proponer([{ ...eventos[0], imagen: '/assets/img/x.webp' }], media);
  assert.equal(conLocal[0].imagen, null);
  assert.ok(!html().includes('platform.instagram.com') && !html().includes('embed.js'));
});

test('vitrina: el centro va de frente y con reduce no hay giro ni profundidad', () => {
  const w = anchoPieza(1440);
  const centro = poseVitrina(0, { w });
  assert.ok(centro.ry === 0 && centro.z === 0);
  const vecina = poseVitrina(1, { w });
  assert.equal(vecina.ry, -42);
  assert.ok(vecina.z < 0);
  assert.match(transformVitrina(vecina), /rotateY\(-42\.00deg\)/);
  const plana = poseVitrina(1, { w, flat: true });
  assert.equal(plana.ry, 0);
  assert.equal(plana.z, 0);
  assert.doesNotMatch(transformVitrina(plana), /rotateY|translateZ|translate3d/);
  assert.equal(teclaVitrina('ArrowRight', 2, 8), 3);
  assert.equal(teclaVitrina('ArrowLeft', 0, 8), 0);
  assert.equal(teclaVitrina('Home', 4, 8), 0);
  assert.equal(teclaVitrina('End', 4, 8), 7);
  const paso = pasoVitrina(w);
  assert.equal(destinoGesto(180, paso, 5), 4, '180 px con el paso de escritorio avanza 1');
  const pasoMovil = pasoVitrina(anchoPieza(390));
  assert.equal(destinoGesto(-180, pasoMovil, 6), 7, '180 px en 390 avanza 1');
  assert.equal(destinoGesto(10, paso, 3), 3, 'menos de 24 px vuelve');
  const js = readFileSync(new URL('../src/frente/cliente.js', import.meta.url), 'utf8');
  assert.match(js, /pointerdown/);
  assert.match(js, /keydown/);
  const vitrina = js.slice(js.indexOf('// Vitrina.'), js.indexOf('// Catálogo.'));
  assert.doesNotMatch(vitrina, /addEventListener\('wheel'/);
});

test('el JS en línea cabe sin framework y con reduce no hay transform', () => {
  const inline = [...DOCUMENTO.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('');
  const gz = gzipSync(Buffer.from(inline)).length;
  assert.ok(gz < 80000, `JS ${gz} B gz`);
  assert.ok(gz > 2000, `el carrusel tiene que estar en el JS (${gz} B gz)`);
  assert.match(inline, /ArrowRight/);
  assert.match(inline, /pointerdown/);
  const css = readFileSync(new URL('../src/frente/nuevo.css', import.meta.url), 'utf8');
  assert.match(css, /cubic-bezier\(\.16,1,\.3,1\)/);
  assert.doesNotMatch(css, /fonts\.googleapis|jsdelivr|animation:\s*[^;]*infinite/);
  assert.ok(!/Inter/.test(css), 'Barlow reemplaza a Inter');
  assert.match(inline, /ArrowRight/);
  assert.match(inline, /pointerdown/);
  assert.match(inline, /Flip/);
});

test('sin JS, ?q y ?genero los resuelve el servidor', async () => {
  const res = await GET(new Request('http://itinerante.test/nuevo?q=los&genero=poesia'));
  const body = await res.text();
  const catalogo = seccion(body, 'libros');
  const lis = [...catalogo.matchAll(/<li data-id="([^"]+)"([^>]*)>/g)];
  const visibles = lis.filter((m) => !/\shidden=/.test(m[2])).map((m) => m[1]);
  const ocultos = lis.filter((m) => /\shidden=/.test(m[2])).map((m) => m[1]);
  const esperados = librosConsulta(parseConsulta(new URLSearchParams('q=los&genero=poesia'))).map((l) => l.id);
  assert.deepEqual(visibles.sort(), esperados.sort());
  assert.equal(visibles.length + ocultos.length, 41);
  assert.ok(visibles.length > 0 && visibles.length < 41);
  assert.ok(body.includes('value="los"'));
  const ficha = await GET(new Request('http://itinerante.test/nuevo?libro=amigos-rodrigo-garnica'));
  const fichaHtml = await ficha.text();
  assert.match(fichaHtml, /id="hoja"[^>]*class="hoja abierta"|class="hoja abierta"/);
  assert.match(fichaHtml, /Consultar disponibilidad por WhatsApp/);
  assert.match(fichaHtml, /Amigos/);
});

test('orden del main con recomendaciones plegadas junto al buscador del catálogo', () => {
  const h = html();
  const ids = ['inicio', 'eventos', 'talleres', 'destacados', 'libros', 'recomendaciones', 'cafe', 'visita'];
  const pos = ids.map((id) => h.indexOf(`id="${id}"`));
  for (const [i, id] of ids.entries()) assert.ok(pos[i] >= 0, `falta #${id}`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  const catalogo = seccion(h, 'libros');
  assert.match(catalogo, /id="busqueda"[\s\S]*<details class="recomendaciones" id="recomendaciones" hidden=""><summary>Tu próxima lectura/);
  assert.ok(catalogo.indexOf('id="recomendaciones"') < catalogo.indexOf('id="panel"'));
});

test('agenda vacía: ofrece Instagram y mantiene ocultos los controles', () => {
  const m = renderToStaticMarkup(createElement(Eventos, { agenda: [] }));
  assert.match(m, /agenda-controles" hidden=""/);
  assert.match(m, /Por ahora no hay actividades anunciadas[\s\S]*Instagram/);
  assert.doesNotMatch(m, /id="talleres"|<article/);
});

test('el taller recurrente conserva su horario junto al título aunque falte el cartel', () => {
  const club = EVENTOS.find((e) => e.id === 'club-dibujo-pintura');
  const m = renderToStaticMarkup(createElement(Eventos, { agenda: [{ ...club, imagen: null }] }));
  assert.match(m, /cartel--taller[\s\S]*agenda-horario[\s\S]*Sábados cada 15 días/);
  assert.equal(cuenta(m, /14:00–16:00/g), 1);
  assert.doesNotMatch(m, /cartel-trazo/);
});

test('taller con proximaSesion vigente: el cartel anuncia la fecha y al pasar vuelve la recurrencia', () => {
  const club = EVENTOS.find((e) => e.id === 'club-dibujo-pintura');
  const taller = { ...club, id: 'prox-taller', proximaSesion: '2026-12-05' };
  const m = renderToStaticMarkup(createElement(Eventos, { agenda: [taller] }));
  assert.ok(m.includes('<fecha-hasta d="2026-12-05">'));
  assert.ok(m.includes('Próxima sesión'));
  assert.ok(m.includes('dateTime="2026-12-05"'));
  assert.ok(m.includes('<fecha-desde d="2026-12-06">'));
  assert.ok(m.split('<fecha-desde d="2026-12-06">')[1].includes('Sábados cada 15 días'));
  const vigente = aplicarFechas(m, '2026-12-05');
  assert.ok(vigente.includes('Próxima sesión'));
  const pasada = aplicarFechas(m, '2026-12-06');
  assert.ok(!pasada.includes('Próxima sesión'));
  assert.ok(pasada.includes('Sábados cada 15 días'));
});

test('la carta de Café se consulta antes de las recomendaciones y enlaza a Visita', () => {
  const h = html();
  const cafe = seccion(h, 'cafe');
  const inicioVitrina = cafe.indexOf('class="menu-vitrina"');
  assert.ok(inicioVitrina > cafe.indexOf('id="carta-completa"'));
  const vitrina = cafe.slice(inicioVitrina);
  assert.match(vitrina, /<a class="carta-visita" href="#visita">Planear la visita/);
  assert.ok(!vitrina.includes('llegada-sala'));
  assert.match(vitrina, /role="region" aria-roledescription="carrusel" aria-labelledby="t-cafe-muestra"/);
  assert.equal(cuenta(vitrina, /aria-controls="cafe-carrusel"/g), 2);
  assert.equal(cuenta(vitrina, /aria-current="true"/g), 1);
  assert.match(vitrina, /id="cafe-posicion">1 de 3<\/span>/);
  for (const id of ['quesadilla-campesina', 'molletes', 'tarta-del-dia']) {
    const producto = CARTA.flatMap((categoria) => categoria.productos).find((p) => p.id === id);
    assert.ok(vitrina.includes(producto.nombre));
    assert.ok(vitrina.includes(`$${producto.precio} MXN`));
  }
  const visita = seccion(h, 'visita');
  assert.ok(visita.includes('01-entrada-pasillo-800.webp'));
  assert.ok(!visita.includes('llegada-sala'));
  assert.ok(!visita.includes('<figcaption'));
});

test('nuevo.css: una sola escala para los H2 y body sin tabular-nums', () => {
  const css = readFileSync(new URL('../src/frente/nuevo.css', import.meta.url), 'utf8');
  const reglas = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)];
  const h2 = reglas.filter((m) => m[1].trim().endsWith('.h2'));
  assert.ok(h2.length > 0);
  assert.equal(h2.reduce((n, m) => n + cuenta(m[2], /font-size/g), 0), 1, 'solo .h2 declara tamaño');
  const body = reglas.find((m) => m[1].trim() === 'body');
  assert.ok(body && !body[2].includes('tabular-nums'));
});

test('nuevo.css: duraciones en tokens, rol rótulo y ningún texto bajo 13 px', () => {
  const css = readFileSync(new URL('../src/frente/nuevo.css', import.meta.url), 'utf8');
  for (const t of ['--d-presion:120ms', '--d-rapida:180ms', '--d-media:300ms', '--d-mover:480ms', '--d-salir:360ms', '--t-rotulo:.8125rem']) {
    assert.ok(css.includes(t), `falta ${t}`);
  }
  const transiciones = [...css.matchAll(/transition:[^;}]+/g)].map((m) => m[0]);
  const literales = transiciones.flatMap((t) => [...t.matchAll(/\b\d+\.?\d*(?:ms|s)\b/g)].map((m) => m[0])).filter((d) => d !== '900ms');
  assert.deepEqual(literales, [], `duraciones literales en transition: ${literales.join(', ')}`);
  const fuentes = [...css.matchAll(/font(?:-size)?:[^;}]+/g)].flatMap((m) => [...m[0].matchAll(/(\d+\.?\d*)px/g)].map((n) => parseFloat(n[1])));
  assert.ok(fuentes.every((px) => px >= 13), `tamaños bajo 13 px: ${fuentes.filter((px) => px < 13).join(', ')}`);
});

test('tema Astryx al día, contraste AA y Astryx fijado a 0.7.17 sin AGENTS.md de Astryx', () => {
  execFileSync(process.execPath, ['scripts/build-tema-astryx.mjs', '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/check-contraste.mjs'], { stdio: 'pipe' });
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies['@astryxdesign/core'], '0.7.17');
  assert.ok(!/astryx/i.test(readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8')));
});

test('vitrina móvil: la pieza ocupa media pantalla (190–260 px) y la regla de escritorio sigue', () => {
  assert.equal(anchoPieza(393), 197);
  assert.equal(anchoPieza(320), 190);
  assert.equal(anchoPieza(760), 260);
  assert.equal(anchoPieza(1440), 245, 'desde 761 manda la regla anterior');
});

test('destacados se titula «Para empezar» y la ficha de la vitrina trae sinopsis', () => {
  const h = html();
  const d = seccion(h, 'destacados');
  assert.ok(d.includes('>Para empezar</h2>'));
  assert.ok(d.includes(`Hojea ${DESTACADOS.length} libros de la librería.`));
  assert.match(d, /id="v-ficha" type="button" hidden="">Ver ficha del libro/);
  assert.ok(d.includes('aria-label="Para empezar:'));
  const centro = Math.min(3, DESTACADOS.length - 1);
  assert.ok(DESTACADOS[centro].sinopsis, 'el libro central tiene sinopsis');
  const ficha = d.split('id="ficha-vitrina"')[1].split('vitrina-acciones')[0];
  assert.ok(ficha.includes('ficha-sinopsis'));
  assert.ok(ficha.includes(DESTACADOS[centro].sinopsis.slice(0, 30)));
});

test('vitrina-ayuda llega oculta y la muestra el cliente, con las dos pistas', () => {
  const d = seccion(html(), 'destacados');
  assert.match(d, /<p class="vitrina-ayuda" id="vitrina-ayuda" hidden="">/);
  assert.ok(d.includes('Toca la portada del centro para ver su ficha.'));
  assert.ok(d.includes('Haz clic en la portada del centro para ver su ficha.'));
  const js = readFileSync(new URL('../src/frente/cliente.js', import.meta.url), 'utf8');
  assert.match(js, /vitrina-ayuda/);
  assert.match(js, /ayuda\.hidden = false/);
});
