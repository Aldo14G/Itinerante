// JS de /nuevo (va en línea). Sin él, la página se lee completa: cuadrícula, filtros por CSS y carta.
// Con él: carrusel 3D de portadas, tilt, revelado y la ficha. El movimiento se apaga solo con prefers-reduced-motion.
import { montarVitrina } from './carrusel.js';

(function () {
  var d = document;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  d.querySelectorAll('fecha-hasta').forEach(function (e) { if (hoy > e.getAttribute('d')) e.remove(); });
  d.querySelectorAll('fecha-desde').forEach(function (e) { if (hoy < e.getAttribute('d')) e.remove(); else e.hidden = false; });

  // Scroll-spy: la sección activa es la última cuyo inicio pasó la línea a ~35 % del alto visible bajo la cabecera.
  var cab = d.querySelector('.cabecera');
  var enlaces = [].slice.call(d.querySelectorAll('.menu a'));
  var secciones = enlaces.map(function (a) { return d.getElementById(a.hash.slice(1)); });
  function espiar() {
    var alto = cab ? cab.offsetHeight : 0;
    var linea = alto + (innerHeight - alto) * 0.35;
    var activa = -1;
    secciones.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= linea) activa = i; });
    if (innerHeight + scrollY >= d.documentElement.scrollHeight - 2) activa = secciones.length - 1;
    enlaces.forEach(function (a, i) { if (i === activa) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  addEventListener('scroll', espiar, { passive: true });
  addEventListener('resize', espiar);
  espiar();

  // Carrusel: Tab llega a cada enlace; flechas izquierda/derecha mueven la pieza. Sin este script el contenedor igual se desliza (scroll-snap).
  var carrusel = d.querySelector('.carrusel');
  if (carrusel) {
    var piezas = [].slice.call(carrusel.querySelectorAll('.carrusel-pieza'));
    carrusel.addEventListener('keydown', function (e) {
      if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || !piezas.length) return;
      var i = -1;
      for (var k = 0; k < piezas.length; k++) if (piezas[k].contains(d.activeElement)) i = k;
      if (i < 0 && d.activeElement === carrusel) i = e.key === 'ArrowRight' ? -1 : piezas.length;
      var n = e.key === 'ArrowRight' ? Math.min(piezas.length - 1, i + 1) : Math.max(0, i - 1);
      if (n === i || n < 0) return;
      var destino = piezas[n].querySelector('a');
      e.preventDefault();
      if (destino) destino.focus({ preventScroll: true });
      piezas[n].scrollIntoView({ inline: 'start', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  // Carta: en el teléfono cada grupo plegado salvo el primero (sin JS van todos abiertos).
  if (matchMedia('(max-width: 719px)').matches) d.querySelectorAll('.barra-grupo').forEach(function (g, i) { if (i) g.open = false; });

  // Tienda: buscador + contador único («N libros») que también sigue a los filtros de CSS.
  var tienda = d.getElementById('tienda');
  if (!tienda) return;
  var libros = [].slice.call(tienda.querySelectorAll('.rejilla > li'));
  var rejilla = tienda.querySelector('.rejilla');
  var luego = tienda.querySelector('.proximamente');
  var vitrina = montarVitrina(rejilla, {
    reduce: reduce,
    abrir: function (id) {
      var tarjeta = d.getElementById('libro-' + id);
      var enlace = tarjeta && tarjeta.querySelector('.libro-enlace');
      if (enlace) enlace.click();
    },
  });
  var tituloTienda = tienda.querySelector('h2');
  if (vitrina && tituloTienda) tituloTienda.after(vitrina);
  var buscador = tienda.querySelector('.buscador');
  var campo = d.getElementById('buscar');
  var cuenta = tienda.querySelector('.cuenta');
  var vacio = tienda.querySelector('.vacio');
  if (buscador) buscador.hidden = false;
  function normalizar(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function aplicarFiltro() {
    var q = campo ? normalizar(campo.value) : '';
    var ed = tienda.querySelector('input[name="editorial"]:checked');
    ed = ed ? ed.value : '';
    var gen = tienda.querySelector('input[name="genero"]:checked');
    gen = gen ? gen.value : '';
    var tipo = tienda.querySelector('input[name="tipo"]:checked');
    tipo = tipo ? tipo.value : 'libros';
    var n = 0;
    libros.forEach(function (l) {
      var ok = l.dataset.tipo === tipo && (!q || (l.dataset.busca || '').indexOf(q) >= 0) && (!ed || l.dataset.ed === ed) && (!gen || l.dataset.gen === gen);
      l.hidden = !ok;
      if (ok) n++;
    });
    var vacioTipo = tipo !== 'libros' && !libros.some(function (l) { return l.dataset.tipo === tipo; });
    if (luego) luego.hidden = !vacioTipo;
    cuenta.hidden = vacioTipo;
    cuenta.textContent = n === 1 ? '1 libro' : n + ' libros';
    vacio.hidden = vacioTipo || n > 0;
  }
  function filtrar() {
    if (reduce || typeof rejilla.getAnimations !== 'function') { aplicarFiltro(); return; }
    var antes = new Map();
    libros.forEach(function (l) { if (!l.hidden) antes.set(l, l.getBoundingClientRect()); });
    aplicarFiltro();
    libros.forEach(function (l) {
      var a = antes.get(l);
      if (!a || l.hidden) return;
      var b = l.getBoundingClientRect();
      var dx = a.left - b.left;
      var dy = a.top - b.top;
      if (!dx && !dy) return;
      l.style.transition = 'none';
      l.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(function () {
        l.style.transition = 'transform var(--dur-base) var(--curva-salida)';
        l.style.transform = '';
      });
    });
  }
  tienda.addEventListener('input', filtrar);
  tienda.addEventListener('change', filtrar);
  tienda.querySelector('[data-limpiar]').addEventListener('click', function () {
    if (campo) campo.value = '';
    var todas = tienda.querySelector('input[name="editorial"][value=""]');
    if (todas) todas.checked = true;
    var todos = tienda.querySelector('input[name="genero"][value=""]');
    if (todos) todos.checked = true;
    filtrar();
    if (campo) campo.focus();
  });

  // Ficha: dialog nativo (Esc y foco atrapado los da el navegador); al cerrar, el foco vuelve a la tarjeta.
  var ficha = d.getElementById('ficha');
  var origen = null;
  function abrir(l, enlace) {
    origen = enlace;
    var img = l.querySelector('.libro-portada img');
    var portada = ficha.querySelector('.ficha-portada');
    portada.innerHTML = '';
    if (img) { var c = img.cloneNode(); c.loading = 'eager'; portada.appendChild(c); portada.hidden = false; } else portada.hidden = true;
    ficha.querySelector('#ficha-t').textContent = enlace.textContent;
    var precio = l.querySelector('.libro-precio');
    var p = ficha.querySelector('.libro-precio');
    p.textContent = precio ? precio.textContent : '';
    p.hidden = !precio;
    var at = l.querySelector('.atributos');
    ficha.querySelector('.ficha-atributos').innerHTML = at ? at.outerHTML : '';
    var sin = l.querySelector('.libro-sinopsis');
    var s = ficha.querySelector('.ficha-sinopsis');
    s.textContent = sin ? sin.textContent : '';
    s.hidden = !sin;
    ficha.querySelector('[data-wa]').href = l.dataset.wa;
    ficha.showModal();
    if (location.hash !== '#' + l.id) history.replaceState(null, '', '#' + l.id);
  }
  tienda.addEventListener('click', function (e) {
    var a = e.target.closest('.libro-enlace');
    if (!a) return;
    e.preventDefault();
    abrir(a.closest('.libro'), a);
  });
  ficha.querySelector('[data-cerrar]').addEventListener('click', function () { ficha.close(); });
  ficha.addEventListener('click', function (e) { if (e.target === ficha) ficha.close(); });
  ficha.addEventListener('close', function () {
    if (location.hash.indexOf('#libro-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (origen) origen.focus();
  });
  var inicial = location.hash.indexOf('#libro-') === 0 && d.getElementById(location.hash.slice(1));
  if (inicial) abrir(inicial, inicial.querySelector('.libro-enlace'));

  // Revelado escalonado. Sin JS las tarjetas ya están visibles (no llevan la clase js).
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    d.querySelectorAll('.rejilla .libro, .ev').forEach(function (el, i) {
      if (!reduce) el.style.transitionDelay = (i % 8) * 60 + 'ms';
      io.observe(el);
    });
  } else {
    d.querySelectorAll('.rejilla .libro, .ev').forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Tilt de la portada, solo con puntero fino y con movimiento.
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var inclina = null;
    var marco = 0;
    var px = 0.5;
    var py = 0.5;
    function soltar() {
      if (!inclina) return;
      inclina.style.transform = '';
      inclina = null;
    }
    function pintarTilt() {
      marco = 0;
      if (!inclina) return;
      var ry = Math.max(-6, Math.min(6, (px - 0.5) * 12));
      var rx = Math.max(-6, Math.min(6, (0.5 - py) * 12));
      inclina.style.transform = 'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(12px)';
    }
    tienda.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { soltar(); return; }
      var porta = e.target.closest('.libro-portada');
      if (!porta || porta.closest('.libro[hidden]')) { soltar(); return; }
      if (porta !== inclina) { soltar(); inclina = porta; }
      var r = porta.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      if (!marco) marco = requestAnimationFrame(pintarTilt);
    });
    tienda.addEventListener('pointerleave', soltar);
  }
})();
