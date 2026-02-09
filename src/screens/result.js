import * as THREE from 'three';
import { Router } from '../systems/router.js';
import { SoundSystem } from '../systems/sound.js';
import { $, medalEmoji, spawnConfetti } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import {
  createScene3D, createCamera3D, createRenderer3D,
  createPetals, updatePetals,
  createLanterns, updateLanterns,
  createTextSprite, createVoxelPanel,
  PALETTE, SceneAnimator,
} from '../systems/ui3d.js';

let resultAnimator = null;

function cleanupResult3D() {
  if (resultAnimator) {
    resultAnimator.dispose();
    resultAnimator = null;
  }
}

function initResult3DBackground(medal) {
  const canvas = document.getElementById('result3d');
  if (!canvas) return;
  cleanupResult3D();

  const { scene, stars } = createScene3D({
    fogDensity: 0.02,
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

  // Lanterns
  const lanterns = createLanterns(scene, [
    [-4, 4, 2], [4, 4, 2],
  ]);

  // Petals (more for medal wins)
  const petals = createPetals(scene, medal ? 50 : 20);

  // Medal-specific decorations
  const decorGroup = new THREE.Group();

  if (medal) {
    // Trophy podium
    const podiumColor = medal === 'gold' ? 0xFFD700 : medal === 'silver' ? 0xC0C0C0 : 0xCD7F32;
    const podium = voxBox(2.5, 2, 1.5, podiumColor);
    podium.position.set(0, 1, -2);
    decorGroup.add(podium);

    // Trophy on podium
    const trophy = voxBox(1, 1.2, 0.4, podiumColor);
    trophy.position.set(0, 2.8, -2);
    decorGroup.add(trophy);

    // Trophy glow
    const trophyGlow = new THREE.PointLight(podiumColor, 1.5, 8);
    trophyGlow.position.set(0, 3.5, -1);
    decorGroup.add(trophyGlow);
    decorGroup.userData.trophyGlow = trophyGlow;
    decorGroup.userData.trophy = trophy;

    // Celebration particles (voxel confetti)
    const confettiColors = [0xFFD700, 0xEE334E, 0x0081C8, 0x00A651, 0xFCB131];
    const confettiPieces = [];
    for (let i = 0; i < 15; i++) {
      const piece = voxBox(0.15, 0.15, 0.15, confettiColors[i % confettiColors.length]);
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 3;
      piece.position.set(Math.cos(angle) * r, 3 + Math.random() * 4, Math.sin(angle) * r - 2);
      decorGroup.add(piece);
      confettiPieces.push({
        mesh: piece,
        baseY: piece.position.y,
        angle,
        radius: r,
        speed: 0.5 + Math.random(),
        rotSpeed: (Math.random() - 0.5) * 3,
      });
    }
    decorGroup.userData.confetti = confettiPieces;
  } else {
    // Encouragement -- simple structure
    const base = voxBox(3, 0.3, 2, 0x333344);
    base.position.set(0, 0.15, -2);
    decorGroup.add(base);
  }

  scene.add(decorGroup);

  // Animation
  resultAnimator = new SceneAnimator(renderer, scene, camera, 'screen-result');

  resultAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.05) * 1.2;
    camera.position.y = 5 + Math.sin(t * 0.08) * 0.2;
    camera.lookAt(0, 3, -1);

    updatePetals(petals, t);
    updateLanterns(lanterns, t);

    // Medal-specific animations
    if (decorGroup.userData.trophyGlow) {
      decorGroup.userData.trophyGlow.intensity = 1.0 + Math.sin(t * 2.5) * 0.5;
    }
    if (decorGroup.userData.trophy) {
      decorGroup.userData.trophy.position.y = 2.8 + Math.sin(t * 1.2) * 0.1;
      decorGroup.userData.trophy.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
    if (decorGroup.userData.confetti) {
      decorGroup.userData.confetti.forEach(c => {
        c.mesh.position.y = c.baseY + Math.sin(t * c.speed + c.angle) * 0.5;
        c.mesh.rotation.x += c.rotSpeed * 0.016;
        c.mesh.rotation.z += c.rotSpeed * 0.5 * 0.016;
      });
    }
  });

  resultAnimator.start();
}

export function showResult(gameId, gameName, score, total, medal, detail, deps) {
  const { startGame, startDaily, showHub, showLeaderboard } = deps;
  const signal = Router.navigate('screen-result');

  // Initialize 3D background
  setTimeout(() => initResult3DBackground(medal), 50);

  const content = $('result-content');
  const medalText = medal === 'gold' ? '\u{AE08}\u{BA54}\u{B2EC}' : medal === 'silver' ? '\u{C740}\u{BA54}\u{B2EC}' : medal === 'bronze' ? '\u{B3D9}\u{BA54}\u{B2EC}' : '';
  const emoji = medal ? medalEmoji(medal) : '\u{1F60A}';
  if (medal) setTimeout(() => { SoundSystem.playSound('medal'); spawnConfetti(); }, 300);
  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;">
      <div class="result-medal">${emoji}</div>
      <div class="result-title">${gameName} ${medal ? '' : '\u{B3C4}\u{C804}'} \u{ACBD}\u{ACFC}</div>
      ${medal ? `<div style="font-size:1.2rem;font-weight:700;color:${medal === 'gold' ? 'var(--gold)' : medal === 'silver' ? 'var(--silver)' : 'var(--bronze)'}">${medalText} \u{D68D}\u{B4DD}!</div>` : ''}
      <div class="result-score">${gameId === 'gymnastics' ? score + '\u{D68C}' : gameId === 'marathon' ? score + '%' : score + '\u{C810}'}</div>
      <div class="result-detail">${detail}</div>
      <div class="result-buttons">
        <button class="btn-primary full-width" id="res-retry">\u{B2E4}\u{C2DC} \u{B3C4}\u{C804}</button>
        <button class="btn-secondary full-width" id="res-hub">\u{C885}\u{BAA9} \u{C120}\u{D0DD}</button>
        <button class="btn-outline full-width" id="res-lb">\u{B9AC}\u{B354}\u{BCF4}\u{B4DC}</button>
      </div>
    </div>
  `;
  $('res-retry').addEventListener('click', () => {
    cleanupResult3D();
    if (gameId === 'daily') startDaily(); else startGame(gameId);
  }, { signal });
  $('res-hub').addEventListener('click', () => { cleanupResult3D(); showHub(); }, { signal });
  $('res-lb').addEventListener('click', () => { cleanupResult3D(); showLeaderboard(); }, { signal });
}
