// Duraciones y curvas del movimiento hechas en JS, leídas de los tokens CSS (design/tokens.json, sistema «Itinerante Líquido»):
// una sola fuente de verdad para CSS y WAAPI. Los valores de respaldo solo se usan si falta el CSS.
// Los nombres cortos de siempre (instant, fast, base, slow, scene; stagger-*, intent-*) siguen sirviendo: se traducen a los tokens nuevos.
const ALIAS = {
  'dur-instant': 'dur-instantanea', 'dur-fast': 'dur-rapida', 'dur-slow': 'dur-lenta', 'dur-scene': 'espera-larga',
  'stagger-char': 'escalon-letra', 'stagger-line': 'escalon-linea', 'intent-topic': 'intencion-tema', 'intent-disclosure': 'intencion-despliegue'
};
const FALLBACK = { 'dur-instantanea': 120, 'dur-rapida': 240, 'dur-base': 400, 'dur-lenta': 700, 'espera-larga': 1200, 'escalon-letra': 24, 'escalon-linea': 60, 'intencion-tema': 250, 'intencion-despliegue': 320 };

const cache = new Map();
// Los tokens no cambian durante la sesión: se lee el estilo calculado una sola vez por nombre.
const token = name => {
  if (typeof document === 'undefined') return '';
  if (!cache.has(name)) cache.set(name, getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());
  return cache.get(name);
};

/** Milisegundos de un token (--dur-*, --escalon-*, --intencion-*, --espera-larga; o su nombre corto de antes). */
export function ms(name) {
  const real = ALIAS[name] ?? name;
  const value = parseFloat(token(real));
  return Number.isFinite(value) ? value : FALLBACK[real] ?? 0;
}

export const DUR = name => ms(`dur-${name}`);
export const EASE = () => token('curva-salida') || 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_IO = () => token('curva-entrada-salida') || 'cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * Confirmar primero, trabajar después: corre `fn` cuando el navegador ya pintó el fotograma que sigue al clic.
 * Una hoja que tiene que volver inerte toda la página (showModal) cuesta cientos de ms en un teléfono de gama media;
 * si ese trabajo va dentro del manejador, la persona no ve nada hasta que termina (INP). El respaldo evita que se pierda
 * la acción en una pestaña oculta, donde requestAnimationFrame no corre.
 */
export function afterPaint(fn) {
  return new Promise(resolve => {
    let done = false;
    const run = () => { if (done) return; done = true; resolve(fn?.()); };
    requestAnimationFrame(() => setTimeout(run, 0));
    setTimeout(run, DUR('base'));
  });
}

/**
 * El gesto típico de abrir algo caro desde un toque: `el` se marca `data-opening` (se ignoran más toques mientras tanto),
 * el navegador pinta la confirmación y solo entonces corre `fn`. Una sola guarda para tarjetas, botones y chips.
 */
export async function confirmThen(el, fn) {
  if (el.hasAttribute('data-opening')) return;
  el.dataset.opening = '';
  try { await afterPaint(); await fn(); } finally { delete el.dataset.opening; }
}

/**
 * Rebote corto del icono al elegir (guardar un libro en Mi lista): solo cuando la persona toca y solo con movimiento.
 * Pone `.is-pop` en el control (la animación `pick-pop` vive en el CSS) y la retira al terminar, así restaurar un estado guardado al
 * pintar no rebota, y tampoco rebota después si el movimiento se reactiva.
 */
export function pickPop(el) {
  if (typeof document === 'undefined' || !document.documentElement.classList.contains('motion')) return;
  el.classList.add('is-pop');
  el.addEventListener('animationend', () => el.classList.remove('is-pop'), { once: true });
}
