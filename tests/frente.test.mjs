// Frente nuevo (/nuevo, SPEC v2): datos reales, HTML generado al día, conteos de Visita, frases vetadas y bloques fechados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gzipSync } from 'node:zlib';
import { LIBROS, CARTA, NOVEDADES, MERCH, NEGOCIO, NOMBRE_TIENDA, RECURRENTES, FECHADOS, EVENTOS, tiposDeTienda, editorialesConFiltro, generosConFiltro, eventosFechados, filasDeCategoria } from '../src/frente/datos.ts';
import { coverflowPose, keyTarget } from '../src/frente/carrusel.js';
import { FilaTipos } from '../src/frente/pagina.tsx';
import { aplicarFechas, hoyMonterrey, cabeceraIsr, cacheVencido, REVALIDATE_SEGUNDOS, EXPIRE_SEGUNDOS } from '../src/frente/fechas.ts';
import { proponer, redactar, syncActivo } from '../src/frente/instagram-sync.ts';
import { DOCUMENTO } from '../src/app/nuevo/documento.generado.ts';

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

test('tienda: 41 tarjetas en el HTML, un solo enlace por tarjeta, un solo contador «41 libros»', () => {
  const t = seccion(html(), 'tienda');
  const tarjetas = t.split('<li class="libro"').slice(1);
  assert.equal(tarjetas.length, 41);
  for (const c of tarjetas) assert.equal(cuenta(c.split('</li>')[0], /<a /g), 1);
  assert.equal(cuenta(textoVisible(html()), /\b41 (libros|títulos)\b/g), 1);
  assert.equal(cuenta(t, /class="portada-tipografica" aria-hidden="true"/g), 9, '9 libros sin portada, placeholder oculto al lector');
  assert.equal(cuenta(t, /<img [^>]*alt=""/g), 32, 'las portadas reales no repiten el título');
});

test('filtros: editoriales y géneros con al menos 2 libros; la tienda siempre muestra Libros, Merch y Talleres', () => {
  assert.equal(tiposDeTienda().length, 3);
  assert.deepEqual(tiposDeTienda().map((t) => t.id), ['libros', 'merch', 'talleres']);
  const dom = sinScript(html());
  assert.equal(cuenta(dom, /name="tipo"/g), 3);
  assert.ok(dom.includes('Próximamente'));
  for (const e of editorialesConFiltro()) assert.ok(e.n >= 2);
  for (const g of generosConFiltro()) assert.ok(g.n >= 2);
  assert.ok(dom.includes('name="genero"'));
  assert.ok(!html().includes('value="libro-objeto"'));
  assert.ok(!dom.includes('class="c3d"'), 'sin JS no hay carrusel: queda la cuadrícula');
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
  for (const e of [...FECHADOS, ...RECURRENTES]) assert.match(e.instagramUrl, /^https:\/\/www\.instagram\.com\/libreriaitineranteymasmty\/p\//);
  assert.equal(cuenta(html(), /Registrarme/g), 0);
  assert.equal(cuenta(html(), /Ver en Instagram/g), 2);
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

test('carrusel de eventos: orden por fecha, fecha larga solo para el lector, sin datos ajenos', () => {
  const h = html();
  const ev = seccion(h, 'eventos');
  assert.ok(ev.includes('aria-roledescription="carrusel"') && ev.includes('tabindex="0"'));
  assert.ok(ev.indexOf('6.º Aniversario') < ev.indexOf('Club de Dibujo y Pintura'));
  assert.ok(ev.includes('<span class="sr-only">'));
  const sinLector = ev.replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '');
  assert.ok(!sinLector.includes('noviembre'), 'la fecha larga no se ve');
  assert.ok(ev.includes('viernes, 27 de noviembre de 2026'));
  assert.ok(ev.includes('Hora por anunciar') && ev.includes('Santiago González') && ev.includes('$150 MXN'));
  assert.ok(!h.includes('forms.gle') && !h.includes('Skribh') && !/piel de los recuerdos/i.test(h));
  assert.equal(EVENTOS.filter((e) => e.registroUrl).length, 0);
  assert.ok(EVENTOS.every((e) => e.imagen == null || e.imagen.startsWith('/assets/')));
});

test('carta: los tés sin precio van en una sola fila, junto con Aguas frescas', () => {
  const sin = CARTA.find((c) => c.id === 'sin-cafe');
  const filas = filasDeCategoria(sin.productos);
  const sinPrecio = filas.filter((f) => f.precio == null);
  assert.equal(sinPrecio.length, 1);
  assert.equal(sinPrecio[0].nombre, 'Tés');
  assert.match(sinPrecio[0].detalle, /Hierbabuena/);
  assert.match(sinPrecio[0].detalle, /Té verde/);
  assert.deepEqual(sinPrecio[0].lineas, ['Aguas frescas']);
  let racha = 0;
  let max = 0;
  for (const f of filas) {
    racha = f.precio == null ? racha + 1 : 0;
    max = Math.max(max, racha);
  }
  assert.ok(max <= 1);
  const barra = seccion(html(), 'visita');
  assert.ok(!barra.includes('>Hierbabuena<') && barra.includes('Tés') && barra.includes('Aguas frescas'));
  assert.ok(!barra.includes('Los tés'));
});

test('un producto de merch de ejemplo deja de ser «Próximamente»; hoy Merch y Talleres sí lo son', () => {
  const ejemplo = { id: 'ejemplo-merch', nombre: 'Producto de ejemplo', precio: null };
  assert.equal(MERCH.length, 0);
  const tipos = tiposDeTienda({ merch: [ejemplo].length });
  assert.equal(tipos.find((t) => t.id === 'merch').n, 1);
  assert.equal(tipos.find((t) => t.id === 'talleres').n, 0);
  const fila = renderToStaticMarkup(createElement(FilaTipos, { tipos }));
  assert.match(fila, /name="tipo"/);
  assert.match(fila, /Libros/);
  assert.match(fila, /Merch/);
  assert.match(fila, /Talleres/);
  assert.equal(cuenta(fila, /Próximamente/g), 1, 'solo Talleres, que sigue en cero');
  const hoy = renderToStaticMarkup(createElement(FilaTipos, { tipos: tiposDeTienda() }));
  assert.equal(cuenta(hoy, /Próximamente/g), 2);
});

test('pies de foto de hasta 8 palabras y la foto sin permiso sigue, marcada', () => {
  for (const f of NEGOCIO.fotos) assert.ok(f.pie.trim().split(/\s+/).length <= 8, f.pie);
  assert.equal(NEGOCIO.fotos[0].permisoRegistrado, false);
  assert.equal(NEGOCIO.fotos[1].permisoRegistrado, true);
  const h = html();
  assert.ok(h.includes('/assets/img/oficial-rincon-800.webp'));
  assert.ok(h.includes('alt="Muro de piedra'));
  assert.ok(seccion(h, 'visita').includes('La sala'));
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

test('carrusel 3D: el centro va de frente y con reduce no hay transform', () => {
  const centro = coverflowPose(0, { w: 220 });
  assert.match(centro.transform, /rotateY\(0\.00deg\)/);
  assert.equal(centro.opacity, 1);
  const vecina = coverflowPose(1, { w: 220 });
  assert.match(vecina.transform, /rotateY\(-44\.00deg\)/);
  const plano = coverflowPose(1, { flat: true, w: 220 });
  assert.equal(plano.transform, 'none');
  assert.equal(plano.opacity, 0);
  assert.equal(keyTarget('ArrowRight', 2, 10), 3);
  assert.equal(keyTarget('ArrowLeft', 0, 10), 0);
  const js = readFileSync(new URL('../src/frente/carrusel.js', import.meta.url), 'utf8');
  assert.match(js, /pointerdown/);
  assert.match(js, /vel \*= 0\.9/);
  assert.match(js, /host.addEventListener\('keydown'/);
});

test('el JS en línea cabe sin framework y con reduce no hay transform', () => {
  const inline = [...DOCUMENTO.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('');
  const gz = gzipSync(Buffer.from(inline)).length;
  assert.ok(gz < 80000, `JS ${gz} B gz`);
  assert.ok(gz > 2000, `el carrusel tiene que estar en el JS (${gz} B gz)`);
  assert.match(inline, /ArrowRight/);
  assert.match(inline, /pointerdown/);
  const css = readFileSync(new URL('../src/frente/nuevo.css', import.meta.url), 'utf8');
  const reduce = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduce, /transform:\s*none !important/);
  assert.doesNotMatch(reduce, /translate|rotate|scale\(/);
  assert.match(css, /--curva-salida/);
  assert.match(css, /--curva-resorte/);
});

test('tema Astryx al día, contraste AA y Astryx fijado a 0.7.17 sin AGENTS.md de Astryx', () => {
  execFileSync(process.execPath, ['scripts/build-tema-astryx.mjs', '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/check-contraste.mjs'], { stdio: 'pipe' });
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies['@astryxdesign/core'], '0.7.17');
  assert.ok(!/astryx/i.test(readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8')));
});
