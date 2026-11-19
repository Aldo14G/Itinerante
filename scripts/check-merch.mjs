// Revisa assets/data/merch.json con el disco (2026-11-19): la misma validación de merch.js (merchProblems) más que cada foto exista y esté registrada como real en
// assets/provenance.json. Hoy `productos` está vacío y pasa. Lo corre `npm run merch:check` y lo comprueba tests/contenido.test.mjs.
//   node scripts/check-merch.mjs          sale con 1 y lista los problemas si los hay
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { merchProblems, validMerch } from '../merch.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MERCH_PATH = join(root, 'assets/data/merch.json');

export function problemasDisco(data) {
  const prov = JSON.parse(readFileSync(join(root, 'assets/provenance.json'), 'utf8'));
  const reales = new Set((prov.real || []).map(f => `assets/${f.file}`));
  return merchProblems(data, { fotoExiste: src => existsSync(join(root, src)), fotoRegistrada: src => reales.has(src) });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(readFileSync(MERCH_PATH, 'utf8'));
  const problemas = problemasDisco(data);
  if (problemas.length) { console.error(`assets/data/merch.json no pasa la revisión:\n  · ${problemas.join('\n  · ')}`); process.exit(1); }
  const n = validMerch(data).length;
  console.log(n ? `merch al día: ${n} producto${n === 1 ? '' : 's'} (la sección aparece sola en el sitio)` : 'merch al día: sin productos (la sección #merch no existe en el sitio)');
}
