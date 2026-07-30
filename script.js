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

  const NODE_COUNT = 260;
  const RADIUS = 175;
  const DEPTH = RADIUS * 0.4;
  const MAX_LINKS_PER_NODE = 3;
  const MAX_LINK_DIST = RADIUS * 0.5;
  const MASK_SIZE = 420;

  // --- silhouettes: nodes are sampled from inside these 2D shapes, then
  // given depth proportional to a blurred "thickness" pass, so the point
  // cloud reads as a solid organic form rather than a flat outline. ---
  function drawBrainSilhouette(ctx, size) {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = '#fff';
    const scale = size * 0.42;

    function hemisphere(sign) {
      ctx.beginPath();
      const bumps = [
        [0.06, -0.95], [0.55, -0.86], [0.82, -0.64], [0.96, -0.32],
        [0.90, 0.04], [0.95, 0.32], [0.82, 0.56], [0.55, 0.72],
        [0.28, 0.80], [0.10, 0.62],
      ];
      ctx.moveTo(sign * 0.06 * scale, -0.95 * scale);
      for (let i = 1; i < bumps.length; i++) {
        const [bx, by] = bumps[i];
        const [px, py] = bumps[i - 1];
        const cx = sign * (bx * 1.04) * scale;
        const cy = ((py + by) / 2) * scale;
        ctx.quadraticCurveTo(cx, cy, sign * bx * scale, by * scale);
      }
      ctx.quadraticCurveTo(sign * 0.05 * scale, 0, sign * 0.06 * scale, -0.95 * scale);
      ctx.closePath();
      ctx.fill();
    }
    hemisphere(-1);
    hemisphere(1);

    ctx.beginPath();
    ctx.ellipse(0, 0.92 * scale, 0.34 * scale, 0.22 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-0.08 * scale, 0.95 * scale);
    ctx.lineTo(0.08 * scale, 0.95 * scale);
    ctx.lineTo(0.05 * scale, 1.18 * scale);
    ctx.lineTo(-0.05 * scale, 1.18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEyeSilhouette(ctx, size) {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = '#fff';
    const w = size * 0.46;

    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(-w * 0.55, -w * 0.62, 0, -w * 0.5);
    ctx.quadraticCurveTo(w * 0.55, -w * 0.62, w, 0);
    ctx.quadraticCurveTo(w * 0.55, w * 0.42, 0, w * 0.34);
    ctx.quadraticCurveTo(-w * 0.55, w * 0.42, -w, 0);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, -w * 0.04, w * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.beginPath();
    ctx.arc(0, -w * 0.04, w * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const SHAPES = { brain: drawBrainSilhouette, eye: drawEyeSilhouette };

  function samplePoints(THREE, drawFn, count) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = maskCanvas.height = MASK_SIZE;
    const mctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    drawFn(mctx, MASK_SIZE);
    const sharp = mctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;

    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = blurCanvas.height = MASK_SIZE;
    const bctx = blurCanvas.getContext('2d', { willReadFrequently: true });
    bctx.filter = 'blur(18px)';
    drawFn(bctx, MASK_SIZE);
    const blurred = bctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;

    const points = [];
    let attempts = 0;
    const maxAttempts = count * 80;
    while (points.length < count && attempts < maxAttempts) {
      attempts++;
      const px = Math.floor(Math.random() * MASK_SIZE);
      const py = Math.floor(Math.random() * MASK_SIZE);
      const idx = (py * MASK_SIZE + px) * 4 + 3;
      if (sharp[idx] > 128) {
        const thickness = blurred[idx] / 255;
        const x = ((px - MASK_SIZE / 2) / MASK_SIZE) * RADIUS * 2;
        const y = -((py - MASK_SIZE / 2) / MASK_SIZE) * RADIUS * 2;
        const z = (Math.random() * 2 - 1) * DEPTH * thickness;
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    return points;
  }

  import('https://unpkg.com/three@0.185.1/build/three.module.js').then((THREE) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, hero.clientWidth / hero.clientHeight, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(hero.clientWidth, hero.clientHeight);

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
    const glowTexture = makeGlowTexture();

    function buildBrainGroup(shapeName) {
      const drawFn = SHAPES[shapeName] || SHAPES.brain;
      const nodePositions = samplePoints(THREE, drawFn, NODE_COUNT);

      const group = new THREE.Group();

      const nodeGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
      const nodeMaterial = new THREE.PointsMaterial({
        size: 10,
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0x9beef6,
      });
      group.add(new THREE.Points(nodeGeometry, nodeMaterial));

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
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

      return group;
    }

    function disposeGroup(group) {
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }

    let brain = buildBrainGroup('brain');
    scene.add(brain);

    document.querySelectorAll('.shape-toggle button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape;
        document.querySelectorAll('.shape-toggle button').forEach((b) => b.classList.toggle('active', b === btn));
        scene.remove(brain);
        disposeGroup(brain);
        brain = buildBrainGroup(shape);
        scene.add(brain);
        if (reduceMotion) renderer.render(scene, camera);
      });
    });

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
