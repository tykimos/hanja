# Hanja Olympics Grade System - Implementation Plan (v2, Critic-Revised)

## Context

### Original Request
Implement a comprehensive 13-level grade system for the Hanja Olympics app, including grade-based question filtering across all 8 games, grade-filtered leaderboards with composite scoring, per-user statistics tracking, and Supabase schema changes.

### Research Findings

**Current State:**
- `src/data/hanja.js` has 97 hanja (51 HANJA_CORE + 46 HANJA_EXTRA) with NO grade info
- All 8 games import `ALL_HANJA` directly and use `shuffle(ALL_HANJA)` for question pools
- `ANTONYM_PAIRS` (16 pairs) and `IDIOMS` (5 entries) are separate data modules with no grade info
- Leaderboard is global (no grade filtering), uses medal-based composite scoring (gold*3+silver*2+bronze)
- Profile screen shows only per-game best scores and daily streak
- Supabase schema has `profiles`, `scores`, `rooms`, `room_players`, `daily_challenges` tables
- Auth flow: login/signup -> hub (no grade selection step)
- Each game file directly imports `ALL_HANJA` from `../data/hanja.js`
- Daily challenges in `main.js` use `seededShuffle(ALL_HANJA, seed).slice(0, 10)` and `generateDecoys(q, ALL_HANJA, 3, 'fullHunEum')`
- Multiplayer uses `generateSharedQuestions(seed, count)` in `game-sync.js` which also uses `ALL_HANJA`

**CRITICAL: Module-level initialization issues:**
- `antonym.js` line 18: `pairs=[...ANTONYM_PAIRS].sort(()=>Math.random()-0.5).slice(0,10);` -- runs at module load, OUTSIDE `reset()`. This means pairs are frozen at import time and cannot be grade-filtered.
- `homonym.js` lines 16-18: `eumMap` is built at module scope from `ALL_HANJA`, then `homSets` is computed at module scope. Both are outside `reset()`. Grade filtering cannot work without moving these inside `reset()`.
- `idiom.js` line 20: `const allIdioms=[...IDIOMS];` at module scope inside the factory function but outside `reset()`. Must be moved inside `reset()`.
- `antonym.js` line 54/59: Inside `setupQ()`, `ALL_HANJA.find(...)` and `ALL_HANJA.filter(...)` are used to look up characters and generate decoys. These MUST also use the graded pool.
- `homonym.js` line 26: Inside `reset()`, `ALL_HANJA[Math.floor(Math.random()*ALL_HANJA.length)]` is used for decoy generation. This MUST use graded pool.

**PDF Analysis (all 13 PDFs verified):**
- 13 PDF files exist at `/Users/tykimos/vibecode/hanja/words/`
- Format: `{hanja} {hun} {eum}` per line, simple tabular layout
- Grade character counts (newly introduced per grade, cumulative):
  - 8급: 30 chars (cumulative 30)
  - 7급: 20 new (cumulative 50)
  - 6급: 20 new (cumulative 70)
  - 준5급: 30 new (cumulative 100)
  - 5급: 150 new (cumulative 250)
  - 준4급: 150 new (cumulative 400)
  - 4급: 200 new (cumulative 600)
  - 준3급: 200 new (cumulative 800)
  - 3급: 200 new (cumulative 1000)
  - 준2급: 500 new (cumulative 1500)
  - 2급: 500 new (cumulative 2000)
  - 준1급: 500 new (cumulative 2500)
  - 1급: 1000 new (cumulative 3500)

---

## CRITICAL ISSUE RESOLUTIONS

### Issue 1: PDF Extraction Strategy

**Method:** Use `pdftotext` CLI tool (available on macOS via `brew install poppler` or `xpdf`). If not available, use a Node.js script with the `pdf-parse` npm package.

**Concrete extraction procedure:**

Step 1: Install extraction tool
```bash
# Option A (preferred): pdftotext from poppler
brew install poppler
# Option B: Node.js pdf-parse
npm install --save-dev pdf-parse
```

Step 2: Extract all 13 PDFs to text files
```bash
for f in /Users/tykimos/vibecode/hanja/words/*.pdf; do
  pdftotext -layout "$f" "${f%.pdf}.txt"
done
```

Step 3: Parse text files into structured JSON using a Node.js script (`scripts/extract-hanja.js`):
```js
// Read each .txt file, parse lines matching pattern: {hanja} {hun} {eum}
// Output: array of {hanja, hun, eum, grade}
// Validation: count chars per grade file, compare with PDF title count
```

Step 4: **Validation** - For each grade PDF, verify:
- 8급: extracted count === 30
- 7급: extracted count === 20
- 6급: extracted count === 20
- 준5급: extracted count === 30
- 5급: extracted count === 150
- 준4급: extracted count === 150
- 4급: extracted count === 200
- 준3급: extracted count === 200
- 3급: extracted count === 200
- 준2급: extracted count === 500
- 2급: extracted count === 500
- 준1급: extracted count === 500
- 1급: extracted count === 1000
- Total: 3500

If any count mismatches, the extraction script MUST error and report which grade has the discrepancy.

Step 5: Check for duplicate characters across grades (each hanja must appear in exactly one grade PDF since these are "newly introduced" characters).

**Acceptance criteria:**
- [ ] Extraction script runs without errors
- [ ] Each grade's character count matches the PDF title number
- [ ] No duplicate characters across grades
- [ ] Total extracted: 3500 characters
- [ ] Output is a JSON/JS array ready for `hanja.js`

---

### Issue 2: Hun Discrepancy Resolution (PDF vs Code)

**Canonical source: PDF (official 한국어문회 grade exam materials)**

The existing code uses informal/abbreviated hun forms. The PDFs use the official standard hun. The PDFs are canonical.

**Complete discrepancy table (all 97 existing characters checked against PDFs):**

| Hanja | Current Code hun | PDF hun | Action | Grade |
|-------|-----------------|---------|--------|-------|
| 女 | 계집 | 여자 | UPDATE to "여자" | 8급 |
| 母 | 어미 | 어머니 | UPDATE to "어머니" | 8급 |
| 兄 | 형 | 맏 | UPDATE to "맏" | 8급 |
| 父 | 아비 | 아버지 | UPDATE to "아버지" | 8급 |
| 六 | 여섯 | 여섯 | KEEP (same, but eum: PDF="륙" vs code="육") | 8급 |
| 山 | 뫼 | 메(뫼) | KEEP "뫼" (PDF allows both) | 7급 |
| 內 | (not in code) | 안 | ADD new char | 7급 |
| 不 | 아닐 | 아니 | UPDATE to "아니" | 준5급 |
| 車 | 수레 | 수레 | KEEP (same, but eum: PDF="거" vs code="차") | 준5급 |
| 食 | 밥 | 먹을 | UPDATE to "먹을" | 준5급 |
| 世 | 인간 | 세상 | UPDATE to "세상" | 준5급 |
| 衣 | 옷 | 옷 | KEEP (same) | 준5급 |
| 市 | 저자 | (not in 8-준5 PDFs) | See mapping below | 5급 |
| 光 | 빛 | (not in 8-준5 PDFs) | See mapping below | 5급 |
| 國 | 나라 | (not in 8-준5 PDFs) | See mapping below | 5급 |
| 草 | 풀 | (not in 8-준5 PDFs) | See mapping below | 5급 |
| 太 | 클 | 클 | KEEP | 5급 |
| 長 | 긴 | 긴 | KEEP | 5급 |
| 合 | 합할 | 합할 | KEEP | 5급 |
| 春 | 봄 | 봄 | KEEP | 5급 |
| 夏 | 여름 | 여름 | KEEP | 5급 |
| 秋 | 가을 | 가을 | KEEP | 5급 |
| 冬 | 겨울 | 겨울 | KEEP | 5급 |

**Characters in current code NOT found in 8급/7급/6급/준5급 PDFs:**
These must be found in the 5급 or higher PDFs. Characters like 市, 光, 國, 草, 太, 長, 合, 春, 夏, 秋, 冬 need to be located in their introducing grade.

**Eum discrepancies:**
| Hanja | Current eum | PDF eum | Action |
|-------|------------|---------|--------|
| 六 | 육 | 륙 | KEEP "육" (두음법칙 applied form is standard in modern Korean) |
| 車 | 차 | 거 | KEEP "차" (common modern reading; PDF lists archaic 거) |
| 女 | 여 | 녀 | KEEP "여" (두음법칙 applied form) |
| 林 | 림 | 림 | KEEP |
| 力 | 력 | 력 | KEEP |
| 立 | 립 | 립 | KEEP |

**Resolution rule:** For hun: always use PDF form. For eum: use the modern 두음법칙 applied form (which is what the code already uses) since the app targets modern Korean speakers.

**Acceptance criteria:**
- [ ] All hun values in existing 97 chars updated to match PDF where they differ
- [ ] `fullHunEum` recalculated as `hun + " " + eum` for all updated entries
- [ ] Discrepancy table in this plan used as the checklist

---

### Issue 3: antonym.js / homonym.js / idiom.js Structural Refactor

**antonym.js - CRITICAL structural changes:**

1. **Move `pairs` initialization from line 18 INTO `reset()`:**
```js
// BEFORE (line 18, outside reset):
pairs=[...ANTONYM_PAIRS].sort(()=>Math.random()-0.5).slice(0,10);

// AFTER (inside reset):
function reset(){
  const pool = getHanjaForGrade(Store.getGrade());
  const poolChars = new Set(pool.map(h => h.hanja));
  const gradedPairs = ANTONYM_PAIRS.filter(([a,b]) => poolChars.has(a) && poolChars.has(b));
  pairs = shuffle(gradedPairs).slice(0, Math.min(10, gradedPairs.length));
  // ... rest of reset
}
```

2. **Replace ALL `ALL_HANJA` references inside the game:**
- Line 54: `const ha=ALL_HANJA.find(x=>x.hanja===a);` -> use `pool.find(...)`
- Line 55: `const hb=ALL_HANJA.find(x=>x.hanja===b);` -> use `pool.find(...)`
- Line 59: `ALL_HANJA.filter(x=>x.hanja!==b&&x.hanja!==a)` -> use `pool.filter(...)`
- Line 86: `const ha=ALL_HANJA.find(x=>x.hanja===a);` -> use `pool.find(...)`
- Store `pool` as a module-scoped variable set in `reset()`.

**homonym.js - CRITICAL structural changes:**

1. **Move `eumMap` and `homSets` from lines 16-18 INTO `reset()`:**
```js
// BEFORE (lines 16-18, module scope):
const eumMap={};
ALL_HANJA.forEach(h=>{if(!eumMap[h.eum])eumMap[h.eum]=[];eumMap[h.eum].push(h);});
const homSets=Object.entries(eumMap).filter(([k,v])=>v.length>=2).map(([eum,chars])=>({eum,chars}));

// AFTER (inside reset):
function reset(){
  const pool = getHanjaForGrade(Store.getGrade());
  const eumMap = {};
  pool.forEach(h => { if(!eumMap[h.eum]) eumMap[h.eum] = []; eumMap[h.eum].push(h); });
  const homSets = Object.entries(eumMap).filter(([k,v]) => v.length >= 2).map(([eum,chars]) => ({eum,chars}));
  // ... rest of reset using homSets
}
```

2. **Replace ALL `ALL_HANJA` references inside the game:**
- Line 26: `ALL_HANJA[Math.floor(Math.random()*ALL_HANJA.length)]` -> use `pool[...]`
- Store `pool` as a variable accessible from `reset()` and inner functions.

**idiom.js - structural changes:**

1. **Move `allIdioms` from line 20 INTO `reset()`:**
```js
// BEFORE (line 20, outside reset):
const allIdioms=[...IDIOMS];

// AFTER (inside reset):
function reset(){
  const pool = getHanjaForGrade(Store.getGrade());
  const poolChars = new Set(pool.map(h => h.hanja));
  const gradedIdioms = IDIOMS.filter(idiom =>
    [...idiom.idiom].every(ch => poolChars.has(ch))
  );
  const allIdioms = gradedIdioms.length >= 3 ? gradedIdioms : [...IDIOMS]; // fallback
  qs = allIdioms.sort(() => Math.random() - 0.5);
  // ... rest of reset
}
```

**Acceptance criteria:**
- [ ] `antonym.js`: `pairs` is computed inside `reset()` from grade-filtered pool
- [ ] `antonym.js`: ALL 4 references to `ALL_HANJA` inside game functions replaced with `pool`
- [ ] `homonym.js`: `eumMap` and `homSets` computed inside `reset()` from grade-filtered pool
- [ ] `homonym.js`: ALL references to `ALL_HANJA` inside game functions replaced with `pool`
- [ ] `idiom.js`: `allIdioms` computed inside `reset()` from grade-filtered pool
- [ ] No module-level references to `ALL_HANJA` remain in any game file (only import of `getHanjaForGrade`)

---

### Issue 4: Daily Challenges and Multiplayer Grade Interaction

**Daily Challenges:**
- Daily challenges SHOULD be grade-filtered.
- Currently in `main.js` line 154: `questions = seededShuffle(ALL_HANJA, seed).slice(0, 10)`
- Change to: `questions = seededShuffle(getHanjaForGrade(Store.getGrade()), seed).slice(0, 10)`
- Also line 198: `generateDecoys(q, ALL_HANJA, 3, 'fullHunEum')` -> `generateDecoys(q, pool, 3, 'fullHunEum')`
- Daily challenge scores are stored separately in `daily_challenges` table (not in `scores`), so grade filtering on daily leaderboard is not needed unless we add one later.
- Add `grade` column to `daily_challenges` table to record the grade at time of play.

**Multiplayer:**
- **Decision: Option (b) - Room uses host's grade for all players.**
- Rationale: This preserves the shared seed mechanism (critical for fair multiplayer) and is simplest to implement. Players joining a room can see the host's grade before joining.
- Implementation:
  1. Add `grade` column to `rooms` table (set from host's grade when creating room)
  2. In `room-manager.js` `createRoom()`: include `grade: Store.getGrade()` in room data
  3. In room UI: display the room's grade so players know before joining
  4. In `game-sync.js` `generateSharedQuestions()`: accept grade parameter, use `getHanjaForGrade(grade)` instead of `ALL_HANJA`
  5. When game starts from room, pass `room.grade` to the game factory so it uses the room's grade instead of the player's personal grade

**Acceptance criteria:**
- [ ] Daily challenge uses grade-filtered pool
- [ ] Daily challenge records user's grade at time of play
- [ ] Multiplayer room stores host's grade
- [ ] Room UI shows the grade
- [ ] `generateSharedQuestions()` uses grade-filtered pool
- [ ] All players in a room get the same grade-filtered questions from shared seed

---

### Issue 5: fullHunEum Construction and Category Taxonomy

**fullHunEum:**
- Construction rule: `fullHunEum = hun + " " + eum` (always, for ALL characters including new ones)
- Example: `{hun: "여자", eum: "녀"}` -> `fullHunEum: "여자 녀"`
- For characters with multi-word hun from PDFs (e.g., "화합,화목할" or "인덕,근본"), use the FIRST hun before the comma: `fullHunEum = firstHun + " " + eum`
- The extraction script must handle this: `hun.split(',')[0].trim() + " " + eum`

**Category:**
- For the existing 97 characters: keep their current categories (숫자, 자연, 크기/방향, 사람, 개념, 가족, 방위, 동물, 신체, 생활, 기타, 계절)
- For ALL new characters (grades 5급 through 1급, approximately 3,400 characters): assign category `"일반"` (general)
- **Documented limitation:** Categories for new characters are all "일반". Future enhancement can add semantic categorization.
- The `HANJA_BY_CATEGORY` computed map will still work - it will just have a very large "일반" category.
- For the existing characters that are being re-tagged with grades, their categories MUST be preserved.

**Acceptance criteria:**
- [ ] All entries have `fullHunEum` = `hun + " " + eum`
- [ ] Multi-hun PDFs entries use first hun for fullHunEum
- [ ] Existing 97 chars keep their current category
- [ ] New chars all have `category: "일반"`
- [ ] `HANJA_BY_CATEGORY` still computed correctly

---

### Issue 9: Existing 97 Characters Grade Mapping

Not all 97 existing characters appear in the 8급/7급/6급/준5급 PDFs. Here is the complete mapping:

**8급 PDF (30 chars) - characters in current code:**
九, 金, 南, 男, 女, 東, 六, 母, 木, 門, 父, 北, 四, 三, 西, 水, 十, 五, 月, 二, 人, 日, 一, 子, 弟, 七, 土, 八, 兄, 火

**7급 PDF (20 chars) - characters in current code:**
江, 口, 內(NOT in code), 年, 大, 目, 白, 山, 上, 小, 手, 外, 右, 入, 足, 左, 中, 靑, 出, 下

**6급 PDF (20 chars) - characters in current code:**
犬(NOT in code), 己(NOT in code), 林, 馬, 名, 百, 生, 石, 先, 姓(NOT in code), 心, 羊, 魚, 玉, 牛, 耳, 地, 川, 千, 天

**준5급 PDF (30 chars) - characters in current code:**
車, 巾(NOT in code), 古, 工(NOT in code), 今, 同(NOT in code), 力, 立, 末(NOT in code), 文, 方, 本, 夫(NOT in code), 不, 士(NOT in code), 夕(NOT in code), 世, 少, 食, 央(NOT in code), 王, 位(NOT in code), 衣, 字, 自(NOT in code), 正, 主(NOT in code), 寸(NOT in code), 向, 休

**Characters in current code NOT in 8-준5급 PDFs (must be in 5급+):**
- 萬(일만 만) -> 5급 PDF: 萬 일만 만 -- CONFIRMED 5급
- 光(빛 광) -> 5급 PDF: 光 빛 광 -- CONFIRMED 5급
- 國(나라 국) -> 5급 PDF: 國 나라 국 -- CONFIRMED 5급
- 市(저자 시) -> 5급 PDF: 市 지자 시 -- CONFIRMED 5급
- 草(풀 초) -> 5급 PDF: 草 풀 초 -- CONFIRMED 5급
- 太(클 태) -> 5급 PDF: 太 클 태 -- CONFIRMED 5급
- 長(긴 장) -> 5급 PDF: 長 긴 장 -- CONFIRMED 5급
- 合(합할 합) -> 5급 PDF: 合 합할 합 -- CONFIRMED 5급
- 春(봄 춘) -> 5급 PDF: 春 봄 춘 -- CONFIRMED 5급
- 夏(여름 하) -> 5급 PDF: 夏 여름 하 -- CONFIRMED 5급
- 秋(가을 추) -> 5급 PDF: 秋 가을 추 -- CONFIRMED 5급
- 冬(겨울 동) -> 5급 PDF: 冬 겨울 동 -- CONFIRMED 5급

**Result:** All 97 existing characters have a grade mapping. Some are spread across 8급 through 5급.

---

### Issue 10: Current Count is 97, not 96

Confirmed: `HANJA_CORE` has 51 entries (lines 1-52), `HANJA_EXTRA` has 46 entries (lines 54-101). Total = 97. The plan text has been corrected throughout.

---

## Work Objectives

### Core Objective
Add a 13-grade system to the Hanja Olympics app where users select their grade, games filter questions by grade, leaderboards show same-grade users, and per-hanja statistics are tracked.

### Deliverables
1. Expanded hanja data file with grade info for ALL characters from 13 PDFs (~3500 chars)
2. Grade selection UI (post-login mandatory, profile-changeable)
3. Grade-filtered question pools for all 8 games + daily challenge + multiplayer
4. Grade-filtered leaderboard with rank-point composite scoring
5. Per-question answer logging with statistics UI in profile
6. Supabase schema migrations (DDL)

### Definition of Done
- User can select a grade on first login and change it in profile
- All 8 games only show hanja from user's grade and below
- Daily challenge uses grade-filtered pool
- Multiplayer rooms use host's grade for all players
- Leaderboard shows only same-grade users with correct composite scoring
- Profile shows top-10 most-missed and most-correct hanja, grade accuracy chart, per-game stats
- All Supabase tables created with proper RLS policies
- Existing 97 characters have correct grades and updated hun from PDFs

---

## Guardrails

### Must Have
- Grade field on every hanja entry in the data file
- Backward compatibility: existing users without grade default to 8급
- All 8 games must respect grade filtering
- Daily challenge must respect grade filtering
- Multiplayer rooms must use host's grade
- Leaderboard grade filter must prevent cross-grade comparison
- Answer logging must not impact game performance (async fire-and-forget)
- Hun values updated to match official PDF for existing characters
- `fullHunEum` = `hun + " " + eum` for all entries

### Must NOT Have
- DO NOT remove existing hanja data structure fields (hanja, hun, eum, fullHunEum, category)
- DO NOT change the Three.js game rendering logic
- DO NOT change authentication flow (Supabase auth stays as-is)
- DO NOT remove existing score records from the database
- DO NOT change the game scoring algorithms (medal thresholds, etc.)
- DO NOT break the shared seed mechanism for multiplayer (must use same seed + same grade = same questions)

---

## Task Flow and Dependencies

```
TASK 0: PDF Data Extraction (Node.js script with pdftotext or pdf-parse)
    |
    v
TASK 1: Expand hanja.js data file + hun discrepancy fixes
    |
    v
TASK 2: Supabase Schema Migration  <--- Can run in parallel with TASK 1
    |
    v
TASK 3: Grade Selection UI + Store methods
    |
    +---> TASK 4: Grade filtering in all 8 games + structural refactors (depends on 1, 3)
    |
    +---> TASK 5: Daily Challenge + Multiplayer grade integration (depends on 1, 3)
    |
    +---> TASK 6: Grade-filtered Leaderboard (depends on 2, 3)
    |
    +---> TASK 7: Answer Logging + Statistics UI (depends on 2, 3)
    |
    v
TASK 8: Study Mode Grade Filter + Integration Testing
```

---

## Detailed Tasks

### TASK 0: PDF Data Extraction Script

**Goal:** Extract all hanja characters from 13 PDF files and produce a structured JS data array.

**Files to create:**
- `/Users/tykimos/vibecode/hanja/scripts/extract-hanja.js` (Node.js extraction script)

**Method:** Use `pdftotext` CLI (from poppler). If not available, install `pdf-parse` npm package.

**Script requirements:**
1. For each of the 13 PDF files in `/Users/tykimos/vibecode/hanja/words/`:
   - Extract text using `pdftotext -layout` or `pdf-parse`
   - Parse lines matching the pattern: `{hanja_char} {hun_text} {eum_text}`
   - Handle multi-word hun (e.g., "화합,화목할") by keeping full hun
   - Handle parenthetical notes in hun (e.g., "메(뫼)") by keeping full text
2. Assign grade based on filename (e.g., "8급 신출한자 훈음표.pdf" -> grade "8급")
3. **Validation step:** For each grade, compare extracted count with expected count:
   ```
   8급:30, 7급:20, 6급:20, 준5급:30, 5급:150, 준4급:150, 4급:200,
   준3급:200, 3급:200, 준2급:500, 2급:500, 준1급:500, 1급:1000
   ```
   If mismatch, print error with grade name, expected count, actual count, and STOP.
4. Check for duplicate characters across grades. If found, print duplicates and STOP.
5. Output: JSON file `/Users/tykimos/vibecode/hanja/scripts/hanja-all-grades.json`

**Output format:**
```json
[
  {"hanja":"九","hun":"아홉","eum":"구","grade":"8급"},
  {"hanja":"金","hun":"쇠","eum":"금","grade":"8급"},
  ...
]
```

**Acceptance criteria:**
- [ ] Script runs: `node scripts/extract-hanja.js`
- [ ] Validation passes: each grade count matches expected
- [ ] No duplicate characters across grades
- [ ] Total output: 3500 characters
- [ ] Output JSON file is generated

---

### TASK 1: Expand and Restructure hanja.js

**Goal:** Replace the current 97-character dataset with a comprehensive grade-tagged dataset of ~3500 characters, fixing hun discrepancies.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/data/hanja.js`

**Changes:**

1. **Update existing 97 characters with grade field and hun fixes:**
   Apply these hun corrections (PDF is canonical):
   - `女`: hun "계집" -> "여자", eum stays "여"
   - `母`: hun "어미" -> "어머니"
   - `兄`: hun "형" -> "맏"
   - `父`: hun "아비" -> "아버지"
   - `不`: hun "아닐" -> "아니"
   - `食`: hun "밥" -> "먹을"
   - `世`: hun "인간" -> "세상"
   - `六`: eum stays "육" (두음법칙; PDF says 륙)
   - `車`: eum stays "차" (modern standard; PDF says 거)

   For each updated hun, also update `fullHunEum` = `hun + " " + eum`:
   - `女`: fullHunEum "계집 여" -> "여자 여"
   - `母`: fullHunEum "어미 모" -> "어머니 모"
   - `兄`: fullHunEum "형 형" -> "맏 형"
   - `父`: fullHunEum "아비 부" -> "아버지 부"
   - `不`: fullHunEum "아닐 불" -> "아니 불"
   - `食`: fullHunEum "밥 식" -> "먹을 식"
   - `世`: fullHunEum "인간 세" -> "세상 세"

2. **Add grade field to all 97 existing characters** based on Issue 9 mapping above.

3. **Add ALL new characters from extracted JSON**, each with:
   - `hanja`: the character
   - `hun`: from PDF (for multi-hun, use first before comma for display but store full)
   - `eum`: from PDF
   - `fullHunEum`: `hun.split(',')[0].trim() + " " + eum`
   - `category`: `"일반"` for all new characters
   - `grade`: from extraction

4. **New exports:**
```js
export const GRADE_ORDER = ['8급','7급','6급','준5급','5급','준4급','4급','준3급','3급','준2급','2급','준1급','1급'];

export function getHanjaForGrade(userGrade) {
  const idx = GRADE_ORDER.indexOf(userGrade);
  if (idx === -1) return ALL_HANJA;
  const eligibleGrades = new Set(GRADE_ORDER.slice(0, idx + 1));
  return ALL_HANJA.filter(h => eligibleGrades.has(h.grade));
}
```

5. **Keep backward compatibility:**
   - `HANJA_CORE` and `HANJA_EXTRA` still exported (with grade field added)
   - `ALL_HANJA` still exported as full array
   - `HANJA_BY_CATEGORY` still computed

**Acceptance criteria:**
- [ ] All ~3500 characters are in the data file with correct grade
- [ ] All 7 hun discrepancies fixed per table above
- [ ] All 7 corresponding fullHunEum values updated
- [ ] `HANJA_CORE`, `HANJA_EXTRA`, `ALL_HANJA` still exported (backward compat)
- [ ] `getHanjaForGrade('8급')` returns exactly 30 characters
- [ ] `getHanjaForGrade('7급')` returns exactly 50 characters (30+20)
- [ ] `getHanjaForGrade('준5급')` returns exactly 100 characters
- [ ] `getHanjaForGrade('1급')` returns all ~3500 characters
- [ ] `GRADE_ORDER` is exported
- [ ] `HANJA_BY_CATEGORY` still works
- [ ] `fullHunEum` = `hun + " " + eum` for ALL entries
- [ ] New characters have `category: "일반"`
- [ ] Existing characters retain their original categories
- [ ] `vite build` succeeds

---

### TASK 2: Supabase Schema Migration

**Goal:** Add grade columns and new tables to support the grade system, answer logging, daily challenge grades, and multiplayer grades.

**File to modify:**
- `/Users/tykimos/vibecode/hanja/schema.sql` (append new migration SQL)

**DDL statements:**

```sql
-- 1. Add grade column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '8급';

-- 2. Add grade column to scores (record user's grade at time of play)
ALTER TABLE scores ADD COLUMN IF NOT EXISTS grade TEXT;

-- 3. Add grade column to daily_challenges
ALTER TABLE daily_challenges ADD COLUMN IF NOT EXISTS grade TEXT;

-- 4. Add grade column to rooms (host's grade, used for all players)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '8급';

-- 5. Create answer_log table for per-question tracking
CREATE TABLE IF NOT EXISTS answer_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  hanja_char TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  user_grade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create hanja_stats table for aggregated per-character stats
CREATE TABLE IF NOT EXISTS hanja_stats (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hanja_char TEXT NOT NULL,
  correct_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hanja_char)
);

-- 7. RLS policies for answer_log
ALTER TABLE answer_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own answers read" ON answer_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own answers insert" ON answer_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. RLS policies for hanja_stats
ALTER TABLE hanja_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stats read" ON hanja_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own stats insert" ON hanja_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own stats update" ON hanja_stats FOR UPDATE USING (auth.uid() = user_id);

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_answer_log_user ON answer_log(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_log_user_game ON answer_log(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_answer_log_user_hanja ON answer_log(user_id, hanja_char);
CREATE INDEX IF NOT EXISTS idx_hanja_stats_user ON hanja_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_grade ON scores(grade, game_id);
CREATE INDEX IF NOT EXISTS idx_scores_grade_game_score ON scores(grade, game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade);

-- 10. Supabase function to upsert hanja_stats (atomic increment)
CREATE OR REPLACE FUNCTION upsert_hanja_stat(
  p_user_id UUID,
  p_hanja_char TEXT,
  p_is_correct BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO hanja_stats (user_id, hanja_char, correct_count, wrong_count, last_attempt_at)
  VALUES (
    p_user_id,
    p_hanja_char,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    NOW()
  )
  ON CONFLICT (user_id, hanja_char) DO UPDATE SET
    correct_count = hanja_stats.correct_count + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    wrong_count = hanja_stats.wrong_count + CASE WHEN p_is_correct THEN 0 ELSE 1 END,
    last_attempt_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. answer_log retention: auto-delete entries older than 90 days
-- Create a scheduled function (run via Supabase cron or pg_cron)
CREATE OR REPLACE FUNCTION cleanup_old_answer_logs() RETURNS VOID AS $$
BEGIN
  DELETE FROM answer_log WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To schedule: SELECT cron.schedule('cleanup-answer-logs', '0 3 * * 0', 'SELECT cleanup_old_answer_logs()');
-- Note: pg_cron must be enabled in Supabase dashboard first
```

**Acceptance criteria:**
- [ ] `profiles` table has `grade` column with default '8급'
- [ ] `scores` table has `grade` column (nullable for old records)
- [ ] `daily_challenges` table has `grade` column
- [ ] `rooms` table has `grade` column with default '8급'
- [ ] `answer_log` table created with proper schema
- [ ] `hanja_stats` table created with proper schema
- [ ] All RLS policies in place
- [ ] `upsert_hanja_stat` function works correctly
- [ ] Composite index `idx_scores_grade_game_score` created for leaderboard performance
- [ ] `cleanup_old_answer_logs` function created for retention
- [ ] All other indexes created

---

### TASK 3: Grade Selection UI + Store Methods

**Goal:** Add grade selection screen shown after first login, and allow grade changes from profile.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/systems/store.js` -- add grade methods
- `/Users/tykimos/vibecode/hanja/src/screens/auth.js` -- add post-login grade check
- `/Users/tykimos/vibecode/hanja/src/main.js` -- add grade selection routing
- `/Users/tykimos/vibecode/hanja/src/screens/profile.js` -- add grade change UI
- `/Users/tykimos/vibecode/hanja/index.html` -- add grade selection screen HTML
- `/Users/tykimos/vibecode/hanja/src/styles.css` -- add grade selection styles

**Files to create:**
- `/Users/tykimos/vibecode/hanja/src/screens/grade-select.js`

**Store.js new methods:**
```js
getGrade() { return this._profile?.grade || '8급'; },

async setGrade(grade) {
  if (!this._user) return;
  const { error } = await supabase.from('profiles')
    .update({ grade })
    .eq('id', this._user.id);
  if (!error) this._profile.grade = grade;
  return { error };
},

hasGradeSet() { return this._profile?.grade && this._profile.grade !== null; },
```

**Grade Selection Screen (`grade-select.js`):**
- Show 13 grade buttons in a grid (4 columns)
- Each button: grade name + character count (e.g., "8급 (30자)")
- Visual grouping: 초급 (8-6급), 중급 (준5-4급), 고급 (준3-2급), 최고급 (준1-1급)
- On selection: call `Store.setGrade(grade)` then navigate to hub
- Brief explanation text: "등급을 선택하면 해당 등급 이하의 한자가 출제됩니다"

**Auth flow change:**
- After successful login/signup, check `Store.hasGradeSet()`
- If no grade set -> show grade selection screen
- If grade set -> show hub (existing behavior)

**Profile grade change:**
- Add "등급 변경" button in profile
- Opens modal/inline grade selector (same grid as initial selection)
- On change: update grade, refresh profile display

**index.html additions:**
```html
<!-- Grade Selection -->
<div class="screen" id="screen-grade-select">
  <div class="title-lg">등급 선택</div>
  <div class="subtitle">자신의 한자 실력에 맞는 등급을 선택하세요</div>
  <div id="grade-select-content"></div>
</div>
```

**Acceptance criteria:**
- [ ] New users see grade selection after signup
- [ ] Existing users without grade see grade selection after login
- [ ] Grade selection saves to Supabase `profiles.grade`
- [ ] `Store.getGrade()` returns current grade
- [ ] Profile shows current grade and allows changing it
- [ ] Grade change updates immediately without re-login

---

### TASK 4: Grade Filtering in All 8 Games (with Structural Refactors)

**Goal:** Each game uses only hanja from the user's grade and below. Fix module-level initialization issues.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/games/archery.js`
- `/Users/tykimos/vibecode/hanja/src/games/swimming.js`
- `/Users/tykimos/vibecode/hanja/src/games/weightlifting.js`
- `/Users/tykimos/vibecode/hanja/src/games/gymnastics.js`
- `/Users/tykimos/vibecode/hanja/src/games/marathon.js`
- `/Users/tykimos/vibecode/hanja/src/games/antonym.js` **(STRUCTURAL REFACTOR)**
- `/Users/tykimos/vibecode/hanja/src/games/idiom.js` **(STRUCTURAL REFACTOR)**
- `/Users/tykimos/vibecode/hanja/src/games/homonym.js` **(STRUCTURAL REFACTOR)**

**Per-game changes pattern (for 5 basic games: archery, swimming, weightlifting, gymnastics, marathon):**
```js
// BEFORE:
import { ALL_HANJA } from '../data/hanja.js';
// in reset():
qs = shuffle(ALL_HANJA).slice(0, 10);

// AFTER:
import { getHanjaForGrade } from '../data/hanja.js';
import Store from '../systems/store.js';
// in reset():
const pool = getHanjaForGrade(Store.getGrade());
qs = shuffle(pool).slice(0, 10);
```

Also ensure `generateDecoys()` calls pass the graded `pool` instead of `ALL_HANJA`.

**antonym.js - Structural refactor (per Issue 3 above):**
1. Remove line 18 (`pairs=[...ANTONYM_PAIRS]...`)
2. Change import from `ALL_HANJA` to `getHanjaForGrade`
3. Add `import Store from '../systems/store.js';` if not already present
4. Add `let pool;` at module scope
5. In `reset()`: compute `pool`, filter antonym pairs by grade, compute `pairs`
6. In `setupQ()`: replace all `ALL_HANJA.find(...)` with `pool.find(...)`
7. In `setupQ()`: replace `ALL_HANJA.filter(...)` with `pool.filter(...)`
8. In `updateUI()`: replace `ALL_HANJA.find(...)` with `pool.find(...)`

**homonym.js - Structural refactor (per Issue 3 above):**
1. Remove lines 16-18 (`eumMap`, `homSets`)
2. Change import from `ALL_HANJA` to `getHanjaForGrade`
3. In `reset()`: build `eumMap` and `homSets` from graded pool
4. In `reset()` inner function for decoys (line 26): use `pool` instead of `ALL_HANJA`

**idiom.js - Structural refactor (per Issue 3 above):**
1. Remove line 20 (`const allIdioms=[...IDIOMS]`)
2. Change import from `ALL_HANJA` to `getHanjaForGrade`
3. In `reset()`: compute graded idioms from pool, with fallback

**Antonym/Idiom special handling:**
- If filtered pairs/idioms < 5, use ALL available (don't filter by grade) and show a hint: "등급 범위 확장됨"
- This prevents empty/boring games at low grades

**Acceptance criteria:**
- [ ] All 8 games only use hanja from user's grade and below
- [ ] `antonym.js`: `pairs` computed inside `reset()`, all `ALL_HANJA` references removed
- [ ] `homonym.js`: `eumMap`/`homSets` computed inside `reset()`, all `ALL_HANJA` references removed
- [ ] `idiom.js`: `allIdioms` computed inside `reset()`, all `ALL_HANJA` references removed
- [ ] 8급 user sees only 30 characters in basic games
- [ ] Antonym game gracefully handles small pools (< 5 pairs -> use all available)
- [ ] Idiom game gracefully handles small pools (< 3 idioms -> use all available)
- [ ] `generateDecoys()` receives correct filtered pool in ALL games
- [ ] No game file has module-level `ALL_HANJA` usage (only `getHanjaForGrade` import)
- [ ] Games still function correctly with larger pools (higher grades)
- [ ] `vite build` succeeds

---

### TASK 5: Daily Challenge + Multiplayer Grade Integration

**Goal:** Grade-filter daily challenges and multiplayer rooms.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/main.js` -- daily challenge grade filtering
- `/Users/tykimos/vibecode/hanja/src/multiplayer/game-sync.js` -- grade-aware shared questions
- `/Users/tykimos/vibecode/hanja/src/multiplayer/room-manager.js` -- store grade in room
- `/Users/tykimos/vibecode/hanja/src/screens/room.js` -- display room grade

**Daily Challenge changes in `main.js`:**
```js
// BEFORE (line 154):
questions = seededShuffle(ALL_HANJA, seed).slice(0, 10);
// AFTER:
const pool = getHanjaForGrade(Store.getGrade());
questions = seededShuffle(pool, seed).slice(0, 10);

// BEFORE (line 198):
const decoys = generateDecoys(q, ALL_HANJA, 3, 'fullHunEum');
// AFTER:
const decoys = generateDecoys(q, pool, 3, 'fullHunEum');
```
Also in `_finish()`, update `saveDailyChallenge` to include grade.

**game-sync.js changes:**
```js
// BEFORE:
import { ALL_HANJA } from '../data/hanja.js';
export function generateSharedQuestions(seed, count = 10) {
  return seededShuffle(ALL_HANJA, seed).slice(0, count);
}

// AFTER:
import { getHanjaForGrade } from '../data/hanja.js';
export function generateSharedQuestions(seed, count = 10, grade = '8급') {
  const pool = getHanjaForGrade(grade);
  return seededShuffle(pool, seed).slice(0, count);
}
```

**room-manager.js changes:**
- In `createRoom()`: include `grade: Store.getGrade()` in room insert
- Make `room.grade` accessible to consumers

**room.js UI changes:**
- Display room grade badge: "[5급]" next to room code
- In join room screen: show the room's grade before player confirms join

**Acceptance criteria:**
- [ ] Daily challenge uses `getHanjaForGrade(Store.getGrade())`
- [ ] Daily challenge decoys use graded pool
- [ ] `saveDailyChallenge` records grade
- [ ] `generateSharedQuestions` accepts and uses grade parameter
- [ ] Room creation stores host's grade
- [ ] Room UI shows grade badge
- [ ] All players in room get same grade-filtered questions via shared seed

---

### TASK 6: Grade-Filtered Leaderboard with Composite Scoring

**Goal:** Leaderboard shows only same-grade users, with a new composite ranking system.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/systems/store.js` -- update `getLeaderboard()`, `saveScore()`
- `/Users/tykimos/vibecode/hanja/src/screens/leaderboard.js` -- add grade display and filtering

**Store.js changes:**

1. **`saveScore()` update** -- include user's current grade:
```js
async saveScore(gameId, score, total, medal, wrongAnswers) {
  if (!this._user) return;
  const { error } = await supabase.from('scores').insert({
    user_id: this._user.id,
    game_id: gameId,
    score, total,
    medal: medal || null,
    wrong_answers: wrongAnswers || [],
    grade: this._profile?.grade || '8급',  // NEW
  });
  return { error };
},
```

2. **`getLeaderboard()` update** -- filter by grade with composite scoring:

**Performance optimization for composite leaderboard (addresses Issue 8):**
Instead of 8 sequential Supabase queries, use a SINGLE query that fetches all scores for the grade, then compute rankings client-side:

```js
async getLeaderboard(gameId, grade) {
  const userGrade = grade || this._profile?.grade || '8급';

  if (!gameId || gameId === 'total') {
    // SINGLE query: fetch ALL scores for this grade across all games
    const { data } = await supabase.from('scores')
      .select('user_id, game_id, score, medal, profiles!inner(username, icon, grade)')
      .eq('profiles.grade', userGrade);

    // Compute best score per user per game (client-side)
    const gameIds = ['archery','swimming','weightlifting','gymnastics','marathon','antonym','idiom','homonym'];
    const bestPerUserGame = {}; // {userId: {gameId: {score, ...}}}

    (data || []).forEach(s => {
      const uid = s.user_id;
      const gid = s.game_id;
      if (!gameIds.includes(gid)) return;
      if (!bestPerUserGame[uid]) bestPerUserGame[uid] = { username: s.profiles.username, icon: s.profiles.icon };
      const ascending = gid === 'gymnastics';
      const prev = bestPerUserGame[uid][gid];
      if (!prev || (ascending ? s.score < prev : s.score > prev)) {
        bestPerUserGame[uid][gid] = s.score;
      }
    });

    // Compute rank-points per game
    const userPoints = {};
    gameIds.forEach(gid => {
      const ascending = gid === 'gymnastics';
      const scores = Object.entries(bestPerUserGame)
        .filter(([uid, d]) => d[gid] !== undefined)
        .map(([uid, d]) => ({ uid, score: d[gid] }))
        .sort((a, b) => ascending ? a.score - b.score : b.score - a.score);

      scores.forEach((s, i) => {
        const rank = i + 1;
        const points = rank <= 10 ? 11 - rank : 0;
        if (!userPoints[s.uid]) {
          userPoints[s.uid] = {
            username: bestPerUserGame[s.uid].username,
            icon: bestPerUserGame[s.uid].icon,
            totalPoints: 0,
            gameRanks: {}
          };
        }
        userPoints[s.uid].totalPoints += points;
        userPoints[s.uid].gameRanks[gid] = { rank, points };
      });
    });

    return Object.values(userPoints).sort((a, b) => b.totalPoints - a.totalPoints);
  } else {
    // Per-game: single query with grade filter
    const ascending = gameId === 'gymnastics';
    const { data } = await supabase.from('scores')
      .select('user_id, score, medal, profiles!inner(username, icon, grade)')
      .eq('game_id', gameId)
      .eq('profiles.grade', userGrade)
      .order('score', { ascending });

    const best = {};
    (data || []).forEach(s => {
      if (!best[s.user_id] || (ascending ? s.score < best[s.user_id].score : s.score > best[s.user_id].score)) {
        best[s.user_id] = {
          user_id: s.user_id,
          username: s.profiles.username,
          icon: s.profiles.icon,
          score: s.score,
          medal: s.medal
        };
      }
    });
    return Object.values(best).sort((a, b) => ascending ? a.score - b.score : b.score - a.score);
  }
},
```

**Leaderboard UI changes:**
- Show current user's grade at the top: "5급 리더보드"
- Composite tab shows: rank, user, total points, per-game rank breakdown
- Per-game tab unchanged but filtered by grade
- Old scores without grade: excluded from grade-filtered leaderboards (users must play after grade update to appear)

**Acceptance criteria:**
- [ ] Leaderboard only shows users of the same grade
- [ ] Composite scoring: 1st=10pts, 2nd=9pts, ..., 10th=1pt per game
- [ ] Total tab shows sum of rank-points across all 8 games
- [ ] **Composite leaderboard uses SINGLE Supabase query** (not 8 sequential ones)
- [ ] Per-game tabs show grade-filtered best scores
- [ ] Current grade displayed in leaderboard header
- [ ] Old scores without grade are excluded from filtered leaderboards

---

### TASK 7: Answer Logging + Statistics UI

**Goal:** Log every answer per question, aggregate stats, and display in profile.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/systems/store.js` -- add logging methods
- `/Users/tykimos/vibecode/hanja/src/screens/profile.js` -- add statistics display
- `/Users/tykimos/vibecode/hanja/src/styles.css` -- add stats styles
- All 8 game files -- add answer logging calls

**Store.js new methods:**
```js
// Log individual answer (fire-and-forget, non-blocking)
logAnswer(gameId, hanjaChar, isCorrect) {
  if (!this._user) return;
  const grade = this._profile?.grade || '8급';

  // Fire-and-forget: don't await
  supabase.from('answer_log').insert({
    user_id: this._user.id,
    game_id: gameId,
    hanja_char: hanjaChar,
    is_correct: isCorrect,
    user_grade: grade,
  });

  // Also update aggregated stats (fire-and-forget)
  supabase.rpc('upsert_hanja_stat', {
    p_user_id: this._user.id,
    p_hanja_char: hanjaChar,
    p_is_correct: isCorrect,
  });
},

async getMostMissed(limit = 10) { ... },
async getMostCorrect(limit = 10) { ... },
async getGradeAccuracy() { ... },
async getGameStats() { ... },
```

**answer_log retention (addresses Issue 7):**
- Raw `answer_log` entries auto-deleted after 90 days via `cleanup_old_answer_logs()` scheduled function
- Aggregated data in `hanja_stats` persists indefinitely (small table: max users * max chars rows)
- This prevents unbounded growth: at worst case, 1000 users * 100 answers/day * 90 days = 9M rows max

**Game integration for answer logging:**
Each game needs to call `Store.logAnswer()` when a question is answered:
```js
Store.logAnswer(gameId, currentQuestion.hanja, isCorrect);
```

**Specific integration points per game:**
- **archery.js**: In tap handler after correct/wrong determined
- **swimming.js**: In answer handler after correct/wrong determined
- **weightlifting.js**: In answer check after correct/wrong determined
- **gymnastics.js**: When card pair matched (both chars logged as correct) or mismatched (both as wrong)
- **marathon.js**: In wall answer handler
- **antonym.js**: In arrow hit handler (log both chars of the pair)
- **idiom.js**: In wall answer handler (log all 4 chars of the idiom)
- **homonym.js**: In answer handler

**Profile Statistics UI:**
```
[Current grade badge: 5급]

--- 자주 틀리는 한자 Top 10 ---
1. 萬 (일만 만) - 12회 오답 / 3회 정답 (20% 정답률)
...

--- 잘 맞추는 한자 Top 10 ---
1. 一 (한 일) - 25회 정답 / 0회 오답 (100%)
...

--- 등급별 정답률 ---
[Bar chart - CSS only]
8급: ████████░░ 80%
7급: ██████░░░░ 60%
...

--- 게임별 평균 점수 ---
양궁: 평균 7.5점 (15게임)
...
```

**Acceptance criteria:**
- [ ] Every answer in every game is logged to `answer_log`
- [ ] `hanja_stats` is updated atomically via `upsert_hanja_stat` RPC
- [ ] Answer logging does not block game flow (fire-and-forget)
- [ ] Profile shows top 10 most-missed hanja with counts and accuracy
- [ ] Profile shows top 10 most-correct hanja with counts and accuracy
- [ ] Profile shows per-grade accuracy as horizontal bar chart
- [ ] Profile shows per-game average score and game count
- [ ] Profile shows current grade badge prominently
- [ ] `answer_log` has 90-day retention policy via cleanup function
- [ ] `hanja_stats` persists indefinitely (small footprint)

---

### TASK 8: Study Mode Grade Filter + Integration Testing

**Goal:** Update study mode to filter by grade, show grade in hub, and verify end-to-end.

**Files to modify:**
- `/Users/tykimos/vibecode/hanja/src/screens/study.js` -- add grade filtering
- `/Users/tykimos/vibecode/hanja/src/screens/hub.js` -- show grade in header

**Study mode changes:**
- Add grade-based filter alongside existing category filter
- Show grade badge next to each hanja card
- Default filter: user's current grade and below
- Option to view all grades for exploration

**Hub changes:**
- Show current grade next to username in hub header: "username [5급]"

**Integration testing checklist:**
- [ ] Fresh signup -> grade selection -> hub works
- [ ] Existing user login -> grade selection (if not set) works
- [ ] All 8 games run with 8급 (minimum 30 chars)
- [ ] All 8 games run with 1급 (maximum ~3500 chars)
- [ ] Antonym game works with 8급 (should have pairs: 上/下, 大/小, 火/水, 東/西, 南/北, 兄/弟, 男/女, 父/母 = 8 pairs)
- [ ] Idiom game works with 8급 (may need fallback - none of the 5 idioms use only 8급 chars)
- [ ] Homonym game works with 8급 (need >=2 chars with same eum from 30 chars)
- [ ] Daily challenge uses grade-filtered pool
- [ ] Multiplayer room shows grade, uses host's grade for questions
- [ ] Leaderboard shows correct grade filter
- [ ] Composite scoring calculates correctly (single query, not 8)
- [ ] Profile stats display correctly
- [ ] Grade change in profile takes effect immediately in all games
- [ ] `vite build` succeeds without errors
- [ ] Mobile layout works for grade selection grid (320px-428px)

---

## Commit Strategy

```
Commit 1: "feat: add PDF extraction script and validate all 13 grade PDFs"
  - TASK 0: scripts/extract-hanja.js, scripts/hanja-all-grades.json

Commit 2: "feat: expand hanja.js to ~3500 chars with grade tags, fix hun discrepancies"
  - TASK 1: hanja.js expansion, grade utility functions, hun fixes

Commit 3: "feat: add Supabase schema for grades, answer logging, retention"
  - TASK 2: schema.sql updates

Commit 4: "feat: add grade selection UI and Store grade methods"
  - TASK 3: grade-select.js, store.js, auth.js, profile.js, index.html, styles.css

Commit 5: "feat: grade-filter all 8 games, refactor antonym/homonym/idiom init"
  - TASK 4: all 8 game files structural refactors

Commit 6: "feat: grade-filter daily challenges and multiplayer rooms"
  - TASK 5: main.js, game-sync.js, room-manager.js, room.js

Commit 7: "feat: grade-filtered leaderboard with composite scoring (single query)"
  - TASK 6: store.js leaderboard methods, leaderboard.js

Commit 8: "feat: answer logging, statistics display, 90-day retention"
  - TASK 7: store.js logging methods, profile.js stats UI, game answer hooks

Commit 9: "feat: study mode grade filter, hub grade display, integration testing"
  - TASK 8: study.js, hub.js, testing fixes
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PDF extraction errors (wrong grade assignment) | Medium | High | Validation step in extraction script: count per grade must match PDF title |
| Hun discrepancy missed | Low | Medium | Complete discrepancy table in this plan as checklist |
| Large data file (~3500 entries) impacts load time | Medium | Medium | Static JS; Vite tree-shakes; gzip handles ~100KB |
| Module-level init not fully refactored | Medium | High | Explicit list of all lines to change in Issue 3 section |
| Low-grade users have too few antonym/idiom pairs | High | Medium | Fallback: if < 5 pairs, use ALL available pairs |
| Composite leaderboard too slow | Medium | Medium | Single query approach (Issue 8) instead of 8 sequential |
| answer_log table grows unbounded | Medium | Medium | 90-day retention cleanup function (Issue 7) |
| Multiplayer grade mismatch confusion | Medium | Low | Room UI shows grade badge; host's grade used for all |
| Daily challenge changes break streaks | Low | Medium | Grade change doesn't affect streak counting (separate table) |
| Existing users lose leaderboard position | Medium | High | Old scores without grade excluded; users re-play to appear |

---

## File Change Summary

| File | Action | Task |
|------|--------|------|
| `scripts/extract-hanja.js` | **NEW** - PDF extraction script | T0 |
| `scripts/hanja-all-grades.json` | **NEW** - Extracted data | T0 |
| `src/data/hanja.js` | Major rewrite (~3500 chars, grade field, hun fixes) | T1 |
| `schema.sql` | Append migration SQL (grades, answer_log, retention) | T2 |
| `src/screens/grade-select.js` | **NEW** - Grade selection screen | T3 |
| `src/systems/store.js` | Add grade, logging, stats, leaderboard methods | T3, T6, T7 |
| `src/screens/auth.js` | Post-login grade check redirect | T3 |
| `src/screens/profile.js` | Grade badge, change button, statistics UI | T3, T7 |
| `index.html` | Add grade-select screen div | T3 |
| `src/styles.css` | Grade selection styles, stats styles | T3, T7 |
| `src/games/archery.js` | Use graded pool + answer logging | T4, T7 |
| `src/games/swimming.js` | Use graded pool + answer logging | T4, T7 |
| `src/games/weightlifting.js` | Use graded pool + answer logging | T4, T7 |
| `src/games/gymnastics.js` | Use graded pool + answer logging | T4, T7 |
| `src/games/marathon.js` | Use graded pool + answer logging | T4, T7 |
| `src/games/antonym.js` | **STRUCTURAL REFACTOR** + graded pool + logging | T4, T7 |
| `src/games/idiom.js` | **STRUCTURAL REFACTOR** + graded pool + logging | T4, T7 |
| `src/games/homonym.js` | **STRUCTURAL REFACTOR** + graded pool + logging | T4, T7 |
| `src/main.js` | Grade routing + daily challenge grade filter | T3, T5 |
| `src/multiplayer/game-sync.js` | Grade-aware shared questions | T5 |
| `src/multiplayer/room-manager.js` | Store grade in room | T5 |
| `src/screens/room.js` | Display room grade | T5 |
| `src/screens/leaderboard.js` | Grade filter display | T6 |
| `src/screens/hub.js` | Show grade in header | T8 |
| `src/screens/study.js` | Grade filter for study cards | T8 |

**Total: 25 files modified/created (22 modified, 3 new)**
