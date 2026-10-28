import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Exported so the same checks run through Playwright CLI run-code or Node, without an API backend.
export async function checkLanding(page, origin = 'http://127.0.0.1:5087') {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const result = { viewports: [], videoDeltas: [] };
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fold = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      hours: [...document.querySelectorAll('.hero-meta li')].find(el => el.textContent.includes('11:00')).getBoundingClientRect().bottom,
      cta: document.querySelector('.primary-cta').getBoundingClientRect().bottom
    }));
    check(!fold.overflow && fold.hours <= height && fold.cta <= height, `${width}: visit information or CTA outside viewport`);
    check(await page.locator('.hero-meta span, .gallery-card figcaption, .editorial-spread figcaption').evaluateAll(elements => elements.every(el => parseFloat(getComputedStyle(el).fontSize) >= 14)), `${width}: reading captions below 14px`);
    const toggle = page.locator('.menu-toggle');
    if (await toggle.isVisible()) {
      await toggle.focus();
      await page.keyboard.press('Enter');
      check(await page.evaluate(() => document.activeElement.getAttribute('href') === '#inicio'), `${width}: menu opening focus`);
      await page.keyboard.press('Tab');
      check(await page.evaluate(() => document.activeElement.getAttribute('href') === '#experiencia'), `${width}: menu Tab order`);
      await page.keyboard.press('Escape');
      check(await toggle.getAttribute('aria-expanded') === 'false', `${width}: Escape did not close menu`);
    }
    for (const id of ['inicio', 'experiencia', 'eventos', 'galeria', 'ubicacion']) {
      await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
      await page.waitForFunction(id => document.querySelector('.site-nav a[aria-current="true"]')?.hash === `#${id}`, id);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${id}: overflow`);
    }
    result.viewports.push({ width, height, passed: true });
  }
  await page.goto(origin, { waitUntil: 'load' });
  await page.bringToFront();
  for (const value of [.2, .8, .35]) {
    await page.evaluate(value => {
      const root = document.querySelector('[data-scroll-scrub]');
      scrollTo({ top: root.getBoundingClientRect().top + scrollY + (root.offsetHeight - root.querySelector('.scroll-scrub__stage').clientHeight) * value, behavior: 'instant' });
    }, value);
    await page.waitForFunction(value => {
      const video = document.querySelector('video');
      const expected = (.88 * value + .12 * (4 * (value - .5) ** 3 + .5)) * video.duration * .999;
      return video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - expected) < .06;
    }, value, { timeout: 12000 });
    result.videoDeltas.push(await page.evaluate(value => {
      const video = document.querySelector('video');
      return Math.abs(video.currentTime - (.88 * value + .12 * (4 * (value - .5) ** 3 + .5)) * video.duration * .999);
    }, value));
  }
  await page.locator('[data-motion-toggle]').click();
  check(await page.locator('video').evaluate(el => !el.hasAttribute('src')), 'motion control must unload video');
  for (const path of ['/.env.local', '/.git/HEAD', '/AGENTS.md', '/features/catalog-iti-ia/catalog-iti-ia.js']) {
    check((await page.request.head(origin + path)).status() === 404, `private route available: ${path}`);
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // Point PLAYWRIGHT_MODULE to an existing installation instead of adding a browser dependency.
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    console.log(JSON.stringify(await checkLanding(page, process.env.SITE_BASE_URL || 'http://127.0.0.1:5087')));
  } finally {
    await browser.close();
  }
}
