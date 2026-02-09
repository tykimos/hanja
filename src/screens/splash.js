import * as THREE from 'three';
import { ALL_HANJA } from '../data/hanja.js';
import { voxBox, makeTextCanvas } from '../engine/helpers.js';
import { shuffle } from '../utils.js';
import Store from '../systems/store.js';
import { SoundSystem } from '../systems/sound.js';

export function initSplash(onReady) {
  const canvas = document.getElementById('splash3d');
  if (canvas && typeof THREE !== 'undefined') {
    const w = window.innerWidth, h = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080820);
    scene.fog = new THREE.FogExp2(0x080820, 0.01);

    const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    cam.position.set(0, 8, 18);
    cam.lookAt(0, 2, 0);

    // === Lighting ===
    scene.add(new THREE.AmbientLight(0x334466, 0.35));
    const dL = new THREE.DirectionalLight(0xeeeeff, 0.5);
    dL.position.set(5, 15, 5);
    dL.castShadow = true;
    scene.add(dL);

    // Accent lights (Olympic colors)
    const pL1 = new THREE.PointLight(0x0081C8, 0.8, 25);
    pL1.position.set(-6, 5, 4);
    scene.add(pL1);
    const pL2 = new THREE.PointLight(0xEE334E, 0.6, 20);
    pL2.position.set(6, 4, 2);
    scene.add(pL2);
    const pL3 = new THREE.PointLight(0xFFD700, 0.5, 30);
    pL3.position.set(0, 10, -5);
    scene.add(pL3);

    // === Stars ===
    const isMobile = w < 768;
    const sGeo = new THREE.BufferGeometry();
    const sPos = [];
    const starCount = isMobile ? 300 : 600;
    for (let i = 0; i < starCount; i++) sPos.push(
      (Math.random() - .5) * 120,
      Math.random() * 60 + 5,
      (Math.random() - .5) * 120 - 20
    );
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.1, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);

    // === Ground (stadium floor) ===
    const ground = voxBox(50, 0.3, 35, 0x0d0d1a);
    ground.position.set(0, -0.5, 0);
    scene.add(ground);

    // Floor accent lines
    for (let i = -5; i <= 5; i++) {
      const line = voxBox(50, 0.02, 0.05, 0x222244);
      line.position.set(0, -0.33, i * 2);
      scene.add(line);
    }

    // === Stadium walls ===
    const wallData = [
      [-10, 0, -14, 6, 10, 3, 0x0a0a2e],
      [0, 0, -16, 10, 12, 4, 0x080828],
      [10, 0, -13, 5, 8, 3, 0x0c0c30],
      [-15, 0, -10, 4, 6, 3, 0x090928],
      [15, 0, -11, 4, 5, 2.5, 0x0a0a2e],
    ];
    wallData.forEach(([mx, my, mz, mw, mh, md, mc]) => {
      const m = voxBox(mw, mh, md, mc);
      m.position.set(mx, my + mh / 2, mz);
      scene.add(m);
    });

    // === Olympic Rings (voxel style) ===
    const ringColors = [0x0081C8, 0xFCB131, 0x333333, 0x00A651, 0xEE334E];
    const ringPositions = [
      [-2.4, 0.5], [-1.2, 0], [0, 0.5], [1.2, 0], [2.4, 0.5],
    ];
    const ringsGroup = new THREE.Group();
    ringPositions.forEach(([rx, ry], i) => {
      const segments = 16;
      for (let s = 0; s < segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        const block = voxBox(0.25, 0.2, 0.15, ringColors[i]);
        block.position.set(
          rx + Math.cos(angle) * 0.7,
          ry + Math.sin(angle) * 0.7,
          0
        );
        block.rotation.z = angle;
        ringsGroup.add(block);
      }
    });
    ringsGroup.position.set(0, 10, -6);
    ringsGroup.scale.setScalar(1.8);
    scene.add(ringsGroup);

    // === Olympic Torch / Cauldron ===
    const torchGroup = new THREE.Group();
    const pillar = voxBox(0.5, 3, 0.5, 0x666677);
    pillar.position.y = 1.5;
    torchGroup.add(pillar);
    for (let h = 0; h < 3; h++) {
      const ring = voxBox(0.65, 0.08, 0.65, 0x888899);
      ring.position.y = (h + 0.5);
      torchGroup.add(ring);
    }
    const bowl = voxBox(1.0, 0.35, 1.0, 0x888899);
    bowl.position.y = 3.2;
    torchGroup.add(bowl);
    const flameLight = new THREE.PointLight(0xFF6600, 2, 10);
    flameLight.position.y = 3.8;
    torchGroup.add(flameLight);

    // Flame particles
    const flameParticles = [];
    const flameColors = [0xFF4400, 0xFF6600, 0xFF8800, 0xFFAA00, 0xFFDD00];
    for (let i = 0; i < 15; i++) {
      const p = voxBox(0.1, 0.1, 0.1, flameColors[i % flameColors.length]);
      const r = Math.random() * 0.25;
      const theta = Math.random() * Math.PI * 2;
      p.position.set(Math.cos(theta) * r, 3.5 + Math.random() * 1.2, Math.sin(theta) * r);
      torchGroup.add(p);
      flameParticles.push({ mesh: p, baseY: p.position.y, speed: 1 + Math.random() * 2, phase: Math.random() * Math.PI * 2 });
    }
    torchGroup.position.set(-8, 0, -3);
    scene.add(torchGroup);

    // Second torch on other side
    const torch2 = torchGroup.clone(true);
    torch2.position.set(8, 0, -3);
    scene.add(torch2);

    // === Stadium Arch ===
    const archWidth = 14, archHeight = 9;
    const archLeft = voxBox(0.6, archHeight, 0.6, 0x334455);
    archLeft.position.set(-archWidth / 2, archHeight / 2, -8);
    scene.add(archLeft);
    const archRight = voxBox(0.6, archHeight, 0.6, 0x334455);
    archRight.position.set(archWidth / 2, archHeight / 2, -8);
    scene.add(archRight);
    const archBeam = voxBox(archWidth + 1, 0.4, 0.8, 0x334455);
    archBeam.position.set(0, archHeight, -8);
    scene.add(archBeam);
    // Olympic colored lights on arch
    ringColors.forEach((c, i) => {
      const light = new THREE.PointLight(c, 0.3, 6);
      light.position.set(-archWidth / 2 + (i + 0.5) * (archWidth / 5), archHeight + 0.3, -7.5);
      scene.add(light);
      const lightBlock = voxBox(0.2, 0.2, 0.2, c);
      lightBlock.position.copy(light.position);
      scene.add(lightBlock);
    });

    // === Track Lines ===
    const trackGroup = new THREE.Group();
    const trackLen = 30;
    const trackSurface = voxBox(trackLen, 0.06, 7, 0x1a1522);
    trackSurface.position.y = 0.03;
    trackGroup.add(trackSurface);
    for (let lane = 0; lane <= 6; lane++) {
      const line = voxBox(trackLen, 0.02, 0.04, 0x444466);
      line.position.set(0, 0.07, -3 + lane * 1);
      trackGroup.add(line);
    }
    const startLine = voxBox(0.08, 0.03, 7, 0xffffff);
    startLine.position.set(-trackLen / 2 + 1, 0.075, 0);
    trackGroup.add(startLine);
    trackGroup.position.set(0, -0.3, 4);
    scene.add(trackGroup);

    // === Podium (decorative) ===
    const podium = new THREE.Group();
    const p1 = voxBox(2, 2.5, 1.5, 0xFFD700);
    p1.position.set(0, 1.25, 0);
    podium.add(p1);
    const p2 = voxBox(2, 1.8, 1.5, 0xC0C0C0);
    p2.position.set(-2.5, 0.9, 0);
    podium.add(p2);
    const p3 = voxBox(2, 1.2, 1.5, 0xCD7F32);
    p3.position.set(2.5, 0.6, 0);
    podium.add(p3);
    podium.position.set(0, 0, -3);
    scene.add(podium);

    // === Floating Hanja Characters ===
    const floatChars = [];
    const sample = shuffle(ALL_HANJA).slice(0, 12);
    sample.forEach((h, i) => {
      const tex = makeTextCanvas(h.hanja, 120, '#FFD700', 'rgba(0,0,0,0)');
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.4 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(1.0, 1.0, 1);
      const angle = i / 12 * Math.PI * 2;
      sp.position.set(Math.cos(angle) * 9, 3 + Math.random() * 5, Math.sin(angle) * 9);
      scene.add(sp);
      floatChars.push({ sp, angle, baseY: sp.position.y, speed: 0.1 + Math.random() * 0.15 });
    });

    // === Ring Shimmer Particles ===
    const shimmerParticles = [];
    ringColors.forEach((c, i) => {
      for (let j = 0; j < 3; j++) {
        const p = voxBox(0.1, 0.1, 0.1, c);
        const bx = -2 + i;
        const by = 9.5 + Math.random();
        p.position.set(bx * 1.8, by, -5.5 + Math.random());
        p.userData = { baseX: bx, baseY: by, vy: 0.5 + Math.random(), phase: Math.random() * 6 };
        scene.add(p);
        shimmerParticles.push(p);
      }
    });

    // === Camera orbit ===
    let camAngle = 0;
    const camRadius = 18;
    const camHeight = 8;
    const camTarget = new THREE.Vector3(0, 3, 0);

    // === Animation loop ===
    let t = 0;
    function animate() {
      t += 0.016;

      // Camera orbit
      camAngle += 0.0008;
      cam.position.x = Math.sin(camAngle) * camRadius;
      cam.position.z = Math.cos(camAngle) * camRadius;
      cam.position.y = camHeight + Math.sin(t * 0.3) * 0.5;
      cam.lookAt(camTarget);

      stars.rotation.y += 0.0003;

      // Flame animation
      flameLight.intensity = 1.5 + Math.sin(t * 4) * 0.8;
      flameParticles.forEach(p => {
        p.mesh.position.y = p.baseY + Math.sin(t * p.speed + p.phase) * 0.3;
      });

      // Floating hanja orbit
      floatChars.forEach(f => {
        f.angle += f.speed * 0.016;
        f.sp.position.x = Math.cos(f.angle) * 9;
        f.sp.position.z = Math.sin(f.angle) * 9;
        f.sp.position.y = f.baseY + Math.sin(t * 1.2 + f.angle) * 0.6;
        f.sp.material.opacity = 0.3 + Math.sin(t + f.angle) * 0.12;
      });

      // Ring shimmer
      shimmerParticles.forEach(p => {
        p.position.y = p.userData.baseY + Math.sin(t * p.userData.vy + p.userData.phase) * 0.5;
        p.rotation.y += 0.02;
      });

      // Rings gentle bob
      ringsGroup.position.y = 10 + Math.sin(t * 0.5) * 0.15;
      ringsGroup.rotation.y = Math.sin(t * 0.08) * 0.05;

      // Accent light pulse
      pL1.intensity = 0.6 + Math.sin(t * 1.5) * 0.3;
      pL2.intensity = 0.4 + Math.sin(t * 1.8 + 1) * 0.25;
      pL3.intensity = 0.4 + Math.sin(t * 1.2 + 2) * 0.2;

      renderer.render(scene, cam);
      const splashEl = document.getElementById('screen-splash');
      if (splashEl && splashEl.classList.contains('active')) {
        requestAnimationFrame(animate);
      } else {
        renderer.dispose();
      }
    }
    animate();

    // Start BGM after first user interaction
    const startBGMOnce = () => {
      SoundSystem.init();
      SoundSystem.startBGM('zen');
      document.removeEventListener('click', startBGMOnce);
      document.removeEventListener('touchstart', startBGMOnce);
    };
    document.addEventListener('click', startBGMOnce, { once: true });
    document.addEventListener('touchstart', startBGMOnce, { once: true });
  }

  setTimeout(async () => {
    const ld = document.getElementById('splash-loading');
    if (ld) ld.innerHTML = '';
    onReady();
  }, 2500);
}
