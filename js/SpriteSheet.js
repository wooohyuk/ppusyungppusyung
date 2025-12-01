/**
 * SpriteSheet 클래스
 * 스프라이트 시트 이미지를 로드하고 개별 프레임으로 슬라이싱합니다.
 */
class SpriteSheet {
  /**
   * @param {p5.Image} image - 로드된 스프라이트 시트 이미지
   * @param {number} frameWidth - 각 프레임의 너비
   * @param {number} frameHeight - 각 프레임의 높이
   */
  constructor(image, frameWidth, frameHeight) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // 스프라이트 시트의 행과 열 계산
    this.cols = Math.floor(this.image.width / this.frameWidth);
    this.rows = Math.floor(this.image.height / this.frameHeight);

    this.frames = [];
    this.sliceFrames();
  }

  /**
   * 스프라이트 시트를 개별 프레임으로 슬라이싱
   */
  sliceFrames() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // 각 프레임을 별도의 이미지로 추출
        let x = col * this.frameWidth;
        let y = row * this.frameHeight;

        // p5.Image의 get() 메서드를 사용하여 프레임 추출
        let frame = this.image.get(x, y, this.frameWidth, this.frameHeight);
        this.frames.push(frame);
      }
    }

    console.log(`스프라이트 슬라이싱 완료: ${this.frames.length}개 프레임 (${this.cols}x${this.rows})`);
  }

  /**
   * 특정 인덱스의 프레임 가져오기
   * @param {number} index - 프레임 인덱스
   * @returns {p5.Image} 프레임 이미지
   */
  getFrame(index) {
    if (index >= 0 && index < this.frames.length) {
      return this.frames[index];
    }
    console.warn(`프레임 인덱스 ${index}가 범위를 벗어났습니다.`);
    return this.frames[0]; // 기본값으로 첫 번째 프레임 반환
  }

  /**
   * 특정 범위의 프레임들을 배열로 가져오기
   * @param {number} startIndex - 시작 인덱스
   * @param {number} endIndex - 종료 인덱스 (포함)
   * @returns {Array<p5.Image>} 프레임 배열
   */
  getFrameSequence(startIndex, endIndex) {
    let sequence = [];
    for (let i = startIndex; i <= endIndex && i < this.frames.length; i++) {
      sequence.push(this.frames[i]);
    }
    return sequence;
  }

  /**
   * 행 기준으로 프레임 가져오기
   * @param {number} row - 행 인덱스
   * @param {number} count - 가져올 프레임 개수
   * @returns {Array<p5.Image>} 프레임 배열
   */
  getFramesByRow(row, count) {
    let startIndex = row * this.cols;
    let endIndex = startIndex + count - 1;
    return this.getFrameSequence(startIndex, endIndex);
  }

  /**
   * 전체 프레임 개수 반환
   * @returns {number} 프레임 개수
   */
  getTotalFrames() {
    return this.frames.length;
  }
}
