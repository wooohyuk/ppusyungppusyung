/**
 * SpriteLoader.js
 * 전략 패턴을 사용하여 다양한 방식으로 스프라이트를 로드합니다.
 */

/**
 * 스프라이트 로더 베이스 클래스
 */
class SpriteLoader {
  /**
   * 스프라이트 프레임 배열을 로드합니다.
   * @param {Object} config - 로드 설정
   * @param {Function} onComplete - 완료 콜백 (frames 배열 전달)
   * @param {Function} onError - 에러 콜백
   */
  load(config, onComplete, onError) {
    throw new Error('load() 메서드는 하위 클래스에서 구현해야 합니다.');
  }
}

/**
 * 스프라이트 시트 로더 (기존 방식)
 * 하나의 큰 이미지에서 프레임을 잘라냅니다.
 */
class SpriteSheetLoader extends SpriteLoader {
  load(config, onComplete, onError) {
    const { path, frameWidth, frameHeight, frameCount } = config;

    loadImage(
      path,
      (img) => {
        const sheet = new SpriteSheet(img, frameWidth, frameHeight);
        const frames = sheet.getFrameSequence(0, frameCount - 1);
        console.log(`✓ 스프라이트 시트 로드 완료: ${path} (${frameCount} 프레임)`);
        if (onComplete) onComplete(frames);
      },
      (err) => {
        console.warn(`⚠ 스프라이트 시트 로드 실패: ${path}`, err);
        if (onError) onError(err);
      }
    );
  }
}

/**
 * 개별 프레임 로더
 * 여러 개의 개별 이미지 파일을 배열로 로드합니다.
 */
class IndividualFrameLoader extends SpriteLoader {
  load(config, onComplete, onError) {
    const { path, frameCount, filePattern } = config;

    const frames = [];
    let loadedCount = 0;
    let hasError = false;

    // 각 프레임 로드
    for (let i = 1; i <= frameCount; i++) {
      const framePath = `${path}${filePattern.replace('{n}', i)}`;

      loadImage(
        framePath,
        (img) => {
          frames[i - 1] = img; // 순서대로 저장
          loadedCount++;

          if (loadedCount === frameCount) {
            console.log(`✓ 개별 프레임 로드 완료: ${path} (${frameCount} 프레임)`);
            if (onComplete) onComplete(frames);
          }
        },
        (err) => {
          if (!hasError) {
            hasError = true;
            console.warn(`⚠ 프레임 로드 실패: ${framePath}`, err);
            if (onError) onError(err);
          }
        }
      );
    }
  }
}

/**
 * 로더 팩토리
 * 설정에 따라 적절한 로더를 반환합니다.
 */
class SpriteLoaderFactory {
  static createLoader(type) {
    switch (type) {
      case 'sprite-sheet':
        return new SpriteSheetLoader();
      case 'individual-frames':
        return new IndividualFrameLoader();
      default:
        throw new Error(`알 수 없는 로더 타입: ${type}`);
    }
  }
}
