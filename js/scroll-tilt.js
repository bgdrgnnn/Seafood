// ===== Bahari Seafood — Scroll Tilt Showcase =====
// Vanilla-JS port of a React/Framer Motion "container scroll animation":
// a card tilts up from a 3D perspective and settles flat as the section
// scrolls through the viewport. useScroll/useTransform (Framer Motion)
// don't apply outside React — reimplemented with a scroll-position read
// and linear interpolation, driven by requestAnimationFrame.

(function () {

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function init() {
    const wrap = document.getElementById('scrollTiltWrap');
    const header = document.getElementById('scrollTiltHeader');
    const card = document.getElementById('scrollTiltCard');
    if (!wrap || !header || !card) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;

    function isMobile() {
      return window.innerWidth <= 768;
    }

    function update() {
      ticking = false;

      if (reduceMotion) {
        card.style.transform = 'rotateX(0deg) scale(1)';
        header.style.transform = 'translateY(0px)';
        return;
      }

      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the section's top just enters from the bottom of the
      // viewport, 1 as its bottom reaches the top — mirrors the default
      // offset Framer Motion's useScroll uses for a target ref.
      const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

      const rotate = lerp(20, 0, progress);
      const scaleRange = isMobile() ? [0.7, 0.9] : [1.05, 1];
      const scale = lerp(scaleRange[0], scaleRange[1], progress);
      const translate = lerp(0, -60, progress);

      card.style.transform = `rotateX(${rotate}deg) scale(${scale})`;
      header.style.transform = `translateY(${translate}px)`;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
