/**
 * WallManager 클래스
 * 벽(장애물) 생성, 관리, 충돌 판정을 담당합니다.
 */
class WallManager {
  /**
   * @param {number} gameWidth - 게임 화면 너비
   * @param {number} gameHeight - 게임 화면 높이
   */
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    // 벽 배열
    this.walls = [];

    // 스폰 설정
    this.spawnInterval = 2000; // 벽 생성 간격 (ms)
    this.lastSpawnTime = 0;
    this.wallSpeed = 8; // 벽 이동 속도

    // 벽 Y 위치 (지면에 맞춤)
    // 벽 생성 위치 (gameHeight - 200 - 75) -> (gameHeight - 200 - 200) 으로 변경
    this.wallY = gameHeight - 200 - 200; // 캐릭터 발 위치에서 벽 높이/2 뺀 위치

    // Hit Zone 설정 (캐릭터 앞쪽 공격 판정 영역)
    this.hitZoneOffset = 150; // 캐릭터 중심에서 Hit Zone까지의 거리
    this.hitZoneWidth = 200;  // Hit Zone 너비

    // 충돌 영역 설정 (캐릭터 몸통)
    this.characterWidth = 100; // 캐릭터 충돌 판정 너비

    // 게임 상태
    this.isActive = true;
    this.destroyedCount = 0; // 파괴한 벽 수

    // 벽 스프라이트
    this.wallSprites = []; // 벽 스프라이트 배열
    this.currentSpriteIndex = 0; // 현재 스프라이트 인덱스 (순서대로 나오게)

    // 리듬 모드 설정
    this.rhythmMode = false; // true면 비트 기반, false면 자동 스폰
    this.beatInterval = 500; // 비트 간격 (ms)

    // 속도 증가 시스템
    this.baseWallSpeed = 8; // 기본 벽 속도
    this.currentSpeedMultiplier = 1.0; // 현재 속도 배율
    this.maxSpeedMultiplier = 2.0; // 최대 속도 배율
    this.speedIncreaseEnabled = true; // 속도 증가 활성화 여부

    // 디버그 모드
    this.debugMode = false;

    // 판정 시스템
    this.lastJudgment = null; // { type: 'wow'|'great'|'good'|'miss', time: ms, x: number, y: number }
    this.judgmentDuration = 800; // 판정 표시 시간 (ms)

    // 판정 이미지
    this.judgmentImages = {
      wow: null,
      great: null,
      good: null,
      miss: null
    };

    // 히트 이펙트 시스템
    this.hitEffectFrames = []; // 히트 이펙트 프레임 배열
    this.activeHitEffects = []; // 현재 재생 중인 히트 이펙트들
    this.hitEffectFrameRate = 60; // 각 프레임 지속 시간 (ms)
  }

  /**
   * Hit Zone 위치 계산
   * @param {number} characterX - 캐릭터 X 위치
   * @returns {number} Hit Zone 중심 X 위치
   */
  getHitZoneX(characterX) {
    return characterX + this.hitZoneOffset;
  }

  /**
   * 새 벽 생성
   * @returns {boolean} 벽이 생성되었으면 true
   */
  spawnWall() {
    const spawnX = this.gameWidth + 50; // 화면 오른쪽 밖에서 시작

    // 겹침 방지: 가장 최근 벽과의 거리 체크
    // 빠른 연타를 위해 최소 간격을 속도에 반비례하게 조정
    const baseMinDistance = 100; // 기본 최소 간격
    const minDistance = Math.max(80, baseMinDistance / this.currentSpeedMultiplier);
    const recentWalls = this.walls.filter(w => w.currentState === w.states.NORMAL);
    if (recentWalls.length > 0) {
      const lastWall = recentWalls[recentWalls.length - 1];
      if (Math.abs(lastWall.x - spawnX) < minDistance) {
        console.log('⚠️ 벽 겹침 방지: 생성 건너뜀');
        return false;
      }
    }

    // 현재 속도 배율 적용
    const currentSpeed = this.baseWallSpeed * this.currentSpeedMultiplier;

    const wall = new Wall(
      spawnX,
      this.wallY,
      currentSpeed
    );

    // 스프라이트가 있으면 순서대로 적용
    if (this.wallSprites.length > 0) {
      const sprite = this.wallSprites[this.currentSpriteIndex];
      if (sprite) {
        wall.setSprite(sprite);
      }
      // 다음 스프라이트 인덱스로 이동 (순환)
      this.currentSpriteIndex = (this.currentSpriteIndex + 1) % this.wallSprites.length;
    }

    this.walls.push(wall);
    console.log(`🧱 새 벽 생성! (스프라이트 ${this.currentSpriteIndex === 0 ? this.wallSprites.length : this.currentSpriteIndex}/${this.wallSprites.length})`);
    return true;
  }

  /**
   * 자동 벽 스폰 (일정 간격) - 리듬 모드가 아닐 때만 사용
   */
  autoSpawn() {
    if (!this.isActive || this.rhythmMode) return;

    const currentTime = millis();
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnWall();
      this.lastSpawnTime = currentTime;
    }
  }

  /**
   * 비트 기반 벽 생성 (MusicManager에서 호출)
   * @param {Object} beatInfo - 비트 정보 { beatNumber, pattern, ... }
   */
  spawnOnBeat(beatInfo) {
    if (!this.isActive) return;

    const pattern = beatInfo.pattern;

    if (pattern.type === 'normal') {
      // 일반 벽 1개
      this.spawnWall();
    } else if (pattern.type === 'combo') {
      // 일반 연타: 빠른 간격으로 여러 벽
      const count = pattern.count;
      const division = pattern.division || 2;
      const comboInterval = this.beatInterval / division;

      for (let i = 0; i < count; i++) {
        // 시간차를 두고 벽 생성
        setTimeout(() => {
          this.spawnWall();
        }, i * comboInterval);
      }
    } else if (pattern.type === 'tripleCombo') {
      // 3연타: 일반 연타와 동일하지만 개수 고정
      const count = pattern.count || 3;
      const division = pattern.division || 2;
      const comboInterval = this.beatInterval / division;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          this.spawnWall();
        }, i * comboInterval);
      }
    } else if (pattern.type === 'rapidCombo') {
      // 빠른 연타: 더 짧은 간격으로 많은 벽 (16비트 등)
      const count = pattern.count || 5;
      const division = pattern.division || 4;
      const comboInterval = this.beatInterval / division;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          this.spawnWall();
        }, i * comboInterval);
      }
    } else if (pattern.type === 'delayedCombo') {
      // 지연 연타: 첫 타이밍을 약간 늦춰서 생성
      const count = pattern.count || 2;
      const division = pattern.division || 2;
      const comboInterval = this.beatInterval / division;
      const delayOffset = pattern.delayOffset || 0.3;
      const initialDelay = this.beatInterval * delayOffset;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          this.spawnWall();
        }, initialDelay + (i * comboInterval));
      }
    }
  }

  /**
   * 리듬 모드 설정
   * @param {boolean} enabled - 리듬 모드 활성화 여부
   * @param {number} beatInterval - 비트 간격 (ms)
   */
  setRhythmMode(enabled, beatInterval = 500) {
    this.rhythmMode = enabled;
    this.beatInterval = beatInterval;
    console.log(`리듬 모드: ${enabled ? 'ON' : 'OFF'} (비트 간격: ${beatInterval}ms)`);
  }

  /**
   * 공격 판정 - Hit Zone 내의 벽 파괴 시도
   * @param {number} characterX - 캐릭터 X 위치
   * @returns {Object|null} 판정 결과 { type: string, destroyed: boolean } 또는 null
   */
  tryDestroyWall(characterX) {
    const hitZoneX = this.getHitZoneX(characterX);

    for (let wall of this.walls) {
      // 이미 판정받은 벽은 건너뜀
      if (wall.hasBeenJudged) {
        continue;
      }

      if (wall.isInHitZone(hitZoneX, this.hitZoneWidth)) {
        // 벽과 Hit Zone 중심 사이의 거리로 판정
        const distance = Math.abs(wall.x - hitZoneX);
        const judgment = this.calculateJudgment(distance);

        // 이 벽은 판정을 받았음을 표시
        wall.hasBeenJudged = true;

        // MISS 판정이 아닐 때만 벽 파괴
        const destroyed = judgment !== 'miss';

        // 원래 위치 저장 (벽 이동 전)
        const originalX = wall.x;

        if (destroyed) {
          wall.destroy();
          this.destroyedCount++;

          // 벽을 즉시 화면 밖으로 이동 (충돌 방지)
          wall.x = -1000;

          // 이펙트는 원래 위치에 생성
          this.createHitEffect(originalX, this.wallY);
        }

        // 판정 저장 (원래 위치 사용)
        this.lastJudgment = {
          type: judgment,
          time: millis(),
          x: originalX,
          y: this.wallY - 100
        };

        return { type: judgment, destroyed: destroyed };
      }
    }
    return null;
  }

  /**
   * 거리에 따른 판정 계산
   * @param {number} distance - Hit Zone 중심과 벽 사이의 거리
   * @returns {string} 판정 타입
   */
  calculateJudgment(distance) {
    const wowZone = this.hitZoneWidth * 0.125;   // 중심 12.5% (25% width) - WOW
    const greatZone = this.hitZoneWidth * 0.25;  // 중심 25% (50% width) - GREAT
    const goodZone = this.hitZoneWidth * 0.40;   // 중심 40% (80% width) - GOOD
    // MISS는 goodZone 밖 ~ hitZoneWidth 안쪽

    if (distance <= wowZone) {
      return 'wow';
    } else if (distance <= greatZone) {
      return 'great';
    } else if (distance <= goodZone) {
      return 'good';
    } else {
      return 'miss';
    }
  }

  /**
   * 충돌 판정 - 캐릭터와 벽 충돌 확인
   * @param {number} characterX - 캐릭터 X 위치
   * @returns {boolean} 충돌했으면 true
   */
  checkCollision(characterX) {
    for (let wall of this.walls) {
      if (wall.isCollidingWith(characterX, this.characterWidth)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 충돌한 벽 제거 (데미지 후 벽 제거)
   * @param {number} characterX - 캐릭터 X 위치
   */
  removeCollidingWall(characterX) {
    this.walls = this.walls.filter(wall => {
      if (wall.isCollidingWith(characterX, this.characterWidth)) {
        wall.destroy();
        return true; // 파괴 애니메이션을 위해 유지
      }
      return true;
    });
  }

  /**
   * 모든 벽 업데이트
   */
  update() {
    // 자동 스폰
    this.autoSpawn();

    // 각 벽 업데이트
    for (let wall of this.walls) {
      wall.update();
    }

    // 제거해야 할 벽 삭제
    this.walls = this.walls.filter(wall => !wall.shouldRemove());
  }

  /**
   * 모든 벽 렌더링
   */
  display() {
    for (let wall of this.walls) {
      wall.display();
    }
  }

  /**
   * 판정 이미지 설정
   * @param {Object} images - 판정 이미지 객체 { wow, great, good, miss }
   */
  setJudgmentImages(images) {
    this.judgmentImages = images;
    console.log('✓ 판정 이미지 설정 완료');
  }

  /**
   * 히트 이펙트 프레임 설정
   * @param {Array<p5.Image>} frames - 히트 이펙트 프레임 배열
   */
  setHitEffectFrames(frames) {
    this.hitEffectFrames = frames.filter(f => f); // null 제거
    console.log(`✓ 히트 이펙트 ${this.hitEffectFrames.length}개 프레임 설정 완료`);
  }

  /**
   * 히트 이펙트 생성
   * @param {number} x - 이펙트 X 위치
   * @param {number} y - 이펙트 Y 위치
   */
  createHitEffect(x, y) {
    if (this.hitEffectFrames.length === 0) return;

    this.activeHitEffects.push({
      x: x,
      y: y,
      startTime: millis(),
      currentFrame: 0
    });
  }

  /**
   * 히트 이펙트 업데이트 및 렌더링
   */
  updateAndDisplayHitEffects() {
    if (this.hitEffectFrames.length === 0) return;

    const currentTime = millis();
    const totalFrames = this.hitEffectFrames.length;

    // 완료된 이펙트 제거하면서 렌더링
    this.activeHitEffects = this.activeHitEffects.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      const frameIndex = Math.floor(elapsed / this.hitEffectFrameRate);

      // 애니메이션 완료 확인
      if (frameIndex >= totalFrames) {
        return false; // 제거
      }

      // 현재 프레임 렌더링
      const frame = this.hitEffectFrames[frameIndex];
      if (frame) {
        push();
        imageMode(CENTER);

        // 이펙트 크기를 벽 크기에 맞춤
        // 벽 크기: width 80, height 150
        const targetSize = 300; // 벽 높이 기준 / 사이즈 150 -> 300 으로 변경
        const scale = targetSize / frame.height;
        const w = frame.width * scale;
        const h = frame.height * scale;

        image(frame, effect.x, effect.y, w, h);
        pop();
      }

      return true; // 유지
    });
  }

  /**
   * 판정 표시 렌더링
   */
  displayJudgment() {
    if (!this.lastJudgment) return;

    const elapsed = millis() - this.lastJudgment.time;
    if (elapsed > this.judgmentDuration) {
      this.lastJudgment = null;
      return;
    }

    push();

    const progress = elapsed / this.judgmentDuration;
    const fadeOut = 1 - Math.pow(progress, 2); // 서서히 사라짐
    const scale = 1 + Math.sin(progress * Math.PI) * 0.3; // 튀어오르는 효과
    const yOffset = -progress * 50; // 위로 올라감

    const x = this.lastJudgment.x;
    const y = this.lastJudgment.y + yOffset;

    // 판정 이미지 가져오기
    const judgmentImg = this.judgmentImages[this.lastJudgment.type];

    if (judgmentImg) {
      // 이미지로 판정 표시
      imageMode(CENTER);
      tint(255, 255 * fadeOut); // 페이드 아웃 효과

      // 이미지 크기 (원본 비율 유지하면서 스케일)
      const imgWidth = judgmentImg.width * scale * 0.5; // 크기 조정
      const imgHeight = judgmentImg.height * scale * 0.5;

      // 글로우 효과 (그림자)
      for (let i = 3; i >= 1; i--) {
        tint(255, 50 * fadeOut);
        image(judgmentImg, x + i, y + i, imgWidth, imgHeight);
      }

      // 메인 이미지
      tint(255, 255 * fadeOut);
      image(judgmentImg, x, y, imgWidth, imgHeight);

      noTint();
    } else {
      // 이미지가 없으면 텍스트로 표시 (폴백)
      let judgmentText;
      switch (this.lastJudgment.type) {
        case 'wow':
          judgmentText = 'WOW!';
          break;
        case 'great':
          judgmentText = 'GREAT!';
          break;
        case 'good':
          judgmentText = 'GOOD';
          break;
        case 'miss':
          judgmentText = 'MISS';
          break;
      }

      textAlign(CENTER, CENTER);
      textSize(36 * scale);
      fill(255, 255, 255, 255 * fadeOut);
      text(judgmentText, x, y);
    }

    pop();
  }

  /**
   * 디버그 정보 표시
   * @param {number} characterX - 캐릭터 X 위치
   */
  displayDebug(characterX) {
    if (!this.debugMode) return;

    push();

    const hitZoneX = this.getHitZoneX(characterX);

    // MISS 존 = 전체 Hit Zone (빨간색 - MISS 이미지 색상)
    fill(255, 100, 100, 15);
    stroke(255, 100, 100);
    strokeWeight(2);
    rectMode(CENTER);
    rect(hitZoneX, this.wallY, this.hitZoneWidth, 200);

    // GOOD 존 표시 (파란색 - GOOD 이미지 색상) - 중심 40%
    const goodWidth = this.hitZoneWidth * 0.8;
    fill(100, 180, 255, 20);
    stroke(100, 180, 255);
    rect(hitZoneX, this.wallY, goodWidth, 200);

    // GREAT 존 표시 (초록색 - GREAT 이미지 색상) - 중심 25%
    const greatWidth = this.hitZoneWidth * 0.5;
    fill(100, 255, 150, 25);
    stroke(100, 255, 150);
    rect(hitZoneX, this.wallY, greatWidth, 200);

    // WOW 존 표시 (노란색 - WOW 이미지 색상) - 중심 12.5%
    const wowWidth = this.hitZoneWidth * 0.25;
    fill(255, 220, 100, 30);
    stroke(255, 220, 100);
    rect(hitZoneX, this.wallY, wowWidth, 200);

    // 캐릭터 충돌 영역 표시 (빨간 영역)
    fill(255, 0, 0, 50);
    stroke(255, 0, 0);
    rect(characterX, this.wallY, this.characterWidth, 200);

    // 각 벽의 디버그 표시
    for (let wall of this.walls) {
      wall.displayDebug(hitZoneX, this.hitZoneWidth);
    }

    // 디버그 텍스트
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    text(`벽 수: ${this.walls.length}`, 20, 80);
    text(`파괴한 벽: ${this.destroyedCount}`, 20, 100);

    pop();
  }

  /**
   * 디버그 모드 토글
   */
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`디버그 모드: ${this.debugMode ? 'ON' : 'OFF'}`);
  }

  /**
   * 벽 속도 설정
   * @param {number} speed - 새로운 속도
   */
  setWallSpeed(speed) {
    this.wallSpeed = speed;
    // 기존 벽들도 속도 업데이트
    for (let wall of this.walls) {
      wall.speed = speed;
    }
  }

  /**
   * 스폰 간격 설정
   * @param {number} interval - 새로운 간격 (ms)
   */
  setSpawnInterval(interval) {
    this.spawnInterval = interval;
  }

  /**
   * 벽 스프라이트 배열 설정
   * @param {Array<p5.Image>} sprites - 스프라이트 이미지 배열
   */
  setWallSprites(sprites) {
    this.wallSprites = sprites.filter(s => s); // null/undefined 제거
    this.currentSpriteIndex = 0;
    console.log(`✓ 벽 스프라이트 ${this.wallSprites.length}개 설정 완료`);
  }

  /**
   * 게임 리셋
   */
  reset() {
    this.walls = [];
    this.destroyedCount = 0;
    this.lastSpawnTime = millis();
    this.isActive = true;
    this.currentSpriteIndex = 0; // 스프라이트 순서도 리셋
  }

  /**
   * 게임 일시정지/재개
   * @param {boolean} active - 활성화 여부
   */
  setActive(active) {
    this.isActive = active;
    if (active) {
      this.lastSpawnTime = millis(); // 재개 시 타이머 리셋
    }
  }

  /**
   * 현재 구간의 속도 배율 설정 (구간별 패턴)
   * @param {number} multiplier - 속도 배율
   */
  setSpeedMultiplierForSection(multiplier) {
    if (!this.speedIncreaseEnabled) return;

    // 최대 속도 제한
    const clampedMultiplier = Math.min(multiplier, this.maxSpeedMultiplier);
    this.currentSpeedMultiplier = clampedMultiplier;

    // 기존 벽들의 속도도 업데이트
    const newSpeed = this.baseWallSpeed * clampedMultiplier;
    for (let wall of this.walls) {
      wall.speed = newSpeed;
    }

    console.log(`⚡ 속도 변경: ${clampedMultiplier.toFixed(2)}x (${newSpeed.toFixed(1)} px/frame)`);
  }

  /**
   * 현재 속도 배율 가져오기
   * @returns {number} 현재 속도 배율
   */
  getSpeedMultiplier() {
    return this.currentSpeedMultiplier;
  }

  /**
   * 속도 증가 시스템 활성화/비활성화
   * @param {boolean} enabled - 활성화 여부
   */
  setSpeedIncreaseEnabled(enabled) {
    this.speedIncreaseEnabled = enabled;
    if (!enabled) {
      this.currentSpeedMultiplier = 1.0;
      this.setSpeedMultiplierForSection(1.0);
    }
  }
}
