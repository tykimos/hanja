# PRD: 한자 올림픽 v2 (Hanja Olympics)

## 1. 개요

준5급 한자를 재미있게 암기할 수 있는 올림픽 테마 웹 게임 플랫폼.
여러 종목(게임)을 통해 한자의 훈(뜻)과 음(읽기)을 반복 학습하고,
Supabase 인증/DB 기반 클라우드 저장, 실시간 멀티플레이어 방 시스템을 지원한다.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Vanilla JS + Vite (ES Modules) |
| 3D Engine | Three.js r128 (Voxel Art) |
| Backend | Supabase (Auth, PostgreSQL, Realtime) |
| 배포 | Vercel |
| 상태관리 | Supabase DB (서버사이드) |
| 실시간 | Supabase Realtime Broadcast + Presence |

---

## 3. 한자 데이터

### 3.1 준5급 배정한자 (50자)

| 구분 | 한자 |
|------|------|
| 숫자 | 一二三四五六七八九十百千萬 |
| 자연 | 日月火水木金土山川 |
| 크기/방향 | 大小中上下左右 |
| 사람 | 人女子王兄弟 |
| 개념 | 玉白天地正出生年名門文字休足向 |

### 3.2 추가 학습 한자 (46자)

| 구분 | 한자 |
|------|------|
| 가족 | 父母男 |
| 방위 | 東西南北 |
| 자연 | 江林石草 |
| 동물 | 馬牛魚羊 |
| 신체 | 口目耳手心 |
| 생활 | 國市車食衣光 |
| 기타 | 古今太少力本方外世合先立長靑不入 |
| 계절 | 春夏秋冬 |

### 3.3 사자성어 (5개)
- 山川草木 (산천초목), 東西南北 (동서남북), 春夏秋冬 (춘하추동)
- 上下左右 (상하좌우), 名山大川 (명산대천)

### 3.4 반의어 쌍 (16쌍)
上↔下, 左↔右, 東↔西, 南↔北, 大↔小, 天↔地, 山↔川, 火↔水,
父↔母, 兄↔弟, 男↔女, 古↔今, 春↔秋, 夏↔冬, 出↔入, 外↔中

---

## 4. 프로젝트 구조

```
hanja/
├── index.html              ← 진입점 (HTML 구조만)
├── package.json
├── vite.config.js
├── vercel.json
├── schema.sql              ← Supabase DB 스키마
├── .env                    ← Supabase 키
├── .gitignore
├── public/
├── src/
│   ├── main.js             ← 앱 진입점, 라우팅
│   ├── config.js           ← Supabase 클라이언트
│   ├── styles.css          ← 전체 CSS
│   ├── utils.js            ← 유틸리티 함수
│   ├── data/
│   │   ├── hanja.js        ← HANJA_CORE, HANJA_EXTRA, ALL_HANJA
│   │   ├── antonyms.js     ← ANTONYM_PAIRS
│   │   └── idioms.js       ← IDIOMS
│   ├── systems/
│   │   ├── router.js       ← Router (AbortController)
│   │   ├── store.js        ← Store (Supabase DB)
│   │   ├── sound.js        ← SoundSystem (WebAudio)
│   │   ├── effects.js      ← Effects (shake, flash, particles)
│   │   └── keyboard.js     ← 키보드 입력 매니저
│   ├── engine/
│   │   ├── ge3d.js         ← GE3D 3D 엔진
│   │   ├── helpers.js      ← voxBox, makeVoxelChar 등
│   │   └── ui.js           ← g3dHUD, g3dAnswerGrid 등
│   ├── games/
│   │   ├── archery.js      ← 양궁 (타겟 맞추기)
│   │   ├── swimming.js     ← 수영 (60초 스피드)
│   │   ├── weightlifting.js ← 역도 (연속 정답)
│   │   ├── gymnastics.js   ← 체조 (카드 매칭)
│   │   ├── marathon.js     ← 마라톤 (장애물)
│   │   ├── antonym.js      ← 반의어 매칭
│   │   ├── idiom.js        ← 사자성어 퀴즈
│   │   └── homonym.js      ← 동음이의어
│   ├── screens/
│   │   ├── splash.js       ← 3D 복셀 인트로
│   │   ├── auth.js         ← Supabase 인증
│   │   ├── hub.js          ← 메인 허브
│   │   ├── room.js         ← 멀티플레이어 방
│   │   ├── result.js       ← 결과 화면
│   │   ├── leaderboard.js  ← 리더보드
│   │   ├── profile.js      ← 프로필
│   │   └── study.js        ← 학습 모드
│   └── multiplayer/
│       ├── room-manager.js ← 방 생성/참가/나가기
│       ├── game-sync.js    ← 실시간 게임 동기화
│       └── presence.js     ← 접속자 상태
└── prd.md
```

---

## 5. 인증 시스템

### 5.1 Supabase Auth
- 이메일/비밀번호 기반 가입 및 로그인
- `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`
- `onAuthStateChange()` 로 세션 자동 관리

### 5.2 프로필
- 닉네임 (2~8자, unique)
- 아이콘 선택 (12종 이모지)
- `profiles` 테이블에 저장

---

## 6. 게임 종목 (8종)

### 6.1 양궁 (Archery)
- 한자를 보고 올바른 훈음 타겟을 선택
- 3D: 밤하늘 + 별, 복셀 기둥, 4개 3D 타겟 (떠다님)
- 화살 비행 애니메이션, 적중 시 파티클
- 10문제, PERFECT/GREAT/GOOD 보너스

### 6.2 수영 (Swimming)
- 60초 스피드 퀴즈 (정답당 수영 전진)
- 3D: 수영장, 물결, 레인 부표, 복셀 수영 선수
- NPC 레이서들과 경쟁

### 6.3 역도 (Weightlifting)
- 연속 정답으로 무게 증가
- 3D: 무대 + 스포트라이트, 복셀 리프터, 바벨
- 게이지 시스템 (스페이스바/탭)

### 6.4 체조 (Gymnastics)
- 카드 매칭 (한자-훈음 짝 찾기)
- 3D: 우주 보라색 배경, 3D 카드 뒤집기
- Raycasting 터치/클릭

### 6.5 마라톤 (Marathon)
- 스크롤링 복셀 풍경, 장애물 퀴즈
- 3D: 나무, 구름, 산, 도로, 달리기 애니메이션
- HP 시스템, 속도 단계

### 6.6 반의어 (Antonym)
- 반대말 한자 매칭
- 3D: 활 + 타겟 형태

### 6.7 사자성어 (Idiom)
- 빈칸 채우기 사자성어 퀴즈
- 3D: 서예 붓 + 두루마리

### 6.8 동음이의 (Homonym)
- 같은 소리 다른 뜻 한자 구분
- 3D: 책 더미 배경

---

## 7. Database Schema

```sql
profiles (id UUID PK, username TEXT UNIQUE, icon TEXT, created_at)
scores (id BIGSERIAL PK, user_id UUID FK, game_id TEXT, score INT, total INT, medal TEXT, wrong_answers JSONB, played_at)
rooms (id UUID PK, code TEXT UNIQUE, host_id UUID FK, game_id TEXT, status TEXT, max_players INT, created_at)
room_players (room_id UUID, user_id UUID, score INT, finished BOOL, joined_at) -- PK(room_id, user_id)
daily_challenges (user_id UUID, challenge_date DATE, score INT, medal TEXT) -- PK(user_id, challenge_date)
```

모든 테이블에 RLS 활성화. 프로필/점수는 누구나 읽기 가능, 본인만 쓰기.

---

## 8. 멀티플레이어 방 시스템

### 8.1 흐름
```
허브 → [방 만들기] → 게임 선택 → 4자리 코드 생성 → 대기실
허브 → [방 참가] → 코드 입력 → 대기실 → 호스트 시작 → 동시 게임 → 결과 비교
```

### 8.2 Realtime 채널
- `supabase.channel('room:{code}')` 사용
- Broadcast: game_start, player_score, player_done
- Presence: 접속자 실시간 표시

### 8.3 동기화
- 호스트가 seed 생성 → broadcast → 모든 플레이어 동일 문제
- 정답/오답 시 점수 broadcast → 실시간 순위 표시
- 모든 플레이어 완료 시 결과 비교

---

## 9. 키보드 조작 시스템

### 9.1 공통 키
| 키 | 동작 |
|----|------|
| 1, 2, 3, 4 | 4지선다 답안 선택 |
| ESC | 뒤로가기 |
| Enter | 확인/다음 |
| Space | 특수 동작 (역도 게이지 등) |
| 방향키/WASD | 카드/메뉴 탐색 |

### 9.2 PC/모바일 구분
- PC: 버튼에 `[1]`, `[2]`, `[3]`, `[4]` 키 힌트 표시
- 모바일: 키 힌트 숨김 (CSS `@media (hover: none)`)
- 동일 방에서 모바일 + PC 동시 플레이 가능

---

## 10. 크로스 플랫폼

### 10.1 입력
- 모바일: 터치 (기존 유지)
- PC: 키보드 (1-4, 방향키, Enter, ESC) + 마우스 클릭

### 10.2 반응형 3D
- 모바일: 전체화면, FOV 60, 하단 답안 버튼
- PC: 전체화면, FOV 50, 키보드 힌트

### 10.3 방 코드 공유
- PC: 코드 복사 + URL 공유
- 모바일: 코드 복사 버튼

---

## 11. 배포 (Vercel)

- `vercel.json`: Vite 빌드 설정
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- SPA rewrite 설정
- GitHub 연동 자동 배포

---

## 12. 메달 기준

| 종목 | 금 | 은 | 동 |
|------|----|----|----|
| 양궁 | 9+ | 7+ | 5+ |
| 수영 | 20+ | 15+ | 10+ |
| 역도 | 15+ | 10+ | 5+ |
| 체조 | ≤12회 | ≤16회 | ≤20회 |
| 마라톤 | 90%+ | 70%+ | 50%+ |
| 반의어 | 9+ | 7+ | 5+ |
| 사자성어 | 80%+ | 60%+ | 40%+ |
| 동음이의 | 15+ | 10+ | 5+ |
| 일일도전 | 9+ | 7+ | 5+ |

---

## 13. 시스템 아키텍처

### 13.1 Router
- AbortController 기반 화면 전환
- signal로 이벤트 리스너 자동 해제

### 13.2 SoundSystem
- WebAudio API 오실레이터 기반
- 18+ 합성 사운드 (correct, wrong, medal, whoosh, impact 등)

### 13.3 Effects
- shake (3단계), flash (4색), particles, combo popup
- countdown, hitStop, vignette

### 13.4 GE3D (3D Engine)
- WebGLRenderer, 게임 루프, 3D 파티클, 카메라 셰이크
- 각 게임: {scene, camera, init(), update(dt), cleanup(), getResult(), isDone()}
- 복셀 아트: BoxGeometry + MeshLambertMaterial

### 13.5 Store
- Supabase Auth + PostgreSQL
- 비동기 API: signup(), login(), logout(), saveScore(), getBestScores(), getLeaderboard()
- 일일 도전: saveDailyChallenge(), getDailyChallenge(), getDailyStreak()
