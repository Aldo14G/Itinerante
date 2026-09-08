// Run against the complete local stack; uses a real browser, media and API.
// PLAYWRIGHT_MODULE may point to an already installed Playwright module.
import { strict as assert } from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.SITE_BASE_URL || 'http://127.0.0.1:8080';
const output = '.tmp-audit/local-fix';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['tablet', 820, 700], ['landscape', 844, 390], ['small', 320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'getBattery', { value: async () => ({ charging: true, level: 1 }) });
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
    const result = { name, seeks: [] };
    for (const progress of [.2, .8, .35]) {
      const start = Date.now();
      await page.evaluate(p => {
        const root = document.querySelector('[data-scroll-scrub]');
        const stage = root.querySelector('.scroll-scrub__stage');
        const top = root.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + (root.offsetHeight - stage.clientHeight) * p, behavior: 'instant' });
      }, progress);
      await page.waitForFunction(p => {
        const video = document.querySelector('video');
        const eased = .88 * p + .12 * (4 * (p - .5) ** 3 + .5);
        return !video.seeking && video.readyState >= 2 && Math.abs(video.currentTime - eased * video.duration * .999) < .05;
      }, progress, { timeout: 8000 });
      result.seeks.push(Date.now() - start);
    }
    await page.waitForFunction(() => document.querySelector('#bookGrid').getAttribute('aria-busy') === 'false');
    assert.ok(await page.locator('.book-card').count(), `${name}: catalog not loaded`);
    for (const id of ['inicio', 'experiencia', 'eventos', 'galeria', 'catalogo', 'ubicacion']) {
      await page.locator(`#${id}`).evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}/${id}: overflow`);
    }
    await page.locator('#experiencia').evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
    assert.equal(await page.locator('.site-header').evaluate(e => e.getBoundingClientRect().top === 0 && e.getBoundingClientRect().bottom > 0), true, 'header is not sticky and visible');
    assert.equal(await page.locator('.site-nav').evaluate(e => e.getBoundingClientRect().height > 0), true, 'unified navigation is not visible');
    assert.equal(await page.locator('.scroll-scrub__stage').evaluate(e => Math.abs(e.clientHeight - innerHeight) < 2), true, 'stage differs from viewport');
    await page.screenshot({ path: `${output}/${name}-story.png` });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `${output}/${name}-home.png` });
    if (name === 'small') {
      await page.locator('#catalogo').evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
      await page.screenshot({ path: `${output}/small-catalog.png` });
    }
    if (name === 'mobile') {
      await page.locator('[data-iti-ia-open]').first().click();
      await page.locator('#itiIaInput').fill('Literatura.');
      const response = page.waitForResponse(r => r.url().endsWith('/api/ai/iti-ia') && r.request().method() === 'POST', { timeout: 60000 });
      await page.locator('#itiIaSubmit').click();
      const api = await response;
      assert.equal(api.status(), 200);
      result.ai = await api.json();
      await page.locator('#itiIaSubmit').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !document.getElementById('itiIaSubmit').disabled);
      assert.ok(await page.locator('.iti-message[data-role="model"]').count(), 'no answer rendered');
      assert.match(await page.locator('#itiIaMessages').innerText(), /datos de prueba/i);
      assert.equal(await page.locator('#itiIaFallback').isVisible(), false);
      const field = await page.locator('#itiIaInput').boundingBox();
      assert.ok(field.y >= 0 && field.y + field.height <= height, 'composer outside viewport');
      await page.screenshot({ path: `${output}/mobile-iti-ia.png` });
      for (const [query, expected] of [['Psicologia', /Body Keeps the Score/], ['Fantasia', /Court of Thorns and Roses/], ['Poesia', /No encontré libros/]]) {
        await page.locator('#itiIaInput').fill(query);
        const nextResponse = page.waitForResponse(r => r.url().endsWith('/api/ai/iti-ia') && r.request().method() === 'POST', { timeout: 60000 });
        await page.locator('#itiIaSubmit').click();
        assert.equal((await nextResponse).status(), 200);
        await page.waitForFunction(() => !document.getElementById('itiIaSubmit').disabled);
        assert.match(await page.locator('.iti-message[data-role="model"]').last().innerText(), expected);
      }
      assert.doesNotMatch(await page.locator('#itiIaMessages').innerText(), /selección conversacional|ranking|modelo no disponible/i);
      await page.keyboard.press('Escape');
      await page.locator('#catalogo').evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('#bookGrid').getAttribute('aria-busy') === 'false');
      await page.locator('#catalogFilterToggle').click();
      const filtered = page.waitForResponse(r => r.url().includes('/api/catalog?'));
      await page.locator('[data-filter="fiction"]').click();
      assert.equal((await filtered).status(), 200);
      await page.waitForFunction(() => document.querySelector('#bookGrid').getAttribute('aria-busy') === 'false');
      assert.ok(await page.locator('.book-card').count());
      await page.locator('[data-catalog-view="list"]').click();
      assert.equal(await page.locator('#bookGrid').getAttribute('data-view'), 'list');
      await page.locator('[data-catalog-view="grid"]').click();
      await page.locator('.book-card').first().click();
      assert.equal(await page.locator('#bookDialog').getAttribute('open'), '');
      assert.ok(await page.locator('#bookDialogTitle').innerText());
      await page.locator('[data-book-close]').click();
      await page.screenshot({ path: `${output}/mobile-catalog.png` });
      await page.setViewportSize({ width: 844, height: 390 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('video').currentSrc.includes('seek-desktop') && document.querySelector('video').readyState >= 2);
    }
    assert.deepEqual(errors, [], `${name}: browser errors`);
    results.push(result);
    console.log(name, JSON.stringify(result.seeks));
    await page.close();
  }
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto(origin, { waitUntil: 'domcontentloaded' });
  assert.equal(await reduced.locator('video').getAttribute('src'), null);
  await reduced.locator('#eventos').evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
  await reduced.screenshot({ path: `${output}/reduced-motion.png` });
  await reduced.close();
  const lowBattery = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await lowBattery.addInitScript(() => {
    Object.defineProperty(navigator, 'getBattery', { value: async () => ({ charging: false, level: .17 }) });
  });
  await lowBattery.goto(origin, { waitUntil: 'load' });
  assert.equal(await lowBattery.locator('video').getAttribute('src'), null, 'low battery loads video');
  await lowBattery.locator('#eventos').evaluate(e => e.scrollIntoView({ behavior: 'instant' }));
  assert.ok(await lowBattery.locator('[data-frame].is-active img').evaluate(img => img.complete && img.naturalWidth > 0));
  await lowBattery.screenshot({ path: `${output}/low-battery.png` });
  await lowBattery.close();
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log('Browser checks passed: video forward/reverse, viewport, navigation, catalog, Iti IA, reduced motion and low battery.');
