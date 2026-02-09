import * as THREE from 'three';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';
import {
  createOlympicScene, createOlympicCamera, createOlympicRenderer,
  createRingShimmer, animateRingShimmer,
  OlympicAnimator,
} from '../systems/olympic-env.js';
import { RaycastUI } from '../systems/raycast.js';
import {
  create3DTitleBanner, create3DBackButton, create3DTab,
  create3DListItem, create3DPodium, createText,
  create3DSpinner, animateSpinner,
} from '../systems/voxel-ui.js';

let lbAnimator = null;
let lbRaycast = null;

function cleanupLB3D() {
  if (lbRaycast) { lbRaycast.dispose(); lbRaycast = null; }
  if (lbAnimator) { lbAnimator.dispose(); lbAnimator = null; }
}

// Store references for dynamic list management
let currentListItems = [];
let currentScene = null;
let currentRaycast = null;
let currentSpinner = null;

function clearListItems() {
  currentListItems.forEach(item => {
    if (currentScene) currentScene.remove(item);
  });
  currentListItems = [];
}

export function showLeaderboard(showHubFn) {
  const signal = Router.navigate('screen-leaderboard');

  // Hide HTML overlay
  const overlay = document.querySelector('#screen-leaderboard .screen-3d-overlay');
  if (overlay) overlay.style.display = 'none';

  const canvas = document.getElementById('lb3d');
  if (!canvas) return;
  cleanupLB3D();

  const { scene, stars, rings } = createOlympicScene({
    fogDensity: 0.012,
    withRings: true,
    withTorch: false,
    withGround: true,
    withStars: true,
  });
  currentScene = scene;

  const camera = createOlympicCamera({ fov: 50, position: [0, 6, 16] });
  camera.lookAt(0, 3, 0);
  const renderer = createOlympicRenderer(canvas);
  lbRaycast = new RaycastUI(camera, scene, canvas);
  currentRaycast = lbRaycast;

  // Ring shimmer
  const shimmer = createRingShimmer({ position: [0, 9.5, -7.5], count: 15 });
  scene.add(shimmer);

  // Title
  scene.add(create3DTitleBanner('LEADERBOARD', { position: [0, 8, -6], width: 9 }));

  // Back button
  const backBtn = create3DBackButton({ position: [-7, 7, 2] });
  scene.add(backBtn);
  lbRaycast.addClickable(backBtn, () => { cleanupLB3D(); showHubFn(); });

  // Podium
  const podium = create3DPodium({ position: [0, 0, -3], scale: 0.7 });
  scene.add(podium);

  // Tabs
  const tabNames = ['Total', 'Archery', 'Swim', 'Weight', 'Memory', 'Marathon', 'Antonym', 'Idiom', 'Homonym'];
  const tabIds = ['total', 'archery', 'swimming', 'weightlifting', 'gymnastics', 'marathon', 'antonym', 'idiom', 'homonym'];
  let activeTabIdx = 0;
  const tabGroups = [];

  const tabStartX = -(tabNames.length - 1) * 1.1 / 2;
  tabNames.forEach((name, i) => {
    const tab = create3DTab(name, {
      active: i === 0,
      width: 1.8,
      height: 0.45,
      position: [tabStartX + i * 1.9, 6, 4],
    });
    scene.add(tab);
    tabGroups.push(tab);
    lbRaycast.addClickable(tab, () => {
      activeTabIdx = i;
      refreshTabs();
      renderLBData(tabIds[i]);
    });
  });

  function refreshTabs() {
    tabGroups.forEach((tg, i) => {
      // Remove old tabs and rebuild them
      lbRaycast.removeClickable(tg);
      scene.remove(tg);
    });
    tabGroups.length = 0;

    tabNames.forEach((name, i) => {
      const tab = create3DTab(name, {
        active: i === activeTabIdx,
        width: 1.8,
        height: 0.45,
        position: [tabStartX + i * 1.9, 6, 4],
      });
      scene.add(tab);
      tabGroups.push(tab);
      lbRaycast.addClickable(tab, () => {
        activeTabIdx = i;
        refreshTabs();
        renderLBData(tabIds[i]);
      });
    });
  }

  // Spinner
  currentSpinner = create3DSpinner({ position: [0, 3, 3] });
  scene.add(currentSpinner);

  // Initial load
  renderLBData('total');

  async function renderLBData(tab) {
    // Show spinner
    if (currentSpinner) currentSpinner.visible = true;
    clearListItems();

    const currentUser = Store.getCurrentUser();
    const ranked = await Store.getLeaderboard(tab);

    // Hide spinner
    if (currentSpinner) currentSpinner.visible = false;

    if (!ranked || ranked.length === 0) {
      const noData = createText('No records yet', {
        fontSize: 36, color: '#888888',
        canvasW: 384, canvasH: 64, scaleX: 3, scaleY: 0.5,
      });
      noData.position.set(0, 3, 4);
      scene.add(noData);
      currentListItems.push(noData);
      return;
    }

    const maxShow = Math.min(ranked.length, 10);
    for (let i = 0; i < maxShow; i++) {
      const r = ranked[i];
      const isMe = r.username === currentUser;

      let detail;
      if (tab === 'total') {
        detail = `${r.totalPoints || 0} pts`;
      } else {
        detail = tab === 'gymnastics' ? `${r.score} pairs` : tab === 'marathon' ? `${r.score}%` : `${r.score} pts`;
      }

      const item = create3DListItem({
        rank: i + 1,
        name: `${r.icon || ''} ${r.username || '?'}`,
        score: detail,
        width: 8,
        height: 0.55,
        position: [0, 4.5 - i * 0.7, 5],
        isMe,
        medalColor: i < 3 ? [0xFFD700, 0xC0C0C0, 0xCD7F32][i] : null,
      });
      scene.add(item);
      currentListItems.push(item);
    }
  }

  // Animation
  lbAnimator = new OlympicAnimator(renderer, scene, camera, 'screen-leaderboard');

  lbAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.04) * 1;
    camera.position.y = 6 + Math.sin(t * 0.06) * 0.2;
    camera.lookAt(0, 3, 0);

    animateRingShimmer(shimmer, t);

    if (rings) rings.rotation.y = Math.sin(t * 0.1) * 0.05;

    // Podium crown
    if (podium.userData._crownGlow) {
      podium.userData._crownGlow.intensity = 0.6 + Math.sin(t * 2.5) * 0.4;
    }
    if (podium.userData._crown) {
      podium.userData._crown.position.y += Math.sin(t * 1.5) * 0.001;
      podium.userData._crown.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    // Spinner
    if (currentSpinner && currentSpinner.visible) {
      animateSpinner(currentSpinner, t);
    }
  });

  lbAnimator.start();
}
