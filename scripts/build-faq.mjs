// Las preguntas frecuentes de Visita (#visita) pintadas en index.html desde assets/data/faq.json (2026-11-19).
// node scripts/build-faq.mjs          reescribe en index.html lo que va entre <!-- faq:inicio --> y <!-- faq:fin -->
// node scripts/build-faq.mjs --check  sale con 1 si index.html no coincide con faq.json o si el JSON no pasa la revisión (lo corre también npm test)
// Mismo patrón que la carta de Café (scripts/build-carta.mjs): faq.json es la fuente; el HTML llega pintado (details/summary nativos: teclado,
// lector de pantalla y respuesta visible sin JavaScript). Solo se publican respuestas que Aldo ha confirmado: `faqProblems` rechaza los temas
// que aún no (pagos, factura, accesibilidad, estacionamiento, envíos, tarjetas de regalo, apartado, mascotas, edad; ver docs/PENDIENTES-NEGOCIO.md)
// y las palabras que prometerían lo que el sitio no sabe («gratis», «disponible», «en existencia», plazos).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const INDEX_PATH = join(root, 'index.html');
export const FAQ_PATH = join(root, 'assets/data/faq.json');
export const INICIO = '<!-- faq:inicio · generadas desde assets/data/faq.json con `npm run faq`; no se editan a mano -->';
export const FIN = '<!-- faq:fin -->';
export const FAQ_MAX = 7; // Hick: no más de 7 opciones en un grupo

// Lo que el sitio no puede decir todavía (no confirmado por Aldo) ni prometer nunca.
export const PROHIBIDO = [
  [/gratis|gratuit/i, 'promete algo «gratis» (quedarse a leer va con el consumo del café)'],
  [/\bdisponible|existencia|en stock|siempre (lo )?tenemos/i, 'afirma disponibilidad o existencia (se confirma por WhatsApp)'],
  [/d[ií]as? h[aá]biles?|plazo|garantiz|en \d+ d[ií]as/i, 'promete un plazo'],
  [/\bpago|pagar|tarjeta|efectivo|transferencia|factura|\bcfdi\b|\biva\b/i, 'habla de pagos o factura (sin confirmar)'],
  [/estacionamiento|\bparking\b|accesib|silla de ruedas|rampa/i, 'habla de estacionamiento o accesibilidad (sin confirmar)'],
  [/env[ií]o|paqueter|domicilio|mensajer|a todo el pa[ií]s/i, 'habla de envíos (sin confirmar)'],
  [/apart(ar|ado|e)\b|\bmascota|\bperro|\bni[ñn]os\b|\bedad\b|menores|merch|regalo/i, 'habla de apartado, mascotas, edad, merch o tarjetas de regalo (sin confirmar)']
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ENLACE = /\[([^\]\[]+)\]\(#([a-z0-9-]+)\)/g;

/** Las anclas (`#id`) a las que apunta el texto de una respuesta. */
export const anclasDe = respuesta => [...String(respuesta).matchAll(ENLACE)].map(m => m[2]);

/** Los problemas de un faq.json (lista vacía = pasa). `ids`: los id que existen en index.html (opcional: si se da, cada ancla debe existir). */
export function faqProblems(faq, { ids = null } = {}) {
  const out = [];
  if (!faq || typeof faq !== 'object' || !Array.isArray(faq.preguntas)) return ['falta `preguntas` (lista)'];
  if (faq.preguntas.length < 1) out.push('no hay preguntas: quita el bloque de index.html en vez de dejarlo vacío');
  if (faq.preguntas.length > FAQ_MAX) out.push(`${faq.preguntas.length} preguntas; el máximo es ${FAQ_MAX} (Hick)`);
  const vistos = new Set();
  faq.preguntas.forEach((p, i) => {
    const en = `preguntas[${i}]${p && p.id ? ` (${p.id})` : ''}`;
    if (!p || typeof p !== 'object') { out.push(`${en}: no es un objeto`); return; }
    if (typeof p.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) out.push(`${en}: id en minúsculas, cifras y guiones`);
    else if (vistos.has(p.id)) out.push(`${en}: id repetido`); else vistos.add(p.id);
    if (typeof p.pregunta !== 'string' || !/^¿[^?¿]+\?$/.test(p.pregunta.trim())) out.push(`${en}: la pregunta empieza con «¿» y termina con «?»`);
    else if (p.pregunta.length > 60) out.push(`${en}: la pregunta pasa de 60 caracteres (cabe en un renglón del teléfono)`);
    const r = typeof p.respuesta === 'string' ? p.respuesta.trim() : '';
    if (r.length < 20) out.push(`${en}: la respuesta es demasiado corta o falta`);
    if (r.length > 320) out.push(`${en}: la respuesta pasa de 320 caracteres (una idea por respuesta)`);
    const sinEnlaces = r.replace(ENLACE, '$1');
    if (/[<>\[\]()]|\bhttps?:|\bwww\./i.test(sinEnlaces)) out.push(`${en}: solo se permiten enlaces «[texto](#ancla)» a la propia página; nada de HTML ni URL`);
    for (const [re, porque] of PROHIBIDO) if (re.test(`${p.pregunta} ${r}`)) out.push(`${en}: ${porque}`);
    if (ids) for (const a of anclasDe(r)) if (!ids.has(a)) out.push(`${en}: la ancla #${a} no existe en index.html`);
  });
  return out;
}

/** El texto de una respuesta como HTML (escapado, con sus enlaces a anclas). */
export const respuestaHtml = r => esc(r.trim()).replace(/\[([^\]\[]+)\]\(#([a-z0-9-]+)\)/g, (_, t, a) => `<a href="#${a}">${t}</a>`);

/** El marcado del bloque (titular y una `details` por pregunta) con la sangría `ind`; vacío si no hay preguntas válidas. */
export function faqHtml(faq, ind = '      ') {
  if (!faq || faqProblems(faq).length) return `${ind}${INICIO}\n${ind}${FIN}`;
  const item = p => [
    `${ind}    <details class="faq-item" id="faq-${esc(p.id)}">`,
    `${ind}      <summary class="faq-preg"><span>${esc(p.pregunta.trim())}</span><svg class="ic faq-chev" aria-hidden="true"><use href="#i-chev"/></svg></summary>`,
    `${ind}      <div class="faq-resp"><p>${respuestaHtml(p.respuesta)}</p></div>`,
    `${ind}    </details>`
  ];
  return [
    `${ind}${INICIO}`,
    `${ind}<div class="visit-faq faq" data-faq>`,
    `${ind}  <h3 class="faq-tit" id="faq-title">Preguntas frecuentes</h3>`,
    `${ind}  <div class="faq-lista" role="group" aria-labelledby="faq-title">`,
    ...faq.preguntas.flatMap(item),
    `${ind}  </div>`,
    `${ind}</div>`,
    `${ind}${FIN}`
  ].join('\n');
}

/** index.html con el bloque de `faq` entre sus marcas. */
export function withFaq(html, faq) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas de las preguntas frecuentes (<!-- faq:inicio … --> y <!-- faq:fin -->)');
  const lineStart = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(lineStart, a);
  return html.slice(0, lineStart) + faqHtml(faq, ind) + html.slice(b + FIN.length);
}

/** Los id que existen en un HTML (para validar las anclas de las respuestas). */
export const idsDe = html => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(INDEX_PATH, 'utf8');
  const faq = JSON.parse(readFileSync(FAQ_PATH, 'utf8'));
  const problemas = faqProblems(faq, { ids: idsDe(html) });
  if (problemas.length) { console.error(`assets/data/faq.json no pasa la revisión:\n  · ${problemas.join('\n  · ')}`); process.exit(1); }
  const next = withFaq(html, faq);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('Las preguntas frecuentes de index.html no coinciden con assets/data/faq.json. Ejecuta "npm run faq".'); process.exit(1); }
    console.log('preguntas frecuentes al día');
  } else {
    writeFileSync(INDEX_PATH, next);
    console.log(`preguntas frecuentes pintadas en index.html (${faq.preguntas.length})`);
  }
}
