import * as THREE from 'three';
import { GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import {
  createOlympicScene, createOlympicCamera, createOlympicRenderer,
  createRingShimmer, animateRingShimmer,
  OlympicAnimator,
} from '../systems/olympic-env.js';
import { RaycastUI } from '../systems/raycast.js';
import {
  create3DTitleBanner, create3DBackButton, create3DButton,
  create3DPanel, createText, create3DMedal,
} from '../systems/voxel-ui.js';

let profileAnimator = null;
let profileRaycast = null;

function cleanupProfile3D() {
  if (profileRaycast) { profileRaycast.dispose(); profileRaycast = null; }
  if (profileAnimator) { profileAnimator.dispose(); profileAnimator = null; }
}

export function showProfile(showHubFn, showAuthFn, showGradeSelectFn) {
  const signal = Router.navigate('screen-profile');
  const profile = Store.getProfile();
  if (!profile) { showAuthFn(); return; }

  // Hide HTML overlay
  const overlay = document.querySelector('#screen-profile .screen-3d-overlay');
  if (overlay) overlay.style.display = 'none';

  const canvas = document.getElementById('profile3d');
  if (!canvas) return;
  cleanupProfile3D();

  const { scene, stars, rings } = createOlympicScene({
    fogDensity: 0.015,
    withRings: true,
    withTorch: false,
    withGround: true,
    withStars: true,
  });

  const camera = createOlympicCamera({ fov: 50, position: [0, 6, 14] });
  camera.lookAt(0, 3, 0);
  const renderer = createOlympicRenderer(canvas);
  profileRaycast = new RaycastUI(camera, scene, canvas);

  // Shimmer
  const shimmer = createRingShimmer({ position: [0, 9.5, -7.5], count: 10 });
  scene.add(shimmer);

  // Title
  scene.add(create3DTitleBanner('PROFILE', { position: [0, 8, -6], width: 7 }));

  // Back button
  const backBtn = create3DBackButton({ position: [-7, 7, 2] });
  scene.add(backBtn);
  profileRaycast.addClickable(backBtn, () => { cleanupProfile3D(); showHubFn(); });

  // Load data and build 3D UI
  Promise.all([
    Store.getBestScores(),
    Store.getDailyStreak(),
  ]).then(([bestScores, streak]) => {
    // --- Profile Card (3D floating) ---
    const cardGroup = new THREE.Group();

    // Card background
    const cardBg = create3DPanel({
      width: 6, height: 7, depth: 0.2,
      color: 0x111128, opacity: 0.9,
      border: true, borderColor: 0x222255,
    });
    cardGroup.add(cardBg);

    // Avatar block
    const avatarBlock = voxBox(1.8, 1.8, 0.4, 0x0081C8);
    avatarBlock.position.set(0, 2.2, 0.12);
    cardGroup.add(avatarBlock);

    // Avatar icon
    const avatarIcon = createText(profile.icon || '?', {
      fontSize: 80, canvasW: 128, canvasH: 128, scaleX: 1.4, scaleY: 1.4,
    });
    avatarIcon.position.set(0, 2.2, 0.4);
    cardGroup.add(avatarIcon);

    // Username
    const nameLabel = createText(profile.username || 'Player', {
      fontSize: 44, color: '#ffffff',
      canvasW: 384, canvasH: 64, scaleX: 2.8, scaleY: 0.45,
      fontWeight: '800',
    });
    nameLabel.position.set(0, 0.9, 0.2);
    cardGroup.add(nameLabel);

    // Grade
    const gradeLabel = createText(Store.getGrade() || '8\u{AE09}', {
      fontSize: 32, color: '#FFD700',
      canvasW: 192, canvasH: 48, scaleX: 1.5, scaleY: 0.35,
      fontWeight: '700',
    });
    gradeLabel.position.set(0, 0.4, 0.2);
    cardGroup.add(gradeLabel);

    // Medal counts
    let gold = 0, silver = 0, bronze = 0;
    Object.values(bestScores).forEach(s => {
      if (s && s.medal === 'gold') gold++;
      else if (s && s.medal === 'silver') silver++;
      else if (s && s.medal === 'bronze') bronze++;
    });

    const medalData = [
      { count: gold, color: 0xFFD700, label: 'GOLD', x: -1.8 },
      { count: silver, color: 0xC0C0C0, label: 'SILVER', x: 0 },
      { count: bronze, color: 0xCD7F32, label: 'BRONZE', x: 1.8 },
    ];

    medalData.forEach(m => {
      const block = voxBox(1.2, 0.9, 0.3, m.color);
      block.position.set(m.x, -0.5, 0.12);
      cardGroup.add(block);

      const countText = createText(String(m.count), {
        fontSize: 56, color: '#111111',
        canvasW: 96, canvasH: 96, scaleX: 0.6, scaleY: 0.6,
        fontWeight: '900',
      });
      countText.position.set(m.x, -0.5, 0.35);
      cardGroup.add(countText);

      const labelText = createText(m.label, {
        fontSize: 20, color: '#aaaaaa',
        canvasW: 128, canvasH: 32, scaleX: 0.8, scaleY: 0.2,
        fontWeight: '600',
      });
      labelText.position.set(m.x, -1.15, 0.2);
      cardGroup.add(labelText);
    });

    // Streak
    if (streak) {
      const streakBg = voxBox(3.5, 0.5, 0.15, 0x2a0055);
      streakBg.position.set(0, -1.8, 0.1);
      cardGroup.add(streakBg);

      const streakText = createText(`${streak} Day Streak`, {
        fontSize: 28, color: '#FFD700',
        canvasW: 256, canvasH: 48, scaleX: 2, scaleY: 0.35,
        fontWeight: '700',
      });
      streakText.position.set(0, -1.8, 0.25);
      cardGroup.add(streakText);
    }

    cardGroup.position.set(-2, 4, 0);
    scene.add(cardGroup);

    // --- Action Buttons (right side) ---
    const btnStats = create3DButton('Statistics', {
      width: 3, height: 0.6, depth: 0.25, color: 0x0081C8,
      position: [4, 4.5, 2], glowColor: 0x0081C8,
    });
    scene.add(btnStats);
    profileRaycast.addClickable(btnStats, () => {
      cleanupProfile3D();
      if (window._showStatistics) window._showStatistics();
    });

    const btnGrade = create3DButton('Change Grade', {
      width: 3, height: 0.6, depth: 0.25, color: 0xFCB131,
      position: [4, 3.5, 2], glowColor: 0xFCB131,
    });
    scene.add(btnGrade);
    profileRaycast.addClickable(btnGrade, () => {
      cleanupProfile3D();
      if (showGradeSelectFn) showGradeSelectFn();
    });

    const btnLogout = create3DButton('Logout', {
      width: 3, height: 0.6, depth: 0.25, color: 0x882222,
      position: [4, 2.5, 2],
    });
    scene.add(btnLogout);
    profileRaycast.addClickable(btnLogout, async () => {
      cleanupProfile3D();
      await Store.logout();
      showAuthFn();
    });

    // --- Game Records (right column) ---
    const gameList = [...GAME_LIST, { id: 'daily', name: 'Daily', icon: '\u{1F4C5}' }];
    gameList.forEach((g, i) => {
      const b = bestScores[g.id];
      const scoreStr = b
        ? `${b.medal ? medalEmoji(b.medal) + ' ' : ''}${b.score}${g.id === 'gymnastics' ? ' p' : g.id === 'marathon' ? '%' : ' pt'}`
        : '--';

      const row = createText(`${g.icon} ${g.name}: ${scoreStr}`, {
        fontSize: 24, color: b ? '#ccccff' : '#666688',
        canvasW: 384, canvasH: 40, scaleX: 3, scaleY: 0.3,
        fontWeight: '600',
      });
      row.position.set(4, 1.2 - i * 0.4, 2);
      scene.add(row);
    });

    // Trophy (decorative)
    const trophy = new THREE.Group();
    const trophyBase = voxBox(1, 0.3, 1, 0x333344);
    trophyBase.position.y = 0.15;
    trophy.add(trophyBase);
    const trophyCup = voxBox(0.6, 0.8, 0.3, 0xFFD700);
    trophyCup.position.y = 0.7;
    trophy.add(trophyCup);
    const trophyGlow = new THREE.PointLight(0xFFD700, 0.6, 4);
    trophyGlow.position.y = 1;
    trophy.add(trophyGlow);
    trophy.position.set(6, 0, -2);
    scene.add(trophy);

    // Animation updates for profile-specific elements
    profileAnimator.addUpdate((t) => {
      // Card float
      cardGroup.position.y = 4 + Math.sin(t * 0.7) * 0.1;
      cardGroup.rotation.y = Math.sin(t * 0.25) * 0.04;

      // Trophy
      trophyGlow.intensity = 0.4 + Math.sin(t * 2) * 0.3;
      trophyCup.position.y = 0.7 + Math.sin(t * 1.5) * 0.05;
    });
  });

  // Animation
  profileAnimator = new OlympicAnimator(renderer, scene, camera, 'screen-profile');

  profileAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.04) * 1;
    camera.position.y = 6 + Math.sin(t * 0.07) * 0.2;
    camera.lookAt(0, 3, 0);

    animateRingShimmer(shimmer, t);
    if (rings) rings.rotation.y = Math.sin(t * 0.1) * 0.05;
  });

  profileAnimator.start();
}
