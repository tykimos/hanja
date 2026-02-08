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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1e);
    scene.fog = new THREE.FogExp2(0x0a0a1e, 0.012);

    const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    cam.position.set(0, 8, 18);
    cam.lookAt(0, 2, 0);

    // === Lighting ===
    scene.add(new THREE.AmbientLight(0x334466, 0.4));
    const dL = new THREE.DirectionalLight(0xffeedd, 0.6);
    dL.position.set(5, 12, 5);
    dL.castShadow = true;
    scene.add(dL);

    // Warm lantern lights
    const pL1 = new THREE.PointLight(0xFF8844, 1.2, 25);
    pL1.position.set(-4, 5, 4);
    scene.add(pL1);
    const pL2 = new THREE.PointLight(0xFF6622, 0.9, 20);
    pL2.position.set(4, 4, 2);
    scene.add(pL2);
    // Moonlight
    const moonLight = new THREE.PointLight(0x8899CC, 0.6, 50);
    moonLight.position.set(10, 20, -10);
    scene.add(moonLight);

    // === Stars ===
    const sGeo = new THREE.BufferGeometry();
    const sPos = [];
    for (let i = 0; i < 500; i++) sPos.push((Math.random() - .5) * 100, Math.random() * 50 + 8, (Math.random() - .5) * 100 - 15);
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    // === Ground / Zen Garden ===
    const ground = voxBox(40, 0.4, 30, 0x0d1a0d);
    ground.position.set(0, -0.2, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // Sand garden area
    const sand = voxBox(12, 0.05, 10, 0x2a2520);
    sand.position.set(3, 0.02, 2);
    scene.add(sand);

    // Zen garden raked lines (thin voxel strips)
    for (let i = -4; i <= 4; i++) {
      const line = voxBox(10, 0.02, 0.06, 0x3a3530);
      line.position.set(3, 0.06, 2 + i * 0.8);
      scene.add(line);
    }

    // Zen stones
    const stoneColors = [0x555555, 0x444444, 0x666666];
    [[4, 0.2, 1], [5.5, 0.15, 3], [2.5, 0.18, 4]].forEach(([sx, sy, sz], i) => {
      const stone = voxBox(0.5 + Math.random() * 0.3, sy * 2, 0.4 + Math.random() * 0.2, stoneColors[i]);
      stone.position.set(sx, sy, sz);
      stone.rotation.y = Math.random() * 0.5;
      scene.add(stone);
    });

    // === Water pond ===
    const waterGeo = new THREE.PlaneGeometry(8, 5);
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x112244,
      transparent: true,
      opacity: 0.7,
      shininess: 100,
      emissive: 0x051525,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-5, 0.05, 3);
    scene.add(water);

    // Water border stones
    for (let a = 0; a < Math.PI * 2; a += 0.4) {
      const bs = voxBox(0.3, 0.15, 0.3, 0x444433);
      bs.position.set(-5 + Math.cos(a) * 4.2, 0.08, 3 + Math.sin(a) * 2.7);
      bs.rotation.y = a;
      scene.add(bs);
    }

    // === Bridge over water ===
    const bridge = new THREE.Group();
    // Bridge deck
    const deck = voxBox(3, 0.12, 1.2, 0x8B4513);
    deck.position.y = 0.6;
    bridge.add(deck);
    // Bridge railings
    for (let bx = -1.2; bx <= 1.2; bx += 0.6) {
      const post = voxBox(0.1, 0.5, 0.1, 0xA0522D);
      post.position.set(bx, 0.9, 0.55);
      bridge.add(post);
      const post2 = voxBox(0.1, 0.5, 0.1, 0xA0522D);
      post2.position.set(bx, 0.9, -0.55);
      bridge.add(post2);
    }
    // Bridge top rail
    const rail1 = voxBox(3, 0.06, 0.06, 0xA0522D);
    rail1.position.set(0, 1.15, 0.55);
    bridge.add(rail1);
    const rail2 = voxBox(3, 0.06, 0.06, 0xA0522D);
    rail2.position.set(0, 1.15, -0.55);
    bridge.add(rail2);
    // Bridge supports
    const sup1 = voxBox(0.15, 0.6, 1.0, 0x6B3410);
    sup1.position.set(-1.2, 0.3, 0);
    bridge.add(sup1);
    const sup2 = voxBox(0.15, 0.6, 1.0, 0x6B3410);
    sup2.position.set(1.2, 0.3, 0);
    bridge.add(sup2);
    bridge.position.set(-5, 0, 1);
    bridge.rotation.y = 0.3;
    scene.add(bridge);

    // === Stepping stones ===
    [[-2, 0.08, 5], [-1.2, 0.08, 4.5], [-0.3, 0.08, 5.2], [0.5, 0.08, 4.8]].forEach(([sx, sy, sz]) => {
      const step = voxBox(0.5, 0.08, 0.5, 0x555544);
      step.position.set(sx, sy, sz);
      step.rotation.y = Math.random() * Math.PI;
      scene.add(step);
    });

    // === Voxel Pagoda ===
    const pagoda = new THREE.Group();
    const floors = [
      [4.2, 1.6, 4.2, 0x7B3F00],
      [3.8, 0.25, 3.8, 0xA0522D],
      [3.2, 1.3, 3.2, 0x7B3F00],
      [2.8, 0.25, 2.8, 0xA0522D],
      [2.2, 1.1, 2.2, 0x7B3F00],
      [1.8, 0.25, 1.8, 0xA0522D],
      [1.2, 0.9, 1.2, 0x7B3F00],
    ];
    let py = 0;
    floors.forEach(([fw, fh, fd, fc]) => {
      const f = voxBox(fw, fh, fd, fc);
      f.position.y = py + fh / 2;
      f.castShadow = true;
      pagoda.add(f);
      py += fh;
    });
    // Pagoda tip
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.2, 4),
      new THREE.MeshPhongMaterial({ color: 0xFFD700, emissive: 0x553300, shininess: 80 })
    );
    tip.position.y = py + 0.6;
    tip.castShadow = true;
    pagoda.add(tip);

    // Pagoda glow orb
    const glowGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFDD44, transparent: true, opacity: 0.9 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = py + 1.3;
    pagoda.add(glow);

    pagoda.position.set(0, 0, -2);
    scene.add(pagoda);

    // === Lanterns ===
    const lanterns = [];
    [[-4, 3.5, 4], [4, 3.5, 4], [-3, 6, -3], [3, 6, -3], [0, 8, 1]].forEach(([lx, ly, lz]) => {
      const lg = new THREE.Group();
      // Lantern body
      const lb = voxBox(0.35, 0.45, 0.35, 0xEE334E);
      lg.add(lb);
      // Lantern top/bottom caps
      const cap1 = voxBox(0.25, 0.06, 0.25, 0x8B4513);
      cap1.position.y = 0.26;
      lg.add(cap1);
      const cap2 = voxBox(0.25, 0.06, 0.25, 0x8B4513);
      cap2.position.y = -0.26;
      lg.add(cap2);
      // Point light
      const ll = new THREE.PointLight(0xff6622, 0.8, 10);
      ll.position.y = 0;
      lg.add(ll);
      lg.position.set(lx, ly, lz);
      scene.add(lg);
      lanterns.push({ g: lg, l: ll, baseY: ly });
    });

    // === Cherry blossom trees ===
    const treePositions = [[-7, 0, -4], [7, 0, -3], [-6, 0, 7], [8, 0, 6], [-10, 0, 0], [10, 0, -1]];
    treePositions.forEach(([tx, ty, tz]) => {
      const tree = new THREE.Group();
      // Trunk
      const trunk = voxBox(0.4, 2.5, 0.4, 0x6B3410);
      trunk.position.y = 1.25;
      tree.add(trunk);
      // Cherry blossom canopy (pink voxels)
      const blossomColors = [0xFFB7C5, 0xFF91A4, 0xFFCCDD, 0xFFA0B4];
      for (let bx = -1; bx <= 1; bx += 0.7) {
        for (let bz = -1; bz <= 1; bz += 0.7) {
          for (let by = 0; by <= 1; by += 0.7) {
            if (Math.random() > 0.3) {
              const blossom = voxBox(
                0.5 + Math.random() * 0.3,
                0.4 + Math.random() * 0.2,
                0.5 + Math.random() * 0.3,
                blossomColors[Math.floor(Math.random() * blossomColors.length)]
              );
              blossom.position.set(bx, 2.8 + by, bz);
              tree.add(blossom);
            }
          }
        }
      }
      tree.position.set(tx, ty, tz);
      scene.add(tree);
    });

    // === Cherry blossom petal particles (3D) ===
    const isMobile = window.innerWidth < 768;
    const petalCount = isMobile ? 40 : 80;
    const petals = [];
    const petalGeo = new THREE.PlaneGeometry(0.12, 0.08);
    const petalColors = [0xFFB7C5, 0xFF91A4, 0xFFCCDD, 0xFFA0B4, 0xFF8FAA];

    for (let i = 0; i < petalCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
        side: THREE.DoubleSide,
      });
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 15 + 2,
        (Math.random() - 0.5) * 20
      );
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(petal);
      petals.push({
        mesh: petal,
        vy: -0.3 - Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        rotSpeed: (Math.random() - 0.5) * 2,
        phase: Math.random() * Math.PI * 2,
        windPhase: Math.random() * Math.PI * 2,
      });
    }

    // === Floating Hanja Characters ===
    const floatChars = [];
    const sample = shuffle(ALL_HANJA).slice(0, 10);
    sample.forEach((h, i) => {
      const tex = makeTextCanvas(h.hanja, 120, '#FFD700', 'rgba(0,0,0,0)');
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.5 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(1.0, 1.0, 1);
      const angle = i / 10 * Math.PI * 2;
      sp.position.set(Math.cos(angle) * 8, 3 + Math.random() * 4, Math.sin(angle) * 8);
      scene.add(sp);
      floatChars.push({ sp, angle, baseY: sp.position.y, speed: 0.15 + Math.random() * 0.2 });
    });

    // === Olympic ring shimmer particles ===
    const ringCols = [0x0081C8, 0xFCB131, 0x000000, 0x00A651, 0xEE334E];
    const ringParticles = [];
    ringCols.forEach((c, i) => {
      for (let j = 0; j < 3; j++) {
        const p = voxBox(0.12, 0.12, 0.12, c);
        const baseX = -2 + i * 1;
        const baseY = 8 + Math.random();
        p.position.set(baseX, baseY, Math.random() * 2 - 1);
        p.userData = { baseX, baseY, vy: 0.8 + Math.random(), phase: Math.random() * 6 };
        scene.add(p);
        ringParticles.push(p);
      }
    });

    // === Camera orbit variables ===
    let camAngle = 0;
    const camRadius = 18;
    const camHeight = 8;
    const camTarget = new THREE.Vector3(0, 2.5, 0);

    // === Animation loop ===
    let t = 0;
    function animate() {
      t += 0.016;

      // Camera orbit (slow)
      camAngle += 0.001;
      cam.position.x = Math.sin(camAngle) * camRadius;
      cam.position.z = Math.cos(camAngle) * camRadius;
      cam.position.y = camHeight + Math.sin(t * 0.3) * 0.5;
      cam.lookAt(camTarget);

      // Stars twinkle
      stars.rotation.y += 0.0003;

      // Lantern float and flicker
      lanterns.forEach((l, i) => {
        l.g.position.y = l.baseY + Math.sin(t * 1.5 + i * 1.2) * 0.15;
        l.l.intensity = 0.5 + Math.sin(t * 3 + i * 2.5) * 0.35;
      });

      // Pagoda glow pulse
      glow.material.opacity = 0.6 + Math.sin(t * 2) * 0.3;
      glow.scale.setScalar(1 + Math.sin(t * 2) * 0.2);

      // Floating hanja orbit
      floatChars.forEach(f => {
        f.angle += f.speed * 0.016;
        f.sp.position.x = Math.cos(f.angle) * 8;
        f.sp.position.z = Math.sin(f.angle) * 8;
        f.sp.position.y = f.baseY + Math.sin(t * 1.2 + f.angle) * 0.6;
        f.sp.material.opacity = 0.35 + Math.sin(t + f.angle) * 0.15;
      });

      // Cherry blossom petals physics
      petals.forEach(p => {
        p.mesh.position.y += p.vy * 0.016;
        p.mesh.position.x += (p.vx + Math.sin(t * 0.8 + p.windPhase) * 0.3) * 0.016;
        p.mesh.rotation.x += p.rotSpeed * 0.016;
        p.mesh.rotation.z += p.rotSpeed * 0.5 * 0.016;
        // Reset petal when it falls below ground
        if (p.mesh.position.y < -1) {
          p.mesh.position.y = 12 + Math.random() * 5;
          p.mesh.position.x = (Math.random() - 0.5) * 30;
          p.mesh.position.z = (Math.random() - 0.5) * 20;
        }
      });

      // Water shimmer
      water.material.opacity = 0.55 + Math.sin(t * 1.5) * 0.15;
      water.material.emissive.setHex(t % 2 < 1 ? 0x051525 : 0x061828);

      // Ring particles float
      ringParticles.forEach(p => {
        p.position.y = p.userData.baseY + Math.sin(t * p.userData.vy + p.userData.phase) * 0.5;
        p.rotation.y += 0.02;
      });

      // Animated fog color (subtle warm shift)
      const fogR = 0.04 + Math.sin(t * 0.2) * 0.01;
      const fogG = 0.04 + Math.sin(t * 0.15) * 0.005;
      const fogB = 0.12 + Math.sin(t * 0.1) * 0.02;
      scene.fog.color.setRGB(fogR, fogG, fogB);
      scene.background.setRGB(fogR, fogG, fogB);

      renderer.render(scene, cam);
      const splashEl = document.getElementById('screen-splash');
      if (splashEl && splashEl.classList.contains('active')) {
        requestAnimationFrame(animate);
      } else {
        renderer.dispose();
      }
    }
    animate();

    // === Start BGM after first user interaction ===
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
