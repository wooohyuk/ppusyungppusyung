/**
 * Character 클래스
 * 게임 캐릭터의 8가지 상태를 관리하고 전환합니다.
 * 'a' 키로 3단 콤보 공격 가능 (오른손→왼손→어퍼컷)
 *
 * 상태:
 * - IDLE: 대기
 * - RUN: 달리기 (기본 상태)
 * - RIGHT_PUNCH: 오른손 펀치
 * - LEFT_PUNCH: 왼손 펀치
 * - UPPERCUT: 어퍼컷
 * - JUMP_PUNCH: 공중 점프 펀치
 * - DAMAGED: 데미지
 * - DEAD: 사망
 */
class Character {
  /**
   * @param {SpriteSheet} spriteSheet - 스프라이트 시트 객체
   * @param {number} x - 캐릭터 X 위치
   * @param {number} y - 캐릭터 Y 위치
   */
  constructor(spriteSheet, x, y) {
    this.spriteSheet = spriteSheet;
    this.x = x;
    this.y = y;
    this.scale = 3; // 캐릭터 크기 (1600x900 해상도에 맞춤)

    // 상태 정의
    this.states = {
      IDLE: 'IDLE',
      RUN: 'RUN',
      RIGHT_PUNCH: 'RIGHT_PUNCH',
      LEFT_PUNCH: 'LEFT_PUNCH',
      UPPERCUT: 'UPPERCUT',
      JUMP_PUNCH: 'JUMP_PUNCH',
      DAMAGED: 'DAMAGED',
      DEAD: 'DEAD'
    };

    this.currentState = this.states.RUN; // 기본 상태는 달리기
    this.previousState = this.states.RUN;

    // 애니메이션 매니저
    this.animationManager = null;

    // 애니메이션 설정 (Martial Hero 스프라이트 기준)
    // 각 애니메이션이 별도 파일로 제공되므로, 로드된 후에 설정
    this.animations = {};
    this.animationScales = {}; // 각 애니메이션별 개별 스케일

    // 콤보 시스템
    this.comboCount = 0; // 0: 오른손, 1: 왼손, 2: 어퍼컷

    // 선입력 버퍼 (입력 버퍼링)
    this.inputBuffer = null; // 'attack' 또는 'jump'
    this.bufferTime = 0; // 버퍼 입력 시간
    this.bufferDuration = 500; // 버퍼 유효 시간 (ms) - 더 길게

    // 점프 상태 관리
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.jumpSpeed = -15;
    this.gravity = 1;
    this.groundY = y;

    // 무적 시간 관리
    this.isInvincible = false; // 무적 상태 여부
    this.invincibleStartTime = 0; // 무적 시작 시간
    this.invincibleDuration = 2000; // 무적 지속 시간 (2초)
  }

  /**
   * 애니메이션 데이터 설정
   * @param {Object} animationData - 각 상태별 프레임 배열을 담은 객체
   */
  setupAnimations(animationData) {
    this.animations = animationData;

    // 각 애니메이션별 스케일 정보 로드 (개별 프레임 방식인 경우)
    if (SPRITE_CONFIG.loaderType === 'individual-frames' && SPRITE_CONFIG.animations) {
      for (let state in SPRITE_CONFIG.animations) {
        const animConfig = SPRITE_CONFIG.animations[state];
        this.animationScales[state] = animConfig.scale || 1.0;
      }

      // 매핑된 애니메이션에도 스케일 적용
      if (this.animationScales['ATTACK1']) {
        this.animationScales['RIGHT_PUNCH'] = this.animationScales['ATTACK1'];
      }
      if (this.animationScales['ATTACK2']) {
        this.animationScales['LEFT_PUNCH'] = this.animationScales['ATTACK2'];
        this.animationScales['UPPERCUT'] = this.animationScales['ATTACK2'];
      }
      if (this.animationScales['ATTACK1']) {
        // JUMP_PUNCH는 공격 스케일 사용
        this.animationScales['JUMP_PUNCH'] = this.animationScales['ATTACK1'];
      }
      if (this.animationScales['TAKE_HIT']) {
        this.animationScales['DAMAGED'] = this.animationScales['TAKE_HIT'];
      }
      if (this.animationScales['DEATH']) {
        this.animationScales['DEAD'] = this.animationScales['DEATH'];
      }

      console.log('✓ 애니메이션 스케일 매핑 완료:', this.animationScales);
    }

    // 기본 애니메이션으로 RUN 설정
    if (this.animations[this.states.RUN]) {
      this.animationManager = new AnimationManager(
        this.animations[this.states.RUN],
        12, // frameRate
        true // loop
      );
    }
  }

  /**
   * 입력 버퍼에 저장
   * @param {string} inputType - 'attack' 또는 'jump'
   */
  bufferInput(inputType) {
    this.inputBuffer = inputType;
    this.bufferTime = millis(); // Date.now() 대신 millis() 사용
    console.log(`🎯 선입력 저장: ${inputType}`);
  }

  /**
   * 버퍼 처리 - 애니메이션이 끝났을 때 호출
   * @returns {boolean} 버퍼가 처리되었으면 true
   */
  processBuffer() {
    // 버퍼가 없으면 무시
    if (!this.inputBuffer) return false;

    // 버퍼 유효 시간 체크 (millis() 사용)
    const elapsed = millis() - this.bufferTime;
    if (elapsed > this.bufferDuration) {
      this.inputBuffer = null;
      return false;
    }

    // 버퍼된 입력 처리
    const bufferedInput = this.inputBuffer;
    this.inputBuffer = null; // 버퍼 클리어

    if (bufferedInput === 'attack') {
      console.log('✅ 선입력 실행: 공격');
      return true; // 공격 버퍼 - 외부에서 처리
    } else if (bufferedInput === 'jump') {
      console.log('✅ 선입력 실행: 점프');
      return true; // 점프 버퍼 - 외부에서 처리
    }

    return false;
  }

  /**
   * 버퍼된 입력 타입 반환
   * @returns {string|null} 버퍼된 입력 타입
   */
  getBufferedInput() {
    if (!this.inputBuffer) return null;

    const elapsed = millis() - this.bufferTime; // millis() 사용
    if (elapsed > this.bufferDuration) {
      this.inputBuffer = null;
      return null;
    }

    return this.inputBuffer;
  }

  /**
   * 현재 공격 중인지 확인
   * @returns {boolean} 공격 중이면 true
   */
  isAttacking() {
    return this.currentState === this.states.RIGHT_PUNCH ||
           this.currentState === this.states.LEFT_PUNCH ||
           this.currentState === this.states.UPPERCUT ||
           this.currentState === this.states.JUMP_PUNCH;
  }

  /**
   * 현재 행동 불가능한 상태인지 확인
   * @returns {boolean} 행동 불가능하면 true
   */
  isDisabled() {
    return this.currentState === this.states.DEAD;
   // return this.currentState === this.states.DEAD ||
     //      this.currentState === this.states.DAMAGED ||
       //    this.isAttacking();
  }

  /**
   * 'a' 키 공격 처리 - 3단 콤보 시스템
   * @returns {boolean} 공격이 실행되었으면 true
   */
  handleAttack() {
    // DEAD 상태에서는 공격 불가
    if (this.currentState === this.states.DEAD) {
      console.log('⚠️ 사망 상태에서는 공격할 수 없습니다.');
      return false;
    }

    // 데미지 받는 중에도 공격 불가
    //if (this.currentState === this.states.DAMAGED) {
      //console.log('⚠️ 피격 중에는 공격할 수 없습니다.');
      //return false;
    //}

    // 애니메이션 완료 대기 없이 즉시 다음 공격 실행
    this.executeAttack();
    return true;
  }

  /**
   * 실제 공격 실행 (내부 메서드)
   */
  executeAttack() {
    switch (this.comboCount) {
      case 0:
        this.setState(this.states.RIGHT_PUNCH);
        this.comboCount = 1;
        console.log('✊ 오른손 펀치! 다음: 왼손 펀치');
        break;
      case 1:
        this.setState(this.states.LEFT_PUNCH);
        this.comboCount = 2;
        console.log('✊ 왼손 펀치! 다음: 어퍼컷');
        break;
      case 2:
        this.setState(this.states.UPPERCUT);
        this.comboCount = 0; // 콤보 리셋
        console.log('💥 어퍼컷! 콤보 완료 (리셋)');
        break;
    }
  }

  /**
   * 콤보 카운터 리셋
   */
  resetCombo() {
    this.comboCount = 0;
    console.log('콤보 리셋');
  }

  /**
   * 상태 변경
   * @param {string} newState - 새로운 상태
   */
  setState(newState) {
    // 이미 같은 상태면 무시 (DEAD 상태는 예외)
    if (this.currentState === newState && newState !== this.states.DEAD) {
      return;
    }

    // DEAD 상태에서는 다른 상태로 전환 불가
    if (this.currentState === this.states.DEAD && newState !== this.states.IDLE) {
      return;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    // 상태에 따른 애니메이션 설정
    this.updateAnimation();

    // 상태별 특수 동작
    switch (newState) {
      case this.states.JUMP_PUNCH:
        this.startJump();
        break;
      case this.states.IDLE:
        this.stopJump();
        break;
    }

    console.log(`상태 전환: ${this.previousState} → ${this.currentState}`);
  }

  /**
   * 현재 상태에 맞는 애니메이션으로 업데이트
   */
  updateAnimation() {
    if (!this.animations[this.currentState]) {
      console.warn(`상태 ${this.currentState}에 대한 애니메이션이 없습니다.`);
      return;
    }

    let loop = true;
    let frameRate = 10;

    // 상태별 애니메이션 설정
    switch (this.currentState) {
      case this.states.IDLE:
        loop = true;
        frameRate = 8;
        break;

      case this.states.RUN:
        loop = true;
        frameRate = 12;
        break;

      case this.states.RIGHT_PUNCH:
      case this.states.LEFT_PUNCH:
      case this.states.UPPERCUT:
        loop = false;
        frameRate = 50; // 공격 속도 매우 빠르게 (빠른 연타 대응)
        break;

      case this.states.JUMP_PUNCH:
        loop = false;
        frameRate = 35; // 점프 공격도 빠르게
        break;

      case this.states.DAMAGED:
        loop = false;
        frameRate = 59;
        break;

      case this.states.DEAD:
        loop = false;
        frameRate = 8;
        break;
    }

    this.animationManager.setFrames(this.animations[this.currentState], true);
    this.animationManager.setLoop(loop);
    this.animationManager.setFrameRate(frameRate);
  }

  /**
   * 점프 시작
   */
  startJump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpSpeed;
    }
  }

  /**
   * 점프 정지
   */
  stopJump() {
    this.isJumping = false;
    this.jumpY = 0;
    this.jumpVelocity = 0;
  }

  /**
   * 점프 물리 업데이트
   */
  updateJump() {
    if (this.isJumping) {
      this.jumpVelocity += this.gravity;
      this.jumpY += this.jumpVelocity;

      // 땅에 착지
      if (this.jumpY >= 0) {
        this.jumpY = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;

        // 점프 펀치 상태였다면 RUN으로 복귀
        if (this.currentState === this.states.JUMP_PUNCH) {
          this.setState(this.states.RUN);
        }
      }
    }
  }

  /**
   * 무적 시간 활성화
   */
  activateInvincibility() {
    this.isInvincible = true;
    this.invincibleStartTime = millis();
    console.log('⭐ 무적 시간 시작 (2초)');
  }

  /**
   * 무적 시간 업데이트
   */
  updateInvincibility() {
    if (this.isInvincible) {
      const elapsed = millis() - this.invincibleStartTime;
      if (elapsed >= this.invincibleDuration) {
        this.isInvincible = false;
        console.log('✓ 무적 시간 종료');
      }
    }
  }

  /**
   * 무적 상태 확인
   * @returns {boolean} 무적이면 true
   */
  isInvincibleNow() {
    return this.isInvincible;
  }

  /**
   * 캐릭터 업데이트 (매 프레임 호출)
   * @returns {Object|null} 처리된 버퍼 입력 정보 (sketch.js에서 처리)
   */
  update() {
    let processedBuffer = null;

    // 무적 시간 업데이트
    this.updateInvincibility();

    if (this.animationManager) {
      this.animationManager.update();

      // 애니메이션이 끝났을 때 처리 (RUN 상태로 복귀만)
      if (this.animationManager.isAnimationFinished()) {
        // DAMAGED 상태가 끝나면 무적 시간 활성화
        if (this.currentState === this.states.DAMAGED) {
          this.activateInvincibility();
          this.setState(this.states.RUN);
        } else if (this.currentState !== this.states.RUN &&
            this.currentState !== this.states.IDLE &&
            this.currentState !== this.states.DEAD) {
          // 공격 애니메이션 끝나면 RUN으로 복귀
          this.setState(this.states.RUN);
        }
      }
    }

    // 점프 물리 업데이트
    this.updateJump();

    // UI 업데이트 (상태 표시)
    this.updateUI();

    return processedBuffer;
  }

  /**
   * 캐릭터 렌더링
   */
  display() {
    if (this.animationManager) {
      // 무적 시간 중 깜빡임 효과
      if (this.isInvincible) {
        const blinkInterval = 100; // 100ms 간격으로 깜빡임
        const elapsed = millis() - this.invincibleStartTime;
        const blinkPhase = Math.floor(elapsed / blinkInterval) % 2;

        // 깜빡이는 프레임에서는 렌더링 생략
        if (blinkPhase === 1) {
          return;
        }
      }

      let renderY = this.y + this.jumpY;

      // 현재 상태에 맞는 개별 스케일 적용 (있으면)
      let currentScale = this.scale;
      if (this.animationScales[this.currentState]) {
        currentScale = this.scale * this.animationScales[this.currentState];
      }

      this.animationManager.display(this.x, renderY, currentScale);
    }
  }

  /**
   * UI 업데이트 (상태 및 프레임 정보 표시)
   */
  updateUI() {
    let stateElement = document.getElementById('current-state');
    let frameElement = document.getElementById('current-frame');
    let comboElement = document.getElementById('combo-count');

    if (stateElement) {
      stateElement.textContent = this.currentState;
    }

    if (frameElement && this.animationManager) {
      let current = this.animationManager.getCurrentFrameIndex();
      let total = this.animationManager.getTotalFrames();
      frameElement.textContent = `${current + 1} / ${total}`;
    }

    if (comboElement) {
      const comboNames = ['오른손 펀치', '왼손 펀치', '어퍼컷'];
      comboElement.textContent = `${comboNames[this.comboCount]} (${this.comboCount + 1}/3)`;
    }

    // 입력 상태 표시
    let inputStatusElement = document.getElementById('input-status');
    if (inputStatusElement) {
      if (this.isDisabled()) {
        inputStatusElement.textContent = '⚠️ 공격 불가 (애니메이션 진행 중)';
        inputStatusElement.style.color = '#f44336'; // 빨간색
      } else if (this.isAttacking()) {
        inputStatusElement.textContent = '⚔️ 공격 중...';
        inputStatusElement.style.color = '#ff9800'; // 주황색
      } else {
        inputStatusElement.textContent = '✓ 공격 가능';
        inputStatusElement.style.color = '#4caf50'; // 녹색
      }
    }
  }

  /**
   * 현재 상태 반환
   * @returns {string} 현재 상태
   */
  getState() {
    return this.currentState;
  }

  /**
   * 위치 설정
   * @param {number} x - X 위치
   * @param {number} y - Y 위치
   */
  setPosition(x, y) {
    this.x = x;
    this.groundY = y;
    this.y = y;
  }

  /**
   * 스케일 설정
   * @param {number} scale - 스케일 값
   */
  setScale(scale) {
    this.scale = scale;
  }
}
