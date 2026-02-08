// Hanja data with grade system (8급-1급)
// HANJA_CORE: 51 chars (8급), HANJA_EXTRA: 46 chars (7급/6급/준5급)
// HANJA_EXPANDED: ~2,215 chars from extracted data (5급-1급)
import expandedRaw from './hanja-expanded.json';

export const HANJA_CORE=[
{hanja:"一",hun:"한",eum:"일",fullHunEum:"한 일",category:"숫자",grade:"8급"},
{hanja:"二",hun:"두",eum:"이",fullHunEum:"두 이",category:"숫자",grade:"8급"},
{hanja:"三",hun:"석",eum:"삼",fullHunEum:"석 삼",category:"숫자",grade:"8급"},
{hanja:"四",hun:"넉",eum:"사",fullHunEum:"넉 사",category:"숫자",grade:"8급"},
{hanja:"五",hun:"다섯",eum:"오",fullHunEum:"다섯 오",category:"숫자",grade:"8급"},
{hanja:"六",hun:"여섯",eum:"육",fullHunEum:"여섯 육",category:"숫자",grade:"8급"},
{hanja:"七",hun:"일곱",eum:"칠",fullHunEum:"일곱 칠",category:"숫자",grade:"8급"},
{hanja:"八",hun:"여덟",eum:"팔",fullHunEum:"여덟 팔",category:"숫자",grade:"8급"},
{hanja:"九",hun:"아홉",eum:"구",fullHunEum:"아홉 구",category:"숫자",grade:"8급"},
{hanja:"十",hun:"열",eum:"십",fullHunEum:"열 십",category:"숫자",grade:"8급"},
{hanja:"百",hun:"일백",eum:"백",fullHunEum:"일백 백",category:"숫자",grade:"8급"},
{hanja:"千",hun:"일천",eum:"천",fullHunEum:"일천 천",category:"숫자",grade:"8급"},
{hanja:"萬",hun:"일만",eum:"만",fullHunEum:"일만 만",category:"숫자",grade:"8급"},
{hanja:"日",hun:"날",eum:"일",fullHunEum:"날 일",category:"자연",grade:"8급"},
{hanja:"月",hun:"달",eum:"월",fullHunEum:"달 월",category:"자연",grade:"8급"},
{hanja:"火",hun:"불",eum:"화",fullHunEum:"불 화",category:"자연",grade:"8급"},
{hanja:"水",hun:"물",eum:"수",fullHunEum:"물 수",category:"자연",grade:"8급"},
{hanja:"木",hun:"나무",eum:"목",fullHunEum:"나무 목",category:"자연",grade:"8급"},
{hanja:"金",hun:"쇠",eum:"금",fullHunEum:"쇠 금",category:"자연",grade:"8급"},
{hanja:"土",hun:"흙",eum:"토",fullHunEum:"흙 토",category:"자연",grade:"8급"},
{hanja:"山",hun:"뫼",eum:"산",fullHunEum:"뫼 산",category:"자연",grade:"8급"},
{hanja:"川",hun:"내",eum:"천",fullHunEum:"내 천",category:"자연",grade:"8급"},
{hanja:"大",hun:"큰",eum:"대",fullHunEum:"큰 대",category:"크기/방향",grade:"8급"},
{hanja:"小",hun:"작을",eum:"소",fullHunEum:"작을 소",category:"크기/방향",grade:"8급"},
{hanja:"中",hun:"가운데",eum:"중",fullHunEum:"가운데 중",category:"크기/방향",grade:"8급"},
{hanja:"上",hun:"위",eum:"상",fullHunEum:"위 상",category:"크기/방향",grade:"8급"},
{hanja:"下",hun:"아래",eum:"하",fullHunEum:"아래 하",category:"크기/방향",grade:"8급"},
{hanja:"左",hun:"왼",eum:"좌",fullHunEum:"왼 좌",category:"크기/방향",grade:"8급"},
{hanja:"右",hun:"오른",eum:"우",fullHunEum:"오른 우",category:"크기/방향",grade:"8급"},
{hanja:"人",hun:"사람",eum:"인",fullHunEum:"사람 인",category:"사람",grade:"8급"},
{hanja:"女",hun:"계집",eum:"여",fullHunEum:"계집 여",category:"사람",grade:"8급"},
{hanja:"子",hun:"아들",eum:"자",fullHunEum:"아들 자",category:"사람",grade:"8급"},
{hanja:"王",hun:"임금",eum:"왕",fullHunEum:"임금 왕",category:"사람",grade:"8급"},
{hanja:"兄",hun:"형",eum:"형",fullHunEum:"형 형",category:"사람",grade:"8급"},
{hanja:"弟",hun:"아우",eum:"제",fullHunEum:"아우 제",category:"사람",grade:"8급"},
{hanja:"玉",hun:"구슬",eum:"옥",fullHunEum:"구슬 옥",category:"개념",grade:"8급"},
{hanja:"白",hun:"흰",eum:"백",fullHunEum:"흰 백",category:"개념",grade:"8급"},
{hanja:"天",hun:"하늘",eum:"천",fullHunEum:"하늘 천",category:"개념",grade:"8급"},
{hanja:"地",hun:"땅",eum:"지",fullHunEum:"땅 지",category:"개념",grade:"8급"},
{hanja:"正",hun:"바를",eum:"정",fullHunEum:"바를 정",category:"개념",grade:"8급"},
{hanja:"出",hun:"날",eum:"출",fullHunEum:"날 출",category:"개념",grade:"8급"},
{hanja:"生",hun:"날",eum:"생",fullHunEum:"날 생",category:"개념",grade:"8급"},
{hanja:"年",hun:"해",eum:"년",fullHunEum:"해 년",category:"개념",grade:"8급"},
{hanja:"名",hun:"이름",eum:"명",fullHunEum:"이름 명",category:"개념",grade:"8급"},
{hanja:"門",hun:"문",eum:"문",fullHunEum:"문 문",category:"개념",grade:"8급"},
{hanja:"文",hun:"글월",eum:"문",fullHunEum:"글월 문",category:"개념",grade:"8급"},
{hanja:"字",hun:"글자",eum:"자",fullHunEum:"글자 자",category:"개념",grade:"8급"},
{hanja:"休",hun:"쉴",eum:"휴",fullHunEum:"쉴 휴",category:"개념",grade:"8급"},
{hanja:"足",hun:"발",eum:"족",fullHunEum:"발 족",category:"개념",grade:"8급"},
{hanja:"向",hun:"향할",eum:"향",fullHunEum:"향할 향",category:"개념",grade:"8급"},
];

export const HANJA_EXTRA=[
// 7급 (15 chars: 가족, 방위, 자연, 동물)
{hanja:"父",hun:"아비",eum:"부",fullHunEum:"아비 부",category:"가족",grade:"7급"},
{hanja:"母",hun:"어미",eum:"모",fullHunEum:"어미 모",category:"가족",grade:"7급"},
{hanja:"男",hun:"사내",eum:"남",fullHunEum:"사내 남",category:"가족",grade:"7급"},
{hanja:"東",hun:"동녘",eum:"동",fullHunEum:"동녘 동",category:"방위",grade:"7급"},
{hanja:"西",hun:"서녘",eum:"서",fullHunEum:"서녘 서",category:"방위",grade:"7급"},
{hanja:"南",hun:"남녘",eum:"남",fullHunEum:"남녘 남",category:"방위",grade:"7급"},
{hanja:"北",hun:"북녘",eum:"북",fullHunEum:"북녘 북",category:"방위",grade:"7급"},
{hanja:"江",hun:"강",eum:"강",fullHunEum:"강 강",category:"자연",grade:"7급"},
{hanja:"林",hun:"수풀",eum:"림",fullHunEum:"수풀 림",category:"자연",grade:"7급"},
{hanja:"石",hun:"돌",eum:"석",fullHunEum:"돌 석",category:"자연",grade:"7급"},
{hanja:"草",hun:"풀",eum:"초",fullHunEum:"풀 초",category:"자연",grade:"7급"},
{hanja:"馬",hun:"말",eum:"마",fullHunEum:"말 마",category:"동물",grade:"7급"},
{hanja:"牛",hun:"소",eum:"우",fullHunEum:"소 우",category:"동물",grade:"7급"},
{hanja:"魚",hun:"물고기",eum:"어",fullHunEum:"물고기 어",category:"동물",grade:"7급"},
{hanja:"羊",hun:"양",eum:"양",fullHunEum:"양 양",category:"동물",grade:"7급"},
// 6급 (16 chars: 신체, 생활, 기타 일부)
{hanja:"口",hun:"입",eum:"구",fullHunEum:"입 구",category:"신체",grade:"6급"},
{hanja:"目",hun:"눈",eum:"목",fullHunEum:"눈 목",category:"신체",grade:"6급"},
{hanja:"耳",hun:"귀",eum:"이",fullHunEum:"귀 이",category:"신체",grade:"6급"},
{hanja:"手",hun:"손",eum:"수",fullHunEum:"손 수",category:"신체",grade:"6급"},
{hanja:"心",hun:"마음",eum:"심",fullHunEum:"마음 심",category:"신체",grade:"6급"},
{hanja:"國",hun:"나라",eum:"국",fullHunEum:"나라 국",category:"생활",grade:"6급"},
{hanja:"市",hun:"저자",eum:"시",fullHunEum:"저자 시",category:"생활",grade:"6급"},
{hanja:"車",hun:"수레",eum:"차",fullHunEum:"수레 차",category:"생활",grade:"6급"},
{hanja:"食",hun:"밥",eum:"식",fullHunEum:"밥 식",category:"생활",grade:"6급"},
{hanja:"衣",hun:"옷",eum:"의",fullHunEum:"옷 의",category:"생활",grade:"6급"},
{hanja:"光",hun:"빛",eum:"광",fullHunEum:"빛 광",category:"생활",grade:"6급"},
{hanja:"古",hun:"예",eum:"고",fullHunEum:"예 고",category:"기타",grade:"6급"},
{hanja:"今",hun:"이제",eum:"금",fullHunEum:"이제 금",category:"기타",grade:"6급"},
{hanja:"太",hun:"클",eum:"태",fullHunEum:"클 태",category:"기타",grade:"6급"},
{hanja:"少",hun:"적을",eum:"소",fullHunEum:"적을 소",category:"기타",grade:"6급"},
{hanja:"力",hun:"힘",eum:"력",fullHunEum:"힘 력",category:"기타",grade:"6급"},
// 준5급 (15 chars: 기타 나머지, 계절)
{hanja:"本",hun:"근본",eum:"본",fullHunEum:"근본 본",category:"기타",grade:"준5급"},
{hanja:"方",hun:"모",eum:"방",fullHunEum:"모 방",category:"기타",grade:"준5급"},
{hanja:"外",hun:"바깥",eum:"외",fullHunEum:"바깥 외",category:"기타",grade:"준5급"},
{hanja:"世",hun:"인간",eum:"세",fullHunEum:"인간 세",category:"기타",grade:"준5급"},
{hanja:"合",hun:"합할",eum:"합",fullHunEum:"합할 합",category:"기타",grade:"준5급"},
{hanja:"先",hun:"먼저",eum:"선",fullHunEum:"먼저 선",category:"기타",grade:"준5급"},
{hanja:"立",hun:"설",eum:"립",fullHunEum:"설 립",category:"기타",grade:"준5급"},
{hanja:"長",hun:"긴",eum:"장",fullHunEum:"긴 장",category:"기타",grade:"준5급"},
{hanja:"靑",hun:"푸를",eum:"청",fullHunEum:"푸를 청",category:"기타",grade:"준5급"},
{hanja:"不",hun:"아닐",eum:"불",fullHunEum:"아닐 불",category:"기타",grade:"준5급"},
{hanja:"入",hun:"들",eum:"입",fullHunEum:"들 입",category:"기타",grade:"준5급"},
{hanja:"春",hun:"봄",eum:"춘",fullHunEum:"봄 춘",category:"계절",grade:"준5급"},
{hanja:"夏",hun:"여름",eum:"하",fullHunEum:"여름 하",category:"계절",grade:"준5급"},
{hanja:"秋",hun:"가을",eum:"추",fullHunEum:"가을 추",category:"계절",grade:"준5급"},
{hanja:"冬",hun:"겨울",eum:"동",fullHunEum:"겨울 동",category:"계절",grade:"준5급"},
];

// Build set of existing hanja characters to deduplicate
const _existingSet = new Set([...HANJA_CORE, ...HANJA_EXTRA].map(h => h.hanja));

// HANJA_EXPANDED: extracted data (5급-1급), deduplicated, with category added
export const HANJA_EXPANDED = expandedRaw
  .filter(h => !_existingSet.has(h.hanja))
  .map(h => ({
    hanja: h.hanja,
    hun: h.hun,
    eum: h.eum,
    fullHunEum: h.fullHunEum,
    category: '일반',
    grade: h.grade,
  }));

export const ALL_HANJA=[...HANJA_CORE,...HANJA_EXTRA,...HANJA_EXPANDED];

export const HANJA_BY_CATEGORY={};
ALL_HANJA.forEach(h=>{
  if(!HANJA_BY_CATEGORY[h.category]) HANJA_BY_CATEGORY[h.category]=[];
  HANJA_BY_CATEGORY[h.category].push(h);
});

// Grade hierarchy: 8급(easiest) -> 1급(hardest)
export const GRADE_HIERARCHY = ['8급','7급','6급','준5급','5급','준4급','4급','준3급','3급','준2급','2급','준1급','1급'];

export function getHanjaForGrade(userGrade) {
  const userIndex = GRADE_HIERARCHY.indexOf(userGrade);
  if (userIndex === -1) return ALL_HANJA; // fallback
  // Return user's grade + all lower (easier) grades
  const allowedGrades = GRADE_HIERARCHY.slice(0, userIndex + 1);
  return ALL_HANJA.filter(h => allowedGrades.includes(h.grade));
}

export function getGradeLabel(grade) {
  return grade || '8급';
}

export function getGradeCount() {
  const counts = {};
  GRADE_HIERARCHY.forEach(g => { counts[g] = 0; });
  ALL_HANJA.forEach(h => { counts[h.grade] = (counts[h.grade] || 0) + 1; });
  return counts;
}

export const GAME_LIST=[
  {id:'archery',name:'양궁',icon:'🏹',desc:'한자 뜻 맞추기',multi:false},
  {id:'swimming',name:'수영',icon:'🏊',desc:'60초 스피드 퀴즈',multi:true},
  {id:'weightlifting',name:'역도',icon:'🏋️',desc:'연속 정답 도전',multi:false},
  {id:'gymnastics',name:'카드 뒤집기',icon:'🃏',desc:'카드 매칭 게임',multi:false},
  {id:'marathon',name:'마라톤',icon:'🏃',desc:'장애물 달리기',multi:false},
  {id:'antonym',name:'반의어',icon:'🔄',desc:'반대말 매칭',multi:true},
  {id:'idiom',name:'사자성어',icon:'📜',desc:'사자성어 퀴즈',multi:true},
  {id:'homonym',name:'동음이의',icon:'🔤',desc:'같은 소리 다른 뜻',multi:true},
];

export const FLAG_ICONS=['🇰🇷','🏅','⭐','🔥','💎','🌸','🐯','🦅','🐉','🎯','🏆','💪'];
