import { strict as assert } from 'node:assert';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const designSystemPath = join(root, 'design-system', 'libreria-itinerante-y-mas', 'MASTER.md');
const homeOverridePath = join(root, 'design-system', 'libreria-itinerante-y-mas', 'pages', 'home.md');
const harnessDocPath = join(root, 'docs', 'harness-engineering.md');
const geminiImageSpecPath = join(root, 'docs', 'gemini-demo-image-specs.md');
const eventsRedesignSpecPath = join(root, 'docs', 'events-section-redesign-spec.md');
const agendaContinuationPath = join(root, 'docs', 'agenda-cultural-continuation-instructions.md');
const premiumArchitecturePath = join(root, 'docs', 'premium-site-architecture.md');
const staticServerPath = join(root, 'tools', 'static-server.mjs');

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function localAssetValues() {
  return [...html.matchAll(/\b(?:src|href)=["']([^"']*)["']/g)]
    .map(match => match[1])
    .filter(value => value && !value.startsWith('#'))
    .filter(value => !/^(https?:|mailto:|tel:|data:|blob:)/i.test(value));
}

function cssRuleBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
}

function assertMotionBudget(selector, maxMs) {
  const block = cssRuleBlock(selector);
  const durations = [...block.matchAll(/(\d*\.?\d+)(ms|s)/g)]
    .map(([, value, unit]) => Number(value) * (unit === 's' ? 1000 : 1));

  assert.ok(durations.length > 0, `expected durations in ${selector}`);
  assert.ok(
    Math.max(...durations) <= maxMs,
    `${selector} exceeds ${maxMs}ms motion budget: ${durations.join(', ')}`
  );
}

test('HTML shell preserves core metadata and language', () => {
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /<html\s+lang=["']es["']/i);
  assert.match(html, /<meta\s+name=["']viewport["']/i);
  assert.match(html, /<meta\s+name=["']description["']/i);
  assert.match(html, /<meta\s+property=["']og:title["']/i);
  assert.match(html, /<title>[\s\S]*Itinerante[\s\S]*<\/title>/i);
});

test('section navigation and reveal motion stay snappy', () => {
  const globalBaseRule = cssRuleBlock('*, *::before, *::after');
  assert.doesNotMatch(
    globalBaseRule,
    /scroll-behavior:\s*smooth/,
    'global smooth scrolling makes anchor navigation feel slow'
  );

  assertMotionBudget('.reveal', 300);
  assertMotionBudget('.reveal-l', 300);
  assertMotionBudget('.reveal-r', 300);
  assertMotionBudget('.event-card', 300);
  assertMotionBudget('.reviews-track', 340);
  assertMotionBudget('.event-card::before', 300);
  assertMotionBudget('.event-card::after', 300);
  assertMotionBudget('.event-cta::after', 250);
  assertMotionBudget('.event-cta .cta-arrow', 250);
  assertMotionBudget('.book-card', 300);
  assertMotionBudget('.book-card img', 300);
  assertMotionBudget('.book-image-overlay', 300);
  assertMotionBudget('.book-card-cta', 250);
  assertMotionBudget('.carousel-dot', 300);
  assertMotionBudget('.events-nav-btn', 250);
  assertMotionBudget('.events-dot', 300);
});

test('ambient animations remain decorative and reduced-motion compatible', () => {
  const animatedSelectors = [
    '.wagon-path',
    '.hero-scroll-line',
    '.wa-fab::before'
  ];

  for (const selector of animatedSelectors) {
    assert.match(cssRuleBlock(selector), /animation:/, `${selector} should declare its animation locally`);
  }

  for (const selector of ['.reveal', '.reveal-l', '.reveal-r', '.event-card', '.book-card', '.reviews-track']) {
    assert.doesNotMatch(cssRuleBlock(selector), /animation:/, `${selector} should not depend on long-running animation`);
  }

  const reducedMotionMatch = html.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(reducedMotionMatch, 'missing prefers-reduced-motion block');
  assert.match(reducedMotionMatch[1], /animation-duration:\s*\.01ms\s*!important/);
  assert.match(reducedMotionMatch[1], /transition-duration:\s*\.01ms\s*!important/);
});

test('section navigation has one owner: the chapter nav', () => {
  const headerMatch = html.match(/<header class="navbar"[\s\S]*?<\/header>/);
  assert.ok(headerMatch, 'missing primary navbar');
  const headerHtml = headerMatch[0];

  for (const href of ['#experiencia', '#eventos', '#galeria', '#ubicacion']) {
    assert.doesNotMatch(
      headerHtml,
      new RegExp(`href=["']${href}["']`),
      `primary navbar must not duplicate chapter link ${href}`
    );
  }
  assert.doesNotMatch(headerHtml, /href=["']#/, 'primary navbar must not contain fragment links');
  assert.match(headerHtml, /navbar-logo-text/);
  assert.match(headerHtml, /class=["']nav-cta["']/);
  assert.match(headerHtml, /WhatsApp/);

  const chapterMatch = html.match(/<nav class="chapter-nav"[\s\S]*?<\/nav>/);
  assert.ok(chapterMatch, 'missing chapter nav');
  const chapterHtml = chapterMatch[0];
  const experiencia = chapterHtml.indexOf('href="#experiencia"');
  const eventos = chapterHtml.indexOf('href="#eventos"');
  const galeria = chapterHtml.indexOf('href="#galeria"');
  const ubicacion = chapterHtml.indexOf('href="#ubicacion"');

  assert.ok(experiencia >= 0, 'missing Experiencia chapter link');
  assert.ok(eventos >= 0, 'missing Agenda/Eventos chapter link');
  assert.ok(galeria >= 0, 'missing Libros chapter link');
  assert.ok(ubicacion >= 0, 'missing Visita/Ubicacion chapter link');
  assert.ok(
    experiencia < eventos && eventos < galeria && galeria < ubicacion,
    'chapter nav order should be Experiencia -> Agenda -> Libros -> Visita'
  );

  const navHtml = [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)].map(match => match[0]).join('\n');
  const sectionNavLinks = [...navHtml.matchAll(/href=["']#(experiencia|eventos|galeria|ubicacion)["']/g)];
  assert.equal(sectionNavLinks.length, 4, 'section links must appear only in chapter nav');
});

test('critical sections, interaction mounts, and contact actions exist', () => {
  for (const id of ['eventos', 'galeria', 'ubicacion', 'bookGrid', 'reviewsTrack', 'carouselDots', 'lightbox', 'lightboxImg', 'mailLink']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }

  assert.match(html, /class=["'][^"']*hero-stage/i);
  assert.ok((html.match(/\bbtn\s+btn-/g) ?? []).length >= 2, 'expected reusable hero button classes');
  assert.match(html, /--it-teal-400/);
  assert.match(html, /--color-brand/);
  assert.match(html, /prefers-reduced-motion/);
  assert.ok((html.match(/class=["'][^"']*event-card/g) ?? []).length >= 4, 'expected event cards');
  assert.match(html, /Taller de escritura creativa/);
  assert.match(html, /Círculos de lectura/);
  assert.match(html, /Teatro gestual/);
  assert.match(html, /Fotografía narrativa/);
  assert.match(html, /© 2025 Librería Itinerante y Más ·/);
  assert.ok((html.match(/https:\/\/wa\.me\/528180875940/g) ?? []).length >= 3);
  assert.match(html, /instagram\.com\/libreriaitineranteymasmty/i);
  assert.match(html, /google\.com\/maps\/search/i);
});

test('local assets referenced by markup exist', () => {
  for (const asset of localAssetValues()) {
    assert.ok(existsSync(join(root, asset)), `missing local asset: ${asset}`);
  }
});

test('preview server serves generated image formats correctly', () => {
  const staticServer = readFileSync(staticServerPath, 'utf8');
  assert.match(staticServer, /'\.webp':\s*'image\/webp'/);
});

test('generated image assets match their formats and stay under the page weight budget', () => {
  const webpDirs = [
    join(root, 'images', 'events'),
    join(root, 'images', 'books')
  ];
  const webpAssets = webpDirs.flatMap(dir =>
    readdirSync(dir)
      .filter(fileName => fileName.endsWith('.webp'))
      .map(fileName => join(dir, fileName))
  );
  const webpBudgetBytes = 150 * 1024;
  const totalWebpBudgetBytes = 1400 * 1024;

  assert.ok(webpAssets.length >= 12, 'expected generated WebP assets for events and catalog');

  let totalWebpBytes = 0;
  for (const assetPath of webpAssets) {
    const bytes = readFileSync(assetPath);
    const size = statSync(assetPath).size;
    totalWebpBytes += size;

    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${assetPath} must be RIFF WebP`);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${assetPath} must be real WebP content`);
    assert.ok(size <= webpBudgetBytes, `${assetPath} exceeds ${webpBudgetBytes} bytes`);
  }

  assert.ok(totalWebpBytes <= totalWebpBudgetBytes, `generated WebP assets exceed ${totalWebpBudgetBytes} bytes`);

  const heroWebpPath = join(root, 'images', 'hero', 'itinerante-hero-cinematic.webp');
  const heroWebp = readFileSync(heroWebpPath);
  assert.equal(heroWebp.toString('ascii', 0, 4), 'RIFF', 'hero illustration must be RIFF WebP');
  assert.equal(heroWebp.toString('ascii', 8, 12), 'WEBP', 'hero illustration must be real WebP content');
  assert.ok(statSync(heroWebpPath).size <= 240 * 1024, 'hero illustration should stay lightweight');
  assert.match(html, /src=["']images\/hero\/itinerante-hero-cinematic\.webp["']/);

  const logoWebpPath = join(root, 'Logo.webp');
  const logoWebp = readFileSync(logoWebpPath);
  assert.equal(logoWebp.toString('ascii', 0, 4), 'RIFF', 'Logo.webp must be RIFF WebP');
  assert.equal(logoWebp.toString('ascii', 8, 12), 'WEBP', 'Logo.webp must be real WebP content');
  assert.ok(statSync(logoWebpPath).size <= 32 * 1024, 'Logo.webp should stay lightweight');

  const faviconPng = readFileSync(join(root, 'Logo.png'));
  assert.equal(faviconPng.toString('hex', 0, 8), '89504e470d0a1a0a', 'Logo.png must remain a PNG favicon');
  assert.ok(statSync(join(root, 'Logo.png')).size <= 64 * 1024, 'Logo.png favicon should stay lightweight');
  assert.match(html, /<img\b[^>]*src=["']Logo\.webp["']/, 'visible logo images should use Logo.webp');
});

test('inline scripts are syntactically valid', () => {
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean);

  assert.ok(inlineScripts.length >= 1, 'expected site interaction scripts');

  for (const script of inlineScripts) {
    assert.doesNotThrow(() => new Function(script));
  }
});

test('critical styles do not depend on the Tailwind CDN runtime', () => {
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
  assert.doesNotMatch(html, /tailwind\.config/);
  assert.doesNotMatch(
    html,
    /\b(?:text-5xl|sm:text-6xl|lg:text-7xl|lg:grid-cols-\[1\.1fr_0\.9fr\])\b/,
    'hero layout and type should be owned by local CSS, not Tailwind utility classes'
  );

  const heroTitleRule = cssRuleBlock('.hero-title');
  assert.match(heroTitleRule, /font-size:\s*3rem/);
  assert.match(html, /@media\(min-width:640px\)\s*\{[\s\S]*?\.hero-title[\s\S]*?font-size:\s*3\.75rem/);
  assert.match(html, /@media\(min-width:1024px\)\s*\{[\s\S]*?\.hero-inner[\s\S]*?grid-template-columns:\s*1\.1fr 0\.9fr/);
  assert.match(html, /@media\(min-width:1024px\)\s*\{[\s\S]*?\.hero-title[\s\S]*?font-size:\s*4\.5rem/);
});

test('global spacing and hero brand media stay professionally framed', () => {
  assert.match(cssRuleBlock('body'), /margin:\s*0/, 'body must reset default browser margin');
  assert.match(cssRuleBlock('.hero-visual'), /border-radius:\s*8px/);
  assert.match(cssRuleBlock('.hero-visual img'), /aspect-ratio:\s*16 \/ 10/);
  assert.match(cssRuleBlock('.hero-brand-chip'), /border-radius:\s*8px/);
});

test('CSP keeps the static site intentionally closed', () => {
  const match = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([\s\S]*?)["']\s*>/i);
  assert.ok(match, 'missing CSP meta tag');

  const csp = normalize(match[1]);
  for (const directive of [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    'connect-src https://firestore.googleapis.com',
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'"
  ]) {
    assert.ok(csp.includes(directive), `missing CSP directive: ${directive}`);
  }

  assert.ok(!csp.includes('cdn.tailwindcss.com'), 'CSP should not allow Tailwind CDN scripts');
});

test('external links opened in a new tab use noopener', () => {
  const externalAnchors = [...html.matchAll(/<a\b[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi)]
    .map(match => match[0]);

  assert.ok(externalAnchors.length > 0, 'expected external links');

  for (const anchor of externalAnchors) {
    if (/target=["']_blank["']/i.test(anchor)) {
      assert.match(anchor, /rel=["'][^"']*noopener/i, `missing noopener: ${anchor}`);
    }
  }
});

test('Firebase hosting config protects credentials during deploy', () => {
  const firebase = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
  const project = JSON.parse(readFileSync(join(root, '.firebaserc'), 'utf8'));

  assert.equal(firebase.hosting.public, '.');
  assert.ok(firebase.hosting.ignore.includes('*.json'), 'JSON credentials must not deploy');
  assert.equal(project.projects.default, 'libreria-itineranteymas');

  const headerKeys = firebase.hosting.headers.flatMap(group => group.headers.map(header => header.key));
  for (const key of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
    assert.ok(headerKeys.includes(key), `missing Firebase security header: ${key}`);
  }
});

test('Itinerante design standard is the UI source of truth', () => {
  assert.ok(existsSync(designSystemPath), 'missing design system master file');
  assert.ok(existsSync(homeOverridePath), 'missing home page design override');

  const designSystem = readFileSync(designSystemPath, 'utf8');
  const homeOverride = readFileSync(homeOverridePath, 'utf8');

  assert.match(designSystem, /Libreria Itinerante Design Standard/);
  assert.match(designSystem, /--it-teal-400/);
  assert.match(designSystem, /Playfair Display/);
  assert.match(designSystem, /Inter/);
  assert.doesNotMatch(designSystem, /#EC4899/);
  assert.doesNotMatch(designSystem, /Cormorant Garamond/);
  assert.match(homeOverride, /#eventos/);
  assert.match(homeOverride, /#galeria/);
  assert.match(homeOverride, /#ubicacion/);
});

test('Gemini asset and Agenda carousel specs are harnessed', () => {
  assert.ok(existsSync(geminiImageSpecPath), 'missing Gemini demo image specification');
  assert.ok(existsSync(eventsRedesignSpecPath), 'missing Agenda cultural redesign specification');
  assert.ok(existsSync(agendaContinuationPath), 'missing Agenda cultural continuation instructions');
  assert.ok(existsSync(harnessDocPath), 'missing harness documentation');

  const geminiSpec = readFileSync(geminiImageSpecPath, 'utf8');
  const eventsSpec = readFileSync(eventsRedesignSpecPath, 'utf8');
  const continuation = readFileSync(agendaContinuationPath, 'utf8');
  const homeOverride = readFileSync(homeOverridePath, 'utf8');
  const harnessDoc = readFileSync(harnessDocPath, 'utf8');

  for (const canonicalPath of [
    'images/events/escritura-creativa-demo.webp',
    'images/events/circulo-lectura-demo.webp',
    'images/events/teatro-gestual-demo.webp',
    'images/events/fotografia-narrativa-demo.webp',
    'images/books/poesia-latinoamericana-demo.webp',
    'images/books/narrativa-mexicana-demo.webp',
    'images/books/arte-fotografia-demo.webp',
    'images/books/literatura-infantil-demo.webp'
  ]) {
    assert.ok(geminiSpec.includes(canonicalPath), `missing canonical asset path: ${canonicalPath}`);
  }

  assert.match(geminiSpec, /No text in image/);
  assert.match(geminiSpec, /Negative prompt/);
  assert.match(geminiSpec, /Do not generate embedded typography/);
  assert.match(eventsSpec, /800ms transition/);
  assert.match(eventsSpec, /4\.8s dwell/);
  assert.match(eventsSpec, /Pause on hover/);
  assert.match(eventsSpec, /prefers-reduced-motion/);
  assert.match(eventsSpec, /max 110 characters/);
  assert.match(eventsSpec, /pointer-events:\s*none/);
  assert.match(continuation, /Agenda Cultural Continuation Instructions/);
  assert.match(continuation, /Required Context/);
  assert.match(continuation, /Implementation Slice/);
  assert.match(continuation, /800ms transition/);
  assert.match(continuation, /4\.8s dwell/);
  assert.match(continuation, /npm\.cmd test/);
  assert.match(continuation, /Ready Prompt For The Next Codex Turn/);
  assert.match(homeOverride, /docs\/events-section-redesign-spec\.md/);
  assert.match(homeOverride, /docs\/gemini-demo-image-specs\.md/);
  assert.match(harnessDoc, /Agenda redesign contract/);
  assert.match(harnessDoc, /Gemini asset contract/);
});

test('book discovery behaves like a modern catalog surface', () => {
  for (const id of ['bookSearch', 'bookFilters', 'bookResultCount', 'bookEmptyState']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }

  assert.match(html, /type=["']search["']/);
  assert.match(html, /aria-live=["']polite["']/);
  assert.match(html, /data-filter=["']all["']/);
  assert.ok((html.match(/class=["'][^"']*filter-chip/g) ?? []).length >= 5, 'expected reusable filter chips');
  assert.match(html, /function filterBooks/);
  assert.match(html, /function renderBooks\(booksToRender = BOOKS\)/);
  assert.match(html, /book\.availability/);
  assert.match(html, /book\.mood/);
  assert.match(html, /book\.tags/);
  assert.match(html, /function createBookTop\(book\)/);
  assert.match(html, /function createBookBottom\(book\)/);
  assert.match(html, /function createBookImageOverlay\(book\)/);
  assert.match(html, /book-image-overlay/);
  assert.match(html, /book-mood book-description/);
  assert.match(html, /cta\.addEventListener\('click'/);
  assert.match(html, /Consultar por WhatsApp/);
  assertMotionBudget('.filter-chip', 250);
  assertMotionBudget('.catalog-whatsapp', 250);
});

test('premium narrative architecture is explicit and navigable', () => {
  assert.ok(existsSync(premiumArchitecturePath), 'missing premium architecture adaptation blueprint');
  const architecture = readFileSync(premiumArchitecturePath, 'utf8');

  assert.match(architecture, /Web Component Intelligence Adaptation/);
  assert.match(architecture, /chaptered storytelling/);
  assert.match(architecture, /Itinerante/);
  assert.match(architecture, /static HTML/);
  assert.match(architecture, /Do not copy proprietary/);
  assert.match(html, /class=["']chapter-nav["']/);
  assert.match(html, /aria-label=["']Navegaci[oó]n por cap[ií]tulos de Itinerante["']/);
  assert.match(html, /href=["']#experiencia["']/);
  assert.match(html, /href=["']#eventos["']/);
  assert.match(html, /href=["']#galeria["']/);
  assert.match(html, /href=["']#ubicacion["']/);
  assert.match(html, /id=["']experiencia["']/);
  assertMotionBudget('.chapter-link', 250);
});

test('home narrative follows the cinematic cultural product structure', () => {
  assert.match(html, /class=["'][^"']*hero-visual/);
  assert.match(html, /itinerante-hero-cinematic\.webp/);
  assert.match(html, /Libros, caf(?:e|é|Ã©) y comunidad/);
  assert.match(html, /id=["']transformacion-title["']/);
  assert.match(html, /Un lugar para leer, conversar y volver/);
  assert.match(html, /id=["']experiencia-title["']/);
  assert.ok((html.match(/class=["'][^"']*experience-panel/g) ?? []).length >= 3, 'expected three visual experience panels');
  assert.match(html, /id=["']faq-title["']/);
  assert.ok((html.match(/class=["']faq-item["']/g) ?? []).length >= 4, 'expected FAQ items before visit conversion');
  assert.match(html, /class=["'][^"']*visit-flow/);
  assert.match(html, /C(?:o|ó|Ã³)mo funciona/);
  assert.match(html, /Consulta/);
  assert.match(html, /Aparta o agenda/);
  assert.match(html, /Visita/);
  assertMotionBudget('.experience-panel', 300);
  assertMotionBudget('.catalog-instagram', 250);
  assertMotionBudget('.review-link', 250);
  assertMotionBudget('.visit-action', 250);
});
test('events section token compliance and design-system coherence', () => {
  // Section background must use --color-hero token, not old ad-hoc hex
  assert.doesNotMatch(html, /events-section[\s\S]{0,60}background:\s*#0B2421/,
    '#events-section must not use hardcoded #0B2421; use var(--color-hero)');
  assert.match(html, /var\(--color-hero\)/,
    'events-section must reference --color-hero token');

  // Kicker must use amber token (editorial hierarchy per MASTER.md)
  assert.match(html, /var\(--it-amber-500\)/,
    '.events-kicker should use --it-amber-500 for warm editorial accent');

  // Status pills must reference teal token, not raw white rgba
  assert.match(html, /event-status[\s\S]{0,200}var\(--it-teal-400\)/,
    '.event-status should reference --it-teal-400 token');

  // Gradient backgrounds of event cards must NOT use off-brand colors.
  // Scope: only the #eventos section HTML (between the eventos section open/close tags)
  const eventosMatch = html.match(/id="eventos"[\s\S]*?<\/section>/);
  assert.ok(eventosMatch, 'should find #eventos section HTML block');
  const eventosHtml = eventosMatch[0];
  const offBrandHex = [/#5A3B99/, /#B82A5A/, /#241B4D/, /#17233F/, /#2A5DC4/];
  for (const pattern of offBrandHex) {
    assert.doesNotMatch(eventosHtml, pattern,
      `event-card --event-bg must not use off-brand color: ${pattern}`);
  }

  // Every event card must have role="listitem" and tabindex for a11y
  const listItemCount = (html.match(/role="listitem"/g) ?? []).length;
  assert.ok(listItemCount >= 4, `expected >=4 role="listitem" on event cards, found ${listItemCount}`);

  // Rail must have role="list"
  assert.match(html, /events-rail[\s\S]{0,20}role="list"/,
    '.events-rail must have role="list" for semantic list structure');

  // CTA arrows must use .cta-arrow span (not bare arrow text)
  const ctaArrowCount = (html.match(/class="cta-arrow"/g) ?? []).length;
  assert.ok(ctaArrowCount >= 4, `expected >=4 .cta-arrow spans in event CTAs, found ${ctaArrowCount}`);

  // CTA touch target: min-height 44px must exist in CSS
  assert.match(html, /event-cta[\s\S]{0,600}min-height:\s*44px/,
    '.event-cta must define min-height:44px for touch accessibility');

  assert.match(html, /class=["'][^"']*events-signal-strip/,
    '#eventos should expose compact agenda signals before the carousel');
  assert.match(html, /aria-label=["']Resumen de agenda cultural["']/,
    'agenda signals should be named for assistive technology');
  assert.match(cssRuleBlock('.event-icon'), /display:\s*flex/,
    'event icon treatment should be local CSS, not repeated inline style');
  assert.ok((html.match(/class=["']event-icon["']/g) ?? []).length >= 4,
    'each event card should use the local .event-icon class');

  // Scroll-hint overlay must exist
  assert.match(html, /events-rail-wrap::after[\s\S]{0,300}linear-gradient/,
    '.events-rail-wrap::after scroll-hint must use linear-gradient');

  // prefers-reduced-motion must be present
  assert.match(html, /prefers-reduced-motion/,
    'prefers-reduced-motion media query must be present');
});

test('events carousel contract: accessible carousel with autoplay and compact copy', () => {
  // ── Region & roledescription ──
  const eventosMatch = html.match(/id="eventos"[\s\S]*?<\/section>/);
  assert.ok(eventosMatch, 'should find #eventos section');
  const ev = eventosMatch[0];

  assert.match(ev, /role="region"/,
    '#eventos must contain a role="region" carousel wrapper');
  assert.match(ev, /aria-roledescription="carousel"/,
    'carousel wrapper must have aria-roledescription="carousel"');
  assert.match(ev, /aria-label="[^"]*[Aa]genda/,
    'carousel region must have an aria-label mentioning the agenda');

  // ── Prev / Next buttons ──
  assert.match(ev, /aria-label="Evento anterior"/,
    'must have a button with aria-label="Evento anterior"');
  assert.match(ev, /aria-label="Siguiente evento"/,
    'must have a button with aria-label="Siguiente evento"');

  // ── Dot controls ──
  for (let i = 1; i <= 4; i++) {
    assert.match(ev, new RegExp(`aria-label="Ir al evento ${i}"`),
      `must have dot control: Ir al evento ${i}`);
  }

  // ── Cards still semantic ──
  const cardCount = (ev.match(/class="[^"]*event-card/g) ?? []).length;
  assert.ok(cardCount >= 4, `expected >=4 event cards, found ${cardCount}`);
  const listitemCount = (ev.match(/role="listitem"/g) ?? []).length;
  assert.ok(listitemCount >= 4, `expected >=4 role="listitem", found ${listitemCount}`);

  // ── Compact copy: descriptions ≤ 110 characters ──
  const descriptions = [...ev.matchAll(/class="event-description">([\s\S]*?)<\//g)]
    .map(m => m[1].replace(/<[^>]*>/g, '').trim());
  for (const desc of descriptions) {
    assert.ok(desc.length <= 110,
      `event description exceeds 110 chars (${desc.length}): "${desc.slice(0, 60)}…"`);
  }

  // ── Max 3 meta chips per card ──
  const metaBlocks = [...ev.matchAll(/class="event-meta">([\s\S]*?)<\/div>/g)];
  for (const [, metaHtml] of metaBlocks) {
    const chipCount = (metaHtml.match(/<span>/g) ?? []).length;
    assert.ok(chipCount <= 3,
      `event-meta must have ≤3 chips, found ${chipCount}`);
  }

  // ── One CTA per card ──
  const cards = [...ev.matchAll(/<article[\s\S]*?<\/article>/g)];
  for (const [cardHtml] of cards) {
    const ctaCount = (cardHtml.match(/class="event-cta"/g) ?? []).length;
    assert.ok(ctaCount === 1,
      `each event card must have exactly 1 CTA, found ${ctaCount}`);
  }

  // ── Motion constants in script ──
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).join('\n');
  assert.match(scripts, /4800/,
    'autoplay dwell must use 4800ms constant');
  assert.match(scripts, /800/,
    'transition must reference 800ms constant');
  assert.match(scripts, /prefers-reduced-motion/,
    'carousel script must check prefers-reduced-motion');

  // ── Fade specs ──
  const fadeRule = html.match(/events-rail-wrap::after[\s\S]*?\}/);
  assert.ok(fadeRule, 'must have .events-rail-wrap::after fade rule');
  assert.match(fadeRule[0], /48px/,
    'desktop fade width must be 48px');
  assert.match(fadeRule[0], /pointer-events:\s*none/,
    'fade must have pointer-events: none');
  assert.match(fadeRule[0], /var\(--color-hero\)/,
    'fade must use var(--color-hero)');

  // mobile fade width
  assert.match(html, /events-rail-wrap::after[\s\S]*?28px/,
    'mobile fade width must be 28px');
});

test('allies section: structure, tokens, motion budget', () => {
  assert.match(html, /<section id="aliados" class="allies-section"/);
  assert.match(html, /id="allies-title"/);
  assert.ok(/\.allies-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.ally-link', 450);
});

test('press section: structure and motion budget', () => {
  assert.match(html, /<section id="prensa" class="press-section"/);
  assert.match(html, /id="press-title"/);
  assert.ok(/\.press-grid\s*\{[\s\S]*grid-template-columns/.test(html));
  assertMotionBudget('.press-card', 450);
});

test('newsletter band: real signup wired to Firestore, CSP updated', () => {
  assert.match(html, /<section id="boletin" class="newsletter-section"/);
  assert.match(html, /id="newsletterForm"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /connect-src https:\/\/firestore\.googleapis\.com/);
  assert.match(html, /form-action 'none'/);
  assertMotionBudget('.newsletter-cta', 300);
});

test('experiencia unificada: intro sticky + cards numeradas fusionan transformacion', () => {
  // Una sola sección: layout split con intro y grid de cards
  assert.match(html, /class=["']story-shell experience-layout["']/);
  // Los 3 beneficios numerados viven ahora dentro de las cards
  assert.ok((html.match(/class=["']experience-num["']/g) ?? []).length >= 3,
    'expected 3 numbered experience cards');
  // La estructura legacy de dos secciones debe desaparecer por completo (HTML y CSS)
  assert.doesNotMatch(html, /benefit-row/);
  assert.doesNotMatch(html, /transform-grid/);
  // Layout y sticky del intro en desktop
  assert.ok(/\.experience-layout\s*\{[\s\S]*?grid/.test(html), 'missing experience-layout grid rule');
  assert.ok(/\.experience-intro\s*\{[\s\S]*?position:\s*sticky/.test(html), 'missing sticky intro rule');
  // Zoom de imagen dentro del presupuesto de motion de la sección (300ms)
  assertMotionBudget('.experience-media img', 300);
});

test('scroll performance: blurs contenidos, transitions enumeradas y render diferido', () => {
  // Los dos elementos fijos/sticky no deben recomponer blur caro en cada frame
  const navbar = cssRuleBlock('.navbar');
  assert.doesNotMatch(navbar, /saturate\(/, 'navbar backdrop must not use saturate()');
  const navBlur = navbar.match(/backdrop-filter:\s*blur\((\d+)px\)/);
  assert.ok(navBlur && Number(navBlur[1]) <= 8, 'navbar blur must be <= 8px');
  const chapterNav = cssRuleBlock('.chapter-nav');
  assert.doesNotMatch(chapterNav, /saturate\(/, 'chapter-nav backdrop must not use saturate()');
  const chBlur = chapterNav.match(/backdrop-filter:\s*blur\((\d+)px\)/);
  assert.ok(chBlur && Number(chBlur[1]) <= 8, 'chapter-nav blur must be <= 8px');
  // transition: all anima propiedades de layout sin querer — prohibido
  assert.doesNotMatch(html, /transition:\s*all\b/, 'enumerate transition properties');
  // Las secciones bajo el pliegue difieren layout/paint hasta acercarse al viewport
  assert.match(html, /content-visibility:\s*auto/);
  assert.match(html, /contain-intrinsic-size:/);
});

test('motion: stagger en prensa y micro-interaccion del enlace de nota', () => {
  assert.ok(/\.press-grid \.reveal:nth-child\(2\)\s*\{\s*transition-delay/.test(html),
    'missing press grid stagger');
  assert.ok(/\.press-card-link:hover \.press-readmore\s*\{[\s\S]*?translateX/.test(html),
    'missing readmore slide micro-interaction');
  assertMotionBudget('.press-readmore', 450);
});
