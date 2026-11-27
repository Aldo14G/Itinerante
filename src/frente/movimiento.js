/* Movimiento y tacto de la landing publicada · implementación de la especificación
   docs/superpowers/specs/2026-11-27-landing-movimiento-y-tacto-spec.md (criterios en tools/qa/landing-specs.mjs).
   Va como archivo externo (o dentro del script principal) y su huella en la CSP. Escribe estilos solo por CSSOM
   (el.style / el.animate), que la CSP de la landing permite; nunca atributos style. Sin dependencias. */
// Se llama al final de cliente.js, cuando la página ya tiene sus oyentes.
export function iniciarMovimiento() {
  const raiz = document.documentElement;
  const token = n => getComputedStyle(raiz).getPropertyValue(n).trim();
  const ms = v => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000) || 0;
  const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const telefono = () => matchMedia('(max-width: 760px)').matches;

  // MT-01 · Safari en iOS solo aplica :active al tocar si la página escucha touchstart.
  document.addEventListener('touchstart', () => {}, { passive: true });

  // MT-04 · Deslizar hacia abajo para cerrar (patrón de las hojas de iOS y de Vaul).
  // Cierra al pasar min(120 px, 25 % del alto) o al soltar a más de 0.5 px/ms; si no, vuelve a su sitio.
  // Solo arrastra si el contenido de la hoja está arriba del todo; hacia arriba, el scroll normal.
  // Con «reducir movimiento» la hoja no sigue al dedo, pero el gesto la cierra igual.
  function deslizarParaCerrar({ caja, mover, scroller, cerrar }) {
    let y0 = 0, t0 = 0, dy = 0, decidido = false, arrastra = false, sigue = true, origen = null;
    const umbral = () => Math.min(120, caja.offsetHeight * 0.25);
    const limpiar = () => { mover.style.removeProperty('translate'); mover.style.removeProperty('transition'); };
    caja.addEventListener('touchstart', e => {
      if (e.touches.length !== 1 || !telefono() || e.target.closest('input, select, textarea')) { decidido = true; arrastra = false; return; }
      y0 = e.touches[0].clientY; t0 = performance.now(); dy = 0; decidido = false; arrastra = false; sigue = !reducido(); origen = e.target;
    }, { passive: true });
    caja.addEventListener('touchmove', e => {
      if (decidido && !arrastra) return;
      const d = e.touches[0].clientY - y0;
      if (!decidido) {
        if (Math.abs(d) < 6) return;
        decidido = true;
        const arriba = !scroller || !scroller.contains(origen) || scroller.scrollTop <= 0;
        arrastra = d > 0 && arriba;
        if (!arrastra) return;
        if (sigue) mover.style.transition = 'none';
      }
      e.preventDefault();
      dy = Math.max(0, d);
      if (sigue) mover.style.translate = `0 ${dy}px`;
    }, { passive: false });
    const soltar = () => {
      if (!arrastra) return;
      arrastra = false;
      const velocidad = dy / Math.max(1, performance.now() - t0);
      mover.style.removeProperty('transition');
      if (dy > umbral() || velocidad > 0.5) {
        cerrar();
        // La salida de la hoja parte de donde quedó el dedo; al terminar se limpia.
        setTimeout(limpiar, ms(token('--d-media')) + 120);
        return;
      }
      if (!sigue || !dy) { limpiar(); return; }
      mover.style.transition = `translate ${token('--d-rapida')} ${token('--e-out')}`;
      requestAnimationFrame(() => { mover.style.translate = '0 0'; });
      setTimeout(limpiar, ms(token('--d-rapida')) + 50);
    };
    caja.addEventListener('touchend', soltar);
    caja.addEventListener('touchcancel', soltar);
  }
  const asa = () => { const s = document.createElement('span'); s.className = 'asa'; s.setAttribute('aria-hidden', 'true'); return s; };

  const ficha = document.getElementById('hoja');
  if (ficha) {
    ficha.prepend(asa());
    deslizarParaCerrar({ caja: ficha, mover: ficha, scroller: ficha, cerrar: () => document.getElementById('hoja-cerrar')?.click() });
  }
  const filtros = document.getElementById('hoja-filtros');
  const lamina = filtros?.querySelector('.lamina');
  if (lamina) {
    lamina.prepend(asa());
    deslizarParaCerrar({ caja: lamina, mover: filtros, scroller: document.getElementById('hf-cuerpo'), cerrar: () => document.getElementById('hf-cerrar')?.click() });
  }

  // MT-05 (filtrar reacomoda la rejilla) ya lo hace la landing con GSAP Flip; no se duplica aquí.
}
