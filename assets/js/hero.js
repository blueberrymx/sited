/* ==========================================================================
   SITED Soluciones Tecnológicas — Hero Carrusel (Autoplay 7s + Fade Out / Fade In)
   ========================================================================== */

(function () {
  const hero = document.getElementById('inicio');
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll('.hero-slide'));
  const dots = Array.from(hero.querySelectorAll('.hero-dot'));
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  const toggleBtn = document.getElementById('hero-toggle');
  const iconPause = document.getElementById('hero-icon-pause');
  const iconPlay = document.getElementById('hero-icon-play');

  if (slides.length === 0) return;

  const AUTO_MS = 7000;
  let current = 0;
  let playing = true;
  let timerId = null;
  let fadeTimer = null;
  let cleanTimer = null;

  function restartDotAnimation(activeIdx) {
    dots.forEach((dot, idx) => {
      const active = idx === activeIdx;
      dot.classList.remove('is-active');
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      const fill = dot.querySelector('.hero-dot-fill');
      if (fill) {
        void fill.offsetWidth;
      }
      if (active) {
        dot.classList.add('is-active');
      }
    });
  }

  function renderSlide(nextIndex, immediate) {
    const total = slides.length;
    const prevIdx = current;
    current = ((nextIndex % total) + total) % total;

    if (fadeTimer) {
      window.clearTimeout(fadeTimer);
      fadeTimer = null;
    }
    if (cleanTimer) {
      window.clearTimeout(cleanTimer);
      cleanTimer = null;
    }

    restartDotAnimation(current);

    if (immediate || prevIdx === current) {
      slides.forEach((slide, idx) => {
        const active = idx === current;
        slide.classList.remove('is-leaving');
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      return;
    }

    // Secuencia Fade Out -> Fade In entre diapositivas
    slides.forEach((slide, idx) => {
      slide.classList.remove('is-active', 'is-leaving');
      if (idx === prevIdx) {
        slide.classList.add('is-leaving');
        slide.setAttribute('aria-hidden', 'true');
      } else {
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    fadeTimer = window.setTimeout(() => {
      const target = slides[current];
      if (target) {
        target.classList.add('is-active');
        target.setAttribute('aria-hidden', 'false');
      }
    }, 220);

    cleanTimer = window.setTimeout(() => {
      slides.forEach((slide) => slide.classList.remove('is-leaving'));
    }, 520);
  }

  function restartTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    if (playing) {
      timerId = window.setInterval(() => {
        renderSlide(current + 1, false);
      }, AUTO_MS);
    }
  }

  function updatePlaybackUI() {
    hero.classList.toggle('is-paused', !playing);
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', playing ? 'false' : 'true');
      toggleBtn.setAttribute('aria-label', playing ? 'Pausar carrusel' : 'Reproducir carrusel');
      toggleBtn.title = playing ? 'Pausar presentación' : 'Reproducir presentación';
    }
    if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
    if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
  }

  function goTo(index) {
    renderSlide(index, false);
    restartTimer();
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => goTo(idx));
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goTo(current - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => goTo(current + 1));
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      playing = !playing;
      updatePlaybackUI();
      restartTimer();
    });
  }

  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  let touchStartX = 0;
  hero.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  hero.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 48) {
        goTo(dx < 0 ? current + 1 : current - 1);
      }
    },
    { passive: true }
  );

  renderSlide(0, true);
  updatePlaybackUI();
  restartTimer();
})();
