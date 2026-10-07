(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let enabled = false;
  let userPaused = false;
  const active = new Set();
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'motion-control';
  document.body.append(control);
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  // Native anchors and content still work when motion is disabled or unsupported.
  let scrollFrame = 0;
  function updateProgress() {
    scrollFrame = 0;
    const height = root.scrollHeight - innerHeight;
    const fraction = height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
  }
  function scheduleProgress() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);
  }
  addEventListener('scroll', scheduleProgress, { passive: true });
  addEventListener('resize', scheduleProgress);
  addEventListener('load', scheduleProgress, { once: true });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.body);
  updateProgress();

  const tiltTargets = [...document.querySelectorAll('.hero-composition,.preview,.skill-art')];
  const pointerFrames = new Map();
  function resetTilt(element) {
    cancelAnimationFrame(pointerFrames.get(element));
    pointerFrames.delete(element);
    element.removeAttribute('data-hover');
    for (const key of ['--tilt-x', '--tilt-y', '--pointer-x', '--pointer-y']) element.style.removeProperty(key);
  }
  for (const element of tiltTargets) {
    element.addEventListener('pointermove', event => {
      if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
      cancelAnimationFrame(pointerFrames.get(element));
      pointerFrames.set(element, requestAnimationFrame(() => {
        pointerFrames.delete(element);
        const rect = element.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        element.style.setProperty('--tilt-x', `${(0.5 - y) * 6}deg`);
        element.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
        element.style.setProperty('--pointer-x', `${x * 100}%`);
        element.style.setProperty('--pointer-y', `${y * 100}%`);
        element.setAttribute('data-hover', '');
      }));
    }, { passive: true });
    element.addEventListener('pointerleave', () => resetTilt(element));
    element.addEventListener('pointercancel', () => resetTilt(element));
  }
  finePointer.addEventListener('change', () => tiltTargets.forEach(resetTilt));

  function arrive(element, delay = 0, distance = 26) {
    if (!enabled || !element.animate || element.contains(document.activeElement)) return;
    const animation = element.animate(
      [{ opacity: .25, translate: `0 ${distance}px` }, { opacity: 1, translate: '0 0' }],
      { duration: 850, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
    );
    active.add(animation);
    animation.onfinish = animation.oncancel = () => active.delete(animation);
  }
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal.unobserve(entry.target);
        arrive(entry.target, Math.min(stagger++ * 75, 225));
      }
    }, { threshold: .08 });
    document.querySelectorAll('.section-head,.venture-panel,.demo-card,.tulifang-feature,.research-feature,.practice-card,.film-feature,.skill-card,.tl-item,.contact-layout')
      .forEach(element => reveal.observe(element));
  }
  document.addEventListener('focusin', event => {
    for (const animation of active) if (animation.effect.target.contains(event.target)) animation.cancel();
  });

  // A small, locally rendered constellation. No requests or animation work offscreen.
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero-constellation');
  const context = canvas?.getContext('2d');
  let width = 0, height = 0, frame = 0, lastTime = 0, heroVisible = true;
  let particles = [];
  function sizeCanvas() {
    if (!context) return;
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: width < 700 ? 18 : 34 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7,
      radius: Math.random() * 1.4 + .6
    }));
  }
  function draw(time) {
    frame = 0;
    if (!enabled || !heroVisible || document.hidden) return;
    if (!lastTime || time - lastTime >= 32) {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
      lastTime = time;
      context.clearRect(0, 0, width, height);
      for (const point of particles) {
        point.x += point.vx * delta;
        point.y += point.vy * delta;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(75,120,92,.38)';
        context.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > 150) continue;
          context.strokeStyle = `rgba(100,134,108,${(1 - distance / 150) * .16})`;
          context.lineWidth = .7;
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
        }
      }
    }
    frame = requestAnimationFrame(draw);
  }
  function syncActivity() {
    cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    root.classList.toggle('motion-paused', document.hidden || !heroVisible);
    if (context && enabled && heroVisible && !document.hidden) frame = requestAnimationFrame(draw);
  }
  if (context) {
    sizeCanvas();
    if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(hero);
    else addEventListener('resize', sizeCanvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncActivity();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      tiltTargets.forEach(resetTilt);
      for (const animation of active) animation.cancel();
    }
    syncActivity();
  });
  function applyPreference() {
    enabled = !preference.matches && !userPaused;
    root.classList.toggle('motion-enabled', enabled);
    root.classList.toggle('motion-disabled', !enabled);
    control.setAttribute('aria-pressed', String(enabled));
    control.disabled = preference.matches;
    control.textContent = preference.matches ? '系统已减少动效' : enabled ? '动效开' : '动效关';
    control.setAttribute('aria-label', preference.matches ? '系统已减少动态效果' : enabled ? '关闭动态效果' : '开启动态效果');
    if (!enabled) {
      for (const animation of active) animation.cancel();
      tiltTargets.forEach(resetTilt);
      context?.clearRect(0, 0, width, height);
    }
    syncActivity();
  }
  control.addEventListener('click', () => { userPaused = !userPaused; applyPreference(); });
  preference.addEventListener('change', applyPreference);
  applyPreference();
  document.querySelectorAll('.hero-copy>*').forEach((element, index) => arrive(element, index * 85, 20));
  const heroWork = document.querySelector('.hero-work');
  if (heroWork) arrive(heroWork, 180, 30);
})();
