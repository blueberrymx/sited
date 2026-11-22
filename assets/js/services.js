/* ==========================================================================
   SITED Soluciones Tecnológicas — Filtro de Servicios & Quick View Modal
   ========================================================================== */

(function () {
  const servicesData = Array.isArray(window.SITED_SERVICES) ? window.SITED_SERVICES : [];
  const serviceMap = new Map(servicesData.map((s) => [s.slug, s]));

  const filterTabs = Array.from(document.querySelectorAll('.filter-tab'));
  const strips = Array.from(document.querySelectorAll('.service-strip'));
  const modal = document.getElementById('quickview-modal');
  const closeBtn = document.getElementById('quickview-close');
  const qvImg = document.getElementById('qv-img');
  const qvCategory = document.getElementById('qv-category');
  const qvTitle = document.getElementById('qv-title');
  const qvHeadline = document.getElementById('qv-headline');
  const qvDesc = document.getElementById('qv-desc');
  const qvBullets = document.getElementById('qv-bullets');
  const qvTechs = document.getElementById('qv-techs');
  const qvQuoteBtn = document.getElementById('qv-quote-btn');
  const qvPageLink = document.getElementById('qv-page-link');

  let lastTrigger = null;

  // Filtrado minimalista por categoría + sincronización con carrusel móvil
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter || 'all';
      filterTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      strips.forEach((strip) => {
        const cats = (strip.dataset.categories || '').split(',').map((c) => c.trim());
        const show = filter === 'all' || cats.includes(filter);
        strip.classList.toggle('is-hidden', !show);
      });

      if (window.sitedCarousels && window.sitedCarousels.services) {
        window.sitedCarousels.services.refresh(true);
      }
    });
  });

  function categoryLabel(cats) {
    const names = { hogar: 'Hogar', hospitality: 'Airbnb', b2b: 'Empresas B2B' };
    return (cats || []).map((c) => names[c] || c).join(' · ');
  }

  function openQuickView(slug, triggerEl) {
    const item = serviceMap.get(slug);
    if (!item || !modal) return;
    lastTrigger = triggerEl || null;

    if (qvImg) {
      qvImg.src = item.image;
      qvImg.alt = item.imageAlt || item.name;
    }

    if (qvCategory) qvCategory.textContent = categoryLabel(item.categories);
    if (qvTitle) qvTitle.textContent = item.name;
    if (qvHeadline) qvHeadline.textContent = item.heroHeadline || '';
    if (qvDesc) qvDesc.textContent = (item.descriptionLong || []).join(' ');

    if (qvBullets) {
      qvBullets.innerHTML = '';
      (item.keyBenefits || []).forEach((b) => {
        const li = document.createElement('li');
        li.textContent = b;
        qvBullets.appendChild(li);
      });
    }

    if (qvTechs) {
      qvTechs.textContent = `Tecnologías y marcas: ${(item.technologies || []).join(' · ')} — ${(item.recommendedBrands || []).join(', ')}`;
    }

    if (qvQuoteBtn) {
      qvQuoteBtn.dataset.slug = item.slug;
    }

    if (qvPageLink) {
      qvPageLink.href = `servicios/${item.slug}/index.html`;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeQuickView() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
  }

  strips.forEach((strip) => {
    strip.addEventListener('click', (e) => {
      if (e.target.closest('a[data-direct-link]')) return;
      const slug = strip.dataset.slug;
      openQuickView(slug, strip);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeQuickView();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeQuickView();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickView();
  });

  if (qvQuoteBtn) {
    qvQuoteBtn.addEventListener('click', () => {
      const slug = qvQuoteBtn.dataset.slug;
      closeQuickView();
      if (typeof window.sitedSelectServiceInQuote === 'function' && slug) {
        window.sitedSelectServiceInQuote(slug, true);
      }
    });
  }
})();
