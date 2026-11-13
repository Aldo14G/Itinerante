import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { initCarreta } from '../carreta.js';

const bootSrc = readFileSync(new URL('../assets/js/boot.js', import.meta.url), 'utf8');

function runBoot(env = {}) {
  const classes = new Set();
  const store = new Map(env.store || []);
  const timers = [];
  const frames = [];
  const sessionStorage = {
    getItem(key) {
      if (env.storageThrows) throw new Error('bloqueado');
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (env.storageThrows) throw new Error('bloqueado');
      store.set(key, value);
    },
  };
  const sandbox = {
    scrollY: env.scrollY ?? 0,
    location: { hash: env.hash ?? '' },
    sessionStorage,
    localStorage: { getItem: () => (env.motionOff ? 'off' : null) },
    navigator: {
      connection: env.saveData ? { saveData: true } : {},
      deviceMemory: 8,
      hardwareConcurrency: 8,
    },
    matchMedia: query => ({ matches: Boolean(env.reduce) && String(query).includes('reduce') }),
    performance: { getEntriesByType: () => [{ type: env.nav || 'navigate' }] },
    window: {},
    document: {
      documentElement: {
        classList: {
          add: (...names) => names.forEach(name => classes.add(name)),
          remove: (...names) => names.forEach(name => classes.delete(name)),
          contains: name => classes.has(name),
        },
        dataset: {},
      },
      getElementById: () => ({ remove() {} }),
    },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  };
  sandbox.window = sandbox;
  if (env.opener) sandbox.window.opener = {};
  runInContext(bootSrc, createContext(sandbox));
  return { classes, store, timers, frames, sandbox };
}

test('showCarreta no pone el velo si ya se vio, hay enlace profundo, movimiento reducido o el almacenamiento falla', () => {
  assert.equal(runBoot().classes.has('carreta-on'), true, 'primera visita al inicio');
  assert.equal(runBoot().store.get('iti-carreta-visto'), '1', 'marca la pestaña antes de mostrar');

  assert.equal(runBoot({ store: [['iti-carreta-visto', '1']] }).classes.has('carreta-on'), false, 'ya vista en la pestaña');
  assert.equal(runBoot({ hash: '#libro-x' }).classes.has('carreta-on'), false, 'enlace profundo');
  assert.equal(runBoot({ hash: '#inicio' }).classes.has('carreta-on'), true, '#inicio sí es el inicio');
  assert.equal(runBoot({ reduce: true }).classes.has('carreta-on'), false, 'movimiento reducido');
  assert.equal(runBoot({ saveData: true }).classes.has('carreta-on'), false, 'ahorro de datos');
  assert.equal(runBoot({ motionOff: true }).classes.has('carreta-on'), false, 'pausa del pie');
  assert.equal(runBoot({ storageThrows: true }).classes.has('carreta-on'), false, 'sin almacenamiento no tapa la página');
  assert.equal(runBoot({ scrollY: 480 }).classes.has('carreta-on'), false, 'la página no abre arriba');
  assert.equal(runBoot({ nav: 'back_forward' }).classes.has('carreta-on'), false, 'atrás o adelante');
});

test('una pestaña nueva abierta desde otra no hereda la marca, y una recarga sí', () => {
  const fresh = runBoot({ opener: true, nav: 'navigate', store: [['iti-carreta-visto', '1']] });
  assert.equal(fresh.classes.has('carreta-on'), true, 'la marca copiada no cuenta');

  const reloaded = runBoot({ opener: true, nav: 'reload', store: [['iti-carreta-visto', '1']] });
  assert.equal(reloaded.classes.has('carreta-on'), false, 'la recarga de esa pestaña ya la vio');
});

test('si el scroll se restaura o app.js no arranca, el velo se quita', () => {
  const restored = runBoot();
  restored.sandbox.scrollY = 900;
  restored.frames[0]();
  assert.equal(restored.classes.has('carreta-on'), false, 'scroll restaurado');

  const stuck = runBoot();
  const backstop = stuck.timers.find(timer => timer.ms === 2500);
  assert.ok(backstop, 'hay un respaldo de 2,5 s');
  backstop.fn();
  assert.equal(stuck.classes.has('carreta-on'), false, 'el respaldo destapa la página');
});

function installDocument(on) {
  const classes = new Set(on ? ['carreta-on'] : []);
  const state = { classes, removed: false };
  const layer = {
    removeAttribute() {},
    remove() { state.removed = true; },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = {
    documentElement: {
      classList: {
        contains: name => classes.has(name),
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
      },
    },
    getElementById: id => (id === 'carreta' && !state.removed ? layer : null),
  };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
  globalThis.requestAnimationFrame = fn => setTimeout(() => fn(0), 0);
  return state;
}

test('sin movimiento la carreta no salta y se quita el velo', async () => {
  const state = installDocument(true);
  await initCarreta({ root: globalThis.document.documentElement, motionOn: () => false });
  assert.equal(state.classes.has('carreta-stage-hop'), false);
  assert.equal(state.classes.has('carreta-stage-enter'), false);
  assert.equal(state.classes.has('carreta-on'), false);
  assert.equal(state.removed, true);
});

test('con movimiento la entrada no sigue puesta cuando empieza el saltito', async () => {
  const state = installDocument(true);
  const pending = initCarreta({ root: globalThis.document.documentElement, motionOn: () => true });
  await new Promise(resolve => setTimeout(resolve, 500));
  assert.equal(state.classes.has('carreta-stage-enter'), false, 'la entrada no se repite');
  assert.equal(state.classes.has('carreta-stage-hop'), true, 'está en el saltito');
  await pending;
  assert.equal(state.removed, true);
});
