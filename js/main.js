// ===== Bahari Seafood — Interactions =====

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const navBackdrop = document.getElementById('navBackdrop');

  if (navToggle && mainNav) {
    const setOpen = (isOpen) => {
      mainNav.classList.toggle('open', isOpen);
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (navBackdrop) navBackdrop.classList.toggle('visible', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
    };

    navToggle.addEventListener('click', () => {
      setOpen(!mainNav.classList.contains('open'));
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => setOpen(false));
    }
  }

  // Scroll reveal animation
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // Back to top button
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Contact form (front-end only — no backend wired up)
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  if (contactForm && formStatus) {
    const isEnglish = document.documentElement.lang === 'en';
    const successMessage = isEnglish
      ? 'Thank you! Your message has been received. Our team will get back to you shortly.'
      : 'Terima kasih! Pesan Anda telah diterima. Tim kami akan segera menghubungi Anda.';
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formStatus.textContent = successMessage;
      contactForm.reset();
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
