// Escena de carga (carreta): una vez por pestaña, salvo enlace profundo o movimiento pausado.
import { ms } from './motion.js';

export const SESSION_KEY = 'iti-carreta-visto';

function once(el, type, fn) {
  const wrap = e => { el.removeEventListener(type, wrap); fn(e); };
  el.addEventListener(type, wrap);
}

/** @param {number} duration */
function delay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * @param {{ root: HTMLElement, motionOn: () => boolean }} opts
 * @returns {Promise<void>}
 */
export function initCarreta({ root, motionOn }) {
  const layer = document.getElementById('carreta');
  if (!layer || !root.classList.contains('carreta-on')) return Promise.resolve();

  layer.removeAttribute('hidden');

  const classes = ['carreta-stage-enter', 'carreta-stage-hop', 'carreta-stage-out', 'carreta--reduced'];
  const finish = () => {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* almacenamiento bloqueado */ }
    root.classList.remove('carreta-on', ...classes);
    layer.remove();
  };

  const cap = ms('dur-lenta') + ms('dur-base') + ms('dur-rapida') * 3;
  let guard = setTimeout(finish, cap);

  const complete = () => {
    clearTimeout(guard);
    guard = 0;
    finish();
  };

  return new Promise(resolve => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      complete();
      resolve();
    };

    requestAnimationFrame(() => {
      // Movimiento reducido, pausa o ahorro de datos: la página se queda quieta. El velo no entra ni salta.
      if (!motionOn()) {
        done();
        return;
      }

      root.classList.add('carreta-stage-enter');
      delay(ms('dur-rapida') + ms('escalon-linea')).then(() => {
        root.classList.remove('carreta-stage-enter');
        root.classList.add('carreta-stage-hop');
        return delay(ms('dur-rapida'));
      }).then(() => {
        root.classList.remove('carreta-stage-enter', 'carreta-stage-hop');
        root.classList.add('carreta-stage-out');
        once(layer, 'animationend', done);
        return delay(ms('dur-base') + ms('escalon-linea'));
      }).then(done);
    });
  });
}
