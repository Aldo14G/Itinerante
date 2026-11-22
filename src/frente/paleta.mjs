// Paleta B «Patio» (decisión de Aldo, 29 oct 2026). Fuente única de los colores del tema Astryx de Itinerante.
// La usan src/frente/tema.ts (tema), scripts/build-tema-astryx.mjs (CSS) y scripts/check-contraste.mjs (AA).
export const PALETA = Object.freeze({
  hollin: '#1d1411', // texto principal
  piedra: '#5a4037', // texto secundario
  turquesaTinta: '#236861', // acento, acción primaria y foco
  madera: '#845635', // acento secundario
  patio: '#5d7339', // estado abierto (solo punto/icono, nunca texto)
  papel: '#f5f0e7', // fondo
  cal: '#e8e6e0', // fondo 2
  cantera: '#d7c5ae', // superficie cálida
  mosaico: '#373731', // superficie oscura
  blanco: '#ffffff',
  mintLogo: '#5dc4b4', // solo sobre su placa o sobre mosaico; nunca texto sobre claro
});

// Pares texto/fondo que el tema usa de verdad. min: 4.5 texto, 3 UI y foco (WCAG 2.2 AA).
export const PARES = [
  { nombre: 'texto principal / papel', fg: 'hollin', bg: 'papel', min: 4.5 },
  { nombre: 'texto principal / cal', fg: 'hollin', bg: 'cal', min: 4.5 },
  { nombre: 'texto principal / cantera', fg: 'hollin', bg: 'cantera', min: 4.5 },
  { nombre: 'texto secundario / papel', fg: 'piedra', bg: 'papel', min: 4.5 },
  { nombre: 'texto secundario / cal', fg: 'piedra', bg: 'cal', min: 4.5 },
  { nombre: 'texto secundario / cantera', fg: 'piedra', bg: 'cantera', min: 4.5 },
  { nombre: 'enlace y acento / papel', fg: 'turquesaTinta', bg: 'papel', min: 4.5 },
  { nombre: 'enlace y acento / cal', fg: 'turquesaTinta', bg: 'cal', min: 4.5 },
  { nombre: 'madera / papel', fg: 'madera', bg: 'papel', min: 4.5 },
  { nombre: 'texto sobre botón primario', fg: 'blanco', bg: 'turquesaTinta', min: 4.5 },
  { nombre: 'texto sobre mosaico', fg: 'papel', bg: 'mosaico', min: 4.5 },
  { nombre: 'mint del logo / mosaico', fg: 'mintLogo', bg: 'mosaico', min: 4.5 },
  { nombre: 'anillo de foco / papel', fg: 'turquesaTinta', bg: 'papel', min: 3 },
  { nombre: 'anillo de foco / cal', fg: 'turquesaTinta', bg: 'cal', min: 3 },
  { nombre: 'punto «abierto» / papel', fg: 'patio', bg: 'papel', min: 3 },
  { nombre: 'borde de control / papel', fg: 'piedra', bg: 'papel', min: 3 },
];

function canal(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
export function luminancia(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => canal(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
