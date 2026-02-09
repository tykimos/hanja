import * as THREE from 'three';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';
import { voxBox } from '../engine/helpers.js';
import {
  createScene3D, createCamera3D, createRenderer3D,
  createPetals, updatePetals,
  createLanterns, updateLanterns,
  createRingParticles, updateRingParticles,
  createTextSprite, createVoxelPanel,
  PALETTE, SceneAnimator, RING_COLORS,
} from '../systems/ui3d.js';

let lbAnimator = null;

function cleanupLB3D() {
  if (lbAnimator) {
    lbAnimator.dispose();
    lbAnimator = null;
  }
}

function initLB3DBackground() {
  const canvas = document.getElementById('lb3d');
  if (!canvas) return;
  cleanupLB3D();

  const { scene, stars } = createScene3D({
    fogDensity: 0.015,
    withGround: true,
    withStars: true,
    withMountains: true,
    withPillars: true,
  });

  const camera = createCamera3D({ fov: 50 });
  camera.position.set(0, 5, 14);
  camera.lookAt(0, 3, 0);

  const renderer = createRenderer3D(canvas, { alpha: true });
  renderer.setClearColor(0x000000, 0);

  // Lanterns
  const lanterns = createLanterns(scene, [
    [-4, 5, 2], [4, 5, 2], [0, 7, -4],
  ]);

  // Petals
  const petals = createPetals(scene, 20);

  // Ring particles
  const ringParticles = createRingParticles(scene, [0, 9, -5]);

  // Podium structure (1st, 2nd, 3rd place)
  const podium = new THREE.Group();

  // 2nd place podium (left)
  const p2 = voxBox(2, 2, 1.5, 0xC0C0C0);
  p2.position.set(-2.5, 1, 0);
  podium.add(p2);
  const p2Label = createTextSprite('2', {
    fontSize: 64, color: '#ffffff', canvasW: 64, canvasH: 64, scale: 0.8,
    fontWeight: '900',
  });
  p2Label.position.set(-2.5, 2.3, 0.8);
  podium.add(p2Label);

  // 1st place podium (center, tallest)
  const p1 = voxBox(2, 3, 1.5, 0xFFD700);
  p1.position.set(0, 1.5, 0);
  podium.add(p1);
  const p1Label = createTextSprite('1', {
    fontSize: 64, color: '#ffffff', canvasW: 64, canvasH: 64, scale: 0.8,
    fontWeight: '900',
  });
  p1Label.position.set(0, 3.3, 0.8);
  podium.add(p1Label);

  // Crown on top of 1st place
  const crown = voxBox(0.8, 0.4, 0.3, 0xFFD700);
  crown.position.set(0, 3.7, 0);
  podium.add(crown);
  const crownGlow = new THREE.PointLight(0xFFD700, 1, 5);
  crownGlow.position.set(0, 4, 0);
  podium.add(crownGlow);

  // 3rd place podium (right)
  const p3 = voxBox(2, 1.5, 1.5, 0xCD7F32);
  p3.position.set(2.5, 0.75, 0);
  podium.add(p3);
  const p3Label = createTextSprite('3', {
    fontSize: 64, color: '#ffffff', canvasW: 64, canvasH: 64, scale: 0.8,
    fontWeight: '900',
  });
  p3Label.position.set(2.5, 1.8, 0.8);
  podium.add(p3Label);

  podium.position.set(0, 0, -3);
  scene.add(podium);

  // Title banner
  const titleBg = createVoxelPanel(8, 1.2, 0.2, 0x111128, { opacity: 0.8 });
  titleBg.position.set(0, 7.5, -6);
  scene.add(titleBg);

  const titleSprite = createTextSprite('LEADERBOARD', {
    fontSize: 48, color: '#FFD700', canvasW: 512, canvasH: 96, scale: 3.5,
    fontWeight: '900',
  });
  titleSprite.position.set(0, 7.5, -5.7);
  scene.add(titleSprite);

  // Animation
  lbAnimator = new SceneAnimator(renderer, scene, camera, 'screen-leaderboard');

  lbAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.04) * 1;
    camera.position.y = 5 + Math.sin(t * 0.06) * 0.2;
    camera.lookAt(0, 3, -1);

    updatePetals(petals, t);
    updateLanterns(lanterns, t);
    updateRingParticles(ringParticles, t);

    // Crown glow pulse
    crownGlow.intensity = 0.6 + Math.sin(t * 2.5) * 0.4;
    crown.position.y = 3.7 + Math.sin(t * 1.5) * 0.08;
    crown.rotation.y = Math.sin(t * 0.5) * 0.1;
  });

  lbAnimator.start();
}

export function showLeaderboard(showHubFn) {
  const signal = Router.navigate('screen-leaderboard');

  // Initialize 3D background
  setTimeout(() => initLB3DBackground(), 50);

  // Render sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = renderSidebar();
    updateSidebarData();
  }

  const tabs = ['\u{C885}\u{D569}', '\u{C591}\u{AD81}', '\u{C218}\u{C601}', '\u{C5ED}\u{B3C4}', '\u{CE74}\u{B4DC} \u{B4A4}\u{C9D1}\u{AE30}', '\u{B9C8}\u{B77C}\u{D1A4}', '\u{BC18}\u{C758}\u{C5B4}', '\u{C0AC}\u{C790}\u{C131}\u{C5B4}', '\u{B3D9}\u{C74C}\u{C774}\u{C758}'];
  const tabIds = ['total', 'archery', 'swimming', 'weightlifting', 'gymnastics', 'marathon', 'antonym', 'idiom', 'homonym'];
  let activeTab = 'total';
  const tabsEl = $('lb-tabs');
  tabsEl.innerHTML = tabs.map((t, i) => `<button class="lb-tab ${i === 0 ? 'active' : ''}" data-tab="${tabIds[i]}">${t}</button>`).join('');
  tabsEl.querySelectorAll('.lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      tabsEl.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLB(activeTab);
    }, { signal });
  });
  $('lb-back').addEventListener('click', () => { cleanupLB3D(); showHubFn(); }, { signal });
  renderLB('total');
}

async function renderLB(tab) {
  const list = $('lb-list');
  list.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">\u{B85C}\u{B529} \u{C911}...</div>';
  const currentUser = Store.getCurrentUser();
  const currentGrade = Store.getGrade();
  const ranked = await Store.getLeaderboard(tab);

  if (!ranked || ranked.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">${currentGrade} \u{AE30}\u{B85D}\u{C774} \u{C5C6}\u{C2B5}\u{B2C8}\u{B2E4}</div>`;
    return;
  }
  list.innerHTML = ranked.map((r, i) => {
    const rank = i + 1;
    const isMe = r.username === currentUser;
    let detail;
    if (tab === 'total') {
      detail = `\u{CD1D} ${r.totalPoints || 0}\u{C810}`;
    } else {
      detail = tab === 'gymnastics' ? `${r.score}\u{D68C}` : tab === 'marathon' ? `${r.score}%` : `${r.score}\u{C810}`;
    }
    return `<div class="lb-item ${isMe ? 'lb-me' : ''} anim-fadeIn" style="animation-delay:${i * 0.05}s">
      <span class="lb-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}">${rank <= 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][rank - 1] : rank}</span>
      <span class="lb-icon">${r.icon}</span>
      <div class="lb-info"><div class="lb-name">${r.username}</div><div class="lb-score">${detail}</div></div>
    </div>`;
  }).join('');
}
