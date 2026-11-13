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
  // Novedades existe siempre con JavaScript (la tira es el catálogo completo): has-news muestra la sección y sus enlaces desde el primer render.
  // El renglón del control del inicio (news-hint) solo se reserva si la visita anterior dejó llegadas sin ver (p); en una primera visita no se
  // reserva nada (ningún hueco vacío entre la dirección y la foto). news.js lo confirma con el JSON y, si no coincide, corrige fuera de la vista.
  var news = null;
  try { news = localStorage.getItem('iti-news-estado'); } catch (e) { /* almacenamiento bloqueado */ }
  r.classList.add('has-news');
  if (news === 'p') r.classList.add('news-hint');
  if (off || saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('motion');
  if (!scrollY) {
    r.classList.add('intro');
    setTimeout(function () { r.classList.remove('intro'); }, 2000);
  }
})();
