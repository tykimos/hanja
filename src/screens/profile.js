import * as THREE from 'three';
import { ALL_HANJA, GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';
import { voxBox } from '../engine/helpers.js';
import {
  createScene3D, createCamera3D, createRenderer3D,
  createPetals, updatePetals,
  createLanterns, updateLanterns,
  createTextSprite, createVoxelPanel,
  createCherryTree,
  PALETTE, SceneAnimator,
} from '../systems/ui3d.js';

let profileAnimator = null;

function cleanupProfile3D() {
  if (profileAnimator) {
    profileAnimator.dispose();
    profileAnimator = null;
  }
}

function initProfile3DBackground(profile, bestScores, streak) {
  const canvas = document.getElementById('profile3d');
  if (!canvas) return;
  cleanupProfile3D();

  const { scene, stars } = createScene3D({
    fogDensity: 0.018,
    withGround: true,
    withStars: true,
    withMountains: true,
    withPillars: false,
  });

  const camera = createCamera3D({ fov: 50 });
  camera.position.set(0, 5, 12);
  camera.lookAt(0, 3, 0);

  const renderer = createRenderer3D(canvas, { alpha: true });
  renderer.setClearColor(0x000000, 0);

  // Cherry blossom trees
  [[-7, -4], [7, -3], [-6, 5]].forEach(([tx, tz]) => {
    scene.add(createCherryTree(tx, tz, 0.7));
  });

  // Lanterns
  const lanterns = createLanterns(scene, [
    [-3, 5, 2], [3, 5, 2], [0, 7, -4],
  ]);

  // Petals
  const petals = createPetals(scene, 25);

  // Profile card - floating voxel structure
  const profileGroup = new THREE.Group();

  // Main card background
  const cardBg = createVoxelPanel(5, 6, 0.25, 0x151535, { opacity: 0.9 });
  profileGroup.add(cardBg);

  // Avatar block
  const avatarBlock = voxBox(1.5, 1.5, 0.4, PALETTE.accentBlue);
  avatarBlock.position.set(0, 1.8, 0.15);
  profileGroup.add(avatarBlock);

  // Avatar icon sprite
  const avatarSprite = createTextSprite(profile.icon || '?', {
    fontSize: 80, canvasW: 128, canvasH: 128, scale: 1.2,
  });
  avatarSprite.position.set(0, 1.8, 0.45);
  profileGroup.add(avatarSprite);

  // Username sprite
  const nameSprite = createTextSprite(profile.username || 'Player', {
    fontSize: 48, color: '#ffffff', canvasW: 384, canvasH: 72, scale: 2.0,
    fontWeight: '800',
  });
  nameSprite.position.set(0, 0.5, 0.3);
  profileGroup.add(nameSprite);

  // Grade sprite
  const gradeSprite = createTextSprite(Store.getGrade() || '8\u{AE09}', {
    fontSize: 36, color: '#FFD700', canvasW: 192, canvasH: 56, scale: 1.2,
    fontWeight: '700',
  });
  gradeSprite.position.set(0, -0.1, 0.3);
  profileGroup.add(gradeSprite);

  // Medal blocks
  let gold = 0, silver = 0, bronze = 0;
  Object.values(bestScores).forEach(s => {
    if (s && s.medal === 'gold') gold++;
    else if (s && s.medal === 'silver') silver++;
    else if (s && s.medal === 'bronze') bronze++;
  });

  const medalData = [
    { count: gold, color: 0xFFD700, label: 'GOLD', x: -1.5 },
    { count: silver, color: 0xC0C0C0, label: 'SILVER', x: 0 },
    { count: bronze, color: 0xCD7F32, label: 'BRONZE', x: 1.5 },
  ];

  medalData.forEach(m => {
    const block = voxBox(1.0, 0.8, 0.3, m.color);
    block.position.set(m.x, -1.2, 0.15);
    profileGroup.add(block);

    const countSprite = createTextSprite(String(m.count), {
      fontSize: 56, color: '#111111', canvasW: 96, canvasH: 96, scale: 0.6,
      fontWeight: '900',
    });
    countSprite.position.set(m.x, -1.2, 0.4);
    profileGroup.add(countSprite);

    const labelSprite = createTextSprite(m.label, {
      fontSize: 22, color: '#aaaaaa', canvasW: 128, canvasH: 32, scale: 0.6,
      fontWeight: '600',
    });
    labelSprite.position.set(m.x, -1.8, 0.3);
    profileGroup.add(labelSprite);
  });

  // Streak display
  if (streak) {
    const streakBlock = voxBox(3, 0.6, 0.2, 0x4a0080);
    streakBlock.position.set(0, -2.5, 0.1);
    profileGroup.add(streakBlock);

    const streakSprite = createTextSprite(`${streak} Day Streak`, {
      fontSize: 30, color: '#FFD700', canvasW: 256, canvasH: 48, scale: 1.5,
      fontWeight: '700',
    });
    streakSprite.position.set(0, -2.5, 0.3);
    profileGroup.add(streakSprite);
  }

  profileGroup.position.set(0, 4, -2);
  scene.add(profileGroup);

  // Trophy pedestal (decorative)
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
  trophy.position.set(4, 0, 2);
  scene.add(trophy);

  // Animation
  profileAnimator = new SceneAnimator(renderer, scene, camera, 'screen-profile');

  profileAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    // Camera gentle orbit
    camera.position.x = Math.sin(t * 0.04) * 1.2;
    camera.position.y = 5 + Math.sin(t * 0.07) * 0.25;
    camera.lookAt(0, 3, -1);

    updatePetals(petals, t);
    updateLanterns(lanterns, t);

    // Profile card float
    profileGroup.position.y = 4 + Math.sin(t * 0.8) * 0.1;
    profileGroup.rotation.y = Math.sin(t * 0.3) * 0.05;

    // Trophy glow pulse
    trophyGlow.intensity = 0.4 + Math.sin(t * 2) * 0.3;
    trophyCup.position.y = 0.7 + Math.sin(t * 1.5) * 0.05;
  });

  profileAnimator.start();
}

export function showProfile(showHubFn, showAuthFn, showGradeSelectFn) {
  const signal = Router.navigate('screen-profile');
  $('profile-back').addEventListener('click', () => { cleanupProfile3D(); showHubFn(); }, { signal });
  const profile = Store.getProfile();
  if (!profile) { showAuthFn(); return; }

  // Render sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = renderSidebar();
    updateSidebarData();
  }

  const content = $('profile-content');

  // Load data async
  Promise.all([
    Store.getBestScores(),
    Store.getDailyStreak(),
  ]).then(([bestScores, streak]) => {
    // Init 3D background with data
    setTimeout(() => initProfile3DBackground(profile, bestScores, streak), 50);

    const bestHtml = [...GAME_LIST, { id: 'daily', name: '\u{C77C}\u{C77C} \u{B3C4}\u{C804}', icon: '\u{1F4C5}' }].map(g => {
      const b = bestScores[g.id];
      return `<div class="profile-game-row">
        <span>${g.icon} ${g.name}</span>
        <span>${b ? `${b.medal ? medalEmoji(b.medal) : ''} ${b.score}${g.id === 'gymnastics' ? '\u{D68C}' : g.id === 'marathon' ? '%' : '\u{C810}'}` : '\u{BBF8}\u{B3C4}\u{C804}'}</span>
      </div>`;
    }).join('');

    const currentGrade = Store.getGrade();

    content.innerHTML = `
      <div class="profile-header">
        <div class="profile-icon">${profile.icon}</div>
        <div class="profile-name">${profile.username}</div>
        <div style="margin-top:8px;font-size:0.9rem;color:rgba(255,255,255,0.6);">\u{D604}\u{C7AC} \u{B4F1}\u{AE09}: ${currentGrade}</div>
      </div>
      ${streak ? `<div style="text-align:center;color:var(--blue);font-weight:600;margin-bottom:8px;">\u{C77C}\u{C77C} \u{B3C4}\u{C804} \u{C5F0}\u{C18D} ${streak}\u{C77C}</div>` : ''}
      <div class="profile-section" style="margin-top:16px;">
        <div class="profile-section-title">\u{C885}\u{BAA9}\u{BCC4} \u{CD5C}\u{ACE0} \u{AE30}\u{B85D}</div>
        ${bestHtml}
      </div>
      <button class="btn-outline full-width" style="margin-top:12px;" id="profile-stats">\u{1F4CA} \u{B0B4} \u{D1B5}\u{ACC4} \u{BCF4}\u{AE30}</button>
      <button class="btn-outline full-width" style="margin-top:12px;" id="profile-change-grade">\u{B4F1}\u{AE09} \u{BCC0}\u{ACBD}</button>
      <button class="btn-red full-width" style="margin-top:12px;" id="profile-logout">\u{B85C}\u{ADF8}\u{C544}\u{C6C3}</button>
    `;

    $('profile-stats').addEventListener('click', () => {
      cleanupProfile3D();
      if (window._showStatistics) {
        window._showStatistics();
      }
    }, { signal });

    $('profile-change-grade').addEventListener('click', () => {
      cleanupProfile3D();
      if (showGradeSelectFn) {
        showGradeSelectFn();
      }
    }, { signal });

    $('profile-logout').addEventListener('click', async () => {
      cleanupProfile3D();
      await Store.logout();
      showAuthFn();
    }, { signal });
  });
}
