/* Local runtime for the Claude cinematic page; no Higgsfield SDK or remote dependency. */
(() => {
  'use strict';

  const WHATSAPP = 'https://wa.me/528180875940';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initEntrance() {
    const card = document.querySelector('.demo-card');
    if (reducedMotion.matches || !card) return;
    const root = document.documentElement;
    root.classList.add('motion-pending');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      root.classList.remove('motion-pending');
      if (fallback) window.clearTimeout(fallback);
    };
    const fallback = window.setTimeout(finish, 3500);
    card.addEventListener('animationend', finish, { once: true });
  }

  function initMenu() {
    const header = document.querySelector('[data-site-header]');
    const toggle = header?.querySelector('.menu-toggle');
    const panel = document.getElementById('site-navigation');
    if (!header || !toggle || !panel) return;
    const links = [...panel.querySelectorAll('a')];
    const isToggleVisible = () => window.getComputedStyle(toggle).display !== 'none';
    const setOpen = open => {
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (isToggleVisible()) {
        if (open) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      } else {
        panel.removeAttribute('inert');
      }
      if (open) links[0]?.focus();
    };
    if (isToggleVisible()) panel.setAttribute('inert', '');
    toggle.addEventListener('click', () => {
      setOpen(!header.classList.contains('menu-open'));
    });
    links.forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (header.classList.contains('menu-open') && !header.contains(event.target)) setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (!isToggleVisible()) {
        header.classList.remove('menu-open');
        panel.removeAttribute('inert');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initDemoCard() {
    document.querySelectorAll('[data-scroll-to]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelector(button.dataset.scrollTo)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      });
    });
  }

  function initScrollScrub() {
    const root = document.querySelector('[data-scroll-scrub]');
    const video = root?.querySelector('video');
    const frames = [...(root?.querySelectorAll('[data-frame]') || [])];
    if (!root || !video || !frames.length) return;

    const frameStops = [0, .14, .25, .38, .5, .62, .71];
    const portrait = window.matchMedia('(max-aspect-ratio: 3/4)');
    const epsilon = 1 / 30;
    let renderFrame = 0;
    let videoFrame = 0;
    let duration = 0;
    let loaded = false;
    let targetTime = 0;
    let lowBattery = false;
    let inView = true;
    let engaged = false;
    const videoEnabled = () => !reducedMotion.matches && !navigator.connection?.saveData && !lowBattery;

    const lingerEase = value => {
      const amount = .12;
      const centered = value - .5;
      return (1 - amount) * value + amount * (4 * centered ** 3 + .5);
    };

    const progress = () => {
      const rect = root.getBoundingClientRect();
      const distance = Math.max(rect.height - root.querySelector('.scroll-scrub__stage').clientHeight, 1);
      return Math.min(1, Math.max(0, -rect.top / distance));
    };

    const showFrame = value => {
      let active = 0;
      frameStops.forEach((stop, index) => { if (value >= stop) active = index; });
      root.dataset.activeFrame = String(active);
      frames.forEach((frame, index) => frame.classList.toggle('is-active', index === active));
    };

    const syncVideo = () => {
      videoFrame = 0;
      if (!videoEnabled() || !inView || document.hidden || !duration || video.readyState < 2 || video.seeking) return;
      const delta = targetTime - video.currentTime;
      if (Math.abs(delta) <= epsilon) {
        return;
      }
      // One seek at a time; seeked catches up to the latest scroll position.
      video.currentTime = targetTime;
    };

    const requestVideoSync = () => {
      if (!videoFrame) videoFrame = window.requestAnimationFrame(syncVideo);
    };

    const render = () => {
      renderFrame = 0;
      const value = progress();
      root.style.setProperty('--hero-progress', String(value));
      showFrame(value);
      targetTime = duration ? Math.min(duration - .04, lingerEase(value) * duration * .999) : 0;
      requestVideoSync();
    };

    const requestRender = () => {
      if (!renderFrame) renderFrame = window.requestAnimationFrame(render);
    };

    const loadVideo = () => {
      if (loaded || !engaged || !videoEnabled()) return;
      loaded = true;
      video.preload = 'auto';
      video.src = portrait.matches ? video.dataset.mobile : video.dataset.desktop;
      video.load();
    };

    const engage = () => {
      if (engaged) return;
      engaged = true;
      if (inView) { loadVideo(); requestRender(); }
    };

    const unloadVideo = () => {
      if (!loaded) return;
      loaded = false;
      duration = 0;
      targetTime = 0;
      if (videoFrame) window.cancelAnimationFrame(videoFrame);
      videoFrame = 0;
      video.pause();
      video.removeAttribute('src');
      video.load();
      root.removeAttribute('data-video-ready');
    };

    video.addEventListener('loadedmetadata', () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      render();
    });
    video.addEventListener('loadeddata', () => {
      root.dataset.videoReady = 'true';
      requestRender();
    });
    video.addEventListener('seeked', () => {
      root.dataset.videoReady = 'true';
      requestVideoSync();
    });
    video.addEventListener('error', () => root.removeAttribute('data-video-ready'));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting);
        if (inView) { loadVideo(); requestRender(); }
      });
      observer.observe(root);
    } else {
      engage();
      loadVideo();
    }

    window.addEventListener('scroll', engage, { once: true, passive: true });
    window.addEventListener('pointerdown', engage, { once: true });
    window.setTimeout(engage, 2500);

    navigator.getBattery?.().then(battery => {
      if (!battery.charging && battery.level <= .2) {
        lowBattery = true;
        unloadVideo();
      }
    }).catch(() => {});

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    portrait.addEventListener('change', () => { unloadVideo(); if (inView) loadVideo(); });
    reducedMotion.addEventListener('change', () => {
      if (!videoEnabled()) unloadVideo();
      else if (inView) loadVideo();
    });
    document.addEventListener('visibilitychange', requestRender);
    render();
  }

  function safeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function createIcon(id = 'icon-arrow-ne') {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    icon.classList.add('icon');
    icon.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', `#${id}`);
    icon.append(use);
    return icon;
  }

  function normalizeBook(book, mode) {
    if (!book || typeof book !== 'object') return null;
    return {
      id: safeText(book.id, safeText(book.slug, safeText(book.title, 'libro'))),
      title: safeText(book.title, 'Título no disponible'),
      author: safeText(book.author, 'Autor no disponible'),
      genre: safeText(book.genre, 'Selección editorial'),
      subgenre: safeText(book.subgenreName),
      subgenreSlug: safeText(book.subgenre?.slug),
      format: safeText(book.format),
      editorial: safeText(book.editorial?.name),
      coverUrl: safeText(book.coverUrl),
      description: safeText(book.description, safeText(book.mood, 'Consulta los detalles con la librería.')),
      publishedYear: Number.isInteger(book.publishedYear) ? book.publishedYear : null,
      sourceRating: typeof book.sourceRating === 'number' ? book.sourceRating : null,
      sourceReviewCount: typeof book.sourceReviewCount === 'number' ? book.sourceReviewCount : null,
      sourceLabel: safeText(book.sourceLabel),
      isTestData: book.isTestData === true || mode === 'test'
    };
  }

  function cover(book, className) {
    const container = document.createElement('div');
    container.className = className;
    if (/^(\/|https:\/\/covers\.openlibrary\.org\/)/.test(book.coverUrl)) {
      const image = document.createElement('img');
      image.src = book.coverUrl;
      image.alt = `Portada de ${book.title}`;
      image.loading = 'lazy';
      container.append(image);
    } else {
      const fallback = document.createElement('span');
      fallback.textContent = book.title;
      container.append(fallback);
    }
    return container;
  }

  function openBook(book) {
    const dialog = document.getElementById('bookDialog');
    const content = document.getElementById('bookDialogContent');
    if (!dialog || !content) return;
    const detail = document.createElement('article');
    detail.className = 'book-detail';
    const meta = document.createElement('div');
    meta.className = 'book-detail__meta';
    const genre = document.createElement('p');
    genre.className = 'book-card__genre';
    genre.textContent = [book.genre, book.subgenre].filter(Boolean).join(' · ');
    const title = document.createElement('h2');
    title.id = 'bookDialogTitle';
    title.textContent = book.title;
    const author = document.createElement('p');
    author.className = 'book-detail__author';
    author.textContent = book.author;
    const description = document.createElement('p');
    description.className = 'book-detail__description';
    description.textContent = book.description;
    const facts = document.createElement('dl');
    facts.className = 'book-detail__facts';
    [['Categoría', book.genre], ['Subgénero', book.subgenre], ['Editorial', book.editorial], ['Formato', book.format]].forEach(([label, value]) => {
      if (!value) return;
      const item = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label;
      definition.textContent = value;
      item.append(term, definition);
      facts.append(item);
    });
    meta.append(genre, title, author, description, facts);
    const related = catalogCache.filter(item => item.id !== book.id && item.subgenreSlug && item.subgenreSlug === book.subgenreSlug).slice(0, 3);
    if (related.length) {
      const relatedBox = document.createElement('div');
      relatedBox.className = 'book-detail__related';
      const relatedTitle = document.createElement('h3');
      relatedTitle.textContent = 'También te puede interesar';
      const relatedList = document.createElement('ul');
      related.forEach(item => {
        const entry = document.createElement('li');
        const opener = document.createElement('button');
        opener.type = 'button';
        opener.textContent = `${item.title} · ${item.author}`;
        opener.addEventListener('click', () => openBook(item));
        entry.append(opener);
        relatedList.append(entry);
      });
      relatedBox.append(relatedTitle, relatedList);
      meta.append(relatedBox);
    }
    if (book.isTestData) {
      const badge = document.createElement('p');
      badge.className = 'book-card__badge';
      badge.textContent = 'Datos de prueba · no es inventario';
      meta.append(badge);
    } else {
      const link = document.createElement('a');
      link.className = 'button button--ink';
      link.href = `${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero consultar disponibilidad de "${book.title}".`)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append('Consultar disponibilidad ', createIcon());
      meta.append(link);
    }
    detail.append(cover(book, 'book-detail__cover'), meta);
    content.replaceChildren(detail);
    dialog.showModal();
  }

  function applyCatalogSort() {
    const sort = document.getElementById('catalogSort');
    if (!sort) return;
    const value = sort.value;
    catalogCache.sort((left, right) => {
      if (value === 'relevance') return Number(left.order) - Number(right.order);
      if (value === 'newest') return (Number(right.publishedYear) || 0) - (Number(left.publishedYear) || 0);
      if (value === 'rating') return (Number(right.sourceRating) || 0) - (Number(left.sourceRating) || 0);
      return String(left[value]).localeCompare(String(right[value]), 'es');
    });
  }

  function renderCatalog(books, mode) {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    catalogCache = books.map((book, order) => ({ ...book, order }));
    catalogPage = 1;
    applyCatalogSort();
    renderCatalogPage();
  }

  function renderCatalogPage() {
    const grid = document.getElementById('bookGrid');
    const pager = document.getElementById('catalogPager');
    const prev = document.getElementById('catalogPrev');
    const next = document.getElementById('catalogMore');
    const pageStatus = document.getElementById('catalogPageStatus');
    const status = document.getElementById('catalogStatus');
    if (!grid) return;
    grid.replaceChildren();
    const pages = Math.max(1, Math.ceil(catalogTotalCount / CATALOG_PAGE_SIZE));
    catalogPage = Math.min(Math.max(1, catalogPage), pages);
    const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    const visible = catalogCache.slice(start, start + CATALOG_PAGE_SIZE);
    visible.forEach((book, index) => {
      const card = document.createElement('article');
      card.className = 'book-card';
      card.dataset.order = String(book.order ?? index);
      card.dataset.title = book.title;
      card.dataset.author = book.author;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Ver ficha de ${book.title}, ${book.author}`);

      const genre = document.createElement('p');
      genre.className = 'book-card__genre';
      genre.textContent = book.genre;

      const title = document.createElement('h3');
      title.textContent = book.title;

      const author = document.createElement('p');
      author.textContent = book.author;

      const description = document.createElement('p');
      description.className = 'book-card__description';
      description.textContent = book.description;

      const body = document.createElement('div');
      body.className = 'book-card__body';
      if (typeof book.sourceRating === 'number') {
        const rating = document.createElement('p');
        rating.className = 'book-card__rating';
        const count = typeof book.sourceReviewCount === 'number' ? ` (${book.sourceReviewCount.toLocaleString('es-MX')})` : '';
        const source = book.sourceLabel ? ` · ${book.sourceLabel}` : '';
        rating.textContent = `★ ${book.sourceRating}${count}${source}`;
        body.append(genre, title, rating, author, description);
      } else {
        body.append(genre, title, author, description);
      }
      if (book.isTestData || catalogModeIsTest) {
        const badge = document.createElement('span');
        badge.className = 'book-card__badge';
        badge.textContent = 'Datos de prueba · no es inventario';
        body.append(badge);
      } else {
        const link = document.createElement('a');
        link.href = `${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero consultar disponibilidad de "${book.title}".`)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.append('Consultar por WhatsApp ', createIcon());
        body.append(link);
      }
      card.append(cover(book, 'book-card__cover'), body);
      card.addEventListener('click', event => {
        if (!event.target.closest('a')) openBook(book);
      });
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openBook(book);
        }
      });
      grid.append(card);
    });
    if (pager) pager.hidden = catalogTotalCount <= CATALOG_PAGE_SIZE;
    if (prev) prev.disabled = catalogPage <= 1;
    if (next) next.disabled = catalogPage >= pages;
    if (pageStatus) pageStatus.textContent = visible.length ? `Página ${catalogPage} de ${pages}` : '';
    if (status && !status.classList.contains('is-error') && visible.length) {
      status.textContent = `Mostrando ${start + 1}–${start + visible.length} de ${catalogTotalCount.toLocaleString('es-MX')} ${catalogTotalCount === 1 ? 'resultado' : 'resultados'}${catalogModeIsTest ? ' · datos de prueba' : ''}`;
    }
    updateCatalogChrome();
  }

  let activeCatalogMode = 'inventory';
  const CATALOG_PAGE_SIZE = 9;
  const CATALOG_FETCH_LIMIT = 60;
  let catalogCache = [];
  let catalogPage = 1;
  let catalogTotalCount = 0;
  let catalogModeIsTest = false;
  let catalogFacetCounts = null;

  function updateCatalogChrome() {
    document.querySelectorAll('[data-filter]').forEach(button => {
      if (button.dataset.label === undefined) button.dataset.label = button.textContent.trim();
      const slug = button.dataset.filter;
      const count = slug === 'all'
        ? catalogTotalCount
        : (catalogFacetCounts?.categories ?? []).find(item => item.value === slug)?.count ?? null;
      button.textContent = count === null ? button.dataset.label : `${button.dataset.label} · ${count}`;
    });
    const suggest = document.getElementById('catalogSuggest');
    if (suggest) {
      const seen = new Set();
      const options = [];
      for (const book of catalogCache) {
        for (const text of [book.title, book.author]) {
          if (text && text !== 'Título no disponible' && text !== 'Autor no disponible'
            && !seen.has(text) && options.length < 30) {
            seen.add(text);
            options.push(text);
          }
        }
      }
      suggest.replaceChildren();
      options.forEach(text => {
        const option = document.createElement('option');
        option.value = text;
        suggest.append(option);
      });
    }
  }

  async function loadCatalog(query = '', category = '') {
    const status = document.getElementById('catalogStatus');
    const grid = document.getElementById('bookGrid');
    const fallback = document.getElementById('catalogFallback');
    const more = document.getElementById('catalogMore');
    const controls = [...document.querySelectorAll('#catalogSearchForm button, [data-filter]')];
    if (!status || !grid || grid.getAttribute('aria-busy') === 'true') return;
    status.classList.remove('is-error');
    status.textContent = 'Consultando el catálogo…';
    if (fallback) fallback.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    controls.forEach(control => { control.disabled = true; });
    try {
      const params = new URLSearchParams({ limit: String(CATALOG_FETCH_LIMIT) });
      if (query) params.set('q', query);
      if (category && category !== 'all') params.set('category', category);
      const response = await fetch(`/api/catalog?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(90_000)
      });
      if (!response.ok) throw new Error(`catalog_${response.status}`);
      const payload = await response.json();
      activeCatalogMode = payload.mode === 'test' ? 'test' : 'inventory';
      const books = Array.isArray(payload?.books)
        ? payload.books.map(book => normalizeBook(book, payload.mode)).filter(Boolean)
        : [];
      catalogTotalCount = Number(payload.total ?? books.length);
      catalogModeIsTest = payload.mode === 'test';
      catalogFacetCounts = payload.facets ?? null;
      renderCatalog(books, payload.mode);
      if (!books.length) status.textContent = 'No encontramos coincidencias.';
      if (fallback) fallback.hidden = books.length > 0;
    } catch {
      grid.replaceChildren();
      catalogCache = [];
      catalogTotalCount = 0;
      catalogFacetCounts = null;
      document.querySelectorAll('[data-filter]').forEach(button => {
        if (button.dataset.label !== undefined) button.textContent = button.dataset.label;
      });
      status.classList.add('is-error');
      status.textContent = 'El catálogo no está disponible ahora. Vuelve a buscar o consulta por WhatsApp.';
      if (fallback) fallback.hidden = false;
      document.getElementById('catalogPager')?.setAttribute('hidden', '');
    } finally {
      grid.setAttribute('aria-busy', 'false');
      controls.forEach(control => { control.disabled = false; });
    }
  }

  function initCatalog() {
    const form = document.getElementById('catalogSearchForm');
    const input = document.getElementById('catalogSearch');
    if (!form || !input) return;
    const filters = [...document.querySelectorAll('[data-filter]')];
    const sort = document.getElementById('catalogSort');
    const grid = document.getElementById('bookGrid');
    const filterToggle = document.getElementById('catalogFilterToggle');
    const filterList = document.getElementById('catalogFilterList');
    const dialog = document.getElementById('bookDialog');
    const more = document.getElementById('catalogMore');
    let activeCategory = '';

    const selectCategory = button => {
      activeCategory = button.dataset.filter === 'all' ? '' : button.dataset.filter || '';
      filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      if (activeCatalogMode === 'test' && activeCategory) {
        input.value = button.dataset.label || button.textContent.trim();
        loadCatalog(input.value, '');
      } else {
        if (!activeCategory && activeCatalogMode === 'test') input.value = '';
        loadCatalog(input.value.trim(), activeCategory);
      }
    };

    form.addEventListener('submit', event => {
      event.preventDefault();
      loadCatalog(input.value.trim(), activeCategory);
    });
    filters.forEach(button => button.addEventListener('click', () => selectCategory(button)));
    filters.forEach((filter, index) => filter.setAttribute('aria-pressed', String(index === 0)));
    document.querySelectorAll('[data-catalog-view]').forEach(button => button.addEventListener('click', () => {
      const view = button.dataset.catalogView;
      grid.dataset.view = view;
      document.querySelectorAll('[data-catalog-view]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    }));
    sort?.addEventListener('change', () => {
      applyCatalogSort();
      renderCatalogPage();
    });
    filterToggle?.addEventListener('click', () => {
      const open = filterToggle.getAttribute('aria-expanded') !== 'true';
      filterToggle.setAttribute('aria-expanded', String(open));
      filterList.classList.toggle('is-open', open);
    });
    document.querySelector('[data-book-close]')?.addEventListener('click', () => dialog?.close());
    dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    document.getElementById('catalogPrev')?.addEventListener('click', () => {
      if (catalogPage > 1) {
        catalogPage -= 1;
        renderCatalogPage();
      }
    });
    more?.addEventListener('click', () => {
      const pages = Math.max(1, Math.ceil(catalogTotalCount / CATALOG_PAGE_SIZE));
      if (catalogPage < pages) {
        catalogPage += 1;
        renderCatalogPage();
      }
    });
    loadCatalog();
  }

  function initChapterNav() {
    const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const chapters = links.map(link => ({ link, target: document.querySelector(link.hash) })).filter(item => item.target);
    if (!chapters.length) return;
    let frame = 0;

    const render = () => {
      frame = 0;
      let current = null;
      chapters.forEach(chapter => {
        if (chapter.target.getBoundingClientRect().top <= window.innerHeight * .45) current = chapter;
      });
      chapters.forEach(chapter => {
        if (chapter === current) chapter.link.setAttribute('aria-current', 'true');
        else chapter.link.removeAttribute('aria-current');
      });
    };
    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    render();
  }

  function extractAssistantContent(message) {
    const output = { text: [], recommendations: [] };
    const parts = Array.isArray(message?.content) ? message.content : [];
    parts.forEach(part => {
      if (typeof part?.text === 'string' && part.text.trim()) output.text.push(part.text.trim());
      const request = part?.toolRequest;
      const response = part?.toolResponse;
      if (request?.name === 'recommendBooks' && Array.isArray(request.input?.recommendedBooks)) {
        output.recommendations.push(...request.input.recommendedBooks);
      }
      if (request?.name === 'askQuestion' && request.input?.question) output.text.push(request.input.question);
      if (response?.name === 'recommendBooks') {
        const value = response.output || response.response || {};
        output.recommendations.push(...(value.recommendations || value.recommendedBooks || []));
      }
      if (response?.name === 'askQuestion') {
        const value = response.output || response.response || {};
        if (value.question) output.text.push(value.question);
      }
    });
    return output;
  }

  function foldTitle(value) {
    return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function findCachedBook(wanted) {
    if (!wanted) return null;
    return catalogCache.find(book => foldTitle(book.title) === wanted)
      || catalogCache.find(book => {
        const candidate = foldTitle(book.title);
        return candidate.includes(wanted) || wanted.includes(candidate);
      }) || null;
  }

  async function openRecommendation(title) {
    const wanted = foldTitle(title);
    if (!wanted) return;
    const hit = findCachedBook(wanted);
    document.getElementById('itiIaDialog')?.close();
    if (hit) {
      openBook(hit);
      return;
    }
    const input = document.getElementById('catalogSearch');
    if (input) input.value = title;
    document.getElementById('catalogo')?.scrollIntoView();
    await loadCatalog(String(title ?? '').trim(), '');
    if (catalogCache.length) openBook(catalogCache[0]);
  }

  const ITI_STARTERS = [
    'Una novela corta para este fin',
    'Poesía para empezar a leer',
    'Un libro infantil ilustrado',
  ];
  let itiPredictionsTimer = null;

  function renderItiPredictions(items) {
    const box = document.getElementById('itiIaPredictions');
    if (!box) return;
    box.replaceChildren();
    if (!items.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    items.slice(0, 4).forEach(text => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        const field = document.getElementById('itiIaInput');
        if (field) field.value = text;
        document.getElementById('itiIaForm')?.requestSubmit();
      });
      box.append(chip);
    });
  }

  function predictItiQueries(raw) {
    const query = foldTitle(raw);
    if (query.length < 2) return [];
    const out = [];
    const seen = new Set();
    const push = text => {
      if (text && !seen.has(text) && out.length < 4) {
        seen.add(text);
        out.push(text);
      }
    };
    for (const book of catalogCache) {
      if (foldTitle(book.title).includes(query)) push(book.title);
      if (foldTitle(book.author).includes(query)) push(`Libros de ${book.author}`);
      if (book.subgenre && foldTitle(book.subgenre).includes(query)) push(`Libros de ${book.subgenre}`);
      if (out.length >= 4) break;
    }
    return out;
  }

  function appendItiMessage(container, role, content) {
    const message = document.createElement('div');
    message.className = 'iti-message';
    message.dataset.role = role;
    if (container.lastElementChild?.dataset?.role !== role) {
      const label = document.createElement('strong');
      label.textContent = role === 'user' ? 'Tú' : 'Iti IA';
      message.append(label);
    }

    content.text.forEach(value => {
      const paragraph = document.createElement('p');
      paragraph.textContent = safeText(value);
      message.append(paragraph);
    });
    const recommendationList = document.createElement('ol');
    recommendationList.className = 'iti-recommendations';
    content.recommendations.slice(0, 3).forEach(recommendation => {
      const item = document.createElement('li');
      const shot = document.createElement('figure');
      const match = recommendation?.title ? findCachedBook(foldTitle(recommendation.title)) : null;
      if (match?.coverUrl && /^(\/|https:\/\/covers\.openlibrary\.org\/)/.test(match.coverUrl)) {
        const image = document.createElement('img');
        image.src = match.coverUrl;
        image.alt = '';
        image.loading = 'lazy';
        shot.append(image);
      } else {
        shot.textContent = safeText(recommendation?.title, 'Iti').slice(0, 24);
      }
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = safeText(recommendation?.title, 'Título no disponible');
      const author = document.createElement('span');
      author.textContent = safeText(recommendation?.author, 'Autor no disponible');
      const reason = document.createElement('p');
      reason.textContent = safeText(recommendation?.reason, 'Consulta los detalles con la librería.');
      body.append(title, author, reason);
      if (recommendation?.isTestData === true) {
        const badge = document.createElement('small');
        badge.textContent = 'Datos de prueba · no es inventario';
        body.append(badge);
      }
      const actions = document.createElement('div');
      actions.className = 'iti-rec-actions';
      if (recommendation?.title && recommendation.title !== 'Título no disponible') {
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'iti-open-book';
        open.append('Ver ficha del libro ', createIcon('icon-arrow-right'));
        open.addEventListener('click', () => openRecommendation(recommendation.title));
        actions.append(open);
      }
      if (recommendation?.isTestData !== true && recommendation?.title) {
        const link = document.createElement('a');
        link.href = `${WHATSAPP}?text=${encodeURIComponent(recommendation.whatsappPrefill || `Hola, quiero consultar "${recommendation.title}".`)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.append('Consultar por WhatsApp ', createIcon());
        actions.append(link);
      }
      if (actions.children.length) body.append(actions);
      item.append(shot, body);
      recommendationList.append(item);
    });
    if (recommendationList.children.length) message.append(recommendationList);
    const hasContent = [...message.children].some(child => child.tagName !== 'STRONG');
    if (!hasContent) return false;
    container.append(message);
    container.scrollTop = container.scrollHeight;
    return true;
  }

  function initItiIa() {
    const dialog = document.getElementById('itiIaDialog');
    const form = document.getElementById('itiIaForm');
    const input = document.getElementById('itiIaInput');
    const submit = document.getElementById('itiIaSubmit');
    const messages = document.getElementById('itiIaMessages');
    const status = document.getElementById('itiIaStatus');
    const fallback = document.getElementById('itiIaFallback');
    if (!dialog || !form || !input || !submit || !messages || !status) return;

    const conversation = [];
    let lastFocus = null;
    const close = () => {
      dialog.close();
      lastFocus?.focus();
    };

    document.querySelectorAll('[data-iti-ia-open]').forEach(opener => {
      opener.addEventListener('click', event => {
        lastFocus = event.currentTarget;
        dialog.showModal();
        input.focus();
        if (!conversation.length) renderItiPredictions(ITI_STARTERS);
      });
    });
    input.addEventListener('input', () => {
      clearTimeout(itiPredictionsTimer);
      itiPredictionsTimer = setTimeout(() => {
        const value = input.value.trim();
        renderItiPredictions(value ? predictItiQueries(value) : (conversation.length ? [] : ITI_STARTERS));
      }, 150);
    });
    document.querySelector('[data-iti-ia-close]')?.addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question || submit.disabled) return;
      const userMessage = { role: 'user', content: [{ text: question }] };
      conversation.push(userMessage);
      appendItiMessage(messages, 'user', { text: [question], recommendations: [] });
      input.value = '';
      renderItiPredictions([]);
      submit.disabled = true;
      messages.setAttribute('aria-busy', 'true');
      if (fallback) fallback.hidden = true;
      status.classList.remove('is-error');
      status.textContent = 'Consultando el catálogo…';
      try {
        const response = await fetch('/api/ai/iti-ia', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(90_000),
          body: JSON.stringify({ data: { messages: conversation.slice(-19) } })
        });
        if (!response.ok) throw new Error(`iti_ia_${response.status}`);
        const payload = await response.json();
        const assistantMessages = Array.isArray(payload?.result) ? payload.result : [];
        let rendered = false;
        assistantMessages.forEach(message => {
          const content = extractAssistantContent(message);
          rendered = appendItiMessage(messages, 'model', content) || rendered;
          if (content.text.length) conversation.push({ role: 'model', content: [{ text: content.text.join('\n') }] });
        });
        if (!rendered) throw new Error('iti_ia_empty');
        const isTestData = assistantMessages.some(message =>
          extractAssistantContent(message).recommendations.some(book => book.isTestData === true));
        status.textContent = isTestData
          ? 'Consulta de prueba lista. Estos libros no representan inventario.'
          : 'Respuesta lista. Confirma existencia con la librería.';
      } catch (error) {
        if (conversation.at(-1) === userMessage) conversation.pop();
        if (!input.value.trim()) input.value = question;
        status.classList.add('is-error');
        status.textContent = error instanceof Error && /iti_ia_(429|503)/.test(error.message)
          ? 'Iti IA alcanzó temporalmente el límite de consultas. Intenta de nuevo en un momento.'
          : 'No pude consultar el catálogo. Tu pregunta sigue en el historial; puedes volver a enviarla.';
        if (fallback) fallback.hidden = false;
      } finally {
        submit.disabled = false;
        messages.setAttribute('aria-busy', 'false');
      }
    });
  }

  function restoreDeepLink() {
    if (!location.hash) return;
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    const loaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    Promise.allSettled([loaded, document.fonts?.ready || Promise.resolve()])
      .then(() => window.requestAnimationFrame(() => target.scrollIntoView()));
  }

  function initFab() {
    const fab = document.getElementById('itiFab');
    if (!fab || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastY = window.scrollY;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        fab.classList.toggle('is-hidden', y > lastY && y > 240);
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  initEntrance();
  initMenu();
  initDemoCard();
  initScrollScrub();
  initCatalog();
  initChapterNav();
  initItiIa();
  initFab();
  restoreDeepLink();
})();
