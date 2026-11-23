// Trazo del isotipo (camioneta-trazo.svg), derivado del logo. Se incrusta como <symbol>.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const svg = readFileSync(fileURLToPath(new URL('./camioneta-trazo.svg', import.meta.url)), 'utf8');
const vb = svg.match(/viewBox="([^"]+)"/);
const d = svg.match(/ d="([^"]+)"/);
if (!vb || !d) throw new Error('camioneta-trazo.svg no trae viewBox o trazado');

export const TRAZO_VB = vb[1];
export const TRAZO_D = d[1];
