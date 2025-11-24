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
    this.wallY = gameHeight - 200 - 75; // 캐릭터 발 위치에서 벽 높이/2 뺀 위치

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

    // 디버그 모드
    this.debugMode = false;

    // 판정 시스템
    this.lastJudgment = null; // { type: 'excellent'|'great'|'nice', time: ms, x: number, y: number }
    this.judgmentDuration = 800; // 판정 표시 시간 (ms)
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
    const minDistance = 120; // 최소 간격 (벽 너비 + 여유)
    const recentWalls = this.walls.filter(w => w.currentState === w.states.NORMAL);
    if (recentWalls.length > 0) {
      const lastWall = recentWalls[recentWalls.length - 1];
      if (Math.abs(lastWall.x - spawnX) < minDistance) {
        console.log('⚠️ 벽 겹침 방지: 생성 건너뜀');
        return false;
      }
    }

    const wall = new Wall(
      spawnX,
      this.wallY,
      this.wallSpeed
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
      // 연타: 빠른 간격으로 여러 벽
      const count = pattern.count;
      const division = pattern.division || 2;
      const comboInterval = this.beatInterval / division;

      for (let i = 0; i < count; i++) {
        // 시간차를 두고 벽 생성 (속도 조절로 간격 표현)
        setTimeout(() => {
          this.spawnWall();
        }, i * comboInterval);
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
      if (wall.isInHitZone(hitZoneX, this.hitZoneWidth)) {
        // 벽과 Hit Zone 중심 사이의 거리로 판정
        const distance = Math.abs(wall.x - hitZoneX);
        const judgment = this.calculateJudgment(distance);

        wall.destroy();
        this.destroyedCount++;

        // 판정 저장
        this.lastJudgment = {
          type: judgment,
          time: millis(),
          x: wall.x,
          y: this.wallY - 100
        };

        return { type: judgment, destroyed: true };
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
    const excellentZone = this.hitZoneWidth * 0.15; // 중심 15%
    const greatZone = this.hitZoneWidth * 0.35;     // 중심 35%

    if (distance <= excellentZone) {
      return 'excellent';
    } else if (distance <= greatZone) {
      return 'great';
    } else {
      return 'nice';
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

    // 판정별 색상과 텍스트
    let judgmentText, mainColor, glowColor;
    switch (this.lastJudgment.type) {
      case 'excellent':
        judgmentText = 'EXCELLENT!';
        mainColor = color(255, 215, 0); // 금색
        glowColor = color(255, 200, 50, 150);
        break;
      case 'great':
        judgmentText = 'GREAT!';
        mainColor = color(0, 255, 150); // 청록색
        glowColor = color(0, 255, 150, 150);
        break;
      case 'nice':
        judgmentText = 'NICE';
        mainColor = color(100, 200, 255); // 하늘색
        glowColor = color(100, 200, 255, 150);
        break;
    }

    // 글로우 효과 (여러 레이어)
    textAlign(CENTER, CENTER);
    textSize(36 * scale);

    // 외부 글로우
    for (let i = 3; i >= 1; i--) {
      fill(red(glowColor), green(glowColor), blue(glowColor), 30 * fadeOut);
      text(judgmentText, x + i, y + i);
      text(judgmentText, x - i, y - i);
      text(judgmentText, x + i, y - i);
      text(judgmentText, x - i, y + i);
    }

    // 메인 텍스트 (테두리)
    fill(0, 0, 0, 200 * fadeOut);
    strokeWeight(4);
    stroke(0, 0, 0, 150 * fadeOut);
    text(judgmentText, x, y);

    // 메인 텍스트
    noStroke();
    fill(red(mainColor), green(mainColor), blue(mainColor), 255 * fadeOut);
    text(judgmentText, x, y);

    // Excellent일 때 반짝임 효과
    if (this.lastJudgment.type === 'excellent' && progress < 0.5) {
      const sparkle = Math.sin(elapsed * 0.05) * 0.5 + 0.5;
      fill(255, 255, 255, 200 * sparkle * fadeOut);
      textSize(38 * scale);
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

    // Excellent 존 표시 (금색)
    const excellentWidth = this.hitZoneWidth * 0.3;
    fill(255, 215, 0, 30);
    stroke(255, 215, 0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(hitZoneX, this.wallY, excellentWidth, 200);

    // Great 존 표시 (청록색)
    const greatWidth = this.hitZoneWidth * 0.7;
    fill(0, 255, 150, 20);
    stroke(0, 255, 150);
    rect(hitZoneX, this.wallY, greatWidth, 200);

    // Nice 존 = 전체 Hit Zone (하늘색)
    fill(100, 200, 255, 15);
    stroke(100, 200, 255);
    rect(hitZoneX, this.wallY, this.hitZoneWidth, 200);

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
}
