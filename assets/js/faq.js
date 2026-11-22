/* ==========================================================================
   SITED Soluciones Tecnológicas — FAQ Acordeón Accesible
   ========================================================================== */

(function () {
  const faqItems = Array.from(document.querySelectorAll('.faq-item'));
  if (faqItems.length === 0) return;

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Cerrar otros ítems para mantener la lectura limpia y minimalista
      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.faq-trigger');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
