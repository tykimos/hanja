import * as THREE from 'three';
import { voxBox, makeTextCanvas } from '../engine/helpers.js';

/**
 * UI3D - Shared 3D voxel-art scene builder for non-game screens.
 * Provides consistent visual language across hub, profile, leaderboard, etc.
 */

// Shared color palette (matches game scenes)
export const PALETTE = {
  bgSpace: 0x080820,
  bgDark: 0x0a0a1e,
  groundDark: 0x0d1a0d,
  ambient: 0x334466,
  accentBlue: 0x4488ff,
  accentGold: 0xFFD700,
  accentRed: 0xEE334E,
  accentCyan: 0x0081C8,
  accentGreen: 0x00A651,
  panelDark: 0x111128,
  panelMid: 0x1a1a3e,
  pillar: 0x334455,
  pillarCap: 0x4488aa,
  mountain1: 0x1a1a4e,
  mountain2: 0x151540,
  mountain3: 0x202060,
};

// Olympic ring colors
export const RING_COLORS = [0x0081C8, 0xFCB131, 0x333333, 0x00A651, 0xEE334E];

/**
 * Creates a standard 3D scene with consistent lighting, stars, and ground.
 */
export function createScene3D(opts = {}) {
  const {
    fogDensity = 0.015,
    bgColor = PALETTE.bgDark,
    withGround = true,
    withStars = true,
    withMountains = true,
    withPillars = false,
    groundColor = PALETTE.groundDark,
    groundSize = [40, 0.3, 30],
  } = opts;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.FogExp2(bgColor, fogDensity);

  // Lighting - consistent with game scenes
  scene.add(new THREE.AmbientLight(PALETTE.ambient, 0.4));
  const dL = new THREE.DirectionalLight(0xffeedd, 0.6);
  dL.position.set(5, 12, 5);
  scene.add(dL);

  // Warm accent lights
  const pL1 = new THREE.PointLight(0xFF8844, 0.6, 25);
  pL1.position.set(-4, 5, 4);
  scene.add(pL1);
  const pL2 = new THREE.PointLight(0x4488ff, 0.4, 20);
  pL2.position.set(4, 4, 2);
  scene.add(pL2);
  // Moon accent
  const moonLight = new THREE.PointLight(0x8899CC, 0.4, 50);
  moonLight.position.set(10, 20, -10);
  scene.add(moonLight);

  // Stars
  let stars = null;
  if (withStars) {
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 200 : 400;
    const sGeo = new THREE.BufferGeometry();
    const sPos = [];
    for (let i = 0; i < starCount; i++) {
      sPos.push(
        (Math.random() - 0.5) * 100,
        Math.random() * 50 + 5,
        (Math.random() - 0.5) * 100 - 15
      );
    }
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.1, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);
  }

  // Ground
  if (withGround) {
    const ground = voxBox(groundSize[0], groundSize[1], groundSize[2], groundColor);
    ground.position.set(0, -0.5, 0);
    ground.receiveShadow = true;
    scene.add(ground);
  }

  // Mountains
  if (withMountains) {
    const mountainData = [
      [-8, 0, -12, 4, 6, 4, PALETTE.mountain1],
      [0, 0, -14, 6, 8, 5, PALETTE.mountain2],
      [8, 0, -10, 4.5, 5, 3.5, PALETTE.mountain3],
      [-12, 0, -9, 3, 4, 3, PALETTE.mountain2],
      [12, 0, -11, 3, 3.5, 2.5, PALETTE.mountain1],
    ];
    mountainData.forEach(([mx, my, mz, mw, mh, md, mc]) => {
      const m = voxBox(mw, mh, md, mc);
      m.position.set(mx, my + mh / 2, mz);
      scene.add(m);
    });
  }

  // Decorative pillars
  if (withPillars) {
    for (let i = -3; i <= 3; i += 2) {
      const p = voxBox(0.3, 4, 0.3, PALETTE.pillar);
      p.position.set(i * 3, 2, -6);
      scene.add(p);
      const top = voxBox(0.5, 0.3, 0.5, PALETTE.pillarCap);
      top.position.set(i * 3, 4.15, -6);
      scene.add(top);
    }
  }

  return { scene, stars };
}

/**
 * Creates a standard camera for non-game screens.
 */
export function createCamera3D(opts = {}) {
  const { fov = 55, near = 0.1, far = 200 } = opts;
  const w = window.innerWidth, h = window.innerHeight;
  const camera = new THREE.PerspectiveCamera(fov, w / h, near, far);
  return camera;
}

/**
 * Creates or reuses a renderer for a given canvas element.
 */
export function createRenderer3D(canvas, opts = {}) {
  const { antialias = true, alpha = false } = opts;
  const w = window.innerWidth, h = window.innerHeight;
  const isMobile = w < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(w, h);
  if (!alpha) renderer.setClearColor(PALETTE.bgDark, 1);
  return renderer;
}

/**
 * Cherry blossom petal particle system.
 */
export function createPetals(scene, count) {
  const isMobile = window.innerWidth < 768;
  const petalCount = isMobile ? Math.floor(count * 0.5) : count;
  const petals = [];
  const petalGeo = new THREE.PlaneGeometry(0.1, 0.07);
  const petalColors = [0xFFB7C5, 0xFF91A4, 0xFFCCDD, 0xFFA0B4];

  for (let i = 0; i < petalCount; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      transparent: true,
      opacity: 0.5 + Math.random() * 0.3,
      side: THREE.DoubleSide,
    });
    const petal = new THREE.Mesh(petalGeo, mat);
    petal.position.set(
      (Math.random() - 0.5) * 25,
      Math.random() * 12 + 2,
      (Math.random() - 0.5) * 18
    );
    petal.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    scene.add(petal);
    petals.push({
      mesh: petal,
      vy: -0.25 - Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      windPhase: Math.random() * Math.PI * 2,
    });
  }
  return petals;
}

/**
 * Animate petals each frame.
 */
export function updatePetals(petals, t) {
  petals.forEach(p => {
    p.mesh.position.y += p.vy * 0.016;
    p.mesh.position.x += (p.vx + Math.sin(t * 0.7 + p.windPhase) * 0.25) * 0.016;
    p.mesh.rotation.x += p.rotSpeed * 0.016;
    p.mesh.rotation.z += p.rotSpeed * 0.4 * 0.016;
    if (p.mesh.position.y < -1) {
      p.mesh.position.y = 11 + Math.random() * 4;
      p.mesh.position.x = (Math.random() - 0.5) * 25;
      p.mesh.position.z = (Math.random() - 0.5) * 18;
    }
  });
}

/**
 * Creates floating lanterns.
 */
export function createLanterns(scene, positions) {
  const lanterns = [];
  positions.forEach(([lx, ly, lz]) => {
    const lg = new THREE.Group();
    const lb = voxBox(0.3, 0.4, 0.3, PALETTE.accentRed);
    lg.add(lb);
    const cap1 = voxBox(0.22, 0.05, 0.22, 0x8B4513);
    cap1.position.y = 0.22;
    lg.add(cap1);
    const cap2 = voxBox(0.22, 0.05, 0.22, 0x8B4513);
    cap2.position.y = -0.22;
    lg.add(cap2);
    const ll = new THREE.PointLight(0xff6622, 0.6, 8);
    lg.add(ll);
    lg.position.set(lx, ly, lz);
    scene.add(lg);
    lanterns.push({ g: lg, l: ll, baseY: ly });
  });
  return lanterns;
}

/**
 * Animate lanterns each frame.
 */
export function updateLanterns(lanterns, t) {
  lanterns.forEach((l, i) => {
    l.g.position.y = l.baseY + Math.sin(t * 1.5 + i * 1.2) * 0.12;
    l.l.intensity = 0.4 + Math.sin(t * 3 + i * 2.5) * 0.25;
  });
}

/**
 * Create Olympic ring shimmer particles.
 */
export function createRingParticles(scene, basePos = [0, 9, -5]) {
  const particles = [];
  RING_COLORS.forEach((c, i) => {
    for (let j = 0; j < 2; j++) {
      const p = voxBox(0.1, 0.1, 0.1, c);
      const bx = basePos[0] - 2 + i * 1;
      const by = basePos[1] + Math.random();
      p.position.set(bx, by, basePos[2] + Math.random() * 2 - 1);
      p.userData = { baseX: bx, baseY: by, vy: 0.8 + Math.random(), phase: Math.random() * 6 };
      scene.add(p);
      particles.push(p);
    }
  });
  return particles;
}

/**
 * Animate ring particles.
 */
export function updateRingParticles(particles, t) {
  particles.forEach(p => {
    p.position.y = p.userData.baseY + Math.sin(t * p.userData.vy + p.userData.phase) * 0.5;
    p.rotation.y += 0.02;
  });
}

/**
 * Creates a 3D voxel panel (billboard/sign style).
 */
export function createVoxelPanel(w, h, d, color, opts = {}) {
  const { emissive = 0x000000, opacity = 1.0 } = opts;
  if (opacity < 1.0) {
    const mat = new THREE.MeshPhongMaterial({
      color, emissive, shininess: 20,
      transparent: true, opacity,
    });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }
  const mat = new THREE.MeshPhongMaterial({ color, emissive, shininess: 20 });
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

/**
 * Creates a text sprite using canvas texture.
 */
export function createTextSprite(text, opts = {}) {
  const {
    fontSize = 64,
    color = '#ffffff',
    bgColor = 'rgba(0,0,0,0)',
    canvasW = 512,
    canvasH = 128,
    scale = 2,
    fontFamily = '"Rajdhani","Noto Sans KR",sans-serif',
    fontWeight = 'bold',
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  if (bgColor && bgColor !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * (canvasW / canvasH), scale, 1);
  return sprite;
}

/**
 * Creates a voxel pedestal with glowing base.
 */
export function createPedestal(opts = {}) {
  const {
    width = 2,
    height = 0.3,
    depth = 2,
    color = 0x444444,
    glowColor = null,
    position = [0, 0, 0],
  } = opts;

  const group = new THREE.Group();

  // Base
  const base = voxBox(width, height, depth, color);
  group.add(base);

  // Edge highlights
  const edgeColor = new THREE.Color(color).multiplyScalar(1.3).getHex();
  const edge1 = voxBox(width + 0.05, 0.04, depth + 0.05, edgeColor);
  edge1.position.y = height / 2;
  group.add(edge1);

  // Optional glow
  if (glowColor) {
    const glow = new THREE.PointLight(glowColor, 0, 5);
    glow.position.y = 0.5;
    group.add(glow);
    group.userData.glow = glow;
  }

  group.position.set(...position);
  return group;
}

/**
 * Standard animation loop manager for non-game screens.
 */
export class SceneAnimator {
  constructor(renderer, scene, camera, screenId) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.screenId = screenId;
    this.t = 0;
    this.running = false;
    this.animId = null;
    this.updateCallbacks = [];
    this._resizeHandler = null;
  }

  addUpdate(fn) {
    this.updateCallbacks.push(fn);
  }

  start() {
    this.running = true;
    this.t = 0;

    // Resize handler
    this._resizeHandler = () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this._resizeHandler);

    const animate = () => {
      if (!this.running) return;

      this.t += 0.016;

      // Run all update callbacks
      this.updateCallbacks.forEach(fn => fn(this.t));

      this.renderer.render(this.scene, this.camera);

      // Check if screen is still active
      const screenEl = document.getElementById(this.screenId);
      if (screenEl && screenEl.classList.contains('active')) {
        this.animId = requestAnimationFrame(animate);
      } else {
        this.stop();
      }
    };
    animate();
  }

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }

  dispose() {
    this.stop();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

/**
 * Creates a cherry blossom tree (voxel style).
 */
export function createCherryTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = voxBox(0.35 * scale, 2.2 * scale, 0.35 * scale, 0x6B3410);
  trunk.position.y = 1.1 * scale;
  tree.add(trunk);

  const blossomColors = [0xFFB7C5, 0xFF91A4, 0xFFCCDD];
  for (let bx = -0.8; bx <= 0.8; bx += 0.6) {
    for (let bz = -0.8; bz <= 0.8; bz += 0.6) {
      for (let by = 0; by <= 0.8; by += 0.6) {
        if (Math.random() > 0.35) {
          const blossom = voxBox(
            (0.4 + Math.random() * 0.25) * scale,
            (0.35 + Math.random() * 0.15) * scale,
            (0.4 + Math.random() * 0.25) * scale,
            blossomColors[Math.floor(Math.random() * blossomColors.length)]
          );
          blossom.position.set(bx * scale, (2.5 + by) * scale, bz * scale);
          tree.add(blossom);
        }
      }
    }
  }
  tree.position.set(x, 0, z);
  return tree;
}

/**
 * Creates a torii gate (voxel style).
 */
export function createToriiGate(x, z, scale = 1) {
  const gate = new THREE.Group();
  // Posts
  const post1 = voxBox(0.3 * scale, 3.5 * scale, 0.3 * scale, 0xCC3333);
  post1.position.set(-1.2 * scale, 1.75 * scale, 0);
  gate.add(post1);
  const post2 = voxBox(0.3 * scale, 3.5 * scale, 0.3 * scale, 0xCC3333);
  post2.position.set(1.2 * scale, 1.75 * scale, 0);
  gate.add(post2);
  // Top beam
  const beam = voxBox(3.2 * scale, 0.25 * scale, 0.35 * scale, 0xCC3333);
  beam.position.y = 3.6 * scale;
  gate.add(beam);
  // Secondary beam
  const beam2 = voxBox(2.8 * scale, 0.15 * scale, 0.25 * scale, 0xAA2222);
  beam2.position.y = 3.0 * scale;
  gate.add(beam2);

  gate.position.set(x, 0, z);
  return gate;
}
