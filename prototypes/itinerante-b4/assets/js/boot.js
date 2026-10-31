// Estado previo al primer render (clases en <html>). Archivo externo: compatible con script-src 'self'.
(function () {
  var r = document.documentElement;
  r.classList.add('js');
  var off = false;
  try { off = localStorage.getItem('iti-b4-motion') === 'off'; } catch (e) { /* almacenamiento bloqueado */ }
  var saveData = navigator.connection && navigator.connection.saveData;
  if (off || saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.classList.add('motion');
  if (!scrollY) {
    r.classList.add('intro');
    setTimeout(function () { r.classList.remove('intro'); }, 2000);
  }
})();
