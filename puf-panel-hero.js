// ---------- PUF sandwich-panel hero: assemble -> explode -> reassemble, looping ----------
(function initPanel() {
  const canvas = document.getElementById('panel-canvas');
  const hero = document.querySelector('.hero');
  const callouts = {
    top: document.querySelector('.callout-top'),
    core: document.querySelector('.callout-core'),
    bottom: document.querySelector('.callout-bottom'),
  };
  if (!canvas || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LENGTH = 5.6;
  const DEPTH = 2.8;
  const FOAM_THICKNESS = 0.62;
  const RIDGE_AMPLITUDE = 0.055;
  const RIDGE_PERIOD = 0.62;
  const EXPLODE_GAP = 1.05;

  // Timeline (seconds) for one loop: assembled hold -> explode -> exploded hold -> reassemble -> hold
  const T_ASSEMBLED_HOLD = 1.2;
  const T_EXPLODE = 1.2;
  const T_EXPLODED_HOLD = 3.2;
  const T_REASSEMBLE = 1.2;
  const T_GAP_HOLD = 1.4;
  const CYCLE = T_ASSEMBLED_HOLD + T_EXPLODE + T_EXPLODED_HOLD + T_REASSEMBLE + T_GAP_HOLD;

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  // progress: 0 = fully assembled, 1 = fully exploded
  function progressForTime(t) {
    const time = t % CYCLE;
    let cursor = T_ASSEMBLED_HOLD;
    if (time < cursor) return 0;
    if (time < cursor + T_EXPLODE) {
      return easeInOutCubic((time - cursor) / T_EXPLODE);
    }
    cursor += T_EXPLODE;
    if (time < cursor + T_EXPLODED_HOLD) return 1;
    cursor += T_EXPLODED_HOLD;
    if (time < cursor + T_REASSEMBLE) {
      return 1 - easeInOutCubic((time - cursor) / T_REASSEMBLE);
    }
    return 0;
  }

  import('https://unpkg.com/three@0.185.1/build/three.module.js').then((THREE) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, hero.clientWidth / hero.clientHeight, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(hero.clientWidth, hero.clientHeight);

    // ---- lighting: a clean product-shot rig ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8fbfff, 0.5);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf2b84d, 1.1, 20);
    rimLight.position.set(0, -1.5, 3);
    scene.add(rimLight);

    // ---- corrugated steel skin geometry: ribs run along the panel length (X) ----
    function makeCorrugatedGeometry(length, depth, amplitude, period, segments) {
      const geo = new THREE.PlaneGeometry(length, depth, segments, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const depthCoord = pos.getY(i);
        const wave = Math.sin((x / period) * Math.PI * 2) * amplitude;
        pos.setXYZ(i, x, wave, depthCoord);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    }

    // ---- procedural foam texture: irregular tan/amber cell pattern ----
    function makeFoamTexture() {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#e9b459';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 900; i++) {
        const r = 1 + Math.random() * 3.2;
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = Math.random() > 0.5 ? 'rgba(255,224,160,0.35)' : 'rgba(150,96,28,0.28)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = shade;
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 1.6);
      return tex;
    }

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xc7d0d4,
      metalness: 0.85,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });

    const foamMaterial = new THREE.MeshStandardMaterial({
      map: makeFoamTexture(),
      roughness: 0.92,
      metalness: 0,
    });

    const panelGroup = new THREE.Group();
    scene.add(panelGroup);

    const skinSegments = 90;
    const skinGeometry = makeCorrugatedGeometry(LENGTH, DEPTH, RIDGE_AMPLITUDE, RIDGE_PERIOD, skinSegments);

    const topSkin = new THREE.Mesh(skinGeometry, steelMaterial);
    panelGroup.add(topSkin);

    const bottomSkin = new THREE.Mesh(skinGeometry, steelMaterial);
    bottomSkin.scale.y = -1;
    panelGroup.add(bottomSkin);

    const foamCore = new THREE.Mesh(
      new THREE.BoxGeometry(LENGTH * 0.985, FOAM_THICKNESS, DEPTH * 0.985),
      foamMaterial
    );
    panelGroup.add(foamCore);

    // subtle ground contact shadow via soft transparent disc
    const shadowTex = (() => {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(0,0,0,0.45)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    })();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(LENGTH * 1.6, DEPTH * 2.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.9;
    scene.add(shadowPlane);

    function layout(progress) {
      const half = FOAM_THICKNESS / 2;
      topSkin.position.y = half + progress * EXPLODE_GAP;
      bottomSkin.position.y = -(half + progress * EXPLODE_GAP);

      const calloutOpacity = Math.max(0, Math.min(1, (progress - 0.35) / 0.5));
      if (callouts.top) {
        callouts.top.style.opacity = calloutOpacity;
        callouts.top.style.transform = `translateX(${10 - calloutOpacity * 10}px)`;
      }
      if (callouts.core) {
        callouts.core.style.opacity = calloutOpacity;
        callouts.core.style.transform = `translateX(${10 - calloutOpacity * 10}px)`;
      }
      if (callouts.bottom) {
        callouts.bottom.style.opacity = calloutOpacity;
        callouts.bottom.style.transform = `translateX(${10 - calloutOpacity * 10}px)`;
      }
    }

    const BASE_CAMERA_POS = new THREE.Vector3(1.6, 2.0, 6.4);

    function resize() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      camera.aspect = w / h;

      // On narrow/portrait screens the panel would otherwise fill the frame
      // and collide with the headline; pull the camera back to compensate.
      const portraitZoom = w / h < 0.85 ? 1.7 : 1;
      camera.position.copy(BASE_CAMERA_POS).multiplyScalar(portraitZoom);
      camera.position.y += (portraitZoom - 1) * 0.6;
      camera.lookAt(0, -0.2, 0);

      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);
    resize();

    if (reduceMotion) {
      // Most informative single frame: fully exploded, layers labelled, no motion.
      layout(1);
      panelGroup.rotation.y = -0.35;
      renderer.render(scene, camera);
      return;
    }

    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();
      const progress = progressForTime(t);
      layout(progress);
      panelGroup.rotation.y = -0.35 + Math.sin(t * 0.15) * 0.22;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }).catch((err) => {
    console.error('[puf-panel] Failed to load three.js:', err);
  });
})();
