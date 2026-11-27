// Mejora de /nuevo. El HTML ya trae el contenido: esto anima, hojea la vitrina y hace instantáneos los filtros.
// GSAP entra por el bundle (npm). Nada de CDN. prefers-reduced-motion suaviza; no apaga los estados.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { recomendarLibros } from './recomendaciones.js';
import { iniciarMovimiento } from './movimiento.js';
import { anchoPieza, poseVitrina, transformVitrina, destinoGesto } from './vitrina.js';

gsap.registerPlugin(Flip);

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const preferenciaMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
const reducir = preferenciaMovimiento.matches;
const E_OUT = 'expo.out';
// Espejo de los tokens de duración de nuevo.css (--d-*), en segundos para GSAP.
const D = { presion: .12, rapida: .18, media: .3, mover: .48, salir: .36 };
const libros = JSON.parse($('#datos-libros').textContent);
const porId = Object.fromEntries(libros.map((b) => [b.id, b]));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const precio = (n) => (n == null ? '' : `$${n} MXN`);
const scrollYa = (y) => window.scrollTo({ top: y, behavior: 'instant' });

// Fechas (hora de Monterrey): el mismo criterio que el servidor, por si el HTML sigue en caché el día 28.
const hoyISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
$$('fecha-hasta').forEach((e) => { if (hoyISO > e.getAttribute('d')) e.remove(); });
$$('fecha-desde').forEach((e) => { if (hoyISO < e.getAttribute('d')) e.remove(); else e.hidden = false; });

// Agenda: varias actividades a la vista, avanza sola una a una y se detiene en cuanto la persona la toma
// (arrastre, flechas, teclado, trackpad). El cursor encima solo la pausa. Con «reducir movimiento» no avanza sola.
const agenda = $('#agenda-eventos');
const carruselAgenda = $('.agenda-carrusel');
const controlesAgenda = $('.agenda-controles');
const botonesAgenda = [...controlesAgenda.querySelectorAll('[data-agenda-paso]')];
const tarjetasAgenda = [...agenda.querySelectorAll(':scope > li:has(.parada)')];
const INTERVALO_AGENDA = 5_000;
let indiceAgenda = 0;
let avanzarAgenda = !preferenciaMovimiento.matches;
let agendaAlaVista = false;
let agendaEnPausa = false;
let temporizadorAgenda;
let rellenoAgenda = 0;
let marcoAgenda = 0;

const destinoAgenda = (tarjeta) => tarjeta.offsetLeft - rellenoAgenda;
const finAgenda = () => agenda.scrollWidth - agenda.clientWidth;

function actualizarAgenda() {
  marcoAgenda = 0;
  const x = agenda.scrollLeft;
  const distancias = tarjetasAgenda.map((tarjeta) => Math.abs(destinoAgenda(tarjeta) - x));
  indiceAgenda = distancias.indexOf(Math.min(...distancias));
  botonesAgenda[0].setAttribute('aria-disabled', String(x <= 2));
  botonesAgenda[1].setAttribute('aria-disabled', String(x >= finAgenda() - 2));
}
const pedirActualizarAgenda = () => { marcoAgenda ||= requestAnimationFrame(actualizarAgenda); };

function irAgenda(indice, inmediato = false) {
  const tarjeta = tarjetasAgenda[Math.max(0, Math.min(indice, tarjetasAgenda.length - 1))];
  if (!tarjeta) return;
  agenda.scrollTo({
    left: Math.min(destinoAgenda(tarjeta), finAgenda()),
    behavior: inmediato || preferenciaMovimiento.matches ? 'instant' : 'smooth',
  });
}

function programarAgenda() {
  clearTimeout(temporizadorAgenda);
  if (!avanzarAgenda || preferenciaMovimiento.matches || agendaEnPausa ||
      !agendaAlaVista || document.hidden || agenda.scrollWidth <= agenda.clientWidth + 2) return;
  temporizadorAgenda = setTimeout(() => {
    // Al llegar al final vuelve al principio sin recorrer todo de regreso.
    if (agenda.scrollLeft >= finAgenda() - 2) irAgenda(0, true);
    else irAgenda(indiceAgenda + 1);
    programarAgenda();
  }, INTERVALO_AGENDA);
}

function detenerAgenda() {
  avanzarAgenda = false;
  clearTimeout(temporizadorAgenda);
}

botonesAgenda.forEach((b) => b.addEventListener('click', () => {
  if (b.getAttribute('aria-disabled') === 'true') return;
  detenerAgenda();
  irAgenda(indiceAgenda + Number(b.dataset.agendaPaso));
}));
agenda.addEventListener('keydown', (e) => {
  if (e.target !== agenda || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  detenerAgenda();
  if (e.key === 'Home') irAgenda(0);
  else if (e.key === 'End') irAgenda(tarjetasAgenda.length - 1);
  else irAgenda(indiceAgenda + (e.key === 'ArrowRight' ? 1 : -1));
});
carruselAgenda.addEventListener('focusin', (e) => {
  if (!e.target.matches(':focus-visible')) return;
  detenerAgenda();
  const tarjeta = e.target.closest('li');
  // Solo se mueve si la tarjeta enfocada con el teclado quedó fuera de la vista.
  if (tarjeta && (tarjeta.offsetLeft < agenda.scrollLeft || tarjeta.offsetLeft + tarjeta.offsetWidth > agenda.scrollLeft + agenda.clientWidth)) {
    irAgenda(tarjetasAgenda.indexOf(tarjeta), true);
  }
});
agenda.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) detenerAgenda(); }, { passive: true });
agenda.addEventListener('touchstart', detenerAgenda, { passive: true });
carruselAgenda.addEventListener('pointerenter', (e) => {
  if (e.pointerType !== 'mouse') return;
  agendaEnPausa = true;
  programarAgenda();
});
carruselAgenda.addEventListener('pointerleave', () => {
  agendaEnPausa = false;
  programarAgenda();
});

// Arrastrar con el ratón: la pista sigue al cursor y al soltar se ajusta a la tarjeta más cercana.
// Si hubo arrastre, el clic que sigue no abre el enlace que quedó debajo.
let arrastreAgenda = null;
agenda.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  detenerAgenda();
  arrastreAgenda = { x: e.clientX, inicio: agenda.scrollLeft, movio: false, id: e.pointerId };
});
agenda.addEventListener('pointermove', (e) => {
  if (!arrastreAgenda) return;
  const dx = e.clientX - arrastreAgenda.x;
  if (!arrastreAgenda.movio) {
    if (Math.abs(dx) < 6) return;
    arrastreAgenda.movio = true;
    agenda.setPointerCapture(arrastreAgenda.id);
    agenda.classList.add('arrastrando');
  }
  agenda.scrollLeft = arrastreAgenda.inicio - dx;
});
const soltarAgenda = () => {
  if (!arrastreAgenda) return;
  const movio = arrastreAgenda.movio;
  arrastreAgenda = null;
  if (!movio) return;
  agenda.classList.remove('arrastrando');
  irAgenda(indiceAgenda);
  const anular = (e) => { e.preventDefault(); e.stopPropagation(); };
  addEventListener('click', anular, { capture: true, once: true });
  setTimeout(() => removeEventListener('click', anular, { capture: true }), 0);
};
agenda.addEventListener('pointerup', soltarAgenda);
agenda.addEventListener('pointercancel', soltarAgenda);
agenda.addEventListener('dragstart', (e) => e.preventDefault());

new IntersectionObserver(([entrada]) => {
  agendaAlaVista = entrada.intersectionRatio >= .35;
  programarAgenda();
}, { threshold: .35 }).observe(agenda);
document.addEventListener('visibilitychange', programarAgenda);
preferenciaMovimiento.addEventListener('change', detenerAgenda);

function abrirAnclaAgenda() {
  const hash = location.hash.slice(1);
  if (hash === 'eventos' || hash === 'cartelera') return irAgenda(0, true);
  const indice = tarjetasAgenda.findIndex((li) => hash === 'talleres' ? li.hasAttribute('data-taller') : li.querySelector('.parada').id === hash);
  if (indice < 0) return;
  detenerAgenda();
  irAgenda(indice, true);
}
agenda.addEventListener('scroll', pedirActualizarAgenda, { passive: true });
new ResizeObserver(() => {
  rellenoAgenda = parseFloat(getComputedStyle(agenda).scrollPaddingInlineStart) || 0;
  actualizarAgenda();
  programarAgenda();
}).observe(agenda);
addEventListener('hashchange', abrirAnclaAgenda);
$('.cab a[href="#eventos"]').addEventListener('click', () => {
  if (location.hash === '#eventos') abrirAnclaAgenda();
});
abrirAnclaAgenda();
controlesAgenda.hidden = tarjetasAgenda.length < 2;
$$('.cartel img').forEach((img) => {
  const preparada = () => {
    if (!img.naturalWidth) img.hidden = true;
    else if (!reducir) img.animate([{ opacity: 0, scale: 1.025 }, { opacity: 1, scale: 1 }], { duration: D.media * 1000, easing: 'ease-out' });
  };
  if (img.complete) { if (!img.naturalWidth) img.hidden = true; }
  else {
    img.addEventListener('load', preparada, { once: true });
    img.addEventListener('error', preparada, { once: true });
  }
});

// Portadas: entran con fundido y leve zoom al cargar (CSS: html.js + img.cargada). Sin JS se ven normal.
const SELECTOR_PORTADAS = '.pieza .cara img, .hoja .portada-hoja img';
function marcaPortadas(raiz = document) {
  for (const im of raiz.querySelectorAll(SELECTOR_PORTADAS)) {
    if (im.dataset.cargaMarcada) continue;
    im.dataset.cargaMarcada = '1';
    const lista = () => im.classList.add('cargada');
    if (im.complete && im.getAttribute('src')) lista();
    else { im.addEventListener('load', lista); im.addEventListener('error', lista); }
  }
}
marcaPortadas();

// Portada: la camioneta llega una sola vez y termina centrada. Empieza después del primer fotograma: medir sus estilos
// antes de pintar retrasaba la primera pintura. Mientras tanto la cabecera (`html.entrada`, puesta en <head>) la oculta.
const raizDoc = document.documentElement;
if (!reducir) {
  requestAnimationFrame(() => setTimeout(() => {
    const tl = gsap.timeline({ delay: 0.05 });
    tl.from('.camion', { xPercent: -38, duration: 1.1, ease: E_OUT })
      .from('.camion .trazo', { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'power3.out' }, 0)
      .from('#carga img', { y: -70, opacity: 0, rotation: (i, el) => +el.dataset.r - 14, duration: 0.7, ease: E_OUT, stagger: 0.08 }, 0.55);
    // Aniversario: la banderola se despliega desde el enganche mientras la camioneta avanza y se queda quieta al parar.
    if ($('.banderola')) tl.from('.banderola', { scaleX: 0, rotation: 8, transformOrigin: '100% 55%', duration: 0.9, ease: E_OUT }, 0.2);
    raizDoc.classList.remove('entrada');
  }, 0));
} else raizDoc.classList.remove('entrada');

// Vitrina.
const vit = $('#vitrina');
if (vit) {
  const piezas = $$('#escenario .pieza');
  const destacados = piezas.map((p) => porId[p.dataset.id]);
  const st = { pos: Math.min(3, destacados.length - 1) };
  let W = 0;
  const paso = () => W * 0.74;
  const limita = (v) => Math.max(0, Math.min(destacados.length - 1, v));
  function cargaCerca(c) {
    for (let i = Math.max(0, c - 3); i <= Math.min(piezas.length - 1, c + 3); i++) {
      const im = piezas[i].querySelector('img');
      if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
    }
  }
  let centroPrevio = -1;
  function controles(i) {
    $('#v-cont').textContent = `${i + 1} de ${destacados.length}`;
    $('#v-ant').setAttribute('aria-disabled', String(i === 0));
    $('#v-sig').setAttribute('aria-disabled', String(i === destacados.length - 1));
  }
  function fichaVitrina(i) {
    const b = destacados[i];
    const f = $('#ficha-vitrina');
    f.innerHTML = `<h3>${esc(b.t)}</h3><p>${esc(b.a)}${b.p ? ` · ${esc(b.p)}` : ''}${b.pr != null ? ` · <span class="precio">${precio(b.pr)}</span>` : ''}</p>${b.s ? `<p class="ficha-sinopsis">${esc(b.s)}</p>` : ''}`;
    controles(i);
    if (!reducir) gsap.fromTo(f, { opacity: .8 }, { opacity: 1, duration: D.rapida, ease: E_OUT, overwrite: true });
  }
  // Por fotograma solo transform, opacidad y el velo de cada portada (una opacidad, no un `filter` que obliga a
  // volver a pintar la portada); zIndex y visibilidad se escriben solo cuando cambian.
  const zPrevio = [];
  const ocultaPrevia = [];
  function pinta() {
    vit.style.perspective = `${W * 4}px`;
    const movil = innerWidth < 700;
    piezas.forEach((p, i) => {
      const d = i - st.pos;
      const k = poseVitrina(d, { w: W, flat: reducir, movil });
      p.style.transform = transformVitrina(k);
      p.style.opacity = k.op;
      const z = 100 - Math.round(Math.abs(d) * 10);
      if (zPrevio[i] !== z) { zPrevio[i] = z; p.style.zIndex = String(z); }
      const oculta = k.op <= 0;
      if (ocultaPrevia[i] !== oculta) { ocultaPrevia[i] = oculta; p.style.visibility = oculta ? 'hidden' : 'visible'; }
      p.firstChild.style.setProperty('--velo', (Math.min(k.dim, 1) * 0.38).toFixed(3));
    });
    const c = Math.round(st.pos);
    if (c !== centroPrevio) {
      const primera = centroPrevio < 0;
      centroPrevio = c;
      piezas.forEach((p, i) => p.classList.toggle('centro', i === c));
      cargaCerca(c);
      if (!primera) fichaVitrina(c);
      else controles(c);
    }
  }
  function ir(i, dur) {
    i = limita(i);
    if (reducir) { st.pos = i; pinta(); return; }
    gsap.to(st, { pos: i, duration: dur ?? 0.75, ease: E_OUT, onUpdate: pinta, overwrite: true });
  }
  function medir() { W = anchoPieza(innerWidth); vit.style.setProperty('--w', `${W}px`); piezas.forEach((p) => p.style.setProperty('--w', `${W}px`)); pinta(); }
  addEventListener('resize', medir);
  medir();
  const ayuda = $('#vitrina-ayuda');
  if (ayuda) ayuda.hidden = false;
  const verFicha = $('#v-ficha');
  verFicha.hidden = false;
  verFicha.addEventListener('click', () => {
    const i = Math.round(st.pos);
    abrirFicha(destacados[i], piezas[i].querySelector('img'), verFicha);
  });
  for (const [selector, paso] of [['#v-ant', -1], ['#v-sig', 1]]) {
    const boton = $(selector);
    boton.onclick = () => {
      if (boton.getAttribute('aria-disabled') === 'false') ir(Math.round(st.pos) + paso, D.mover);
    };
  }
  vit.addEventListener('keydown', (e) => {
    const c = Math.round(st.pos);
    if (e.key === 'ArrowRight') { ir(c + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { ir(c - 1); e.preventDefault(); }
    else if (e.key === 'Home') { ir(0); e.preventDefault(); }
    else if (e.key === 'End') { ir(destacados.length - 1); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { abrirFicha(destacados[c], piezas[c].querySelector('img')); e.preventDefault(); }
  });
  {
    let x0 = 0; let y0 = 0; let p0 = 0; let id = null; let horizontal = false; let movido = false;
    vit.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; p0 = st.pos; horizontal = false; movido = false;
    });
    vit.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x0; const dy = e.clientY - y0;
      if (!horizontal) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        horizontal = true; movido = true; vit.setPointerCapture(id); gsap.killTweensOf(st);
      }
      st.pos = limita(p0 - dx / paso());
      pinta();
    });
    const suelta = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      if (!horizontal) return;
      const dx = e.clientX - x0;
      ir(destinoGesto(dx, paso(), p0), Math.abs(dx / paso()) < 2 ? D.mover : 0.6);
    };
    vit.addEventListener('pointerup', suelta);
    vit.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { id = null; ir(Math.round(st.pos), D.mover); } });
    vit.addEventListener('click', (e) => {
      if (movido) { movido = false; return; }
      const p = e.target.closest('.pieza');
      if (!p) return;
      const i = +p.dataset.i;
      if (i === Math.round(st.pos)) abrirFicha(destacados[i], p.querySelector('img'));
      else ir(i);
    });
    vit.addEventListener('dragstart', (e) => e.preventDefault());
  }
  if (matchMedia('(pointer:fine)').matches && !reducir) {
    vit.addEventListener('pointermove', (e) => {
      const c = piezas[Math.round(st.pos)]?.firstChild;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { c.style.transform = 'translateY(-50%)'; return; }
      c.style.transform = `translateY(-50%) translateZ(30px) rotateY(${(dx * 10).toFixed(2)}deg) rotateX(${(-dy * 8).toFixed(2)}deg)`;
    });
    vit.addEventListener('pointerleave', () => piezas.forEach((p) => { p.firstChild.style.transform = ''; }));
  }
}

// Catálogo.
const cat = { q: '', genero: new Set(), editorial: new Set(), orden: 'portada', vista: 'rejilla', mostrados: 0 };
const rejilla = $('#rejilla');
const resultados = $('#resultados');
const items = $$('#rejilla > li').map((li) => {
  const a = li.querySelector('h3 a');
  const meta = li.querySelector('.meta');
  li.hidden = false;
  return {
    li, b: porId[li.dataset.id], a, meta,
    t0: a.textContent, m0: meta.textContent,
    g: (li.dataset.genero || '').split(' ').filter(Boolean),
    p: li.dataset.editorial,
    i: Number(li.dataset.i),
  };
});
const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tokens = (q) => norm(q).split(/\s+/).filter(Boolean);
function resalta(texto, toks) {
  if (!toks.length) return esc(texto);
  let n = ''; const mapa = [];
  for (let i = 0; i < texto.length; i++) for (const ch of norm(texto[i])) { n += ch; mapa.push(i); }
  mapa.push(texto.length);
  const marcas = [];
  for (const t of toks) { let k = n.indexOf(t); while (k >= 0) { marcas.push([mapa[k], mapa[k + t.length]]); k = n.indexOf(t, k + t.length); } }
  if (!marcas.length) return esc(texto);
  marcas.sort((x, y) => x[0] - y[0]);
  let out = ''; let c = 0;
  for (const [a, b] of marcas) { if (a < c) continue; out += `${esc(texto.slice(c, a))}<mark>${esc(texto.slice(a, b))}</mark>`; c = b; }
  return out + esc(texto.slice(c));
}
const ORDEN = {
  portada: (x, y) => x.i - y.i,
  titulo: (x, y) => norm(x.b.t).localeCompare(norm(y.b.t), 'es'),
  autor: (x, y) => norm(x.b.a).localeCompare(norm(y.b.a), 'es'),
  'precio-asc': (x, y) => (x.b.pr ?? 1e9) - (y.b.pr ?? 1e9) || x.i - y.i,
  'precio-desc': (x, y) => (y.b.pr ?? -1) - (x.b.pr ?? -1) || x.i - y.i,
};
const tamPagina = () => (innerWidth >= 1024 ? 20 : innerWidth >= 768 ? 12 : 10);
const hayFiltros = () => cat.genero.size > 0 || cat.editorial.size > 0;
function pasa(it) {
  if (cat.genero.size && !it.g.some((g) => cat.genero.has(g))) return false;
  if (cat.editorial.size && !cat.editorial.has(it.p)) return false;
  const toks = tokens(cat.q);
  if (toks.length) {
    const h = norm(`${it.b.t} ${it.b.a} ${it.b.p || ''}`);
    if (!toks.every((t) => h.includes(t))) return false;
  }
  return true;
}
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const nombrePill = (campo, v) => $(`.pildora[data-campo="${campo}"][data-v="${CSS.escape(v)}"] span`)?.textContent || v;
function escribeUrl() {
  const u = new URL(location.href);
  const p = u.searchParams;
  const libro = p.get('libro');
  ['q', 'genero', 'editorial', 'orden', 'vista', 'pagina'].forEach((k) => p.delete(k));
  if (cat.q) p.set('q', cat.q);
  if (cat.genero.size) p.set('genero', [...cat.genero].sort().join(','));
  if (cat.editorial.size) p.set('editorial', [...cat.editorial].sort().join(','));
  if (cat.orden !== 'portada') p.set('orden', cat.orden);
  if (cat.vista !== 'rejilla') p.set('vista', cat.vista);
  if (libro) p.set('libro', libro);
  history.replaceState(history.state, '', u.pathname + (p.toString() ? `?${p}` : '') + u.hash);
}
function leeUrl() {
  const p = new URLSearchParams(location.search);
  cat.q = p.get('q') || '';
  cat.genero = new Set((p.get('genero') || '').split(',').filter(Boolean));
  cat.editorial = new Set((p.get('editorial') || '').split(',').filter(Boolean));
  cat.orden = ORDEN[p.get('orden')] ? p.get('orden') : 'portada';
  cat.vista = p.get('vista') === 'lista' ? 'lista' : 'rejilla';
  const pag = Number(p.get('pagina') || 0);
  if (pag > 1) cat.mostrados = pag * tamPagina();
}
// Lo que ya está pintado: reordenar o resaltar las 41 tarjetas solo cuando cambian el orden o la búsqueda
// (rehacerlas en cada clic forzaba una maquetación completa de la rejilla).
let ordenPintado = 'portada';
let busquedaPintada = '';
function pintaCat(opciones = {}) {
  const toks = tokens(cat.q);
  const orden = [...items].sort(ORDEN[cat.orden]);
  if (cat.orden !== ordenPintado) {
    orden.forEach((it) => rejilla.appendChild(it.li));
    ordenPintado = cat.orden;
  }
  const coinciden = orden.filter(pasa);
  if (!cat.mostrados) cat.mostrados = tamPagina();
  const visibles = new Set(coinciden.slice(0, cat.mostrados));
  const resaltar = toks.join(' ') !== busquedaPintada;
  busquedaPintada = toks.join(' ');
  items.forEach((it) => {
    const fuera = !visibles.has(it);
    if (it.li.classList.contains('fuera') !== fuera) it.li.classList.toggle('fuera', fuera);
    if (it.li.hidden) it.li.hidden = false;
    if (resaltar) {
      it.a.innerHTML = resalta(it.t0, toks);
      it.meta.innerHTML = resalta(it.m0, toks);
    }
  });
  const n = coinciden.length;
  const mostrados = Math.min(n, cat.mostrados);
  $('#conteo').textContent = n ? plural(n, 'libro', 'libros') : 'Sin resultados';
  const restantes = n - mostrados;
  $('#mas').hidden = restantes <= 0;
  $('#mas-boton').textContent = `Mostrar más (${restantes} ${restantes === 1 ? 'restante' : 'restantes'})`;
  $('#mas-estado').textContent = n ? `Mostrando ${mostrados} de ${n} libros` : '';
  const vacio = $('#vacio');
  vacio.hidden = n > 0;
  const q = cat.q.trim();
  $('#vacio-t').textContent = q && hayFiltros() ? `No encontramos libros para «${q}» con estos filtros` : q ? `No encontramos libros para «${q}»` : 'Ningún libro cumple con estos filtros';
  $('#vacio-borrar').hidden = !q;
  $('#vacio-quitar').hidden = !hayFiltros();
  $('#q-borrar').hidden = !cat.q;
  const chips = [...[...cat.genero].map((v) => ['genero', v]), ...[...cat.editorial].map((v) => ['editorial', v])];
  const ap = $('#aplicados');
  ap.hidden = !chips.length;
  ap.innerHTML = chips.map(([campo, v]) => `<li><button type="button" data-campo="${campo}" data-v="${esc(v)}" aria-label="Quitar filtro ${esc(nombrePill(campo, v))}">${esc(nombrePill(campo, v))}<svg aria-hidden="true"><use href="#i-cerrar"/></svg></button></li>`).join('') + (chips.length ? '<li><button type="button" class="quitar-todo">Quitar filtros</button></li>' : '');
  const activos = chips.length;
  $('#limpiar').hidden = !activos;
  $('#hf-limpiar').hidden = !activos;
  const ins = $('#n-activos');
  ins.hidden = !activos;
  ins.textContent = activos;
  ins.setAttribute('aria-label', activos === 1 ? '1 activo' : `${activos} activos`);
  $('#hf-ver').textContent = n ? `Ver ${plural(n, 'libro', 'libros')}` : 'Ver resultados';
  $$('.pildora').forEach((pl) => pl.setAttribute('aria-pressed', (pl.dataset.campo === 'genero' ? cat.genero : cat.editorial).has(pl.dataset.v)));
  rejilla.classList.toggle('lista', cat.vista === 'lista');
  $('#vista-rejilla').setAttribute('aria-pressed', cat.vista === 'rejilla');
  $('#vista-lista').setAttribute('aria-pressed', cat.vista === 'lista');
  $('#orden').value = cat.orden;
  if (!opciones.sinUrl) escribeUrl();
}
let animando = null;
function aplicar(cambio, opciones = {}) {
  animando?.progress(1);
  const top0 = resultados.getBoundingClientRect().top;
  const h0 = rejilla.offsetHeight;
  const anima = opciones.animar !== false && !preferenciaMovimiento.matches;
  // Flip solo sobre lo que se ve (antes ≤ 20 tarjetas, no las 41) y sin `absolute`: cada tarjeta se desplaza con
  // transform desde donde estaba. Con `absolute` Flip sacaba las 41 del flujo y forzaba cientos de maquetaciones por clic.
  // Cambiar de vista (rejilla ↔ lista) mueve todo: ahí basta un fundido.
  const vistas = () => items.filter((it) => !it.li.classList.contains('fuera')).map((it) => it.li);
  const estado = anima && !opciones.vista ? Flip.getState(vistas()) : null;
  if (opciones.reinicia !== false) cat.mostrados = tamPagina();
  if (cambio) cambio();
  pintaCat();
  const fija = () => {
    const t = resultados.getBoundingClientRect().top;
    if (top0 >= 0) { if (Math.abs(t - top0) > 0.5) scrollYa(scrollY + t - top0); return; }
    if (t < 84) scrollYa(scrollY + t - 96);
  };
  fija();
  if (!anima) return;
  if (opciones.vista) {
    animando = gsap.fromTo(rejilla, { opacity: .35 }, { opacity: 1, duration: D.rapida, ease: E_OUT, clearProps: 'opacity', onComplete: () => { animando = null; } });
    return;
  }
  resultados.classList.add('recortando');
  rejilla.style.minHeight = `${h0}px`;
  animando = Flip.from(estado, {
    targets: vistas(), duration: D.media, ease: E_OUT,
    onEnter: (x) => gsap.fromTo(x, { opacity: 0 }, { opacity: 1, duration: D.rapida, ease: E_OUT }),
    onComplete: () => { rejilla.style.minHeight = ''; resultados.classList.remove('recortando'); animando = null; fija(); },
  });
}
leeUrl();
// En Pages el inicio es un archivo estático: la rejilla llega en el orden de portada y aquí se aplica el de la URL
// (si el HTML ya viene ordenado por el servidor, reacomodarlo en el mismo orden no cambia nada).
pintaCat({ sinUrl: true });
$('#q').value = cat.q;
$$('.pildora').forEach((pl) => pl.addEventListener('click', (ev) => {
  ev.preventDefault();
  aplicar(() => {
    const s = pl.dataset.campo === 'genero' ? cat.genero : cat.editorial;
    if (s.has(pl.dataset.v)) s.delete(pl.dataset.v); else s.add(pl.dataset.v);
  });
}));
$('#aplicados').addEventListener('click', (e) => {
  const b = e.target.closest('button, a');
  if (!b || !$('#aplicados').contains(b)) return;
  e.preventDefault();
  const botones = [...$('#aplicados').querySelectorAll('button, a')];
  const i = botones.indexOf(b);
  if (b.classList.contains('quitar-todo')) aplicar(() => { cat.genero.clear(); cat.editorial.clear(); });
  else aplicar(() => (b.dataset.campo === 'genero' ? cat.genero : cat.editorial).delete(b.dataset.v));
  const restos = $('#aplicados').querySelectorAll('button, a');
  (restos[Math.min(i, restos.length - 2)] || $('#q')).focus({ preventScroll: true });
});
const limpiar = (ev) => { ev.preventDefault(); aplicar(() => { cat.genero.clear(); cat.editorial.clear(); }); };
$('#limpiar').addEventListener('click', (ev) => { limpiar(ev); $('#t-filtros').focus(); });
$('#hf-limpiar').addEventListener('click', (ev) => { limpiar(ev); $('#hf-t').focus(); });
$('#vacio-quitar').addEventListener('click', (ev) => { limpiar(ev); $('#q').focus(); });
$('#vacio-borrar').addEventListener('click', (ev) => { ev.preventDefault(); $('#q').value = ''; aplicar(() => { cat.q = ''; }); $('#q').focus(); });
let tq;
$('#q').addEventListener('input', (e) => { clearTimeout(tq); tq = setTimeout(() => aplicar(() => { cat.q = e.target.value.trim(); }, { animar: false }), 160); });
$('#busqueda').addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(tq); aplicar(() => { cat.q = $('#q').value.trim(); }, { animar: false }); });
$('#q-borrar').addEventListener('click', (ev) => { ev.preventDefault(); $('#q').value = ''; aplicar(() => { cat.q = ''; }); $('#q').focus(); });
addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
  e.preventDefault();
  $('#q').focus();
});
$('#orden').addEventListener('change', (e) => aplicar(() => { cat.orden = e.target.value; }, { reinicia: false }));
$('#vista-rejilla').addEventListener('click', (ev) => { if (cat.vista === 'rejilla') return; ev.preventDefault(); aplicar(() => { cat.vista = 'rejilla'; }, { reinicia: false, vista: true }); });
$('#vista-lista').addEventListener('click', (ev) => { if (cat.vista === 'lista') return; ev.preventDefault(); aplicar(() => { cat.vista = 'lista'; }, { reinicia: false, vista: true }); });
$('#mas-boton').onclick = () => {
  animando?.progress(1);
  const antes = new Set(rejilla.querySelectorAll('li:not(.fuera)'));
  cat.mostrados += tamPagina();
  pintaCat();
  const nuevo = [...rejilla.children].find((li) => !li.classList.contains('fuera') && !antes.has(li));
  nuevo?.querySelector('h3 a').focus();
};
addEventListener('resize', () => { const t = tamPagina(); if (cat.mostrados < t) { cat.mostrados = t; pintaCat({ sinUrl: true }); } });
items.forEach((it) => {
  it.a.addEventListener('click', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return;
    ev.preventDefault();
    abrirFicha(it.b, it.li.querySelector('.portada-libro img, .portada-libro .sin-portada'), it.a);
  });
});

const hf = $('#hoja-filtros');
const panelCuerpo = $('#panel-cuerpo');
$('#abrir-filtros').onclick = () => {
  $('#hf-cuerpo').appendChild(panelCuerpo);
  hf.showModal();
  $('#hf-t').focus();
  if (!reducir) gsap.fromTo(hf.querySelector('.lamina'), { yPercent: 100 }, { yPercent: 0, duration: D.mover, ease: E_OUT });
};
const cierraHf = () => {
  const fin = () => hf.close();
  if (!reducir) gsap.to(hf.querySelector('.lamina'), { yPercent: 100, duration: D.rapida, ease: 'power3.in', onComplete: fin });
  else fin();
};
hf.addEventListener('close', () => { $('#panel').appendChild(panelCuerpo); $('#abrir-filtros').focus({ preventScroll: true }); });
hf.addEventListener('cancel', (e) => { e.preventDefault(); cierraHf(); });
hf.addEventListener('click', (e) => { if (e.target === hf) cierraHf(); });
$('#hf-cerrar').onclick = cierraHf;
$('#hf-ver').onclick = cierraHf;

// Ficha.
const hoja = $('#hoja');
const velo = $('#velo');
const sinPortada = (b) => `<div class="sin-portada" aria-hidden="true"><span>${esc(b.p || '')}</span><svg><use href="#camioneta"/></svg></div>`;
const alBorde = () => innerWidth <= 900 ? { xPercent: 0, yPercent: 100 } : { xPercent: 100, yPercent: 0 };
const enPantalla = { xPercent: 0, yPercent: 0 };
const fondoFicha = [$('.saltar'), $('.cab'), $('#contenido'), $('#contacto')];
function bloquearFondoFicha(abierta) {
  fondoFicha.forEach((el) => { el.inert = abierta; });
  document.body.style.overflow = abierta ? 'hidden' : '';
}
let foco = null;
let movimientoFicha;
let clonFicha;
function quitarClonFicha() {
  if (!clonFicha) return;
  clonFicha.remove();
  clonFicha = null;
  hoja.querySelector('.portada-hoja').style.opacity = '';
}
preferenciaMovimiento.addEventListener('change', (e) => {
  if (!e.matches) return;
  animando?.progress(1);
  movimientoFicha?.progress(1);
});
function abrirFicha(b, fuente, disparador = document.activeElement) {
  movimientoFicha?.kill();
  quitarClonFicha();
  const origen = fuente?.getBoundingClientRect();
  if (!hoja.contains(disparador)) foco = disparador !== document.body ? disparador : $('#t-libros');
  const u = new URL(location.href);
  u.searchParams.set('libro', b.id);
  history.replaceState(history.state, '', u);
  const attrs = [['Autor', b.a], ['Editorial', b.p], ['Género', b.gn], ['ISBN', b.isbn]].filter(([, v]) => v);
  const msg = `Hola, ¿tienen disponible «${b.t}» de ${b.a}${b.pr != null ? ` (${precio(b.pr)})` : ''}?`;
  const baseWa = ($('a[href^="https://wa.me/"]')?.href || 'https://wa.me/').split('?')[0];
  $('#hoja-cuerpo').innerHTML = `
    <div class="portada-hoja">${b.c ? `<img src="${esc(b.c)}" alt="Portada de ${esc(b.t)}">` : sinPortada(b)}</div>
    <h2 id="hoja-t">${esc(b.t)}</h2>
    ${b.pr != null ? `<p class="precio">${precio(b.pr)}</p>` : ''}
    <dl class="atributos">${attrs.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${b.s ? `<p class="sinopsis">${esc(b.s)}</p>` : ''}
    <a class="boton boton--tinta" href="${baseWa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Consultar disponibilidad por WhatsApp <svg aria-hidden="true"><use href="#i-sale"/></svg></a>`;
  marcaPortadas(hoja);
  hoja.hidden = false;
  hoja.style.visibility = 'visible';
  hoja.dataset.id = b.id;
  velo.classList.add('abierto');
  bloquearFondoFicha(true);
  hoja.scrollTop = 0;
  gsap.set(hoja, enPantalla);
  if (!preferenciaMovimiento.matches) {
    const destino = hoja.querySelector('.portada-hoja');
    const fin = destino.getBoundingClientRect();
    movimientoFicha = gsap.timeline({ onComplete: quitarClonFicha });
    movimientoFicha.fromTo(hoja, alBorde(), { ...enPantalla, duration: D.media, ease: E_OUT }, 0);
    if (origen?.width && origen.height && fin.width && fin.height) {
      destino.style.opacity = '0';
      clonFicha = document.createElement('div');
      clonFicha.className = 'clon';
      clonFicha.setAttribute('aria-hidden', 'true');
      clonFicha.innerHTML = destino.innerHTML;
      Object.assign(clonFicha.style, { left: `${fin.left}px`, top: `${fin.top}px`, width: `${fin.width}px`, height: `${fin.height}px` });
      document.body.appendChild(clonFicha);
      movimientoFicha.fromTo(clonFicha, {
        x: origen.left - fin.left, y: origen.top - fin.top,
        scaleX: origen.width / fin.width, scaleY: origen.height / fin.height,
      }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: D.media, ease: E_OUT }, 0);
    }
  }
  $('#hoja-cerrar').focus({ preventScroll: true });
}
function cerrarFicha() {
  if (!velo.classList.contains('abierto')) return;
  movimientoFicha?.kill();
  quitarClonFicha();
  const u = new URL(location.href);
  u.searchParams.delete('libro');
  history.replaceState(history.state, '', u);
  const fin = () => {
    hoja.style.visibility = 'hidden';
    hoja.hidden = true;
    bloquearFondoFicha(false);
    (foco?.isConnected ? foco : $('#t-libros')).focus({ preventScroll: true });
    foco = null;
  };
  velo.classList.remove('abierto');
  if (preferenciaMovimiento.matches) { fin(); return; }
  movimientoFicha = gsap.to(hoja, { ...alBorde(), duration: D.rapida, ease: 'power3.in', onComplete: fin });
}
$('#hoja-cerrar').addEventListener('click', (ev) => { ev.preventDefault(); cerrarFicha(); });
velo.addEventListener('click', cerrarFicha);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && velo.classList.contains('abierto')) cerrarFicha(); });

// La memoria de gustos vive en la página durante esta visita.
const recomendaciones = $('#recomendaciones');
if (recomendaciones) {
  const formulario = $('#gusto-lector');
  const lista = $('#libros-recomendados');
  const estado = $('#estado-recomendaciones');
  const reiniciar = formulario.querySelector('[type=reset]');
  const valoraciones = new Map();
  let gustos = null;
  const razones = {
    gusto: 'Marcaste este título como de tu gusto.',
    genero: 'Coincide con un género que elegiste.',
    afinidad: 'Comparte género, autor o editorial con algo que te gustó.',
    explorar: 'Un género distinto de los que elegiste.',
    catalogo: 'Una opción del catálogo para explorar.',
  };
  const pintar = (mensaje = '') => {
    const nuevos = recomendarLibros(libros, gustos.generos, gustos.explorar, valoraciones);
    lista.innerHTML = nuevos.map(({libro, razon}) => {
      const id = esc(libro.id);
      const titulo = esc(libro.t);
      return [
        '<li data-libro="' + id + '">',
        '<h3><a data-ficha href="?libro=' + encodeURIComponent(libro.id) + '#recomendaciones">' + titulo + '</a></h3>',
        libro.a ? '<p>' + esc(libro.a) + '</p>' : '',
        '<p class="razon">' + razones[razon] + '</p>',
        '<div class="gusto-acciones">',
        '<button class="boton boton--borde" type="button" data-gusto="si" aria-label="Me interesa: ' + titulo + '" aria-pressed="' + (valoraciones.get(libro.id) === 'si') + '">Me interesa</button>',
        '<button class="boton boton--borde" type="button" data-gusto="no" aria-label="Otra opción en lugar de: ' + titulo + '">Otra opción</button>',
        '</div></li>',
      ].join('');
    }).join('');
    if (nuevos.length) {
      estado.textContent = mensaje + nuevos.length + (nuevos.length === 1 ? ' sugerencia.' : ' sugerencias.');
    } else {
      const aviso = gustos.generos.size && !gustos.explorar
        ? 'No quedan sugerencias en los géneros que elegiste.'
        : 'No quedan sugerencias para esta selección.';
      estado.innerHTML = aviso + ' Puedes empezar de nuevo o <a href="#libros">ver el catálogo</a>.';
    }
  };
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    gustos = {generos: new Set(datos.getAll('gusto')), explorar: datos.has('explorar')};
    reiniciar.hidden = false;
    pintar();
  });
  formulario.addEventListener('reset', () => {
    gustos = null;
    valoraciones.clear();
    lista.replaceChildren();
    estado.textContent = 'Preferencias borradas.';
    formulario.querySelector('[type=submit]').focus();
    reiniciar.hidden = true;
  });
  lista.addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('[data-libro]');
    if (!tarjeta) return;
    const libro = porId[tarjeta.dataset.libro];
    const ficha = evento.target.closest('[data-ficha]');
    if (ficha && !evento.ctrlKey && !evento.metaKey && !evento.shiftKey && !evento.altKey) {
      evento.preventDefault();
      abrirFicha(libro, null);
    }
    const accion = evento.target.closest('button[data-gusto]');
    if (!accion) return;
    const activo = valoraciones.get(libro.id) === 'si';
    if (accion.dataset.gusto === 'si' && activo) valoraciones.delete(libro.id);
    else valoraciones.set(libro.id, accion.dataset.gusto);
    pintar(accion.dataset.gusto === 'no' ? 'Se actualizó la selección. ' : 'Preferencias actualizadas. ');
    const reemplazo = [...lista.children].find((li) => li.dataset.libro === libro.id);
    (reemplazo?.querySelector('[data-gusto="si"]') ?? estado).focus({preventScroll: true});
  });
  recomendaciones.hidden = false;
  const abrirPorAncla = () => {
    if (location.hash === '#recomendaciones') recomendaciones.open = true;
  };
  addEventListener('hashchange', abrirPorAncla);
  abrirPorAncla();
}

// Reels de la carta: cada video corre sin sonido solo mientras su tarjeta está a la vista y no se pidió reducir movimiento.
const reelsCarta = $$('.carta-producto-video');
if (reelsCarta.length) {
  const visor = new IntersectionObserver((entradas) => {
    for (const { target, isIntersecting } of entradas) {
      if (isIntersecting && !preferenciaMovimiento.matches) target.play().catch(() => {});
      else target.pause();
    }
  }, { threshold: .6 });
  reelsCarta.forEach((video) => visor.observe(video));
}

// Carta: los enlaces conservan su destino y el historial de la selección.
const cartaNav = $('#carta-categorias');
if (cartaNav) {
  const enlaces = [...cartaNav.querySelectorAll('a')];
  const paneles = $$('.carta-detalles .carta-panel');
  const completa = cartaNav.querySelector('a[href="#carta-completa"]');
  const estado = $('#carta-estado');

  const mostrarCarta = (anunciar = false) => {
    const activa = enlaces.find((enlace) => enlace.hash === location.hash) ?? enlaces[0];
    if (!activa) return;
    for (const panel of paneles) panel.hidden = activa !== completa && '#' + panel.id !== activa.hash;
    for (const enlace of enlaces) {
      if (enlace === activa) enlace.setAttribute('aria-current', 'true');
      else enlace.removeAttribute('aria-current');
    }
    if (anunciar) estado.textContent = activa === completa ? 'Se muestra toda la carta.' : 'Carta de ' + activa.textContent.trim() + '.';
  };

  const seleccionarCarta = (evento) => {
    const enlace = evento.target.closest('a');
    if (!enlace || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    if (location.hash !== enlace.hash) history.pushState(history.state, '', enlace.hash);
    mostrarCarta(true);
  };

  cartaNav.addEventListener('click', seleccionarCarta);
  addEventListener('hashchange', () => mostrarCarta(true));
  mostrarCarta();
}

// Cabecera: acompaña el cambio de sección con una sola línea activa.
const cab = $('.cab');
const navegacion = cab.querySelector('nav');
const secciones = $$('main > [data-suelo]');
const destinos = [...navegacion.querySelectorAll('a')];
let seccionActual = null;
let enlaceActual;
let cuadro = 0;

function alinearIndicador() {
  if (!enlaceActual) return;
  const inset = parseFloat(getComputedStyle(enlaceActual).paddingLeft);
  navegacion.style.setProperty('--nav-x', (enlaceActual.offsetLeft + inset) + 'px');
  // El subrayado mide 100 px y se escala: animar `width` maquetaba la barra en cada fotograma.
  navegacion.style.setProperty('--nav-escala', String((enlaceActual.offsetWidth - 2 * inset) / 100));
}

function suelo() {
  cuadro = 0;
  const y = cab.offsetHeight + 12;
  const actual = secciones.find((seccion) => {
    const rect = seccion.getBoundingClientRect();
    return rect.top <= y && rect.bottom > y;
  });
  if (actual === seccionActual) return;
  seccionActual = actual;
  const id = actual?.id;
  cab.toggleAttribute('data-portada', id === 'inicio');
  const enLibros = id === 'libros' || id === 'destacados';
  enlaceActual?.removeAttribute('aria-current');
  enlaceActual = destinos.find((a) => a.hash.slice(1) === id || (enLibros && (a.hash === '#destacados' || a.hash === '#libros')));
  enlaceActual?.setAttribute('aria-current', 'true');
  alinearIndicador();
  navegacion.toggleAttribute('data-indicador', Boolean(enlaceActual));
}
addEventListener('hashchange', suelo);
addEventListener('scroll', () => { if (!cuadro) cuadro = requestAnimationFrame(suelo); }, { passive: true });
// El ResizeObserver también corre al empezar, ya con la maquetación hecha: no hace falta medir antes de pintar.
new ResizeObserver(() => { suelo(); alinearIndicador(); }).observe(navegacion);

const idLibro = new URLSearchParams(location.search).get('libro');
if (idLibro && porId[idLibro] && hoja.dataset.id !== idLibro) abrirFicha(porId[idLibro], null);
else if (idLibro && hoja.classList.contains('abierta')) {
  bloquearFondoFicha(true);
  $('#hoja-cerrar').focus({ preventScroll: true });
}

// Presión visible en iPhone y deslizar para cerrar la ficha y Filtros (spec de movimiento y tacto, 2026-11-27).
iniciarMovimiento();
