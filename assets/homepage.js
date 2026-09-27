// Reflect the chapter in view while preserving native anchors and browser history.
(() => {
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const chapters = links.map(link => ({ link, target: document.getElementById(link.hash.slice(1)) })).filter(item => item.target);
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const threshold = (document.querySelector('nav')?.getBoundingClientRect().height || 64) + 70;
    let current = null;
    for (const item of chapters) {
      if (item.target.getBoundingClientRect().top <= threshold) current = item;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = chapters.at(-1);
    for (const item of chapters) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule, { once: true });
  update();
})();

// Content stays visible without JavaScript; motion only enhances an arriving section.
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const active = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches || entry.target.contains(document.activeElement)) continue;
      const animation = entry.target.animate(
        [{ opacity: .65, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' }
      );
      active.add(animation);
      animation.onfinish = animation.oncancel = () => active.delete(animation);
    }
  }, { threshold: .12 });
  document.querySelectorAll('.hero-copy,.hero-work,.section-head,.demo-card,.skill-card,.research-feature,.practice-card')
    .forEach(element => observer.observe(element));
  preference.addEventListener('change', () => {
    if (preference.matches) for (const animation of active) animation.cancel();
  });
  document.addEventListener('focusin', event => {
    for (const animation of active) {
      if (animation.effect.target.contains(event.target)) animation.cancel();
    }
  });
})();
