import * as THREE from 'three';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import {
  createOlympicScene, createOlympicCamera, createOlympicRenderer,
  createRingShimmer, animateRingShimmer,
  OlympicAnimator,
} from '../systems/olympic-env.js';
import { RaycastUI } from '../systems/raycast.js';
import {
  create3DTitleBanner, create3DGradeCube, create3DButton, createText,
} from '../systems/voxel-ui.js';

const GRADES = [
  '8\u{AE09}', '7\u{AE09}', '6\u{AE09}', '\u{C900}5\u{AE09}', '5\u{AE09}',
  '\u{C900}4\u{AE09}', '4\u{AE09}', '\u{C900}3\u{AE09}', '3\u{AE09}',
  '\u{C900}2\u{AE09}', '2\u{AE09}', '\u{C900}1\u{AE09}', '1\u{AE09}'
];

let gradeAnimator = null;
let gradeRaycast = null;

function cleanupGrade3D() {
  if (gradeRaycast) { gradeRaycast.dispose(); gradeRaycast = null; }
  if (gradeAnimator) { gradeAnimator.dispose(); gradeAnimator = null; }
}

export function showGradeSelect(deps) {
  const { onComplete, showHub } = deps;
  const signal = Router.navigate('screen-grade-select');

  // Hide HTML overlay
  const overlayEl = $('grade-select-content');
  if (overlayEl) overlayEl.style.display = 'none';
  const overlayWrap = document.querySelector('#screen-grade-select .screen-3d-overlay');
  if (overlayWrap) overlayWrap.style.display = 'none';

  const profile = Store.getProfile();
  let selectedGrade = profile?.grade || '8\u{AE09}';

  const canvas = document.getElementById('grade3d');
  if (!canvas) return;
  cleanupGrade3D();

  const { scene, stars, rings } = createOlympicScene({
    fogDensity: 0.012,
    withRings: true,
    withTorch: false,
    withGround: true,
    withStars: true,
    withArch: true,
  });

  const camera = createOlympicCamera({ fov: 50, position: [0, 7, 16] });
  camera.lookAt(0, 3, 0);
  const renderer = createOlympicRenderer(canvas);
  gradeRaycast = new RaycastUI(camera, scene, canvas);

  // Shimmer
  const shimmer = createRingShimmer({ position: [0, 9.5, -7.5], count: 10 });
  scene.add(shimmer);

  // Title
  scene.add(create3DTitleBanner('SELECT YOUR GRADE', { position: [0, 8.5, -6], width: 10, color: '#FFD700' }));

  // Subtitle
  const subtitle = createText('Choose a grade level to study', {
    fontSize: 28, color: '#8888bb',
    canvasW: 512, canvasH: 48, scaleX: 4, scaleY: 0.4,
  });
  subtitle.position.set(0, 7.5, -4);
  scene.add(subtitle);

  // Grade cubes grid
  const cols = 5;
  const spacing = 2.4;
  const gradeCubes = [];
  let confirmBtn = null;

  function buildGradeGrid() {
    // Remove existing cubes
    gradeCubes.forEach(gc => {
      gradeRaycast.removeClickable(gc.group);
      scene.remove(gc.group);
    });
    gradeCubes.length = 0;

    // Remove confirm button
    if (confirmBtn) {
      gradeRaycast.removeClickable(confirmBtn);
      scene.remove(confirmBtn);
    }

    GRADES.forEach((grade, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = (col - (cols - 1) / 2) * spacing;
      const y = 5 - row * spacing;
      const z = 0;

      const cube = create3DGradeCube(grade, {
        selected: grade === selectedGrade,
        size: 1.4,
        position: [x, y, z],
      });
      scene.add(cube);
      gradeCubes.push({
        group: cube,
        grade,
        bobPhase: Math.random() * Math.PI * 2,
      });

      gradeRaycast.addClickable(cube, () => {
        selectedGrade = grade;
        buildGradeGrid();
      });
    });

    // Confirm button
    confirmBtn = create3DButton('Confirm', {
      width: 4, height: 0.8, depth: 0.35,
      color: 0x00A651,
      textColor: '#ffffff',
      fontSize: 44,
      position: [0, -1.5, 2],
      glowColor: 0x00ff66,
    });
    scene.add(confirmBtn);
    gradeRaycast.addClickable(confirmBtn, async () => {
      try {
        await Store.setGrade(selectedGrade);
        cleanupGrade3D();
        if (onComplete) onComplete();
        else showHub();
      } catch (error) {
        console.error('Failed to save grade:', error);
      }
    });
  }

  buildGradeGrid();

  // Animation
  gradeAnimator = new OlympicAnimator(renderer, scene, camera, 'screen-grade-select');

  gradeAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.04) * 0.8;
    camera.position.y = 7 + Math.sin(t * 0.06) * 0.2;
    camera.lookAt(0, 3, 0);

    animateRingShimmer(shimmer, t);
    if (rings) rings.rotation.y = Math.sin(t * 0.1) * 0.05;

    // Grade cubes bob
    gradeCubes.forEach((gc) => {
      const cube = gc.group.children[0]; // The box mesh
      if (cube) {
        cube.position.y = Math.sin(t * 0.8 + gc.bobPhase) * 0.06;
        cube.rotation.y = Math.sin(t * 0.3 + gc.bobPhase) * 0.06;
      }
      if (gc.group.userData._glow) {
        gc.group.userData._glow.intensity = 1.0 + Math.sin(t * 2.5) * 0.5;
      }
    });
  });

  gradeAnimator.start();
}
