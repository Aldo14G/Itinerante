// Pose y gesto de la vitrina de Destacados. Puro: el DOM vive en cliente.js.
// Paso del dedo: 0.74·W. Al soltar, menos de 24 px vuelve; menos de 2 pasos avanza 1 libro; si no, lo recorrido.

export function anchoPieza(anchoVentana) {
  if (anchoVentana <= 760) return Math.round(Math.min(260, Math.max(190, anchoVentana * 0.5)));
  return Math.round(Math.min(260, Math.max(150, anchoVentana * 0.17)));
}

export function pasoVitrina(w) {
  return w * 0.74;
}

/** d = índice − posición. flat = prefers-reduced-motion: misma planta, sin giro ni z. */
export function poseVitrina(d, { w, flat = false, movil = false } = {}) {
  const s = d < 0 ? -1 : 1;
  const a = Math.abs(d);
  const near = Math.min(a, 1);
  const far = Math.max(0, a - 1);
  const alcance = movil ? 1.6 : 3.4;
  const op = a <= alcance ? 1 : Math.max(0, 1 - (a - alcance) / 0.6);
  if (flat) {
    return { x: s * (near * 0.78 + far * 0.62) * w, z: 0, ry: 0, sc: 1 - near * 0.16 - far * 0.04, op, dim: near };
  }
  return { x: s * (near * 0.74 + far * 0.46) * w, z: -(near * 0.62 + far * 0.42) * w, ry: -s * near * 42, sc: 1, op, dim: near * 0.9 + far * 0.1 };
}

export function transformVitrina(k) {
  const plano = k.z === 0 && k.ry === 0;
  if (plano) return `translate(${k.x.toFixed(1)}px, 0px) scale(${k.sc.toFixed(3)})`;
  return `translate3d(${k.x.toFixed(1)}px, 0px, ${k.z.toFixed(1)}px) rotateY(${k.ry.toFixed(2)}deg) scale(${k.sc.toFixed(3)})`;
}

/** Índice al soltar. dx > 0 es un arrastre hacia la derecha (vuelve a un índice menor). */
export function destinoGesto(dx, paso, pos0) {
  const base = Math.round(pos0);
  const n = dx / paso;
  if (Math.abs(dx) < 24) return base;
  if (Math.abs(n) < 2) return base - Math.sign(dx);
  return Math.round(pos0 - n);
}

export function teclaVitrina(key, i, n) {
  if (key === 'ArrowRight') return Math.min(n - 1, i + 1);
  if (key === 'ArrowLeft') return Math.max(0, i - 1);
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return null;
}
