import * as THREE from 'three';
import { GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { voxBox, makeTextCanvas } from '../engine/helpers.js';
import { SoundSystem } from '../systems/sound.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';
import {
  createScene3D, createCamera3D, createRenderer3D,
  createPetals, updatePetals,
  createLanterns, updateLanterns,
  createRingParticles, updateRingParticles,
  createCherryTree, createToriiGate,
  createTextSprite, createVoxelPanel,
  PALETTE, SceneAnimator,
} from '../systems/ui3d.js';

let hubAnimator = null;

// Game display config
const GAME_CONFIG = {
  archery:       { color: 0xEE334E, icon: '\u{1F3F9}', nameEn: 'Archery' },
  swimming:      { color: 0x0081C8, icon: '\u{1F3CA}', nameEn: 'Swimming' },
  weightlifting: { color: 0xFCB131, icon: '\u{1F3CB}\u{FE0F}', nameEn: 'Weightlifting' },
  gymnastics:    { color: 0x6C63FF, icon: '\u{1F0CF}', nameEn: 'Memory Card' },
  marathon:      { color: 0x00A651, icon: '\u{1F3C3}', nameEn: 'Marathon' },
  antonym:       { color: 0xFF6B6B, icon: '\u{1F504}', nameEn: 'Antonyms' },
  idiom:         { color: 0xFFD700, icon: '\u{1F4DC}', nameEn: 'Idioms' },
  homonym:       { color: 0x00BCD4, icon: '\u{1F524}', nameEn: 'Homophones' },
};

function cleanupHub3D() {
  if (hubAnimator) {
    hubAnimator.dispose();
    hubAnimator = null;
  }
}

function initHub3DBackground() {
  const canvas = document.getElementById('hub3d');
  if (!canvas) return;
  cleanupHub3D();

  // Scene
  const { scene, stars } = createScene3D({
    fogDensity: 0.012,
    withGround: true,
    withStars: true,
    withMountains: true,
    withPillars: true,
  });

  // Camera
  const camera = createCamera3D({ fov: 50 });
  camera.position.set(0, 6, 16);
  camera.lookAt(0, 2, 0);

  // Renderer
  const renderer = createRenderer3D(canvas, { alpha: true });
  renderer.setClearColor(0x000000, 0);

  // Cherry blossom trees
  [[-9, -5], [9, -4], [-8, 6], [10, 5]].forEach(([tx, tz]) => {
    scene.add(createCherryTree(tx, tz, 0.8));
  });

  // Torii gate in background
  scene.add(createToriiGate(0, -5, 0.9));

  // Lanterns
  const lanterns = createLanterns(scene, [
    [-4, 4, 3], [4, 4, 3], [-3, 6, -3], [3, 6, -3],
  ]);

  // Petals
  const petals = createPetals(scene, 40);

  // Ring particles
  const ringParticles = createRingParticles(scene, [0, 10, -6]);

  // 8 Game pedestals with voxel icons
  const gamePedestals = [];
  const isMobile = window.innerWidth < 768;

  // Arrange in 2 rows of 4 (arc layout)
  const positions = isMobile ? [
    [-2.5, 0, 0], [0, 0, 0], [2.5, 0, 0], [5, 0, 0],
    [-2.5, 0, 3], [0, 0, 3], [2.5, 0, 3], [5, 0, 3],
  ] : [
    [-6, 0, -1], [-3, 0, -2], [0, 0, -2.5], [3, 0, -2],
    [6, 0, -1], [-4.5, 0, 1.5], [-1.5, 0, 1], [1.5, 0, 1.5],
  ];

  GAME_LIST.forEach((g, idx) => {
    const cfg = GAME_CONFIG[g.id] || { color: 0x888888, icon: '?', nameEn: g.name };
    const pos = positions[idx] || [idx * 3 - 9, 0, 0];
    const group = new THREE.Group();

    // Pedestal base
    const base = voxBox(1.6, 0.25, 1.6, 0x333344);
    base.position.y = 0.125;
    group.add(base);

    // Pedestal top plate
    const plate = voxBox(1.4, 0.08, 1.4, 0x444466);
    plate.position.y = 0.29;
    group.add(plate);

    // Game icon block (colored)
    const iconBlock = voxBox(1.0, 1.0, 0.4, cfg.color);
    iconBlock.position.set(0, 1.1, 0);
    group.add(iconBlock);

    // Icon face - text sprite
    const iconSprite = createTextSprite(cfg.icon, {
      fontSize: 72, canvasW: 128, canvasH: 128, scale: 0.8,
    });
    iconSprite.position.set(0, 1.1, 0.25);
    group.add(iconSprite);

    // Glow point light
    const glow = new THREE.PointLight(cfg.color, 0, 4);
    glow.position.set(0, 1.5, 0);
    group.add(glow);

    group.position.set(pos[0], pos[1], pos[2]);
    scene.add(group);

    gamePedestals.push({
      group, iconBlock, glow,
      baseY: 1.1,
      bobPhase: Math.random() * Math.PI * 2,
      color: cfg.color,
    });
  });

  // Central title voxel structure
  const titleGroup = new THREE.Group();
  // Back panel
  const titleBg = createVoxelPanel(8, 1.5, 0.2, 0x111128, { opacity: 0.8 });
  titleBg.position.set(0, 7, -7);
  titleGroup.add(titleBg);
  // Title text sprite
  const titleText = createTextSprite('OLYMPIC VILLAGE', {
    fontSize: 48, color: '#FFD700', canvasW: 512, canvasH: 96, scale: 3.5,
    fontWeight: '900',
  });
  titleText.position.set(0, 7, -6.7);
  titleGroup.add(titleText);
  scene.add(titleGroup);

  // Animation
  hubAnimator = new SceneAnimator(renderer, scene, camera, 'screen-hub');

  hubAnimator.addUpdate((t) => {
    // Stars twinkle
    if (stars) stars.rotation.y += 0.0002;

    // Camera gentle sway
    camera.position.x = Math.sin(t * 0.05) * 1.5;
    camera.position.y = 6 + Math.sin(t * 0.08) * 0.3;
    camera.lookAt(0, 2, 0);

    // Petals
    updatePetals(petals, t);

    // Lanterns
    updateLanterns(lanterns, t);

    // Ring particles
    updateRingParticles(ringParticles, t);

    // Game pedestals bob and glow
    gamePedestals.forEach((p, i) => {
      const bob = Math.sin(t * 1.2 + p.bobPhase) * 0.15;
      p.iconBlock.position.y = p.baseY + bob;
      p.iconBlock.rotation.y = Math.sin(t * 0.4 + p.bobPhase) * 0.15;
      p.glow.intensity = 0.3 + Math.sin(t * 2 + i) * 0.2;
    });
  });

  hubAnimator.start();
}

export function showHub(deps) {
  const { startGame, startDaily, showLeaderboard, showProfile, showStudy, showAuth, showRoom, showRoomJoin } = deps;
  const signal = Router.navigate('screen-hub');
  const profile = Store.getProfile();
  if (!profile) { showAuth(); return; }

  // Initialize 3D background
  setTimeout(() => initHub3DBackground(), 50);

  // Render sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = renderSidebar();
    updateSidebarData();
  }

  // Update user info in header
  const userIcon = $('hub-user-icon');
  const userName = $('hub-user-name');
  if (userIcon) userIcon.textContent = profile.icon;
  if (userName) userName.textContent = profile.username;

  // Stop BGM when entering a game
  const startGameWithBGMStop = (gameId) => {
    SoundSystem.stopBGM();
    cleanupHub3D();
    startGame(gameId);
  };

  const startDailyWithBGMStop = () => {
    SoundSystem.stopBGM();
    cleanupHub3D();
    startDaily();
  };

  // Load best scores async
  Store.getBestScores().then(bestScores => {
    // Daily card
    const dailyDiv = $('hub-daily-card');
    Store.getDailyChallenge().then(dc => {
      const doneToday = !!dc;
      Store.getDailyStreak().then(streak => {
        const statusText = doneToday ? 'Completed' : 'Available';
        const scoreText = doneToday ? `Today: ${dc.score}/10 ${dc.medal ? medalEmoji(dc.medal) : ''}` : 'Complete today\'s Hanja challenge';

        dailyDiv.innerHTML = `<div class="daily-card" id="hub-daily-btn">
          <div class="daily-card-title">Daily Challenge - ${statusText}</div>
          <div class="daily-card-info">${scoreText}</div>
          ${streak ? `<div class="daily-streak">${streak} Day Streak</div>` : ''}
        </div>`;
        $('hub-daily-btn').addEventListener('click', () => startDailyWithBGMStop(), { signal });
      });
    });

    // Game grid
    const grid = $('hub-game-grid');
    grid.innerHTML = '';

    GAME_LIST.forEach((g, idx) => {
      const best = bestScores[g.id];
      const cfg = GAME_CONFIG[g.id] || { nameEn: g.name };
      const div = document.createElement('div');
      div.className = 'game-card anim-fadeIn';
      div.style.animationDelay = `${idx * 0.06}s`;

      const displayName = cfg.nameEn;
      const scoreText = best ? `Best: ${best.score}${g.id === 'gymnastics' ? ' pairs' : ' pts'}` : 'Not Played';
      const medalDisplay = best && best.medal ? medalEmoji(best.medal) : '';

      div.innerHTML = `
        <div class="game-card-name">${displayName}</div>
        <div class="game-card-best">${scoreText} ${medalDisplay}</div>
      `;
      div.addEventListener('click', () => startGameWithBGMStop(g.id), { signal });
      grid.appendChild(div);
    });
  });

  // Multiplayer buttons
  const mpDiv = $('hub-multiplayer');
  if (mpDiv) {
    mpDiv.innerHTML = `
      <button class="btn-gold" id="hub-btn-create-room" style="flex:1;">Create Room</button>
      <button class="btn-primary" id="hub-btn-join-room" style="flex:1;">Join Room</button>
    `;
    $('hub-btn-create-room').addEventListener('click', () => { SoundSystem.stopBGM(); cleanupHub3D(); showRoom(); }, { signal });
    $('hub-btn-join-room').addEventListener('click', () => { SoundSystem.stopBGM(); cleanupHub3D(); showRoomJoin(); }, { signal });
  }

  $('hub-btn-leaderboard').addEventListener('click', () => { SoundSystem.stopBGM(); cleanupHub3D(); showLeaderboard(); }, { signal });
  $('hub-btn-profile').addEventListener('click', () => { SoundSystem.stopBGM(); cleanupHub3D(); showProfile(); }, { signal });
  $('hub-btn-study').addEventListener('click', () => { SoundSystem.stopBGM(); cleanupHub3D(); showStudy(); }, { signal });
  $('hub-btn-logout').addEventListener('click', async () => {
    SoundSystem.stopBGM();
    cleanupHub3D();
    await Store.logout();
    showAuth();
  }, { signal });
}
