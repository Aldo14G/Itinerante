// Verifica el contraste AA de cada par texto/fondo del tema Astryx de Itinerante (SPEC-MIGRACION-ASTRYX §1 y §4.8).
// Uso: node scripts/check-contraste.mjs [--json]. Sale con 1 si algún par no llega a su mínimo.
import { PALETA, PARES, contraste } from '../src/frente/paleta.mjs';

const filas = PARES.map((p) => {
  const ratio = contraste(PALETA[p.fg], PALETA[p.bg]);
  return { ...p, fgHex: PALETA[p.fg], bgHex: PALETA[p.bg], ratio: Math.round(ratio * 100) / 100, ok: ratio >= p.min };
});
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(filas, null, 2));
} else {
  for (const f of filas) {
    console.log(`${f.ok ? 'ok ' : 'NO '} ${f.ratio.toFixed(2).padStart(5)}:1 (mín ${f.min}) ${f.nombre}  ${f.fgHex} sobre ${f.bgHex}`);
  }
}
const malos = filas.filter((f) => !f.ok);
if (malos.length) {
  console.error(`${malos.length} par(es) sin AA.`);
  process.exit(1);
}
