import * as THREE from 'three';
import { GAME_LIST } from '../data/hanja.js';
import Store from '../systems/store.js';
import { Router } from '../systems/router.js';
import { $, medalEmoji } from '../utils.js';
import { voxBox } from '../engine/helpers.js';
import { SoundSystem } from '../systems/sound.js';
import { renderSidebar, updateSidebarData } from '../components/sidebar.js';

let hubRenderer = null;
let hubAnimId = null;

function initHub3DBackground() {
  const canvas = document.getElementById('hub3d');
  if (!canvas || hubRenderer) return;

  const w = window.innerWidth, h = window.innerHeight;
  hubRenderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  hubRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  hubRenderer.setSize(w, h);
  hubRenderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a2e, 0.03);
  const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  cam.position.set(0, 6, 15);
  cam.lookAt(0, 2, 0);

  scene.add(new THREE.AmbientLight(0x334466, 0.3));
  const dl = new THREE.DirectionalLight(0x8888ff, 0.4);
  dl.position.set(3, 8, 5);
  scene.add(dl);
  const pl = new THREE.PointLight(0xFF8844, 0.5, 20);
  pl.position.set(-3, 4, 3);
  scene.add(pl);

  // Mountain silhouette voxels
  const mountainColors = [0x1a1a4e, 0x151540, 0x202060];
  [[-5, 0, -8, 3, 5, 3], [0, 0, -10, 5, 7, 4], [6, 0, -7, 3.5, 4, 3], [-8, 0, -6, 2, 3, 2]].forEach(([mx, my, mz, mw, mh, md], i) => {
    const m = voxBox(mw, mh, md, mountainColors[i % mountainColors.length]);
    m.position.set(mx, my + mh / 2, mz);
    scene.add(m);
  });

  // Small cherry blossom particles
  const isMobile = window.innerWidth < 768;
  const petalCount = isMobile ? 15 : 30;
  const petals = [];
  const petalGeo = new THREE.PlaneGeometry(0.08, 0.05);
  const petalColors = [0xFFB7C5, 0xFF91A4, 0xFFCCDD];

  for (let i = 0; i < petalCount; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      transparent: true,
      opacity: 0.4 + Math.random() * 0.3,
      side: THREE.DoubleSide,
    });
    const petal = new THREE.Mesh(petalGeo, mat);
    petal.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 12 + 2,
      (Math.random() - 0.5) * 15
    );
    petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(petal);
    petals.push({
      mesh: petal,
      vy: -0.2 - Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      windPhase: Math.random() * Math.PI * 2,
    });
  }

  // Stars
  const sGeo = new THREE.BufferGeometry();
  const sPos = [];
  for (let i = 0; i < 200; i++) sPos.push((Math.random() - .5) * 60, Math.random() * 30 + 5, (Math.random() - .5) * 60 - 10);
  sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 }));
  scene.add(stars);

  let t = 0;
  function animate() {
    t += 0.016;
    stars.rotation.y += 0.0002;

    petals.forEach(p => {
      p.mesh.position.y += p.vy * 0.016;
      p.mesh.position.x += (p.vx + Math.sin(t * 0.6 + p.windPhase) * 0.2) * 0.016;
      p.mesh.rotation.x += p.rotSpeed * 0.016;
      if (p.mesh.position.y < -1) {
        p.mesh.position.y = 10 + Math.random() * 4;
        p.mesh.position.x = (Math.random() - 0.5) * 20;
      }
    });

    cam.position.x = Math.sin(t * 0.05) * 2;
    cam.position.y = 6 + Math.sin(t * 0.1) * 0.3;
    cam.lookAt(0, 2, 0);

    hubRenderer.render(scene, cam);
    const hubEl = document.getElementById('screen-hub');
    if (hubEl && hubEl.classList.contains('active')) {
      hubAnimId = requestAnimationFrame(animate);
    } else {
      cleanupHub3D();
    }
  }
  animate();
}

function cleanupHub3D() {
  if (hubAnimId) {
    cancelAnimationFrame(hubAnimId);
    hubAnimId = null;
  }
  if (hubRenderer) {
    hubRenderer.dispose();
    hubRenderer = null;
  }
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

  // Update user info in header (if exists)
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

    // Game name mapping (emoji removed, text-only)
    const gameNames = {
      'archery': 'Archery',
      'swimming': 'Swimming',
      'weightlifting': 'Weightlifting',
      'gymnastics': 'Memory Card',
      'marathon': 'Marathon',
      'antonym': 'Antonyms',
      'idiom': 'Idioms',
      'homonym': 'Homophones'
    };

    GAME_LIST.forEach((g, idx) => {
      const best = bestScores[g.id];
      const div = document.createElement('div');
      div.className = 'game-card anim-fadeIn';
      div.style.animationDelay = `${idx * 0.06}s`;

      const displayName = gameNames[g.id] || g.name;
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
