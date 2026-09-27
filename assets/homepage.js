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
