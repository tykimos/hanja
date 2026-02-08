# Plan: Hanja Olympics Arcade Overhaul

## Context

### Original Request
한자 올림픽 게임을 진짜 아케이드 게임처럼 타격감, 긴장감, 속도감, 재미, 스릴이 느껴지도록 전면 개편한다.

### User Core Complaint
- "시시하다, 버튼만 누르는 화면이다"
- 타격감(impact feedback)이 없다
- 긴장감(tension)이 없다
- 속도감(speed feel)이 없다
- 재미(fun)와 스릴(thrill)이 없다
- "그냥 버튼만 누르는 퀴즈"에 불과하다

### Current State Analysis
파일: `/Users/tykimos/vibecode/hanja/index.html` (단일 HTML, 2227줄)

**현재 구현된 V2 아케이드 엔진들의 문제점 진단:**

1. **양궁 (ArcheryV2)**: 조준선이 움직이긴 하지만 4지선다 버튼을 누르는 것이 핵심. 조준선 위치가 점수에 영향을 주지 않음. 실제로는 "움직이는 배경 위의 퀴즈"에 불과.
2. **수영 (SwimmingV2)**: CPU 수영선수가 레이스하지만 결국 4지선다 퀴즈. 정답 시 7% 전진, 오답 시 1.5% 전진. CPU는 무작위로 움직여서 긴장감 부족.
3. **역도 (WeightliftingV2)**: 무게 시각화와 게이지가 있지만 여전히 4지선다. 리프터 애니메이션만 다를 뿐 게임플레이는 동일.
4. **체조 (GymnasticsV2)**: 카드매칭은 유일하게 다른 메커니즘이지만, 콤보 시스템이 텍스트 표시뿐이고 보상감이 없음. 타이머 압박 없음.
5. **마라톤 (MarathonV2)**: 배경이 스크롤되고 러너가 뛰지만 여전히 4지선다. 체력/장애물 시스템 없음.

**공통 문제:**
- 모든 게임이 `game-options` 4지선다 그리드를 그대로 사용
- 정답/오답 피드백이 색 변경 + 간단한 사운드뿐
- screen shake는 역도에만 있고 나머지는 없음
- 콤보/연쇄/멀티플라이어 시스템 없음
- 카운트다운/준비 시퀀스 없음
- 파티클/이펙트가 결과 화면 confetti 외 없음

### Research Findings (Codebase)
- 기존 `SoundSystem`: WebAudio API 기반, correct/wrong/medal/flip/tick 5종만 존재
- 기존 CSS 애니메이션: fadeIn, bounceIn, shake, medalDrop, confettiFall, pulse, slideUp, ringPulse, swimBoost, liftAnim, failAnim, screenShake, comboPulse, runBounce, stumbleAnim 등
- 기존 데이터: ALL_HANJA 96자, ANTONYM_PAIRS 16쌍, IDIOMS 5개
- AbortController 기반 화면 전환 시 cleanup 패턴 사용
- V1 엔진과 V2 엔진이 모두 남아있음 (V1은 사용되지 않음)

---

## Work Objectives

### Core Objective
5개 올림픽 종목 게임 각각에 고유한 아케이드 메커니즘을 부여하여, "버튼만 누르는 퀴즈"에서 "진짜 게임을 하면서 한자를 배우는" 경험으로 전환한다.

### Deliverables
1. 5개 게임 각각의 새로운 아케이드 메커니즘 구현
2. 범용 게임 이펙트 시스템 (screen shake, flash, particles, combo)
3. 확장된 사운드 시스템 (게임별 고유 사운드)
4. 게임 시작 시퀀스 (카운트다운 / 준비 연출)
5. V1 엔진 코드 제거 (dead code cleanup)

### Definition of Done
- 각 게임이 고유한 인터랙션 패턴을 가짐 (단순 4지선다가 아닌)
- 정답 시 시각적/청각적 타격감이 확실히 느껴짐
- 오답 시 페널티가 게임 진행에 실질적 영향을 줌
- 모바일 터치에서 매끄럽게 동작
- 기존 점수/메달/리더보드 시스템과 호환

---

## Must Have / Must NOT Have

### MUST HAVE
- 각 게임별 고유 인터랙션 (아래 상세 설계 참조)
- 화면 흔들림(screen shake), 히트 플래시, 파티클 이펙트
- 게임별 고유 사운드 (타격음, 물소리, 쇠소리 등)
- 콤보/연쇄 시스템과 시각적 보상
- 타이머 압박감 (진동하는 타이머, 색 변화, 경고음)
- 게임 시작 카운트다운 연출 ("3... 2... 1... START!")
- 기존 localStorage 데이터 구조 호환
- 모바일 터치 호환

### MUST NOT HAVE
- 외부 라이브러리/CDN 의존성
- 별도 파일 분리 (단일 HTML 유지)
- Canvas API 의존 (CSS 애니메이션 우선, Canvas는 보조적으로만)
- 기존 한자 데이터 변경
- 기존 사용자/점수 데이터 구조 파괴
- 기존 메달 기준 변경 (호환성)

---

## Game-by-Game Arcade Redesign

### GAME 1: Archery (양궁) - "조준하고 쏴라"

**현재 문제**: 조준선이 움직이지만 4지선다와 무관. 조준선 위치가 점수에 영향 없음.

**새로운 메커니즘: 2-Phase 사격**

Phase 1 - 조준 (Aim):
- 한자가 과녁 중앙에 표시됨
- 조준선(crosshair)이 리사주(Lissajous) 패턴으로 움직임
- 화면 하단에 훈음 4지선다 표시
- 정답을 터치하면 Phase 2로 이동

Phase 2 - 발사 (Shoot):
- "SHOOT!" 버튼이 나타남 (또는 과녁 터치)
- 버튼 누르는 타이밍에 조준선 위치가 화살 착탄점이 됨
- 조준선이 중심에 가까울수록 보너스 점수:
  - 불스아이(중심 8%): +3점 보너스 + "PERFECT!" 연출
  - 내부 원(20%): +2점 보너스 + "GREAT!" 연출
  - 중간 원(40%): +1점 보너스 + "GOOD!" 연출
  - 외곽: +0점 보너스
- 오답 선택 시: 화살이 빗나가는 애니메이션 + 점수 없음

**피드백 이펙트:**
- 적중 시: 과녁 임팩트 플래시(흰색 원 확산) + screen shake(작게) + 화살 꽂히는 사운드 + 점수 팝업 애니메이션
- 빗나감 시: 화살 날아가는 소리 + 과녁 밖 표시 + 흔들림 없음
- 불스아이 시: 강한 screen shake + 골드 파티클 + 특수 사운드 + 화면 전체 골드 플래시
- 라운드 간 전환: 화살이 과녁에 남아있음 (누적 표시)

**점수 체계:**
- 기본 정답: 1점 (기존과 동일, 메달 기준 호환)
- 보너스 점수: 별도 표시 (총점은 "정답수 + 보너스"로 표시하되, recordGameResult에는 정답수만 저장)

**사운드:**
- 조준 중: 미세한 "윙..." 소리 (저주파 지속음)
- 발사: "슝!" (화이트노이즈 버스트)
- 적중: "탁!" (짧은 임팩트)
- 불스아이: "딩!" + 멜로디

---

### GAME 2: Swimming (수영) - "타이핑 레이스"

**현재 문제**: 4지선다 + CPU 레이스지만 CPU가 랜덤이라 긴장감 없음.

**새로운 메커니즘: 연타 + 빠른 선택 레이스**

Core Loop:
- 화면 상단: 수영장 레인 시각화 (플레이어 + CPU 3명)
- 훈음이 표시되면 올바른 한자를 선택 (4지선다)
- 정답 시: 플레이어가 크게 전진 (8%) + 스피드 부스트 애니메이션
- 오답 시: 플레이어 정지 1초 + 물에 빠지는 연출 (스프라이트 가라앉음) + CPU는 계속 전진

**긴장감 요소:**
- CPU 난이도 자동 조절: CPU 속도가 플레이어 점수 기반으로 조절됨
  - 플레이어가 잘하면 CPU가 빨라짐 (레이스 박빙)
  - 플레이어가 못하면 CPU가 느려짐 (포기 방지)
- 레이스 순위 실시간 표시 ("1위!", "2위..." 등)
- 남은 거리 표시 + 골인라인 점점 가까워짐
- 마지막 10초: 배경 빨개짐 + 경고음 빨라짐 + 타이머 크기 커짐
- 턴어라운드: 50m 지점에서 벽 터치 후 돌아옴 (시각적으로 수영 방향 반전)

**피드백 이펙트:**
- 정답: 물 스플래시 파티클 (물방울 CSS 애니메이션) + 부스트 사운드 + 레인에 물결 이펙트
- 오답: "첨벙" 사운드 + 수영선수 가라앉는 CSS + 1초 freeze
- 1위 유지 중: 레인에 반짝이는 효과
- 결승선 도착: 큰 스플래시 + 환호 사운드

**사운드:**
- 배경: 물 출렁이는 소리 (저주파 LFO)
- 정답: "첼!" (스플래시 화이트노이즈)
- 오답: "퐁" (저음 둔탁한 소리)
- 마지막 10초: 심장박동 소리 (저주파 펄스)
- 결승: 호루라기 소리

---

### GAME 3: Weightlifting (역도) - "파워 게이지 타이밍"

**현재 문제**: 4지선다에 리프터 애니메이션만 추가. 게이지가 있지만 장식.

**새로운 메커니즘: 3-Phase 리프팅**

Phase 1 - 문제 풀기:
- 한자/훈음 문제 표시 + 4지선다
- 정답을 맞혀야 Phase 2로 진행
- 오답 시: 바벨이 떨어지며 게임 종료 (기존과 동일)

Phase 2 - 파워 충전 (Power Gauge):
- 정답 후 즉시 파워 게이지가 나타남
- 게이지가 좌 -> 우로 빠르게 왕복
- 게이지 영역:
  - 빨간색(0-30%): FAIL - 들어올리기 실패, 게임 종료
  - 노란색(30-60%): OK - 성공, streak +1
  - 초록색(60-85%): GREAT - 성공, streak +1, 보너스 이펙트
  - 골드색(85-100%): PERFECT - 성공, streak +1, 큰 보너스 이펙트
- 게이지가 빨라지는 속도: streak이 높을수록 빨라짐

Phase 3 - 리프팅 연출:
- OK: 선수가 버벅거리며 들어올림 (떨림 + 느린 리프트)
- GREAT: 깔끔하게 들어올림 (빠른 리프트)
- PERFECT: 폭발적으로 들어올림 + 골드 파티클 + 바닥 균열 이펙트
- FAIL: 바벨이 떨어짐 + 큰 screen shake + 먼지 이펙트

**긴장감 요소:**
- 무게가 올라갈수록:
  - 바벨 원판 개수 증가 (시각적)
  - 게이지 속도 증가
  - 빨간색 영역 확대 (FAIL 확률 증가)
  - 배경 빨개짐 (압박감)
- "세계 신기록 도전!" 메시지 (이전 최고 streak 넘었을 때)
- 심판 3명 표시 (OK, GREAT, PERFECT에 따라 빨간불/흰불)

**피드백 이펙트:**
- 파워 게이지 터치: 강한 임팩트 진동(CSS) + screen shake
- PERFECT 리프트: 전체 화면 황금빛 플래시 + 폭발 파티클 + 군중 환호 사운드
- FAIL: 대형 screen shake + 화면 빨간 플래시 + "쿵!" 사운드

**사운드:**
- 게이지 이동: "윙윙" (주파수 변조)
- 게이지 멈춤(터치): "딱!" (짧은 임팩트)
- 리프트 성공: "으아아!" (상승 주파수) + 금속 소리
- 리프트 PERFECT: 폭발음 + 팡파레
- 실패: "쿵..." (하강 주파수) + 무거운 낙하음

---

### GAME 4: Gymnastics (체조) - "리듬 콤보 매칭"

**현재 문제**: 카드매칭인데 콤보가 텍스트뿐, 타이머 압박 없음.

**새로운 메커니즘: 시간 압박 + 콤보 폭발 카드매칭**

Core Mechanic (카드매칭 유지하되 강화):

시간 시스템:
- 전체 90초 제한 시간 추가
- 카드 한 쌍 맞출 때마다 +5초 보너스 (콤보 시 +8초)
- 남은 시간이 20초 이하: 타이머 빨개지며 펄스 + 경고음
- 남은 시간이 10초 이하: 화면 테두리 빨간 빛 깜빡임
- 시간 초과 시: 현재까지 맞춘 쌍 수로 점수 계산

콤보 시스템 강화:
- 연속 매칭 성공 시 콤보 카운터 증가
- 콤보 2x: "COMBO!" 텍스트 + 카드 매칭 시 무지개색 테두리
- 콤보 3x: "SUPER COMBO!" + screen shake + 점수 2배
- 콤보 4x+: "ULTRA COMBO!" + 골드 파티클 폭발 + 시간 보너스 +8초 + 점수 3배
- 콤보 끊김: "BREAK" 텍스트 + 화면 살짝 어두워짐

카드 이펙트:
- 매칭 성공: 두 카드가 빛나며 사라짐 (축소 + 반짝 + 별 파티클)
- 매칭 실패: 카드가 빨갛게 번쩍 + 작은 screen shake
- 마지막 쌍 매칭: 큰 폭발 이펙트 + 모든 남은 카드가 빛남

**추가 메커니즘:**
- 3초 미리보기 중에 "기억하세요!" 텍스트 + 카운트다운
- 미리보기 끝: "START!" + 카드 뒤집히는 물결 효과 (왼쪽->오른쪽 순서대로)

**사운드:**
- 카드 터치: "톡" (기존 flip 강화)
- 매칭 성공: "딩!" + 콤보 수에 따라 음높이 상승
- 매칭 실패: "붕" (저음)
- 콤보 3+: "쩡!" (전기 스파크 느낌)
- 시간 보너스: "+5초!" 보이스 느낌의 효과음

---

### GAME 5: Marathon (마라톤) - "서바이벌 런"

**현재 문제**: 배경 스크롤 + 4지선다. 96문제 전부 풀어야 해서 지루함.

**새로운 메커니즘: 체력 + 장애물 + 가속 서바이벌**

체력 시스템:
- HP 바 표시 (최대 5칸, 하트 아이콘)
- 오답 시: HP -1 + 러너 stumble + 화면 빨간 플래시
- HP 0: 게임 오버 (현재까지의 진행률로 점수)
- HP 회복: 5연속 정답마다 HP +1 (최대 5)

속도 시스템:
- 기본 속도에서 시작
- 연속 정답: 속도 증가 (배경 스크롤 빨라짐 + 도로 라인 빨라짐)
- 오답: 속도 리셋 + 러너 넘어짐 + 배경 멈춤 1초
- 속도 단계 표시: "조깅" -> "달리기" -> "스프린트" -> "전력 질주!"
- 속도 높을수록: 러너 뛰는 애니메이션 빨라짐 + 모션 블러 효과

장애물 시스템:
- 매 10문제마다 "장애물 이벤트" 발생:
  - 10km: 오르막길 (2문제 연속 정답 필요, 실패 시 HP -1)
  - 20km: 급커브 (제한시간 5초 문제)
  - 30km: 비 구간 (화면에 비 이펙트 + 글자가 흐리게 보임)
  - 35km: "벽" (4지선다가 아닌 직접 입력 - 훈음의 첫 글자만)
- 장애물 통과 시: 보너스 점수 + 특수 이펙트

거리 마일스톤:
- 5km마다 마일스톤 팝업 ("5km 통과!")
- 21km (하프): 특별 연출 + "하프 마라톤 완주!"
- 42km: 결승선 연출 + 큰 팡파레

**피드백 이펙트:**
- 정답: 러너 부스트 + 속도감 라인(모션 블러) + 작은 파티클
- 오답: 러너 넘어짐 + HP 하트 깨지는 애니메이션 + screen shake
- HP 1 남음: 화면 가장자리 빨간 비네트 효과 + 심장 박동 소리
- 마일스톤: 큰 텍스트 팝업 + 골드 플래시
- 완주: 결승 테이프 끊기 + confetti + 환호

**사운드:**
- 달리기: 발소리 리듬 (속도에 비례)
- 정답: "슈!" (바람 소리)
- 오답: "쿵" + HP 감소 소리
- HP 1: 심장 박동
- 마일스톤: 팡파레
- 완주: 군중 환호

---

## Universal Effect Systems (범용 시스템)

### 1. Screen Shake System
```
강도 레벨:
- light: translateX +/-4px, 0.2s (정답)
- medium: translateX +/-8px + translateY +/-3px, 0.3s (오답, 실패)
- heavy: translateX +/-12px + translateY +/-6px + rotate +/-2deg, 0.5s (PERFECT, 불스아이)
```
적용: `.app-container`에 CSS class 토글

### 2. Flash System
```
- greenFlash: 화면 전체 0.15s 초록 오버레이 (정답)
- redFlash: 화면 전체 0.15s 빨간 오버레이 (오답)
- goldFlash: 화면 전체 0.3s 골드 오버레이 (PERFECT/불스아이)
- whiteFlash: 충돌 지점에서 원형 확산 0.3s (임팩트)
```
구현: position:fixed div + opacity 애니메이션

### 3. Particle System (CSS-only)
```
- sparkle: 작은 별 모양 8-12개, 중심에서 방사형 확산
- splash: 물방울 6-8개, 위로 튀었다 아래로 떨어짐
- dust: 먼지 구름, 바닥에서 위로 퍼짐
- confetti: 기존 confetti 강화 (더 많이, 더 다양한 모양)
- heartBreak: 하트가 깨지며 조각이 흩어짐
```
구현: 동적 div 생성 + CSS keyframe + setTimeout 제거

### 4. Combo System (Universal)
```
- comboCount 추적
- 콤보 텍스트 팝업 (중앙 상단, 크기 + 색상 escalation)
- 콤보 배경 glow 효과
- 콤보 끊김 시 "BREAK" 표시
```

### 5. Countdown System (게임 시작 시)
```
모든 게임 시작 시:
1. 화면 어두워짐 (overlay)
2. "3" (큰 텍스트, bounceIn, 드럼 사운드)
3. "2" (bounceIn, 드럼 사운드)
4. "1" (bounceIn, 드럼 사운드)
5. "GO!" / "START!" (골드 플래시 + 특수 사운드)
6. 오버레이 제거 -> 게임 시작
약 2.5초 소요
```

### 6. Extended Sound System
기존 5종(correct, wrong, medal, flip, tick)에 추가:
```
New sounds:
- impact_light: 가벼운 타격 (sine burst 800Hz, 0.05s)
- impact_heavy: 강한 타격 (square burst 200Hz->100Hz, 0.15s)
- whoosh: 바람 소리 (white noise filtered, 0.2s)
- splash: 물 소리 (white noise + low-pass filter, 0.15s)
- metal_clang: 금속 소리 (triangle 440Hz + harmonics, 0.3s)
- heartbeat: 심장 박동 (sine 60Hz pulse, 0.8s loop)
- countdown_tick: 카운트다운 (sine 440Hz, 0.1s)
- countdown_go: 시작 (chord C-E-G, 0.3s)
- combo_hit: 콤보 (주파수가 콤보 수에 비례)
- power_charge: 파워 충전 (ascending frequency sweep)
- gauge_stop: 게이지 정지 (click sound)
- cheer: 환호 (white noise + formant filter, 0.5s)
- whistle: 호루라기 (sine 2000Hz -> 1500Hz, 0.4s)
```

---

## Task Flow and Dependencies

```
[Task 0] V1 엔진 제거 + 코드 정리
    |
[Task 1] 범용 이펙트 시스템 구축 ────────────────────────────────┐
    |        (shake, flash, particle, combo, countdown, sound)    |
    |                                                             |
    ├──>[Task 2] 양궁 아케이드 개편                               |
    |                                                             |
    ├──>[Task 3] 수영 아케이드 개편                               |
    |                                                             |
    ├──>[Task 4] 역도 아케이드 개편                               |
    |                                                             |
    ├──>[Task 5] 체조 아케이드 개편                               |
    |                                                             |
    ├──>[Task 6] 마라톤 아케이드 개편                              |
    |                                                             |
    └──>[Task 7] 일일 도전 이펙트 적용 + 전체 통합 테스트 <────────┘
```

**중요**: Task 2-6은 Task 1에 의존하지만, 서로 간에는 독립적. 단, 단일 파일이므로 병렬 실행 불가 - 순차 실행 필요.

---

## Detailed TODOs

### Task 0: V1 엔진 제거 + 코드 정리
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createArcheryEngine()` 함수 제거 (라인 ~1087-1143)
- [ ] `createSwimmingEngine()` 함수 제거 (라인 ~1146-1223)
- [ ] `createWeightliftingEngine()` 함수 제거 (라인 ~1226-1295)
- [ ] `createGymnasticsEngine()` 함수 제거 (라인 ~1298-1395)
- [ ] `createMarathonEngine()` 함수 제거 (라인 ~1398-1469)
- [ ] V1 전용 CSS 정리 (사용되지 않는 클래스 확인)

**Acceptance Criteria**: V2 엔진만 남아있고, 모든 게임이 정상 동작

---

### Task 1: 범용 이펙트 시스템 구축
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

**1a. CSS 추가 - 새 keyframe 애니메이션들:**
- [ ] `@keyframes shakeLight` (4px, 0.2s)
- [ ] `@keyframes shakeMedium` (8px + 3px Y, 0.3s)
- [ ] `@keyframes shakeHeavy` (12px + 6px Y + 2deg rotate, 0.5s)
- [ ] `@keyframes flashGreen` (초록 overlay fade)
- [ ] `@keyframes flashRed` (빨간 overlay fade)
- [ ] `@keyframes flashGold` (골드 overlay fade)
- [ ] `@keyframes impactFlash` (원형 확산)
- [ ] `@keyframes sparkleOut` (별 파티클 방사)
- [ ] `@keyframes splashUp` (물방울 위로 튀기)
- [ ] `@keyframes dustCloud` (먼지 구름)
- [ ] `@keyframes heartBreak` (하트 깨짐)
- [ ] `@keyframes comboText` (콤보 텍스트 팝업 + 크기 변화)
- [ ] `@keyframes countdownPop` (카운트다운 숫자)
- [ ] `@keyframes vignetteRed` (빨간 비네트)
- [ ] `@keyframes motionBlur` (모션 블러 라인)
- [ ] `@keyframes barGlow` (게이지 빛남)
- [ ] CSS 클래스: `.shake-light`, `.shake-medium`, `.shake-heavy`
- [ ] CSS: `.flash-overlay` (fixed div 스타일)
- [ ] CSS: `.particle` (기본 파티클 스타일)
- [ ] CSS: `.countdown-overlay` (카운트다운 오버레이)
- [ ] CSS: `.combo-display` (콤보 텍스트)
- [ ] CSS: `.hp-bar`, `.hp-heart` (체력 바)
- [ ] CSS: `.speed-indicator` (속도 표시)
- [ ] CSS: `.power-gauge-v3` (역도 파워게이지)

**1b. JavaScript - Effects 시스템 객체:**
- [ ] `Effects.shake(level)` - level: 'light'|'medium'|'heavy'
- [ ] `Effects.flash(color)` - color: 'green'|'red'|'gold'|'white'
- [ ] `Effects.particles(type, x, y, count)` - type: 'sparkle'|'splash'|'dust'|'heartBreak'
- [ ] `Effects.comboPopup(count)` - 콤보 텍스트 팝업
- [ ] `Effects.textPopup(text, color, x, y)` - 범용 텍스트 팝업
- [ ] `Effects.countdown(callback)` - 3-2-1-GO 시퀀스 후 callback 호출

**1c. JavaScript - SoundSystem 확장:**
- [ ] `impact_light` 사운드 추가
- [ ] `impact_heavy` 사운드 추가
- [ ] `whoosh` 사운드 추가
- [ ] `splash` 사운드 추가 (white noise + filter)
- [ ] `metal_clang` 사운드 추가
- [ ] `heartbeat` 사운드 추가 (loopable)
- [ ] `countdown_tick` 사운드 추가
- [ ] `countdown_go` 사운드 추가
- [ ] `combo_hit` 사운드 추가 (frequency scales with combo)
- [ ] `power_charge` 사운드 추가
- [ ] `gauge_stop` 사운드 추가
- [ ] `cheer` 사운드 추가
- [ ] `whistle` 사운드 추가
- [ ] `SoundSystem.stopLoop(id)` 루프 정지 메서드

**Acceptance Criteria**:
- `Effects.shake('heavy')` 호출 시 화면이 확실히 흔들림
- `Effects.flash('gold')` 호출 시 황금빛이 0.3초간 비침
- `Effects.particles('sparkle', 50, 50, 12)` 호출 시 별 파티클 방사
- `Effects.countdown(fn)` 호출 시 3-2-1-GO 후 fn 실행
- 모든 새 사운드가 재생됨
- 기존 게임에 영향 없음

---

### Task 2: 양궁 아케이드 개편
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createArcheryEngineV2()` -> `createArcheryEngineV3()` 교체
- [ ] 새 CSS: `.archery-shoot-btn` (SHOOT 버튼 스타일, 펄스 애니메이션)
- [ ] 새 CSS: `.archery-impact` (적중 임팩트 원형 확산)
- [ ] 새 CSS: `.archery-score-badge` (점수 배지 - PERFECT/GREAT/GOOD)
- [ ] Phase 1 구현: 문제 표시 + 4지선다 (조준선 계속 이동)
- [ ] Phase 2 구현: 정답 선택 후 "SHOOT!" 버튼 표시 + 타이밍 메커니즘
- [ ] 조준선 위치 -> 보너스 점수 계산 로직
- [ ] 적중/빗나감 시 이펙트: flash, shake, particles 연동
- [ ] 불스아이 특별 이펙트
- [ ] 화살 누적 표시 (라운드 간 유지)
- [ ] 게임 시작 시 `Effects.countdown()` 호출
- [ ] 양궁 전용 사운드 연동 (whoosh, impact_light, impact_heavy)
- [ ] `startGame('archery')` 에서 V3 엔진 사용하도록 수정
- [ ] 메달 기준 호환 확인 (기존 정답수 기반)

**Acceptance Criteria**:
- 정답 선택 -> SHOOT 버튼 클릭 -> 조준선 위치에 화살 표시 -> 보너스 계산 흐름 동작
- 불스아이 시 화면이 크게 흔들리고 골드 파티클 나옴
- 기존 메달 기준으로 정상 기록됨

---

### Task 3: 수영 아케이드 개편
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createSwimmingEngineV2()` -> `createSwimmingEngineV3()` 교체
- [ ] CPU 난이도 자동 조절 로직 구현
- [ ] 실시간 순위 표시 UI
- [ ] 오답 시 1초 정지 + 수영선수 가라앉는 CSS
- [ ] 정답 시 물 스플래시 파티클
- [ ] 마지막 10초 긴장감 연출 (배경색, 타이머 크기, 경고음)
- [ ] 결승선 도착 연출
- [ ] 턴어라운드 시각 효과 (50% 지점)
- [ ] 게임 시작 시 호루라기 + countdown
- [ ] 수영 전용 사운드 연동 (splash, whistle, heartbeat)
- [ ] `startGame('swimming')` 에서 V3 엔진 사용

**Acceptance Criteria**:
- CPU가 플레이어 실력에 맞춰 속도 조절됨
- 오답 시 수영선수가 가라앉고 1초간 정지
- 마지막 10초에 긴장감이 확실히 느껴짐

---

### Task 4: 역도 아케이드 개편
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createWeightliftingEngineV2()` -> `createWeightliftingEngineV3()` 교체
- [ ] 새 CSS: `.wl-power-gauge-v3` (왕복 게이지, 영역 색상)
- [ ] 새 CSS: `.wl-judge` (심판 표시)
- [ ] 새 CSS: `.wl-crack` (바닥 균열 이펙트)
- [ ] Phase 1: 문제 풀기 (기존 4지선다)
- [ ] Phase 2: 파워 게이지 구현 (requestAnimationFrame 기반 왕복)
- [ ] Phase 2: 터치/클릭으로 게이지 정지
- [ ] Phase 2: 영역별 판정 (FAIL/OK/GREAT/PERFECT)
- [ ] Phase 3: 판정별 리프팅 애니메이션 분기
- [ ] 게이지 속도 = streak 기반 증가
- [ ] FAIL 영역 = streak 기반 확대
- [ ] "세계 신기록 도전!" 메시지 (이전 최고 초과 시)
- [ ] 심판 3명 표시 + 판정 표시
- [ ] 역도 전용 사운드 연동 (metal_clang, power_charge, gauge_stop, impact_heavy)
- [ ] `startGame('weightlifting')` 에서 V3 엔진 사용

**Acceptance Criteria**:
- 정답 후 파워 게이지가 나타나고 왕복
- 게이지 터치 시 정지 + 영역별 판정
- PERFECT 시 화면이 크게 흔들리고 골드 이펙트
- FAIL 시 게임 종료

---

### Task 5: 체조 아케이드 개편
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createGymnasticsEngineV2()` -> `createGymnasticsEngineV3()` 교체
- [ ] 90초 제한 시간 추가
- [ ] 매칭 성공 시 +5초 (콤보 시 +8초) 시간 보너스
- [ ] 시간 보너스 팝업 ("+5s!" 텍스트)
- [ ] 콤보 시각 강화: 레벨별 다른 이펙트 (COMBO/SUPER/ULTRA)
- [ ] 매칭 성공 시 카드 사라지는 이펙트 (축소 + 별 파티클)
- [ ] 매칭 실패 시 빨간 플래시 + 작은 shake
- [ ] 남은 시간 20초: 타이머 빨간 펄스 + 경고음
- [ ] 남은 시간 10초: 화면 테두리 빨간 빛
- [ ] 시간 초과 시 현재까지 결과로 점수 계산
- [ ] 미리보기 중 카운트다운 (3초 -> "기억하세요!" -> "START!")
- [ ] 마지막 쌍 매칭 시 큰 폭발 이펙트
- [ ] 체조 전용 사운드 연동 (combo_hit, impact_light)
- [ ] `startGame('gymnastics')` 에서 V3 엔진 사용
- [ ] 메달 기준: 기존 시도 횟수 + 시간 초과 여부 고려

**Acceptance Criteria**:
- 90초 타이머가 동작하고 보너스 시간 추가됨
- 콤보 3+ 시 화면 효과가 확실히 달라짐
- 시간이 부족할 때 긴장감이 느껴짐

---

### Task 6: 마라톤 아케이드 개편
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] `createMarathonEngineV2()` -> `createMarathonEngineV3()` 교체
- [ ] HP 시스템 구현 (최대 5, 시작 5)
- [ ] HP 바 UI (하트 아이콘)
- [ ] 오답 시 HP -1 + 하트 깨짐 애니메이션
- [ ] HP 0 시 게임 오버
- [ ] 5연속 정답 시 HP +1 회복 (최대 5)
- [ ] 속도 시스템: 연속 정답 -> 속도 증가 (배경 스크롤 빨라짐)
- [ ] 속도 단계 표시: 조깅/달리기/스프린트/전력 질주
- [ ] 오답 시 속도 리셋 + 1초 freeze
- [ ] 장애물 이벤트 (10/20/30/35km):
  - [ ] 10km 오르막: 2연속 정답 필요
  - [ ] 20km 급커브: 5초 제한시간
  - [ ] 30km 비: 비 CSS 이펙트 + 글자 blur
  - [ ] 35km 벽: 훈음 첫 글자 입력 (input)
- [ ] 거리 마일스톤 팝업 (5km마다)
- [ ] 21km 하프마라톤 특별 연출
- [ ] HP 1 남음: 빨간 비네트 + heartbeat 사운드
- [ ] 결승선 연출 (테이프 끊기 + confetti)
- [ ] 마라톤 전용 사운드 연동 (heartbeat, whoosh, cheer)
- [ ] `startGame('marathon')` 에서 V3 엔진 사용
- [ ] 메달 기준: 기존 정답률 기반 (HP 0 시 현재까지로 계산)

**Acceptance Criteria**:
- HP가 표시되고 오답 시 감소
- HP 0 시 게임 오버
- 속도 단계가 시각적으로 구분됨
- 장애물 이벤트가 일반 문제와 다르게 동작
- HP 1일 때 긴장감이 느껴짐

---

### Task 7: 일일 도전 이펙트 + 통합 테스트
**파일**: `/Users/tykimos/vibecode/hanja/index.html`

- [ ] 일일 도전에 Effects 시스템 적용 (flash, shake on correct/wrong)
- [ ] 일일 도전 시작 시 countdown 추가
- [ ] `startGame()` switch문에서 V3 엔진들 사용 확인
- [ ] 모든 게임 시작->플레이->종료->결과->허브 복귀 흐름 확인
- [ ] 결과 화면: 게임별 추가 통계 표시 (보너스 점수, 최대 콤보, 레이스 순위 등)
- [ ] 리더보드/프로필에서 기존 데이터 호환 확인
- [ ] 모바일 터치 테스트 (터치 이벤트 호환)
- [ ] AbortController cleanup 확인 (화면 전환 시 이펙트/사운드 정지)
- [ ] 메모리 누수 확인 (파티클 DOM 노드 정리)

**Acceptance Criteria**:
- 모든 5개 게임 + 일일 도전이 새 이펙트와 함께 동작
- 화면 전환 시 잔여 이펙트/사운드 없음
- 기존 저장 데이터로 로그인 후 정상 동작

---

## Commit Strategy

```
Commit 1: "chore: remove V1 engine dead code"
  - Task 0

Commit 2: "feat: add universal arcade effect systems (shake, flash, particles, combo, countdown, extended sounds)"
  - Task 1

Commit 3: "feat: redesign archery with 2-phase aim-and-shoot mechanic"
  - Task 2

Commit 4: "feat: redesign swimming with adaptive CPU race and splash effects"
  - Task 3

Commit 5: "feat: redesign weightlifting with power gauge timing mechanic"
  - Task 4

Commit 6: "feat: redesign gymnastics with time pressure and combo explosion"
  - Task 5

Commit 7: "feat: redesign marathon with HP system, speed stages, and obstacles"
  - Task 6

Commit 8: "feat: apply effects to daily challenge + integration testing fixes"
  - Task 7
```

---

## Success Criteria

| Criteria | Metric |
|----------|--------|
| 타격감 | 정답/오답 시 screen shake + flash + 사운드가 0.5초 이내 연속 발생 |
| 긴장감 | 각 게임에 시간/체력 등 "잃을 수 있는 것"이 존재 |
| 속도감 | 정답 시 속도 가속/부스트 시각 효과 존재 |
| 재미 | 5개 게임이 서로 다른 인터랙션 패턴 보유 |
| 스릴 | PERFECT/불스아이 등 "완벽한 타이밍" 보상 존재 |
| 호환성 | 기존 메달/점수/리더보드 시스템 정상 동작 |
| 성능 | 파티클 최대 20개 동시 표시, 60fps 유지 |
| 모바일 | 터치 이벤트로 모든 인터랙션 가능 |

---

## Risk Analysis

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| 단일 파일 크기 폭증 (2227줄 -> 4000줄+) | Medium | High | CSS 최소화, 함수 재사용, V1 코드 제거로 상쇄 |
| 파티클 남발 시 모바일 성능 저하 | High | Medium | 파티클 수 제한 (최대 20개), requestAnimationFrame 사용, DOM 즉시 정리 |
| WebAudio API 모바일 호환성 | Medium | Low | 이미 작동 중이므로 기존 패턴 유지, 사운드 실패 시 silent fallback |
| 파워 게이지 타이밍이 모바일에서 부정확 | Medium | Medium | requestAnimationFrame 기반, 터치 지연 고려한 관대한 판정 영역 |
| 게임 간 코드 의존성 증가 | Low | Medium | Effects 객체로 중앙 집중, 각 게임 엔진은 독립 |
| 기존 localStorage 데이터와 비호환 | High | Low | 점수 기록은 기존 구조 유지, 보너스 점수는 별도 표시만 |
| 역도 FAIL 영역이 너무 크면 UX 불만 | Medium | Medium | 초반 streak 5 이하에서는 FAIL 영역 최소화, 점진적 증가 |
| 마라톤 HP 0 게임오버가 frustrating | Medium | Medium | HP 회복 메커니즘(5연속 정답), 장애물은 사전 경고 표시 |
