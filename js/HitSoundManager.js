/**
 * HitSoundManager 클래스
 * 히트 효과음을 관리합니다.
 */
class HitSoundManager {
  constructor() {
    // 효과음 목록
    this.sounds = {
      hit: null,      // 기본 히트 사운드 (Kick_Basic.wav)
      hitTest: null   // 테스트 히트 사운드 (테스트.wav)
    };

    // 현재 사용 중인 효과음
    this.currentSound = 'hitTest'; // 'hit' 또는 'hitTest'

    // 볼륨 설정
    this.volume = 0.5; // 0.0 ~ 1.0
  }

  /**
   * 효과음 설정
   * @param {p5.SoundFile} hitSound - 기본 히트 사운드
   * @param {p5.SoundFile} hitTestSound - 테스트 히트 사운드
   */
  setSounds(hitSound, hitTestSound) {
    this.sounds.hit = hitSound;
    this.sounds.hitTest = hitTestSound;

    // 볼륨 설정
    if (this.sounds.hit) {
      this.sounds.hit.setVolume(this.volume);
    }
    if (this.sounds.hitTest) {
      this.sounds.hitTest.setVolume(this.volume);
    }

    console.log('✓ 히트 효과음 설정 완료');
  }

  /**
   * 현재 사용할 효과음 변경
   * @param {string} soundType - 'hit' 또는 'hitTest'
   */
  setCurrentSound(soundType) {
    if (soundType === 'hit' || soundType === 'hitTest') {
      this.currentSound = soundType;
      console.log(`🔊 히트 효과음 변경: ${soundType}`);
    }
  }

  /**
   * 히트 효과음 재생
   */
  play() {
    const sound = this.sounds[this.currentSound];
    if (sound && sound.isLoaded()) {
      // 이미 재생 중이면 처음부터 다시 재생
      if (sound.isPlaying()) {
        sound.stop();
      }
      sound.play();
    }
  }

  /**
   * 볼륨 설정
   * @param {number} volume - 0.0 ~ 1.0
   */
  setVolume(volume) {
    this.volume = constrain(volume, 0, 1);

    if (this.sounds.hit) {
      this.sounds.hit.setVolume(this.volume);
    }
    if (this.sounds.hitTest) {
      this.sounds.hitTest.setVolume(this.volume);
    }
  }

  /**
   * 현재 설정 정보 출력 (디버그용)
   */
  displayInfo() {
    push();
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    text(`히트 사운드: ${this.currentSound}`, 10, height - 30);
    text(`볼륨: ${Math.round(this.volume * 100)}%`, 10, height - 15);
    pop();
  }
}
