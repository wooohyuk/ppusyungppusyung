/**
 * InfoManager 클래스
 * 게임 정보 (로고, AI 사용 고지, p5.js 기능) 표시를 담당합니다.
 */
class InfoManager {
  constructor() {
    // 로고 이미지
    this.logo = null;

    // AI 사용 고지 정보
    this.aiCodePercent = 40;
    this.aiContentPercent = 100;

    // p5.js 주요 기능
    this.p5jsFeatures = [
      '스프라이트 애니메이션',
      '사운드 재생/동기화',
      '충돌 감지',
      '입력 처리'
    ];

    // 팝업 상태
    this.showPopup = false;
    this.justOpenedPopup = false; // 팝업 방금 열림 플래그

    // UI 설정
    this.baseWidth = 1600;
    this.baseHeight = 900;

    // 정보 버튼
    this.infoButton = null;
  }

  /**
   * 로고 이미지 설정
   * @param {p5.Image} logoImg - 로고 이미지
   */
  setLogo(logoImg) {
    this.logo = logoImg;
    console.log('✓ 로고 이미지 설정 완료');
  }

  /**
   * 정보 버튼 생성
   */
  createInfoButton() {
    if (this.infoButton) return;

    this.infoButton = createButton('<i class="fas fa-info-circle"></i>');
    this.infoButton.style('font-size', '24px');
    this.infoButton.style('width', '50px');
    this.infoButton.style('height', '50px');
    this.infoButton.style('border', '2px solid rgba(255, 255, 255, 0.3)');
    this.infoButton.style('border-radius', '50%');
    this.infoButton.style('background', 'rgba(100, 200, 255, 0.2)');
    this.infoButton.style('color', 'rgba(255, 255, 255, 0.8)');
    this.infoButton.style('cursor', 'pointer');
    this.infoButton.style('transition', 'all 0.3s ease');
    this.infoButton.style('display', 'flex');
    this.infoButton.style('align-items', 'center');
    this.infoButton.style('justify-content', 'center');
    this.infoButton.style('backdrop-filter', 'blur(5px)');
    this.infoButton.style('z-index', '1000');
    this.infoButton.style('position', 'fixed');

    this.infoButton.mousePressed(() => {
      this.showPopup = true;
      this.justOpenedPopup = true;
      console.log('정보 버튼 클릭됨!');

      // 100ms 후에 플래그 해제 (mousePressed 이벤트가 전파되기 전)
      setTimeout(() => {
        this.justOpenedPopup = false;
      }, 100);

      return false; // 이벤트 전파 방지
    });

    // 호버 효과
    this.infoButton.mouseOver(() => {
      this.infoButton.style('background', 'rgba(100, 200, 255, 0.4)');
      this.infoButton.style('transform', 'scale(1.1)');
      this.infoButton.style('border-color', 'rgba(255, 255, 255, 0.6)');
    });
    this.infoButton.mouseOut(() => {
      this.infoButton.style('background', 'rgba(100, 200, 255, 0.2)');
      this.infoButton.style('transform', 'scale(1)');
      this.infoButton.style('border-color', 'rgba(255, 255, 255, 0.3)');
    });
  }

  /**
   * 정보 버튼 위치 업데이트
   * @param {number} gameScale - 게임 스케일
   */
  updateInfoButtonPosition(gameScale) {
    if (!this.infoButton) return;

    // 오른쪽 하단 (baseWidth - 70, baseHeight - 70)
    const btnX = (windowWidth / 2) + ((this.baseWidth / 2) - 70) * gameScale;
    const btnY = (windowHeight / 2) + ((this.baseHeight / 2) - 70) * gameScale;
    this.infoButton.position(btnX - 25, btnY - 25);
  }

  /**
   * 정보 버튼 숨기기
   */
  hideInfoButton() {
    if (this.infoButton) {
      this.infoButton.hide();
    }
  }

  /**
   * 정보 버튼 보이기
   */
  showInfoButton() {
    if (this.infoButton) {
      this.infoButton.show();
    }
  }

  /**
   * 정보 팝업 표시
   */
  displayPopup() {
    if (!this.showPopup) return;

    push();

    // 팝업을 최상위에 그리기 위해 translate 리셋
    resetMatrix();

    // 불투명 배경 (전체 화면) - 뒤의 요소 완전히 가리기
    fill(0, 0, 0, 250);
    rectMode(CORNER);
    rect(0, 0, this.baseWidth, this.baseHeight);

    // 팝업 박스 (크기 증가 및 여백 확보)
    const boxWidth = 700;
    const boxHeight = 620;
    const centerX = this.baseWidth / 2;
    const centerY = this.baseHeight / 2;

    fill(30, 35, 50, 250);
    stroke(100, 200, 255);
    strokeWeight(3);
    rectMode(CENTER);
    rect(centerX, centerY, boxWidth, boxHeight, 20);

    noStroke();

    // 타이틀
    fill(100, 200, 255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('게임 정보', centerX, centerY - 260);

    // 로고 표시
    if (this.logo) {
      imageMode(CENTER);
      const logoScale = 0.3; // 로고 크기 조정
      image(this.logo, centerX, centerY - 180, this.logo.width * logoScale, this.logo.height * logoScale);
    }

    // 학과명 표시
    fill(200, 220, 255);
    textSize(20);
    textAlign(CENTER, CENTER);
    text('디지털미디어학과', centerX, centerY - 105);

    // 구분선
    stroke(100, 150, 200);
    strokeWeight(2);
    line(centerX - 300, centerY - 75, centerX + 300, centerY - 75);
    noStroke();

    // AI 사용 고지
    fill(255, 220, 100);
    textSize(24);
    textAlign(CENTER, CENTER);
    text('AI 활용', centerX, centerY - 35);

    fill(255);
    textSize(18);
    textAlign(LEFT, CENTER);
    text(`• 코드 개발:`, centerX - 250, centerY + 5);
    textAlign(RIGHT, CENTER);
    fill(100, 255, 100);
    text(`${this.aiCodePercent}%`, centerX + 250, centerY + 5);

    fill(255);
    textAlign(LEFT, CENTER);
    text(`• 콘텐츠 제작:`, centerX - 250, centerY + 45);
    textAlign(RIGHT, CENTER);
    fill(100, 255, 100);
    text(`${this.aiContentPercent}%`, centerX + 250, centerY + 45);

    // 구분선
    stroke(100, 150, 200);
    strokeWeight(2);
    line(centerX - 300, centerY + 85, centerX + 300, centerY + 85);
    noStroke();

    // p5.js 주요 기능
    fill(255, 220, 100);
    textSize(24);
    textAlign(CENTER, CENTER);
    text('p5.js 주요 기능', centerX, centerY + 125);

    fill(200);
    textSize(16);
    textAlign(LEFT, CENTER);
    let featureY = centerY + 165;
    for (let feature of this.p5jsFeatures) {
      text(`• ${feature}`, centerX - 250, featureY);
      featureY += 32;
    }

    // 닫기 안내
    fill(150);
    textSize(14);
    textAlign(CENTER, CENTER);
    text('ESC 또는 화면 클릭으로 닫기', centerX, centerY + 280);

    pop();
  }

  /**
   * 로고를 작게 표시 (게임 종료 화면용)
   * @param {number} x - X 위치
   * @param {number} y - Y 위치
   * @param {number} scale - 스케일
   */
  displaySmallLogo(x, y, scale = 0.15) {
    if (!this.logo) return;

    push();
    imageMode(CENTER);
    tint(255, 180); // 약간 투명하게
    image(this.logo, x, y, this.logo.width * scale, this.logo.height * scale);
    noTint();
    pop();
  }

  /**
   * 팝업 닫기
   */
  closePopup() {
    this.showPopup = false;
  }

  /**
   * 팝업 열림 여부 확인
   * @returns {boolean}
   */
  isPopupOpen() {
    return this.showPopup;
  }
}
