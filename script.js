// ---------- Bokeh background generator ----------
(function generateBokeh() {
  const container = document.getElementById('bokeh-bg');
  const colors = ['#50e8f4', '#c7f8fe', '#2ad6e6'];
  const count = 22;

  for (let i = 0; i < count; i++) {
    const light = document.createElement('div');
    light.className = 'bokeh-light';

    const size = 40 + Math.random() * 160;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const duration = 6 + Math.random() * 10;
    const delay = Math.random() * -20;
    const dx = (Math.random() * 40 - 20).toFixed(0) + 'px';
    const dy = (Math.random() * 50 - 25).toFixed(0) + 'px';
    const opMin = (0.15 + Math.random() * 0.2).toFixed(2);
    const opMax = (0.5 + Math.random() * 0.4).toFixed(2);

    light.style.width = `${size}px`;
    light.style.height = `${size}px`;
    light.style.top = `${top}%`;
    light.style.left = `${left}%`;
    light.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
    light.style.setProperty('--dx', dx);
    light.style.setProperty('--dy', dy);
    light.style.setProperty('--op-min', opMin);
    light.style.setProperty('--op-max', opMax);
    light.style.animationDuration = `${duration}s, ${(4 + Math.random() * 6).toFixed(1)}s`;
    light.style.animationDelay = `${delay}s, ${delay}s`;

    container.appendChild(light);
  }
})();

// ---------- Scroll-driven brain zoom-out ----------
(function scrollZoomBrain() {
  const heroScroll = document.querySelector('.hero-scroll');
  const brain = document.querySelector('spline-viewer.brain');
  const copy = document.querySelector('.hero-copy');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!heroScroll || !brain || reduceMotion) return;

  const MIN_SCALE = 0.55;
  let ticking = false;

  function update() {
    const rect = heroScroll.getBoundingClientRect();
    const scrollable = heroScroll.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    const scale = 1 - progress * (1 - MIN_SCALE);
    const copyOpacity = 1 - Math.min(progress / 0.4, 1);
    const copyShift = progress * 40;

    brain.style.transform = `scale(${scale})`;
    brain.style.opacity = `${1 - progress * 0.3}`;
    copy.style.opacity = `${copyOpacity}`;
    copy.style.transform = `translateY(${-copyShift}px)`;

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
