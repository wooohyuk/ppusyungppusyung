/**
 * Wall 클래스
 * 오른쪽에서 왼쪽으로 이동하는 파괴 가능한 벽(장애물)
 *
 * 상태:
 * - NORMAL: 일반 상태 (이동 중)
 * - DESTROYED: 파괴됨
 */
class Wall {
  /**
   * @param {number} x - 벽의 X 위치
   * @param {number} y - 벽의 Y 위치
   * @param {number} speed - 이동 속도 (기본값: 8)
   */
  // 벽 속도 8 -> 16 로 상향
  constructor(x, y, speed = 16) {
    this.x = x;
    this.y = y;
    this.speed = speed;

    // 벽 크기
    // 벽 크기 사이즈 각각 2배로 사이즈 업
    this.width = 160;
    this.height = 300;

    // 상태
    this.states = {
      NORMAL: 'NORMAL',
      DESTROYED: 'DESTROYED'
    };
    this.currentState = this.states.NORMAL;

    // 판정 상태
    this.hasBeenJudged = false; // 이미 판정을 받았는지 여부

    // 파괴 애니메이션
    this.destroyTimer = 0;
    this.destroyDuration = 300; // 파괴 이펙트 지속 시간 (ms)

    // 스프라이트 (나중에 추가 가능)
    this.sprite = null;
    this.animationManager = null;

    // 파괴 이펙트용 파티클
    this.particles = [];
  }

  /**
   * 스프라이트 설정 (선택사항)
   * @param {p5.Image} sprite - 벽 스프라이트 이미지
   */
  setSprite(sprite) {
    this.sprite = sprite;
  }

  /**
   * 벽 파괴
   */
  destroy() {
    if (this.currentState === this.states.NORMAL) {
      this.currentState = this.states.DESTROYED;
      this.destroyTimer = millis();
      this.createDestroyParticles();
      console.log('💥 벽 파괴!');
    }
  }

  /**
   * 파괴 파티클 생성
   */
  createDestroyParticles() {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: this.x + random(-this.width/2, this.width/2),
        y: this.y + random(-this.height/2, this.height/2),
        vx: random(-5, 5),
        vy: random(-8, -2),
        size: random(10, 25),
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.2, 0.2),
        alpha: 255
      });
    }
  }

  /**
   * 파티클 업데이트
   */
  updateParticles() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // 중력
      p.rotation += p.rotationSpeed;
      p.alpha -= 8;
    }
    // 투명해진 파티클 제거
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  /**
   * 벽이 완전히 제거되어야 하는지 확인
   * @returns {boolean}
   */
  shouldRemove() {
    if (this.currentState === this.states.DESTROYED) {
      return this.particles.length === 0;
    }
    // 화면 왼쪽 밖으로 나가면 제거
    return this.x < -this.width;
  }

  /**
   * 벽이 특정 영역(Hit Zone)과 겹치는지 확인
   * @param {number} zoneX - Hit Zone 중심 X
   * @param {number} zoneWidth - Hit Zone 너비
   * @returns {boolean}
   */
  isInHitZone(zoneX, zoneWidth) {
    if (this.currentState !== this.states.NORMAL) return false;

    const wallLeft = this.x - this.width / 2;
    const wallRight = this.x + this.width / 2;
    const zoneLeft = zoneX - zoneWidth / 2;
    const zoneRight = zoneX + zoneWidth / 2;

    return wallRight > zoneLeft && wallLeft < zoneRight;
  }

  /**
   * 벽이 캐릭터와 충돌하는지 확인 (Hit Zone을 지나친 경우)
   * @param {number} characterX - 캐릭터 X 위치
   * @param {number} characterWidth - 캐릭터 너비
   * @returns {boolean}
   */
  isCollidingWith(characterX, characterWidth) {
    if (this.currentState !== this.states.NORMAL) return false;

    const wallLeft = this.x - this.width / 2;
    const wallRight = this.x + this.width / 2;
    const charLeft = characterX - characterWidth / 2;
    const charRight = characterX + characterWidth / 2;

    return wallRight > charLeft && wallLeft < charRight;
  }

  /**
   * 벽 업데이트
   */
  update() {
    if (this.currentState === this.states.NORMAL) {
      // 왼쪽으로 이동
      this.x -= this.speed;
    } else if (this.currentState === this.states.DESTROYED) {
      // 파괴 이펙트 업데이트
      this.updateParticles();
    }
  }

  /**
   * 벽 렌더링
   */
  display() {
    push();

    if (this.currentState === this.states.NORMAL) {
      // 일반 상태: 벽 표시
      if (this.sprite) {
        // 스프라이트가 있으면 스프라이트 표시
        imageMode(CENTER);
        image(this.sprite, this.x, this.y, this.width, this.height);
      } else {
        // 스프라이트가 없으면 사각형으로 표시
        rectMode(CENTER);
        fill(139, 90, 43); // 갈색
        stroke(100, 60, 20);
        strokeWeight(3);
        rect(this.x, this.y, this.width, this.height, 5);

        // 벽돌 패턴
        stroke(100, 60, 20);
        strokeWeight(2);
        const brickHeight = 25;
        const brickWidth = 35;

        for (let row = 0; row < this.height / brickHeight; row++) {
          let offsetX = (row % 2 === 0) ? 0 : brickWidth / 2;
          let yPos = this.y - this.height/2 + row * brickHeight;

          // 가로선
          line(this.x - this.width/2, yPos, this.x + this.width/2, yPos);

          // 세로선
          for (let col = 0; col <= this.width / brickWidth + 1; col++) {
            let xPos = this.x - this.width/2 + col * brickWidth + offsetX;
            if (xPos >= this.x - this.width/2 && xPos <= this.x + this.width/2) {
              line(xPos, yPos, xPos, yPos + brickHeight);
            }
          }
        }
      }
    } else if (this.currentState === this.states.DESTROYED) {
      // 파괴 상태: 파티클 표시
      noStroke();
      for (let p of this.particles) {
        push();
        translate(p.x, p.y);
        rotate(p.rotation);
        fill(139, 90, 43, p.alpha);
        rectMode(CENTER);
        rect(0, 0, p.size, p.size, 2);
        pop();
      }
    }

    pop();
  }

  /**
   * 디버그 정보 표시 (개발용)
   * @param {number} hitZoneX - Hit Zone X 위치
   * @param {number} hitZoneWidth - Hit Zone 너비
   */
  displayDebug(hitZoneX, hitZoneWidth) {
    push();

    // 벽 히트박스
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(this.x, this.y, this.width, this.height);

    // Hit Zone 내에 있으면 녹색으로 표시
    if (this.isInHitZone(hitZoneX, hitZoneWidth)) {
      stroke(0, 255, 0);
      strokeWeight(3);
      rect(this.x, this.y, this.width + 10, this.height + 10);
    }

    pop();
  }
}
