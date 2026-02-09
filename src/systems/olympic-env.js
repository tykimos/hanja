import * as THREE from 'three';
import { voxBox } from '../engine/helpers.js';

/**
 * OlympicEnv - 3D Olympic stadium environment elements.
 * Replaces cherry blossom / Japanese garden theme.
 */

export const OLYMPIC_COLORS = {
  blue: 0x0081C8,
  yellow: 0xFCB131,
  black: 0x333333,
  green: 0x00A651,
  red: 0xEE334E,
};

const RING_ARRAY = [OLYMPIC_COLORS.blue, OLYMPIC_COLORS.yellow, OLYMPIC_COLORS.black, OLYMPIC_COLORS.green, OLYMPIC_COLORS.red];

// ---- Olympic Rings ----

export function createOlympicRings(opts = {}) {
  const { scale = 1, position = [0, 0, 0] } = opts;
  const group = new THREE.Group();

  const ringPositions = [
    [-2.4, 0.5, 0],
    [-1.2, 0, 0],
    [0, 0.5, 0],
    [1.2, 0, 0],
    [2.4, 0.5, 0],
  ];

  ringPositions.forEach(([rx, ry, rz], i) => {
    const ring = createVoxelRing(0.8, 0.12, RING_ARRAY[i]);
    ring.position.set(rx * scale, ry * scale, rz * scale);
    group.add(ring);
  });

  group.position.set(...position);
  group.scale.setScalar(scale);
  return group;
}

function createVoxelRing(radius, thickness, color) {
  const group = new THREE.Group();
  const segments = 20;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const nextAngle = ((i + 1) / segments) * Math.PI * 2;
    const midAngle = (angle + nextAngle) / 2;

    const block = voxBox(thickness * 2.5, thickness * 2, thickness * 1.5, color);
    block.position.set(
      Math.cos(midAngle) * radius,
      Math.sin(midAngle) * radius,
      0
    );
    block.rotation.z = midAngle;
    group.add(block);
  }

  return group;
}

// ---- Olympic Torch / Cauldron ----

export function createOlympicTorch(opts = {}) {
  const { scale = 1, position = [0, 0, 0] } = opts;
  const group = new THREE.Group();

  // Cauldron base pillar
  const pillar = voxBox(0.6 * scale, 3 * scale, 0.6 * scale, 0x666677);
  pillar.position.y = 1.5 * scale;
  group.add(pillar);

  // Pillar detail rings
  for (let h = 0; h < 3; h++) {
    const ring = voxBox(0.75 * scale, 0.08 * scale, 0.75 * scale, 0x888899);
    ring.position.y = (h + 0.5) * scale;
    group.add(ring);
  }

  // Bowl
  const bowl = voxBox(1.2 * scale, 0.4 * scale, 1.2 * scale, 0x888899);
  bowl.position.y = 3.2 * scale;
  group.add(bowl);

  // Flame core (orange point light)
  const flameLight = new THREE.PointLight(0xFF6600, 2, 8);
  flameLight.position.y = 3.8 * scale;
  group.add(flameLight);
  group.userData._flameLight = flameLight;

  // Flame particles (small voxels)
  const flameParticles = [];
  const flameColors = [0xFF4400, 0xFF6600, 0xFF8800, 0xFFAA00, 0xFFDD00];
  for (let i = 0; i < 12; i++) {
    const p = voxBox(0.12 * scale, 0.12 * scale, 0.12 * scale, flameColors[i % flameColors.length]);
    const r = Math.random() * 0.3 * scale;
    const theta = Math.random() * Math.PI * 2;
    p.position.set(
      Math.cos(theta) * r,
      3.5 * scale + Math.random() * 1.2 * scale,
      Math.sin(theta) * r
    );
    group.add(p);
    flameParticles.push({
      mesh: p,
      baseY: p.position.y,
      speed: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      radius: r,
      theta,
    });
  }
  group.userData._flameParticles = flameParticles;

  group.position.set(...position);
  return group;
}

export function animateTorch(torch, t) {
  if (torch.userData._flameLight) {
    torch.userData._flameLight.intensity = 1.5 + Math.sin(t * 4) * 0.8;
  }
  if (torch.userData._flameParticles) {
    torch.userData._flameParticles.forEach(p => {
      p.mesh.position.y = p.baseY + Math.sin(t * p.speed + p.phase) * 0.3 + Math.sin(t * 2) * 0.1;
      p.mesh.material.opacity = 0.5 + Math.sin(t * p.speed + p.phase) * 0.3;
    });
  }
}

// ---- Track Lines ----

export function createTrackLines(opts = {}) {
  const { lanes = 6, length = 30, position = [0, 0, 0] } = opts;
  const group = new THREE.Group();

  // Track surface
  const track = voxBox(length, 0.06, lanes * 1.2, 0x1a1522);
  track.position.y = 0.03;
  group.add(track);

  // Lane lines
  for (let i = 0; i <= lanes; i++) {
    const line = voxBox(length, 0.02, 0.04, 0x444466);
    line.position.set(0, 0.07, -lanes * 0.6 + i * 1.2);
    group.add(line);
  }

  // Start line
  const startLine = voxBox(0.08, 0.03, lanes * 1.2, 0xffffff);
  startLine.position.set(-length / 2 + 1, 0.075, 0);
  group.add(startLine);

  group.position.set(...position);
  return group;
}

// ---- Stadium Arch ----

export function createStadiumArch(opts = {}) {
  const { width = 12, height = 8, position = [0, 0, 0] } = opts;
  const group = new THREE.Group();

  // Left pillar
  const leftPillar = voxBox(0.6, height, 0.6, 0x334455);
  leftPillar.position.set(-width / 2, height / 2, 0);
  group.add(leftPillar);

  // Right pillar
  const rightPillar = voxBox(0.6, height, 0.6, 0x334455);
  rightPillar.position.set(width / 2, height / 2, 0);
  group.add(rightPillar);

  // Top beam
  const beam = voxBox(width + 1, 0.4, 0.8, 0x334455);
  beam.position.set(0, height, 0);
  group.add(beam);

  // Olympic colored lights along the beam
  RING_ARRAY.forEach((c, i) => {
    const light = new THREE.PointLight(c, 0.4, 6);
    light.position.set(-width / 2 + (i + 0.5) * (width / 5), height + 0.3, 0.5);
    group.add(light);

    // Visible light block
    const lightBlock = voxBox(0.2, 0.2, 0.2, c);
    lightBlock.position.copy(light.position);
    group.add(lightBlock);
  });

  group.position.set(...position);
  return group;
}

// ---- Ring Shimmer Particles ----

export function createRingShimmer(opts = {}) {
  const { position = [0, 0, 0], count = 10 } = opts;
  const group = new THREE.Group();
  const particles = [];

  RING_ARRAY.forEach((c, i) => {
    for (let j = 0; j < count / 5; j++) {
      const p = voxBox(0.08, 0.08, 0.08, c);
      const bx = -2 + i;
      const by = Math.random() * 2;
      p.position.set(bx, by, Math.random() - 0.5);
      p.userData._baseX = bx;
      p.userData._baseY = by;
      p.userData._speed = 0.5 + Math.random();
      p.userData._phase = Math.random() * Math.PI * 2;
      group.add(p);
      particles.push(p);
    }
  });

  group.position.set(...position);
  group.userData._particles = particles;
  return group;
}

export function animateRingShimmer(shimmer, t) {
  if (shimmer.userData._particles) {
    shimmer.userData._particles.forEach(p => {
      p.position.y = p.userData._baseY + Math.sin(t * p.userData._speed + p.userData._phase) * 0.5;
      p.rotation.y += 0.02;
      p.rotation.x += 0.01;
    });
  }
}

// ---- Unified Scene Builder ----

/**
 * Creates a complete Olympic 3D scene with standard elements.
 */
export function createOlympicScene(opts = {}) {
  const {
    fogDensity = 0.012,
    bgColor = 0x080820,
    withGround = true,
    withStars = true,
    withRings = true,
    withTorch = false,
    withTrack = false,
    withArch = false,
    groundSize = [40, 0.3, 30],
    groundColor = 0x0d0d1a,
  } = opts;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.FogExp2(bgColor, fogDensity);

  // Lighting
  scene.add(new THREE.AmbientLight(0x334466, 0.35));
  const dL = new THREE.DirectionalLight(0xeeeeff, 0.5);
  dL.position.set(5, 15, 5);
  scene.add(dL);

  // Accent lights
  const warm = new THREE.PointLight(0xFF8844, 0.5, 25);
  warm.position.set(-6, 6, 4);
  scene.add(warm);
  const cool = new THREE.PointLight(0x4488ff, 0.4, 20);
  cool.position.set(6, 5, 3);
  scene.add(cool);
  const top = new THREE.PointLight(0xccddff, 0.3, 50);
  top.position.set(0, 20, -10);
  scene.add(top);

  // Stars
  let stars = null;
  if (withStars) {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 200 : 500;
    const sGeo = new THREE.BufferGeometry();
    const sPos = [];
    for (let i = 0; i < count; i++) {
      sPos.push(
        (Math.random() - 0.5) * 120,
        Math.random() * 60 + 5,
        (Math.random() - 0.5) * 120 - 20
      );
    }
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.1, transparent: true, opacity: 0.7,
    }));
    scene.add(stars);
  }

  // Ground (stadium floor)
  if (withGround) {
    const ground = voxBox(groundSize[0], groundSize[1], groundSize[2], groundColor);
    ground.position.set(0, -0.5, 0);
    scene.add(ground);

    // Ground accent lines
    for (let i = -3; i <= 3; i++) {
      const line = voxBox(groundSize[0], 0.02, 0.06, 0x222244);
      line.position.set(0, -0.33, i * 2);
      scene.add(line);
    }
  }

  // Distant mountains / stadium walls
  const wallData = [
    [-10, 0, -14, 6, 8, 3, 0x0a0a2e],
    [0, 0, -16, 8, 10, 4, 0x080828],
    [10, 0, -13, 5, 7, 3, 0x0c0c30],
    [-14, 0, -10, 4, 5, 3, 0x090928],
    [14, 0, -11, 4, 4, 2.5, 0x0a0a2e],
  ];
  wallData.forEach(([mx, my, mz, mw, mh, md, mc]) => {
    const m = voxBox(mw, mh, md, mc);
    m.position.set(mx, my + mh / 2, mz);
    scene.add(m);
  });

  // Olympic Rings
  let rings = null;
  if (withRings) {
    rings = createOlympicRings({ scale: 1.5, position: [0, 10, -8] });
    scene.add(rings);
  }

  // Torch
  let torch = null;
  if (withTorch) {
    torch = createOlympicTorch({ scale: 0.8, position: [-8, 0, -4] });
    scene.add(torch);
  }

  // Track
  if (withTrack) {
    scene.add(createTrackLines({ position: [0, -0.3, 5] }));
  }

  // Stadium arch
  if (withArch) {
    scene.add(createStadiumArch({ position: [0, 0, -8] }));
  }

  return { scene, stars, rings, torch };
}

/**
 * Creates a standard camera.
 */
export function createOlympicCamera(opts = {}) {
  const { fov = 50, position = [0, 6, 16] } = opts;
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(...position);
  return camera;
}

/**
 * Creates a WebGL renderer for a canvas.
 */
export function createOlympicRenderer(canvas) {
  const w = window.innerWidth, h = window.innerHeight;
  const isMobile = w < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x080820, 1);
  return renderer;
}

/**
 * Animation loop manager for screen scenes.
 */
export class OlympicAnimator {
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
      this.updateCallbacks.forEach(fn => fn(this.t));
      this.renderer.render(this.scene, this.camera);

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
