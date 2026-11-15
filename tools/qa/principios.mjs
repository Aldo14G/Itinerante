// Auditor de calidad: los 20 principios de UX y animación (skill `auditor-calidad`), aterrizados en este sitio.
// Corre lo que se puede medir (comprobaciones estáticas del CSS y los tokens, y el arnés de tools/qa) y deja
// señalado, principio por principio, lo que hay que mirar a ojo. No sustituye a la revisión: la ordena.
//
// Uso: node tools/qa/principios.mjs [--rapido | --completo] [--url=URL] [--dir=DIR] [--solo=1,9,17]
//   sin --url levanta su propia vista previa (QA_PORT, por omisión 8598) y la detiene al terminar.
//   --rapido: solo lo estático, `motion` y `controles` (≈ 1 min).  --completo: `guias` en sus siete perfiles.
//   --dir: carpeta de trabajo (capturas de los scripts, principios.json y principios.md). Por omisión, una temporal.
// Sale con 1 si alguna comprobación automática falla. CHROME_PATH cambia el navegador, como en el resto del arnés.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..', '..');
const arg = n => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const has = n => process.argv.includes(`--${n}`);
const RAPIDO = has('rapido'), COMPLETO = has('completo');
const SOLO = arg('solo') ? new Set(arg('solo').split(',').map(Number)) : null;
const DIR = arg('dir') ? resolve(arg('dir')) : mkdtempSync(join(tmpdir(), 'iti-principios-'));
mkdirSync(DIR, { recursive: true });

// ---- La norma: techos y pisos que salen del sistema Líquido (DESIGN.md, «Movimiento» y «Carrusel3D») ----
export const NORMA = {
  escala: [0.9, 1.06],            // 1 y 10 · ninguna pieza se encoge por debajo de 0.9 ni crece más de 1.06
  linealPermitido: ['casa-enfoque'], // 6 · `linear` solo en lo que va atado al scroll (animation-timeline)
  giroMax: 45, inclinacionMax: 8, adelantoMax: 16, // 11 · techos de la profundidad (hoy 44°, 6° y 12 px)
};

// ---- Los 20 principios: qué herramienta los mide y qué se mira a ojo ----
export const PRINCIPIOS = [
  [1, 'Squash & stretch', 'Compresión al toque', ['est:escalas', 'motion'], 'Al presionar, ¿la pieza cede y vuelve sin deformar texto ni foto?'],
  [2, 'Anticipation', 'Aviso antes de la acción', ['componentes', 'skeleton'], '¿Cada control avisa antes (hover, foco, presionado) y cada carga muestra su esqueleto?'],
  [3, 'Staging', 'Un foco por vista', ['critique', 'carrusel', 'guias'], '¿Se sabe en un segundo qué es lo principal de cada vista?'],
  [4, 'Pose to pose', 'Estados con nombre', ['pruebas', 'carrusel'], '¿Toda animación va de un estado declarado a otro, y sin movimiento aparece ya en el final?'],
  [5, 'Follow through', 'Asentarse sin oscilar', ['est:bucles', 'motion'], '¿Lo que llega se asienta una sola vez (rebote ≤ 5 %) y nada sigue moviéndose solo?'],
  [6, 'Slow in & slow out', 'Curvas del sistema', ['est:curvas', 'motion'], '¿Las entradas frenan al llegar y nada arranca ni para en seco?'],
  [7, 'Arcs', 'Trayectorias en arco', ['carrusel'], '¿Las piezas del carrusel giran en arco y las hojas suben rectas, como en iOS?'],
  [8, 'Secondary action', 'Acción secundaria', ['saved', 'rail'], '¿La palomita, el conector o el brillo acompañan sin retrasar ni tapar la respuesta principal?'],
  [9, 'Timing', 'Duraciones de la escala', ['est:duraciones', 'motion'], '¿Las respuestas al toque se sienten inmediatas y las salidas más cortas que las entradas?'],
  [10, 'Exaggeration', 'Respuesta clara', ['est:escalas', 'saved', 'componentes'], '¿Cada acción que cambia algo lo dice en dos canales (forma y texto), sin sacudidas ni confeti?'],
  [11, 'Solid drawing', 'Volumen coherente en 3D', ['est:profundidad', 'carrusel'], '¿Una sola perspectiva y una sola luz, sin piezas encimadas, y plano con la misma geometría sin movimiento?'],
  [12, 'Appeal', 'Atractivo del conjunto', ['piso'], 'Rúbrica visual (docs/agentes/rubrica-visual.md): promedio ≥ 8 y nada bajo 7.'],
  [13, "Fitts's law", 'Grande y cerca', ['controles', 'iphone', 'guias'], '¿La acción principal queda al alcance del pulgar y junto a lo que explica?'],
  [14, 'Bigger hit areas', 'Zonas de toque amplias', ['controles', 'axe'], '¿Algún control se ve pequeño y además toca pequeño? ¿Hay ≥ 8 px entre vecinos?'],
  [15, "Hick's law", 'Pocas opciones a la vez', ['critique', 'feed'], '¿Una sola primaria por vista y grupos de ≤ 7 opciones?'],
  [16, "Miller's law", 'Bloques de 3 a 5', ['carrusel', 'explorer'], '¿Lo que se ve de un golpe cabe en la memoria (≤ 5 piezas, listas agrupadas)?'],
  [17, 'Doherty threshold', 'Respuesta bajo 400 ms', ['inp', 'skeleton', 'e2e'], '¿Algo tarda sin avisar? ¿El primer contenido aparece sin saltos?'],
  [18, "Postel's law", 'Tolerante al recibir', ['est:postel', 'explorer', 'pruebas'], '¿La búsqueda perdona acentos y mayúsculas, y un dato roto cae a un estado digno?'],
  [19, "Jakob's law", 'Patrones conocidos', ['e2e', 'explorer'], '¿Se usa como las apps que la gente ya conoce (barra inferior, hoja, ☰, atrás, Escape)?'],
  [20, 'Frequency of use', 'Lo frecuente, a un toque', ['feed', 'iphone'], '¿«Cómo llegar», Catálogo y Mi lista están a un toque desde cualquier punto, y lo raro no ocupa el lugar principal?'],
].map(([n, en, es, medidas, ojo]) => ({ n, en, es, medidas, ojo }));

// ---- Comprobaciones estáticas ----
const css = ['style.css', 'mobile.css'].map(f => [f, readFileSync(join(root, f), 'utf8')]);
const lineOf = (txt, i) => txt.slice(0, i).split('\n').length;

export const ESTATICAS = {
  escalas() {
    const bad = [];
    for (const [f, t] of css) for (const m of t.matchAll(/scale\(\s*([0-9.]+)\s*\)|scale:\s*([0-9.]+)/g)) {
      const v = Number(m[1] ?? m[2]);
      if (v < NORMA.escala[0] || v > NORMA.escala[1]) bad.push(`${f}:${lineOf(t, m.index)} escala ${v} fuera de ${NORMA.escala.join('–')}`);
    }
    return bad;
  },
  curvas() {
    const bad = [];
    for (const [f, t] of css) for (const m of t.matchAll(/(transition|animation)(-timing-function)?\s*:[^;{}]*/g)) {
      const d = m[0];
      if (/\b(ease|ease-in|ease-out|ease-in-out)\b/.test(d)) bad.push(`${f}:${lineOf(t, m.index)} curva genérica: ${d.slice(0, 70)}`);
      else if (/\blinear\b(?!\()/.test(d) && !NORMA.linealPermitido.some(k => d.includes(k))) bad.push(`${f}:${lineOf(t, m.index)} lineal: ${d.slice(0, 70)}`);
    }
    return bad;
  },
  duraciones() {
    const bad = [];
    for (const [f, t] of css) for (const m of t.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)) {
      if (!['0s', '0ms', '0.01ms'].includes(m[1] + m[2])) bad.push(`${f}:${lineOf(t, m.index)} duración a mano: ${m[0]}`);
    }
    return bad;
  },
  bucles() {
    const bad = [];
    for (const [f, t] of css) for (const m of t.matchAll(/\binfinite\b/g)) bad.push(`${f}:${lineOf(t, m.index)} animación infinita`);
    return bad;
  },
  profundidad() {
    const p = JSON.parse(readFileSync(join(root, 'design', 'tokens.json'), 'utf8')).scales?.profundidad ?? {};
    const num = k => parseFloat(p[k]);
    const bad = [];
    if (!(num('giro-carrusel') <= NORMA.giroMax)) bad.push(`giro-carrusel ${p['giro-carrusel']} > ${NORMA.giroMax}°`);
    if (!(num('inclinacion-max') <= NORMA.inclinacionMax)) bad.push(`inclinacion-max ${p['inclinacion-max']} > ${NORMA.inclinacionMax}°`);
    if (!(num('adelanto-profundidad') <= NORMA.adelantoMax)) bad.push(`adelanto-profundidad ${p['adelanto-profundidad']} > ${NORMA.adelantoMax} px`);
    return bad;
  },
  async postel() {
    const bad = [];
    try {
      const { norm } = await import(pathToFileURL(join(root, 'catalog.js')).href);
      for (const [a, b] of [['  LOMELÍ ', 'lomeli'], ['Poesía', 'poesia'], ['ñandú', 'nandu']]) if (norm(a) !== b) bad.push(`norm(${JSON.stringify(a)}) = ${JSON.stringify(norm(a))}, se esperaba ${JSON.stringify(b)}`);
    } catch (e) { bad.push(`no se pudo cargar norm() de catalog.js: ${e.message}`); }
    return bad;
  },
};

// ---- Arnés: cada herramienta se corre una vez ----
const HERRAMIENTAS = {
  motion: u => ['tools/qa/motion.mjs', u], controles: u => ['tools/qa/controles.mjs', u, DIR], carrusel: u => ['tools/qa/carrusel.mjs', u, DIR],
  iphone: u => ['tools/qa/iphone.mjs', u, DIR], skeleton: u => ['tools/qa/skeleton.mjs', u], saved: u => ['tools/qa/saved.mjs', u],
  rail: u => ['tools/qa/rail.mjs', u, DIR], piso: u => ['tools/qa/piso.mjs', u], axe: u => ['tools/qa/axe.mjs', u], feed: u => ['tools/qa/feed.mjs', u, DIR],
  explorer: u => ['tools/qa/explorer.mjs', u], inp: u => ['tools/qa/inp.mjs', u], e2e: u => ['tools/qa/e2e.mjs', u, DIR],
  guias: u => ['tools/qa/guias.mjs', u, join(DIR, 'guias'), ...(COMPLETO ? [] : ['--perfiles=iphone16,d1440']), '--capturas=no'],
  critique: () => ['scripts/critique.mjs'], componentes: () => ['--test', 'tests/componentes.test.mjs'],
  pruebas: () => ['--test', 'tests/'],
};
const SIN_NAVEGADOR = new Set(['critique', 'componentes', 'pruebas']);
const SOLO_RAPIDO = new Set(['motion', 'controles', 'critique', 'componentes']);

function correr(nombre, url) {
  const [script, ...rest] = HERRAMIENTAS[nombre](url);
  const args = script.startsWith('--') ? [script, ...rest.map(r => join(root, r))] : [join(root, script), ...rest];
  const res = spawnSync(process.execPath, args, { cwd: SIN_NAVEGADOR.has(nombre) ? root : DIR, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  if (nombre === 'guias' && res.status === 2) return { ok: null, nota: 'Playwright no disponible' };
  const n = /(?:FALLAN|FAIL|FALLOS)\s+(\d+)/.exec(out);
  const mal = res.status !== 0 || (n && Number(n[1]) > 0) || /^FALLA:/m.test(out) || /^# fail [1-9]/m.test(out);
  const lineas = out.trim().split('\n').filter(Boolean);
  return { ok: !mal, nota: (lineas.filter(l => /^(✗|FALLA|not ok)/.test(l)).slice(0, 4).join(' | ') || lineas.at(-1) || '').slice(0, 220) };
}

async function vistaPrevia() {
  if (arg('url')) return { url: arg('url'), stop() {} };
  const PORT = process.env.QA_PORT || '8598';
  const url = `http://127.0.0.1:${PORT}/`;
  const server = spawn(process.execPath, [join(root, 'tools', 'preview-site.mjs')], { cwd: root, env: { ...process.env, PORT }, stdio: 'ignore' });
  const stop = () => server.kill();
  process.on('exit', stop);
  for (let i = 0; i < 50; i += 1) {
    try { if ((await fetch(url)).ok) return { url, stop }; } catch { /* aún no escucha */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`la vista previa no respondió en ${url}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const lista = PRINCIPIOS.filter(p => !SOLO || SOLO.has(p.n));
  const medidas = [...new Set(lista.flatMap(p => p.medidas))];
  const res = {};
  for (const m of medidas.filter(x => x.startsWith('est:'))) { const bad = await ESTATICAS[m.slice(4)](); res[m] = { ok: bad.length === 0, nota: bad.slice(0, 4).join(' | ') }; }
  const dinamicas = medidas.filter(x => !x.startsWith('est:') && (!RAPIDO || SOLO_RAPIDO.has(x)));
  const prev = dinamicas.some(x => !SIN_NAVEGADOR.has(x)) ? await vistaPrevia() : { url: '', stop() {} };
  try {
    for (const m of dinamicas) { process.stderr.write(`· ${m}…\n`); res[m] = correr(m, prev.url); }
  } finally { prev.stop(); }

  const marca = m => (res[m] ? (res[m].ok === null ? `– ${m}` : `${res[m].ok ? '✓' : '✗'} ${m}`) : `· ${m}`);
  const filas = lista.map(p => {
    const rs = p.medidas.map(m => res[m]).filter(Boolean);
    const estado = rs.some(r => r.ok === false) ? 'FALLA' : rs.some(r => r.ok) ? 'medido' : 'sin medir';
    return { ...p, estado, detalle: p.medidas.map(marca).join(' '), fallos: p.medidas.filter(m => res[m]?.ok === false).map(m => `${m}: ${res[m].nota}`) };
  });
  const md = ['| # | Principio | Aquí | Estado | Mediciones | A ojo |', '|---|---|---|---|---|---|',
    ...filas.map(f => `| ${f.n} | ${f.en} | ${f.es} | ${f.estado} | ${f.detalle} | ${f.ojo} |`)].join('\n');
  const fallan = filas.filter(f => f.estado === 'FALLA');
  console.log(md);
  console.log(`\n✓ pasa · ✗ falla · – no disponible · · no corrida en este modo${RAPIDO ? ' (--rapido)' : ''}`);
  for (const f of fallan) console.log(`\n✗ ${f.n} ${f.en}\n  ${f.fallos.join('\n  ')}`);
  console.log(`\nPRINCIPIOS: ${filas.filter(f => f.estado === 'medido').length} medidos en verde, FALLAN ${fallan.length}, ${filas.filter(f => f.estado === 'sin medir').length} sin medir. La columna «A ojo» sigue pendiente: es la mitad de la auditoría.`);
  writeFileSync(join(DIR, 'principios.json'), JSON.stringify({ fecha: new Date().toISOString(), modo: RAPIDO ? 'rapido' : COMPLETO ? 'completo' : 'normal', norma: NORMA, resultados: res, filas }, null, 2));
  writeFileSync(join(DIR, 'principios.md'), `${md}\n`);
  console.log(`Salida en ${DIR}`);
  process.exit(fallan.length ? 1 : 0);
}
