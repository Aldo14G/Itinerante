// Franja de editoriales del Inicio (2026-11-19, encargo de Aldo; DESIGN.md, «Franja de editoriales»). El marcado llega pintado en index.html (scripts/build-editoriales.mjs, desde
// catalog.js y assets/data/editoriales.json) y la base es la franja QUIETA (CSS). Este módulo solo hace lo que el CSS no puede: medir un grupo para fijar la duración del
// bucle a franja-velocidad px/s, asegurarse de que cada grupo llena la ventana, marcar cuándo está a la vista (fuera de ella no se mueve) y cablear la pausa propia.
// El movimiento en sí es CSS (transform, sin JavaScript en el camino crítico) y solo existe con html.motion (no con «reducir movimiento», ni con la pausa del sitio, ni con
// ahorro de datos) y sin html.franja-quieta (la pausa de esta franja, que boot.js recuerda desde el primer render para que no haya salto). WCAG 2.2.2: se detiene con
// el cursor encima, con el foco dentro de la franja, al presionar y con su botón de 44 px (pausa/reanuda); los elementos no son enlaces.
import { num } from './motion.js';

const GUARDA = 'iti-franja'; // localStorage: 'off' = pausada por la persona
const COPIAS_EXTRA_MAX = 12; // tope de seguridad al completar copias

export function initFranja() {
  const root = document.documentElement;
  const franja = document.querySelector('[data-franja]');
  if (!franja || franja.dataset.iniciada) return;
  franja.dataset.iniciada = '1';
  const ventana = franja.querySelector('.franja-ventana');
  const [a, b] = franja.querySelectorAll('.franja-lista');
  const ctl = franja.querySelector('[data-franja-ctl]');
  if (!ventana || !a || !b) return;

  const moviendo = () => root.classList.contains('motion') && !root.classList.contains('franja-quieta');
  const ancho = el => el.getBoundingClientRect().width;
  const conjunto = () => [...a.querySelectorAll('.franja-item:not(.franja-eco)')];

  // Cada grupo debe llenar la ventana (si no, el bucle dejaría un hueco): se añaden copias de ayuda a los dos grupos por igual hasta que quepa. El HTML ya trae las que
  // estima el generador; esto cubre un ancho de letra distinto del estimado. Las copias son decorativas (aria-hidden, inert), igual que las del generador.
  function llenar() {
    const real = conjunto();
    if (!real.length) return;
    for (let i = 0; i < COPIAS_EXTRA_MAX && ancho(a) < ventana.clientWidth + 1; i++) {
      for (const lista of [a, b]) for (const li of real) {
        const copia = li.cloneNode(true);
        copia.classList.add('franja-eco'); copia.setAttribute('aria-hidden', 'true'); copia.setAttribute('inert', '');
        copia.querySelectorAll('[role], [aria-label]').forEach(n => { n.removeAttribute('role'); n.removeAttribute('aria-label'); });
        lista.append(copia);
      }
    }
  }

  // Mide (solo mientras se mueve: en la versión quieta los grupos no son una vuelta) y fija la duración de una vuelta = ancho de un grupo ÷ velocidad. Cambiar la duración
  // de una animación en marcha la salta, así que solo se toca si cambió de verdad.
  function medir() {
    if (!moviendo()) return;
    llenar();
    const segundos = ancho(a) / Math.max(1, num('franja-velocidad', 40));
    const actual = parseFloat(franja.style.getPropertyValue('--franja-dur')) || 0;
    if (Math.abs(actual - segundos) > 0.05) franja.style.setProperty('--franja-dur', `${segundos.toFixed(2)}s`);
    franja.dataset.listo = '';
  }

  const fuentes = document.fonts ? document.fonts.ready : Promise.resolve();
  fuentes.then(medir);
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(ventana);
  if ('MutationObserver' in window) new MutationObserver(medir).observe(root, { attributes: true, attributeFilter: ['class'] }); // pausa del sitio o de la franja que se quita: se vuelve a medir

  // Fuera de la vista no se mueve (batería y calma): el CSS la detiene mientras falte data-en-vista.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entradas => { for (const e of entradas) franja.toggleAttribute('data-en-vista', e.isIntersecting); }).observe(franja);
  } else franja.setAttribute('data-en-vista', '');

  // La pausa de la propia franja (WCAG 2.2.2). Solo existe mientras hay movimiento (el CSS oculta el botón si no): sin movimiento no hay nada que pausar. Es de esta franja,
  // no del sitio: «Pausar el movimiento» (pie y ☰) sigue deteniéndola también, y no toca los carruseles ni el resto.
  if (ctl) {
    const rotular = () => ctl.setAttribute('aria-label', root.classList.contains('franja-quieta') ? 'Reanudar el movimiento de las editoriales' : 'Pausar el movimiento de las editoriales');
    rotular();
    ctl.hidden = false;
    ctl.addEventListener('click', () => {
      const quieta = root.classList.toggle('franja-quieta');
      try { localStorage.setItem(GUARDA, quieta ? 'off' : 'on'); } catch { /* sin persistencia */ }
      rotular();
    });
  }
}
