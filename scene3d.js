import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  LineSegments,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  Shape,
  ExtrudeGeometry,
  TorusGeometry,
  Color,
  AdditiveBlending,
  NormalBlending,
  DoubleSide,
  DynamicDrawUsage,
  Vector2,
  Vector3
} from '/assets/vendor/three.min.js';

const canvas = document.getElementById('versarail3d');

if (canvas) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer = null;

  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch {
    canvas.style.display = 'none';
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0.35, 14.5);

    const world = new Group();
    scene.add(world);

    const sharedUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouseWorld: { value: new Vector3(0, 0, 0) },
      uMouseActive: { value: 0 },
      uClickOrigin: { value: new Vector3(0, 0, 0) },
      uClickAge: { value: 99 },
      uColorPrimary: { value: new Color(0x4f46e5) },
      uColorSecondary: { value: new Color(0x818cf8) },
      uColorAccent: { value: new Color(0x38bdf8) },
      uAlphaScale: { value: 1.0 }
    };

    // =========================================================================
    // 1. SCULPTED 3D VERSARAIL V-LOGO + GYROSCOPIC ORBITAL RINGS (CENTERED)
    // =========================================================================
    const coreGroup = new Group();
    world.add(coreGroup);

    // Build two interlocking beveled ribbons matching VersaRail's folded V mark
    const leftArmShape = new Shape();
    leftArmShape.moveTo(-2.3, 1.85);
    leftArmShape.lineTo(-1.05, 1.85);
    leftArmShape.lineTo(0.14, -0.34);
    leftArmShape.lineTo(-0.48, -1.42);
    leftArmShape.lineTo(-2.3, 1.85);

    const rightArmShape = new Shape();
    rightArmShape.moveTo(-0.68, -1.06);
    rightArmShape.quadraticCurveTo(-0.04, -2.28, 0.58, -1.34);
    rightArmShape.lineTo(2.3, 1.85);
    rightArmShape.lineTo(1.06, 1.85);
    rightArmShape.lineTo(-0.2, -0.5);
    rightArmShape.quadraticCurveTo(-0.46, -0.96, -0.68, -1.06);

    const vExtrudeOpts = {
      depth: 0.46,
      steps: 4,
      curveSegments: 28,
      bevelEnabled: true,
      bevelThickness: 0.24,
      bevelSize: 0.14,
      bevelSegments: 7
    };

    const leftArmGeo = new ExtrudeGeometry(leftArmShape, vExtrudeOpts);
    leftArmGeo.translate(0, 0, -0.34);

    const rightArmGeo = new ExtrudeGeometry(rightArmShape, vExtrudeOpts);
    rightArmGeo.translate(0, 0, -0.14);

    // Translucent Fresnel glass shell (exact indigo -> cyan shader scheme)
    const vShellMat = new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      vertexShader: `
        uniform float uTime;
        uniform float uMouseActive;
        varying vec3 vNormalDir;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;

        void main() {
          vLocalPos = position;
          float ripple = sin(position.y * 2.2 - uTime * 2.1 + position.x * 1.4) * 0.025 * (1.0 + uMouseActive * 0.4);
          vec3 displaced = position + normal * ripple;
          vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
          vNormalDir = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uMouseActive;
        uniform vec3 uColorPrimary;
        uniform vec3 uColorSecondary;
        uniform vec3 uColorAccent;
        uniform float uAlphaScale;
        varying vec3 vNormalDir;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;

        void main() {
          float fresnel = pow(1.0 - abs(dot(normalize(vNormalDir), normalize(vViewDir))), 2.2);
          float xGrad = clamp((vLocalPos.x + 2.3) / 4.6, 0.0, 1.0);
          float pulse = 0.5 + 0.5 * sin(vLocalPos.y * 3.2 - uTime * 2.6 + vLocalPos.x * 1.5);
          vec3 col = mix(uColorPrimary, uColorSecondary, xGrad * 0.7);
          col = mix(col, uColorAccent, xGrad * 0.65 + pulse * 0.3 + fresnel * 0.35);
          float alpha = (fresnel * 0.28 + pulse * 0.045) * (1.0 + uMouseActive * 0.25) * uAlphaScale;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.55));
        }
      `
    });

    // Crisp glowing wireframe mesh overlay matching the screenshot style
    const vWireMat = new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      depthWrite: false,
      wireframe: true,
      blending: AdditiveBlending,
      vertexShader: `
        uniform float uTime;
        uniform float uMouseActive;
        varying vec3 vLocalPos;
        varying float vWave;

        void main() {
          vLocalPos = position;
          float wave = 0.5 + 0.5 * sin(position.y * 2.6 - uTime * 2.4 + position.x * 1.6);
          vWave = wave;
          vec3 pos = position + normal * (0.015 + wave * 0.025 * (1.0 + uMouseActive * 0.5));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorPrimary;
        uniform vec3 uColorAccent;
        uniform float uAlphaScale;
        varying vec3 vLocalPos;
        varying float vWave;

        void main() {
          float xGrad = clamp((vLocalPos.x + 2.3) / 4.6, 0.0, 1.0);
          vec3 col = mix(uColorPrimary, uColorAccent, clamp(xGrad * 0.7 + vWave * 0.4, 0.0, 1.0));
          float alpha = (0.14 + vWave * 0.2) * uAlphaScale;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.45));
        }
      `
    });

    coreGroup.add(new Mesh(leftArmGeo, vShellMat));
    coreGroup.add(new Mesh(leftArmGeo, vWireMat));
    coreGroup.add(new Mesh(rightArmGeo, vShellMat));
    coreGroup.add(new Mesh(rightArmGeo, vWireMat));

    // Gyroscopic Orbital Rings framing the centered 3D V-logo
    const ringMatA = new MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.26,
      blending: AdditiveBlending
    });
    const ringMatB = new MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending
    });

    const ringGeoA = new TorusGeometry(3.45, 0.014, 6, 96);
    const ringMeshA = new Mesh(ringGeoA, ringMatA);
    ringMeshA.rotation.set(Math.PI * 0.34, 0.22, 0);
    coreGroup.add(ringMeshA);

    const ringGeoB = new TorusGeometry(4.0, 0.012, 6, 110);
    const ringMeshB = new Mesh(ringGeoB, ringMatB);
    ringMeshB.rotation.set(-Math.PI * 0.28, -0.35, 0.4);
    coreGroup.add(ringMeshB);

    // =========================================================================
    // 2. CURSOR-ATTRACTED 3D FLUX PARTICLES + DYNAMIC TETHER CONSTELLATION
    // =========================================================================
    const nodeCount = 440;
    const nodeHomes = [];
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    const nodeSizes = new Float32Array(nodeCount);

    for (let i = 0; i < nodeCount; i++) {
      // Deterministic quasi-random distribution so layout is balanced & reproducible
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233 + 1.7) * 43758.5453;
      const s3 = Math.sin(i * 39.425 + 4.1) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const r2 = s2 - Math.floor(s2);
      const r3 = s3 - Math.floor(s3);

      const x = (r1 - 0.5) * 26;
      const y = (r2 - 0.5) * 15;
      const z = (r3 - 0.5) * 6 - 1.5;

      nodeHomes.push({
        x,
        y,
        z,
        phase: r1 * Math.PI * 2,
        speed: 0.35 + r2 * 0.55,
        orbitR: 0.22 + r3 * 0.45
      });

      nodePositions[i * 3] = x;
      nodePositions[i * 3 + 1] = y;
      nodePositions[i * 3 + 2] = z;
      nodeSizes[i] = 1.0;
    }

    const fluxGeo = new BufferGeometry();
    const fluxPosAttr = new Float32BufferAttribute(nodePositions, 3);
    fluxPosAttr.setUsage(DynamicDrawUsage);
    const fluxColAttr = new Float32BufferAttribute(nodeColors, 3);
    fluxColAttr.setUsage(DynamicDrawUsage);
    const fluxSizeAttr = new Float32BufferAttribute(nodeSizes, 1);
    fluxSizeAttr.setUsage(DynamicDrawUsage);

    fluxGeo.setAttribute('position', fluxPosAttr);
    fluxGeo.setAttribute('aColor', fluxColAttr);
    fluxGeo.setAttribute('aSize', fluxSizeAttr);

    const fluxMat = new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = max(-mvPos.z, 1.0);
          vAlpha = clamp(aSize * 0.58, 0.22, 1.0);
          gl_PointSize = clamp((38.0 * aSize) / dist, 1.5, 11.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uAlphaScale;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          float r = length(d);
          if (r > 0.5) discard;
          float glow = smoothstep(0.5, 0.06, r);
          gl_FragColor = vec4(vColor, glow * vAlpha * uAlphaScale);
        }
      `
    });
    const fluxPoints = new Points(fluxGeo, fluxMat);
    world.add(fluxPoints);

    // Dynamic tether lines weaving near the live cursor (pre-allocated buffer, zero GC)
    const maxLines = 190;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    const tetherGeo = new BufferGeometry();
    const tetherPosAttr = new Float32BufferAttribute(linePositions, 3);
    tetherPosAttr.setUsage(DynamicDrawUsage);
    const tetherColAttr = new Float32BufferAttribute(lineColors, 3);
    tetherColAttr.setUsage(DynamicDrawUsage);
    tetherGeo.setAttribute('position', tetherPosAttr);
    tetherGeo.setAttribute('color', tetherColAttr);
    tetherGeo.setDrawRange(0, 0);

    const tetherMat = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: AdditiveBlending,
      depthWrite: false
    });
    const tetherLines = new LineSegments(tetherGeo, tetherMat);
    world.add(tetherLines);

    // =========================================================================
    // 3. CURSOR-REACTIVE WAVE HORIZON MESH (LOWER FIELD)
    // =========================================================================
    const cols = 48;
    const rows = 22;
    const waveCount = cols * rows;
    const wavePos = new Float32Array(waveCount * 3);
    let wPtr = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        wavePos[wPtr * 3] = (c - (cols - 1) / 2) * 0.72;
        wavePos[wPtr * 3 + 1] = -4.65;
        wavePos[wPtr * 3 + 2] = -r * 0.82 - 1.0;
        wPtr++;
      }
    }

    const waveGeo = new BufferGeometry();
    waveGeo.setAttribute('position', new Float32BufferAttribute(wavePos, 3));

    const waveMat = new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `
        uniform float uTime;
        uniform float uScroll;
        uniform vec3 uMouseWorld;
        uniform float uMouseActive;
        uniform vec3 uClickOrigin;
        uniform float uClickAge;
        varying float vCrest;

        void main() {
          vec3 p = position;
          float baseWave =
            sin(p.x * 0.38 + uTime * 1.15) * 0.28 +
            cos(p.z * 0.45 + uTime * 0.9 - uScroll * 4.0) * 0.24;

          float distMouse = length(p.xz - vec2(uMouseWorld.x, uMouseWorld.y * 0.7 - 5.5));
          float cursorLift = exp(-distMouse * 0.24) * 1.45 * uMouseActive;

          float clickDist = length(p.xz - vec2(uClickOrigin.x, uClickOrigin.y * 0.7 - 5.5));
          float shockRadius = uClickAge * 11.0;
          float shock = exp(-pow(clickDist - shockRadius, 2.0) * 0.35) * exp(-uClickAge * 1.6) * 1.35;

          p.y += baseWave + cursorLift + shock;
          vCrest = clamp((cursorLift + shock) * 0.65 + (baseWave + 0.5) * 0.35, 0.0, 1.0);

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp((24.0 + vCrest * 18.0) / max(-mvPos.z, 1.0), 1.4, 7.5);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColorPrimary;
        uniform vec3 uColorAccent;
        uniform float uAlphaScale;
        varying float vCrest;

        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          float r = length(d);
          if (r > 0.5) discard;
          float soft = smoothstep(0.5, 0.1, r);
          vec3 col = mix(uColorPrimary, uColorAccent, vCrest);
          float alpha = soft * (0.28 + vCrest * 0.52) * uAlphaScale;
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
    const waveMesh = new Points(waveGeo, waveMat);
    world.add(waveMesh);

    // Expanding 3D Click Shockwave Ring
    const pulseRingGeo = new TorusGeometry(1, 0.025, 8, 64);
    const pulseRingMat = new MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending
    });
    const pulseRing = new Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.visible = false;
    world.add(pulseRing);

    // =========================================================================
    // 4. THEME SYNCHRONIZATION (DARK <-> LIGHT MODE)
    // =========================================================================
    function applySceneTheme(theme) {
      const isLight = theme === 'light';
      const blend = isLight ? NormalBlending : AdditiveBlending;

      sharedUniforms.uColorPrimary.value.setHex(isLight ? 0x4f46e5 : 0x4f46e5);
      sharedUniforms.uColorSecondary.value.setHex(isLight ? 0x6366f1 : 0x818cf8);
      sharedUniforms.uColorAccent.value.setHex(isLight ? 0x0284c7 : 0x38bdf8);
      sharedUniforms.uAlphaScale.value = isLight ? 0.42 : 1.0;

      [vShellMat, vWireMat, fluxMat, waveMat, tetherMat, pulseRingMat, ringMatA, ringMatB].forEach(
        (m) => {
          m.blending = blend;
          m.needsUpdate = true;
        }
      );

      ringMatA.color.setHex(isLight ? 0x4f46e5 : 0x6366f1);
      ringMatA.opacity = isLight ? 0.16 : 0.28;
      ringMatB.color.setHex(isLight ? 0x0284c7 : 0x38bdf8);
      ringMatB.opacity = isLight ? 0.16 : 0.3;
      tetherMat.opacity = isLight ? 0.56 : 0.88;
      pulseRingMat.color.setHex(isLight ? 0x4f46e5 : 0x38bdf8);
    }

    applySceneTheme(document.documentElement.dataset.theme || 'dark');

    const themeObserver = new MutationObserver(() => {
      applySceneTheme(document.documentElement.dataset.theme || 'dark');
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // =========================================================================
    // 5. POINTER INTERACTION, CLICK PULSE & RESPONSIVE POSITIONING
    // =========================================================================
    const ndcPointer = new Vector2(0, 0);
    const rayVec = new Vector3();
    const rayDir = new Vector3();
    const targetMouseWorld = new Vector3(4.2, 0.2, 0);
    let targetMouseActive = 0;
    let scrollProgress = 0;
    let smoothScroll = 0;
    let clickTimer = 99;

    function projectPointerToPlane(clientX, clientY, outVec) {
      ndcPointer.x = (clientX / window.innerWidth) * 2 - 1;
      ndcPointer.y = -(clientY / window.innerHeight) * 2 + 1;
      rayVec.set(ndcPointer.x, ndcPointer.y, 0.5).unproject(camera);
      rayDir.copy(rayVec).sub(camera.position).normalize();
      const t = Math.abs(rayDir.z) > 0.001 ? -camera.position.z / rayDir.z : 14;
      outVec.copy(camera.position).addScaledVector(rayDir, t);
    }

    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        projectPointerToPlane(e.clientX, e.clientY, targetMouseWorld);
        targetMouseActive = 1;
      },
      { passive: true }
    );

    document.documentElement.addEventListener('mouseleave', () => {
      targetMouseActive = 0;
    });

    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        projectPointerToPlane(e.clientX, e.clientY, sharedUniforms.uClickOrigin.value);
        clickTimer = 0;
        pulseRing.position.copy(sharedUniforms.uClickOrigin.value);
        pulseRing.visible = true;
      },
      { passive: true }
    );

    function updateScrollProgress() {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    }
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    let coreBaseX = 0;
    let coreBaseY = 0.05;

    function updateResponsiveCore() {
      const w = window.innerWidth;
      if (w < 980) {
        coreBaseX = 0;
        coreBaseY = -0.35;
        coreGroup.position.set(coreBaseX, coreBaseY, -4.6);
        coreGroup.scale.setScalar(1.04);
      } else {
        coreBaseX = 0;
        coreBaseY = 0.05;
        coreGroup.position.set(coreBaseX, coreBaseY, -2.6);
        coreGroup.scale.setScalar(1.36);
      }
    }

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      updateResponsiveCore();
    });
    updateResponsiveCore();

    // =========================================================================
    // 6. ANIMATION LOOP (ZERO HEAP ALLOCATIONS PER FRAME)
    // =========================================================================
    let lastTime = null;
    let rafId = null;
    const baseColor = new Color();
    const activeColor = new Color();

    function renderFrame(now) {
      const dt = lastTime === null ? 0 : Math.max(0, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;
      const elapsed = now * 0.001;

      sharedUniforms.uTime.value = elapsed;
      smoothScroll += (scrollProgress - smoothScroll) * 0.08;
      sharedUniforms.uScroll.value = smoothScroll;

      // Smoothly interpolate cursor position & active weight
      sharedUniforms.uMouseWorld.value.lerp(targetMouseWorld, 0.14);
      sharedUniforms.uMouseActive.value += (targetMouseActive - sharedUniforms.uMouseActive.value) * 0.08;

      if (clickTimer < 3.5) {
        clickTimer += dt;
        sharedUniforms.uClickAge.value = clickTimer;
        const s = 0.2 + clickTimer * 3.8;
        pulseRing.scale.setScalar(s);
        pulseRingMat.opacity = Math.max(0, 0.55 * (1 - clickTimer / 1.4)) * sharedUniforms.uAlphaScale.value;
        if (clickTimer >= 1.4) pulseRing.visible = false;
      }

      const mx = sharedUniforms.uMouseWorld.value.x;
      const my = sharedUniforms.uMouseWorld.value.y;
      const mActive = sharedUniforms.uMouseActive.value;

      // Subtle cursor-driven camera parallax + scroll-driven Z glide
      camera.position.x = (mx * 0.045) * mActive;
      camera.position.y = 0.35 + (my * 0.035) * mActive - smoothScroll * 2.1;
      camera.position.z = 14.5 - smoothScroll * 3.2;
      camera.lookAt(mx * 0.02 * mActive, -smoothScroll * 1.1, -2);

      // Keep 3D V-logo centered in viewport while swaying & tracking pointer
      coreGroup.position.x = coreBaseX;
      coreGroup.position.y = coreBaseY - smoothScroll * 1.15;
      const lookTiltY = (mx - coreGroup.position.x) * 0.045 * mActive;
      const lookTiltX = (my - coreGroup.position.y) * 0.04 * mActive;
      coreGroup.rotation.y = Math.sin(elapsed * 0.55) * 0.36 + Math.sin(smoothScroll * Math.PI * 2) * 0.25 + lookTiltY;
      coreGroup.rotation.x = Math.sin(elapsed * 0.38) * 0.14 - lookTiltX;
      coreGroup.rotation.z = Math.cos(elapsed * 0.32) * 0.05;
      ringMeshA.rotation.z = elapsed * 0.32;
      ringMeshA.rotation.y = elapsed * 0.18;
      ringMeshB.rotation.x = -Math.PI * 0.28 + elapsed * 0.22;
      ringMeshB.rotation.z = elapsed * -0.15;

      // Update cursor-reactive flux particles & dynamic tether lines
      baseColor.copy(sharedUniforms.uColorPrimary.value);
      activeColor.copy(sharedUniforms.uColorAccent.value);

      let lineIdx = 0;
      const nearNodes = [];
      const radiusSq = 30; // ~5.5 unit interactive radius around cursor

      for (let i = 0; i < nodeCount; i++) {
        const h = nodeHomes[i];
        let px = h.x + Math.cos(elapsed * h.speed + h.phase) * h.orbitR;
        let py = h.y + Math.sin(elapsed * h.speed * 0.9 + h.phase) * h.orbitR;
        let pz = h.z + Math.sin(elapsed * 0.5 + h.phase) * 0.25;

        const dx = px - mx;
        const dy = py - my;
        const dSq = dx * dx + dy * dy;
        let boost = 0;

        if (mActive > 0.02 && dSq < radiusSq) {
          const dist = Math.sqrt(dSq) + 0.001;
          const force = (1 - dist / 5.5) * mActive;
          boost = force;

          // Magnetic swirl + Z lift toward viewer around cursor
          const tangentX = -dy / dist;
          const tangentY = dx / dist;
          px += (tangentX * 1.05 + (dx / dist) * 0.35) * force * 1.25;
          py += (tangentY * 1.05 + (dy / dist) * 0.35) * force * 1.25;
          pz += force * 1.9;

          if (nearNodes.length < 48) {
            nearNodes.push({ px, py, pz, force });
          }
        }

        // Click radial outward push
        if (clickTimer < 1.8) {
          const cdx = px - sharedUniforms.uClickOrigin.value.x;
          const cdy = py - sharedUniforms.uClickOrigin.value.y;
          const cDist = Math.sqrt(cdx * cdx + cdy * cdy) + 0.001;
          const waveR = clickTimer * 10.5;
          const ringBand = Math.exp(-Math.pow(cDist - waveR, 2) * 0.45) * Math.exp(-clickTimer * 1.8);
          if (ringBand > 0.02) {
            px += (cdx / cDist) * ringBand * 1.4;
            py += (cdy / cDist) * ringBand * 1.4;
            pz += ringBand * 1.6;
            boost = Math.max(boost, ringBand);
          }
        }

        fluxPosAttr.setXYZ(i, px, py, pz);
        fluxSizeAttr.setX(i, 1.0 + boost * 1.7);

        const rCol = baseColor.r + (activeColor.r - baseColor.r) * Math.min(1, boost * 1.35 + (i % 3) * 0.14);
        const gCol = baseColor.g + (activeColor.g - baseColor.g) * Math.min(1, boost * 1.35 + (i % 3) * 0.14);
        const bCol = baseColor.b + (activeColor.b - baseColor.b) * Math.min(1, boost * 1.35 + (i % 3) * 0.14);
        fluxColAttr.setXYZ(i, rCol, gCol, bCol);
      }

      fluxPosAttr.needsUpdate = true;
      fluxColAttr.needsUpdate = true;
      fluxSizeAttr.needsUpdate = true;

      // Connect energized cursor-vicinity nodes with glowing 3D circuit tethers
      for (let a = 0; a < nearNodes.length && lineIdx < maxLines; a++) {
        const na = nearNodes[a];
        // Tether from node toward live cursor core
        if (na.force > 0.14 && lineIdx < maxLines) {
          const off = lineIdx * 6;
          linePositions[off] = na.px;
          linePositions[off + 1] = na.py;
          linePositions[off + 2] = na.pz;
          linePositions[off + 3] = mx;
          linePositions[off + 4] = my;
          linePositions[off + 5] = 0.65;

          const f = Math.min(1, na.force * 1.65);
          lineColors[off] = activeColor.r * f;
          lineColors[off + 1] = activeColor.g * f;
          lineColors[off + 2] = activeColor.b * f;
          lineColors[off + 3] = activeColor.r * f;
          lineColors[off + 4] = activeColor.g * f;
          lineColors[off + 5] = activeColor.b * f;
          lineIdx++;
        }

        // Cross-links between energized neighbors
        for (let b = a + 1; b < nearNodes.length && lineIdx < maxLines; b++) {
          const nb = nearNodes[b];
          const lx = na.px - nb.px;
          const ly = na.py - nb.py;
          if (lx * lx + ly * ly < 16.0) {
            const off = lineIdx * 6;
            linePositions[off] = na.px;
            linePositions[off + 1] = na.py;
            linePositions[off + 2] = na.pz;
            linePositions[off + 3] = nb.px;
            linePositions[off + 4] = nb.py;
            linePositions[off + 5] = nb.pz;

            const f = Math.min(1, Math.min(na.force, nb.force) * 1.55);
            lineColors[off] = baseColor.r * f;
            lineColors[off + 1] = baseColor.g * f;
            lineColors[off + 2] = baseColor.b * f;
            lineColors[off + 3] = activeColor.r * f;
            lineColors[off + 4] = activeColor.g * f;
            lineColors[off + 5] = activeColor.b * f;
            lineIdx++;
          }
        }
      }

      tetherPosAttr.needsUpdate = true;
      tetherColAttr.needsUpdate = true;
      tetherGeo.setDrawRange(0, lineIdx * 2);

      renderer.render(scene, camera);
    }

    function loop(now) {
      renderFrame(now);
      rafId = requestAnimationFrame(loop);
    }

    if (prefersReducedMotion) {
      renderFrame(performance.now());
    } else {
      rafId = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        } else if (!document.hidden && !rafId) {
          lastTime = null;
          rafId = requestAnimationFrame(loop);
        }
      });
    }
  }
}
