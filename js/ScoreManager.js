/**
 * ScoreManager 클래스
 * 점수, 체력 관리, UI 표시, 게임 종료 화면을 담당합니다.
 */
class ScoreManager {
  constructor() {
    // 점수 시스템
    this.score = 0;
    this.wallsDestroyed = 0;

    // 판정별 기본 점수 (콤보 배수 적용 전)
    this.pointsPerJudgment = {
      wow: 50,
      great: 30,
      good: 15,
      miss: 5
    };

    // 판정 통계
    this.judgmentCounts = {
      wow: 0,
      great: 0,
      good: 0,
      miss: 0
    };

    // 콤보 시스템
    this.combo = 0;
    this.maxCombo = 0;
    this.lastComboTime = 0;
    this.comboDuration = 1000; // 콤보 표시 유지 시간

    // 체력 시스템
    this.maxHealth = 7;
    this.health = this.maxHealth;
    this.damagePerHit = 1;

    // HP 바 이미지
    this.hpBarImages = null;

    // 스코어 백보드 이미지
    this.scoreBackboard = null;

    // 게임 상태
    this.gameEnded = false;
    this.isCleared = false; // true: 클리어, false: 사망

    // UI 설정
    this.baseWidth = 1600;
    this.baseHeight = 900;

    // 데미지 이펙트
    this.lastDamageTime = 0;
    this.damageEffectDuration = 500; // 이펙트 지속 시간 (ms)

    // 게임 종료 카운트다운
    this.gameEndTime = 0;
    this.countdownDurationClear = 120000; // 클리어 시 2분
    this.countdownDurationGameOver = 10000; // 게임오버 시 10초
  }

  /**
   * 콤보 배수 계산
   * @returns {number} 현재 콤보에 따른 배수
   */
  getComboMultiplier() {
    if (this.combo >= 100) return 2.5;
    if (this.combo >= 50) return 2.0;
    if (this.combo >= 30) return 1.8;
    if (this.combo >= 20) return 1.5;
    if (this.combo >= 10) return 1.2;
    return 1.0;
  }

  /**
   * 점수 추가 (벽 파괴 시)
   * @param {string} judgment - 판정 타입 ('wow', 'great', 'good', 'miss')
   */
  addScore(judgment = 'miss') {
    // 콤보 먼저 증가 (배수 계산에 반영)
    this.combo++;
    this.lastComboTime = millis();
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // 기본 점수 × 콤보 배수
    const basePoints = this.pointsPerJudgment[judgment] || this.pointsPerJudgment.miss;
    const multiplier = this.getComboMultiplier();
    const points = Math.floor(basePoints * multiplier);

    this.score += points;
    this.wallsDestroyed++;

    // 판정 통계 업데이트
    if (this.judgmentCounts[judgment] !== undefined) {
      this.judgmentCounts[judgment]++;
    }

    console.log(`+${points}점 (${judgment.toUpperCase()} x${multiplier})! ${this.combo}콤보! 총 ${this.score}점`);
  }

  /**
   * 콤보 초기화 (데미지 받을 때)
   */
  breakCombo() {
    if (this.combo > 0) {
      console.log(`💔 ${this.combo}콤보 끊김!`);
      this.combo = 0;
    }
  }

  /**
   * 점수 직접 설정
   * @param {number} points - 추가할 점수
   */
  addPoints(points) {
    this.score += points;
  }

  /**
   * 현재 점수 반환
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * 파괴한 벽 수 반환
   * @returns {number}
   */
  getWallsDestroyed() {
    return this.wallsDestroyed;
  }

  /**
   * 데미지 받기 (벽 충돌 시)
   * @returns {boolean} 사망했으면 true
   */
  takeDamage() {
    this.health -= this.damagePerHit;
    this.lastDamageTime = millis(); // 데미지 이펙트용 시간 기록
    console.log(`💔 -${this.damagePerHit} HP! (남은 체력: ${this.health})`);

    if (this.health <= 0) {
      this.health = 0;
      return true; // 사망
    }
    return false;
  }

  /**
   * 현재 체력 반환
   * @returns {number}
   */
  getHealth() {
    return this.health;
  }

  /**
   * 사망 여부 확인
   * @returns {boolean}
   */
  isDead() {
    return this.health <= 0;
  }

  /**
   * 게임 클리어 (음악 종료)
   */
  clearGame() {
    this.gameEnded = true;
    this.isCleared = true;
    this.gameEndTime = millis();
    console.log(`🎉 게임 클리어! 최종 점수: ${this.score}점`);
  }

  /**
   * 게임 오버 (사망)
   */
  gameOver() {
    this.gameEnded = true;
    this.isCleared = false;
    this.gameEndTime = millis();
    console.log(`💀 게임 오버! 최종 점수: ${this.score}점`);
  }

  /**
   * 현재 상태에 맞는 카운트다운 시간 반환
   * @returns {number} 카운트다운 시간 (ms)
   */
  getCountdownDuration() {
    return this.isCleared ? this.countdownDurationClear : this.countdownDurationGameOver;
  }

  /**
   * 남은 카운트다운 시간 반환 (초)
   * @returns {number} 남은 초 (0 이하면 시간 초과)
   */
  getRemainingCountdown() {
    const duration = this.getCountdownDuration();
    if (this.gameEndTime === 0) return duration / 1000;
    const elapsed = millis() - this.gameEndTime;
    const remaining = Math.ceil((duration - elapsed) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * 카운트다운 완료 여부
   * @returns {boolean}
   */
  isCountdownFinished() {
    if (this.gameEndTime === 0) return false;
    return (millis() - this.gameEndTime) >= this.getCountdownDuration();
  }

  /**
   * 게임 종료 여부 확인
   * @returns {boolean}
   */
  isGameEnded() {
    return this.gameEnded;
  }

  /**
   * 리셋
   */
  reset() {
    this.score = 0;
    this.wallsDestroyed = 0;
    this.health = this.maxHealth;
    this.gameEnded = false;
    this.isCleared = false;
    this.gameEndTime = 0;

    // 판정 통계 초기화
    this.judgmentCounts = {
      wow: 0,
      great: 0,
      good: 0,
      miss: 0
    };

    // 콤보 초기화
    this.combo = 0;
    this.maxCombo = 0;
    this.lastComboTime = 0;
  }

  /**
   * 체력바 UI 표시 (왼쪽 위) - 하트 아이콘 + 체력바
   * @param {p5.Image} heartImg - 하트 아이콘 이미지 (선택)
   */
  /**
   * HP 바 이미지 설정
   * @param {Object} images - HP 바 이미지 객체
   */
  setHpBarImages(images) {
    this.hpBarImages = images;
    console.log('✓ HP 바 이미지 설정 완료');
  }

  /**
   * 스코어 백보드 이미지 설정
   * @param {p5.Image} image - 백보드 이미지
   */
  setScoreBackboard(image) {
    this.scoreBackboard = image;
    console.log('✓ 스코어 백보드 이미지 설정 완료');
  }

  displayHealth(heartImg) {
    push();

    const barX = 20;
    const barY = 20;

    // HP 바 이미지가 있으면 이미지 사용
    if (this.hpBarImages) {
      let hpImage;

      // 체력에 따라 적절한 이미지 선택
      if (this.health <= 0) {
        hpImage = this.hpBarImages.empty;
      } else if (this.health >= 7) {
        hpImage = this.hpBarImages.full;
      } else {
        hpImage = this.hpBarImages[`hp${this.health}`];
      }

      if (hpImage) {
        imageMode(CORNER);

        // 데미지 이펙트
        const timeSinceDamage = millis() - this.lastDamageTime;
        const isDamageEffect = timeSinceDamage < this.damageEffectDuration;

        if (isDamageEffect) {
          const effectIntensity = 1 - (timeSinceDamage / this.damageEffectDuration);
          tint(255, 150 + effectIntensity * 105, 150 + effectIntensity * 105);
        }

        // HP 바 이미지 표시 (적절한 크기로 조정)
        const scale = 0.25; // 크기 조정 (더 작게)
        image(hpImage, barX, barY, hpImage.width * scale, hpImage.height * scale);

        noTint();
      }
    } else {
      // 기존 방식 (폴백)
      const barWidth = 320;
      const barHeight = 36;
      const healthPercent = this.health / this.maxHealth;

      // 데미지 이펙트 계산
      const timeSinceDamage = millis() - this.lastDamageTime;
      const isDamageEffect = timeSinceDamage < this.damageEffectDuration;
      const effectIntensity = isDamageEffect ? 1 - (timeSinceDamage / this.damageEffectDuration) : 0;

      // 체력바 배경 (데미지 시 빨간색으로)
      if (isDamageEffect) {
        const flashAlpha = 150 + effectIntensity * 100;
        fill(180 * effectIntensity, 0, 0, flashAlpha);
      } else {
        fill(0, 0, 0, 150);
      }
      noStroke();
      rectMode(CORNER);
      rect(barX - 5, barY - 5, barWidth + 60, barHeight + 15, 10);

      // 데미지 시 빨간 테두리
      if (isDamageEffect) {
        stroke(255, 50, 50, 255 * effectIntensity);
        strokeWeight(3);
        noFill();
        rect(barX - 5, barY - 5, barWidth + 60, barHeight + 15, 10);
        noStroke();
      }

      // 하트 아이콘 (이미지 또는 이모지)
      const iconSize = 32;
      if (heartImg) {
        imageMode(CENTER);
        // 데미지 시 틴트 효과
        if (isDamageEffect) {
          tint(255, 150, 150);
        }
        image(heartImg, barX + 20, barY + barHeight / 2 + 2, iconSize, iconSize);
        noTint();
      } else {
        // 이미지 없으면 이모지 사용
        textAlign(CENTER, CENTER);
        textSize(28);
        fill(isDamageEffect ? color(255, 100, 100) : color(255, 80, 100));
        text('❤', barX + 18, barY + barHeight / 2 + 2);
      }

      // 체력바 외곽
      const barStartX = barX + 45;
      fill(50);
      rect(barStartX, barY, barWidth, barHeight, 6);

      // 체력바 내부 (체력에 따라 색상 변경)
      let healthColor;
      if (healthPercent > 0.6) {
        healthColor = color(100, 255, 100); // 녹색
      } else if (healthPercent > 0.3) {
        healthColor = color(255, 200, 50); // 노란색
      } else {
        healthColor = color(255, 80, 80); // 빨간색
      }

      fill(healthColor);
      rect(barStartX + 3, barY + 3, (barWidth - 6) * healthPercent, barHeight - 6, 4);

      // 데미지 시 체력바 위에 빨간 플래시 오버레이
      if (isDamageEffect) {
        fill(255, 0, 0, 150 * effectIntensity);
        rect(barStartX + 3, barY + 3, (barWidth - 6) * healthPercent, barHeight - 6, 4);
      }
    }

    pop();
  }

  /**
   * 진행 바 UI 표시 (가운데 위)
   * @param {number} currentTime - 현재 재생 시간 (ms)
   * @param {number} totalTime - 전체 음악 길이 (ms)
   * @param {Object} runAnimation - RUN 애니메이션 프레임 배열 (선택)
   */
  displayProgress(currentTime, totalTime, runAnimation) {
    if (totalTime <= 0) return;

    push();

    const barWidth = 400;
    const barHeight = 8;
    const barX = (this.baseWidth - barWidth) / 2;
    const barY = 30;
    const progress = Math.min(currentTime / totalTime, 1);

    // 진행 바 배경
    fill(0, 0, 0, 120);
    noStroke();
    rectMode(CORNER);
    rect(barX - 10, barY - 15, barWidth + 20, barHeight + 35, 8);

    // 진행 바 트랙
    fill(50, 50, 60);
    rect(barX, barY, barWidth, barHeight, 4);

    // 진행 바 채움
    fill(100, 200, 255);
    rect(barX, barY, barWidth * progress, barHeight, 4);

    // 현재 위치 표시 - 캐릭터 스프라이트 또는 점
    const charX = barX + barWidth * progress;
    const charY = barY + barHeight / 2;

    if (runAnimation && runAnimation.length > 0) {
      // RUN 애니메이션 프레임 선택 (시간에 따라 변경)
      const frameIndex = Math.floor((millis() / 80) % runAnimation.length);
      const frame = runAnimation[frameIndex];

      // 캐릭터 스프라이트 그리기 (진행바 가운데에 위치)
      const spriteSize = 60; // 크기 축소 (110 → 60)
      imageMode(CENTER);
      image(frame, charX, charY, spriteSize, spriteSize);
    } else {
      // 스프라이트 없으면 밝은 점
      fill(255);
      ellipse(charX, charY, 14, 14);
    }

    // 시간 표시
    const currentMin = Math.floor(currentTime / 60000);
    const currentSec = Math.floor((currentTime % 60000) / 1000);
    const totalMin = Math.floor(totalTime / 60000);
    const totalSec = Math.floor((totalTime % 60000) / 1000);

    fill(200);
    textAlign(CENTER, TOP);
    textSize(12);
    text(
      `${currentMin}:${currentSec.toString().padStart(2, '0')} / ${totalMin}:${totalSec.toString().padStart(2, '0')}`,
      this.baseWidth / 2,
      barY + barHeight + 8
    );

    pop();
  }

  /**
   * 점수 UI 표시 (오른쪽 위)
   */
  displayScore() {
    push();

    const scoreX = this.baseWidth - 30;
    const scoreY = 25;

    // 백보드 이미지가 있으면 사용
    if (this.scoreBackboard) {
      imageMode(CORNER);
      // 백보드 크기 및 위치 조정
      const backboardWidth = 240;
      const backboardHeight = 100; // 높이 증가
      const backboardX = this.baseWidth - backboardWidth - 10;
      const backboardY = 15;

      image(this.scoreBackboard, backboardX, backboardY, backboardWidth, backboardHeight);

      // 백보드 위에 텍스트 표시
      // SCORE 라벨
      fill(0); // 검은색 텍스트 (노란 배경에 잘 보임)
      textAlign(CENTER, TOP);
      textSize(20);
      textStyle(BOLD);
      text('SCORE', backboardX + backboardWidth / 2, backboardY + 20);

      // 점수 숫자
      textSize(36);
      text(this.score.toString().padStart(6, '0'), backboardX + backboardWidth / 2, backboardY + 50);
      textStyle(NORMAL);
    } else {
      // 기존 방식 (폴백)
      fill(0, 0, 0, 150);
      noStroke();
      rectMode(CORNER);
      rect(this.baseWidth - 220, 15, 200, 70, 10);

      fill(255, 220, 100);
      textAlign(RIGHT, TOP);
      textSize(18);
      text('SCORE', scoreX, scoreY);

      fill(255);
      textSize(32);
      text(this.score.toString().padStart(6, '0'), scoreX, scoreY + 23);
    }

    pop();
  }

  /**
   * 콤보 UI 표시 (화면 중앙)
   */
  displayCombo() {
    if (this.combo < 2) return; // 2콤보 이상만 표시

    push();

    const comboX = this.baseWidth / 2;
    const comboY = this.baseHeight / 2 - 50;

    // 콤보 애니메이션 효과
    const timeSinceCombo = millis() - this.lastComboTime;
    const isRecent = timeSinceCombo < 300;
    const pulseScale = isRecent ? 1 + Math.sin(timeSinceCombo * 0.02) * 0.15 : 1;
    const fadeAlpha = timeSinceCombo < this.comboDuration ? 255 : Math.max(0, 255 - (timeSinceCombo - this.comboDuration) * 0.5);

    if (fadeAlpha <= 0) {
      pop();
      return;
    }

    // 콤보 색상 (콤보 수에 따라 변경)
    let comboColor;
    if (this.combo >= 50) {
      // 50콤보 이상: 무지개색 효과
      const hue = (millis() * 0.2) % 360;
      colorMode(HSB, 360, 100, 100);
      comboColor = color(hue, 80, 100);
      colorMode(RGB, 255);
    } else if (this.combo >= 30) {
      comboColor = color(255, 50, 150); // 핫핑크
    } else if (this.combo >= 20) {
      comboColor = color(255, 100, 50); // 주황
    } else if (this.combo >= 10) {
      comboColor = color(255, 220, 50); // 금색
    } else {
      comboColor = color(100, 200, 255); // 하늘색
    }

    // 배경 글로우 효과 (더 크게)
    noStroke();
    for (let i = 5; i >= 1; i--) {
      fill(red(comboColor), green(comboColor), blue(comboColor), 20 * (fadeAlpha / 255));
      ellipse(comboX, comboY, 200 + i * 40, 120 + i * 20);
    }

    // 콤보 숫자 (크게)
    textAlign(CENTER, CENTER);
    const baseSize = 72; // 기본 크기를 크게
    textSize(baseSize * pulseScale);

    // 외곽선 효과 (두껍게)
    fill(0, 0, 0, fadeAlpha * 0.9);
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (dx !== 0 || dy !== 0) {
          text(this.combo, comboX + dx, comboY + dy);
        }
      }
    }

    // 메인 텍스트
    fill(red(comboColor), green(comboColor), blue(comboColor), fadeAlpha);
    text(this.combo, comboX, comboY);

    // COMBO 라벨 (더 크게)
    textSize(24 * pulseScale);
    fill(255, 255, 255, fadeAlpha * 0.9);
    text('COMBO', comboX, comboY + 50);

    // 특정 콤보 달성 시 추가 효과 (50, 100, 150, 200, 250, 300)
    if (isRecent && (this.combo === 50 || this.combo === 100 || this.combo === 150 || this.combo === 200 || this.combo === 250 || this.combo === 300)) {
      const sparkleCount = Math.min(this.combo / 50, 6);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = (millis() * 0.003 + i * (TWO_PI / sparkleCount)) % TWO_PI;
        const radius = 100 + Math.sin(millis() * 0.01) * 20;
        const sx = comboX + Math.cos(angle) * radius;
        const sy = comboY + Math.sin(angle) * radius * 0.6;
        fill(255, 255, 200, fadeAlpha * 0.8);
        ellipse(sx, sy, 10, 10);
      }
    }

    pop();
  }

  /**
   * 게임 종료 화면 표시
   * @param {string} musicName - 플레이한 곡 이름
   * @param {number} bpm - BPM
   * @param {Object} rankingInfo - 랭킹 정보 (선택)
   * @param {Object} infoManager - 정보 매니저 (선택, 로고 표시용)
   */
  displayGameOver(musicName, bpm, rankingInfo = null, infoManager = null) {
    if (!this.gameEnded) return;

    push();

    // 반투명 오버레이
    fill(0, 0, 0, 200);
    rectMode(CORNER);
    rect(0, 0, this.baseWidth, this.baseHeight);

    const centerX = this.baseWidth / 2;
    const centerY = this.baseHeight / 2;

    // 클리어 시에만 랭킹 표시 (박스 크기 조절)
    const showRanking = this.isCleared && rankingInfo;
    const boxWidth = showRanking ? 700 : 500;
    const boxHeight = showRanking ? 500 : 400;

    // 결과 박스
    if (this.isCleared) {
      fill(30, 30, 50, 240);
      stroke(100, 200, 255);
    } else {
      fill(50, 20, 20, 240);
      stroke(255, 100, 100);
    }
    strokeWeight(3);
    rectMode(CENTER);
    rect(centerX, centerY, boxWidth, boxHeight, 20);

    // 게임 종료 타이틀
    noStroke();
    if (this.isCleared) {
      fill(100, 200, 255);
      textAlign(CENTER, CENTER);
      textSize(48);
      text('CLEAR!', centerX, centerY - 200);
    } else {
      fill(255, 100, 100);
      textAlign(CENTER, CENTER);
      textSize(48);
      text('GAME OVER', centerX, centerY - 150);
    }

    // 곡 정보 (클리어와 게임오버 위치 분리)
    fill(200);
    textSize(18);
    const musicNameY = this.isCleared ? centerY - 160 : centerY - 100;
    text(musicName, centerX, musicNameY);
    fill(150);
    textSize(14);
    text(`BPM: ${bpm}`, centerX, musicNameY + 25);

    if (showRanking) {
      // 클리어 시: 두 컬럼으로 나눠서 표시
      const leftX = centerX - 160;
      const rightX = centerX + 160;

      // 왼쪽: 결과
      stroke(100, 100, 150);
      strokeWeight(1);
      line(leftX - 100, centerY - 100, leftX + 100, centerY - 100);

      noStroke();
      fill(255, 220, 100);
      textSize(20);
      textAlign(CENTER, CENTER);
      text('RESULT', leftX, centerY - 75);

      fill(200);
      textSize(16);
      textAlign(LEFT, CENTER);
      text('파괴한 벽', leftX - 80, centerY - 40);
      textAlign(RIGHT, CENTER);
      fill(255);
      text(`${this.wallsDestroyed}개`, leftX + 80, centerY - 40);

      fill(200);
      textAlign(LEFT, CENTER);
      text('최종 점수', leftX - 80, centerY - 10);
      textAlign(RIGHT, CENTER);
      fill(100, 255, 100);
      textSize(24);
      text(`${this.score}점`, leftX + 80, centerY - 10);

      // 판정 통계
      textSize(14);
      const statsY = centerY + 30;

      textAlign(LEFT, CENTER);
      fill(255, 215, 0);
      text('WOW', leftX - 80, statsY);
      textAlign(RIGHT, CENTER);
      text(`${this.judgmentCounts.wow}`, leftX + 80, statsY);

      textAlign(LEFT, CENTER);
      fill(0, 255, 150);
      text('GREAT', leftX - 80, statsY + 22);
      textAlign(RIGHT, CENTER);
      text(`${this.judgmentCounts.great}`, leftX + 80, statsY + 22);

      textAlign(LEFT, CENTER);
      fill(100, 200, 255);
      text('GOOD', leftX - 80, statsY + 44);
      textAlign(RIGHT, CENTER);
      text(`${this.judgmentCounts.good}`, leftX + 80, statsY + 44);

      textAlign(LEFT, CENTER);
      fill(200, 100, 100);
      text('MISS', leftX - 80, statsY + 66);
      textAlign(RIGHT, CENTER);
      text(`${this.judgmentCounts.miss}`, leftX + 80, statsY + 66);

      // 최대 콤보
      textAlign(LEFT, CENTER);
      fill(255, 150, 255);
      text('MAX COMBO', leftX - 80, statsY + 88);
      textAlign(RIGHT, CENTER);
      text(`${this.maxCombo}`, leftX + 80, statsY + 88);

      // 닉네임 입력
      if (rankingInfo.isEntering) {
        fill(255, 220, 100);
        textSize(16);
        textAlign(CENTER, CENTER);
        text('닉네임 입력', leftX, centerY + 100);

        // HTML input이 여기에 위치함 (sketch.js에서 생성)

        fill(150);
        textSize(12);
        text('Enter로 저장 / ESC로 건너뛰기', leftX, centerY + 165);
      } else if (rankingInfo.saved) {
        // 저장 완료
        fill(100, 255, 100);
        textSize(18);
        textAlign(CENTER, CENTER);
        if (rankingInfo.rank > 0) {
          text(`${rankingInfo.rank}위 등록!`, leftX, centerY + 120);
        } else {
          text('저장 완료!', leftX, centerY + 120);
        }
      }

      // 오른쪽: 랭킹
      stroke(100, 100, 150);
      strokeWeight(1);
      line(rightX - 120, centerY - 100, rightX + 120, centerY - 100);

      noStroke();
      fill(255, 220, 100);
      textSize(20);
      textAlign(CENTER, CENTER);
      text('RANKING', rightX, centerY - 75);

      // 랭킹 목록
      const rankings = rankingInfo.rankings || [];
      if (rankings.length === 0) {
        fill(150);
        textSize(14);
        text('기록 없음', rightX, centerY);
      } else {
        for (let i = 0; i < Math.min(5, rankings.length); i++) {
          const entry = rankings[i];
          const y = centerY - 40 + i * 30;

          // 현재 저장된 기록 하이라이트
          if (rankingInfo.saved && rankingInfo.rank === i + 1) {
            fill(100, 255, 100, 50);
            noStroke();
            rectMode(CENTER);
            rect(rightX, y, 220, 25, 3);
          }

          // 등수
          fill(i < 3 ? color(255, 220, 100) : color(180));
          textSize(14);
          textAlign(LEFT, CENTER);
          text(`${i + 1}.`, rightX - 100, y);

          // 이름
          fill(255);
          text(entry.name.substring(0, 8), rightX - 75, y);

          // 점수
          textAlign(RIGHT, CENTER);
          fill(100, 255, 100);
          text(`${entry.score}`, rightX + 100, y);
        }
      }

      // 다시 시작 안내 + 카운트다운
      const remaining = this.getRemainingCountdown();
      fill(150);
      textAlign(CENTER, CENTER);
      textSize(14);
      text('ESC 를 눌러 다시 시작', centerX, centerY + 205);

      // 카운트다운 표시
      fill(255, 200, 100);
      textSize(20);
      text(`${remaining}초 후 자동으로 메인 화면으로 이동`, centerX, centerY + 230);

    } else {
      // 게임 오버 시: 기존 레이아웃
      stroke(100, 100, 150);
      strokeWeight(1);
      line(centerX - 180, centerY - 50, centerX + 180, centerY - 50);

      noStroke();
      fill(255, 220, 100);
      textSize(24);
      textAlign(CENTER, CENTER);
      text('RESULT', centerX, centerY - 20);

      fill(200);
      textSize(20);
      textAlign(LEFT, CENTER);
      text('파괴한 벽', centerX - 120, centerY + 25);
      textAlign(RIGHT, CENTER);
      fill(255);
      text(`${this.wallsDestroyed}개`, centerX + 120, centerY + 25);

      fill(200);
      textAlign(LEFT, CENTER);
      text('최종 점수', centerX - 120, centerY + 60);
      textAlign(RIGHT, CENTER);
      fill(100, 255, 100);
      textSize(28);
      text(`${this.score}점`, centerX + 120, centerY + 60);

      // 판정 통계 (게임오버) - 4단계
      textSize(13);
      textAlign(LEFT, CENTER);
      fill(255, 215, 0);
      text('WOW', centerX - 120, centerY + 100);
      fill(0, 255, 150);
      text('GREAT', centerX - 50, centerY + 100);
      fill(100, 200, 255);
      text('GOOD', centerX + 20, centerY + 100);
      fill(200, 100, 100);
      text('MISS', centerX + 90, centerY + 100);

      textAlign(RIGHT, CENTER);
      fill(255, 215, 0);
      text(`${this.judgmentCounts.wow}`, centerX - 55, centerY + 100);
      fill(0, 255, 150);
      text(`${this.judgmentCounts.great}`, centerX + 15, centerY + 100);
      fill(100, 200, 255);
      text(`${this.judgmentCounts.good}`, centerX + 85, centerY + 100);
      fill(200, 100, 100);
      text(`${this.judgmentCounts.miss}`, centerX + 130, centerY + 100);

      // 최대 콤보 (게임오버)
      textAlign(CENTER, CENTER);
      fill(255, 150, 255);
      text(`MAX COMBO: ${this.maxCombo}`, centerX, centerY + 125);

      // 다시 시작 안내 + 카운트다운
      const remaining = this.getRemainingCountdown();
      fill(150);
      textAlign(CENTER, CENTER);
      textSize(14);
      text('ESC 를 눌러 다시 시작', centerX, centerY + 140);

      // 카운트다운 표시
      fill(255, 200, 100);
      textSize(18);
      text(`${remaining}초 후 자동으로 메인 화면으로 이동`, centerX, centerY + 170);
    }

    pop();
  }
}
