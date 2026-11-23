// Frente nuevo (/nuevo, SPEC v2): datos reales, HTML generado al día, conteos de Visita, frases vetadas y bloques fechados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { gzipSync } from 'node:zlib';
import { LIBROS, CARTA, NOVEDADES, MERCH, NEGOCIO, NOMBRE_TIENDA, RECURRENTES, FECHADOS, EVENTOS, DESTACADOS, editorialesCatalogo, generosColeccion, eventosFechados, filasDeCategoria, planTienda } from '../src/frente/datos.ts';
import { poseVitrina, transformVitrina, destinoGesto, teclaVitrina, anchoPieza, pasoVitrina } from '../src/frente/vitrina.js';
import { BloqueTienda } from '../src/frente/pagina.tsx';
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
  assert.ok(dom.includes('Próximamente'));
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
  assert.match(dia27, /<a class="boton boton--tinta cta-portada" href="#eventos">Ver eventos /);
  assert.ok(!dia27.includes('add-to-calendar') && !dia27.includes('.ics'));
  assert.ok(!textoVisible(dia27.replace(/<fecha-desde[^>]*hidden=""[^>]*>[\s\S]*?<\/fecha-desde>/g, '')).includes('Ver libros'), 'el CTA del día 28 va oculto');
  assert.match(dia27, /<fecha-desde d="2026-11-28" hidden="">/, 'y listo para el navegador si este HTML sigue en caché');
  const dia28 = html('2026-11-28');
  assert.ok(!dia28.includes('6.º Aniversario'));
  assert.match(dia28, /<a class="boton boton--tinta cta-portada" href="#destacados">Ver libros /);
  assert.ok(!dia28.includes('Ver eventos'));
  const nav28 = textoVisible(dia28.match(/<nav aria-label="Secciones">([\s\S]*?)<\/nav>/)[1]).replace(/\s+/g, ' ').trim();
  assert.equal(nav28, 'Eventos Libros Visita');
  assert.ok(!textoVisible(html('2026-11-27')).includes('Actividades'));
  assert.equal(eventosFechados('2026-11-27').length, 1);
  assert.equal(eventosFechados('2026-11-28').length, 0);
});

test('hoyMonterrey usa la hora de Monterrey (UTC−6), no la del servidor', () => {
  assert.equal(hoyMonterrey(new Date('2026-11-28T05:59:00Z')), '2026-11-27');
  assert.equal(hoyMonterrey(new Date('2026-11-28T06:00:00Z')), '2026-11-28');
});

test('sin personalización: menú de 3 ítems sin «Inicio» y sin switch', () => {
  const nav = html().match(/<nav aria-label="Secciones">([\s\S]*?)<\/nav>/)[1];
  assert.equal(cuenta(nav, /<a /g), 3);
  assert.ok(!/>Inicio</.test(nav));
});

test('eventos: orden por fecha, fecha larga solo para el lector, sin datos ajenos', () => {
  const h = html();
  const ev = seccion(h, 'eventos');
  assert.ok(seccion(h, 'destacados').includes('aria-roledescription="carrusel"'));
  assert.ok(ev.indexOf('6.º Aniversario') < ev.indexOf('Club de Dibujo y Pintura'));
  assert.ok(ev.includes('class="sr"'));
  const sinLector = ev.replace(/<span class="sr">[\s\S]*?<\/span>/g, '');
  assert.ok(!sinLector.includes('noviembre'), 'la fecha larga no se ve');
  assert.ok(ev.includes('viernes, 27 de noviembre de 2026'));
  assert.ok(ev.includes('Hora por anunciar') && ev.includes('Santiago González') && ev.includes('$150 MXN'));
  assert.equal(cuenta(h, /forms\.gle/g), 1, 'el formulario de renta vive una vez, en Visita');
  assert.ok(seccion(h, 'visita').includes('forms.gle') && !ev.includes('forms.gle'));
  assert.ok(!h.includes('Skribh') && !/piel de los recuerdos/i.test(h));
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
  assert.ok(barra.includes('Hierbabuena') && barra.includes('Té verde') && barra.includes('Aguas frescas'));
  assert.ok(!barra.includes('Los tés'));
  assert.equal(cuenta(barra, /class="precio"|\$0 MXN/g), 0);
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
  assert.equal(cuenta(vacio, /próximamente/gi), 2);
  const tienda = seccion(html(), 'tienda');
  assert.equal(cuenta(tienda, /<img /g), 0);
  assert.equal(cuenta(tienda, /\$\d+/g), 0);
  assert.equal(cuenta(tienda, /<a |<button/g), 0);
});

test('pies de foto de hasta 8 palabras y la foto sin permiso sigue, marcada', () => {
  for (const f of NEGOCIO.fotos) assert.ok(f.pie.trim().split(/\s+/).length <= 8, f.pie);
  assert.equal(NEGOCIO.fotos[0].permisoRegistrado, false);
  assert.equal(NEGOCIO.fotos[1].permisoRegistrado, true);
  const h = html();
  assert.ok(!h.includes('oficial-rincon'), 'sin permiso no entra a la página');
  assert.ok(h.includes('/assets/img/01-entrada-pasillo-800.webp'));
  assert.ok(seccion(h, 'visita').includes('El pasillo de entrada'));
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
  assert.doesNotMatch(js, /addEventListener\('wheel'/);
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
  const catalogo = body.split('id="libros"')[1].split('id="tienda"')[0];
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

test('tema Astryx al día, contraste AA y Astryx fijado a 0.7.17 sin AGENTS.md de Astryx', () => {
  execFileSync(process.execPath, ['scripts/build-tema-astryx.mjs', '--check'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/check-contraste.mjs'], { stdio: 'pipe' });
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies['@astryxdesign/core'], '0.7.17');
  assert.ok(!/astryx/i.test(readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8')));
});
