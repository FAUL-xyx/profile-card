/**
 * animation.js
 * ------------------------------------------------------------------
 * - attachTilt(): lightweight 3D pointer-follow tilt for any element
 *   with [data-tilt]. Inner elements with [data-depth="N"] get a
 *   proportional translateZ-style parallax offset.
 * - playIntro(): the page-load stagger sequence (bg -> logo -> name
 *   -> hero card -> social cards).
 * Both respect prefers-reduced-motion and the in-app theme.animation
 * setting (full / reduced / off).
 * ------------------------------------------------------------------
 */

const Motion = (() => {
  function motionLevel() {
    const theme = (window.DB && window.DB.get().theme) || {};
    if (theme.animation === 'off') return 'off';
    if (theme.animation === 'reduced') return 'reduced';
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReduced ? 'reduced' : 'full';
  }

  function attachTilt(root = document) {
    const level = motionLevel();
    const cards = root.querySelectorAll('[data-tilt]');
    const theme = (window.DB && window.DB.get().theme) || {};
    const intensity = (theme.tilt ?? 70) / 100; // 0..1

    cards.forEach(card => {
      if (card._tiltBound) return;
      card._tiltBound = true;

      if (level === 'off') return;

      const depthEls = card.querySelectorAll('[data-depth]');
      let raf = null;
      let rectCache = null;

      const maxTilt = level === 'reduced' ? 4 : 12 * intensity;
      const maxDepth = level === 'reduced' ? 0 : 18 * intensity;

      function update(px, py) {
        const rect = rectCache || card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (px - cx) / (rect.width / 2);
        const dy = (py - cy) / (rect.height / 2);
        const rotY = clamp(dx, -1, 1) * maxTilt;
        const rotX = clamp(-dy, -1, 1) * maxTilt;

        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        card.style.setProperty('--glow-x', `${50 + dx * 40}%`);
        card.style.setProperty('--glow-y', `${50 + dy * 40}%`);

        depthEls.forEach(el => {
          const depth = parseFloat(el.dataset.depth || '0') / 100;
          const tx = dx * maxDepth * depth;
          const ty = dy * maxDepth * depth;
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
      }

      function onMove(e) {
        rectCache = card.getBoundingClientRect();
        const point = e.touches ? e.touches[0] : e;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => update(point.clientX, point.clientY));
      }

      function reset() {
        rectCache = null;
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
        card.style.setProperty('--glow-x', '50%');
        card.style.setProperty('--glow-y', '40%');
        depthEls.forEach(el => { el.style.transform = 'translate3d(0,0,0)'; });
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
      card.addEventListener('touchmove', onMove, { passive: true });
      card.addEventListener('touchend', reset);
      card.addEventListener('touchcancel', reset);

      // press feedback (works for mouse + touch via pointer events)
      card.addEventListener('pointerdown', () => card.classList.add('is-pressed'));
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt =>
        card.addEventListener(evt, () => card.classList.remove('is-pressed'))
      );

      reset();
    });
  }

  function playIntro({ bg, logo, name, hero, socialWrap } = {}) {
    const level = motionLevel();

    if (level === 'off' || typeof gsap === 'undefined') {
      // Show everything immediately, no animation.
      [bg, logo, name, hero, socialWrap].forEach(el => { if (el) el.style.opacity = '1'; });
      if (socialWrap) socialWrap.querySelectorAll('.link-card').forEach(c => (c.style.opacity = '1'));
      return;
    }

    const dur = level === 'reduced' ? 0.25 : 0.7;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (bg) tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: dur * 1.2 });
    if (logo) tl.fromTo(logo, { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: dur }, '-=0.3');
    if (name) tl.fromTo(name, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur }, '-=0.35');
    if (hero) tl.fromTo(hero, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: dur * 1.1 }, '-=0.3');

    if (socialWrap) {
      const items = socialWrap.querySelectorAll('.link-card');
      tl.fromTo(items,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: dur * 0.8, stagger: level === 'reduced' ? 0.03 : 0.07 },
        '-=0.25'
      );
    }
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  return { attachTilt, playIntro, motionLevel };
})();

window.Motion = Motion;
