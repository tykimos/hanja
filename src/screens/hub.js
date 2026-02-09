import * as THREE from 'three';
import { GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { SoundSystem } from '../systems/sound.js';
import {
  createOlympicScene, createOlympicCamera, createOlympicRenderer,
  createOlympicTorch, animateTorch,
  createRingShimmer, animateRingShimmer,
  OlympicAnimator,
} from '../systems/olympic-env.js';
import { RaycastUI } from '../systems/raycast.js';
import {
  create3DGameCard, create3DButton, create3DTitleBanner,
  create3DBackButton, createText, create3DPanel,
} from '../systems/voxel-ui.js';

let hubAnimator = null;
let hubRaycast = null;

const GAME_CONFIG = {
  archery:       { color: 0xEE334E, icon: '\u{1F3F9}', nameEn: 'Archery' },
  swimming:      { color: 0x0081C8, icon: '\u{1F3CA}', nameEn: 'Swimming' },
  weightlifting: { color: 0xFCB131, icon: '\u{1F3CB}\u{FE0F}', nameEn: 'Weight' },
  gymnastics:    { color: 0x6C63FF, icon: '\u{1F0CF}', nameEn: 'Memory' },
  marathon:      { color: 0x00A651, icon: '\u{1F3C3}', nameEn: 'Marathon' },
  antonym:       { color: 0xFF6B6B, icon: '\u{1F504}', nameEn: 'Antonym' },
  idiom:         { color: 0xFFD700, icon: '\u{1F4DC}', nameEn: 'Idiom' },
  homonym:       { color: 0x00BCD4, icon: '\u{1F524}', nameEn: 'Homonym' },
};

function cleanupHub3D() {
  if (hubRaycast) { hubRaycast.dispose(); hubRaycast = null; }
  if (hubAnimator) { hubAnimator.dispose(); hubAnimator = null; }
}

export function showHub(deps) {
  const { startGame, startDaily, showLeaderboard, showProfile, showStudy, showAuth, showRoom, showRoomJoin } = deps;
  const signal = Router.navigate('screen-hub');
  const profile = Store.getProfile();
  if (!profile) { showAuth(); return; }

  // Hide HTML overlay elements
  const overlay = document.querySelector('#screen-hub .screen-3d-overlay');
  if (overlay) overlay.style.display = 'none';

  const canvas = document.getElementById('hub3d');
  if (!canvas) return;
  cleanupHub3D();

  const stopBGMAndClean = (fn) => () => {
    SoundSystem.stopBGM();
    cleanupHub3D();
    fn();
  };

  // Build scene
  const { scene, stars, rings, torch } = createOlympicScene({
    fogDensity: 0.01,
    withRings: true,
    withTorch: true,
    withTrack: true,
    withArch: true,
    withGround: true,
    withStars: true,
  });

  const camera = createOlympicCamera({ fov: 50, position: [0, 7, 18] });
  camera.lookAt(0, 2, 0);
  const renderer = createOlympicRenderer(canvas);
  hubRaycast = new RaycastUI(camera, scene, canvas);

  // Ring shimmer
  const shimmer = createRingShimmer({ position: [0, 9.5, -7.5], count: 15 });
  scene.add(shimmer);

  // Title banner
  const title = create3DTitleBanner('OLYMPIC VILLAGE', { position: [0, 8, -6], width: 10 });
  scene.add(title);

  // User info (top-left)
  const userLabel = createText(`${profile.icon} ${profile.username}`, {
    fontSize: 36, color: '#00E5FF',
    canvasW: 384, canvasH: 64, scaleX: 3.5, scaleY: 0.6,
    fontWeight: '700',
  });
  userLabel.position.set(-5.5, 6.5, 5);
  scene.add(userLabel);

  // --- Daily Challenge Card ---
  Store.getDailyChallenge().then(dc => {
    const doneToday = !!dc;
    const statusText = doneToday ? 'Completed' : 'Daily Challenge';
    const dailyColor = doneToday ? 0x334455 : 0x9333EA;

    const dailyBtn = create3DButton(statusText, {
      width: 5, height: 0.7, depth: 0.3,
      color: dailyColor,
      textColor: doneToday ? '#888888' : '#ffffff',
      position: [0, 5.2, 3],
      glowColor: doneToday ? null : 0x9933ff,
    });
    scene.add(dailyBtn);
    hubRaycast.addClickable(dailyBtn, stopBGMAndClean(() => startDaily()));
  });

  // --- 8 Game Cards ---
  const isMobile = window.innerWidth < 768;
  const cardPositions = isMobile ? [
    [-3, 2.2, 4], [-1, 2.2, 4], [1, 2.2, 4], [3, 2.2, 4],
    [-3, -0.3, 4], [-1, -0.3, 4], [1, -0.3, 4], [3, -0.3, 4],
  ] : [
    [-7, 2.5, 2], [-4.5, 2.5, 1], [-2, 2.5, 0.5], [0.5, 2.5, 0.5],
    [3, 2.5, 1], [5.5, 2.5, 2], [-5.5, -0.2, 3], [-3, -0.2, 2.5],
  ];

  const gameCards = [];

  Store.getBestScores().then(bestScores => {
    GAME_LIST.forEach((g, idx) => {
      const cfg = GAME_CONFIG[g.id] || { color: 0x888888, icon: '?', nameEn: g.name };
      const best = bestScores[g.id];
      const pos = cardPositions[idx] || [idx * 3 - 9, 2, 2];

      const bestText = best
        ? `Best: ${best.score}${g.id === 'gymnastics' ? ' pairs' : ' pts'}`
        : null;

      const card = create3DGameCard({
        name: cfg.nameEn,
        icon: cfg.icon,
        color: cfg.color,
        bestScore: bestText,
        medal: best?.medal || null,
        position: pos,
      });
      scene.add(card);
      hubRaycast.addClickable(card, stopBGMAndClean(() => startGame(g.id)));

      gameCards.push({
        group: card,
        bobPhase: Math.random() * Math.PI * 2,
        color: cfg.color,
      });
    });
  });

  // --- Nav Buttons (bottom) ---
  const navY = -2.2;
  const navZ = 6;

  const btnLeaderboard = create3DButton('Leaderboard', {
    width: 3, height: 0.6, depth: 0.25, color: 0x0081C8,
    position: [-4.5, navY, navZ], glowColor: 0x0081C8,
  });
  scene.add(btnLeaderboard);
  hubRaycast.addClickable(btnLeaderboard, stopBGMAndClean(showLeaderboard));

  const btnProfile = create3DButton('Profile', {
    width: 2.5, height: 0.6, depth: 0.25, color: 0x00A651,
    position: [-1.2, navY, navZ], glowColor: 0x00A651,
  });
  scene.add(btnProfile);
  hubRaycast.addClickable(btnProfile, stopBGMAndClean(showProfile));

  const btnStudy = create3DButton('Study', {
    width: 2.2, height: 0.6, depth: 0.25, color: 0xFCB131,
    position: [1.6, navY, navZ], glowColor: 0xFCB131,
  });
  scene.add(btnStudy);
  hubRaycast.addClickable(btnStudy, stopBGMAndClean(showStudy));

  const btnLogout = create3DButton('Logout', {
    width: 2.2, height: 0.6, depth: 0.25, color: 0x882222,
    position: [4.2, navY, navZ],
  });
  scene.add(btnLogout);
  hubRaycast.addClickable(btnLogout, async () => {
    SoundSystem.stopBGM();
    cleanupHub3D();
    await Store.logout();
    showAuth();
  });

  // --- Multiplayer Buttons ---
  const btnCreateRoom = create3DButton('Create Room', {
    width: 2.8, height: 0.55, depth: 0.22, color: 0x9333EA,
    position: [-2, navY - 1, navZ],
  });
  scene.add(btnCreateRoom);
  hubRaycast.addClickable(btnCreateRoom, stopBGMAndClean(showRoom));

  const btnJoinRoom = create3DButton('Join Room', {
    width: 2.8, height: 0.55, depth: 0.22, color: 0x3366cc,
    position: [2, navY - 1, navZ],
  });
  scene.add(btnJoinRoom);
  hubRaycast.addClickable(btnJoinRoom, stopBGMAndClean(showRoomJoin));

  // --- Animation ---
  hubAnimator = new OlympicAnimator(renderer, scene, camera, 'screen-hub');

  hubAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    // Camera gentle sway
    camera.position.x = Math.sin(t * 0.04) * 1.5;
    camera.position.y = 7 + Math.sin(t * 0.06) * 0.3;
    camera.lookAt(0, 2, 0);

    // Torch flame
    if (torch) animateTorch(torch, t);

    // Ring shimmer
    animateRingShimmer(shimmer, t);

    // Rings rotation
    if (rings) {
      rings.rotation.y = Math.sin(t * 0.1) * 0.05;
    }

    // Game cards bob
    gameCards.forEach((gc, i) => {
      const bob = Math.sin(t * 0.8 + gc.bobPhase) * 0.12;
      gc.group.position.y += bob * 0.02;
      if (gc.group.userData._iconBlock) {
        gc.group.userData._iconBlock.rotation.y = Math.sin(t * 0.3 + gc.bobPhase) * 0.1;
      }
      if (gc.group.userData._glow) {
        gc.group.userData._glow.intensity = 0.2 + Math.sin(t * 1.5 + i) * 0.15;
      }
    });
  });

  hubAnimator.start();
}
