// Franja de editoriales del Inicio (2026-11-19, encargo de Aldo; DESIGN.md, «Franja de editoriales»). El marcado llega pintado en index.html (scripts/build-editoriales.mjs, desde
// catalog.js y assets/data/editoriales.json) y la base es la franja QUIETA (CSS). Este módulo solo hace lo que el CSS no puede: medir un grupo para fijar la duración del
// bucle a franja-velocidad px/s, asegurarse de que cada grupo llena la ventana, marcar cuándo está a la vista (fuera de ella no se mueve). Sin controles: la franja no la maneja la persona.
// El movimiento en sí es CSS (transform, sin JavaScript en el camino crítico) y solo existe con html.motion (no con «reducir movimiento», ni con la pausa del sitio, ni con
// ahorro de datos). WCAG 2.2.2: sin botón propio (decisión de Aldo, 2026-11-19: la persona solo elige libros, productos y talleres); se detiene con
// el cursor encima, con el foco dentro de la franja y al presionar, y «Pausar el movimiento» del sitio (pie y ☰) la detiene como a todo; los elementos no son enlaces.
import { num } from './motion.js';

const COPIAS_EXTRA_MAX = 12; // tope de seguridad al completar copias

export function initFranja() {
  const root = document.documentElement;
  const franja = document.querySelector('[data-franja]');
  if (!franja || franja.dataset.iniciada) return;
  franja.dataset.iniciada = '1';
  const ventana = franja.querySelector('.franja-ventana');
  const [a, b] = franja.querySelectorAll('.franja-lista');
  if (!ventana || !a || !b) return;

  const moviendo = () => root.classList.contains('motion');
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
  if ('MutationObserver' in window) new MutationObserver(medir).observe(root, { attributes: true, attributeFilter: ['class'] }); // la pausa del sitio quita html.motion: se vuelve a medir

  // Fuera de la vista no se mueve (batería y calma): el CSS la detiene mientras falte data-en-vista.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entradas => { for (const e of entradas) franja.toggleAttribute('data-en-vista', e.isIntersecting); }).observe(franja);
  } else franja.setAttribute('data-en-vista', '');
}
