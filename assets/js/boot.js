// Estado previo al primer render (clases en <html>). Archivo externo: compatible con script-src 'self'.
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  var off = false;
  try { off = localStorage.getItem('iti-b4-motion') === 'off'; } catch (e) { /* almacenamiento bloqueado */ }
  var saveData = navigator.connection && navigator.connection.saveData;
  // Gama media o baja (≤4 GB, ≤4 núcleos, ahorro de datos): vidrio sólido, sin desenfoque.
  var mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  if (saveData || (mem && mem <= 4) || (cores && cores <= 4)) r.dataset.glass = 'lite';
  // Novedades solo existe con llegadas registradas. Antes del primer render se usa lo que dejó la visita anterior (iti-news-estado): s = había
  // llegadas, todas vistas; p = había llegadas sin ver (además se reserva el renglón del control del inicio, news-hint); n o nada (primera
  // visita, almacenamiento bloqueado) = sin sección. news.js lo confirma con el JSON: si aparecen llegadas, la sección (bajo el pliegue) se
  // muestra entonces, y el control del inicio se corrige fuera de la vista.
  // Solo cuentan las llegadas de los últimos 45 días (news.js, NEWS_DAYS): la visita anterior dejó también el último día en que su llegada más
  // reciente sigue vigente (iti-news-vence); pasado ese día (día del dispositivo; el de Monterrey lo confirma news.js) no se reserva nada.
  var news = null, vence = null;
  try { news = localStorage.getItem('iti-news-estado'); vence = localStorage.getItem('iti-news-vence'); } catch (e) { /* almacenamiento bloqueado */ }
  var d = new Date();
  var hoy = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  if (vence && /^\d{4}-\d{2}-\d{2}$/.test(vence) && vence < hoy) news = null;
  if (news === 's' || news === 'p') r.classList.add('has-news');
  if (news === 'p') r.classList.add('news-hint');
  // Aviso del próximo evento (feed.js): la visita anterior dejó la fecha del último evento vigente (iti-ev-hasta, AAAA-MM-DD). Si aún no
  // pasa (día del dispositivo, que es barato; el día de Monterrey lo confirma feed.js), se reserva su renglón del inicio (ev-hint) antes
  // del primer render. Si luego no hay evento, o aparece uno nuevo, se corrige con el inicio fuera de la vista.
  var ev = null;
  try { ev = localStorage.getItem('iti-ev-hasta'); } catch (e) { /* almacenamiento bloqueado */ }
  if (ev && /^\d{4}-\d{2}-\d{2}$/.test(ev)) {
    if (ev >= hoy) r.classList.add('ev-hint');
  }
  // La pausa de la franja de editoriales del Inicio (franja.js): si la persona la pausó, se recuerda aquí para que no haya un salto de diseño entre el bucle y la franja quieta.
  var fq = null;
  try { fq = localStorage.getItem('iti-franja'); } catch (e) { /* almacenamiento bloqueado */ }
  if (fq === 'off') r.classList.add('franja-quieta');
  if (off || saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('motion');
  // Entrada de marca (IntroMarca, 2026-11-18; DESIGN.md, «Entrada de marca»): la marca de la barra sale del centro con su trazo de marcatextos y
  // vuelve a su sitio mientras el telón sube (todo en style.css; el titular, en app.js). Solo con movimiento (arriba), con la página arriba del
  // todo, sin #ancla (un enlace directo, también #libro-<id>), sin volver con «atrás» (bfcache o historial) y solo en la primera visita
  // (localStorage, iti-intro, que se anota solo cuando se muestra; decisión de Aldo del 2026-11-19: antes una vez por sesión, con sessionStorage).
  // Si el almacenamiento lanza no se puede recordar que ya se vio, así que no se muestra: mejor nunca que en cada visita.
  var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  if (scrollY || location.hash || (nav && nav.type === 'back_forward') || document.visibilityState === 'hidden') return;
  try {
    if (localStorage.getItem('iti-intro') === '1') return;
    localStorage.setItem('iti-intro', '1');
  } catch (e) { return; /* almacenamiento bloqueado */ }
  r.classList.add('intro-marca');
  // Se salta con cualquier toque, tecla, rueda o scroll (el telón no recibe toques: el toque llega a lo de debajo). Termina sola al acabar el
  // telón (animationend) o, si algo falla (sin CSS, sin módulos), por su tope, contado desde el primer render (el primer requestAnimationFrame).
  // Tope: el único milisegundo escrito a mano en el JS, a propósito: este archivo corre antes que los módulos y que los tokens (sustituye al tope de
  // 2 s de la antigua clase intro, que ya no tenía CSS).
  // Es la duración máxima permitida de la entrada (1600 ms); el telón termina a intro-asentar + dur-base (1000 ms) y todo queda quieto a los 1300.
  var INTRO_TOPE = 1600;
  var EVENTOS = ['pointerdown', 'keydown', 'wheel', 'scroll'];
  var fin = function () {
    EVENTOS.forEach(function (t) { removeEventListener(t, salta, true); });
    if (!r.classList.contains('intro-marca')) return;
    r.classList.remove('intro-marca');
    document.dispatchEvent(new CustomEvent('iti:intro-fin'));
  };
  var salta = function (e) {
    // La marca grande ocupa el centro: el toque que la salta no la sigue como enlace (#inicio).
    if (e.type === 'pointerdown' && e.target.closest && e.target.closest('.hdr-brand')) {
      addEventListener('click', function (c) { if (c.target.closest && c.target.closest('.hdr-brand')) c.preventDefault(); }, { capture: true, once: true });
    }
    fin();
  };
  EVENTOS.forEach(function (t) { addEventListener(t, salta, { capture: true, passive: true }); });
  document.addEventListener('animationend', function (e) { if (e.animationName === 'intro-telon') fin(); });
  addEventListener('pageshow', function (e) { if (e.persisted) fin(); });
  requestAnimationFrame(function () { setTimeout(fin, INTRO_TOPE); });
})();
