/* ==========================================================================
   SITED Soluciones Tecnológicas — Cotizador Simplificado (Solo WhatsApp IA/CRM)
   Desplegables con flechita, sin exposición visual del resumen, envío directo.
   ========================================================================== */

(function () {
  const form = document.getElementById('cotizador-form');
  if (!form) return;

  const WA_BASE = 'https://wa.me/526183329565';
  const accordions = Array.from(form.querySelectorAll('.quote-accordion'));
  const profileButtons = Array.from(form.querySelectorAll('[data-choice="perfil"]'));
  const scaleButtons = Array.from(form.querySelectorAll('[data-choice="escala"]'));
  const propertyButtons = Array.from(form.querySelectorAll('[data-choice="inmueble"]'));
  const invoiceButtons = Array.from(form.querySelectorAll('[data-choice="factura"]'));
  const paymentButtons = Array.from(form.querySelectorAll('[data-choice="pago"]'));
  const serviceChecks = Array.from(form.querySelectorAll('input[name="servicios"]'));

  const valPerfil = document.getElementById('quote-val-perfil');
  const valServicios = document.getElementById('quote-val-servicios');
  const valDetalles = document.getElementById('quote-val-detalles');

  const companyGroup = document.getElementById('quote-company-group');
  const companyInput = document.getElementById('quote-company');
  const nameInput = document.getElementById('quote-name');
  const phoneInput = document.getElementById('quote-phone');
  const locationInput = document.getElementById('quote-location');
  const notesInput = document.getElementById('quote-notes');
  const legalCheck = document.getElementById('quote-legal-accept');

  const errorEl = document.getElementById('quote-error');
  const sendBtn = document.getElementById('quote-send-wa');

  const state = {
    perfil: 'Hogar / Residencial',
    escala: '1 a 3 zonas o equipos',
    inmueble: 'Inmueble ya construido',
    factura: 'No requerida',
    pago: 'Contado / Transferencia / Tarjeta 1 exhibición',
  };

  function setAccordionOpen(acc, open) {
    if (!acc) return;
    acc.classList.toggle('is-open', open);
    const trigger = acc.querySelector('.quote-accordion-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  accordions.forEach((acc) => {
    const trigger = acc.querySelector('.quote-accordion-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const currentlyOpen = acc.classList.contains('is-open');
      setAccordionOpen(acc, !currentlyOpen);
    });
  });

  function updateHeaderBadges() {
    if (valPerfil) valPerfil.textContent = state.perfil;

    const selected = getSelectedServices();
    if (valServicios) {
      if (selected.length === 0) {
        valServicios.textContent = 'Seleccionar servicios';
      } else if (selected.length === 1) {
        valServicios.textContent = selected[0];
      } else {
        valServicios.textContent = `${selected.length} servicios seleccionados`;
      }
    }

    if (valDetalles) {
      const cfdiTag = state.factura.startsWith('Sí') ? 'Con CFDI' : 'Sin CFDI';
      const payTag = /meses/i.test(state.pago) ? 'A meses' : 'Contado/1 exh.';
      valDetalles.textContent = `${state.escala} · ${cfdiTag} · ${payTag}`;
    }
  }

  function bindChoiceGroup(buttons, key, onChange) {
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-selected', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        state[key] = btn.dataset.value || btn.textContent.trim();
        if (onChange) onChange(state[key]);
        updateHeaderBadges();
      });
    });
  }

  function updateCompanyVisibility(perfilVal) {
    const isB2B = /Negocio|Restaurante|Bar|Comercio|Empresa|Corporativo|Hospital|Escuela|Plaza/i.test(perfilVal);
    if (companyGroup) companyGroup.hidden = !isB2B;
    if (isB2B && state.factura === 'No requerida') {
      const siBtn = invoiceButtons.find((b) => (b.dataset.value || '').startsWith('Sí'));
      if (siBtn) siBtn.click();
    }
  }

  function getSelectedServices() {
    return serviceChecks.filter((cb) => cb.checked).map((cb) => cb.dataset.label || cb.value);
  }

  function buildPayloadText() {
    const selected = getSelectedServices();
    const serviciosLine = selected.length > 0 ? selected.join(' | ') : 'Por definir con asesoría';
    const empresa = companyGroup && !companyGroup.hidden ? (companyInput?.value.trim() || 'No especificada') : 'N/A (Residencial)';
    const nombre = nameInput?.value.trim() || 'Pendiente';
    const telefono = phoneInput?.value.trim() || 'Pendiente';
    const ubicacion = locationInput?.value.trim() || 'Durango, Dgo.';
    const notas = notesInput?.value.trim() || 'Ninguna';

    return [
      'SOLICITUD_COTIZACION_SITED',
      `PERFIL: ${state.perfil}`,
      `EMPRESA: ${empresa}`,
      `SERVICIOS: ${serviciosLine}`,
      `ESCALA: ${state.escala}`,
      `ESTADO_INMUEBLE: ${state.inmueble}`,
      `FACTURA_CFDI: ${state.factura}`,
      `ESQUEMA_PAGO: ${state.pago}`,
      `NOMBRE: ${nombre}`,
      `TELEFONO: ${telefono}`,
      `UBICACION: ${ubicacion}`,
      `NOTAS: ${notas}`,
      'ORIGEN: Web SITED Soluciones Tecnológicas',
    ].join('\n');
  }

  bindChoiceGroup(profileButtons, 'perfil', updateCompanyVisibility);
  bindChoiceGroup(scaleButtons, 'escala');
  bindChoiceGroup(propertyButtons, 'inmueble');
  bindChoiceGroup(invoiceButtons, 'factura');
  bindChoiceGroup(paymentButtons, 'pago');

  serviceChecks.forEach((cb) => cb.addEventListener('change', updateHeaderBadges));

  // Selector programático desde Quick View o query string (?servicio=slug)
  window.sitedSelectServiceInQuote = function (slug, shouldScroll) {
    const target = serviceChecks.find((cb) => cb.value === slug);
    if (target) {
      target.checked = true;
      const srvAcc = form.querySelector('.quote-accordion[data-acc="servicios"]');
      if (srvAcc) setAccordionOpen(srvAcc, true);

      if (slug === 'control-accesos-empresariales' || slug === 'sistemas-voz-y-datos') {
        const corpBtn = profileButtons.find((b) => /Corporativo/i.test(b.dataset.value || ''));
        if (corpBtn) corpBtn.click();
      } else if (slug === 'control-accesos-airbnb') {
        const airbnbBtn = profileButtons.find((b) => /Airbnb/i.test(b.dataset.value || ''));
        if (airbnbBtn) airbnbBtn.click();
      }
      updateHeaderBadges();
    }

    if (shouldScroll) {
      const section = document.getElementById('cotizador');
      if (section) {
        if (typeof window.sitedSmoothScrollTo === 'function') {
          window.sitedSmoothScrollTo(section, 800);
        } else {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const params = new URLSearchParams(window.location.search);
  const preSlug = params.get('servicio');
  if (preSlug) {
    window.sitedSelectServiceInQuote(preSlug, false);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const selected = getSelectedServices();
      const nombre = nameInput?.value.trim() || '';
      const telefono = phoneInput?.value.trim() || '';

      if (selected.length === 0) {
        const srvAcc = form.querySelector('.quote-accordion[data-acc="servicios"]');
        if (srvAcc) setAccordionOpen(srvAcc, true);
        if (errorEl) errorEl.textContent = 'Selecciona al menos un servicio antes de enviar tu cotización.';
        return;
      }
      if (!nombre) {
        if (errorEl) errorEl.textContent = 'Ingresa tu nombre para personalizar la atención en WhatsApp.';
        nameInput?.focus();
        return;
      }
      if (!telefono || telefono.replace(/\D/g, '').length < 7) {
        if (errorEl) errorEl.textContent = 'Ingresa un número de teléfono o WhatsApp válido.';
        phoneInput?.focus();
        return;
      }
      if (legalCheck && !legalCheck.checked) {
        if (errorEl) errorEl.textContent = 'Acepta el Aviso de Privacidad y los Términos y Condiciones para enviar tu cotización.';
        legalCheck.focus();
        return;
      }

      if (errorEl) errorEl.textContent = '';
      const payload = buildPayloadText();
      const url = `${WA_BASE}?text=${encodeURIComponent(payload)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  updateHeaderBadges();
})();
