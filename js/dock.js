// ===== Bahari Seafood — macOS-style Dock =====
// Vanilla-JS port of a React/Framer Motion Dock: icons magnify based on
// cursor distance. useMotionValue/useSpring/useTransform are React-only,
// so this reimplements the same distance -> width interpolation with a
// mousemove listener and linear interpolation, throttled via rAF. CSS
// transitions stand in for the spring physics.

(function () {

  const BASE = 44;   // px — resting icon size, matches .dock-item's CSS size
  const MAX = 68;     // px — size at the cursor's exact position
  const DISTANCE = 130; // px — falloff radius on either side of the cursor

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function init() {
    const panel = document.getElementById('dockPanel');
    if (!panel) return;

    const items = Array.prototype.slice.call(panel.querySelectorAll('.dock-item'));
    if (!items.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasHover = window.matchMedia('(hover: hover)').matches;
    // Touch devices and reduced-motion preferences keep the resting size —
    // there's no meaningful "cursor distance" on a touchscreen anyway.
    if (reduceMotion || !hasHover) return;

    let mouseX = null;
    let ticking = false;

    function update() {
      ticking = false;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = mouseX === null ? Infinity : Math.abs(mouseX - center);
        const t = clamp(1 - dist / DISTANCE, 0, 1);
        const size = lerp(BASE, MAX, t);
        item.style.width = size + 'px';
        item.style.height = size + 'px';
      });
    }

    function onMove(e) {
      mouseX = e.clientX;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    function onLeave() {
      mouseX = null;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);
  }

  // The dock is fixed to the bottom of the viewport, which puts it right on
  // top of the footer's nav columns and copyright line once the user scrolls
  // that far — fade it out while the footer is in view instead of letting it
  // sit over that content.
  function initFooterFade() {
    const dock = document.querySelector('.dock');
    const footer = document.querySelector('.site-footer');
    if (!dock || !footer || !('IntersectionObserver' in window)) return;

    // Positive bottom margin extends the intersection root past the actual
    // viewport edge, so this fires slightly before the footer is visually on
    // screen — a negative margin here would require the footer to already be
    // substantially visible before hiding the dock, which is backwards for a
    // dock that's supposed to get out of the way pre-emptively.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        dock.classList.toggle('dock--hidden', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px 120px 0px' });
    io.observe(footer);
  }

  function initAll() {
    init();
    initFooterFade();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
