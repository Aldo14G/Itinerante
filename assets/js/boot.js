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
  var news = null;
  try { news = localStorage.getItem('iti-news-estado'); } catch (e) { /* almacenamiento bloqueado */ }
  if (news === 's' || news === 'p') r.classList.add('has-news');
  if (news === 'p') r.classList.add('news-hint');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!off && !saveData && !reduce) r.classList.add('motion');

  var CARRETA_KEY = 'iti-carreta-visto';
  function navType() {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      return (nav && nav.type) || '';
    } catch (e) { return ''; }
  }
  function carretaHash() {
    var id = (location.hash || '').replace(/^#/, '');
    if (!id || id === 'inicio' || id === 'contenido') return false;
    return true;
  }
  // Una pestaña abierta desde otra hereda sessionStorage. Solo en esa navegación nueva se ignora la marca copiada.
  function openedFromAnotherTab() {
    try { return !!(window.opener && navType() === 'navigate'); } catch (e) { return false; }
  }
  function showCarreta() {
    if (navType() === 'back_forward') return false;
    if (scrollY) return false;
    if (carretaHash()) return false;
    if (off || saveData || reduce) return false;
    var seen = null;
    try { seen = sessionStorage.getItem(CARRETA_KEY); } catch (e) { return false; }
    if (seen && !openedFromAnotherTab()) return false;
    try { sessionStorage.setItem(CARRETA_KEY, '1'); } catch (e) { return false; }
    return true;
  }
  function dropCarreta() {
    r.classList.remove('carreta-on');
    var el = document.getElementById('carreta');
    if (el) el.remove();
  }
  if (showCarreta()) {
    r.classList.add('carreta-on');
    // La restauración de scroll ocurre después de este script. Si la página no abre arriba, el velo no se queda.
    requestAnimationFrame(function () { if (scrollY) dropCarreta(); });
    // Si app.js o carreta.js no arrancan, el velo no puede tapar la página.
    setTimeout(function () { if (r.classList.contains('carreta-on')) dropCarreta(); }, 2500);
  }
})();
