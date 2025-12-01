/**
 * AnimationManager 클래스
 * 프레임 시퀀스를 받아서 애니메이션을 재생하고 렌더링합니다.
 */
class AnimationManager {
  /**
   * @param {Array<p5.Image>} frames - 애니메이션 프레임 배열
   * @param {number} frameRate - 초당 프레임 수 (기본값: 10)
   * @param {boolean} loop - 반복 재생 여부 (기본값: true)
   */
  constructor(frames, frameRate = 10, loop = true) {
    this.frames = frames;
    this.frameRate = frameRate;
    this.loop = loop;

    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.isPlaying = true;
    this.isFinished = false;

    // 프레임 간격 계산 (밀리초)
    this.frameInterval = 1000 / this.frameRate;
  }

  /**
   * 애니메이션 업데이트 (매 프레임마다 호출)
   */
  update() {
    if (!this.isPlaying || this.frames.length === 0) {
      return;
    }

    let currentTime = millis();

    // 프레임 간격이 지났는지 확인
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.currentFrame++;

      // 애니메이션 끝에 도달했을 때
      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0; // 루프
        } else {
          this.currentFrame = this.frames.length - 1; // 마지막 프레임 유지
          this.isPlaying = false;
          this.isFinished = true;
        }
      }

      this.lastFrameTime = currentTime;
    }
  }

  /**
   * 현재 프레임 렌더링
   * @param {number} x - 렌더링 위치 X
   * @param {number} y - 렌더링 위치 Y
   * @param {number} scale - 스케일 (기본값: 1)
   */
  display(x, y, scale = 1) {
    if (this.frames.length === 0) {
      return;
    }

    let frame = this.frames[this.currentFrame];

    push();
    translate(x, y);
    if (scale !== 1) {
      imageMode(CENTER);
      image(frame, 0, 0, frame.width * scale, frame.height * scale);
    } else {
      imageMode(CENTER);
      image(frame, 0, 0);
    }
    pop();
  }

  /**
   * 애니메이션 재생
   */
  play() {
    this.isPlaying = true;
    this.isFinished = false;
  }

  /**
   * 애니메이션 일시정지
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * 애니메이션 정지 및 리셋
   */
  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.isFinished = false;
  }

  /**
   * 애니메이션 리셋 (처음부터 재생)
   */
  reset() {
    this.currentFrame = 0;
    this.lastFrameTime = millis();
    this.isFinished = false;
    this.isPlaying = true;
  }

  /**
   * 새로운 프레임 시퀀스로 변경
   * @param {Array<p5.Image>} frames - 새로운 프레임 배열
   * @param {boolean} autoPlay - 자동 재생 여부
   */
  setFrames(frames, autoPlay = true) {
    this.frames = frames;
    this.currentFrame = 0;
    this.lastFrameTime = millis();
    this.isFinished = false;
    this.isPlaying = autoPlay;
  }

  /**
   * 프레임 속도 변경
   * @param {number} frameRate - 새로운 프레임 속도
   */
  setFrameRate(frameRate) {
    this.frameRate = frameRate;
    this.frameInterval = 1000 / this.frameRate;
  }

  /**
   * 루프 설정 변경
   * @param {boolean} loop - 루프 여부
   */
  setLoop(loop) {
    this.loop = loop;
  }

  /**
   * 애니메이션이 완료되었는지 확인
   * @returns {boolean} 완료 여부
   */
  isAnimationFinished() {
    return this.isFinished;
  }

  /**
   * 현재 프레임 인덱스 반환
   * @returns {number} 현재 프레임 인덱스
   */
  getCurrentFrameIndex() {
    return this.currentFrame;
  }

  /**
   * 전체 프레임 수 반환
   * @returns {number} 전체 프레임 수
   */
  getTotalFrames() {
    return this.frames.length;
  }
}
