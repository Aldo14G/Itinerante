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
  if (off || saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('motion');
  if (!scrollY) {
    r.classList.add('intro');
    setTimeout(function () { r.classList.remove('intro'); }, 2000);
  }
})();
