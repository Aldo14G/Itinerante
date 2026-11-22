// JS de /nuevo (va en línea en el HTML; sin dependencias). Sin él, la página se lee completa y los filtros por editorial funcionan
// con CSS. Aquí: fechas (hora de Monterrey), scroll-spy, buscador y contador, ficha del libro y la carta plegada en el teléfono.
(function () {
  var d = document;
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
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  var buscador = tienda.querySelector('.buscador');
  var campo = d.getElementById('buscar');
  var cuenta = tienda.querySelector('.cuenta');
  var vacio = tienda.querySelector('.vacio');
  if (buscador) buscador.hidden = false;
  function normalizar(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function filtrar() {
    var q = campo ? normalizar(campo.value) : '';
    var ed = tienda.querySelector('input[name="editorial"]:checked');
    ed = ed ? ed.value : '';
    var tipo = tienda.querySelector('input[name="tipo"]:checked');
    tipo = tipo ? tipo.value : '';
    var n = 0;
    libros.forEach(function (l) {
      var ok = (!q || (l.dataset.busca || '').indexOf(q) >= 0) && (!ed || l.dataset.ed === ed) && (!tipo || l.dataset.tipo === tipo);
      l.hidden = !ok;
      if (ok) n++;
    });
    cuenta.textContent = n === 1 ? '1 libro' : n + ' libros';
    vacio.hidden = n > 0;
  }
  tienda.addEventListener('input', filtrar);
  tienda.addEventListener('change', filtrar);
  tienda.querySelector('[data-limpiar]').addEventListener('click', function () {
    if (campo) campo.value = '';
    var todas = tienda.querySelector('input[name="editorial"][value=""]');
    if (todas) todas.checked = true;
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
})();
