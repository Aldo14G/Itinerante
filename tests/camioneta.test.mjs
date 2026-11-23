// Comprobaciones en el navegador de «La camioneta» v4.2 (axe, gestos, peso, centro, capturas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { GET } from '../src/app/nuevo/route.ts';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const artefactos = '/opt/cursor/artifacts/camioneta';
const tipos = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
};

function servir() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/nuevo' || url.pathname === '/nuevo/') {
        const respuesta = await GET(new Request(`http://127.0.0.1${req.url}`));
        let body = Buffer.from(await respuesta.arrayBuffer());
        const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
        if ((req.headers['accept-encoding'] || '').includes('gzip')) {
          body = gzipSync(body);
          headers['content-encoding'] = 'gzip';
        }
        headers['content-length'] = String(body.length);
        res.writeHead(200, headers);
        res.end(body);
        return;
      }
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (!rel || rel.split('/').includes('..')) { res.writeHead(404); res.end(); return; }
      const file = resolve(raiz, rel);
      if (!file.startsWith(resolve(raiz) + sep) && file !== resolve(raiz)) { res.writeHead(404); res.end(); return; }
      const data = await readFile(file);
      const gz = ['.svg', '.js', '.css', '.json', '.html'].includes(extname(file)) && (req.headers['accept-encoding'] || '').includes('gzip');
      const body = gz ? gzipSync(data) : data;
      res.writeHead(200, {
        'content-type': tipos[extname(file)] || 'application/octet-stream',
        'content-length': String(body.length),
        ...(gz ? { 'content-encoding': 'gzip' } : {}),
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404); res.end();
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, puerto: server.address().port })));
}

async function peso(page, url) {
  const sesion = await page.context().newCDPSession(page);
  await sesion.send('Network.enable');
  let bytes = 0;
  const hosts = new Set();
  sesion.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength || 0; });
  sesion.on('Network.responseReceived', (e) => { try { hosts.add(new URL(e.response.url).host); } catch { /* data: */ } });
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  return { bytes, hosts: [...hosts], errores };
}

test('navegador: axe, centro, gestos, peso y capturas', async () => {
  await mkdir(artefactos, { recursive: true });
  const { server, puerto } = await servir();
  const base = `http://127.0.0.1:${puerto}/nuevo`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const fallos = [];
  const anotar = (nombre, ok, detalle) => { if (!ok) fallos.push(`${nombre}: ${detalle}`); };
  try {
    const escritorio = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const movil = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const reducido = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

    // Peso a 390, al cargar.
    const pPeso = await movil.newPage();
    const carga = await peso(pPeso, base);
    anotar('peso al cargar', carga.bytes <= 700 * 1024, `${carga.bytes} B`);
    anotar('hosts externos', carga.hosts.every((h) => h.startsWith('127.0.0.1')), carga.hosts.join(','));
    anotar('consola al cargar', carga.errores.length === 0, carga.errores.join(' | '));
    const cls = await pPeso.evaluate(() => new Promise((ok) => {
      let v = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => ok(v), 400);
    }));
    anotar('CLS', cls < 0.01, String(cls));

    // Recorrer y volver a medir en una página nueva.
    const pRec = await movil.newPage();
    const recorrido = await peso(pRec, base);
    await pRec.evaluate(async () => {
      const paso = () => new Promise((ok) => {
        scrollBy(0, innerHeight * 0.8);
        requestAnimationFrame(() => setTimeout(ok, 40));
      });
      for (let i = 0; i < 30 && scrollY + innerHeight < document.documentElement.scrollHeight - 2; i++) await paso();
    });
    await pRec.waitForLoadState('networkidle').catch(() => {});
    const tras = await pRec.evaluate(() => performance.getEntriesByType('resource').reduce((n, e) => n + (e.transferSize || 0), 0) + performance.getEntriesByType('navigation')[0].transferSize);
    anotar('peso tras recorrer', tras <= 700 * 1024, `${tras} B (recorrido base ${recorrido.bytes})`);

    async function axe(page, etiqueta) {
      await page.addScriptTag({ path: resolve(raiz, 'node_modules/axe-core/axe.min.js') });
      const violaciones = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
        return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, t: v.nodes[0]?.target?.join(' '), h: (v.nodes[0]?.html || '').slice(0, 140) }));
      });
      anotar(`axe ${etiqueta}`, violaciones.length === 0, JSON.stringify(violaciones));
    }

    const pA = await escritorio.newPage();
    await pA.goto(base, { waitUntil: 'networkidle' });
    await axe(pA, '1440');
    const pM = await movil.newPage();
    await pM.goto(base, { waitUntil: 'networkidle' });
    await axe(pM, '390');
    const pR = await reducido.newPage();
    await pR.goto(base, { waitUntil: 'networkidle' });
    await axe(pR, '1440 reducido');
    const pRM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: true, isMobile: true });
    const pRMp = await pRM.newPage();
    await pRMp.goto(base, { waitUntil: 'networkidle' });
    await axe(pRMp, '390 reducido');

    // Centro de la camioneta.
    for (const [page, nombre] of [[pA, '1440'], [pM, '390']]) {
      const d = await page.evaluate(() => {
        const r = document.querySelector('.camion').getBoundingClientRect();
        return { dx: Math.abs(r.left + r.width / 2 - innerWidth / 2), dy: Math.abs(r.top + r.height / 2 - innerHeight / 2), w: r.width };
      });
      anotar(`centro ${nombre}`, d.dx <= 4 && d.dy <= 4, `Δx ${d.dx.toFixed(2)} Δy ${d.dy.toFixed(2)} ancho ${d.w.toFixed(0)}`);
    }

    // Vitrina plana con reduce.
    const plano = await pR.evaluate(() => {
      const p = document.querySelector('#escenario .pieza');
      return p ? getComputedStyle(p).transform : 'no';
    });
    anotar('reduce sin giro', !/matrix3d/.test(plano) || !plano.includes('rotate'), plano);

    // Visita a 390.
    const visitaTop = await pM.evaluate(() => document.getElementById('visita').getBoundingClientRect().top + scrollY);
    anotar('visita ≤ 6000', visitaTop <= 6000, String(Math.round(visitaTop)));

    // Primera fila con portada y placeholder sin título.
    const fila = await pA.evaluate(() => {
      const cards = [...document.querySelectorAll('#rejilla > li:not(.fuera) article')].slice(0, 4);
      return cards.map((a) => ({ img: !!a.querySelector('.portada-libro img'), ph: a.querySelector('.sin-portada')?.textContent || '' }));
    });
    anotar('primera fila 1440', fila.length === 4 && fila.every((c) => c.img), JSON.stringify(fila));
    const filaM = await pM.evaluate(() => [...document.querySelectorAll('#rejilla > li:not(.fuera) .portada-libro img')].slice(0, 4).length);
    anotar('primeros 4 a 390', filaM === 4, String(filaM));

    // Mostrar más y foco.
    const antes = await pM.evaluate(() => document.querySelector('#mas-boton').textContent);
    anotar('mostrar más', /Mostrar más \(\d+ restantes?\)/.test(antes), antes);
    const foco = await pM.evaluate(() => {
      const boton = document.querySelector('#mas-boton');
      boton.click();
      const activo = document.activeElement;
      return { tag: activo?.tagName, enRejilla: !!activo?.closest?.('#rejilla') };
    });
    anotar('foco al nuevo', foco.tag === 'A' && foco.enRejilla, JSON.stringify(foco));

    // Filtro + URL.
    await pA.evaluate(() => document.querySelector('#q').focus());
    const anillo = await pA.evaluate(() => getComputedStyle(document.querySelector('#q')).outlineWidth);
    anotar('foco buscador', parseFloat(anillo) >= 3, anillo);
    await pA.fill('#q', 'los');
    await pA.waitForTimeout(250);
    await pA.click('a.pildora[data-v="poesia"]');
    await pA.waitForTimeout(700);
    const url = new URL(pA.url());
    anotar('url q', url.searchParams.get('q') === 'los', url.search);
    anotar('url genero', (url.searchParams.get('genero') || '').includes('poesia'), url.search);
    const n = await pA.locator('#conteo').innerText();
    anotar('conteo poesía+los', /^\d+ libro/.test(n) && !n.startsWith('41'), n);

    // FLIP: ninguna portada visible fuera de #resultados.
    await pA.click('a.quitar-todo, #limpiar');
    await pA.waitForTimeout(600);
    await pA.evaluate(() => { document.querySelector('#q').value = ''; });
    const fuera = await pA.evaluate(() => new Promise((ok) => {
      const muestras = [];
      const t0 = performance.now();
      const caja = () => document.querySelector('#resultados').getBoundingClientRect();
      const top0 = caja().top;
      const marco = () => {
        const parent = caja();
        let visibles = 0;
        for (const im of document.querySelectorAll('#rejilla .portada-libro img, #rejilla .sin-portada')) {
          const b = im.getBoundingClientRect();
          if (b.width < 2 || b.height < 2) continue;
          const st = getComputedStyle(im);
          if (st.visibility === 'hidden' || Number(st.opacity) === 0) continue;
          const ix = Math.min(b.right, parent.right) - Math.max(b.left, parent.left);
          const iy = Math.min(b.bottom, parent.bottom) - Math.max(b.top, parent.top);
          const asoma = b.top < parent.top - 1 || b.bottom > parent.bottom + 1 || b.left < parent.left - 1 || b.right > parent.right + 1;
          const recorte = getComputedStyle(document.querySelector('#resultados')).overflow;
          if (asoma && ix > 1 && iy > 1 && recorte !== 'clip' && recorte !== 'hidden') visibles++;
        }
        muestras.push({ top: parent.top - top0, visibles, overflow: getComputedStyle(document.querySelector('#resultados')).overflow });
        if (performance.now() - t0 < 900) requestAnimationFrame(marco);
        else ok(muestras);
      };
      requestAnimationFrame(marco);
      document.querySelector('a.pildora[data-v="poesia"]').click();
    }));
    anotar('flip sin salirse', fuera.every((m) => m.visibles === 0), JSON.stringify(fuera.filter((m) => m.visibles)));
    anotar('flip Δ inicio', Math.max(...fuera.map((m) => Math.abs(m.top))) <= 8, String(Math.max(...fuera.map((m) => Math.abs(m.top)))));

    // Gestos.
    await pA.evaluate(() => document.getElementById('destacados').scrollIntoView({ behavior: 'instant' }));
    await pA.waitForTimeout(150);
    const cont0 = await pA.locator('#v-cont').innerText();
    const box = await pA.locator('#vitrina').boundingBox();
    await pA.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await pA.mouse.down();
    await pA.mouse.move(box.x + box.width / 2 - 180, box.y + box.height / 2, { steps: 12 });
    await pA.mouse.up();
    await pA.waitForTimeout(700);
    const cont1 = await pA.locator('#v-cont').innerText();
    const n0 = Number(cont0.split(' ')[0]);
    const n1 = Number(cont1.split(' ')[0]);
    anotar('arrastre 180 = 1', n1 === n0 + 1 || n1 === n0 - 1, `${cont0} → ${cont1}`);
    const y0 = await pA.evaluate(() => scrollY);
    await pA.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await pA.mouse.wheel(0, 400);
    await pA.waitForTimeout(200);
    const y1 = await pA.evaluate(() => scrollY);
    anotar('rueda mueve la página', y1 > y0 + 50, `${y0} → ${y1}`);

    // Toque en 390.
    await pM.evaluate(() => document.getElementById('destacados').scrollIntoView({ behavior: 'instant' }));
    await pM.waitForTimeout(200);
    const cta = await pM.locator('#v-cont').innerText();
    const vb = await pM.locator('#vitrina').boundingBox();
    const sesion = await pM.context().newCDPSession(pM);
    const cx = vb.x + vb.width / 2; const cy = vb.y + vb.height / 2;
    for (const pasos of [8, 1]) {
      const antesT = Number((await pM.locator('#v-cont').innerText()).split(' ')[0]);
      await sesion.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      for (let i = 1; i <= pasos; i++) {
        await sesion.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - (180 * i) / pasos, y: cy }] });
      }
      await sesion.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await pM.waitForTimeout(pasos === 1 ? 200 : 700);
      const despues = Number((await pM.locator('#v-cont').innerText()).split(' ')[0]);
      anotar(`toque 180 (${pasos === 1 ? 'rápido' : 'lento'})`, Math.abs(despues - antesT) === 1, `${antesT} → ${despues} (inicio ${cta})`);
    }
    const sy0 = await pM.evaluate(() => scrollY);
    await sesion.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
    await sesion.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - 220 }] });
    await sesion.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pM.waitForTimeout(300);
    const sy1 = await pM.evaluate(() => scrollY);
    anotar('swipe vertical', sy1 > sy0 + 40, `${sy0} → ${sy1}`);

    // Foco de la vitrina.
    await pA.evaluate(() => document.querySelector('#vitrina').scrollIntoView({ behavior: 'instant', block: 'center' }));
    for (let i = 0; i < 40; i++) {
      await pA.keyboard.press('Tab');
      const id = await pA.evaluate(() => document.activeElement && document.activeElement.id);
      if (id === 'vitrina') break;
    }
    await pA.waitForTimeout(300);
    const focoV = await pA.evaluate(() => {
      const s = getComputedStyle(document.querySelector('#vitrina'));
      const pista = getComputedStyle(document.querySelector('#vitrina .pista'));
      return { w: s.outlineWidth, c: s.outlineColor, op: pista.opacity };
    });
    anotar('anillo vitrina', parseFloat(focoV.w) >= 3 && Number(focoV.op) > 0.9, JSON.stringify(focoV));

    // Capturas.
    const secciones = [['inicio', '#inicio'], ['eventos', '#eventos'], ['destacados', '#destacados'], ['catalogo', '#libros'], ['tienda', '#tienda'], ['visita', '#visita']];
    for (const [pagina, nombre, ancho] of [[pA, '1440', 1440], [pM, '390', 390], [pR, '1440-reducido', 1440]]) {
      for (const [id, sel] of secciones) {
        await pagina.evaluate((s) => document.querySelector(s).scrollIntoView(), sel);
        await pagina.waitForTimeout(200);
        await pagina.screenshot({ path: `${artefactos}/${nombre}-${id}.png` });
      }
    }
    await pM.evaluate(() => document.querySelector('#abrir-filtros').click());
    await pM.waitForTimeout(500);
    await pM.screenshot({ path: `${artefactos}/390-hoja-filtros.png` });

    // Video del movimiento.
    const videoCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: artefactos, size: { width: 1440, height: 900 } } });
    const pv = await videoCtx.newPage();
    await pv.goto(base, { waitUntil: 'networkidle' });
    await pv.waitForTimeout(1400);
    await pv.evaluate(() => document.getElementById('destacados').scrollIntoView({ behavior: 'instant' }));
    const bv = await pv.locator('#vitrina').boundingBox();
    await pv.mouse.move(bv.x + bv.width / 2, bv.y + bv.height / 2);
    await pv.mouse.down();
    await pv.mouse.move(bv.x + bv.width / 2 - 180, bv.y + bv.height / 2, { steps: 10 });
    await pv.mouse.up();
    await pv.waitForTimeout(800);
    await pv.evaluate(() => document.getElementById('libros').scrollIntoView({ behavior: 'instant' }));
    await pv.click('a.pildora[data-v="poesia"]');
    await pv.waitForTimeout(600);
    await pv.fill('#q', 'los');
    await pv.waitForTimeout(400);
    await pv.click('#aplicados .quitar-todo');
    await pv.waitForTimeout(500);
    await pv.click('#q-borrar');
    await pv.waitForTimeout(400);
    await pv.selectOption('#orden', 'precio-asc');
    await pv.waitForTimeout(600);
    await pv.click('#vista-lista');
    await pv.waitForTimeout(600);
    await pv.click('#mas-boton');
    await pv.waitForTimeout(500);
    await pv.click('#rejilla article h3 a');
    await pv.waitForTimeout(900);
    await pv.click('#hoja-cerrar');
    await pv.waitForTimeout(400);
    const video = pv.video();
    await videoCtx.close();
    const videoPath = await video.path();
    const destino = `${artefactos}/movimiento-1440.webm`;
    const { rename } = await import('node:fs/promises');
    await rename(videoPath, destino);
    const tam = await stat(destino);
    anotar('video', tam.size > 10000, `${tam.size} B`);

    await escritorio.close(); await movil.close(); await reducido.close(); await pRM.close();
  } finally {
    await browser.close();
    await new Promise((ok) => server.close(ok));
  }
  assert.deepEqual(fallos, [], fallos.join('\n'));
});
