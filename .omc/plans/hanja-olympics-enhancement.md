# Hanja Olympics Enhancement Plan

## Context

### Original Request
6 major improvements to the Hanja Olympics game platform:
1. Weightlifting game brightness fix
2. Keyboard input (1,2,3,4) support expansion to all games
3. Gymnastics game rename to "Card Flip" + inverted scoring system
4. Archery game difficulty variation
5. Real-time leaderboard sidebar in all games
6. Splash/menu quality upgrade with Voxel Zen Garden style + BGM

### Research Findings

**Current Architecture:**
- Vite + ES Modules, Three.js 3D voxel engine (GE3D), Supabase backend
- 8 games: archery, swimming, weightlifting, gymnastics, marathon, antonym, idiom, homonym
- KeyboardManager handles 1-4 keys globally via `.g3d-ans` and `.game-option` selector
- GE3D._handleKey() has game-specific hardcoded handlers for swim, wl, marathon only
- SoundSystem uses WebAudio oscillators, no music playback capability yet
- Store.getLeaderboard() fetches from Supabase scores table
- Each game has its own updateUI() that builds HTML via GE3D.setUI()

**Keyboard Support Status:**
- KeyboardManager.init() listens for 1-4, clicks `.g3d-ans, .game-option` buttons
- GE3D._handleKey() additionally calls `window._swimAnswer`, `window._wlAnswer`, `window._marathonAnswer` directly
- Games NOT covered by GE3D._handleKey: archery, gymnastics, antonym, idiom, homonym
- However, KeyboardManager already clicks `.g3d-ans` which covers most games -- the issue is archery and antonym use custom `.g3d-btn` buttons (not `.g3d-ans`), and gymnastics uses raycaster clicks

**Scoring Systems:**
- archery: score (0-10 correct answers), always +1 per correct, bonus points separate
- gymnastics: `attempts` count (lower = better), getMedalForScore uses `<=12 gold, <=16 silver, <=20 bronze`
- Store.getBestScores() uses `ascending: false` (higher score = better) for ALL games
- Store.getLeaderboard() also sorts descending for all per-game views
- Leaderboard display: gymnastics shows `score + '회'`

**Weightlifting Brightness:**
- scene.background = 0x0a0a0a (nearly black)
- AmbientLight(0x221100, 0.3) - very dim
- Single SpotLight(0xffeedd, 1.5) + weak rimLight(0x4488ff, 0.3)
- Floor is 0x111111, platform 0x333333 -- extremely dark

---

## Work Objectives

### Core Objective
Enhance the Hanja Olympics game platform with 6 improvements covering brightness, keyboard input, game naming/scoring, difficulty variation, real-time leaderboard, and UI/UX quality.

### Deliverables
1. Brighter weightlifting scene
2. Universal keyboard input across all 8 games + daily challenge
3. Gymnastics renamed to "Card Flip" with inverted scoring + leaderboard sorting fix
4. Archery variable difficulty scoring
5. In-game leaderboard sidebar showing current score ranking
6. Premium splash/hub screens with Zen Garden style + background music

### Definition of Done
- All 8 games respond to keyboard 1-4 for answer selection
- Weightlifting scene is visibly brighter without losing atmosphere
- Gymnastics renamed everywhere, scoring inverted in leaderboard
- Archery gives variable points (not always 10)
- Every game shows a real-time leaderboard sidebar with current ranking
- Splash and hub screens use high-quality 3D rendering with particles and BGM
- All changes pass `npx vite build` without errors

---

## Must Have / Must NOT Have (Guardrails)

### Must Have
- Backward compatibility with existing saved scores in Supabase (existing archery medal thresholds preserved; gymnastics sort direction fixed without invalidating existing records)
- Mobile responsiveness maintained
- All 8 games + daily challenge keyboard support (except gymnastics which uses card-based raycaster clicks)
- Multiplayer sync unaffected

### Must NOT Have
- Do NOT change Supabase schema (work with existing tables)
- Do NOT break existing game mechanics (only enhance)
- Do NOT remove any existing sound effects
- Do NOT change authentication flow

---

## Task Flow and Dependencies

```
Task 1 (Weightlifting Brightness)  -- independent
Task 2 (Keyboard Expansion)        -- independent
Task 3 (Gymnastics Rename/Score)   -- depends on nothing, but Task 5 depends on this for sorting
Task 4 (Archery Difficulty)         -- independent
Task 5 (Leaderboard Sidebar)       -- depends on Task 3 (scoring direction knowledge)
Task 6 (Splash/Hub + BGM)          -- independent, largest task
```

---

## Task 1: Weightlifting Game Brightness

**File:** `/Users/tykimos/vibecode/hanja/src/games/weightlifting.js`

### Changes

1. **Scene background**: Change `0x0a0a0a` to `0x1a1020` (dark purple-tinted, not pure black)
2. **Ambient light**: Change `new THREE.AmbientLight(0x221100, 0.3)` to `new THREE.AmbientLight(0x443355, 0.6)` (brighter, warmer purple tint)
3. **Spotlight**: Increase intensity from `1.5` to `2.5`, widen angle from `Math.PI/5` to `Math.PI/4`
4. **Rim light**: Increase from `0.3` to `0.8` intensity
5. **Add fill light**: Add a new PointLight `new THREE.PointLight(0xffaa66, 0.5, 20)` at position `(3, 4, 5)` for front fill
6. **Platform color**: Change `0x333333` to `0x555555`
7. **Floor color**: Change `0x111111` to `0x222233`
8. **Audience colors**: Change body `0x222222` to `0x334455`, head `0x331111` to `0x553333`

### Acceptance Criteria
- Scene is clearly visible without squinting
- Lifter, barbell, and plates are well-lit
- Dark/moody atmosphere is preserved (not washed out)
- Spotlight flicker effect still visible

---

## Task 2: Keyboard Input (1,2,3,4) Support Expansion

**Files:**
- `/Users/tykimos/vibecode/hanja/src/engine/ge3d.js` (primary)
- `/Users/tykimos/vibecode/hanja/src/games/archery.js` (button class fix)
- `/Users/tykimos/vibecode/hanja/src/games/antonym.js` (button class fix)

### Problem Analysis
KeyboardManager already clicks `.g3d-ans` and `.game-option` on 1-4 keypress. GE3D._handleKey() redundantly calls specific window functions for 3 games. The issue is:
- **Archery & Antonym**: Use custom `.g3d-btn` buttons without `.g3d-ans` class in their bottom button strip
- **Gymnastics**: Card-based, no answer buttons (keyboard N/A for card selection)
- **Homonym**: Already uses `.g3d-ans` class -- should work
- **Idiom**: Already uses `.g3d-ans` class -- should work

### Changes

**A. Clean up GE3D._handleKey()** (`/Users/tykimos/vibecode/hanja/src/engine/ge3d.js` lines 60-78):
- Remove the ENTIRE `if(key>='1'&&key<='4'){...}` block (ge3d.js lines 64-71). This block contains `e.preventDefault()`, the idx parse, and the three redundant calls to `window._swimAnswer`, `window._wlAnswer`, `window._marathonAnswer`. Remove ALL of it -- the entire if-block and its contents.
- These are redundant with KeyboardManager's generic `.g3d-ans` click approach which already handles 1-4 key presses.
- Keep the Space key handler for weightlifting gauge (lines 72-77) -- do NOT remove this block.

**B. Fix archery buttons** (`/Users/tykimos/vibecode/hanja/src/games/archery.js` lines 87-89):
- Add `g3d-ans` class and `data-idx` attribute to the archery bottom buttons
- Change: `class="g3d-btn"` to `class="g3d-btn g3d-ans" data-idx="${i}"`
- Add key hints for PC: `${KeyboardManager.isPC() ? '<span class="key-hint">[' + (i+1) + ']</span> ' : ''}`
- Import KeyboardManager

**C. Fix antonym buttons** (`/Users/tykimos/vibecode/hanja/src/games/antonym.js` lines 92-94):
- Same as archery: add `g3d-ans` class and `data-idx="${i}"` attribute
- Add key hints for PC
- Import KeyboardManager

**D. Add key hints to all g3dAnswerGrid** (`/Users/tykimos/vibecode/hanja/src/engine/ui.js`):
- The g3dAnswerGrid function already shows `[1]` etc on desktop -- verify this works
- Already done at line 33: `${showNumbers?'<span ...>${i+1}</span>':''}`
- This covers: swimming, weightlifting, marathon, homonym, idiom

**E. Gymnastics keyboard support**: Add optional keyboard shortcuts for card selection (e.g., 1-9 for grid positions mapped left-to-right, top-to-bottom). However, since gymnastics uses 4x4=16 cards and raycaster clicks, full keyboard support is complex. **Decision: Skip gymnastics keyboard input** -- it's a card-matching game that relies on spatial memory and clicking.

### Acceptance Criteria
- Press 1-4 keys during archery to select answer (fires `_archeryTap`)
- Press 1-4 keys during antonym to select answer (fires `_antonymTap`)
- Press 1-4 keys during swimming, weightlifting, marathon, idiom, homonym -- all work
- Press 1-4 keys during daily challenge -- works
- Key hints `[1] [2] [3] [4]` visible on PC for all answer buttons
- Space key still works for weightlifting gauge stop
- No duplicate answer triggers (remove GE3D._handleKey number key handling)

---

## Task 3: Gymnastics -> "Card Flip" Rename + Scoring Inversion

**Files:**
- `/Users/tykimos/vibecode/hanja/src/data/hanja.js` -- GAME_LIST name change
- `/Users/tykimos/vibecode/hanja/src/games/gymnastics.js` -- game name in getResult()
- `/Users/tykimos/vibecode/hanja/src/screens/leaderboard.js` -- sort direction for gymnastics
- `/Users/tykimos/vibecode/hanja/src/screens/result.js` -- display format
- `/Users/tykimos/vibecode/hanja/src/screens/hub.js` -- best score display
- `/Users/tykimos/vibecode/hanja/src/systems/store.js` -- getBestScores() and getLeaderboard() sorting
- `/Users/tykimos/vibecode/hanja/src/utils.js` -- getMedalForScore already handles `<=` for gymnastics

### Changes

**A. GAME_LIST rename** (`/Users/tykimos/vibecode/hanja/src/data/hanja.js` line 115):
- Change `{id:'gymnastics',name:'체조',icon:'🤸',desc:'카드 매칭 게임',multi:false}`
- To `{id:'gymnastics',name:'카드 뒤집기',icon:'🃏',desc:'카드 매칭 게임',multi:false}`

**B. Game result name** (`/Users/tykimos/vibecode/hanja/src/games/gymnastics.js` line 147):
- Change `name:'체조'` to `name:'카드 뒤집기'`

**C. Leaderboard tab names** (`/Users/tykimos/vibecode/hanja/src/screens/leaderboard.js` lines 7-8):
- Change `'체조'` to `'카드 뒤집기'` in tabs array
- Add the remaining 3 games to BOTH arrays. The exact Korean names (matching GAME_LIST in hanja.js) are:
  - `'반의어'` for antonym (from hanja.js line 117: `{id:'antonym',name:'반의어'}`)
  - `'사자성어'` for idiom (from hanja.js line 118: `{id:'idiom',name:'사자성어'}`)
  - `'동음이의'` for homonym (from hanja.js line 119: `{id:'homonym',name:'동음이의'}`)
- Updated line 7: `const tabs = ['종합', '양궁', '수영', '역도', '카드 뒤집기', '마라톤', '반의어', '사자성어', '동음이의'];`
- Updated line 8: `const tabIds = ['total', 'archery', 'swimming', 'weightlifting', 'gymnastics', 'marathon', 'antonym', 'idiom', 'homonym'];`

**D. Leaderboard sort direction** (`/Users/tykimos/vibecode/hanja/src/systems/store.js`):

- **D1. `getBestScores()` fix** (line 73-84): For gymnastics, best score = lowest.
  - Line 76: Change `.order('score', { ascending: false })` to `.order('score', { ascending: false })` (keep as-is since it fetches ALL scores for the user; filtering happens below).
  - Line 79: Change `if (!best[s.game_id] || s.score > best[s.game_id].score)` to `if (!best[s.game_id] || (s.game_id === 'gymnastics' ? s.score < best[s.game_id].score : s.score > best[s.game_id].score))`

- **D2. `getLeaderboard()` fix** (line 102-115): BOTH the Supabase query sort AND the JS deduplication comparison must handle gymnastics.
  - Line 107: Change `.order('score', { ascending: false })` to `.order('score', { ascending: gameId === 'gymnastics' })` so Supabase returns lowest-first for gymnastics.
  - Line 110: Change `if (!best[s.user_id] || s.score > best[s.user_id].score)` to `if (!best[s.user_id] || (gameId === 'gymnastics' ? s.score < best[s.user_id].score : s.score > best[s.user_id].score))` -- **this is critical**: without this fix, the deduplication loop would keep the WORST (highest) gymnastics score instead of the best (lowest).
  - Line 114: Change `.sort((a, b) => b.score - a.score)` to `.sort((a, b) => gameId === 'gymnastics' ? a.score - b.score : b.score - a.score)` so the final return array ranks lowest-score-first for gymnastics.

**E. Hub best score display** (`/Users/tykimos/vibecode/hanja/src/screens/hub.js` line 42):
- Already shows `score + '회'` for gymnastics -- keep as is

**F. Result display** (`/Users/tykimos/vibecode/hanja/src/screens/result.js` line 17):
- Already handles gymnastics with `score + '회'` -- keep as is

### Acceptance Criteria
- Hub shows "카드 뒤집기" instead of "체조" with 🃏 icon
- Game result says "카드 뒤집기"
- Leaderboard sorts gymnastics ascending (fewer attempts = higher rank)
- getBestScores returns lowest score for gymnastics
- Medal thresholds unchanged (<=12 gold, etc.)
- Leaderboard tabs include all 8 games

---

## Task 4: Archery Game Difficulty Variation

**File:** `/Users/tykimos/vibecode/hanja/src/games/archery.js`

### Problem
Currently archery is 10 questions, each worth 1 point (max 10). The bonus system exists but is based on arrow flight time, not difficulty. User wants more score variance.

### Changes

**A. Implement variable point values per question** (archery.js):
- Questions 1-3: Worth 1 point each (easy warm-up)
- Questions 4-6: Worth 2 points each (medium)
- Questions 7-8: Worth 3 points each (hard)
- Questions 9-10: Worth 5 points each (final challenge)
- Maximum possible: 3*1 + 3*2 + 2*3 + 2*5 = 3+6+6+10 = 25 points
- Display point value on each question

**B. Add difficulty mechanics**:
- Questions 1-3: Targets bob slowly, normal size
- Questions 4-6: Targets bob faster (dt*2.5 instead of dt*1.5)
- Questions 7-8: Targets are smaller (scale 0.8), bob faster (dt*3)
- Questions 9-10: Targets smallest (scale 0.6), bob fastest (dt*4), slight rotation wobble

**C. Update score display** (archery.js updateUI):
- Show current question's point value in the HUD: `g3dBadge(pointValue + 'pts', 'rgba(255,215,0,.5)')`
- Show running total prominently

**D. Update medal thresholds** (`/Users/tykimos/vibecode/hanja/src/utils.js` line 72):
- **Keep OLD thresholds** to preserve backward compatibility with existing scores: `score>=9?'gold':score>=7?'silver':score>=5?'bronze':null`
- Rationale: Existing users have archery scores on a 0-10 scale. If we change thresholds to >=20, their perfect 10 scores would lose gold medals. Keeping old thresholds means old scores remain valid, and new scores (up to 25) also get medals correctly since 25>=9 is still gold.
- **Do NOT change** the archery medal thresholds in utils.js.

**E. Update result detail** (archery.js getResult):
- Update total to 25 instead of 10
- Update detail string to show `score + '/25 적중 (보너스 +' + bonus + ')'`

**F. Backward compatibility note**:
- Old archery scores (max 10) coexist with new scores (max 25) in Supabase
- Leaderboard sorts descending (higher = better), so new scores naturally rank above old scores
- Medal thresholds are intentionally kept low (>=9 gold) so old perfect scores retain their medals
- No data migration required

### Acceptance Criteria
- Questions get progressively harder (faster, smaller targets)
- Point values vary: 1, 2, 3, or 5 per question
- Player can see current question's point value
- Maximum score is 25
- Medal thresholds UNCHANGED (>=9 gold, >=7 silver, >=5 bronze) -- existing scores keep their medals
- Leaderboard still works (higher score = better)
- Old scores (0-10 scale) coexist with new scores (0-25 scale) without breaking

---

## Task 5: Real-time Leaderboard Sidebar

**Files:**
- `/Users/tykimos/vibecode/hanja/src/engine/ui.js` -- new g3dLeaderboardSidebar function
- `/Users/tykimos/vibecode/hanja/src/systems/store.js` -- new getTopScores method (cached)
- All 8 game files -- add leaderboard sidebar to updateUI
- `/Users/tykimos/vibecode/hanja/src/styles.css` -- sidebar styles

### Design

A collapsible sidebar that shows:
- Top 5 scores for the current game from the database
- Current player's live score highlighted
- Where the current score would rank

### Changes

**A. New Store method** (`/Users/tykimos/vibecode/hanja/src/systems/store.js`):
```
async getTopScoresForGame(gameId, limit = 5) {
  // Cache for 60 seconds to avoid hammering DB
  const cacheKey = 'top_' + gameId;
  const now = Date.now();
  if (this._topCache && this._topCache[cacheKey] && now - this._topCache[cacheKey].ts < 60000) {
    return this._topCache[cacheKey].data;
  }
  const ascending = gameId === 'gymnastics';
  const { data } = await supabase.from('scores')
    .select('user_id, score, profiles!inner(username, icon)')
    .eq('game_id', gameId)
    .order('score', { ascending })
    .limit(20);
  // Deduplicate by user (best score per user)
  const best = {};
  (data || []).forEach(s => {
    if (!best[s.user_id] || (ascending ? s.score < best[s.user_id].score : s.score > best[s.user_id].score)) {
      best[s.user_id] = { username: s.profiles.username, icon: s.profiles.icon, score: s.score };
    }
  });
  const sorted = Object.values(best).sort((a, b) => ascending ? a.score - b.score : b.score - a.score).slice(0, limit);
  if (!this._topCache) this._topCache = {};
  this._topCache[cacheKey] = { ts: now, data: sorted };
  return sorted;
}
```

**B. New UI function** (`/Users/tykimos/vibecode/hanja/src/engine/ui.js`):
```
export function g3dLeaderboardSidebar(topScores, currentScore, gameId, playerName) {
  // Returns HTML string for a compact sidebar
  // Shows top 5 + current player position
  // Collapsible via CSS (show/hide toggle)
  // Position: right side, vertically centered
  const isLower = gameId === 'gymnastics'; // lower is better
  const allEntries = [...topScores];
  // Find where current score would rank
  let myRank = allEntries.length + 1;
  for (let i = 0; i < allEntries.length; i++) {
    if (isLower ? currentScore <= allEntries[i].score : currentScore >= allEntries[i].score) {
      myRank = i + 1; break;
    }
  }
  let html = '<div class="g3d-lb-sidebar">';
  html += '<div class="g3d-lb-title">Ranking</div>';
  allEntries.slice(0, 5).forEach((e, i) => {
    html += `<div class="g3d-lb-entry ${i < 3 ? 'top3' : ''}">`
    html += `<span class="g3d-lb-rank">${i+1}</span>`;
    html += `<span class="g3d-lb-name">${e.icon} ${e.username}</span>`;
    html += `<span class="g3d-lb-score">${e.score}</span>`;
    html += `</div>`;
  });
  html += `<div class="g3d-lb-entry g3d-lb-me">`;
  html += `<span class="g3d-lb-rank">${myRank}</span>`;
  html += `<span class="g3d-lb-name">나</span>`;
  html += `<span class="g3d-lb-score">${currentScore}</span>`;
  html += `</div>`;
  html += '</div>';
  return html;
}
```

**C. CSS styles** (`/Users/tykimos/vibecode/hanja/src/styles.css`):
- `.g3d-lb-sidebar`: fixed position right side, semi-transparent glassmorphism panel, compact
- `.g3d-lb-entry`: small row with rank, name, score
- `.g3d-lb-me`: highlighted current player
- Responsive: hidden on very small screens (<400px width), compact on mobile

**D. Integration into each game's updateUI -- async pattern**:

The core challenge is that `Store.getTopScoresForGame()` is async, but game `init()` and `updateUI()` are synchronous. Here is the concrete integration pattern every game MUST follow:

**Step 1: Add imports** at top of each game file:
```js
import Store from '../systems/store.js';
import { g3dLeaderboardSidebar } from '../engine/ui.js';
```
(Some games already import Store -- add only if missing.)

**Step 2: Add a closure variable** inside the game's factory function (e.g., `createArcheryGame3D()`), alongside the other `let` declarations:
```js
let topScores = []; // leaderboard sidebar data, loaded async
```

**Step 3: Fire-and-forget async load in `init()`**. The game's `init()` method is synchronous. Use `.then()` to load leaderboard data without blocking init:
```js
init() {
  reset();
  this.scene = scene;
  this.camera = camera;
  // Load leaderboard data asynchronously -- sidebar renders empty until loaded
  Store.getTopScoresForGame('archery').then(data => {
    topScores = data;
    updateUI(); // re-render UI once data arrives
  });
},
```
Note: Replace `'archery'` with the appropriate gameId for each game.

**Step 4: Use `topScores` in `updateUI()`**. Append the sidebar HTML just before `GE3D.setUI(h)`:
```js
function updateUI() {
  let h = '';
  // ... existing HUD code ...
  // Append leaderboard sidebar (topScores may be [] until async load completes)
  h += g3dLeaderboardSidebar(topScores, score, 'archery', Store.getCurrentUser() || '나');
  GE3D.setUI(h);
}
```

**Per-game score variable mapping** (the `currentScore` argument to `g3dLeaderboardSidebar`):
  - archery.js: `score` variable, gameId `'archery'`
  - swimming.js: `score` variable, gameId `'swimming'`
  - weightlifting.js: `streak` variable, gameId `'weightlifting'`
  - gymnastics.js: `attempts` variable, gameId `'gymnastics'`
  - marathon.js: live percentage `Math.round(score/qs.length*100)`, gameId `'marathon'`
  - antonym.js: `score` variable, gameId `'antonym'`
  - idiom.js: `score` variable (raw count, not percentage), gameId `'idiom'`
  - homonym.js: `score` variable, gameId `'homonym'`

**E. Import additions**: Each game file needs to import `g3dLeaderboardSidebar` from `'../engine/ui.js'` and `Store` from `'../systems/store.js'` (if not already imported). Check existing imports before adding duplicates.

### Acceptance Criteria
- Sidebar visible during gameplay on right side
- Shows top 5 historical scores for current game
- Shows player's current score and estimated rank
- Updates as player scores change
- Does not block gameplay (pointer-events: none except toggle)
- Loads top scores once per game session (cached 60s)
- Hides on very small screens
- Works for all 8 games

---

## Task 6: Splash/Hub Quality Upgrade + BGM [COMPLETED]

**Files:**
- `/Users/tykimos/vibecode/hanja/src/screens/splash.js` -- major overhaul
- `/Users/tykimos/vibecode/hanja/src/screens/hub.js` -- visual upgrade
- `/Users/tykimos/vibecode/hanja/src/systems/sound.js` -- add BGM functionality
- `/Users/tykimos/vibecode/hanja/src/styles.css` -- glassmorphism styles
- `/Users/tykimos/vibecode/hanja/index.html` -- splash screen HTML updates

### Sub-task 6A: SoundSystem BGM Extension

**File:** `/Users/tykimos/vibecode/hanja/src/systems/sound.js`

Add procedural background music using oscillators (no external files needed):

```
// New methods on SoundSystem:
_bgmNodes: null,
_bgmPlaying: false,

startBGM(type = 'zen') {
  if (!this.ctx || this._bgmPlaying) return;
  this._bgmPlaying = true;
  // Create ambient drone + melodic pattern
  // Zen style: pentatonic scale, slow arpeggios, soft pads
  const masterGain = this.ctx.createGain();
  masterGain.gain.value = 0.08;
  masterGain.connect(this.ctx.destination);

  // Pad drone (two detuned sine waves)
  const pad1 = this.ctx.createOscillator();
  const pad2 = this.ctx.createOscillator();
  const padGain = this.ctx.createGain();
  pad1.type = 'sine'; pad1.frequency.value = 220;
  pad2.type = 'sine'; pad2.frequency.value = 223; // slight detune for warmth
  padGain.gain.value = 0.5;
  pad1.connect(padGain); pad2.connect(padGain); padGain.connect(masterGain);
  pad1.start(); pad2.start();

  // Pentatonic melody (C, D, E, G, A) played as arpeggios
  const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  let noteIdx = 0;
  const melodyGain = this.ctx.createGain();
  melodyGain.gain.value = 0.3;
  melodyGain.connect(masterGain);

  const playNote = () => {
    if (!this._bgmPlaying) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = notes[noteIdx % notes.length];
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
    osc.connect(g); g.connect(melodyGain);
    osc.start(); osc.stop(this.ctx.currentTime + 1.5);
    noteIdx++;
  };
  playNote();
  const interval = setInterval(playNote, 2000);

  this._bgmNodes = { pad1, pad2, padGain, masterGain, interval };
},

stopBGM() {
  if (!this._bgmNodes) return;
  this._bgmPlaying = false;
  const { pad1, pad2, masterGain, interval } = this._bgmNodes;
  clearInterval(interval);
  masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
  setTimeout(() => {
    try { pad1.stop(); pad2.stop(); } catch(e) {}
  }, 1200);
  this._bgmNodes = null;
},

setBGMVolume(v) {
  if (this._bgmNodes && this._bgmNodes.masterGain) {
    this._bgmNodes.masterGain.gain.value = Math.max(0, Math.min(0.15, v));
  }
}
```

### Sub-task 6B: Splash Screen Enhancement

**File:** `/Users/tykimos/vibecode/hanja/src/screens/splash.js`

Enhance to match Voxel Zen Garden quality:

1. **Cherry blossom particle system**: Add 50-100 petal particles that drift down with wind physics (sine wave X movement, steady Y descent, slow rotation)
2. **Enhanced pagoda**: Keep existing but add more detail layers, add subtle glow
3. **Zen garden elements**: Add a small bridge, stepping stones, water reflection plane with animated ripples
4. **Improved lighting**: Add warm point lights (lantern glow), fog with color shift over time
5. **Smooth camera orbit**: Camera slowly orbits the scene (not just pagoda rotating)
6. **Loading animation**: Replace simple "로딩 중..." with an animated spinner (CSS-based)
7. **Glassmorphism title overlay**: Semi-transparent panel with blur effect for the title text
8. **Start BGM** on splash load (soft zen music)

### Sub-task 6C: Hub Screen Enhancement

**Files:**
- `/Users/tykimos/vibecode/hanja/src/screens/hub.js`
- `/Users/tykimos/vibecode/hanja/index.html`
- `/Users/tykimos/vibecode/hanja/src/styles.css`

1. **3D background for hub**: Add a small Three.js canvas behind the hub screen showing a slowly rotating voxel scene (mountain + cherry blossoms)
2. **Glassmorphism cards**: Game cards get frosted glass effect with subtle animations
3. **Animated game icons**: Slight floating/bouncing animation on game card icons
4. **BGM continues**: Keep BGM playing from splash through hub (stop when entering a game)
5. **Smooth transitions**: Add fade-in animations for hub elements

### Sub-task 6D: CSS Glassmorphism Styles

**File:** `/Users/tykimos/vibecode/hanja/src/styles.css`

Add:
```css
/* Glassmorphism */
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}

/* Loading spinner */
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,215,0,0.2);
  border-top-color: #FFD700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Particle system (cherry blossoms) */
.cherry-petal {
  position: absolute;
  width: 8px; height: 8px;
  background: radial-gradient(ellipse, #FFB7C5 30%, #FF69B4 100%);
  border-radius: 50% 0 50% 0;
  pointer-events: none;
  animation: petalFall linear infinite;
}
@keyframes petalFall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0.8; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
```

### Acceptance Criteria (Task 6)
- Splash screen shows high-quality 3D zen garden scene
- Cherry blossom petals drift across the splash screen
- Background music plays softly on splash (after user interaction)
- Hub has a subtle 3D background
- Game cards use glassmorphism style
- BGM stops when entering a game
- Loading spinner instead of plain text
- All animations are smooth on mobile (reduced particles for performance)

---

## Commit Strategy

### Commit 1: Task 1 - Weightlifting Brightness
Files: `src/games/weightlifting.js`
Message: "feat: improve weightlifting game brightness and visibility"

### Commit 2: Task 2 - Keyboard Expansion
Files: `src/engine/ge3d.js`, `src/games/archery.js`, `src/games/antonym.js`
Message: "feat: expand keyboard 1-4 input support to all games"

### Commit 3: Task 3 - Gymnastics Rename + Scoring
Files: `src/data/hanja.js`, `src/games/gymnastics.js`, `src/screens/leaderboard.js`, `src/screens/result.js`, `src/systems/store.js`
Message: "feat: rename gymnastics to card flip, fix ascending score sorting"

### Commit 4: Task 4 - Archery Difficulty
Files: `src/games/archery.js`, `src/utils.js`
Message: "feat: add variable difficulty and scoring to archery game"

### Commit 5: Task 5 - Leaderboard Sidebar
Files: `src/engine/ui.js`, `src/systems/store.js`, `src/styles.css`, all 8 game files
Message: "feat: add real-time leaderboard sidebar to all games"

### Commit 6: Task 6 - Splash/Hub Quality + BGM
Files: `src/screens/splash.js`, `src/screens/hub.js`, `src/systems/sound.js`, `src/styles.css`, `index.html`
Message: "feat: upgrade splash/hub with zen garden visuals and background music"

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Score sorting breaks existing leaderboard | Medium | High | Only change gymnastics sort direction; keep all others as-is |
| BGM causes audio context issues | Medium | Low | Guard with try/catch; only start after user gesture |
| Leaderboard sidebar obscures gameplay on mobile | Medium | Medium | Hide on small screens; make collapsible |
| Three.js particle system causes performance issues | Medium | Medium | Reduce particle count on mobile (check window.innerWidth) |
| Archery score change breaks existing records | Low | Low | Medal thresholds kept at old values (>=9 gold); old 0-10 scores retain medals; new 0-25 scores naturally rank above old scores in leaderboard |
| Hub 3D background causes slow load | Low | Medium | Use simple geometry; lazy-init renderer |

---

## Verification Steps

1. **After Task 1**: Open weightlifting game, confirm scene is brighter, lifter visible
2. **After Task 2**: Open each game, press 1-4 keys, verify answer selection works
3. **After Task 3**: Check hub shows "카드 뒤집기", play game, check leaderboard sorts ascending
4. **After Task 4**: Play archery, verify different point values per question, check total 25
5. **After Task 5**: Play any game, verify sidebar shows on right side with top scores
6. **After Task 6**: Open app, verify splash has cherry blossoms and BGM, hub has glass cards
7. **Final**: Run `npx vite build` -- confirm no errors, test on mobile viewport

---

## Success Criteria

- [x] Weightlifting scene visibly brighter
- [x] All 8 games + daily respond to keyboard 1-4
- [x] "카드 뒤집기" name everywhere, ascending sort in leaderboard
- [x] Archery questions have variable point values (1/2/3/5)
- [x] In-game leaderboard sidebar visible in all games
- [x] Splash has zen garden quality with particles and BGM
- [x] Hub has glassmorphism cards
- [x] `npx vite build` succeeds
- [x] Mobile responsive maintained
