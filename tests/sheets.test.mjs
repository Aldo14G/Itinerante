// Comportamiento de sheets.js (bloqueo de scroll por contador y botón «atrás») con un documento e historial simulados.
// Se prueba lo que hace, no cómo está escrito: el navegador real lo cubren tools/qa/explorer.mjs y saved.mjs.
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

const classes = new Set();
const listeners = {};
const trail = ['/']; // entradas de historial; `at` es la actual
let at = 0;
let backs = 0;
let deliverBack = true; // false: el navegador no entrega popstate (no había a dónde volver)

globalThis.document = { documentElement: { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } }, body: {}, activeElement: null };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' }); // motion.js cae a sus valores de respaldo
globalThis.location ={ hash: '', pathname: '/', search: '', href: '/' };
globalThis.history = {
  pushState(_s, _t, url) { trail.length = at + 1; trail.push(url); at += 1; },
  replaceState(_s, _t, url) { trail[at] = url; },
  back() { backs += 1; if (!deliverBack) return; at -= 1; queueMicrotask(() => listeners.popstate()); }
};
globalThis.addEventListener = (type, fn) => { listeners[type] = fn; };

const { pushSheet } = await import('../sheets.js');
const flush = () => new Promise(resolve => setImmediate(resolve));
const sheet = (opts = {}) => { const s = { closed: 0 }; s.release = pushSheet({ close: () => { s.closed += 1; }, ...opts }); return s; };

test('el scroll sigue bloqueado hasta que se cierra la última hoja que lo pidió', async () => {
  const a = sheet();
  const b = sheet();
  assert.ok(classes.has('sheet-open'));
  a.release();
  assert.ok(classes.has('sheet-open'), 'queda una hoja abierta: el bloqueo se mantiene');
  b.release();
  assert.ok(!classes.has('sheet-open'));
  await flush();
});

test('cada hoja empuja una entrada y cerrar por botón consume la suya', async () => {
  const start = at;
  const a = sheet({ url: '#explorar' });
  const b = sheet();
  assert.equal(at, start + 2, 'dos hojas, dos entradas');
  assert.equal(trail[start + 1], '#explorar', 'la barra de direcciones muestra la URL de la hoja');
  b.release(); // el botón cerró la de arriba
  await flush();
  assert.equal(at, start + 1, 'su entrada se consumió y la otra hoja sigue en pie');
  a.release();
  await flush();
  assert.equal(at, start);
});

test('«atrás» cierra solo la hoja de arriba y libera su bloqueo', async () => {
  const a = sheet();
  const b = sheet({ lock: 'otro-bloqueo' });
  assert.ok(classes.has('otro-bloqueo'));
  at -= 1; listeners.popstate(); // la persona toca «atrás»
  assert.equal(b.closed, 1);
  assert.equal(a.closed, 0, 'la de abajo no se cierra');
  assert.ok(!classes.has('otro-bloqueo'));
  assert.ok(classes.has('sheet-open'));
  a.release();
  await flush();
  assert.ok(!classes.has('sheet-open'));
});

test('si el navegador no entrega popstate, las hojas siguientes siguen sincronizando el historial', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    deliverBack = false;
    const a = sheet();
    const before = backs;
    a.release(); // pide history.back() y el popstate nunca llega
    assert.equal(backs, before + 1);
    deliverBack = true;
    mock.timers.tick(1500); // pasado el tiempo de espera se olvida la entrada perdida
    const start = at;
    const b = sheet();
    assert.equal(at, start + 1, 'la nueva hoja pudo empujar su entrada');
    b.release();
    await flush();
    assert.equal(at, start);
  } finally {
    mock.timers.reset();
  }
});
