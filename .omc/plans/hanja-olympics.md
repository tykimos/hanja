# Implementation Plan: Hanja Olympics (한자 올림픽)

## Context

### Original Request
Build a single-file (`index.html`) Hanja learning game platform themed as the Olympics. No external dependencies. All CSS and JS embedded. The game covers 준5급 hanja characters with 5 Olympic-themed game modes, a user system with localStorage, and a leaderboard.

### Source Material
- PRD at `/Users/tykimos/vibecode/hanja/prd.md`
- Three study sheet images (`IMG_5978.jpg`, `IMG_5979.jpg`, `IMG_5980.jpg`) showing 준5급 hanja with hun/eum readings, antonym pairs, and four-character idioms.

### Research Findings
From the study sheet images:
- Image 1: Complete 준5급 character chart with hun and eum for ~95 characters
- Image 2: Antonym pairs (반의자), same-sound different-meaning characters (이음동자)
- Image 3: Synonyms (유의어), antonyms (반의어), four-character idioms (사자성어)

---

## Work Objectives

### Core Objective
Deliver a fully functional, single-file `index.html` Hanja Olympics game platform that runs in any modern browser with zero dependencies.

### Deliverables
1. Single `index.html` file (~4000-5000 lines) containing all HTML, CSS, and JavaScript
2. Complete hanja dataset with accurate hun/eum for all characters, with `category` field on each entry
3. Index maps (`HANJA_BY_CHAR`, `HANJA_BY_CATEGORY`) for O(1) lookups
4. Five fully playable Olympic game modes using a shared game engine interface
5. User registration/login with localStorage persistence
6. Medal system with leaderboard including ranking change tracking
7. Daily Challenge mode (일일 도전) with streak tracking
8. Web Audio API oscillator-based sound effects (no external audio files)
9. Mobile-first responsive design with Olympic theming

### Definition of Done
- Opens in Chrome/Safari/Firefox with no console errors
- All 5 games playable start-to-finish with medal awards
- Sound effects play on correct/wrong/medal events via Web Audio API
- Daily Challenge accessible with consecutive-day streak tracking
- User data persists across browser sessions
- Responsive from 320px to 1200px width
- All Korean UI text is correct and natural
- Touch-friendly (44px minimum tap targets)
- All game engines implement the shared `{ init(container), start(), cleanup(), getResult() }` interface
- AbortController used for event listener cleanup on screen transitions

---

## Must Have

1. All ~95 hanja characters with correct hun and eum (see audited data below)
2. Every hanja entry includes a `category` field for Study Mode filtering
3. Index maps: `HANJA_BY_CHAR` (Map<string, HanjaEntry>) and `HANJA_BY_CATEGORY` (Map<string, HanjaEntry[]>) for O(1) lookups
4. Shared game engine interface: `{ init(container), start(), cleanup(), getResult() }` contract
5. AbortController for event listener cleanup between screen transitions
6. Five working game modes with distinct mechanics
7. Medal system (gold/silver/bronze) with defined thresholds
8. User registration, login, and profile with localStorage
9. Leaderboard sorted by medal points with ranking change tracking (순위 변동 표시)
10. Daily Challenge (일일 도전): 매일 랜덤 10문제, 연속 출석 추적
11. Web Audio API oscillator-based sound effects: `playSound('correct')`, `playSound('wrong')`, `playSound('medal')`
12. Olympic color theme and responsive layout with `clamp()` for hanja font sizing
13. Korean language UI throughout
14. Game result persistence per user
15. Learning progress tracking via `encounteredCharacters: Set<charId>` in user data
16. 入(들 입) included in HANJA_EXTRA to complete the 出↔入 antonym pair

## Must NOT Have

1. No external CDN links, no `<script src>` or `<link href>` to external resources
2. No server-side code or API calls
3. No build tools or compilation steps required
4. No frameworks (React, Vue, etc.)
5. No third-party font loading (use system fonts + CSS for brush-style effect)
6. No external audio files (use Web Audio API oscillator-based synthesis only)
7. No multiple files -- everything in one `index.html`

---

## File Structure

```
/Users/tykimos/vibecode/hanja/
  index.html          <-- THE deliverable (single file, ~4500 lines)
  prd.md              <-- Reference (unchanged)
  IMG_5978.jpg        <-- Reference (unchanged)
  IMG_5979.jpg        <-- Reference (unchanged)
  IMG_5980.jpg        <-- Reference (unchanged)
```

### Internal Structure of index.html

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>한자 올림픽</title>
  <style>
    /* ===== SECTION 1: CSS Reset & Variables (~50 lines) ===== */
    /* ===== SECTION 2: Typography & Base Styles (~80 lines) ===== */
    /* ===== SECTION 3: Layout Components (~150 lines) ===== */
    /* ===== SECTION 4: Screen-specific Styles (~300 lines) ===== */
    /* ===== SECTION 5: Game-specific Styles (~250 lines) ===== */
    /* ===== SECTION 6: Animations & Keyframes (~100 lines) ===== */
    /* ===== SECTION 7: Responsive Breakpoints (~100 lines) ===== */
  </style>
</head>
<body>
  <!-- ===== SECTION 8: HTML Screens (~500 lines) ===== -->
  <script>
    /* ===== SECTION 9: Hanja Data + Index Maps (~300 lines) ===== */
    /* ===== SECTION 10: Web Audio API Sound System (~80 lines) ===== */
    /* ===== SECTION 11: App State & Storage (~180 lines) ===== */
    /* ===== SECTION 12: Router / Screen Manager with AbortController (~120 lines) ===== */
    /* ===== SECTION 13: Auth System (~120 lines) ===== */
    /* ===== SECTION 14: Shared Game Engine Interface (~60 lines) ===== */
    /* ===== SECTION 15: Game Engine - Archery (~150 lines) ===== */
    /* ===== SECTION 16: Game Engine - Swimming (~150 lines) ===== */
    /* ===== SECTION 17: Game Engine - Weightlifting (~130 lines) ===== */
    /* ===== SECTION 18: Game Engine - Gymnastics (~200 lines) ===== */
    /* ===== SECTION 19: Game Engine - Marathon (~160 lines) ===== */
    /* ===== SECTION 20: Daily Challenge (일일 도전) (~120 lines) ===== */
    /* ===== SECTION 21: Medal & Score System (~100 lines) ===== */
    /* ===== SECTION 22: Leaderboard with Rank Change Tracking (~120 lines) ===== */
    /* ===== SECTION 23: Profile (~100 lines) ===== */
    /* ===== SECTION 24: Study Mode / Flashcards (~120 lines) ===== */
    /* ===== SECTION 25: UI Helpers & Animations (~100 lines) ===== */
    /* ===== SECTION 26: Init & Event Binding (~80 lines) ===== */
  </script>
</body>
</html>
```

---

## Detailed Data Model

### TASK 1: Hanja Character Database (with category field and audited hun/eum)

Every character entry follows this structure:

```javascript
{ id: "大", hanja: "大", hun: "큰", eum: "대", fullHunEum: "큰 대", level: "core", category: "크기/방향" }
```

- `id`: Unique identifier (same as hanja character)
- `hanja`: The Chinese character
- `hun`: Korean meaning keyword (the 훈) -- AUDITED for standard 준5급 readings
- `eum`: Korean reading/pronunciation (the 음)
- `fullHunEum`: Combined display string "훈 음" format
- `level`: "core" (준5급 50자) or "extra" (additional ~46자)
- `category`: Category string for Study Mode filtering

#### AUDITED Character List (Core 50 -- 준5급 배정한자)

**CRITICAL HUN/EUM CORRECTIONS (from critic review):**
- 山 = "뫼 산" (NOT "메 산"). "뫼" is the standard 준5급 hun reading.
- 上 = "위 상" (NOT "윗 상"). "위" is the standard form.
- 出 = "날 출" -- "날" here means "to go out/exit"
- 生 = "날 생" -- "날" here means "to be born"
- 方 = "모 방" -- "모" means "direction/side"

```javascript
const HANJA_DATA = [
  // === Numbers (숫자) 13자 ===
  { id: "一", hanja: "一", hun: "한", eum: "일", fullHunEum: "한 일", level: "core", category: "숫자" },
  { id: "二", hanja: "二", hun: "두", eum: "이", fullHunEum: "두 이", level: "core", category: "숫자" },
  { id: "三", hanja: "三", hun: "석", eum: "삼", fullHunEum: "석 삼", level: "core", category: "숫자" },
  { id: "四", hanja: "四", hun: "넉", eum: "사", fullHunEum: "넉 사", level: "core", category: "숫자" },
  { id: "五", hanja: "五", hun: "다섯", eum: "오", fullHunEum: "다섯 오", level: "core", category: "숫자" },
  { id: "六", hanja: "六", hun: "여섯", eum: "육", fullHunEum: "여섯 육", level: "core", category: "숫자" },
  { id: "七", hanja: "七", hun: "일곱", eum: "칠", fullHunEum: "일곱 칠", level: "core", category: "숫자" },
  { id: "八", hanja: "八", hun: "여덟", eum: "팔", fullHunEum: "여덟 팔", level: "core", category: "숫자" },
  { id: "九", hanja: "九", hun: "아홉", eum: "구", fullHunEum: "아홉 구", level: "core", category: "숫자" },
  { id: "十", hanja: "十", hun: "열", eum: "십", fullHunEum: "열 십", level: "core", category: "숫자" },
  { id: "百", hanja: "百", hun: "일백", eum: "백", fullHunEum: "일백 백", level: "core", category: "숫자" },
  { id: "千", hanja: "千", hun: "일천", eum: "천", fullHunEum: "일천 천", level: "core", category: "숫자" },
  { id: "萬", hanja: "萬", hun: "일만", eum: "만", fullHunEum: "일만 만", level: "core", category: "숫자" },

  // === Nature (자연) 9자 ===
  { id: "日", hanja: "日", hun: "날", eum: "일", fullHunEum: "날 일", level: "core", category: "자연" },
  { id: "月", hanja: "月", hun: "달", eum: "월", fullHunEum: "달 월", level: "core", category: "자연" },
  { id: "火", hanja: "火", hun: "불", eum: "화", fullHunEum: "불 화", level: "core", category: "자연" },
  { id: "水", hanja: "水", hun: "물", eum: "수", fullHunEum: "물 수", level: "core", category: "자연" },
  { id: "木", hanja: "木", hun: "나무", eum: "목", fullHunEum: "나무 목", level: "core", category: "자연" },
  { id: "金", hanja: "金", hun: "쇠", eum: "금", fullHunEum: "쇠 금", level: "core", category: "자연" },
  { id: "土", hanja: "土", hun: "흙", eum: "토", fullHunEum: "흙 토", level: "core", category: "자연" },
  { id: "山", hanja: "山", hun: "뫼", eum: "산", fullHunEum: "뫼 산", level: "core", category: "자연" },
  { id: "川", hanja: "川", hun: "내", eum: "천", fullHunEum: "내 천", level: "core", category: "자연" },

  // === Size/Direction (크기/방향) 7자 ===
  { id: "大", hanja: "大", hun: "큰", eum: "대", fullHunEum: "큰 대", level: "core", category: "크기/방향" },
  { id: "小", hanja: "小", hun: "작을", eum: "소", fullHunEum: "작을 소", level: "core", category: "크기/방향" },
  { id: "中", hanja: "中", hun: "가운데", eum: "중", fullHunEum: "가운데 중", level: "core", category: "크기/방향" },
  { id: "上", hanja: "上", hun: "위", eum: "상", fullHunEum: "위 상", level: "core", category: "크기/방향" },
  { id: "下", hanja: "下", hun: "아래", eum: "하", fullHunEum: "아래 하", level: "core", category: "크기/방향" },
  { id: "左", hanja: "左", hun: "왼", eum: "좌", fullHunEum: "왼 좌", level: "core", category: "크기/방향" },
  { id: "右", hanja: "右", hun: "오른", eum: "우", fullHunEum: "오른 우", level: "core", category: "크기/방향" },

  // === People (사람) 6자 ===
  { id: "人", hanja: "人", hun: "사람", eum: "인", fullHunEum: "사람 인", level: "core", category: "사람" },
  { id: "女", hanja: "女", hun: "계집", eum: "여", fullHunEum: "계집 여", level: "core", category: "사람" },
  { id: "子", hanja: "子", hun: "아들", eum: "자", fullHunEum: "아들 자", level: "core", category: "사람" },
  { id: "王", hanja: "王", hun: "임금", eum: "왕", fullHunEum: "임금 왕", level: "core", category: "사람" },
  { id: "兄", hanja: "兄", hun: "형", eum: "형", fullHunEum: "형 형", level: "core", category: "사람" },
  { id: "弟", hanja: "弟", hun: "아우", eum: "제", fullHunEum: "아우 제", level: "core", category: "사람" },

  // === Concepts (개념) 15자 ===
  { id: "玉", hanja: "玉", hun: "구슬", eum: "옥", fullHunEum: "구슬 옥", level: "core", category: "개념" },
  { id: "白", hanja: "白", hun: "흰", eum: "백", fullHunEum: "흰 백", level: "core", category: "개념" },
  { id: "天", hanja: "天", hun: "하늘", eum: "천", fullHunEum: "하늘 천", level: "core", category: "개념" },
  { id: "地", hanja: "地", hun: "땅", eum: "지", fullHunEum: "땅 지", level: "core", category: "개념" },
  { id: "正", hanja: "正", hun: "바를", eum: "정", fullHunEum: "바를 정", level: "core", category: "개념" },
  { id: "出", hanja: "出", hun: "날", eum: "출", fullHunEum: "날 출", level: "core", category: "개념" },
  { id: "生", hanja: "生", hun: "날", eum: "생", fullHunEum: "날 생", level: "core", category: "개념" },
  { id: "年", hanja: "年", hun: "해", eum: "년", fullHunEum: "해 년", level: "core", category: "개념" },
  { id: "名", hanja: "名", hun: "이름", eum: "명", fullHunEum: "이름 명", level: "core", category: "개념" },
  { id: "門", hanja: "門", hun: "문", eum: "문", fullHunEum: "문 문", level: "core", category: "개념" },
  { id: "文", hanja: "文", hun: "글월", eum: "문", fullHunEum: "글월 문", level: "core", category: "개념" },
  { id: "字", hanja: "字", hun: "글자", eum: "자", fullHunEum: "글자 자", level: "core", category: "개념" },
  { id: "休", hanja: "休", hun: "쉴", eum: "휴", fullHunEum: "쉴 휴", level: "core", category: "개념" },
  { id: "足", hanja: "足", hun: "발", eum: "족", fullHunEum: "발 족", level: "core", category: "개념" },
  { id: "向", hanja: "向", hun: "향할", eum: "향", fullHunEum: "향할 향", level: "core", category: "개념" },
];

// === Additional Characters (추가 학습 ~46자, includes 入) ===
const HANJA_EXTRA = [
  // Family (가족) 3자
  { id: "父", hanja: "父", hun: "아비", eum: "부", fullHunEum: "아비 부", level: "extra", category: "가족" },
  { id: "母", hanja: "母", hun: "어미", eum: "모", fullHunEum: "어미 모", level: "extra", category: "가족" },
  { id: "男", hanja: "男", hun: "사내", eum: "남", fullHunEum: "사내 남", level: "extra", category: "가족" },

  // Directions (방위) 4자
  { id: "東", hanja: "東", hun: "동녘", eum: "동", fullHunEum: "동녘 동", level: "extra", category: "방위" },
  { id: "西", hanja: "西", hun: "서녘", eum: "서", fullHunEum: "서녘 서", level: "extra", category: "방위" },
  { id: "南", hanja: "南", hun: "남녘", eum: "남", fullHunEum: "남녘 남", level: "extra", category: "방위" },
  { id: "北", hanja: "北", hun: "북녘", eum: "북", fullHunEum: "북녘 북", level: "extra", category: "방위" },

  // Nature (자연) 4자
  { id: "江", hanja: "江", hun: "강", eum: "강", fullHunEum: "강 강", level: "extra", category: "자연" },
  { id: "林", hanja: "林", hun: "수풀", eum: "림", fullHunEum: "수풀 림", level: "extra", category: "자연" },
  { id: "石", hanja: "石", hun: "돌", eum: "석", fullHunEum: "돌 석", level: "extra", category: "자연" },
  { id: "草", hanja: "草", hun: "풀", eum: "초", fullHunEum: "풀 초", level: "extra", category: "자연" },

  // Animals (동물) 4자
  { id: "馬", hanja: "馬", hun: "말", eum: "마", fullHunEum: "말 마", level: "extra", category: "동물" },
  { id: "牛", hanja: "牛", hun: "소", eum: "우", fullHunEum: "소 우", level: "extra", category: "동물" },
  { id: "魚", hanja: "魚", hun: "물고기", eum: "어", fullHunEum: "물고기 어", level: "extra", category: "동물" },
  { id: "羊", hanja: "羊", hun: "양", eum: "양", fullHunEum: "양 양", level: "extra", category: "동물" },

  // Body (신체) 5자
  { id: "口", hanja: "口", hun: "입", eum: "구", fullHunEum: "입 구", level: "extra", category: "신체" },
  { id: "目", hanja: "目", hun: "눈", eum: "목", fullHunEum: "눈 목", level: "extra", category: "신체" },
  { id: "耳", hanja: "耳", hun: "귀", eum: "이", fullHunEum: "귀 이", level: "extra", category: "신체" },
  { id: "手", hanja: "手", hun: "손", eum: "수", fullHunEum: "손 수", level: "extra", category: "신체" },
  { id: "心", hanja: "心", hun: "마음", eum: "심", fullHunEum: "마음 심", level: "extra", category: "신체" },

  // Daily Life (생활) 6자
  { id: "國", hanja: "國", hun: "나라", eum: "국", fullHunEum: "나라 국", level: "extra", category: "생활" },
  { id: "市", hanja: "市", hun: "저자", eum: "시", fullHunEum: "저자 시", level: "extra", category: "생활" },
  { id: "車", hanja: "車", hun: "수레", eum: "차", fullHunEum: "수레 차", level: "extra", category: "생활" },
  { id: "食", hanja: "食", hun: "밥", eum: "식", fullHunEum: "밥 식", level: "extra", category: "생활" },
  { id: "衣", hanja: "衣", hun: "옷", eum: "의", fullHunEum: "옷 의", level: "extra", category: "생활" },
  { id: "光", hanja: "光", hun: "빛", eum: "광", fullHunEum: "빛 광", level: "extra", category: "생활" },

  // Other (기타) 15자
  { id: "古", hanja: "古", hun: "예", eum: "고", fullHunEum: "예 고", level: "extra", category: "기타" },
  { id: "今", hanja: "今", hun: "이제", eum: "금", fullHunEum: "이제 금", level: "extra", category: "기타" },
  { id: "太", hanja: "太", hun: "클", eum: "태", fullHunEum: "클 태", level: "extra", category: "기타" },
  { id: "少", hanja: "少", hun: "적을", eum: "소", fullHunEum: "적을 소", level: "extra", category: "기타" },
  { id: "力", hanja: "力", hun: "힘", eum: "력", fullHunEum: "힘 력", level: "extra", category: "기타" },
  { id: "本", hanja: "本", hun: "근본", eum: "본", fullHunEum: "근본 본", level: "extra", category: "기타" },
  { id: "方", hanja: "方", hun: "모", eum: "방", fullHunEum: "모 방", level: "extra", category: "기타" },
  { id: "外", hanja: "外", hun: "바깥", eum: "외", fullHunEum: "바깥 외", level: "extra", category: "기타" },
  { id: "世", hanja: "世", hun: "인간", eum: "세", fullHunEum: "인간 세", level: "extra", category: "기타" },
  { id: "合", hanja: "合", hun: "합할", eum: "합", fullHunEum: "합할 합", level: "extra", category: "기타" },
  { id: "先", hanja: "先", hun: "먼저", eum: "선", fullHunEum: "먼저 선", level: "extra", category: "기타" },
  { id: "立", hanja: "立", hun: "설", eum: "립", fullHunEum: "설 립", level: "extra", category: "기타" },
  { id: "長", hanja: "長", hun: "긴", eum: "장", fullHunEum: "긴 장", level: "extra", category: "기타" },
  { id: "靑", hanja: "靑", hun: "푸를", eum: "청", fullHunEum: "푸를 청", level: "extra", category: "기타" },
  { id: "不", hanja: "不", hun: "아닐", eum: "불", fullHunEum: "아닐 불", level: "extra", category: "기타" },

  // Seasons (계절) 4자
  { id: "春", hanja: "春", hun: "봄", eum: "춘", fullHunEum: "봄 춘", level: "extra", category: "계절" },
  { id: "夏", hanja: "夏", hun: "여름", eum: "하", fullHunEum: "여름 하", level: "extra", category: "계절" },
  { id: "秋", hanja: "秋", hun: "가을", eum: "추", fullHunEum: "가을 추", level: "extra", category: "계절" },
  { id: "冬", hanja: "冬", hun: "겨울", eum: "동", fullHunEum: "겨울 동", level: "extra", category: "계절" },

  // Added to complete 出↔入 antonym pair
  { id: "入", hanja: "入", hun: "들", eum: "입", fullHunEum: "들 입", level: "extra", category: "기타" },
];
```

#### Index Maps (built at init time)

```javascript
// ALL_HANJA = [...HANJA_DATA, ...HANJA_EXTRA]  (~96 characters)
const ALL_HANJA = [...HANJA_DATA, ...HANJA_EXTRA];

// O(1) lookup by character
const HANJA_BY_CHAR = new Map();
ALL_HANJA.forEach(h => HANJA_BY_CHAR.set(h.hanja, h));

// O(1) lookup by category
const HANJA_BY_CATEGORY = new Map();
ALL_HANJA.forEach(h => {
  if (!HANJA_BY_CATEGORY.has(h.category)) {
    HANJA_BY_CATEGORY.set(h.category, []);
  }
  HANJA_BY_CATEGORY.get(h.category).push(h);
});
```

**IMPORTANT DATA NOTES for implementer:**
- `山` = "뫼 산" (standard 준5급). "뫼" is the correct hun. NOT "메".
- `上` = "위 상" (standard form). NOT "윗 상".
- `出` hun is "날" meaning "to go out/exit", NOT the same "날" as in 日
- `生` hun is "날" meaning "to be born"
- `入` = "들 입" has been added to HANJA_EXTRA to complete the 出↔入 pair
- `門`(문 문) and `文`(글월 문) share eum "문" but different hun -- great decoy options
- `子`(아들 자) and `字`(글자 자) share eum "자" -- great decoys
- `金`(쇠 금) in core vs `今`(이제 금) in extra share eum "금" -- decoy material
- `小`(작을 소) vs `少`(적을 소) share eum "소" -- decoy material
- `林` should use "림" as eum (not "임") per traditional hun-eum conventions
- Every entry has a `category` field. Use `HANJA_BY_CATEGORY` for Study Mode filtering.

### Antonym Pairs Data

```javascript
const ANTONYM_PAIRS = [
  { char1: "上", char2: "下" },  // 위 상 <-> 아래 하
  { char1: "左", char2: "右" },  // 왼 좌 <-> 오른 우
  { char1: "東", char2: "西" },  // 동녘 동 <-> 서녘 서
  { char1: "南", char2: "北" },  // 남녘 남 <-> 북녘 북
  { char1: "大", char2: "小" },  // 큰 대 <-> 작을 소
  { char1: "天", char2: "地" },  // 하늘 천 <-> 땅 지
  { char1: "山", char2: "川" },  // 뫼 산 <-> 내 천
  { char1: "火", char2: "水" },  // 불 화 <-> 물 수
  { char1: "父", char2: "母" },  // 아비 부 <-> 어미 모
  { char1: "兄", char2: "弟" },  // 형 형 <-> 아우 제
  { char1: "男", char2: "女" },  // 사내 남 <-> 계집 여
  { char1: "古", char2: "今" },  // 예 고 <-> 이제 금
  { char1: "春", char2: "秋" },  // 봄 춘 <-> 가을 추
  { char1: "夏", char2: "冬" },  // 여름 하 <-> 겨울 동
  { char1: "出", char2: "入" },  // 날 출 <-> 들 입 (入 now in HANJA_EXTRA)
  { char1: "外", char2: "中" },  // 바깥 외 <-> 가운데 중
];
```

**Note:** 入(들 입) is now included in `HANJA_EXTRA` so the 出↔入 pair is complete. Both characters are in the dataset.

### Four-Character Idioms Data

```javascript
const IDIOMS = [
  { idiom: "山川草木", reading: "산천초목", meaning: "산과 내와 풀과 나무, 자연" },
  { idiom: "東西南北", reading: "동서남북", meaning: "모든 방향" },
  { idiom: "春夏秋冬", reading: "춘하추동", meaning: "사계절" },
  { idiom: "上下左右", reading: "상하좌우", meaning: "위아래와 좌우" },
  { idiom: "名山大川", reading: "명산대천", meaning: "이름난 산과 큰 내" },
];
```

These are used in Study Mode as bonus content, not in the main 5 games.

---

## CSS Architecture

### TASK 2: CSS Foundation

#### 2.1 CSS Custom Properties (Variables)

```css
:root {
  /* Olympic Ring Colors */
  --blue: #0081C8;
  --yellow: #FCB131;
  --black: #000000;
  --green: #00A651;
  --red: #EE334E;

  /* UI Colors */
  --bg: #F5F5F0;           /* Parchment background */
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  --text-secondary: #555555;
  --border: #E0E0E0;
  --success: #00A651;
  --danger: #EE334E;
  --warning: #FCB131;

  /* Medal Colors */
  --gold: #FFD700;
  --silver: #C0C0C0;
  --bronze: #CD7F32;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-hanja: "Batang", "Noto Serif KR", serif;  /* System serif for hanja feel */

  /* Sizing */
  --btn-min-height: 44px;
  --card-radius: 12px;
  --max-width: 480px;       /* Mobile-first container */
}
```

#### 2.2 Layout Strategy

- **Single-screen SPA**: All screens as `<div class="screen" id="screen-xxx">` with `display:none` by default
- **Active screen**: `.screen.active { display: flex; flex-direction: column; }`
- **Container**: Max-width 480px centered, padding 16px on sides
- **Cards**: White background, border-radius 12px, subtle box-shadow
- **Buttons**: Min-height 44px, border-radius 8px, Olympic colors

#### 2.3 Hanja Display -- responsive with clamp()

```css
.hanja-display {
  font-family: var(--font-hanja);
  font-size: clamp(48px, 10vw, 96px);  /* Responsive: min 48px, max 96px */
  line-height: 1.2;
  text-align: center;
}
.hanja-display.medium { font-size: clamp(36px, 7vw, 64px); }
.hanja-display.small { font-size: clamp(24px, 5vw, 40px); }
```

**NOTE:** Use `clamp()` instead of fixed `px` values so hanja scales smoothly across screen sizes without media query breakpoints.

#### 2.4 Animations (Keyframes)

| Animation | Purpose | Duration |
|-----------|---------|----------|
| `fadeIn` | Screen transitions | 0.3s |
| `slideUp` | Modal/result panels | 0.4s |
| `bounceIn` | Correct answer feedback | 0.5s |
| `shake` | Wrong answer feedback | 0.4s |
| `pulse` | Timer urgency (last 10s) | 1s infinite |
| `medalDrop` | Medal award animation | 0.8s |
| `flipCard` | Card flip in Gymnastics | 0.6s |
| `targetHit` | Arrow hitting target in Archery | 0.5s |
| `liftUp` | Weight lifting animation | 0.6s |
| `swim` | Swimming lane progress | continuous |
| `confetti` | Celebration effect | 2s |

#### 2.5 Responsive Breakpoints

```css
/* Mobile first (default): 320px - 480px */
/* Tablet: */
@media (min-width: 600px) {
  :root { --max-width: 600px; }
  /* 2-column grid for game selection */
}
/* Desktop: */
@media (min-width: 900px) {
  :root { --max-width: 800px; }
  /* Wider layout, larger hanja display */
}
```

**Acceptance Criteria for CSS:**
- [ ] All Olympic colors applied correctly
- [ ] Hanja characters use `clamp()` for responsive sizing (no fixed px for main display)
- [ ] All interactive elements meet 44px minimum tap target
- [ ] No horizontal scroll at 320px viewport
- [ ] Animations are smooth (use transform/opacity only where possible)
- [ ] Medal colors (gold/silver/bronze) are distinct and appealing

---

## JavaScript Architecture

### TASK 2.5: Web Audio API Sound System

The sound system uses Web Audio API oscillators to generate sound effects without any external audio files. It must be initialized on first user gesture to comply with mobile autoplay policies.

```javascript
const SoundSystem = {
  ctx: null,

  // Initialize AudioContext on first user interaction (click/touch)
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
  },

  // Play a named sound effect
  playSound(type) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'correct':
        // Rising two-tone "ding ding"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, this.ctx.currentTime);       // C5
        osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
        break;

      case 'wrong':
        // Low descending buzz
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.setValueAtTime(150, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
        break;

      case 'medal':
        // Triumphant ascending fanfare
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, this.ctx.currentTime);        // C5
        osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(784, this.ctx.currentTime + 0.3);  // G5
        osc.frequency.setValueAtTime(1047, this.ctx.currentTime + 0.45);// C6
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.8);
        break;

      case 'flip':
        // Quick click for card flip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.05);
        break;

      case 'tick':
        // Timer tick for urgency
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.05);
        break;
    }
  }
};

// Initialize on first user gesture (attach to first click/touch anywhere)
document.addEventListener('click', () => SoundSystem.init(), { once: true });
document.addEventListener('touchstart', () => SoundSystem.init(), { once: true });
```

**Acceptance Criteria for Sound System:**
- [ ] SoundSystem.init() called on first user gesture (mobile autoplay policy)
- [ ] `playSound('correct')` produces a pleasant rising tone
- [ ] `playSound('wrong')` produces a low descending buzz
- [ ] `playSound('medal')` produces a triumphant ascending fanfare
- [ ] `playSound('flip')` produces a quick click
- [ ] `playSound('tick')` produces a timer tick
- [ ] No errors thrown if AudioContext is unavailable (graceful degradation)
- [ ] No external audio files used

---

### State Management

#### 3.1 Global App State

```javascript
const AppState = {
  currentUser: null,        // { username, icon, createdAt }
  currentScreen: 'splash',
  gameInProgress: null,     // null or game engine instance
  currentAbortController: null, // AbortController for current screen's listeners
};
```

#### 3.2 localStorage Schema

**Key: `hanjaOlympics_users`**
```javascript
{
  "username1": {
    password: "hashed_or_plain",  // Simple hash for demo
    icon: "flag_kr",
    createdAt: "2026-02-07T...",
    medals: {
      archery:       { gold: 0, silver: 0, bronze: 0, bestScore: 0 },
      swimming:      { gold: 0, silver: 0, bronze: 0, bestScore: 0 },
      weightlifting: { gold: 0, silver: 0, bronze: 0, bestScore: 0 },
      gymnastics:    { gold: 0, silver: 0, bronze: 0, bestScore: 0 },
      marathon:      { gold: 0, silver: 0, bronze: 0, bestScore: 0 },
    },
    history: [
      { game: "archery", score: 8, medal: "silver", date: "2026-02-07T..." },
      // last 20 entries max
    ],
    wrongAnswers: [
      { hanja: "萬", selectedAnswer: "일백 백", correctAnswer: "일만 만", count: 3 },
    ],
    encounteredCharacters: ["大", "小", "中", ...],  // Array of character IDs (serialized from Set)
    dailyChallenge: {
      lastPlayedDate: "2026-02-07",  // ISO date string (YYYY-MM-DD)
      currentStreak: 5,               // Consecutive days played
      bestStreak: 12,
      todayScore: 8,                   // Score for today (null if not played)
      todayMedal: "silver",
    },
    previousRank: null,  // Snapshot of total rank before latest game, for rank change display
  }
}
```

**Key: `hanjaOlympics_currentUser`**
```javascript
"username1"  // String, the currently logged-in user
```

**Key: `hanjaOlympics_rankSnapshot`**
```javascript
{
  "username1": 1,
  "username2": 2,
  // ... rank positions before the latest game result
}
```

#### 3.3 Storage Helper Functions

```javascript
const Storage = {
  getUsers()           // Returns all users object
  saveUsers(users)     // Saves all users
  getCurrentUser()     // Returns current username string
  setCurrentUser(name) // Sets current username
  getUserData(name)    // Returns specific user data
  updateUserData(name, data) // Updates specific user
  addGameResult(name, game, score, medal) // Adds to history, updates medals/bestScore
  addWrongAnswer(name, hanja, selected, correct) // Tracks mistakes
  clearCurrentUser()   // Logout
  addEncounteredCharacter(name, charId) // Adds to encounteredCharacters Set
  getEncounteredCount(name)  // Returns count of unique encountered characters
  getRankSnapshot()    // Returns stored rank snapshot
  saveRankSnapshot(snapshot) // Saves current rankings as snapshot
  getDailyChallenge(name)    // Returns daily challenge data
  updateDailyChallenge(name, score, medal) // Updates daily challenge with streak logic
};
```

### Screen Router with AbortController

```javascript
const Router = {
  screens: ['splash','auth','hub','game-select','archery','swimming',
            'weightlifting','gymnastics','marathon','daily-challenge',
            'result','leaderboard','profile','study'],

  navigate(screenId, params) {
    // 1. CLEANUP: Abort previous screen's event listeners
    if (AppState.currentAbortController) {
      AppState.currentAbortController.abort();
    }

    // 2. If a game engine is in progress, call its cleanup()
    if (AppState.gameInProgress && typeof AppState.gameInProgress.cleanup === 'function') {
      AppState.gameInProgress.cleanup();
      AppState.gameInProgress = null;
    }

    // 3. Create new AbortController for incoming screen
    AppState.currentAbortController = new AbortController();
    const signal = AppState.currentAbortController.signal;

    // 4. Hide all screens
    // 5. Show target screen
    // 6. Call screen's init function with (params, signal)
    //    -- all addEventListener calls in the screen MUST use { signal }
    // 7. Update AppState.currentScreen
  },

  back() {
    // Navigate to previous logical screen
  }
};
```

**CRITICAL:** Every `addEventListener` call within a game engine or screen MUST pass `{ signal }` from the AbortController. This ensures all listeners are automatically removed when navigating away. Example:

```javascript
button.addEventListener('click', handler, { signal });
```

---

## Shared Game Engine Interface

### TASK 2.8: Game Engine Contract

Every game engine MUST implement this interface:

```javascript
const GameEngine = {
  // Initialize the game UI inside the container element
  // `signal` is the AbortController signal for listener cleanup
  init(container, signal) {
    // Build game DOM
    // Attach event listeners with { signal }
    // Set up initial state
  },

  // Start the game (begin timer, show first question, etc.)
  start() {
    // Begin gameplay
  },

  // Clean up game state (timers, intervals, animation frames)
  cleanup() {
    // Clear any setInterval / setTimeout / requestAnimationFrame
    // Note: event listeners are auto-cleaned by AbortController
    // Reset internal state
  },

  // Return the game result
  getResult() {
    // Returns { game: string, score: number, total: number, medal: string|null, details: object }
  }
};
```

**Acceptance Criteria for Game Engine Interface:**
- [ ] Every game engine (archery, swimming, weightlifting, gymnastics, marathon, daily-challenge) implements `init(container, signal)`, `start()`, `cleanup()`, `getResult()`
- [ ] `init()` attaches all event listeners with `{ signal }` option
- [ ] `cleanup()` clears all timers (setInterval, setTimeout) and requestAnimationFrame
- [ ] `getResult()` returns a standardized result object
- [ ] Router calls `cleanup()` before navigating away from any game screen
- [ ] No orphaned event listeners or timers after navigation

---

## Task Flow and Detailed Implementation

### TASK 3: HTML Screen Structure

Build all screen containers as sibling `<div>` elements inside `<body>`.

#### Screen List:

| Screen ID | Content | Entry Point |
|-----------|---------|-------------|
| `screen-splash` | Logo, title "한자 올림픽", tagline, "시작하기" button | App load |
| `screen-auth` | Tab: 로그인 / 회원가입, form fields, icon picker | From splash |
| `screen-hub` | Welcome banner, 5 game cards + daily challenge card, nav buttons | After login |
| `screen-archery` | Game UI for Archery | From hub |
| `screen-swimming` | Game UI for Swimming | From hub |
| `screen-weightlifting` | Game UI for Weightlifting | From hub |
| `screen-gymnastics` | Game UI for Gymnastics | From hub |
| `screen-marathon` | Game UI for Marathon | From hub |
| `screen-daily-challenge` | Daily Challenge game UI | From hub |
| `screen-result` | Score display, medal animation, buttons: retry/hub | After any game |
| `screen-leaderboard` | Tab: 종합/종목별, ranked list with rank change indicators | From hub |
| `screen-profile` | User info, medal summary, history, wrong answers, learning progress | From hub |
| `screen-study` | Flashcard viewer, category filter, idiom section | From hub |

#### Hub Screen Game Cards Layout:

Each game card shows:
- Emoji icon
- Korean name
- Brief description
- Best score / medal if any
- Olympic ring color border (one per game)

Additionally, a **Daily Challenge card** is prominently displayed at the top of the hub:

```html
<div class="daily-challenge-card" onclick="Router.navigate('daily-challenge')">
  <div class="daily-icon">📅</div>
  <div class="daily-title">일일 도전</div>
  <div class="daily-streak">🔥 5일 연속!</div>
  <div class="daily-status">오늘의 도전: 미완료</div>
</div>

<div class="game-cards-grid">
  <div class="game-card" style="border-color: var(--blue)" onclick="Router.navigate('archery')">
    <div class="game-icon">🏹</div>
    <div class="game-name">양궁</div>
    <div class="game-desc">훈음 맞추기</div>
    <div class="game-best">최고: 8/10 🥈</div>
  </div>
  <!-- ... other game cards ... -->
</div>
```

**Acceptance Criteria:**
- [ ] All 13 screens render without overlap
- [ ] Only one screen visible at a time
- [ ] Screen transitions have fade animation
- [ ] Hub shows all 5 game cards + daily challenge card in responsive grid
- [ ] Back navigation works from every sub-screen
- [ ] Daily challenge card shows streak and today's completion status

---

### TASK 4: Auth System (Registration & Login)

#### Registration Flow:
1. User enters nickname (2-8 characters, Korean/English/numbers)
2. User enters password (4+ characters)
3. User selects profile icon from grid of flag emojis
4. Validate: nickname not taken, password length
5. Save to localStorage, auto-login
6. **Initialize SoundSystem on the "가입" button click** (first gesture)

#### Login Flow:
1. User enters nickname + password
2. Validate against stored data
3. Set `currentUser`, navigate to hub

#### Auto-Login:
- On page load, check `hanjaOlympics_currentUser`
- If exists and valid, skip auth, go to hub
- If invalid/missing, go to splash

#### Logout:
- Clear `currentUser` from AppState and localStorage
- Navigate to splash

**Acceptance Criteria:**
- [ ] Registration creates new user in localStorage with initialized encounteredCharacters array and dailyChallenge object
- [ ] Duplicate nickname shows error message
- [ ] Short password shows error message
- [ ] Login validates credentials correctly
- [ ] Wrong password shows error (generic: "닉네임 또는 비밀번호가 올바르지 않습니다")
- [ ] Auto-login works on page refresh
- [ ] Logout clears session and returns to splash

---

### TASK 5: Game Engine -- Archery (양궁) 🏹

#### Game Mechanic: 한자 -> 훈음 4-choice quiz, 10 questions

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Select 10 random hanja from ALL_HANJA (core + extra combined)
   - Shuffle the selection
   - Set questionIndex = 0, score = 0
   - Build DOM inside container
   - Attach all click handlers with { signal }

2. START():
   - Display first question

3. PER QUESTION:
   - Display current hanja character (large, centered, using clamp() sizing)
   - Show progress: "3 / 10" with progress bar
   - Generate 4 choices:
     a. Correct answer: the fullHunEum of current character
     b. 3 wrong answers: random fullHunEum from OTHER characters
     c. SMART DECOYS: Prefer characters with same eum (e.g., for 金 prefer 今)
        or visually similar characters
     d. Shuffle all 4 options
   - Display as 4 large tappable buttons (2x2 grid on mobile)
   - Add encountered character to user's encounteredCharacters set

4. ON ANSWER:
   - If correct:
     * Flash button green, show "정답!" overlay
     * SoundSystem.playSound('correct')
     * Play target-hit animation (arrow flying to bullseye)
     * score++
     * Brief delay (800ms), then next question
   - If wrong:
     * Flash button red, highlight correct answer green
     * SoundSystem.playSound('wrong')
     * Show "오답" with correct answer displayed
     * Record wrong answer for user's 오답노트
     * Brief delay (1200ms), then next question

5. CLEANUP():
   - Clear any pending timeouts
   - (Event listeners auto-cleaned by AbortController signal)

6. GAME END (after question 10):
   - Calculate medal: gold >= 9, silver >= 7, bronze >= 5, none < 5
   - getResult() returns { game: 'archery', score, total: 10, medal }
   - Navigate to result screen
```

#### Decoy Selection Algorithm (shared across games):

```javascript
function generateDecoys(correctChar, count = 3) {
  const sameEum = ALL_HANJA.filter(h =>
    h.eum === correctChar.eum && h.hanja !== correctChar.hanja
  );
  const decoys = [];

  // Priority 1: Same eum (most confusing)
  shuffle(sameEum);
  while (decoys.length < Math.min(1, sameEum.length)) {
    decoys.push(sameEum.pop());
  }

  // Priority 2: Random from remaining pool
  const remaining = ALL_HANJA.filter(h =>
    h.hanja !== correctChar.hanja && !decoys.includes(h)
  );
  shuffle(remaining);
  while (decoys.length < count) {
    decoys.push(remaining.pop());
  }

  return decoys;
}
```

#### Visual Design:
- Top: Progress bar (Olympic blue fill)
- Center: Large hanja character (clamp(48px, 10vw, 96px)) on a circular "target" background with concentric rings
- Bottom: 2x2 grid of answer buttons
- Correct animation: Arrow emoji flies to center, rings pulse green
- Wrong animation: Target shakes, brief red flash

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] 10 unique questions per game session
- [ ] 4 distinct answer options always shown (no duplicates)
- [ ] Smart decoys include same-eum characters when available
- [ ] Correct/wrong feedback is visually clear with sound effects
- [ ] Score tallied correctly
- [ ] Medal awarded per thresholds: gold >= 9, silver >= 7, bronze >= 5
- [ ] Wrong answers recorded in user's 오답노트
- [ ] Encountered characters tracked in user's encounteredCharacters
- [ ] All event listeners use `{ signal }` for cleanup
- [ ] Game cannot be replayed without restarting (no answer changes)

---

### TASK 6: Game Engine -- Swimming (수영) 🏊

#### Game Mechanic: 60-second speed quiz, 훈음 -> 한자 (reverse of Archery)

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Pool all hanja, shuffle into question queue
   - Set score = 0
   - Build DOM, attach listeners with { signal }
   - Store reference to timer interval for cleanup

2. START():
   - Record startTime = Date.now()
   - endTime = startTime + 60000
   - Show "준비..." countdown (3, 2, 1, 출발!)
   - Start timer update loop (setInterval every 100ms)
   - Show first question

3. PER QUESTION:
   - Display fullHunEum text (e.g., "큰 대") prominently
   - Show 4 hanja character buttons (the actual characters)
   - One correct, three decoys (same algorithm as archery but reversed)
   - Track encountered characters

4. ON ANSWER:
   - If correct:
     * Brief green flash (200ms -- must be FAST for speed game)
     * SoundSystem.playSound('correct')
     * score++
     * Immediately show next question (minimal delay)
     * Swimmer animation advances one "lane"
   - If wrong:
     * Brief red flash (200ms)
     * SoundSystem.playSound('wrong')
     * Show correct answer briefly (300ms)
     * Record wrong answer
     * Show next question (no score increment)

5. TIMER (CRITICAL -- use Date.now() for accuracy):
   - On each interval tick: remaining = Math.max(0, endTime - Date.now())
   - Display as "00:42" format
   - When remaining <= 10000: timer turns red, pulses, SoundSystem.playSound('tick')
   - When remaining <= 5000: background flashes subtly
   - At 0: immediately end game

6. CLEANUP():
   - clearInterval(timerInterval)
   - Clear any pending timeouts
   - (Event listeners auto-cleaned by AbortController signal)

7. GAME END:
   - Freeze UI, show final score
   - Medal: gold >= 20, silver >= 15, bronze >= 10
   - getResult() returns { game: 'swimming', score, total: null, medal }
   - Navigate to result screen

8. QUESTION RECYCLING:
   - If all characters used before 60s, reshuffle and restart queue
   - Track "unique correct" vs "total correct" separately
```

**CRITICAL:** Timer MUST use `Date.now()` for elapsed time tracking, NOT accumulated `setInterval` ticks. The setInterval is only for display updates.

#### Visual Design:
- Top: Timer bar (full width, depleting left to right, blue to red gradient)
- Center: HunEum text display (large Korean text)
- Bottom: 2x2 grid of hanja character buttons (large serif font)
- Background: Subtle swimming lane lines (CSS)
- Progress: Swimmer emoji moves across lanes at top

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] Timer uses `Date.now()` for accuracy (not accumulated interval ticks)
- [ ] Timer counts down accurately from 60 to 0
- [ ] Timer display updates smoothly (not jumpy)
- [ ] Questions cycle correctly, recycling if needed
- [ ] Minimal delay between questions (speed game feel)
- [ ] Game ends immediately at 0 seconds
- [ ] Score counts only correct answers
- [ ] Medal thresholds: gold >= 20, silver >= 15, bronze >= 10
- [ ] Visual urgency increases in last 10 seconds with tick sounds
- [ ] cleanup() clears timer interval
- [ ] All event listeners use `{ signal }`

---

### TASK 7: Game Engine -- Weightlifting (역도) 🏋️

#### Game Mechanic: Consecutive correct answers, one wrong = game over

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Shuffle all hanja into queue
   - Set streak = 0
   - Build DOM, attach listeners with { signal }

2. START():
   - Display starting "weight": 40kg
   - Show first question

3. PER QUESTION:
   - Randomly choose question type:
     a. 한자 -> 훈음 (show character, pick meaning)
     b. 훈음 -> 한자 (show meaning, pick character)
   - Generate 4 choices (1 correct + 3 decoys)
   - Display "weight" value: 40 + (streak * 10) kg
   - Display streak counter
   - Track encountered character

4. ON CORRECT:
   - streak++
   - SoundSystem.playSound('correct')
   - Weight increases: display new weight with lift animation
   - Barbell visually gets bigger/heavier (CSS scale)
   - Brief "성공!" celebration
   - Show next question

5. ON WRONG:
   - GAME OVER immediately
   - SoundSystem.playSound('wrong')
   - Show "실패!" with barbell dropping animation
   - Display final streak count
   - Medal: gold >= 15, silver >= 10, bronze >= 5
   - getResult() returns { game: 'weightlifting', score: streak, total: null, medal }
   - Navigate to result

6. CLEANUP():
   - Clear any pending timeouts/animations
   - (Event listeners auto-cleaned by AbortController signal)

7. TENSION BUILDING:
   - At streak 5+: background subtly intensifies
   - At streak 10+: screen border glows
   - At streak 15+: gold particles appear
```

#### Visual Design:
- Top: Streak counter + current "weight"
- Center: Question (alternating type)
- Bottom: 4 answer buttons
- Barbell graphic: Simple CSS/emoji that grows with streak
- Weight plates: Visual stack that grows
- Drop animation on failure: barbell falls, screen shakes

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] Game ends on first wrong answer
- [ ] Streak counts correctly
- [ ] Weight display increases per correct answer
- [ ] Question type alternates (hanja->hun and hun->hanja mix)
- [ ] Medal thresholds: gold >= 15, silver >= 10, bronze >= 5
- [ ] Visual tension increases with streak
- [ ] Game-over animation plays on wrong answer
- [ ] Questions do not repeat within a session (until pool exhausted)
- [ ] Sound effects play on correct/wrong
- [ ] All event listeners use `{ signal }`

---

### TASK 8: Game Engine -- Gymnastics (체조) 🤸

#### Game Mechanic: Memory card matching game, 8 pairs (16 cards)

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Select 8 random hanja from pool
   - Create 16 cards:
     * 8 cards showing hanja character (e.g., "大")
     * 8 cards showing fullHunEum (e.g., "큰 대")
   - Shuffle all 16 cards
   - Place in 4x4 grid
   - Set attempts = 0, matchedPairs = 0, locked = false
   - Build DOM, attach listeners with { signal }

2. START():
   - Brief "peek" period: show all cards for 3 seconds, then flip face-down
   - Enable player interaction

3. GAME PLAY:
   - Cards show face-down (decorative back with Olympic rings pattern)
   - **LOCK MECHANISM:** When locked === true, ALL card clicks are ignored
   - Player taps card to flip face-up (flip animation 0.3s)
     * SoundSystem.playSound('flip')
   - First card stays face-up
   - Player taps second card:
     * Set locked = true (CRITICAL: prevent clicks during comparison)

     a. If MATCH (hanja card matches its hunEum card):
        * Both cards stay face-up, turn green/gold
        * SoundSystem.playSound('correct')
        * "짝!" success indicator
        * matchedPairs++
        * attempts++
        * Set locked = false

     b. If NO MATCH:
        * Both cards briefly show (1s), then flip back face-down
        * SoundSystem.playSound('wrong')
        * attempts++
        * After flip-back animation completes: set locked = false

   - Cannot tap already-matched cards or the currently-flipped card

4. CLEANUP():
   - Clear any pending timeouts (peek timer, flip-back timer)
   - (Event listeners auto-cleaned by AbortController signal)

5. GAME END (all 8 pairs matched):
   - Medal based on attempts: gold <= 12, silver <= 16, bronze <= 20, none > 20
   - getResult() returns { game: 'gymnastics', score: attempts, total: 8, medal }
   - Navigate to result

6. MATCHING LOGIC:
   - Each card has: { id, pairId, type: 'hanja'|'huneum', value, isFlipped, isMatched }
   - Two cards match if they share the same pairId and have different types
```

**CRITICAL: The `locked` flag MUST be explicitly set to `true` during the card comparison phase (after second card flip, before match/no-match resolution). This prevents the player from flipping a third card during the comparison window.**

#### Visual Design:
- 4x4 grid of square cards (responsive sizing)
- Card back: Olympic rings mini-pattern or "漢" watermark
- Card front (hanja): Large character in serif
- Card front (huneum): Korean text
- Flip animation: CSS 3D transform (rotateY)
- Match animation: cards glow gold briefly
- Attempt counter prominently displayed: "시도: 8회"

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] 16 cards in 4x4 grid, responsive sizing
- [ ] Cards flip with smooth 3D animation + flip sound
- [ ] Only 2 cards can be flipped at once (locked flag enforced)
- [ ] `locked = true` set IMMEDIATELY after second card flip, before comparison logic
- [ ] `locked = false` set only AFTER match animation or flip-back animation completes
- [ ] Matched pairs stay face-up permanently
- [ ] Non-matching pairs flip back after 1s delay
- [ ] Attempt counter increments on every 2-card flip
- [ ] Cannot interact with matched or currently-flipping cards
- [ ] 3-second peek at start
- [ ] Medal thresholds: gold <= 12, silver <= 16, bronze <= 20
- [ ] All 8 pairs must be correct (hanja matches its own huneum only)
- [ ] All event listeners use `{ signal }`

---

### TASK 9: Game Engine -- Marathon (마라톤) 🏃

#### Game Mechanic: Answer ALL characters, no time limit, accuracy tracked

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Use ALL hanja (core + extra, ~96 characters)
   - Shuffle order
   - Set correct = 0, wrong = 0, currentIndex = 0
   - total = ALL_HANJA.length
   - Build DOM, attach listeners with { signal }

2. START():
   - Record startTime = Date.now()
   - Start elapsed time display (update every 1000ms using Date.now() - startTime)
   - Show first question

3. PER QUESTION:
   - Display: "문제 23 / 96"
   - Progress bar showing completion percentage
   - Show hanja character
   - 4 choices (fullHunEum), 1 correct + 3 decoys
   - Distance marker: "현재 23km / 42.195km" (scaled proportionally)
   - Track encountered character

4. ON ANSWER:
   - Correct: brief green flash, SoundSystem.playSound('correct'), correct++, advance
   - Wrong: show correct answer, SoundSystem.playSound('wrong'), wrong++, record to 오답노트, advance
   - Always advance (cannot get stuck)

5. CLEANUP():
   - clearInterval(elapsedTimeInterval)
   - Clear any pending timeouts
   - (Event listeners auto-cleaned by AbortController signal)

6. GAME END (all questions answered):
   - elapsedTime = Date.now() - startTime
   - accuracy = (correct / total) * 100
   - Medal: gold >= 90%, silver >= 70%, bronze >= 50%
   - Show detailed breakdown:
     * Total: 96 questions
     * Correct: 82 (85.4%)
     * Wrong: 14
     * Time taken: formatTime(elapsedTime) -> "12분 34초"
   - getResult() returns { game: 'marathon', score: accuracy, total: total, medal, details: { correct, wrong, time } }
   - Navigate to result
```

**CRITICAL:** Elapsed time tracking MUST use `Date.now()` -- store `startTime` at game start, calculate elapsed as `Date.now() - startTime` on each display update. The `setInterval` is only for refreshing the display, not for accumulating time.

#### Visual Design:
- Top: Marathon track progress bar with runner emoji
- Middle: Question number + hanja character
- Bottom: 4 answer buttons
- Distance marker display
- Elapsed time (stopwatch style: "05:23")
- No time pressure (relaxed background, cool blue tones)

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] All characters in the dataset are presented (no skipping)
- [ ] Order is randomized each session
- [ ] Progress bar advances correctly
- [ ] Elapsed time uses `Date.now()` for accuracy, not accumulated intervals
- [ ] Both correct and wrong answers advance to next question
- [ ] Final accuracy percentage calculated correctly
- [ ] Medal thresholds: gold >= 90%, silver >= 70%, bronze >= 50%
- [ ] Detailed result breakdown shown at end
- [ ] Wrong answers added to 오답노트
- [ ] Encountered characters tracked
- [ ] Sound effects play on correct/wrong
- [ ] cleanup() clears elapsed time interval
- [ ] All event listeners use `{ signal }`

---

### TASK 10: Daily Challenge (일일 도전) 📅

#### Game Mechanic: Random 10 questions, once per day, streak tracking

**Implements shared game engine interface:** `{ init(container, signal), start(), cleanup(), getResult() }`

#### Detailed Logic:

```
1. INIT(container, signal):
   - Check if user has already played today:
     * Get user's dailyChallenge.lastPlayedDate
     * Compare with today's date (new Date().toISOString().slice(0, 10))
     * If same date AND todayScore is not null: show "already played" screen with today's result
     * If different date: allow play
   - If allowing play:
     * Use today's date as seed for deterministic random selection
       (so all users get the same 10 questions on the same day)
       Seed: simple hash of date string -> use as Math seed via LCG
     * Select 10 hanja using seeded random
     * Build quiz UI (same 4-choice format as Archery)
   - Attach listeners with { signal }

2. START():
   - Show streak info: "🔥 현재 5일 연속!"
   - Begin quiz

3. PER QUESTION:
   - Same format as Archery: show hanja, 4 choices for fullHunEum
   - Progress: "3 / 10"
   - Track encountered characters

4. ON ANSWER:
   - Same as Archery (correct/wrong feedback with sounds)

5. CLEANUP():
   - Clear any pending timeouts

6. GAME END:
   - Calculate score and medal (same thresholds as Archery: gold >= 9, silver >= 7, bronze >= 5)
   - Update streak:
     * If lastPlayedDate was yesterday: currentStreak++
     * If lastPlayedDate was before yesterday: currentStreak = 1
     * If lastPlayedDate is today: (shouldn't happen, blocked at init)
     * Update bestStreak if currentStreak > bestStreak
   - Save: lastPlayedDate = today, todayScore = score, todayMedal = medal
   - getResult() returns { game: 'daily-challenge', score, total: 10, medal, streak }
   - Navigate to result screen with streak celebration

7. ALREADY PLAYED STATE:
   - Show today's score and medal
   - Show current streak
   - Show "내일 다시 도전하세요!" message
   - Show time until next challenge (hours:minutes until midnight)
```

#### Streak Logic Detail:

```javascript
function updateStreak(userData) {
  const today = new Date().toISOString().slice(0, 10);
  const dc = userData.dailyChallenge;

  if (!dc.lastPlayedDate) {
    // First time playing
    dc.currentStreak = 1;
  } else {
    const lastDate = new Date(dc.lastPlayedDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      dc.currentStreak++;
    } else if (diffDays > 1) {
      dc.currentStreak = 1; // Streak broken
    }
    // diffDays === 0 shouldn't happen (blocked at init)
  }

  dc.bestStreak = Math.max(dc.bestStreak, dc.currentStreak);
  dc.lastPlayedDate = today;
}
```

#### Visual Design:
- Top: Streak display with fire emoji, "연속 X일" badge
- Calendar icon showing today's date
- Quiz UI same as Archery but with daily challenge branding
- Special celebration on streak milestones (7, 14, 30 days)

**Acceptance Criteria:**
- [ ] Implements `{ init(container, signal), start(), cleanup(), getResult() }` interface
- [ ] Can only play once per day (today check based on date string comparison)
- [ ] Same 10 questions for all users on the same day (seeded random)
- [ ] Streak increments for consecutive days
- [ ] Streak resets to 1 if a day is missed
- [ ] Best streak tracked
- [ ] Already-played state shows today's result and countdown to next challenge
- [ ] Medal thresholds same as Archery: gold >= 9, silver >= 7, bronze >= 5
- [ ] Streak info visible on hub screen daily challenge card
- [ ] Sound effects play on correct/wrong/medal

---

### TASK 11: Result Screen & Medal System

#### Result Screen Display:

```
1. MEDAL ANIMATION:
   - If medal earned: large medal emoji drops from top with bounce
     gold, silver, bronze emojis
   - SoundSystem.playSound('medal') on medal award
   - Confetti animation for gold
   - "축하합니다!" for medal, "아쉽지만 다음에!" for no medal

2. SCORE DISPLAY:
   - Game icon + name
   - Score in large text
   - Context (e.g., "10문제 중 8문제 정답")
   - For daily challenge: also show streak info

3. PERSIST RESULTS:
   - Save rank snapshot BEFORE updating scores (for rank change tracking)
   - Update user's medals object for this game
   - Update bestScore if new high
   - Add to history array (keep last 20)
   - Update encounteredCharacters
   - Save to localStorage

4. BUTTONS:
   - "다시 도전" -> Restart same game (not shown for daily challenge if already played)
   - "종목 선택" -> Back to hub
   - "리더보드" -> View rankings
```

#### Medal Threshold Summary:

| Game | Gold | Silver | Bronze |
|------|------|--------|--------|
| Archery | >= 9/10 | >= 7/10 | >= 5/10 |
| Swimming | >= 20 | >= 15 | >= 10 |
| Weightlifting | >= 15 streak | >= 10 streak | >= 5 streak |
| Gymnastics | <= 12 attempts | <= 16 attempts | <= 20 attempts |
| Marathon | >= 90% | >= 70% | >= 50% |
| Daily Challenge | >= 9/10 | >= 7/10 | >= 5/10 |

**Acceptance Criteria:**
- [ ] Medal animation plays on result screen
- [ ] SoundSystem.playSound('medal') plays when medal is awarded
- [ ] Correct medal awarded per threshold table
- [ ] Rank snapshot saved BEFORE updating user scores (for rank change display)
- [ ] Results persisted to localStorage immediately
- [ ] Best score updated if current score is better
- [ ] History capped at 20 entries (oldest removed)
- [ ] Three action buttons work correctly
- [ ] No medal case handled gracefully ("아쉽지만 다음에!")
- [ ] Daily challenge result includes streak info display

---

### TASK 12: Leaderboard with Rank Change Tracking

#### Leaderboard Structure:

```
TAB 1: 종합 순위 (Total Ranking)
- Sort all users by total medal points
- Medal points = (gold * 3) + (silver * 2) + (bronze * 1)
  where gold/silver/bronze = sum across all 5 games
- Display: rank, rank change indicator, icon, username, gold/silver/bronze counts, total points

TAB 2-6: 종목별 순위 (Per-Game Ranking)
- One sub-tab per game
- Sort by bestScore for that game
- Display: rank, icon, username, best score, medal for that game
```

#### Rank Change Tracking (순위 변동 표시):

```javascript
function displayRankChange(username) {
  const currentRanks = calculateCurrentRanks(); // { username: rank, ... }
  const previousSnapshot = Storage.getRankSnapshot();

  if (!previousSnapshot || !previousSnapshot[username]) {
    return "NEW"; // New player, show "NEW" badge
  }

  const prevRank = previousSnapshot[username];
  const currRank = currentRanks[username];
  const change = prevRank - currRank; // positive = improved

  if (change > 0) return `▲${change}`;  // Rank improved (green)
  if (change < 0) return `▼${Math.abs(change)}`;  // Rank dropped (red)
  return "—";  // No change (gray)
}
```

**Rank snapshot is saved in the Result Screen (TASK 11) BEFORE updating scores.** This way the leaderboard can show the change from the previous state.

#### Display Format:

```
🏆 종합 순위
----------------------------------
1. ▲2  🇰🇷 김한자    🥇x5  🥈x3  🥉x1  24점
2. ▼1  🇯🇵 이올림    🥇x3  🥈x4  🥉x2  19점
3. NEW  🇺🇸 박도전    🥇x2  🥈x2  🥉x3  13점
```

- Top 3 get special styling (gold/silver/bronze background highlight)
- Current user's row is highlighted differently
- Rank change indicators: ▲ green (improved), ▼ red (dropped), — gray (same), NEW blue (new)
- If no users, show "아직 참가자가 없습니다"

**Acceptance Criteria:**
- [ ] Total ranking sorts by medal points correctly
- [ ] Per-game tabs show per-game best scores
- [ ] Current user highlighted in the list
- [ ] Rank change indicators (▲/▼/—/NEW) displayed next to each user
- [ ] Rank change calculated from stored snapshot vs current ranking
- [ ] Handles 0 users, 1 user, many users
- [ ] Medal point calculation: gold=3, silver=2, bronze=1
- [ ] Rankings update in real-time (re-calculated on each view)

---

### TASK 13: Profile Screen

#### Profile Display:

```
HEADER:
  [Icon] [Username]
  가입일: 2026-02-07

MEDAL SUMMARY:
  🥇 5개    🥈 3개    🥉 1개
  총 메달 포인트: 24점

PER-GAME RECORDS (5 cards):
  🏹 양궁: 최고 9/10 🥇
  🏊 수영: 최고 22 🥇
  🏋️ 역도: 최고 12 🥈
  🤸 체조: 최고 14회 🥈
  🏃 마라톤: 최고 87% 🥈

DAILY CHALLENGE:
  📅 일일 도전: 현재 5일 연속 🔥
  최고 연속: 12일
  오늘: 8/10 🥈

RECENT HISTORY (last 10):
  [Date] [Game] [Score] [Medal]

학습 진도:
  학습한 한자: 72/96 (75.0%)
  (Progress bar)
  -- Uses encounteredCharacters.length / ALL_HANJA.length

WRONG ANSWERS (오답노트) LINK:
  틀린 횟수 상위 한자 3개 preview
  "오답노트 전체보기 >" link to study mode filtered

LOGOUT BUTTON
```

**Acceptance Criteria:**
- [ ] All medal counts accurate
- [ ] Per-game best scores shown
- [ ] Daily challenge streak info displayed
- [ ] Recent history shows last 10 game results
- [ ] Learning progress calculated from `encounteredCharacters.length / ALL_HANJA.length`
- [ ] Progress bar shows visual representation of learning progress
- [ ] Wrong answer preview shows top 3 most-missed characters
- [ ] Logout button returns to splash screen

---

### TASK 14: Study Mode (Flashcards)

#### Flashcard Viewer:

```
1. CATEGORY FILTER (uses HANJA_BY_CATEGORY index map):
   - 전체 (all)
   - 숫자 (numbers)
   - 자연 (nature)
   - 크기/방향 (size/direction)
   - 사람 (people)
   - 개념 (concepts)
   - 가족 (family)
   - 방위 (compass)
   - 동물 (animals)
   - 신체 (body)
   - 생활 (daily life)
   - 기타 (other)
   - 계절 (seasons)
   - 오답노트 (wrong answers only)

2. FLASHCARD UI:
   - Large card, tappable to flip
   - Front: Hanja character (large, clamp() sizing)
   - Back: fullHunEum + category
   - SoundSystem.playSound('flip') on flip
   - Swipe or button: next/previous card
   - Card counter: "23 / 96"

3. BONUS: IDIOM SECTION
   - Display 5 four-character idioms
   - Each shows: characters, reading, meaning
   - Not interactive, just reference display

4. BONUS: ANTONYM PAIRS
   - Display antonym pairs in a visual layout
   - Character <-> Character with arrow between
   - Uses HANJA_BY_CHAR for O(1) lookup of pair details
```

**Acceptance Criteria:**
- [ ] Category filter works correctly (using HANJA_BY_CATEGORY for O(1) lookup)
- [ ] Card flip animation (3D) smooth with flip sound
- [ ] Navigation between cards works (next/prev)
- [ ] 오답노트 filter shows only user's wrong answers
- [ ] Idioms and antonyms display as reference material
- [ ] All categories from the dataset are available as filter options

---

### TASK 15: Splash Screen & Polish

#### Splash Screen:

```
LAYOUT:
  Olympic rings (CSS-drawn or emoji)
  Title: "한자 올림픽" (large, bold)
  Subtitle: "준5급 한자를 게임으로 배우자!"
  [시작하기] button (large, Olympic blue)

  Brief loading animation (Olympic rings rotate)
  Auto-checks for existing session
```

#### Polish Elements:
- Smooth screen transitions (fade or slide)
- Button press feedback (scale down on touch)
- Consistent spacing and alignment
- Error states for all forms (red text, shake animation)
- Empty states for leaderboard and history
- Loading states (brief spinner for localStorage reads, if needed)
- Sound system initialization on first user gesture

**Acceptance Criteria:**
- [ ] Splash loads within 1 second
- [ ] Olympic rings visible and colored correctly
- [ ] "시작하기" button leads to auth or hub (depending on session)
- [ ] All transitions smooth, no layout jumps
- [ ] Error messages are Korean and helpful
- [ ] SoundSystem.init() called on first user gesture from splash/auth

---

## Utility Functions (Shared)

### TASK 16: Core Utilities

```javascript
// Shuffle array (Fisher-Yates)
function shuffle(arr) { ... }

// Get random items from array
function getRandomItems(arr, n) { ... }

// Generate quiz options (1 correct + n decoys)
function generateOptions(correctItem, pool, n = 3) { ... }

// Format time (milliseconds -> "MM분 SS초" or "MM:SS")
function formatTime(ms) { ... }

// Calculate medal
function calculateMedal(game, score) { ... }

// Simple string hash (for passwords and daily challenge seed)
function simpleHash(str) { ... }

// Seeded random number generator (for daily challenge)
function seededRandom(seed) { ... }  // Returns a function that produces deterministic randoms

// Debounce (prevent double-tap)
function debounce(fn, ms) { ... }

// Clamp utility
function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

// Create element helper
function el(tag, attrs, children) { ... }

// Date helpers
function getToday() { return new Date().toISOString().slice(0, 10); }
function isYesterday(dateStr) { ... }
```

**Acceptance Criteria:**
- [ ] Shuffle produces uniform distribution
- [ ] generateOptions never includes duplicates
- [ ] formatTime handles 0, 60000, 600000+ milliseconds correctly
- [ ] calculateMedal returns 'gold'|'silver'|'bronze'|null per threshold table
- [ ] Debounce prevents rapid-fire answer submission
- [ ] seededRandom produces deterministic results for same seed
- [ ] clamp() works correctly for edge cases

---

## Commit Strategy

Since this is a single-file deliverable built from scratch, use these commits:

| Commit # | Content | Lines ~approx |
|----------|---------|---------------|
| 1 | HTML structure + CSS (with clamp()) + data model (with category, index maps) + auth + sound system | ~1800 lines |
| 2 | Shared game engine interface + all 5 game engines + daily challenge + result screen | ~1800 lines |
| 3 | Leaderboard (with rank change) + profile (with learning progress) + study mode + splash + polish | ~900 lines |

---

## Risk Identification & Mitigations

### Risk 1: Hanja Hun/Eum Accuracy
- **Risk**: Incorrect hun or eum for a character would make the game teach wrong information
- **Impact**: HIGH -- defeats the educational purpose
- **Mitigation**: The data list above has been AUDITED against standard 준5급 curriculum. Key corrections applied:
  - `山` = "뫼 산" (NOT "메 산")
  - `上` = "위 상" (NOT "윗 상")
  - `出` = "날 출" (to exit), `生` = "날 생" (to be born) -- same hun, different meaning
  - `方` = "모 방", `足` = "발 족"
  - The implementer should still cross-reference with the study sheet images if any doubt arises.

### Risk 2: localStorage Size Limits
- **Risk**: Too much data in localStorage (5MB limit in most browsers)
- **Impact**: LOW -- our data is tiny (a few KB per user)
- **Mitigation**: Cap history at 20 entries per user, cap wrong answers at 100 entries. encounteredCharacters is max ~96 entries. Even 100 users = ~300KB, well under limits.

### Risk 3: Single-File Size
- **Risk**: ~4500+ lines in one file makes development harder
- **Impact**: MEDIUM -- harder to debug/navigate
- **Mitigation**: Use clear section comments (as outlined above). Each section is self-contained. The implementer should build section by section, testing each before moving on.

### Risk 4: Card Matching Game Performance & Lock Bug
- **Risk**: The Gymnastics card flip animation might stutter; also, without a lock flag, players can flip 3+ cards at once
- **Impact**: MEDIUM
- **Mitigation**: Use `transform: rotateY()` with `will-change: transform` for GPU acceleration. MANDATORY `locked` flag during card comparison phase prevents third-card flips. Set `locked = true` immediately after second flip, `locked = false` only after resolution completes.

### Risk 5: Timer Accuracy in Swimming & Marathon
- **Risk**: `setInterval` drift could make timers inaccurate
- **Impact**: MEDIUM -- unfair scoring
- **Mitigation**: Use `Date.now()` for absolute time tracking in both Swimming (countdown) and Marathon (elapsed). Display updates via setInterval(100ms) for Swimming and setInterval(1000ms) for Marathon, but actual time is always calculated from `Date.now() - startTime` or `endTime - Date.now()`.

### Risk 6: Same-Eum Confusion in Quizzes
- **Risk**: Characters sharing the same eum could create ambiguous quiz options
- **Impact**: MEDIUM
- **Mitigation**: The decoy generator prioritizes same-eum characters intentionally (makes quiz challenging). But the CORRECT answer is always unambiguous: fullHunEum (e.g., "글월 문" vs "문 문") differentiates them. Never show only eum as an answer option.

### Risk 7: Mobile Touch Issues & Web Audio Autoplay
- **Risk**: Double-tap zoom, accidental taps, Web Audio blocked on mobile
- **Impact**: MEDIUM
- **Mitigation**: Add `touch-action: manipulation` to interactive elements. 44px minimum tap targets. Debounce on answer buttons (300ms). SoundSystem.init() triggered on first user gesture (click/touchstart) to comply with mobile autoplay policy.

### Risk 8: Game Engine Cleanup (Navigation Mid-Game)
- **Risk**: Player navigates away mid-game, leaving orphaned timers/listeners
- **Impact**: MEDIUM -- memory leaks, ghost timers
- **Mitigation**: AbortController signal auto-removes all event listeners. Every game engine's `cleanup()` clears all setInterval/setTimeout/requestAnimationFrame. Router ALWAYS calls cleanup() before navigation. This is enforced by the shared game engine interface contract.

### Risk 9: Daily Challenge Seed Consistency
- **Risk**: Different timezones could cause different "today" dates for same UTC moment
- **Impact**: LOW -- acceptable for local game
- **Mitigation**: Use local date (`new Date().toISOString().slice(0, 10)`) consistently. All users on same device/timezone get same questions. This is acceptable for a localStorage-only game.

### Risk 10: Browser Compatibility
- **Risk**: CSS `clamp()`, Web Audio API, or CSS 3D transforms may not work in very old browsers
- **Impact**: LOW -- targeting modern browsers
- **Mitigation**: `clamp()` is supported in all major browsers since 2020. Web Audio API since 2014. Use `-webkit-` prefixes for transforms. Fallback: `font-size: 72px; font-size: clamp(48px, 10vw, 96px);` (old browsers use first value).

---

## Success Criteria (Overall)

1. **Functional**: All 5 games + daily challenge playable from start to medal award
2. **Data Integrity**: All ~96 hanja characters have correct hun/eum (audited)
3. **Sound**: Web Audio API oscillator sounds play on correct/wrong/medal/flip events
4. **Daily Challenge**: Once-per-day play with streak tracking works correctly
5. **Persistence**: User data survives page refresh and browser restart
6. **Responsive**: Fully usable on iPhone SE (320px) through desktop (1200px) with clamp() sizing
7. **Performance**: No visible lag or stutter during gameplay; no orphaned timers/listeners
8. **Rank Tracking**: Leaderboard shows rank change indicators
9. **Learning Progress**: Profile shows encountered characters count with progress bar
10. **Accessibility**: All text readable, colors have sufficient contrast
11. **Fun Factor**: Games feel distinct, medals feel rewarding, progress is visible, sounds add feedback
12. **Korean UI**: All user-facing text is natural Korean, no English (except technical)
13. **Zero Dependencies**: Opens directly in browser from filesystem, no server needed
14. **Single File**: Entire application contained in one `index.html`

---

## Implementation Order (Recommended)

The implementer should build in this order within the single file:

1. **CSS variables + reset + base typography** (foundation, use clamp() for hanja)
2. **HTML screen skeletons** (all 13 screens as empty containers)
3. **Hanja data arrays with category field + index maps** (HANJA_BY_CHAR, HANJA_BY_CATEGORY)
4. **Web Audio API sound system** (SoundSystem object, init on gesture)
5. **Router + screen management with AbortController** (navigation working, cleanup enforced)
6. **Shared game engine interface definition** (contract documented in code comments)
7. **Auth system** (register, login, auto-login, logout, initialize encounteredCharacters/dailyChallenge)
8. **Hub screen** (game cards + daily challenge card, navigation to sub-screens)
9. **Utility functions** (shuffle, generateOptions, formatTime, clamp, seededRandom, etc.)
10. **Game Engine: Archery** (simplest quiz mechanic, validates core quiz logic + sound)
11. **Result screen + Medal system** (with rank snapshot + medal sound)
12. **Game Engine: Swimming** (adds Date.now() timer mechanic)
13. **Game Engine: Weightlifting** (adds streak/game-over mechanic)
14. **Game Engine: Gymnastics** (card matching, locked flag, flip sound)
15. **Game Engine: Marathon** (all characters, Date.now() elapsed time)
16. **Daily Challenge** (seeded random, streak logic, once-per-day gate)
17. **Leaderboard** (with rank change indicators from snapshot)
18. **Profile screen** (with encounteredCharacters progress + daily challenge streak)
19. **Study mode** (flashcards with HANJA_BY_CATEGORY filter, idioms, antonyms)
20. **Splash screen** (auto-login check, sound system init trigger)
21. **Animations + sound polish** (final pass)
22. **Responsive testing + clamp() verification** (final pass)
