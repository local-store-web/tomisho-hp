(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [...document.querySelectorAll('.chapter')];
  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      chapterLinks.forEach(link => {
        if (link.hash === '#' + visible.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    chapters.forEach(chapter => chapterObserver.observe(chapter));
  }

  const tasting = document.querySelector('.tasting');
  const controls = document.querySelector('.tasting-controls');
  const previous = document.querySelector('.dish-prev');
  const next = document.querySelector('.dish-next');
  const desktop = window.matchMedia('(min-width: 701px)');
  if (tasting && controls && previous && next) {
    const updateTasting = () => {
      const scrollable = desktop.matches && tasting.scrollWidth > tasting.clientWidth + 5;
      controls.hidden = !scrollable;
      if (scrollable) { tasting.setAttribute('tabindex', '0'); tasting.setAttribute('role', 'region'); }
      else { tasting.removeAttribute('tabindex'); tasting.removeAttribute('role'); }
      previous.disabled = tasting.scrollLeft <= 5;
      next.disabled = tasting.scrollLeft >= tasting.scrollWidth - tasting.clientWidth - 5;
    };
    const moveDish = direction => {
      const firstDish = tasting.querySelector('.dish');
      if (!firstDish) return;
      tasting.scrollBy({ left: direction * (firstDish.getBoundingClientRect().width + 36), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    previous.addEventListener('click', () => moveDish(-1));
    next.addEventListener('click', () => moveDish(1));
    tasting.addEventListener('scroll', updateTasting, { passive: true });
    window.addEventListener('resize', updateTasting, { passive: true });
    updateTasting();
  }

  // The optional atmosphere never controls content visibility or scrolling.
  const canvas = document.getElementById('embers');
  const hero = document.querySelector('.hero');
  const motionButton = document.querySelector('.motion-control');
  const motionLabel = document.querySelector('.motion-label');
  const connection = navigator.connection;
  const constrained = (connection && connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  if (!canvas || !hero || !motionButton || constrained) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  let width = 0, height = 0, frame = 0, lastTime = 0, visible = true, paused = false;
  let pointer = .5;
  let embers = [];
  const shouldAnimate = () => !reducedMotion.matches && !paused && visible && !document.hidden;
  const resize = () => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    embers = Array.from({ length: width < 701 ? 12 : 24 }, () => ({ x: Math.random() * width * .65, y: Math.random() * height, speed: .14 + Math.random() * .24, radius: .5 + Math.random() * .8, life: Math.random() * Math.PI * 2 }));
  };
  const draw = time => {
    frame = 0;
    if (!shouldAnimate()) return;
    // Cap rendering near 30 fps; delta is capped after visibility changes.
    if (time - lastTime >= 32) {
      const delta = Math.min((time - lastTime) / 16.67, 2.5);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      for (const ember of embers) {
        ember.y -= ember.speed * delta;
        ember.x += (pointer - .5) * .15 * delta;
        ember.life += .009 * delta;
        if (ember.y < 0) { ember.y = height; ember.x = Math.random() * width * .65; }
        const alpha = (.12 + Math.sin(ember.life) * .08) * Math.min(1, ember.y / 80);
        context.fillStyle = `rgba(237,156,104,${alpha})`;
        context.beginPath();
        context.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    frame = requestAnimationFrame(draw);
  };
  const syncMotion = () => {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    motionButton.hidden = reducedMotion.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionLabel.textContent = paused ? '余熱の動きを再開する' : '余熱の動きを止める';
    if (reducedMotion.matches) context.clearRect(0, 0, width, height);
    if (shouldAnimate()) { lastTime = performance.now(); frame = requestAnimationFrame(draw); }
  };
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  hero.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') pointer = (event.clientX - hero.getBoundingClientRect().left) / width; }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = .5; });
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('resize', resize, { passive: true });
  reducedMotion.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncMotion(); }, { threshold: 0 }).observe(hero);
  }
  resize();
  syncMotion();
})();
