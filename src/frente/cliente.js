// Mejora de /nuevo. El HTML ya trae el contenido: esto anima, hojea la vitrina y hace instantáneos los filtros.
// GSAP entra por el bundle (npm). Nada de CDN. prefers-reduced-motion suaviza; no apaga los estados.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { anchoPieza, poseVitrina, transformVitrina, destinoGesto } from './vitrina.js';

gsap.registerPlugin(Flip);

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const E_OUT = 'expo.out';
const libros = JSON.parse($('#datos-libros').textContent);
const porId = Object.fromEntries(libros.map((b) => [b.id, b]));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const precio = (n) => (n == null ? '' : `$${n} MXN`);
const scrollYa = (y) => window.scrollTo({ top: y, behavior: 'instant' });

// Fechas (hora de Monterrey): el mismo criterio que el servidor, por si el HTML sigue en caché el día 28.
const hoyISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
$$('fecha-hasta').forEach((e) => { if (hoyISO > e.getAttribute('d')) e.remove(); });
$$('fecha-desde').forEach((e) => { if (hoyISO < e.getAttribute('d')) e.remove(); else e.hidden = false; });
$$('.parada[data-fecha]').forEach((p) => { if (p.dataset.fecha && p.dataset.fecha < hoyISO) p.remove(); });
if (!$$('.parada').some((p) => p.dataset.fecha)) {
  const destino = $('#destacados') ? '#destacados' : '#libros';
  $$('a.cta-portada').forEach((a) => {
    if (a.closest('[hidden]')) return;
    a.setAttribute('href', destino);
    if (a.firstChild && a.firstChild.nodeType === 3) a.firstChild.textContent = 'Ver libros ';
  });
}

// Portada: la camioneta llega una sola vez y termina centrada. El título y el llamado no se animan.
if (!reducir) {
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from('.camion', { xPercent: -38, duration: 1.1, ease: E_OUT })
    .from('.camion .trazo', { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'power3.out' }, 0)
    .from('#carga img', { y: -70, opacity: 0, rotation: (i, el) => +el.dataset.r - 14, duration: 0.7, ease: E_OUT, stagger: 0.08 }, 0.55);
}

// Eventos: flechas solo cuando la ruta desborda.
const ruta = $('#ruta');
const rutaCtl = $('#ruta-controles');
if (ruta && rutaCtl) {
  const revisaRuta = () => {
    rutaCtl.hidden = !(ruta.scrollWidth > ruta.clientWidth + 48);
    $('#ruta-ant').disabled = ruta.scrollLeft < 4;
    $('#ruta-sig').disabled = ruta.scrollLeft + ruta.clientWidth > ruta.scrollWidth - 4;
  };
  ruta.addEventListener('scroll', revisaRuta, { passive: true });
  addEventListener('resize', revisaRuta);
  revisaRuta();
  const pasoRuta = (dir) => {
    const p = ruta.querySelector('.parada');
    if (p) ruta.scrollBy({ left: dir * p.offsetWidth, behavior: reducir ? 'auto' : 'smooth' });
  };
  $('#ruta-ant').onclick = () => pasoRuta(-1);
  $('#ruta-sig').onclick = () => pasoRuta(1);
}

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
    $('#v-ant').disabled = i === 0;
    $('#v-sig').disabled = i === destacados.length - 1;
  }
  function fichaVitrina(i) {
    const b = destacados[i];
    const f = $('#ficha-vitrina');
    f.innerHTML = `<h3>${esc(b.t)}</h3><p>${esc(b.a)}${b.p ? ` · ${esc(b.p)}` : ''}${b.pr != null ? ` · <span class="precio">${precio(b.pr)}</span>` : ''}</p>`;
    controles(i);
    gsap.fromTo(f, { opacity: 0, y: reducir ? 0 : 8, filter: reducir ? 'none' : 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: reducir ? 0.15 : 0.38, ease: E_OUT });
  }
  function pinta() {
    vit.style.perspective = `${W * 4}px`;
    piezas.forEach((p, i) => {
      const d = i - st.pos;
      const k = poseVitrina(d, { w: W, flat: reducir, movil: innerWidth < 700 });
      p.style.transform = transformVitrina(k);
      p.style.opacity = k.op;
      p.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      p.style.visibility = k.op <= 0 ? 'hidden' : 'visible';
      p.firstChild.style.filter = `brightness(${(1 - Math.min(k.dim, 1) * 0.38).toFixed(3)})`;
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
  function medir() { W = anchoPieza(innerWidth); piezas.forEach((p) => p.style.setProperty('--w', `${W}px`)); pinta(); }
  addEventListener('resize', medir);
  medir();
  $('#v-ant').onclick = () => ir(Math.round(st.pos) - 1);
  $('#v-sig').onclick = () => ir(Math.round(st.pos) + 1);
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
      ir(destinoGesto(dx, paso(), p0), Math.abs(dx) < 24 ? 0.4 : Math.abs(dx / paso()) < 2 ? 0.5 : 0.6);
    };
    vit.addEventListener('pointerup', suelta);
    vit.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { id = null; ir(Math.round(st.pos), 0.4); } });
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
function pintaCat(opciones = {}) {
  const toks = tokens(cat.q);
  const orden = [...items].sort(ORDEN[cat.orden]);
  orden.forEach((it) => rejilla.appendChild(it.li));
  const coinciden = orden.filter(pasa);
  if (!cat.mostrados) cat.mostrados = tamPagina();
  const visibles = new Set(coinciden.slice(0, cat.mostrados));
  items.forEach((it) => {
    it.li.classList.toggle('fuera', !visibles.has(it));
    it.li.hidden = false;
    it.a.innerHTML = resalta(it.t0, toks);
    it.meta.innerHTML = resalta(it.m0, toks);
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
  const top0 = resultados.getBoundingClientRect().top;
  const h0 = rejilla.offsetHeight;
  const anima = !reducir;
  const lis = items.map((it) => it.li);
  const estado = anima ? Flip.getState(lis) : null;
  if (animando) { animando.progress(1); animando = null; }
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
  resultados.classList.add('recortando');
  rejilla.style.minHeight = `${h0}px`;
  animando = Flip.from(estado, {
    targets: lis, duration: 0.5, ease: E_OUT, absolute: true, scale: !!opciones.vista, stagger: { amount: 0.1 },
    onEnter: (x) => gsap.fromTo(x, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: E_OUT }),
    onLeave: (x) => gsap.to(x, { opacity: 0, scale: 0.94, duration: 0.2 }),
    onComplete: () => { rejilla.style.minHeight = ''; resultados.classList.remove('recortando'); animando = null; fija(); },
  });
}
leeUrl();
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
$('#q').addEventListener('input', (e) => { clearTimeout(tq); tq = setTimeout(() => aplicar(() => { cat.q = e.target.value.trim(); }), 160); });
$('#busqueda').addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(tq); aplicar(() => { cat.q = $('#q').value.trim(); }); });
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
  const antes = items.filter((it) => !it.li.classList.contains('fuera')).map((it) => it.li);
  cat.mostrados += tamPagina();
  pintaCat();
  const nuevos = [...rejilla.children].filter((li) => !li.classList.contains('fuera') && !antes.includes(li));
  if (nuevos[0]) nuevos[0].querySelector('h3 a').focus({ preventScroll: true });
  if (!reducir) gsap.from(nuevos, { y: 20, opacity: 0, duration: 0.6, ease: E_OUT, stagger: { amount: 0.25 }, clearProps: 'transform,opacity' });
};
addEventListener('resize', () => { const t = tamPagina(); if (cat.mostrados < t) { cat.mostrados = t; pintaCat({ sinUrl: true }); } });
items.forEach((it) => {
  it.a.addEventListener('click', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
    ev.preventDefault();
    abrirFicha(it.b, it.li.querySelector('.portada-libro img, .portada-libro .sin-portada'));
  });
  if (matchMedia('(pointer:fine)').matches && !reducir) {
    const pl = it.li.querySelector('.portada-libro');
    const art = it.li.firstElementChild;
    art.addEventListener('pointermove', (e) => {
      if (cat.vista === 'lista') return;
      const r = art.getBoundingClientRect();
      pl.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
      pl.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
    });
    art.addEventListener('pointerleave', () => { pl.style.setProperty('--ry', '0deg'); pl.style.setProperty('--rx', '0deg'); });
  }
});

const hf = $('#hoja-filtros');
const panelCuerpo = $('#panel-cuerpo');
$('#abrir-filtros').onclick = () => {
  $('#hf-cuerpo').appendChild(panelCuerpo);
  hf.showModal();
  $('#hf-t').focus();
  if (!reducir) gsap.fromTo(hf.querySelector('.lamina'), { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: E_OUT });
};
const cierraHf = () => {
  const fin = () => hf.close();
  if (!reducir) gsap.to(hf.querySelector('.lamina'), { yPercent: 100, duration: 0.25, ease: 'power3.in', onComplete: fin });
  else fin();
};
hf.addEventListener('close', () => { $('#panel').appendChild(panelCuerpo); $('#abrir-filtros').focus({ preventScroll: true }); });
hf.addEventListener('cancel', (e) => { e.preventDefault(); cierraHf(); });
hf.addEventListener('click', (e) => { if (e.target === hf) cierraHf(); });
$('#hf-cerrar').onclick = cierraHf;
$('#hf-ver').onclick = cierraHf;

if (!reducir && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    gsap.from(items.filter((it) => !it.li.classList.contains('fuera')).slice(0, 8).map((it) => it.li), { y: 24, opacity: 0, duration: 0.7, ease: E_OUT, stagger: { amount: 0.3 }, clearProps: 'transform,opacity' });
  }, { threshold: 0.05 });
  io.observe(rejilla);
}

// Ficha.
const hoja = $('#hoja');
const velo = $('#velo');
const sinPortada = (b) => `<div class="sin-portada" aria-hidden="true"><span>${esc(b.p || '')}</span><svg><use href="#camioneta"/></svg></div>`;
const esconde = () => gsap.set(hoja, innerWidth <= 900 ? { xPercent: 0, yPercent: 100 } : { yPercent: 0, xPercent: 100 });
if (!hoja.classList.contains('abierta')) esconde();
let foco = null;
function abrirFicha(b, fuente) {
  foco = document.activeElement;
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
  hoja.hidden = false;
  hoja.style.visibility = 'visible';
  hoja.dataset.id = b.id;
  velo.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  const movil = innerWidth <= 900;
  const destino = hoja.querySelector('.portada-hoja');
  if (reducir) { gsap.set(hoja, { xPercent: 0, yPercent: 0 }); gsap.from(hoja, { opacity: 0, duration: 0.15 }); $('#hoja-cerrar').focus(); return; }
  gsap.fromTo(hoja, movil ? { yPercent: 100, xPercent: 0 } : { xPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.5, ease: E_OUT });
  if (fuente) {
    const r0 = fuente.getBoundingClientRect();
    gsap.set(destino, { opacity: 0 });
    requestAnimationFrame(() => {
      gsap.set(hoja, { xPercent: 0, yPercent: 0 });
      const r1 = destino.getBoundingClientRect();
      gsap.set(hoja, movil ? { yPercent: 100 } : { xPercent: 100 });
      gsap.to(hoja, { xPercent: 0, yPercent: 0, duration: 0.5, ease: E_OUT, overwrite: true });
      const clon = document.createElement('div');
      clon.className = 'clon';
      clon.innerHTML = destino.innerHTML;
      Object.assign(clon.style, { left: `${r0.left}px`, top: `${r0.top}px`, width: `${r0.width}px`, height: `${r0.height}px` });
      document.body.appendChild(clon);
      gsap.to(clon, { left: r1.left, top: r1.top, width: r1.width, height: r1.height, duration: 0.55, ease: E_OUT, onComplete: () => { gsap.set(destino, { opacity: 1 }); clon.remove(); } });
    });
  }
  $('#hoja-cerrar').focus({ preventScroll: true });
}
function cerrarFicha() {
  const u = new URL(location.href);
  u.searchParams.delete('libro');
  history.replaceState(history.state, '', u);
  const fin = () => { hoja.style.visibility = 'hidden'; hoja.hidden = true; document.body.style.overflow = ''; if (foco) foco.focus({ preventScroll: true }); };
  velo.classList.remove('abierto');
  if (reducir) { esconde(); fin(); return; }
  gsap.to(hoja, innerWidth <= 900 ? { yPercent: 100, duration: 0.3, ease: 'power3.in', onComplete: fin } : { xPercent: 100, duration: 0.3, ease: 'power3.in', onComplete: fin });
}
$('#hoja-cerrar').addEventListener('click', (ev) => { ev.preventDefault(); cerrarFicha(); });
velo.addEventListener('click', cerrarFicha);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && velo.classList.contains('abierto')) cerrarFicha(); });

// Cabecera: sigue el suelo. Destacados y Catálogo marcan «Libros».
const cab = $('.cab');
const secciones = $$('main [data-suelo]');
const navs = $$('.cab nav a');
function suelo() {
  const y = 80;
  let actual = secciones[0];
  for (const s of secciones) {
    const r = s.getBoundingClientRect();
    if (r.top <= y && r.bottom > y) actual = s;
  }
  cab.dataset.suelo = actual.dataset.suelo;
  const id = actual.id === 'libros' || actual.id === 'destacados' ? 'destacados' : actual.id;
  navs.forEach((a) => {
    const href = a.getAttribute('href');
    const marca = href === `#${id}` || (id === 'destacados' && (href === '#destacados' || href === '#libros') && actual.id !== 'inicio' && actual.id !== 'eventos' && actual.id !== 'visita' && actual.id !== 'tienda');
    if (marca && (href === '#destacados' || href === '#libros') && (actual.id === 'libros' || actual.id === 'destacados')) a.setAttribute('aria-current', 'true');
    else if (href === `#${actual.id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}
addEventListener('scroll', suelo, { passive: true });
suelo();

const idLibro = new URLSearchParams(location.search).get('libro');
if (idLibro && porId[idLibro] && hoja.dataset.id !== idLibro) abrirFicha(porId[idLibro], null);
else if (idLibro && hoja.classList.contains('abierta')) $('#hoja-cerrar').focus({ preventScroll: true });
