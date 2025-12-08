/**
 * MusicManager 클래스
 * 음악 재생 및 BPM 기반 비트 타이밍을 관리합니다.
 */
class MusicManager {
  /**
   * @param {Object} config - MUSIC_CONFIG 객체
   */
  constructor(config) {
    this.config = config;
    this.sound = null;
    this.isPlaying = false;
    this.isLoaded = false;

    // 비트 타이밍
    this.bpm = config.bpm;
    this.beatInterval = 60000 / this.bpm; // ms per beat
    this.offset = config.offset || 0;
    this.travelTime = config.travelTime || 2000;

    // 비트 추적
    this.currentBeat = 0;
    this.lastBeatTime = 0;
    this.musicStartTime = 0;

    // 일시정지 관련
    this.pausedAt = 0; // 일시정지된 시점의 재생 시간
    this.totalPausedTime = 0; // 총 일시정지된 시간

    // 콜백
    this.onBeatCallback = null;

    // 예약된 벽 생성 타이밍
    this.scheduledBeats = [];
  }

  /**
   * 음악 로드 (p5.js sound 사용)
   * @param {Function} callback - 로드 완료 콜백
   */
  loadMusic(callback) {
    this.sound = loadSound(
      this.config.file,
      () => {
        this.isLoaded = true;
        this.sound.setVolume(this.config.volume || 0.7);
        console.log('✓ 음악 로드 완료');
        if (callback) callback();
      },
      (err) => {
        console.error('⚠ 음악 로드 실패:', err);
      }
    );
  }

  /**
   * 음악 재생 시작
   */
  play() {
    if (!this.isLoaded || !this.sound) {
      console.warn('음악이 로드되지 않았습니다.');
      return;
    }

    if (this.isPlaying) return;

    this.sound.play();
    this.isPlaying = true;
    this.musicStartTime = millis();
    this.currentBeat = 0;
    this.lastBeatTime = this.musicStartTime + this.offset;

    // 미리 벽 생성 스케줄링
    this.scheduleWalls();

    console.log(`▶ 음악 재생 시작 (BPM: ${this.bpm}, 비트 간격: ${this.beatInterval}ms)`);
  }

  /**
   * 음악 정지
   */
  stop() {
    if (this.sound && this.isPlaying) {
      this.sound.stop();
      this.isPlaying = false;
      this.currentBeat = 0;
      this.scheduledBeats = [];
      console.log('⏹ 음악 정지');
    }
  }

  /**
   * 음악 일시정지
   */
  pause() {
    if (this.sound && this.isPlaying) {
      this.pausedAt = millis(); // 일시정지 시점 기록
      this.sound.pause();
      this.isPlaying = false;
      console.log('⏸ 음악 일시정지');
    }
  }

  /**
   * 음악 재개
   */
  resume() {
    if (this.sound && !this.isPlaying && this.pausedAt > 0) {
      // 일시정지된 시간만큼 시작 시간을 보정
      const pauseDuration = millis() - this.pausedAt;
      this.totalPausedTime += pauseDuration;

      this.sound.play();
      this.isPlaying = true;
      this.pausedAt = 0;
      console.log('▶ 음악 재개');
    }
  }

  /**
   * 벽 생성 스케줄링
   * travelTime만큼 미리 벽을 생성해야 비트에 맞춰 도착
   */
  scheduleWalls() {
    this.scheduledBeats = [];

    // 음악 전체 길이에 대해 벽 패턴 생성
    const duration = this.sound.duration() * 1000; // ms
    const totalBeats = Math.floor(duration / this.beatInterval);

    // beatDivision: 몇 비트마다 벽 생성 (기본값: 1 = 매 비트)
    const beatDivision = this.config.beatDivision || 1;

    for (let i = 0; i < totalBeats; i++) {
      // beatDivision에 맞는 비트에서만 벽 생성
      if (i % beatDivision !== 0) continue;

      const beatTime = this.offset + (i * this.beatInterval);
      const spawnTime = beatTime - this.travelTime; // 미리 생성

      // spawnTime이 음수면 건너뛰기 (게임 시작 전에 생성해야 할 벽은 제외)
      // 이렇게 하면 초반에 벽이 한꺼번에 나오는 버그를 방지
      if (spawnTime < 0) continue;

      // 패턴에 따라 벽 생성 결정 (현재 시간 전달)
      const pattern = this.generatePattern(beatTime);

      if (pattern.type !== 'skip') {
        this.scheduledBeats.push({
          beatNumber: i,
          spawnTime: spawnTime,
          arrivalTime: beatTime,
          pattern: pattern,
          spawned: false
        });
      }
    }

    console.log(`📋 총 ${this.scheduledBeats.length}개 벽 스케줄링 완료 (${beatDivision}비트 간격)`);
  }

  /**
   * 벽 패턴 생성 (확률 기반)
   * @param {number} currentTime - 현재 음악 시간 (ms)
   * @returns {Object} 패턴 정보
   */
  generatePattern(currentTime = 0) {
    const patterns = this.config.patterns;

    // 구간별 패턴 확률 조정
    let section = null;
    if (this.config.sections) {
      section = this.config.sections.find(s => currentTime >= s.start && currentTime < s.end);
    }

    const rand = random();
    let cumulative = 0;

    // skip 체크
    cumulative += patterns.skipChance;
    if (rand < cumulative) {
      return { type: 'skip' };
    }

    // normal 체크
    cumulative += patterns.normalChance;
    if (rand < cumulative) {
      return {
        type: 'normal',
        count: 1,
        section: section ? section.name : null
      };
    }

    // combo 체크 (일반 연타)
    cumulative += patterns.comboChance;
    if (rand < cumulative) {
      const [min, max] = patterns.comboCount;
      const count = Math.floor(random(min, max + 1));
      return {
        type: 'combo',
        count: count,
        division: patterns.comboDivision,
        section: section ? section.name : null
      };
    }

    // tripleCombo 체크 (3연타)
    cumulative += patterns.tripleComboChance || 0;
    if (rand < cumulative) {
      return {
        type: 'tripleCombo',
        count: patterns.tripleComboCount || 3,
        division: patterns.comboDivision,
        section: section ? section.name : null
      };
    }

    // rapidCombo 체크 (빠른 연타)
    cumulative += patterns.rapidComboChance || 0;
    if (rand < cumulative) {
      return {
        type: 'rapidCombo',
        count: patterns.rapidComboCount || 5,
        division: patterns.rapidDivision || 4,
        section: section ? section.name : null
      };
    }

    // delayedCombo 체크 (지연 연타)
    cumulative += patterns.delayedComboChance || 0;
    if (rand < cumulative) {
      return {
        type: 'delayedCombo',
        count: patterns.delayedComboCount || 2,
        division: patterns.comboDivision,
        delayOffset: patterns.delayedOffset || 0.3,
        section: section ? section.name : null
      };
    }

    // 기본값 (normal)
    return {
      type: 'normal',
      count: 1,
      section: section ? section.name : null
    };
  }

  /**
   * 비트 콜백 설정
   * @param {Function} callback - 비트마다 호출될 함수 (beatInfo)
   */
  onBeat(callback) {
    this.onBeatCallback = callback;
  }

  /**
   * 매 프레임 업데이트
   * 스케줄된 벽 생성 타이밍 체크
   */
  update() {
    if (!this.isPlaying) return;

    const currentTime = this.getCurrentTime();

    // 스케줄된 벽 중 생성 시간이 된 것들 처리
    for (let beat of this.scheduledBeats) {
      if (!beat.spawned && currentTime >= beat.spawnTime) {
        beat.spawned = true;

        if (this.onBeatCallback) {
          this.onBeatCallback(beat);
        }
      }
    }

    // 음악 끝났는지 체크
    if (!this.sound.isPlaying() && currentTime > 1000) {
      this.isPlaying = false;
      console.log('🎵 음악 종료');
    }
  }

  /**
   * BPM 변경
   * @param {number} newBpm - 새로운 BPM
   */
  setBpm(newBpm) {
    this.bpm = newBpm;
    this.beatInterval = 60000 / newBpm;
    console.log(`BPM 변경: ${newBpm} (간격: ${this.beatInterval}ms)`);
  }

  /**
   * 현재 재생 시간 반환 (ms)
   * @returns {number}
   */
  getCurrentTime() {
    if (this.musicStartTime === 0) return 0;

    // 일시정지 중이면 일시정지 시점의 시간 반환
    if (this.pausedAt > 0) {
      return this.pausedAt - this.musicStartTime - this.totalPausedTime;
    }

    // 재생 중이면 현재 시간에서 총 일시정지 시간을 뺌
    return millis() - this.musicStartTime - this.totalPausedTime;
  }

  /**
   * 음악이 재생 중인지 확인
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}
