import * as THREE from 'three';
import { Router } from '../systems/router.js';
import { SoundSystem } from '../systems/sound.js';
import { $ } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import {
  createOlympicScene, createOlympicCamera, createOlympicRenderer,
  createRingShimmer, animateRingShimmer,
  OlympicAnimator, OLYMPIC_COLORS,
} from '../systems/olympic-env.js';
import { RaycastUI } from '../systems/raycast.js';
import {
  create3DTitleBanner, create3DButton, create3DPodium,
  createText, create3DPanel, create3DMedal,
} from '../systems/voxel-ui.js';

let resultAnimator = null;
let resultRaycast = null;

function cleanupResult3D() {
  if (resultRaycast) { resultRaycast.dispose(); resultRaycast = null; }
  if (resultAnimator) { resultAnimator.dispose(); resultAnimator = null; }
}

export function showResult(gameId, gameName, score, total, medal, detail, deps) {
  const { startGame, startDaily, showHub, showLeaderboard } = deps;
  const signal = Router.navigate('screen-result');

  // Hide HTML overlay
  const content = $('result-content');
  if (content) content.style.display = 'none';

  const canvas = document.getElementById('result3d');
  if (!canvas) return;
  cleanupResult3D();

  const { scene, stars, rings } = createOlympicScene({
    fogDensity: 0.018,
    withRings: true,
    withTorch: false,
    withGround: true,
    withStars: true,
  });

  const camera = createOlympicCamera({ fov: 50, position: [0, 5, 14] });
  camera.lookAt(0, 3, 0);
  const renderer = createOlympicRenderer(canvas);
  resultRaycast = new RaycastUI(camera, scene, canvas);

  // Create animator first so medal code can add updates
  resultAnimator = new OlympicAnimator(renderer, scene, camera, 'screen-result');

  // Shimmer
  const shimmer = createRingShimmer({ position: [0, 9.5, -7.5], count: 10 });
  scene.add(shimmer);

  // Medal-specific decorations
  const medalText = medal === 'gold' ? 'GOLD MEDAL' : medal === 'silver' ? 'SILVER MEDAL' : medal === 'bronze' ? 'BRONZE MEDAL' : 'RESULT';
  const titleColor = medal === 'gold' ? '#FFD700' : medal === 'silver' ? '#C0C0C0' : medal === 'bronze' ? '#CD7F32' : '#ffffff';

  // Title
  scene.add(create3DTitleBanner(medalText, {
    position: [0, 8, -6], width: 8, color: titleColor,
  }));

  // Game name
  const gameNameLabel = createText(gameName, {
    fontSize: 36, color: '#8888bb',
    canvasW: 384, canvasH: 64, scaleX: 3, scaleY: 0.5,
  });
  gameNameLabel.position.set(0, 6.8, -4);
  scene.add(gameNameLabel);

  if (medal) {
    // Podium
    const podium = create3DPodium({ position: [0, 0, -3], scale: 0.8 });
    scene.add(podium);

    // Medal display (floating above podium)
    const medalDisc = create3DMedal(medal, { size: 1.5, position: [0, 5, -1] });
    scene.add(medalDisc);

    // Celebration confetti (voxel particles)
    const confettiColors = [0xFFD700, 0xEE334E, 0x0081C8, 0x00A651, 0xFCB131];
    const confetti = [];
    for (let i = 0; i < 20; i++) {
      const piece = voxBox(0.12, 0.12, 0.12, confettiColors[i % confettiColors.length]);
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 4;
      piece.position.set(Math.cos(angle) * r, 3 + Math.random() * 5, Math.sin(angle) * r - 2);
      scene.add(piece);
      confetti.push({
        mesh: piece, baseY: piece.position.y,
        angle, radius: r,
        speed: 0.5 + Math.random(),
        rotSpeed: (Math.random() - 0.5) * 3,
      });
    }

    // Play medal sound
    setTimeout(() => { SoundSystem.playSound('medal'); }, 300);

    // Add medal-specific animation
    resultAnimator.addUpdate((t) => {
      // Medal float and rotate
      medalDisc.position.y = 5 + Math.sin(t * 1.2) * 0.2;
      medalDisc.rotation.y = t * 0.5;
      if (medalDisc.userData._glow) {
        medalDisc.userData._glow.intensity = 0.6 + Math.sin(t * 2.5) * 0.4;
      }

      // Podium crown
      if (podium.userData._crownGlow) {
        podium.userData._crownGlow.intensity = 0.6 + Math.sin(t * 2.5) * 0.4;
      }

      // Confetti
      confetti.forEach(c => {
        c.mesh.position.y = c.baseY + Math.sin(t * c.speed + c.angle) * 0.5;
        c.mesh.rotation.x += c.rotSpeed * 0.016;
        c.mesh.rotation.z += c.rotSpeed * 0.5 * 0.016;
      });
    });
  } else {
    // No medal -- encouragement
    const encourage = createText('Keep trying!', {
      fontSize: 48, color: '#ffffff',
      canvasW: 384, canvasH: 96, scaleX: 3, scaleY: 0.7,
      fontWeight: '800',
    });
    encourage.position.set(0, 5, 0);
    scene.add(encourage);
  }

  // Score display (large, center)
  const scoreStr = gameId === 'gymnastics' ? `${score} pairs` : gameId === 'marathon' ? `${score}%` : `${score} pts`;
  const scoreLabel = createText(scoreStr, {
    fontSize: 64, color: '#ffffff',
    canvasW: 384, canvasH: 96, scaleX: 3.5, scaleY: 0.8,
    fontWeight: '900',
    outlineColor: 'rgba(0,0,0,0.6)', outlineWidth: 4,
  });
  scoreLabel.position.set(0, 3.8, 3);
  scene.add(scoreLabel);

  // Detail text
  const detailLabel = createText(detail, {
    fontSize: 28, color: '#aaaacc',
    canvasW: 384, canvasH: 48, scaleX: 3, scaleY: 0.4,
  });
  detailLabel.position.set(0, 3, 3);
  scene.add(detailLabel);

  // --- Action Buttons ---
  const btnRetry = create3DButton('Retry', {
    width: 3, height: 0.7, depth: 0.3, color: 0x0081C8,
    position: [-3, 1.5, 5], glowColor: 0x0081C8,
  });
  scene.add(btnRetry);
  resultRaycast.addClickable(btnRetry, () => {
    cleanupResult3D();
    if (gameId === 'daily') startDaily(); else startGame(gameId);
  });

  const btnHub = create3DButton('Games', {
    width: 3, height: 0.7, depth: 0.3, color: 0x00A651,
    position: [0, 1.5, 5], glowColor: 0x00A651,
  });
  scene.add(btnHub);
  resultRaycast.addClickable(btnHub, () => { cleanupResult3D(); showHub(); });

  const btnLB = create3DButton('Ranking', {
    width: 3, height: 0.7, depth: 0.3, color: 0xFCB131,
    position: [3, 1.5, 5], glowColor: 0xFCB131,
  });
  scene.add(btnLB);
  resultRaycast.addClickable(btnLB, () => { cleanupResult3D(); showLeaderboard(); });

  // --- Base Animation ---
  resultAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.05) * 1.2;
    camera.position.y = 5 + Math.sin(t * 0.08) * 0.2;
    camera.lookAt(0, 3, 0);

    animateRingShimmer(shimmer, t);
    if (rings) rings.rotation.y = Math.sin(t * 0.1) * 0.05;
  });

  resultAnimator.start();
}
