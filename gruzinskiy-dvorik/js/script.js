(() => {
  'use strict';

  /* ---------- header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- scroll cue ---------- */
  const scrollCue = document.getElementById('scrollCue');
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      document.querySelector('.marquee')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  const closeNav = () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------- scroll reveal ---------- */
  const revealItems = document.querySelectorAll('[data-reveal]');
  const vineDividers = document.querySelectorAll('.vine-divider');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach(el => io.observe(el));

    const vineIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          vineIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    vineDividers.forEach(el => vineIo.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in-view'));
    vineDividers.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- booking form validation (demo, no backend) ---------- */
  const form = document.getElementById('bookingForm');
  const successMsg = document.getElementById('formSuccess');

  if (form) {
    const dateInput = form.querySelector('#fDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      successMsg.classList.remove('is-visible');

      let isValid = true;
      const fields = form.querySelectorAll('.form-row input[required], .form-row textarea[required]');

      fields.forEach(field => {
        const row = field.closest('.form-row');
        const fieldValid = field.checkValidity();
        row.classList.toggle('is-invalid', !fieldValid);
        if (!fieldValid) isValid = false;
      });

      if (!isValid) {
        form.querySelector('.form-row.is-invalid input, .form-row.is-invalid textarea')?.focus();
        return;
      }

      successMsg.classList.add('is-visible');
      form.reset();
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => {
        const row = field.closest('.form-row');
        if (field.checkValidity()) row.classList.remove('is-invalid');
      });
    });
  }
})();
