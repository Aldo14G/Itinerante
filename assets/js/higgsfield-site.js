/* Local runtime for the Claude cinematic page; no Higgsfield SDK or remote dependency. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  function initMenu() {
    const header = document.querySelector('[data-site-header]');
    const toggle = header?.querySelector('.menu-toggle');
    const panel = document.getElementById('site-navigation');
    if (!header || !toggle || !panel) return;
    const links = [...panel.querySelectorAll('a')];
    const compact = window.matchMedia('(max-width: 1100px)');
    const isToggleVisible = () => compact.matches;
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
      if (open) links[0]?.focus({ preventScroll: true });
    };
    const syncMenuToViewport = () => {
      if (!isToggleVisible()) {
        header.classList.remove('menu-open');
        panel.removeAttribute('inert');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
      } else if (header.classList.contains('menu-open')) {
        panel.removeAttribute('inert');
      } else {
        panel.setAttribute('inert', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    };
    syncMenuToViewport();
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
    compact.addEventListener('change', syncMenuToViewport);
  }

  function initScrollScrub() {
    const root = document.querySelector('[data-scroll-scrub]');
    const video = root?.querySelector('video');
    const stage = root?.querySelector('.scroll-scrub__stage');
    const frames = [...(root?.querySelectorAll('[data-frame]') || [])];
    if (!root || !video || !stage || !frames.length) return;

    const frameStops = [0, .14, .25, .38, .5, .62, .71];
    const portrait = window.matchMedia('(max-aspect-ratio: 3/4)');
    const largeScreen = window.matchMedia('(min-width: 1024px)');
    const epsilon = 1 / 30;
    let renderFrame = 0;
    let videoFrame = 0;
    let duration = 0;
    let loaded = false;
    let targetTime = 0;
    let lowBattery = false;
    let inView = true;
    let engaged = false;
    let rootTop = 0;
    let distance = 1;
    let calm = reducedMotion.matches;
    const motionToggle = document.querySelector('[data-motion-toggle]');
    const videoEnabled = () => largeScreen.matches && !calm && !reducedMotion.matches && !navigator.connection?.saveData && !lowBattery;

    const lingerEase = value => {
      const amount = .12;
      const centered = value - .5;
      return (1 - amount) * value + amount * (4 * centered ** 3 + .5);
    };

    const progress = () => Math.min(1, Math.max(0, (window.scrollY - rootTop) / distance));

    const showFrame = value => {
      let active = 0;
      frameStops.forEach((stop, index) => { if (value >= stop) active = index; });
      root.dataset.activeFrame = String(active);
      const frame = frames[active];
      frame.querySelectorAll('source[data-srcset]').forEach(source => {
        source.srcset = source.dataset.srcset;
        delete source.dataset.srcset;
      });
      const image = frame.querySelector('img[data-src]');
      if (image) {
        image.src = image.dataset.src;
        delete image.dataset.src;
      }
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

    // Measure after layout, not on every scroll or during initial script evaluation.
    const measure = () => {
      rootTop = root.getBoundingClientRect().top + window.scrollY;
      distance = Math.max(root.offsetHeight - stage.clientHeight, 1);
      requestRender();
    };
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(measure);
      observer.observe(root);
      observer.observe(stage);
    } else {
      measure();
      window.addEventListener('resize', measure);
    }

    const loadVideo = () => {
      if (loaded || !engaged || !videoEnabled()) return;
      loaded = true;
      video.preload = 'auto';
      if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster;
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
      video.removeAttribute('poster');
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

    navigator.getBattery?.().then(battery => {
      if (!battery.charging && battery.level <= .2) {
        lowBattery = true;
        unloadVideo();
      }
    }).catch(() => {});

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    portrait.addEventListener('change', () => { unloadVideo(); if (inView) loadVideo(); });
    largeScreen.addEventListener('change', () => { unloadVideo(); if (inView) loadVideo(); });
    reducedMotion.addEventListener('change', () => {
      calm = reducedMotion.matches;
      syncMotionControl();
      if (!videoEnabled()) unloadVideo();
      else if (inView) loadVideo();
    });
    const syncMotionControl = () => {
      document.documentElement.dataset.calm = String(calm);
      if (!motionToggle) return;
      motionToggle.hidden = false;
      motionToggle.disabled = reducedMotion.matches;
      motionToggle.setAttribute('aria-pressed', String(calm));
      motionToggle.textContent = calm ? 'Movimiento reducido' : 'Reducir movimiento';
    };
    motionToggle?.addEventListener('click', () => {
      calm = !calm;
      syncMotionControl();
      if (calm) unloadVideo();
      else if (inView) loadVideo();
    });
    syncMotionControl();
    document.addEventListener('visibilitychange', requestRender);
    render();
  }

  function initChapterNav() {
    const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
    const chapters = links.map(link => ({ link, target: document.querySelector(link.hash) })).filter(item => item.target);
    if (!chapters.length) return;

    const setCurrent = target => {
      chapters.forEach(chapter => {
        if (chapter.target === target) chapter.link.setAttribute('aria-current', 'true');
        else chapter.link.removeAttribute('aria-current');
      });
    };

    if (!('IntersectionObserver' in window)) {
      setCurrent(chapters[0].target);
      return;
    }

    const visible = new Map();
    let current = chapters[0].target;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target, entry.isIntersecting));
      const active = chapters.filter(chapter => visible.get(chapter.target));
      if (active.length) current = active[active.length - 1].target;
      setCurrent(current);
    }, { rootMargin: '-45% 0px -50% 0px' });
    chapters.forEach(chapter => observer.observe(chapter.target));
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

  initMenu();
  initScrollScrub();
  initChapterNav();
  restoreDeepLink();
})();
