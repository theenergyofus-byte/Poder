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

// ---------- Full-viewport particle field ----------
// Independent of the Spline scene's own effects — guarantees particles cover
// the whole hero, regardless of how the embedded scene's internal particle
// system (if any) is authored/bounded inside Spline itself.
(function particleField() {
  const canvas = document.getElementById('particle-field');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const colors = ['199, 248, 254', '80, 232, 244', '255, 255, 255'];
  let particles = [];
  let width, height, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticles() {
    const count = Math.round((width * height) / 8000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.8,
      vy: -(0.04 + Math.random() * 0.12),
      vx: (Math.random() - 0.5) * 0.05,
      color: colors[Math.floor(Math.random() * colors.length)],
      baseOpacity: 0.25 + Math.random() * 0.5,
      twinkleSpeed: 0.4 + Math.random() * 1.4,
      seed: Math.random() * Math.PI * 2,
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * p.twinkleSpeed + p.seed);
      const opacity = (p.baseOpacity * twinkle).toFixed(3);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); makeParticles(); });
  resize();
  makeParticles();
  requestAnimationFrame(draw);
})();

// ---------- Scroll-driven camera orbit ----------
// Orbits the brain (via a CSS 3D perspective rotation of its container)
// instead of shrinking it. This rotates the rendered plane of the Spline
// viewer itself; it does not move Spline's internal 3D camera object (that
// would need the @splinetool/runtime API against this specific scene's
// actual camera/object names, which isn't verifiable without live-testing
// against the real scene) but reads as a convincing orbit as you scroll.
(function scrollOrbitBrain() {
  const heroScroll = document.querySelector('.hero-scroll');
  const stage = document.querySelector('.brain-stage');
  const copy = document.querySelector('.hero-copy');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!heroScroll || !stage || reduceMotion) return;

  const MAX_ROTATE_Y = 55; // degrees, full left-right swing across the scroll
  const MAX_ROTATE_X = 12; // degrees, subtle vertical tilt
  let ticking = false;

  function update() {
    const rect = heroScroll.getBoundingClientRect();
    const scrollable = heroScroll.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    const rotateY = progress * MAX_ROTATE_Y;
    const rotateX = Math.sin(progress * Math.PI) * -MAX_ROTATE_X;
    const copyOpacity = 1 - Math.min(progress / 0.4, 1);
    const copyShift = progress * 40;

    stage.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
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
