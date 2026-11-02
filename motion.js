// Duraciones y curvas del movimiento hechas en JS, leídas de los tokens CSS (design/tokens.json):
// una sola fuente de verdad para CSS y WAAPI. Los valores de respaldo solo se usan si falta el CSS.
const FALLBACK = { 'dur-instant': 120, 'dur-fast': 240, 'dur-base': 400, 'dur-slow': 700, 'dur-scene': 1200, 'stagger-char': 24, 'stagger-line': 60, 'intent-topic': 250, 'intent-disclosure': 320 };

const cache = new Map();
// Los tokens no cambian durante la sesión: se lee el estilo calculado una sola vez por nombre.
const token = name => {
  if (typeof document === 'undefined') return '';
  if (!cache.has(name)) cache.set(name, getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());
  return cache.get(name);
};

/** Milisegundos de un token (--dur-*, --stagger-*, --intent-*). */
export function ms(name) {
  const value = parseFloat(token(name));
  return Number.isFinite(value) ? value : FALLBACK[name] ?? 0;
}

export const DUR = name => ms(`dur-${name}`);
export const EASE = () => token('ease-out') || 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_IO = () => token('ease-io') || 'cubic-bezier(0.65, 0, 0.35, 1)';

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
