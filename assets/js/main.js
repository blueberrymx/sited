/* ==========================================================================
   SITED Soluciones Tecnológicas — UI, Barrido Suave, Carruseles Móviles y Parallax
   ========================================================================== */

(function () {
  const header = document.getElementById('site-header');
  const menuBtn = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const drawerClose = document.getElementById('mobile-drawer-close');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroEl = document.getElementById('inicio');

  // Header flotante al desplazarse (50% transparente mientras el Hero está en pantalla)
  function updateHeader() {
    if (!header) return;
    const headerH = header.offsetHeight || 72;
    const scrolledPastHero = heroEl
      ? heroEl.getBoundingClientRect().bottom <= headerH
      : window.scrollY > 36;
    header.classList.toggle('is-scrolled', scrolledPastHero);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader, { passive: true });
  updateHeader();

  // Barrido suave lento y continuo entre secciones, logo e inicio
  let activeScrollRaf = null;

  function cancelSmoothScroll() {
    if (activeScrollRaf) {
      window.cancelAnimationFrame(activeScrollRaf);
      activeScrollRaf = null;
    }
  }

  window.addEventListener('wheel', cancelSmoothScroll, { passive: true });
  window.addEventListener('touchstart', cancelSmoothScroll, { passive: true });

  window.sitedSmoothScrollTo = function (targetOrY, customDuration) {
    let destY = 0;

    if (typeof targetOrY === 'number') {
      destY = Math.max(0, targetOrY);
    } else if (targetOrY && typeof targetOrY.getBoundingClientRect === 'function') {
      if (targetOrY.id === 'inicio') {
        destY = 0;
      } else {
        const headerH = header ? header.offsetHeight : 0;
        const rect = targetOrY.getBoundingClientRect();
        destY = Math.max(0, window.scrollY + rect.top - Math.max(0, headerH - 8));
      }
    }

    cancelSmoothScroll();
    const startY = window.scrollY;
    const distance = destY - startY;
    if (Math.abs(distance) < 2) {
      window.scrollTo(0, destY);
      return;
    }

    // Duración proporcional al recorrido para que de Footer a Inicio recorra toda la página suavemente
    const ms = typeof customDuration === 'number'
      ? customDuration
      : Math.min(2000, Math.max(850, Math.abs(distance) * 0.36));

    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / ms);
      const eased = easeInOutCubic(progress);
      const nextY = Math.round(startY + distance * eased);

      try {
        window.scrollTo({ top: nextY, left: 0, behavior: 'instant' });
      } catch (_) {
        window.scrollTo(0, nextY);
      }

      if (progress < 1) {
        activeScrollRaf = window.requestAnimationFrame(step);
      } else {
        activeScrollRaf = null;
      }
    }

    activeScrollRaf = window.requestAnimationFrame(step);
  };

  function isHomePage() {
    return Boolean(document.getElementById('inicio') && document.getElementById('servicios'));
  }

  function extractSamePageHash(href) {
    if (!href) return null;
    if (href.startsWith('#')) return href;
    if (isHomePage() && /^(?:\.\/)?index\.html(?:#.*)?$/i.test(href)) {
      const idx = href.indexOf('#');
      return idx >= 0 ? href.slice(idx) : '#inicio';
    }
    return null;
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const rawHref = link.getAttribute('href');
    const hash = extractSamePageHash(rawHref);
    if (!hash) return;

    const targetId = hash.slice(1);
    const targetEl = targetId ? document.getElementById(targetId) : document.getElementById('inicio');
    if (!targetEl && hash !== '#') return;

    e.preventDefault();
    if (drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
    window.sitedSmoothScrollTo(targetEl || 0);
    if (hash && hash !== '#' && history.pushState) {
      try {
        history.pushState(null, '', hash);
      } catch (_) {}
    }
  });

  // Menú móvil accesible
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (drawerClose) {
    drawerClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer();
    });
  }
  if (drawer) {
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Carruseles horizontales interactivos en móvil (barrido suave JS sin saltos)
  window.sitedCarousels = {};

  function smoothScrollX(track, destLeft, duration) {
    const ms = typeof duration === 'number' ? duration : 560;
    const startLeft = track.scrollLeft;
    const dist = destLeft - startLeft;
    if (Math.abs(dist) < 2) {
      track.scrollLeft = destLeft;
      return null;
    }

    const prevSnap = track.style.scrollSnapType;
    track.style.scrollSnapType = 'none';
    const startTime = performance.now();
    let rafId = null;

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
      const progress = Math.min(1, (now - startTime) / ms);
      const eased = easeInOutCubic(progress);
      track.scrollLeft = startLeft + dist * eased;
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        track.style.scrollSnapType = prevSnap || '';
        rafId = null;
      }
    }

    rafId = window.requestAnimationFrame(step);
    return {
      cancel() {
        if (rafId) window.cancelAnimationFrame(rafId);
        track.style.scrollSnapType = prevSnap || '';
      },
    };
  }

  function initMobileCarousel(wrap) {
    const name = wrap.dataset.carousel;
    const track = wrap.querySelector('.services-stream, .brands-list, .steps-list, .b2b-grid, .reviews-grid');
    const prevBtn = wrap.querySelector('[data-carousel-prev]');
    const nextBtn = wrap.querySelector('[data-carousel-next]');
    const counterEl = wrap.querySelector('[data-carousel-counter]');
    if (!track) return null;

    let currentIdx = 0;
    let animHandle = null;

    function getVisibleItems() {
      return Array.from(track.children).filter((el) => !el.classList.contains('is-hidden'));
    }

    function updateCounterOnly(idx, total) {
      const pad = (n) => String(n).padStart(2, '0');
      if (counterEl) counterEl.textContent = total ? `${pad(idx + 1)} / ${pad(total)}` : '00 / 00';
      if (prevBtn) prevBtn.disabled = total === 0 || idx <= 0;
      if (nextBtn) nextBtn.disabled = total === 0 || idx >= total - 1;
    }

    function updateState() {
      const items = getVisibleItems();
      const total = items.length;
      if (total === 0) {
        updateCounterOnly(0, 0);
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      items.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        const elCenter = r.left + r.width / 2;
        const dist = Math.abs(elCenter - trackCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      currentIdx = bestIdx;
      updateCounterOnly(currentIdx, total);
    }

    function scrollToItem(targetIdx) {
      const items = getVisibleItems();
      if (items.length === 0) return;
      const clamped = Math.max(0, Math.min(items.length - 1, targetIdx));
      const el = items[clamped];
      const destLeft = Math.max(0, el.offsetLeft);

      if (animHandle) animHandle.cancel();
      currentIdx = clamped;
      updateCounterOnly(currentIdx, items.length);
      animHandle = smoothScrollX(track, destLeft, 560);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToItem(currentIdx - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToItem(currentIdx + 1);
      });
    }

    track.addEventListener(
      'touchstart',
      () => {
        if (animHandle) {
          animHandle.cancel();
          animHandle = null;
        }
      },
      { passive: true }
    );

    let scrollDebounce = null;
    track.addEventListener(
      'scroll',
      () => {
        if (scrollDebounce) window.clearTimeout(scrollDebounce);
        scrollDebounce = window.setTimeout(updateState, 70);
      },
      { passive: true }
    );
    window.addEventListener('resize', updateState, { passive: true });

    const api = {
      refresh(resetScroll) {
        if (animHandle) {
          animHandle.cancel();
          animHandle = null;
        }
        if (resetScroll) {
          track.scrollLeft = 0;
        }
        updateState();
      },
    };

    if (name) window.sitedCarousels[name] = api;
    updateState();
    return api;
  }

  document.querySelectorAll('[data-carousel]').forEach(initMobileCarousel);

  // Aparición progresiva de contenido al scroll
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Menú activo según sección visible (ScrollSpy en portada / Servicios en detalle)
  const navLinks = Array.from(document.querySelectorAll('.nav-desktop .nav-link, .mobile-drawer a'));
  const spyIds = ['inicio', 'servicios', 'cotizador', 'nosotros', 'empresas', 'contacto', 'faq'];
  const spySections = spyIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActiveNavId(activeId) {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const hashIdx = href.indexOf('#');
      const linkId = hashIdx >= 0 ? href.slice(hashIdx + 1) : '';
      const isMatch = linkId === activeId;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  let navTicking = false;

  function updateActiveNav() {
    navTicking = false;
    if (!isHomePage()) {
      setActiveNavId(document.querySelector('.service-hero') ? 'servicios' : '');
      return;
    }

    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (window.scrollY < 80) {
      setActiveNavId('inicio');
      return;
    }
    if (scrollBottom >= docHeight - 60 && spySections.length > 0) {
      setActiveNavId(spySections[spySections.length - 1].id);
      return;
    }

    const headerOffset = (header ? header.offsetHeight : 72) + Math.min(180, window.innerHeight * 0.26);
    const probeY = window.scrollY + headerOffset;
    let activeId = spySections[0] ? spySections[0].id : 'inicio';

    for (let i = 0; i < spySections.length; i += 1) {
      const sec = spySections[i];
      if (sec.offsetTop <= probeY) {
        activeId = sec.id;
      } else {
        break;
      }
    }
    setActiveNavId(activeId);
  }

  function scheduleActiveNav() {
    if (!navTicking) {
      navTicking = true;
      window.requestAnimationFrame(updateActiveNav);
    }
  }

  window.addEventListener('scroll', scheduleActiveNav, { passive: true });
  window.addEventListener('resize', scheduleActiveNav, { passive: true });
  updateActiveNav();

  // Gestión de consentimiento de cookies y preferencias (sited_cookie_consent)
  const CONSENT_KEY = 'sited_cookie_consent';
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptAllBtn = document.getElementById('cookie-accept-all');
  const essentialOnlyBtn = document.getElementById('cookie-essential-only');

  function readConsent() {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function showCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.hidden = false;
    cookieBanner.classList.add('is-visible');
  }

  function hideCookieBanner() {
    if (!cookieBanner) return;
    cookieBanner.classList.remove('is-visible');
    cookieBanner.hidden = true;
  }

  function saveConsent(analyticsAllowed) {
    const detail = {
      essential: true,
      analytics: Boolean(analyticsAllowed),
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(detail));
    } catch (_) {
      // Continuar aun si localStorage está restringido
    }
    hideCookieBanner();
    window.dispatchEvent(new CustomEvent('sited:cookie-consent', { detail }));
  }

  window.sitedOpenCookieBanner = function () {
    showCookieBanner();
  };

  if (cookieBanner) {
    if (!readConsent()) {
      showCookieBanner();
    }
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => saveConsent(true));
    }
    if (essentialOnlyBtn) {
      essentialOnlyBtn.addEventListener('click', () => saveConsent(false));
    }
  }

  // Sub-ventana flotante (Modal Híbrido) para Marco Legal y preferencias de cookies
  const legalModal = document.getElementById('legal-modal');
  const legalCloseBtn = document.getElementById('legal-modal-close');
  const legalScroll = document.getElementById('legal-modal-scroll');
  const legalEyebrow = document.getElementById('legal-modal-eyebrow');
  const legalTitle = document.getElementById('legal-modal-title');
  const legalMeta = document.getElementById('legal-modal-meta');
  const legalBody = document.getElementById('legal-modal-body');
  const legalStandalone = document.getElementById('legal-modal-standalone');
  const legalTabs = legalModal ? Array.from(legalModal.querySelectorAll('.legal-modal-tab')) : [];
  let legalLastTrigger = null;

  function renderLegalModalDoc(slug) {
    const legalMap = window.SITED_LEGAL;
    const item = legalMap && legalMap[slug];
    if (!item || !legalModal) return false;

    const prefix = legalModal.dataset.prefix || '';
    if (legalEyebrow) legalEyebrow.textContent = item.eyebrow || '';
    if (legalTitle) legalTitle.textContent = item.h1 || item.shortTitle || '';
    if (legalMeta) legalMeta.textContent = item.meta || '';
    if (legalBody) {
      legalBody.innerHTML = item.html || '';
      legalBody.querySelectorAll('a[data-legal-modal]').forEach((a) => {
        const targetSlug = a.dataset.legalModal;
        if (targetSlug) a.href = `${prefix}${targetSlug}/index.html`;
      });
    }
    if (legalStandalone) {
      legalStandalone.href = `${prefix}${slug}/index.html`;
    }
    legalTabs.forEach((tab) => {
      const active = tab.dataset.legalTab === slug;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (legalScroll) legalScroll.scrollTop = 0;
    return true;
  }

  function openLegalModal(slug, triggerEl) {
    if (!legalModal || !renderLegalModalDoc(slug)) return false;
    legalLastTrigger = triggerEl || null;
    legalModal.classList.add('is-open');
    legalModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (legalCloseBtn) legalCloseBtn.focus();
    return true;
  }

  function closeLegalModal() {
    if (!legalModal || !legalModal.classList.contains('is-open')) return;
    legalModal.classList.remove('is-open');
    legalModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (legalLastTrigger && typeof legalLastTrigger.focus === 'function') {
      legalLastTrigger.focus();
    }
  }

  if (legalCloseBtn) {
    legalCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeLegalModal();
    });
  }

  if (legalModal) {
    legalModal.addEventListener('click', (e) => {
      if (e.target === legalModal) closeLegalModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLegalModal();
  });

  document.addEventListener('click', (e) => {
    const settingsBtn = e.target.closest('[data-open-cookie-settings]');
    if (settingsBtn) {
      showCookieBanner();
      return;
    }

    const tabBtn = e.target.closest('.legal-modal-tab');
    if (tabBtn && tabBtn.dataset.legalTab) {
      renderLegalModalDoc(tabBtn.dataset.legalTab);
      return;
    }

    const legalLink = e.target.closest('a[data-legal-modal]');
    if (
      legalLink &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      const slug = legalLink.dataset.legalModal;
      if (slug && openLegalModal(slug, legalLink)) {
        e.preventDefault();
      }
    }
  });
})();
