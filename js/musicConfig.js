/**
 * 음악 설정 파일
 * 여러 곡의 BPM과 벽 패턴을 설정합니다.
 *
 * 사용법:
 * 1. assets/music/ 폴더에 음악 파일(mp3, ogg, wav) 추가
 * 2. MUSIC_LIST 배열에 곡 정보 추가
 */

// 음악 목록 (여러 곡 지원)
const MUSIC_LIST = [
  {
    name: 'BGM 1',
    file: 'assets/music/bgm.mp3',
    bpm: 130,
    offset: 0,
    volume: 0.7,
    travelTime: 2000,
    beatDivision: 2,
    patterns: {
      normalChance: 0.45,      // 일반 벽
      comboChance: 0.15,       // 연타 (2-3개)
      tripleComboChance: 0.10, // 3연타
      rapidComboChance: 0.10,  // 빠른 연타 (5개)
      delayedComboChance: 0.05, // 지연 연타
      skipChance: 0.15,        // 쉬는 타이밍
      comboCount: [2, 3],      // 일반 연타 2-3개
      tripleComboCount: 3,     // 3연타
      rapidComboCount: 5,      // 빠른 연타 5개
      delayedComboCount: 2,    // 지연 연타 2개
      comboDivision: 2,        // 일반 연타 속도
      rapidDivision: 4,        // 빠른 연타 속도 (4배분할 = 16비트)
      delayedOffset: 0.3       // 지연 연타 오프셋 (박자의 30% 지연)
    },
    sections: [ // 구간별 패턴 설정
      { start: 0, end: 20000, name: 'intro', speedMultiplier: 1.0 },
      { start: 20000, end: 60000, name: 'verse', speedMultiplier: 1.1 },
      { start: 60000, end: 90000, name: 'chorus', speedMultiplier: 1.2 },
      { start: 90000, end: 120000, name: 'bridge', speedMultiplier: 1.15 },
      { start: 120000, end: 999999, name: 'outro', speedMultiplier: 1.3 }
    ]
  },
  {
    name: '해 뜨기도 전에 회사로 향하고',
    file: 'assets/music/해 뜨기도 전에 회사로 향하고.mp3',
    lrc: 'assets/music/해 뜨기도 전에 회사로 향하고.lrc',
    bpm: 90,
    offset: 0,
    volume: 0.7,
    travelTime: 2000,
    beatDivision: 1, // 매 비트마다 벽 생성 (더 자주)
    patterns: {
      normalChance: 0.55,      // 일반 벽
      comboChance: 0.15,       // 연타 (2개)
      tripleComboChance: 0.10, // 3연타
      rapidComboChance: 0.05,  // 빠른 연타 (4개)
      delayedComboChance: 0.05, // 지연 연타
      skipChance: 0.10,        // 쉬는 타이밍 감소
      comboCount: [2, 2],      // 일반 연타 2개 고정
      tripleComboCount: 3,     // 3연타
      rapidComboCount: 4,      // 빠른 연타 4개 (BPM 90 느려서 조정)
      delayedComboCount: 2,    // 지연 연타 2개
      comboDivision: 2,        // 일반 연타 속도
      rapidDivision: 3,        // 빠른 연타 속도 (3배분할)
      delayedOffset: 0.25      // 지연 연타 오프셋
    },
    sections: [ // 구간별 패턴 설정
      { start: 0, end: 30000, name: 'intro', speedMultiplier: 1.0 },
      { start: 30000, end: 90000, name: 'verse', speedMultiplier: 1.1 },
      { start: 90000, end: 150000, name: 'chorus', speedMultiplier: 1.25 },
      { start: 150000, end: 999999, name: 'outro', speedMultiplier: 1.2 }
    ]
  },
  {
    name: 'Ttimi의 리듬 레이스',
    file: 'assets/music/Ttimi의 리듬 레이스.mp3',
    bpm: 155,
    offset: 0,
    volume: 0.7,
    travelTime: 2000,
    beatDivision: 2,
    patterns: {
      normalChance: 0.40,      // 일반 벽
      comboChance: 0.20,       // 연타 (2-3개)
      tripleComboChance: 0.15, // 3연타
      rapidComboChance: 0.10,  // 빠른 연타 (6개)
      delayedComboChance: 0.05, // 지연 연타
      skipChance: 0.10,        // 쉬는 타이밍
      comboCount: [2, 3],      // 일반 연타 2-3개
      tripleComboCount: 3,     // 3연타
      rapidComboCount: 6,      // 빠른 연타 6개 (BPM 155 빠름)
      delayedComboCount: 2,    // 지연 연타 2개
      comboDivision: 2,        // 일반 연타 속도
      rapidDivision: 4,        // 빠른 연타 속도 (4배분할)
      delayedOffset: 0.35      // 지연 연타 오프셋
    },
    sections: [ // 구간별 패턴 설정 (빠른 곡이라 더 공격적)
      { start: 0, end: 15000, name: 'intro', speedMultiplier: 1.0 },
      { start: 15000, end: 45000, name: 'verse', speedMultiplier: 1.15 },
      { start: 45000, end: 75000, name: 'chorus', speedMultiplier: 1.35 },
      { start: 75000, end: 105000, name: 'bridge', speedMultiplier: 1.25 },
      { start: 105000, end: 999999, name: 'outro', speedMultiplier: 1.4 }
    ]
  }
];

// 현재 선택된 음악 인덱스
let selectedMusicIndex = 0;

// 현재 선택된 음악 설정 반환 (하위 호환성 유지)
const MUSIC_CONFIG = MUSIC_LIST[selectedMusicIndex];

/**
 * 선택된 음악 설정 가져오기
 * @returns {Object} 현재 선택된 음악 설정
 */
function getSelectedMusicConfig() {
  return MUSIC_LIST[selectedMusicIndex];
}

/**
 * 음악 선택 변경
 * @param {number} index - 음악 인덱스
 */
function selectMusic(index) {
  if (index >= 0 && index < MUSIC_LIST.length) {
    selectedMusicIndex = index;
  }
}

/**
 * 다음 음악 선택
 */
function selectNextMusic() {
  selectedMusicIndex = (selectedMusicIndex + 1) % MUSIC_LIST.length;
}

/**
 * 이전 음악 선택
 */
function selectPrevMusic() {
  selectedMusicIndex = (selectedMusicIndex - 1 + MUSIC_LIST.length) % MUSIC_LIST.length;
}

/**
 * BPM에서 비트 간격(ms) 계산
 * @param {number} bpm - BPM 값
 * @returns {number} 비트 간격 (밀리초)
 */
function getBeatInterval(bpm) {
  return 60000 / bpm;
}

/**
 * 현재 설정의 비트 간격 반환
 * @returns {number} 비트 간격 (밀리초)
 */
function getCurrentBeatInterval() {
  return getBeatInterval(getSelectedMusicConfig().bpm);
}
