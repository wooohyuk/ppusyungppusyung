/**
 * RankingManager 클래스
 * 곡별 랭킹을 LocalStorage에 저장하고 관리합니다.
 */
class RankingManager {
  constructor() {
    this.storageKey = 'ppusyong_rankings';
    this.maxRankingsPerSong = 10; // 곡당 최대 랭킹 수
  }

  /**
   * 모든 랭킹 데이터 불러오기
   * @returns {Object} 곡별 랭킹 데이터
   */
  loadAllRankings() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('랭킹 데이터 로드 실패:', e);
      return {};
    }
  }

  /**
   * 특정 곡의 랭킹 불러오기
   * @param {string} songName - 곡 이름
   * @returns {Array} 랭킹 배열 (점수 내림차순)
   */
  getRankings(songName) {
    const allRankings = this.loadAllRankings();
    return allRankings[songName] || [];
  }

  /**
   * 랭킹 저장
   * @param {string} songName - 곡 이름
   * @param {string} playerName - 플레이어 닉네임
   * @param {number} score - 점수
   * @param {number} wallsDestroyed - 파괴한 벽 수
   * @returns {number} 등수 (1부터 시작, -1이면 랭킹에 못 들어감)
   */
  saveRanking(songName, playerName, score, wallsDestroyed) {
    const allRankings = this.loadAllRankings();

    if (!allRankings[songName]) {
      allRankings[songName] = [];
    }

    const newEntry = {
      name: playerName,
      score: score,
      walls: wallsDestroyed,
      date: new Date().toLocaleDateString('ko-KR')
    };

    // 랭킹에 추가
    allRankings[songName].push(newEntry);

    // 점수 내림차순 정렬
    allRankings[songName].sort((a, b) => b.score - a.score);

    // 최대 개수 제한
    if (allRankings[songName].length > this.maxRankingsPerSong) {
      allRankings[songName] = allRankings[songName].slice(0, this.maxRankingsPerSong);
    }

    // 저장
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(allRankings));
    } catch (e) {
      console.error('랭킹 저장 실패:', e);
      return -1;
    }

    // 등수 반환
    const rank = allRankings[songName].findIndex(
      entry => entry.name === playerName &&
               entry.score === score &&
               entry.date === newEntry.date
    );

    return rank !== -1 ? rank + 1 : -1;
  }

  /**
   * 점수가 랭킹에 들어갈 수 있는지 확인
   * @param {string} songName - 곡 이름
   * @param {number} score - 점수
   * @returns {boolean} 랭킹 가능 여부
   */
  canEnterRanking(songName, score) {
    const rankings = this.getRankings(songName);

    // 랭킹이 꽉 차지 않았으면 무조건 가능
    if (rankings.length < this.maxRankingsPerSong) {
      return true;
    }

    // 최하위 점수보다 높으면 가능
    const lowestScore = rankings[rankings.length - 1].score;
    return score > lowestScore;
  }

  /**
   * 특정 곡의 랭킹 초기화
   * @param {string} songName - 곡 이름
   */
  clearRankings(songName) {
    const allRankings = this.loadAllRankings();
    delete allRankings[songName];
    localStorage.setItem(this.storageKey, JSON.stringify(allRankings));
  }

  /**
   * 모든 랭킹 초기화
   */
  clearAllRankings() {
    localStorage.removeItem(this.storageKey);
  }
}
