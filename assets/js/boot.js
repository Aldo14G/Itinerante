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
  // Novedades: la sección con su casilla (has-news) y el renglón del control del inicio (news-hint) se reservan antes del primer render con lo que
  // dejó la visita anterior: n = no había novedades, s = nada sin ver, p = había sin ver. Sin dato (primera visita o almacenamiento bloqueado) se
  // reserva todo; news.js lo confirma con el JSON y, si no coincide, corrige fuera de la vista.
  var news = null;
  try { news = localStorage.getItem('iti-news-estado'); } catch (e) { /* almacenamiento bloqueado */ }
  if (news !== 'n') { r.classList.add('has-news'); if (news !== 's') r.classList.add('news-hint'); }
  if (off || saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('motion');
  if (!scrollY) {
    r.classList.add('intro');
    setTimeout(function () { r.classList.remove('intro'); }, 2000);
  }
})();
