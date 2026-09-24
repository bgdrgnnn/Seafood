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

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('open')) {
        setOpen(false);
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 1081px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => setOpen(false));
    }
  }

  // Build the catalog controls from the existing translated product content.
  const productGrid = document.querySelector('.product-grid');
  if (productGrid) {
    const english = document.documentElement.lang === 'en';
    const products = [...productGrid.querySelectorAll('.product-card')];
    products.forEach(card => {
      const name = card.querySelector('h3').textContent.trim();
      const inquiry = document.createElement('a');
      inquiry.className = 'product-inquiry';
      inquiry.target = '_blank';
      inquiry.rel = 'noopener';
      const message = english
        ? `Hello Bahari Seafood, I would like a quotation for ${name}.`
        : `Halo Bahari Seafood, saya ingin meminta penawaran untuk ${name}.`;
      inquiry.href = `https://wa.me/6282333842942?text=${encodeURIComponent(message)}`;
      inquiry.textContent = english ? 'Request a quotation' : 'Minta penawaran';
      inquiry.setAttribute('aria-label', `${inquiry.textContent}: ${name} (WhatsApp)`);
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '\u2197';
      inquiry.append(arrow);
      card.querySelector('.product-body').append(inquiry);
    });
    const tools = document.createElement('div');
    tools.className = 'product-tools';
    const searchLabel = document.createElement('label');
    searchLabel.className = 'product-search';
    searchLabel.textContent = english ? 'Search products' : 'Cari produk';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = english ? 'Product name or HS code' : 'Nama produk atau kode HS';
    searchLabel.append(search);
    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = english ? 'Category' : 'Kategori';
    const category = document.createElement('select');
    category.add(new Option(english ? 'All categories' : 'Semua kategori', ''));
    const categories = [...new Set(products.map(card => card.querySelector('.product-category').textContent.trim()))];
    categories.forEach(name => category.add(new Option(name, name)));
    categoryLabel.append(category);
    const count = document.createElement('p');
    count.className = 'product-count';
    count.setAttribute('role', 'status');
    tools.append(searchLabel, categoryLabel, count);
    productGrid.before(tools);
    const empty = document.createElement('p');
    empty.className = 'product-empty';
    empty.textContent = english ? 'Not in this selection? Send us your sourcing requirements above.' : 'Belum ada di pilihan ini? Sampaikan kebutuhan sourcing Anda melalui tombol di atas.';
    productGrid.append(empty);
    const filter = () => {
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      products.forEach(card => {
        const matches = card.textContent.toLocaleLowerCase().includes(query)
          && (!category.value || card.querySelector('.product-category').textContent.trim() === category.value);
        card.hidden = !matches;
        if (matches) {
          card.classList.add('visible');
          visible++;
        }
      });
      count.textContent = english ? `${visible} catalog examples` : `${visible} contoh produk`;
      empty.hidden = visible > 0;
    };
    search.addEventListener('input', filter);
    category.addEventListener('change', filter);
    filter();
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
