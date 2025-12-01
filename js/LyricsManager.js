/**
 * LyricsManager 클래스
 * LRC 파일을 파싱하고 현재 시간에 맞는 가사를 표시합니다.
 */
class LyricsManager {
  constructor() {
    this.lyrics = []; // {time: ms, text: string}
    this.isLoaded = false;
    this.currentIndex = -1;
  }

  /**
   * LRC 파일 로드 및 파싱
   * @param {string} path - LRC 파일 경로
   * @param {Function} callback - 로드 완료 콜백
   */
  loadLRC(path, callback) {
    this.lyrics = [];
    this.isLoaded = false;
    this.currentIndex = -1;

    fetch(path)
      .then(response => {
        if (!response.ok) {
          throw new Error('LRC 파일을 찾을 수 없습니다.');
        }
        return response.text();
      })
      .then(text => {
        this.parseLRC(text);
        this.isLoaded = true;
        console.log(`✓ 가사 로드 완료: ${this.lyrics.length}줄`);
        if (callback) callback(true);
      })
      .catch(err => {
        console.warn('⚠ 가사 로드 실패:', err.message);
        this.isLoaded = false;
        if (callback) callback(false);
      });
  }

  /**
   * LRC 텍스트 파싱
   * @param {string} lrcText - LRC 파일 내용
   */
  parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3].padEnd(3, '0'));
        const timeMs = minutes * 60000 + seconds * 1000 + milliseconds;

        // 타임스탬프 이후의 텍스트 추출
        const text = line.replace(timeRegex, '').trim();

        if (text) { // 빈 줄 제외
          this.lyrics.push({
            time: timeMs,
            text: text
          });
        }
      }
    }

    // 시간순 정렬
    this.lyrics.sort((a, b) => a.time - b.time);
  }

  /**
   * 현재 시간에 해당하는 가사 인덱스 찾기
   * @param {number} currentTimeMs - 현재 재생 시간 (ms)
   * @returns {number} 현재 가사 인덱스 (-1이면 아직 시작 전)
   */
  getCurrentIndex(currentTimeMs) {
    let index = -1;

    for (let i = 0; i < this.lyrics.length; i++) {
      if (this.lyrics[i].time <= currentTimeMs) {
        index = i;
      } else {
        break;
      }
    }

    this.currentIndex = index;
    return index;
  }

  /**
   * 현재 가사와 다음 가사 반환
   * @param {number} currentTimeMs - 현재 재생 시간 (ms)
   * @returns {Object} {current: string, next: string}
   */
  getCurrentLyrics(currentTimeMs) {
    if (!this.isLoaded || this.lyrics.length === 0) {
      return { current: '', next: '' };
    }

    const index = this.getCurrentIndex(currentTimeMs);

    return {
      current: index >= 0 ? this.lyrics[index].text : '',
      next: index + 1 < this.lyrics.length ? this.lyrics[index + 1].text : ''
    };
  }

  /**
   * 가사 UI 표시
   * @param {number} currentTimeMs - 현재 재생 시간 (ms)
   * @param {number} baseWidth - 기준 너비
   * @param {number} baseHeight - 기준 높이
   */
  display(currentTimeMs, baseWidth, baseHeight) {
    if (!this.isLoaded || this.lyrics.length === 0) return;

    const { current, next } = this.getCurrentLyrics(currentTimeMs);

    if (!current && !next) return;

    push();

    // 가사 표시 영역 (화면 상단 중앙, 진행바 아래)
    const boxY = 180;
    const boxHeight = 80;

    // 반투명 배경
    fill(0, 0, 0, 160);
    noStroke();
    rectMode(CENTER);
    rect(baseWidth / 2, boxY, 700, boxHeight, 12);

    textAlign(CENTER, CENTER);

    // 현재 가사 (크고 밝게)
    if (current) {
      fill(255, 255, 255);
      textSize(22);
      text(current, baseWidth / 2, boxY - 12);
    }

    // 다음 가사 (작고 흐리게)
    if (next) {
      fill(120, 120, 120);
      textSize(16);
      text(next, baseWidth / 2, boxY + 18);
    }

    pop();
  }

  /**
   * 리셋
   */
  reset() {
    this.currentIndex = -1;
  }
}
