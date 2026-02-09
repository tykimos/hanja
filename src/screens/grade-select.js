import * as THREE from 'three';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $ } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import {
  createScene3D, createCamera3D, createRenderer3D,
  createPetals, updatePetals,
  createLanterns, updateLanterns,
  createTextSprite, createVoxelPanel,
  createToriiGate,
  PALETTE, SceneAnimator,
} from '../systems/ui3d.js';

const GRADES = [
  '8\u{AE09}', '7\u{AE09}', '6\u{AE09}', '\u{C900}5\u{AE09}', '5\u{AE09}', '\u{C900}4\u{AE09}', '4\u{AE09}', '\u{C900}3\u{AE09}', '3\u{AE09}', '\u{C900}2\u{AE09}', '2\u{AE09}', '\u{C900}1\u{AE09}', '1\u{AE09}'
];

let gradeAnimator = null;

function cleanupGrade3D() {
  if (gradeAnimator) {
    gradeAnimator.dispose();
    gradeAnimator = null;
  }
}

function initGrade3DBackground(selectedGrade) {
  const canvas = document.getElementById('grade3d');
  if (!canvas) return;
  cleanupGrade3D();

  const { scene, stars } = createScene3D({
    fogDensity: 0.015,
    withGround: true,
    withStars: true,
    withMountains: true,
    withPillars: false,
  });

  const camera = createCamera3D({ fov: 50 });
  camera.position.set(0, 6, 14);
  camera.lookAt(0, 3, 0);

  const renderer = createRenderer3D(canvas, { alpha: true });
  renderer.setClearColor(0x000000, 0);

  // Torii gate
  scene.add(createToriiGate(0, -6, 1.0));

  // Lanterns
  const lanterns = createLanterns(scene, [
    [-5, 5, 0], [5, 5, 0], [0, 8, -5],
  ]);

  // Petals
  const petals = createPetals(scene, 30);

  // Grade cubes in 3D space
  const gradeCubes = [];
  const positions = [];
  const cols = 5;
  const spacing = 2.2;

  GRADES.forEach((grade, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const y = 5.5 - row * spacing;
    const z = -2;
    positions.push([x, y, z]);

    const group = new THREE.Group();
    const isSelected = grade === selectedGrade;
    const cubeColor = isSelected ? 0xFFD700 : 0x334466;
    const cube = voxBox(1.3, 1.3, 0.5, cubeColor);
    group.add(cube);

    // Grade text
    const textSprite = createTextSprite(grade, {
      fontSize: 42, color: isSelected ? '#111111' : '#ffffff',
      canvasW: 128, canvasH: 128, scale: 1.0,
      fontWeight: '800',
    });
    textSprite.position.z = 0.3;
    group.add(textSprite);

    // Glow for selected
    if (isSelected) {
      const glow = new THREE.PointLight(0xFFD700, 1.5, 5);
      glow.position.z = 1;
      group.add(glow);
      group.userData.glow = glow;
    }

    group.position.set(x, y, z);
    scene.add(group);
    gradeCubes.push({ group, cube, isSelected, bobPhase: Math.random() * Math.PI * 2 });
  });

  // Title
  const titleSprite = createTextSprite('\u{B098}\u{C758} \u{D55C}\u{C790} \u{B4F1}\u{AE09} \u{C120}\u{D0DD}', {
    fontSize: 40, color: '#FFD700', canvasW: 512, canvasH: 80, scale: 3.5,
    fontWeight: '900',
  });
  titleSprite.position.set(0, 8.5, -4);
  scene.add(titleSprite);

  // Animation
  gradeAnimator = new SceneAnimator(renderer, scene, camera, 'screen-grade-select');

  gradeAnimator.addUpdate((t) => {
    if (stars) stars.rotation.y += 0.0002;

    camera.position.x = Math.sin(t * 0.04) * 0.8;
    camera.position.y = 6 + Math.sin(t * 0.06) * 0.2;
    camera.lookAt(0, 3, -1);

    updatePetals(petals, t);
    updateLanterns(lanterns, t);

    // Grade cubes bob
    gradeCubes.forEach((gc, i) => {
      const bob = Math.sin(t * 1.0 + gc.bobPhase) * 0.08;
      gc.cube.position.y = bob;
      gc.cube.rotation.y = Math.sin(t * 0.3 + gc.bobPhase) * 0.08;
      if (gc.isSelected && gc.group.userData.glow) {
        gc.group.userData.glow.intensity = 1.0 + Math.sin(t * 2.5) * 0.5;
      }
    });
  });

  gradeAnimator.start();
}

export function showGradeSelect(deps) {
  const { onComplete, showHub } = deps;
  const signal = Router.navigate('screen-grade-select');

  const profile = Store.getProfile();
  const currentGrade = profile?.grade || '8\u{AE09}';

  const container = $('grade-select-content');

  container.innerHTML = `
    <div class="grade-select-header">
      <div class="grade-select-title">\u{B098}\u{C758} \u{D55C}\u{C790} \u{B4F1}\u{AE09} \u{C120}\u{D0DD}</div>
      <div class="grade-select-subtitle">\u{D559}\u{C2B5}\u{D560} \u{B4F1}\u{AE09}\u{C744} \u{C120}\u{D0DD}\u{D574}\u{C8FC}\u{C138}\u{C694}</div>
    </div>

    <div class="grade-grid">
      ${GRADES.map(grade => `
        <button class="grade-btn ${grade === currentGrade ? 'grade-btn-selected' : ''}" data-grade="${grade}">
          <div class="grade-number">${grade}</div>
          <div class="grade-particles"></div>
        </button>
      `).join('')}
    </div>

    <div class="grade-actions">
      <button class="btn-primary full-width" id="grade-confirm" style="font-size:1.1rem;padding:16px;">
        \u{D655}\u{C778}
      </button>
    </div>
  `;

  let selectedGrade = currentGrade;

  // Initialize 3D background
  setTimeout(() => initGrade3DBackground(selectedGrade), 50);

  // Grade button selection
  container.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('grade-btn-selected'));
      btn.classList.add('grade-btn-selected');
      selectedGrade = btn.dataset.grade;
      // Reinit 3D to update selected glow
      initGrade3DBackground(selectedGrade);
    }, { signal });
  });

  // Confirm button
  $('grade-confirm').addEventListener('click', async () => {
    try {
      $('grade-confirm').disabled = true;
      $('grade-confirm').textContent = '\u{C800}\u{C7A5} \u{C911}...';

      await Store.setGrade(selectedGrade);
      cleanupGrade3D();

      if (onComplete) {
        onComplete();
      } else {
        showHub();
      }
    } catch (error) {
      console.error('Failed to save grade:', error);
      $('grade-confirm').disabled = false;
      $('grade-confirm').textContent = '\u{D655}\u{C778}';
      alert('\u{B4F1}\u{AE09} \u{C800}\u{C7A5}\u{C5D0} \u{C2E4}\u{D328}\u{D588}\u{C2B5}\u{B2C8}\u{B2E4}. \u{B2E4}\u{C2DC} \u{C2DC}\u{B3C4}\u{D574}\u{C8FC}\u{C138}\u{C694}.');
    }
  }, { signal });
}
