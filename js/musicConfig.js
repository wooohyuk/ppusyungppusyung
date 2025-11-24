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
      normalChance: 0.7,
      comboChance: 0.15,
      skipChance: 0.15,
      comboCount: [2, 2],
      comboDivision: 2
    }
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
      normalChance: 0.8,  // 일반 벽 확률 증가
      comboChance: 0.1,   // 콤보 확률 감소 (겹침 방지)
      skipChance: 0.1,    // 쉬는 타이밍 감소
      comboCount: [2, 2],
      comboDivision: 2
    }
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
