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

// ---------- Full-viewport particle field (ambient background) ----------
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

// ---------- Neural-network brain (pure Three.js, no external service) ----------
(function initBrain() {
  const canvas = document.getElementById('brain-canvas');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  import('https://unpkg.com/three@0.185.1/build/three.module.js').then((THREE) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(hero.clientWidth, hero.clientHeight);

    const brain = new THREE.Group();
    scene.add(brain);

    // --- nodes: evenly distributed across a sphere (Fibonacci lattice) ---
    const NODE_COUNT = 220;
    const RADIUS = 140;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const nodePositions = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const jitter = 1 + (Math.random() - 0.5) * 0.12;
      nodePositions.push(
        new THREE.Vector3(Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY).multiplyScalar(RADIUS * jitter)
      );
    }

    function makeGlowTexture() {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(199,248,254,0.8)');
      grad.addColorStop(1, 'rgba(80,232,244,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    const nodeGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
    const nodeMaterial = new THREE.PointsMaterial({
      size: 10,
      map: makeGlowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0x9beef6,
    });
    brain.add(new THREE.Points(nodeGeometry, nodeMaterial));

    // --- connections: link each node to its nearest few neighbors ---
    const MAX_LINKS_PER_NODE = 3;
    const MAX_LINK_DIST = RADIUS * 0.55;
    const linePositions = [];

    for (let i = 0; i < nodePositions.length; i++) {
      const distances = [];
      for (let j = 0; j < nodePositions.length; j++) {
        if (i === j) continue;
        const d = nodePositions[i].distanceTo(nodePositions[j]);
        if (d < MAX_LINK_DIST) distances.push([d, j]);
      }
      distances.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < Math.min(MAX_LINKS_PER_NODE, distances.length); k++) {
        const j = distances[k][1];
        if (j > i) {
          linePositions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
          linePositions.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x50e8f4,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    brain.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    // --- continuous ambient camera orbit (always on, independent of scroll) ---
    const ORBIT_RADIUS = 420;
    const ORBIT_SPEED = 0.12; // radians per second
    const ORBIT_TILT = 0.18;

    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (reduceMotion) renderer.render(scene, camera);
    }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();

    if (reduceMotion) {
      camera.position.set(0, 0, ORBIT_RADIUS);
      camera.lookAt(0, 0, 0);
      resize();
    } else {
      resize();
      const animate = () => {
        const t = clock.getElapsedTime();
        const angle = t * ORBIT_SPEED;
        camera.position.x = Math.sin(angle) * ORBIT_RADIUS;
        camera.position.z = Math.cos(angle) * ORBIT_RADIUS;
        camera.position.y = Math.sin(angle * 0.5) * ORBIT_RADIUS * ORBIT_TILT;
        camera.lookAt(0, 0, 0);
        brain.rotation.y = t * 0.02;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();
    }
  }).catch((err) => {
    console.error('[brain] Failed to load three.js:', err);
  });
})();
