// Duraciones y curvas del movimiento hechas en JS, leídas de los tokens CSS (design/tokens.json):
// una sola fuente de verdad para CSS y WAAPI. Los valores de respaldo solo se usan si falta el CSS.
const FALLBACK = { 'dur-instant': 120, 'dur-fast': 240, 'dur-base': 400, 'dur-slow': 700, 'dur-scene': 1200, 'stagger-char': 24, 'stagger-line': 60, 'intent-topic': 250, 'intent-disclosure': 320 };

const token = name => (typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim());

/** Milisegundos de un token (--dur-*, --stagger-*, --intent-*). */
export function ms(name) {
  const value = parseFloat(token(name));
  return Number.isFinite(value) ? value : FALLBACK[name] ?? 0;
}

export const DUR = name => ms(`dur-${name}`);
export const EASE = () => token('ease-out') || 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_IO = () => token('ease-io') || 'cubic-bezier(0.65, 0, 0.35, 1)';
