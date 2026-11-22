// Carrusel 3D de portadas (isla de /nuevo). La pose viene del motor anterior (carousel3d.js, 2026-11-13):
// la central de frente, las vecinas giran y se hunden. Aquí el desplazamiento es por puntero, con inercia,
// y solo se escriben transform y opacity, una vez por fotograma. Con reducir movimiento no hay transform:
// la central se funde. Sin este módulo la cuadrícula del HTML sigue entera.

export function keyTarget(key, actual, n) {
  const to = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: 0, End: n - 1 }[key];
  return to === undefined ? undefined : Math.max(0, Math.min(n - 1, to));
}

/** `d` es la distancia a la central en anchos de pieza. `flat`: solo opacidad, transform none. */
export function coverflowPose(d, { flat = false, w = 1, giro = 44, separa = 0.1, hunde = 0.55, alcance = 2 } = {}) {
  const c = Math.abs(d) < 0.02 ? 0 : Math.max(-4, Math.min(4, d));
  const ac = Math.abs(c);
  const s = c < 0 ? -1 : 1;
  const opacity = ac <= alcance ? 1 : Math.max(0, 1 - (ac - alcance) / 0.6);
  const zIndex = 100 - Math.round(ac * 10);
  if (flat) return { transform: 'none', opacity: ac < 0.5 ? 1 : 0, zIndex, hidden: ac >= 0.5 };
  const near = Math.min(ac, 1);
  const far = Math.max(0, ac - 1);
  const rot = -s * near * giro;
  // Las piezas nacen en el centro: el paso las separa para que las vecinas asomen, y el giro las deja en 3D.
  const tx = s * (ac * 0.78 + near * separa) * w;
  const tz = -(near * hunde + far * hunde * 1.15) * w;
  return {
    transform: `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`,
    opacity,
    zIndex,
    hidden: opacity <= 0.02,
  };
}

function portadaDe(li) {
  return li.querySelector('.libro-portada img');
}

/**
 * Arma el carrusel encima de la cuadrícula, con las portadas reales. `abrir(id)` abre la ficha.
 * Las flechas del teclado valen con el foco en los botones de los lados o en la portada central.
 */
export function montarVitrina(rejilla, { reduce, abrir }) {
  const origen = [...rejilla.querySelectorAll('.libro')].filter(portadaDe);
  if (origen.length < 3) return null;
  const host = document.createElement('div');
  host.className = 'c3d';
  host.setAttribute('role', 'region');
  host.setAttribute('aria-roledescription', 'carrusel');
  host.setAttribute('aria-label', 'Portadas del catálogo');
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'c3d-flecha c3d-flecha--prev';
  prev.setAttribute('aria-label', 'Portada anterior');
  prev.textContent = '‹';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'c3d-flecha c3d-flecha--next';
  next.setAttribute('aria-label', 'Portada siguiente');
  next.textContent = '›';
  const viewport = document.createElement('div');
  viewport.className = 'c3d-viewport';
  const track = document.createElement('div');
  track.className = 'c3d-track';
  const pie = document.createElement('p');
  pie.className = 'c3d-pie';
  const vivo = document.createElement('p');
  vivo.className = 'sr-only';
  vivo.setAttribute('aria-live', 'polite');
  const items = origen.map((li) => {
    const img = portadaDe(li);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'c3d-porta';
    btn.dataset.id = li.id.replace(/^libro-/, '');
    const titulo = li.querySelector('.libro-t')?.textContent?.trim() || '';
    const precio = li.querySelector('.libro-precio')?.textContent?.trim() || '';
    btn.setAttribute('aria-label', precio ? `${titulo}, ${precio}` : titulo);
    btn.tabIndex = -1;
    const pose = document.createElement('span');
    pose.className = 'cf-pose';
    const copia = img.cloneNode(true);
    copia.alt = '';
    copia.loading = 'eager';
    pose.append(copia);
    btn.append(pose);
    const item = document.createElement('div');
    item.className = 'c3d-item';
    item.append(btn);
    item.dataset.titulo = titulo;
    item.dataset.precio = precio;
    track.append(item);
    return item;
  });
  viewport.append(track);
  host.append(prev, viewport, next, pie, vivo);
  rejilla.before(host);

  const n = items.length;
  let pos = Math.floor(n / 2);
  let vel = 0;
  let drag = false;
  let lastX = 0;
  let lastT = 0;
  let raf = 0;
  let ancho = 200;
  let anunciado = -1;

  const medir = () => {
    ancho = items[0]?.offsetWidth || 200;
  };
  const centro = () => Math.max(0, Math.min(n - 1, Math.round(pos)));
  const pintar = () => {
    const alcance = window.innerWidth >= 1100 ? 2 : 1;
    const flat = reduce;
    items.forEach((it, i) => {
      const p = coverflowPose(i - pos, { flat, w: ancho, alcance });
      const pose = it.querySelector('.cf-pose');
      pose.style.transform = p.transform;
      pose.style.opacity = String(p.opacity);
      it.style.zIndex = String(p.zIndex);
      it.classList.toggle('is-centro', i === centro());
      const btn = it.querySelector('button');
      if (btn) btn.tabIndex = i === centro() ? 0 : -1;
    });
    const i = centro();
    const it = items[i];
    pie.textContent = it.dataset.precio ? `${it.dataset.titulo} · ${it.dataset.precio}` : it.dataset.titulo;
    prev.disabled = i <= 0;
    next.disabled = i >= n - 1;
  };
  const anunciar = () => {
    const i = centro();
    if (i === anunciado) return;
    anunciado = i;
    vivo.textContent = pie.textContent;
  };
  const tick = () => {
    raf = 0;
    if (!drag) {
      if (Math.abs(vel) > 0.012) {
        pos += vel;
        vel *= 0.9;
        if (pos < 0 || pos > n - 1) vel *= 0.6;
        pos = Math.max(-0.15, Math.min(n - 1 + 0.15, pos));
      } else {
        const dest = centro();
        const delta = dest - pos;
        if (Math.abs(delta) < 0.004 || reduce) pos = dest;
        else pos += delta * 0.22;
      }
    }
    pintar();
    if (drag || Math.abs(vel) > 0.012 || Math.abs(pos - centro()) > 0.004) raf = requestAnimationFrame(tick);
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const ir = (i, desdeTecla) => {
    pos = Math.max(0, Math.min(n - 1, i));
    vel = 0;
    if (reduce) pintar();
    else pedir();
    if (desdeTecla) anunciar();
  };

  prev.addEventListener('click', () => ir(centro() - 1, true));
  next.addEventListener('click', () => ir(centro() + 1, true));
  host.addEventListener('keydown', (e) => {
    if (!host.contains(document.activeElement)) return;
    const to = keyTarget(e.key, centro(), n);
    if (to === undefined) return;
    e.preventDefault();
    ir(to, true);
  });
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.c3d-porta');
    if (!btn) return;
    const i = items.findIndex((it) => it.contains(btn));
    if (i !== centro()) { ir(i, true); return; }
    abrir(btn.dataset.id);
  });

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || reduce) return;
    drag = true;
    vel = 0;
    lastX = e.clientX;
    lastT = performance.now();
    viewport.setPointerCapture?.(e.pointerId);
    pedir();
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max(16, now - lastT);
    vel = (-dx / ancho) * (16 / dt);
    pos += -dx / ancho;
    lastX = e.clientX;
    lastT = now;
  });
  const soltar = () => { drag = false; pedir(); };
  viewport.addEventListener('pointerup', soltar);
  viewport.addEventListener('pointercancel', soltar);
  addEventListener('resize', () => { medir(); pintar(); });
  medir();
  pintar();
  anunciado = centro();
  requestAnimationFrame(() => { medir(); pintar(); });
  return host;
}
