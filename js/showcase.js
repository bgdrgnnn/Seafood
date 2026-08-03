// ===== Bahari Seafood — Sorotan Produk (Interactive Showcase) =====
// Adapted from a spatial product-switcher pattern: one product in focus at a
// time, animated feature bars, and a pill switcher with a sliding indicator.

(function () {

  const SHOWCASE_PRODUCTS = [
    {
      id: 'cumi',
      label: 'Cumi-Cumi',
      title: 'Tekstur Kenyal, Rasa Alami',
      description: 'Cumi segar hasil tangkapan nelayan lokal, dibersihkan dan dibekukan cepat untuk mempertahankan tekstur kenyal serta rasa manis alami khas laut Nusantara.',
      status: 'Siap Ekspor',
      grade: 'Grade A',
      colors: { c1: '#17BEBB', c2: '#0891B2' },
      features: [
        { label: 'Tingkat Kesegaran', value: 96 },
        { label: 'Grade Ekspor', value: 92 },
      ],
      image: 'images/cumi.webp',
    },
    {
      id: 'gurita',
      label: 'Gurita',
      title: 'Premium & Bertekstur Padat',
      description: 'Gurita ukuran pilihan dengan penanganan higienis dan pembekuan optimal, menjaga tekstur padat dan cita rasa khasnya sampai ke tangan pembeli.',
      status: 'Siap Ekspor',
      grade: 'Grade A',
      colors: { c1: '#0B6E7A', c2: '#073B4C' },
      features: [
        { label: 'Tingkat Kesegaran', value: 94 },
        { label: 'Konsistensi Ukuran', value: 90 },
      ],
      image: 'images/gurita.webp',
    },
    {
      id: 'udang',
      label: 'Udang',
      title: 'Size Presisi, Kualitas Ekspor',
      description: 'Udang windu & vannamei disortir presisi per ukuran (size), tersedia head-on maupun headless sesuai standar buyer internasional.',
      status: 'Siap Ekspor',
      grade: 'Grade A+',
      colors: { c1: '#17BEBB', c2: '#0891B2' },
      features: [
        { label: 'Grade Ekspor', value: 97 },
        { label: 'Konsistensi Ukuran', value: 95 },
      ],
      image: 'images/udang.webp',
    },
    {
      id: 'kepiting',
      label: 'Kepiting',
      title: 'Daging Manis, Cangkang Utuh',
      description: 'Kepiting rajungan & bakau segar dengan daging manis dan cangkang utuh terjaga, tersedia hidup maupun beku sesuai permintaan pasar ekspor.',
      status: 'Siap Ekspor',
      grade: 'Grade Premium',
      colors: { c1: '#FF6B6B', c2: '#C0392B' },
      features: [
        { label: 'Tingkat Kesegaran', value: 91 },
        { label: 'Grade Ekspor', value: 94 },
      ],
      image: 'images/kepiting.webp',
    },
    {
      id: 'lobster',
      label: 'Lobster',
      title: 'Premium, Daging Padat',
      description: 'Lobster mutiara & pasir pilihan dengan daging padat dan cita rasa premium, tersedia hidup maupun beku untuk pasar restoran dan ekspor kelas atas.',
      status: 'Siap Ekspor',
      grade: 'Super Premium',
      colors: { c1: '#EF4444', c2: '#991B1B' },
      features: [
        { label: 'Tingkat Kesegaran', value: 90 },
        { label: 'Grade Ekspor', value: 97 },
      ],
      image: 'images/lobster.webp',
    },
    {
      id: 'tuna',
      label: 'Tuna',
      title: 'Daging Padat, Sashimi Grade',
      description: 'Tuna loin dan whole round dengan daging padat berwarna merah cerah, diproses memenuhi standar sashimi grade untuk pasar premium.',
      status: 'Siap Ekspor',
      grade: 'Sashimi Grade',
      colors: { c1: '#FFB703', c2: '#FB8500' },
      features: [
        { label: 'Tingkat Kesegaran', value: 95 },
        { label: 'Grade Ekspor', value: 98 },
      ],
      image: 'images/tuna.webp',
    },
    {
      id: 'salmon',
      label: 'Salmon',
      title: 'Warna Cerah, Lemak Sempurna',
      description: 'Salmon segar dan beku dengan warna cerah serta sebaran lemak (marbling) merata, tersedia dalam bentuk whole, fillet, maupun portion.',
      status: 'Siap Ekspor',
      grade: 'Premium Grade',
      colors: { c1: '#FB8500', c2: '#E85D75' },
      features: [
        { label: 'Tingkat Kesegaran', value: 93 },
        { label: 'Kualitas Rantai Dingin', value: 96 },
      ],
      image: 'images/salmon.webp',
    },
    {
      id: 'lainnya',
      label: 'Ikan Lainnya',
      title: 'Beragam Pilihan Musiman',
      description: 'Kakap, kerapu, bawal, kembung, dan tenggiri tersedia sesuai musim dan permintaan, diproses dengan standar penanganan dan mutu yang sama.',
      status: 'Tersedia Sesuai Musim',
      grade: 'Grade Ekspor',
      colors: { c1: '#0B6E7A', c2: '#17BEBB' },
      features: [
        { label: 'Tingkat Kesegaran', value: 90 },
        { label: 'Grade Ekspor', value: 88 },
      ],
      icon: `<svg viewBox="0 0 100 100"><ellipse cx="45" cy="50" rx="34" ry="18" fill="url(#sg-lainnya)"/><path d="M79 50l16-14v28z" fill="url(#sg-lainnya)"/><circle cx="20" cy="45" r="3.5" fill="#073B4C"/><defs><linearGradient id="sg-lainnya" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B6E7A"/><stop offset="1" stop-color="#17BEBB"/></linearGradient></defs></svg>`,
    },
  ];

  let currentIndex = 0;
  let switching = false;

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function buildFeatureRow(feature) {
    const row = document.createElement('div');
    row.className = 'sd-feature';
    row.innerHTML = `
      <div class="sd-feature-head">
        <span>${feature.label}</span>
        <span class="sd-feature-value">${feature.value}%</span>
      </div>
      <div class="sd-bar-track">
        <div class="sd-bar-fill" data-value="${feature.value}"></div>
      </div>
    `;
    return row;
  }

  function renderProduct(product) {
    const section = document.getElementById('sorotan');
    const float = document.getElementById('showcaseFloat');
    const glow = document.getElementById('showcaseGlow');
    const bg = document.getElementById('showcaseBg');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const sdLabel = document.getElementById('sdLabel');
    const sdTitle = document.getElementById('sdTitle');
    const sdDesc = document.getElementById('sdDesc');
    const sdFeatures = document.getElementById('sdFeatures');
    const sdGradeText = document.getElementById('sdGradeText');

    // Set on the shared section ancestor (not the visual circle) so both the
    // visual and the details panel — siblings, not descendants of each other —
    // inherit the same custom properties.
    section.style.setProperty('--active-c1', product.colors.c1);
    section.style.setProperty('--active-c2', product.colors.c2);
    bg.style.setProperty('--active-glow', hexToRgba(product.colors.c1, 0.28));
    glow.style.background = `linear-gradient(135deg, ${product.colors.c1}, ${product.colors.c2})`;

    float.innerHTML = product.image
      ? `<img src="${product.image}" alt="${product.label}" loading="lazy">`
      : product.icon;
    statusDot.style.background = product.colors.c1;
    statusText.textContent = product.status;
    sdLabel.textContent = product.label;
    sdLabel.style.color = product.colors.c1;
    sdTitle.textContent = product.title;
    sdDesc.textContent = product.description;
    sdGradeText.textContent = product.grade;

    sdFeatures.innerHTML = '';
    product.features.forEach((f) => sdFeatures.appendChild(buildFeatureRow(f)));
  }

  function animateBars() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('#sdFeatures .sd-bar-fill').forEach((bar) => {
          bar.style.width = `${bar.dataset.value}%`;
        });
      });
    });
  }

  function updateIndicator(index) {
    const targetIndex = index === undefined ? currentIndex : index;
    const switcher = document.getElementById('showcaseSwitcher');
    const indicator = document.getElementById('showcaseIndicator');
    const activeBtn = switcher.querySelector('.showcase-pill.active');
    if (!activeBtn) return;
    indicator.style.left = `${activeBtn.offsetLeft}px`;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.background = `linear-gradient(135deg, ${SHOWCASE_PRODUCTS[targetIndex].colors.c1}, ${SHOWCASE_PRODUCTS[targetIndex].colors.c2})`;
  }

  function goToProduct(index) {
    if (switching || index === currentIndex) return;
    switching = true;

    const float = document.getElementById('showcaseFloat');
    const details = document.getElementById('showcaseDetails');
    const switcher = document.getElementById('showcaseSwitcher');

    float.classList.add('switching');
    details.classList.remove('visible');

    switcher.querySelectorAll('.showcase-pill').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    updateIndicator(index);

    window.setTimeout(() => {
      currentIndex = index;
      renderProduct(SHOWCASE_PRODUCTS[currentIndex]);
      float.classList.remove('switching');
      void details.offsetWidth; // force reflow so the transition replays
      details.classList.add('visible');
      animateBars();
      switching = false;
    }, 260);
  }

  function buildSwitcher() {
    const switcher = document.getElementById('showcaseSwitcher');
    SHOWCASE_PRODUCTS.forEach((product, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'showcase-pill' + (i === 0 ? ' active' : '');
      btn.textContent = product.label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => goToProduct(i));
      switcher.appendChild(btn);
    });
  }

  function init() {
    const section = document.getElementById('sorotan');
    if (!section) return;

    buildSwitcher();
    renderProduct(SHOWCASE_PRODUCTS[currentIndex]);
    updateIndicator();

    // Animate bars in once the section scrolls into view.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateBars();
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(section);
    } else {
      animateBars();
    }

    section.setAttribute('tabindex', '-1');
    section.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') goToProduct((currentIndex + 1) % SHOWCASE_PRODUCTS.length);
      if (e.key === 'ArrowLeft') goToProduct((currentIndex - 1 + SHOWCASE_PRODUCTS.length) % SHOWCASE_PRODUCTS.length);
    });

    window.addEventListener('resize', () => updateIndicator());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
