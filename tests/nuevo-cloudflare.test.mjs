import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import worker from '../worker/nuevo.ts';

const origen = 'https://itinerante.example';
const entorno = { PUBLIC_SITE_ORIGIN: origen };
const visita = (ruta, init, host = origen) => worker.fetch(new Request(host + ruta, init), entorno);
const hash = (texto) => `'sha256-${createHash('sha256').update(texto).digest('base64')}'`;

test('Cloudflare sirve la portada en / con las cabeceras del documento y solo indexa el origen público', async () => {
  const response = await visita('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.match(response.headers.get('permissions-policy'), /payment=\(\), usb=\(\)/);
  assert.equal(response.headers.get('x-robots-tag'), null);
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  const html = await response.text();
  assert.ok(html.includes(`rel="canonical" href="${origen}/"`));
  assert.ok(html.includes(`property="og:url" content="${origen}/"`));
  assert.ok(html.includes(`property="og:image" content="${origen}/assets/img/compartir.jpg"`));
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.ok(!html.includes('name="robots" content="noindex"'));
  assert.match(html, /action="\/#libros"/);
  assert.match(html, /href="\/\?genero=narrativa#libros"/);
  assert.doesNotMatch(html, /(?:href|action)="\/nuevo(?=[?#"])/);
  for (const [, , texto] of html.matchAll(/<(script|style)>([\s\S]*?)<\/\1>/g)) {
    assert.ok(csp.includes(hash(texto)));
  }
  for (const [, texto] of html.matchAll(/\sstyle="([^"]+)"/g)) assert.ok(csp.includes(hash(texto)));
  const preview = await visita('/', undefined, 'https://vista-previa.example');
  assert.equal(preview.headers.get('x-robots-tag'), 'noindex');
});

test('robots y sitemap anuncian la portada canónica solo en el origen público', async () => {
  const robots = await visita('/robots.txt');
  assert.equal(robots.status, 200);
  const robotsTexto = await robots.text();
  assert.match(robotsTexto, /Disallow: \/api\//);
  assert.ok(robotsTexto.includes(`Sitemap: ${origen}/sitemap.xml`));
  const sitemap = await visita('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /^application\/xml/);
  assert.ok((await sitemap.text()).includes(`<loc>${origen}/</loc>`));
  assert.equal(await (await visita('/sitemap.xml', { method: 'HEAD' })).text(), '');
  const preview = 'https://vista-previa.example';
  assert.ok(!(await (await visita('/robots.txt', undefined, preview)).text()).includes('Sitemap:'));
  assert.equal((await visita('/sitemap.xml', undefined, preview)).status, 404);
});

test('Cloudflare redirige las versiones anteriores y permite consultar la carta y el catálogo', async () => {
  for (const ruta of ['/nuevo', '/nuevo/', '/index.html', '/prototypes/anterior', '/_archive/version']) {
    const anterior = await visita(ruta + '?q=poes%C3%ADa');
    assert.equal(anterior.status, 308);
    assert.equal(anterior.headers.get('location'), '/?q=poes%C3%ADa');
  }
  const resultado = await visita('/?q=poes%C3%ADa');
  assert.equal(resultado.headers.get('cache-control'), 'private, no-store');
  const html = await resultado.text();
  assert.match(html, /name="q" value="poesía"/);
  assert.ok(html.includes('id="cafe"'));
  const ficha = await (await visita('/?libro=amigos-rodrigo-garnica')).text();
  assert.ok(ficha.includes('<h2 id="hoja-t">Amigos</h2>'));
  const cabeza = await visita('/', { method: 'HEAD' });
  assert.equal(cabeza.status, 200);
  assert.equal(await cabeza.text(), '');
});

test('el Worker público acepta solo lectura y deja fuera las rutas de prueba', async () => {
  const metodo = await visita('/', { method: 'POST' });
  assert.equal(metodo.status, 405);
  assert.equal(metodo.headers.get('allow'), 'GET, HEAD');
  assert.equal((await visita('/?q=' + 'a'.repeat(4096))).status, 414);
  assert.equal((await visita('/api/catalog')).status, 404);
  assert.equal((await visita('/api/ai/iti-ia')).status, 404);
});
