import * as THREE from 'three';
import { voxBox } from '../engine/helpers.js';

/**
 * VoxelUI - 3D UI component library for fully 3D interfaces.
 * All UI elements are Three.js groups that can be added to scenes
 * and registered with RaycastUI for interactivity.
 */

// ---- Text Rendering ----

/**
 * Create a canvas-based text texture and return it as a Sprite.
 */
export function createText(text, opts = {}) {
  const {
    fontSize = 48,
    color = '#ffffff',
    bgColor = null,
    canvasW = 512,
    canvasH = 128,
    scaleX = 4,
    scaleY = 1,
    fontFamily = '"Outfit","Noto Sans KR",sans-serif',
    fontWeight = '700',
    align = 'center',
    outlineColor = null,
    outlineWidth = 0,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (outlineColor && outlineWidth > 0) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.strokeText(text, canvasW / 2, canvasH / 2);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

// ---- 3D Button ----

/**
 * Create a clickable 3D voxel button with text label.
 */
export function create3DButton(text, opts = {}) {
  const {
    width = 3,
    height = 0.8,
    depth = 0.4,
    color = 0x2244aa,
    textColor = '#ffffff',
    fontSize = 40,
    position = [0, 0, 0],
    icon = null,
    glowColor = null,
  } = opts;

  const group = new THREE.Group();
  group.name = `Button_${text}`;

  // Button body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshPhongMaterial({
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.15).getHex(),
      shininess: 40,
    })
  );
  group.add(body);

  // Top edge highlight
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.04, 0.04, depth + 0.04),
    new THREE.MeshPhongMaterial({
      color: new THREE.Color(color).multiplyScalar(1.5).getHex(),
      emissive: new THREE.Color(color).multiplyScalar(0.3).getHex(),
    })
  );
  edge.position.y = height / 2;
  group.add(edge);

  // Text label
  const label = createText(text, {
    fontSize,
    color: textColor,
    canvasW: 512,
    canvasH: 128,
    scaleX: width * 0.9,
    scaleY: height * 0.7,
    fontWeight: '800',
  });
  label.position.z = depth / 2 + 0.01;
  group.add(label);

  // Icon (if provided)
  if (icon) {
    const iconSprite = createText(icon, {
      fontSize: 56,
      canvasW: 128,
      canvasH: 128,
      scaleX: height * 0.6,
      scaleY: height * 0.6,
    });
    iconSprite.position.set(-width / 2 + height * 0.4, 0, depth / 2 + 0.02);
    group.add(iconSprite);
  }

  // Optional glow
  if (glowColor) {
    const glow = new THREE.PointLight(glowColor, 0.6, 4);
    glow.position.set(0, 0, depth);
    group.add(glow);
    group.userData._glow = glow;
  }

  group.position.set(...position);
  return group;
}

// ---- 3D Panel ----

/**
 * Create a flat voxel panel (background, card, etc.)
 */
export function create3DPanel(opts = {}) {
  const {
    width = 8,
    height = 5,
    depth = 0.15,
    color = 0x111128,
    opacity = 0.9,
    position = [0, 0, 0],
    emissive = 0x000000,
    border = true,
    borderColor = null,
  } = opts;

  const group = new THREE.Group();

  const mat = new THREE.MeshPhongMaterial({
    color,
    emissive,
    shininess: 20,
    transparent: opacity < 1,
    opacity,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  group.add(panel);

  // Border frame
  if (border) {
    const bc = borderColor || new THREE.Color(color).multiplyScalar(1.6).getHex();
    const bMat = new THREE.MeshPhongMaterial({ color: bc, emissive: bc, emissiveIntensity: 0.2 });

    // Top
    group.add(new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.04, depth + 0.02), bMat).translateY(height / 2));
    // Bottom
    group.add(new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.04, depth + 0.02), bMat).translateY(-height / 2));
    // Left
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, height, depth + 0.02), bMat).translateX(-width / 2));
    // Right
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, height, depth + 0.02), bMat).translateX(width / 2));
  }

  group.position.set(...position);
  return group;
}

// ---- 3D List Item (Leaderboard entry, profile row, etc.) ----

export function create3DListItem(opts = {}) {
  const {
    rank = 1,
    name = 'Player',
    score = '0',
    width = 7,
    height = 0.6,
    position = [0, 0, 0],
    isMe = false,
    medalColor = null,
  } = opts;

  const group = new THREE.Group();

  // Background bar
  const bgColor = isMe ? 0x1a2a4a : 0x0d0d28;
  const bg = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.1),
    new THREE.MeshPhongMaterial({
      color: bgColor,
      emissive: isMe ? 0x0a1530 : 0x000000,
      shininess: 10,
    })
  );
  group.add(bg);

  // Rank badge
  const rankColor = medalColor || (rank <= 3 ? [0xFFD700, 0xC0C0C0, 0xCD7F32][rank - 1] : 0x334466);
  const rankBadge = new THREE.Mesh(
    new THREE.BoxGeometry(height * 0.8, height * 0.8, 0.15),
    new THREE.MeshPhongMaterial({ color: rankColor, emissive: new THREE.Color(rankColor).multiplyScalar(0.2).getHex() })
  );
  rankBadge.position.set(-width / 2 + height * 0.5, 0, 0.06);
  group.add(rankBadge);

  // Rank text
  const rankText = createText(String(rank), {
    fontSize: 48, color: rank <= 3 ? '#111111' : '#ffffff',
    canvasW: 64, canvasH: 64, scaleX: height * 0.5, scaleY: height * 0.5,
    fontWeight: '900',
  });
  rankText.position.set(-width / 2 + height * 0.5, 0, 0.2);
  group.add(rankText);

  // Name text
  const nameText = createText(name, {
    fontSize: 36, color: isMe ? '#00E5FF' : '#ffffff',
    canvasW: 384, canvasH: 64, scaleX: 3, scaleY: height * 0.55,
    fontWeight: '600',
  });
  nameText.position.set(-0.5, 0, 0.1);
  group.add(nameText);

  // Score text
  const scoreText = createText(score, {
    fontSize: 36, color: '#FFD700',
    canvasW: 192, canvasH: 64, scaleX: 1.5, scaleY: height * 0.55,
    fontWeight: '800',
  });
  scoreText.position.set(width / 2 - 1.2, 0, 0.1);
  group.add(scoreText);

  group.position.set(...position);
  return group;
}

// ---- 3D Tab Button ----

export function create3DTab(text, opts = {}) {
  const {
    active = false,
    width = 2,
    height = 0.5,
    position = [0, 0, 0],
    color = null,
  } = opts;

  const tabColor = color || (active ? 0xFFD700 : 0x222244);
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.15),
    new THREE.MeshPhongMaterial({
      color: tabColor,
      emissive: active ? 0x554400 : 0x000000,
      shininess: 30,
    })
  );
  group.add(body);

  const label = createText(text, {
    fontSize: 30, color: active ? '#111111' : '#aaaaaa',
    canvasW: 256, canvasH: 64, scaleX: width * 0.85, scaleY: height * 0.7,
    fontWeight: active ? '800' : '600',
  });
  label.position.z = 0.1;
  group.add(label);

  group.position.set(...position);
  return group;
}

// ---- 3D Grade Cube ----

export function create3DGradeCube(grade, opts = {}) {
  const {
    selected = false,
    size = 1.2,
    position = [0, 0, 0],
  } = opts;

  const group = new THREE.Group();
  const cubeColor = selected ? 0xFFD700 : 0x222244;

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size * 0.45),
    new THREE.MeshPhongMaterial({
      color: cubeColor,
      emissive: selected ? 0x554400 : 0x0a0a20,
      shininess: selected ? 60 : 20,
    })
  );
  group.add(cube);

  // Grade text
  const textSprite = createText(grade, {
    fontSize: 48, color: selected ? '#111111' : '#ffffff',
    canvasW: 128, canvasH: 128, scaleX: size * 0.8, scaleY: size * 0.8,
    fontWeight: '900',
  });
  textSprite.position.z = size * 0.25 + 0.05;
  group.add(textSprite);

  // Glow for selected
  if (selected) {
    const glow = new THREE.PointLight(0xFFD700, 1.5, 5);
    glow.position.z = size * 0.4;
    group.add(glow);
    group.userData._glow = glow;
  }

  group.position.set(...position);
  group.userData.grade = grade;
  return group;
}

// ---- 3D Medal Display ----

export function create3DMedal(type, opts = {}) {
  const {
    size = 1.0,
    position = [0, 0, 0],
  } = opts;

  const colors = { gold: 0xFFD700, silver: 0xC0C0C0, bronze: 0xCD7F32 };
  const c = colors[type] || 0x888888;

  const group = new THREE.Group();

  // Medal disc
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.5, size * 0.5, size * 0.12, 16),
    new THREE.MeshPhongMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.2).getHex(), shininess: 80 })
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  // Medal rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(size * 0.5, size * 0.04, 8, 24),
    new THREE.MeshPhongMaterial({ color: new THREE.Color(c).multiplyScalar(0.7).getHex(), shininess: 60 })
  );
  group.add(rim);

  // Glow
  const glow = new THREE.PointLight(c, 0.8, 4);
  glow.position.z = size * 0.3;
  group.add(glow);
  group.userData._glow = glow;

  group.position.set(...position);
  return group;
}

// ---- Podium (1st, 2nd, 3rd) ----

export function create3DPodium(opts = {}) {
  const { position = [0, 0, 0], scale = 1 } = opts;
  const group = new THREE.Group();

  // 1st place (center, tallest)
  const p1 = voxBox(2 * scale, 3 * scale, 1.5 * scale, 0xFFD700);
  p1.position.set(0, 1.5 * scale, 0);
  group.add(p1);

  // Crown on 1st
  const crown = voxBox(0.8 * scale, 0.4 * scale, 0.3 * scale, 0xFFD700);
  crown.position.set(0, 3.2 * scale, 0);
  group.add(crown);
  const crownGlow = new THREE.PointLight(0xFFD700, 1, 6);
  crownGlow.position.set(0, 3.5 * scale, 0);
  group.add(crownGlow);
  group.userData._crownGlow = crownGlow;
  group.userData._crown = crown;

  // "1" label
  const l1 = createText('1', { fontSize: 72, color: '#ffffff', canvasW: 64, canvasH: 64, scaleX: 0.8 * scale, scaleY: 0.8 * scale, fontWeight: '900' });
  l1.position.set(0, 3.4 * scale, 0.8 * scale);
  group.add(l1);

  // 2nd place (left)
  const p2 = voxBox(2 * scale, 2 * scale, 1.5 * scale, 0xC0C0C0);
  p2.position.set(-2.5 * scale, 1 * scale, 0);
  group.add(p2);
  const l2 = createText('2', { fontSize: 72, color: '#ffffff', canvasW: 64, canvasH: 64, scaleX: 0.8 * scale, scaleY: 0.8 * scale, fontWeight: '900' });
  l2.position.set(-2.5 * scale, 2.3 * scale, 0.8 * scale);
  group.add(l2);

  // 3rd place (right)
  const p3 = voxBox(2 * scale, 1.5 * scale, 1.5 * scale, 0xCD7F32);
  p3.position.set(2.5 * scale, 0.75 * scale, 0);
  group.add(p3);
  const l3 = createText('3', { fontSize: 72, color: '#ffffff', canvasW: 64, canvasH: 64, scaleX: 0.8 * scale, scaleY: 0.8 * scale, fontWeight: '900' });
  l3.position.set(2.5 * scale, 1.8 * scale, 0.8 * scale);
  group.add(l3);

  group.position.set(...position);
  return group;
}

// ---- Back Arrow Button ----

export function create3DBackButton(opts = {}) {
  const { position = [-6, 5, 0], size = 0.6 } = opts;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 0.4),
    new THREE.MeshPhongMaterial({ color: 0x333355, emissive: 0x111122, shininess: 30 })
  );
  group.add(body);

  const arrow = createText('\u2190', {
    fontSize: 64, color: '#ffffff',
    canvasW: 96, canvasH: 96, scaleX: size, scaleY: size,
    fontWeight: '900',
  });
  arrow.position.z = size * 0.25;
  group.add(arrow);

  group.position.set(...position);
  return group;
}

// ---- Title Banner ----

export function create3DTitleBanner(text, opts = {}) {
  const {
    position = [0, 7, -5],
    color = '#FFD700',
    bgColor = 0x111128,
    width = 9,
    height = 1.2,
  } = opts;

  const group = new THREE.Group();

  // Background panel
  const bg = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.15),
    new THREE.MeshPhongMaterial({ color: bgColor, emissive: 0x050510, shininess: 10, transparent: true, opacity: 0.85 })
  );
  group.add(bg);

  // Title text
  const label = createText(text, {
    fontSize: 52, color,
    canvasW: 768, canvasH: 128, scaleX: width * 0.9, scaleY: height * 0.8,
    fontWeight: '900',
    outlineColor: 'rgba(0,0,0,0.5)', outlineWidth: 3,
  });
  label.position.z = 0.12;
  group.add(label);

  group.position.set(...position);
  return group;
}

// ---- Game Card (for hub) ----

export function create3DGameCard(opts = {}) {
  const {
    name = 'Game',
    icon = '?',
    color = 0x4488ff,
    bestScore = null,
    medal = null,
    position = [0, 0, 0],
  } = opts;

  const group = new THREE.Group();
  group.name = `GameCard_${name}`;

  // Card base (standing slab)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.8, 0.3),
    new THREE.MeshPhongMaterial({
      color: 0x151530,
      emissive: 0x050510,
      shininess: 20,
    })
  );
  group.add(base);

  // Color accent bar at top
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.12, 0.35),
    new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.3).getHex() })
  );
  accent.position.y = 1.4;
  group.add(accent);

  // Icon block
  const iconBlock = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 0.35),
    new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.15).getHex(), shininess: 40 })
  );
  iconBlock.position.set(0, 0.5, 0.02);
  group.add(iconBlock);
  group.userData._iconBlock = iconBlock;

  // Icon sprite
  const iconSprite = createText(icon, {
    fontSize: 64, canvasW: 128, canvasH: 128, scaleX: 0.9, scaleY: 0.9,
  });
  iconSprite.position.set(0, 0.5, 0.25);
  group.add(iconSprite);

  // Name label
  const nameLabel = createText(name, {
    fontSize: 32, color: '#ffffff',
    canvasW: 256, canvasH: 48, scaleX: 1.8, scaleY: 0.35,
    fontWeight: '700',
  });
  nameLabel.position.set(0, -0.35, 0.2);
  group.add(nameLabel);

  // Best score (if exists)
  if (bestScore !== null) {
    const scoreLabel = createText(bestScore, {
      fontSize: 24, color: '#aaaacc',
      canvasW: 256, canvasH: 48, scaleX: 1.6, scaleY: 0.3,
      fontWeight: '600',
    });
    scoreLabel.position.set(0, -0.75, 0.2);
    group.add(scoreLabel);
  }

  // Medal indicator
  if (medal) {
    const medalColors = { gold: 0xFFD700, silver: 0xC0C0C0, bronze: 0xCD7F32 };
    const mc = medalColors[medal] || 0x888888;
    const medalDot = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.15),
      new THREE.MeshPhongMaterial({ color: mc, emissive: new THREE.Color(mc).multiplyScalar(0.3).getHex() })
    );
    medalDot.position.set(0.8, 1.1, 0.2);
    group.add(medalDot);
  }

  // Glow
  const glow = new THREE.PointLight(color, 0, 4);
  glow.position.set(0, 0.5, 1);
  group.add(glow);
  group.userData._glow = glow;

  group.position.set(...position);
  return group;
}

// ---- Loading Spinner (3D) ----

export function create3DSpinner(opts = {}) {
  const { position = [0, 0, 0], size = 0.5 } = opts;
  const group = new THREE.Group();

  const ringColors = [0x0081C8, 0xFCB131, 0x333333, 0x00A651, 0xEE334E];
  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.4, size * 0.4, size * 0.4),
      new THREE.MeshPhongMaterial({ color: ringColors[i], emissive: new THREE.Color(ringColors[i]).multiplyScalar(0.3).getHex() })
    );
    const angle = (i / 5) * Math.PI * 2;
    dot.position.set(Math.cos(angle) * size, Math.sin(angle) * size, 0);
    dot.userData._angle = angle;
    group.add(dot);
  }

  group.position.set(...position);
  group.userData._spinnerSize = size;
  return group;
}

export function animateSpinner(spinner, t) {
  const size = spinner.userData._spinnerSize || 0.5;
  spinner.children.forEach((dot, i) => {
    if (dot.userData._angle !== undefined) {
      const angle = dot.userData._angle + t * 3;
      dot.position.set(Math.cos(angle) * size, Math.sin(angle) * size, 0);
      dot.scale.setScalar(0.8 + Math.sin(t * 5 + i) * 0.2);
    }
  });
}
