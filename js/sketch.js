/**
 * sketch.js - p5.js 메인 스크립트
 * 게임 초기화, 스프라이트 로드, 캐릭터 관리, 키 입력 처리
 *
 * 스프라이트 변경: js/spriteConfig.js 파일에서 CURRENT_SPRITE 값만 변경하면 됩니다!
 */

// 전역 변수
let character;
let spriteSheets = {};
let animations = {};
let assetsLoaded = false;

// 벽 시스템
let wallManager;
let wallSprites = []; // 벽 스프라이트 배열

// 배경 시스템
let backgroundImg;

// UI 아이콘
let heartIcon;

// 시각 효과 (속도 증가)
let speedEffectAlpha = 0; // 속도 변화 시 화면 플래시 효과
let lastSpeedMultiplier = 1.0; // 이전 속도 배율
let judgmentImages = {}; // 판정 이미지 (wow, great, good, miss)
let hitEffectFrames = []; // 히트 이펙트 프레임 배열
let hpBarImages = {}; // HP 바 이미지
let scoreBackboard; // 스코어 백보드 이미지
let bgX1 = 0; // 첫 번째 배경 X 위치
let bgX2; // 두 번째 배경 X 위치 (setup에서 설정)
let baseBgSpeed = 3; // 기본 배경 스크롤 속도
let bgSpeed = 6; // 현재 배경 스크롤 속도 (속도 배율 적용) // 속도 기존 3에서 6으로 2배 증가

// 음악 시스템
let musicManager;
let musicLoaded = []; // 각 곡별 로드 상태
let gameStarted = false; // 게임 시작 여부

// 효과음 시스템
let hitSound; // 히트 효과음 (Kick_Basic.wav)
let hitTestSound; // 테스트 히트 효과음
let hitSoundManager; // 히트 효과음 매니저

// 가사 시스템
let lyricsManager;

// 게임 상태
let gameState = 'playing'; // 'playing', 'paused', 'gameover'
let lastDamageTime = 0;
const DAMAGE_COOLDOWN = 1000; // 데미지 쿨다운 (ms)

// 일시정지 메뉴
let pauseMenuSelection = 0; // 0: 재개, 1: 다시 시작

// 점수 시스템
let scoreManager;

// 랭킹 시스템
let rankingManager;
let nicknameInput = ''; // 닉네임 입력
let nicknameInputElement = null; // HTML input 요소
let isEnteringNickname = false; // 닉네임 입력 중
let rankingSaved = false; // 랭킹 저장 완료 여부
let savedRank = -1; // 저장된 등수

// 정보 시스템
let infoManager;
let logoImg;

// 미리듣기 및 곡 선택 버튼
let isPreviewPlaying = false;
let previewButton = null;
let leftArrowButton = null;
let rightArrowButton = null;

// 공격 판정 플래그 (한 공격당 한 번만 벽 파괴)
let canDestroyWall = false;
let attackHitWall = false; // 현재 공격이 벽을 맞췄는지 추적
let wasAttackingLastFrame = false; // 이전 프레임에서 공격 중이었는지
let lastAttackState = null; // 마지막 공격 상태 (공격 전환 감지용)

// 게임 설정 (기준 해상도 - 고정)
const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

// 실제 캔버스 크기와 스케일
let GAME_WIDTH = 1600;
let GAME_HEIGHT = 900;
let gameScale = 1;

/**
 * p5.js preload - 리소스 로드
 */
function preload() {
  // 현재 스프라이트 정보 출력
  printCurrentSpriteInfo();

  // 사운드 포맷 설정
  soundFormats('mp3', 'ogg', 'wav');

  // 스프라이트 로드 시도
  try {
    const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';

    if (loaderType === 'sprite-sheet') {
      // 스프라이트 시트 방식 (기존)
      for (let [key, filename] of Object.entries(SPRITE_CONFIG.files)) {
        let path = SPRITE_CONFIG.path + filename;
        loadImage(
          path,
          (img) => {
            spriteSheets[key] = img;
            console.log(`✓ ${filename} 로드 완료`);
          },
          (err) => {
            console.warn(`⚠ ${filename} 로드 실패:`, err);
          }
        );
      }
    } else if (loaderType === 'individual-frames') {
      // 개별 프레임 방식
      for (let [key, animConfig] of Object.entries(SPRITE_CONFIG.animations)) {
        if (!animations[key]) {
          animations[key] = [];
        }

        for (let i = 1; i <= animConfig.frameCount; i++) {
          const framePath = SPRITE_CONFIG.path + animConfig.path + animConfig.filePattern.replace('{n}', i);
          loadImage(
            framePath,
            (img) => {
              animations[key][i - 1] = img;
              if (i === animConfig.frameCount) {
                console.log(`✓ ${key} 프레임 로드 완료 (${animConfig.frameCount}개)`);
              }
            },
            (err) => {
              console.warn(`⚠ ${framePath} 로드 실패:`, err);
            }
          );
        }
      }
    }

    // 벽 스프라이트 로드 (3개)
    for (let i = 1; i <= 3; i++) {
      let path = `assets/sprites/obstacles/wall${i}.png`;
      loadImage(
        path,
        (img) => {
          wallSprites[i - 1] = img;
          console.log(`✓ wall${i}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ wall${i}.png 로드 실패:`, err);
        }
      );
    }

    // 배경 이미지 로드
    const bgPath = loaderType === 'individual-frames' ? 'assets/background/BSBS_BG.png' : 'assets/background/city.png';
    loadImage(
      bgPath,
      (img) => {
        backgroundImg = img;
        console.log('✓ 배경 이미지 로드 완료');
      },
      (err) => {
        console.warn('⚠ 배경 이미지 로드 실패:', err);
      }
    );

    // 하트 아이콘 로드
    loadImage(
      'assets/ui/heart.png',
      (img) => {
        heartIcon = img;
        console.log('✓ 하트 아이콘 로드 완료');
      },
      (err) => {
        console.warn('⚠ 하트 아이콘 로드 실패:', err);
      }
    );

    // 판정 이미지 로드
    const judgmentTypes = ['wow', 'great', 'good', 'miss'];
    judgmentTypes.forEach(type => {
      loadImage(
        `assets/ui/${type}.png`,
        (img) => {
          judgmentImages[type] = img;
          console.log(`✓ ${type}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ ${type}.png 로드 실패:`, err);
        }
      );
    });

    // 히트 이펙트 프레임 로드 (4개)
    for (let i = 0; i < 4; i++) {
      loadImage(
        `assets/vfx/hit_${i}.png`,
        (img) => {
          hitEffectFrames[i] = img;
          console.log(`✓ hit_${i}.png 로드 완료`);
        },
        (err) => {
          console.warn(`⚠ hit_${i}.png 로드 실패:`, err);
        }
      );
    }

    // HP 바 이미지 로드
    loadImage('assets/ui/hp_full.png', (img) => { hpBarImages.full = img; console.log('✓ hp_full.png 로드 완료'); });
    loadImage('assets/ui/hp_6.png', (img) => { hpBarImages.hp6 = img; });
    loadImage('assets/ui/hp_5.png', (img) => { hpBarImages.hp5 = img; });
    loadImage('assets/ui/hp_4.png', (img) => { hpBarImages.hp4 = img; });
    loadImage('assets/ui/hp_3.png', (img) => { hpBarImages.hp3 = img; });
    loadImage('assets/ui/hp_2.png', (img) => { hpBarImages.hp2 = img; });
    loadImage('assets/ui/hp_1.png', (img) => { hpBarImages.hp1 = img; });
    loadImage('assets/ui/hp_empty.png', (img) => { hpBarImages.empty = img; console.log('✓ HP 바 이미지 로드 완료'); });

    // 스코어 백보드 이미지 로드
    loadImage('assets/ui/score_backboard.png',
      (img) => { scoreBackboard = img; console.log('✓ 스코어 백보드 로드 완료'); },
      (err) => { console.warn('⚠ 스코어 백보드 로드 실패:', err); }
    );

    // 로고 이미지 로드
    loadImage('assets/ui/logo.png',
      (img) => { logoImg = img; console.log('✓ 로고 이미지 로드 완료'); },
      (err) => { console.warn('⚠ 로고 이미지 로드 실패:', err); }
    );

    // 히트 효과음 로드
    hitSound = loadSound('assets/sounds/hit.wav',
      () => { console.log('✓ 히트 효과음 (Kick_Basic) 로드 완료'); },
      (err) => { console.warn('⚠ 히트 효과음 로드 실패:', err); }
    );
    hitTestSound = loadSound('assets/sounds/hit_test.wav',
      () => { console.log('✓ 테스트 히트 효과음 로드 완료'); },
      (err) => { console.warn('⚠ 테스트 히트 효과음 로드 실패:', err); }
    );
  } catch (error) {
    console.error('스프라이트 로드 중 오류:', error);
  }
}

/**
 * p5.js setup - 초기 설정
 */
function setup() {
  // 창 크기에 맞게 캔버스 생성 (비율 유지)
  calculateGameSize();
  let canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
  canvas.parent('canvas-container');

  // 스페이스바 스크롤 방지
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
    }
  });

  // 스프라이트가 로드되었는지 확인
  checkAssetsLoaded();

  if (assetsLoaded) {
    // 애니메이션 프레임 추출
    extractAnimationFrames();

    // 캐릭터 생성 (화면 왼쪽에 배치 - 벽이 오른쪽에서 오므로)
    // 땅 위치에 캐릭터의 발을 맞춤
    const groundOffset = SPRITE_CONFIG.groundOffset || 200;
    const groundY = GAME_HEIGHT - groundOffset;
    const characterHeight = SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.characterScale;
    const characterY = groundY - (characterHeight / 2);

    character = new Character(null, GAME_WIDTH / 5, characterY); // 기존 GAME_WIDTH / 4 -> GAME_WIDTH / 5 변경
    character.setScale(SPRITE_CONFIG.characterScale);
    character.setupAnimations(animations);
    character.setState(character.states.IDLE); // 시작 시 IDLE 상태

    // 벽 매니저 초기화
    wallManager = new WallManager(GAME_WIDTH, GAME_HEIGHT);
    wallManager.setSpawnInterval(2500); // 2.5초 간격으로 벽 생성
    wallManager.setWallSpeed(6); // 벽 이동 속도
    wallManager.setWallSprites(wallSprites); // 벽 스프라이트 설정
    wallManager.setJudgmentImages(judgmentImages); // 판정 이미지 설정
    wallManager.setHitEffectFrames(hitEffectFrames); // 히트 이펙트 설정

    // 음악 매니저 초기화
    initMusicManager();

    // 히트 효과음 매니저 초기화
    hitSoundManager = new HitSoundManager();
    hitSoundManager.setSounds(hitSound, hitTestSound);

    // 점수 매니저 초기화
    scoreManager = new ScoreManager();
    scoreManager.setHpBarImages(hpBarImages); // HP 바 이미지 설정
    scoreManager.setScoreBackboard(scoreBackboard); // 스코어 백보드 설정

    // 랭킹 매니저 초기화
    rankingManager = new RankingManager();

    // 가사 매니저 초기화
    lyricsManager = new LyricsManager();

    // 정보 매니저 초기화
    infoManager = new InfoManager();
    if (logoImg) {
      infoManager.setLogo(logoImg);
    }

    console.log('✓ 캐릭터 초기화 완료');
    console.log('✓ 벽 시스템 초기화 완료');
    console.log('✓ 점수 시스템 초기화 완료');
    console.log('✓ 랭킹 시스템 초기화 완료');
    console.log('✓ 가사 시스템 초기화 완료');
    console.log('✓ 정보 시스템 초기화 완료');
  } else {
    // 스프라이트 없이도 실행 가능하도록 경고만 표시
    showSpriteWarning();
    console.warn('⚠ 스프라이트를 찾을 수 없습니다. README의 다운로드 가이드를 참고하세요.');
  }

  // 텍스트 설정
  textAlign(CENTER, CENTER);
  textSize(32);

  // 배경 두 번째 이미지 시작 위치 설정
  bgX2 = BASE_WIDTH;
}

/**
 * p5.js draw - 메인 게임 루프
 */
function draw() {
  // 스케일 적용
  push();
  scale(gameScale);

  // 스크롤링 배경 (BASE 크기 기준)
  drawScrollingBackground();

  // 지평선 (배경 위에 반투명하게)
  stroke(100, 150, 200, 100);
  strokeWeight(2);
  line(0, BASE_HEIGHT - 200, BASE_WIDTH, BASE_HEIGHT - 200);

  if (assetsLoaded && character) {
    // 일시정지 상태가 아닐 때만 업데이트
    if (gameState !== 'paused') {
      // 음악 매니저 업데이트 및 게임 종료 체크
      if (musicManager && gameStarted && !scoreManager.isGameEnded()) {
        musicManager.update();

        // 음악이 끝났으면 게임 클리어
        if (!musicManager.isPlaying && musicManager.getCurrentTime() > 1000) {
          scoreManager.clearGame();
        }
      }
    }

    // 벽 시스템 업데이트 및 렌더링
    if (wallManager && gameStarted && !scoreManager.isGameEnded()) {
      // 일시정지가 아닐 때만 업데이트
      if (gameState !== 'paused') {
        wallManager.update();

        // 구간별 속도 업데이트
        if (musicManager) {
          const currentTime = musicManager.getCurrentTime();
          const config = getSelectedMusicConfig();

          if (config.sections) {
            const currentSection = config.sections.find(s => currentTime >= s.start && currentTime < s.end);
            if (currentSection) {
              const targetMultiplier = currentSection.speedMultiplier || 1.0;
              // 현재 배율과 다르면 업데이트
              if (Math.abs(wallManager.getSpeedMultiplier() - targetMultiplier) > 0.01) {
                wallManager.setSpeedMultiplierForSection(targetMultiplier);

                // 배경 스크롤 속도도 업데이트
                bgSpeed = baseBgSpeed * targetMultiplier;

                // 속도 변화 시각 효과 트리거 (속도 증가 시에만)
                if (targetMultiplier > lastSpeedMultiplier) {
                  speedEffectAlpha = 150; // 플래시 효과 강도
                }
                lastSpeedMultiplier = targetMultiplier;
              }
            }
          }
        }
      }
      wallManager.display();

      // 공격 중일 때 벽 파괴 체크 (공격 애니메이션 동안 계속 체크)
      const isCurrentlyAttacking = character.isAttacking();
      const currentState = character.currentState;

      if (isCurrentlyAttacking && canDestroyWall) {
        const result = wallManager.tryDestroyWall(character.x);
        if (result && result.destroyed) {
          canDestroyWall = false; // 한 공격당 한 번만 파괴
          attackHitWall = true; // 벽 맞춤 표시
          scoreManager.addScore(result.type); // 판정에 따른 점수 추가

          // 히트 효과음 재생
          if (hitSoundManager) {
            hitSoundManager.play();
          }
        }
      }

      // 공격 시작 감지 (비공격 -> 공격)
      const attackStarted = !wasAttackingLastFrame && isCurrentlyAttacking;

      // 공격 상태 전환 감지 (공격 -> 다른 공격)
      const attackStateChanged = isCurrentlyAttacking && lastAttackState !== null && lastAttackState !== currentState;

      // 공격 종료 감지 (공격 -> 비공격)
      const attackEnded = wasAttackingLastFrame && !isCurrentlyAttacking;

      // 새 공격 시작 시 플래그 초기화
      if (attackStarted) {
        console.log('⚔️ 공격 시작!', currentState);
        canDestroyWall = true;
        attackHitWall = false;
      }

      // 공격 전환 또는 종료 시 이전 공격 결과 체크
      if (attackStateChanged || attackEnded) {
        console.log('🔚 공격 전환/종료! attackHitWall:', attackHitWall, '이전:', lastAttackState, '현재:', currentState);
        // 이전 공격에서 벽을 못 맞췄으면 콤보 끊김
        if (!attackHitWall) {
          scoreManager.breakCombo();
          console.log('🚫 미스! 콤보 끊김');
        } else {
          console.log('✅ 히트! 콤보 유지');
        }

        // 새 공격으로 전환 시 플래그 리셋
        if (attackStateChanged) {
          canDestroyWall = true;
          attackHitWall = false;
        } else {
          // 공격 종료 시 모든 플래그 초기화
          canDestroyWall = false;
          attackHitWall = false;
          lastAttackState = null;
        }
      }

      // 현재 상태 저장
      wasAttackingLastFrame = isCurrentlyAttacking;
      if (isCurrentlyAttacking) {
        lastAttackState = currentState;
      }

      // 충돌 판정 (캐릭터가 공격 중이 아니고, 벽이 캐릭터와 충돌하면 데미지)
      if (gameState === 'playing') {
        checkWallCollision();
      }

      // 히트 이펙트 표시
      wallManager.updateAndDisplayHitEffects();

      // 판정 표시
      wallManager.displayJudgment();

      // 디버그 정보 표시
      wallManager.displayDebug(character.x);
    }

    // 게임 시작 전이나 게임 종료 후에는 IDLE 상태로 전환
    const isGameInactive = !gameStarted || (scoreManager && scoreManager.isGameEnded());
    if (isGameInactive && character.currentState !== character.states.IDLE) {
      character.setState(character.states.IDLE);
    }

    // 캐릭터 업데이트 및 렌더링 (일시정지가 아닐 때만 업데이트)
    if (gameState !== 'paused') {
      character.update();
    }
    character.display();

    // 점수 및 체력 표시 (게임 중)
    if (gameStarted && scoreManager) {
      scoreManager.displayHealth(heartIcon);
      scoreManager.displayScore();
      scoreManager.displayCombo();

      // 진행 바 표시 (캐릭터 RUN 애니메이션과 함께)
      if (musicManager && musicManager.sound) {
        const currentTime = musicManager.getCurrentTime();
        const totalTime = musicManager.sound.duration() * 1000; // ms로 변환
        scoreManager.displayProgress(currentTime, totalTime, animations.RUN);

        // 가사 표시 (일시정지가 아닐 때)
        if (lyricsManager && lyricsManager.isLoaded && gameState !== 'paused') {
          lyricsManager.display(currentTime, BASE_WIDTH, BASE_HEIGHT);
        }
      }
    }

    // 게임 시작 전 안내 메시지
    if (!gameStarted) {
      drawStartScreen();
    }

    // 정보 팝업 표시
    if (infoManager && infoManager.isPopupOpen()) {
      // 팝업 열릴 때 다른 버튼들 숨기기
      if (previewButton) previewButton.hide();
      if (leftArrowButton) leftArrowButton.hide();
      if (rightArrowButton) rightArrowButton.hide();

      infoManager.displayPopup();
    } else {
      // 팝업 닫혔을 때 버튼들 다시 보이기 (게임 시작 전일 때만)
      if (!gameStarted) {
        if (previewButton) previewButton.show();
        if (leftArrowButton) leftArrowButton.show();
        if (rightArrowButton) rightArrowButton.show();
      }
    }

    // 게임 종료 화면
    if (scoreManager && scoreManager.isGameEnded()) {
      const config = getSelectedMusicConfig();

      // 클리어 시 랭킹 정보 전달
      let rankingInfo = null;
      if (scoreManager.isCleared && rankingManager) {
        // 클리어 직후 닉네임 입력 모드 활성화
        if (!rankingSaved && !isEnteringNickname) {
          isEnteringNickname = true;
        }

        rankingInfo = {
          isEntering: isEnteringNickname,
          nickname: nicknameInput,
          saved: rankingSaved,
          rank: savedRank,
          rankings: rankingManager.getRankings(config.name)
        };
      }

      scoreManager.displayGameOver(config.name, config.bpm, rankingInfo, infoManager);

      // 정보 버튼 표시 (게임 종료 화면)
      if (infoManager) {
        if (!infoManager.infoButton) {
          infoManager.createInfoButton();
        }
        infoManager.showInfoButton();
        infoManager.updateInfoButtonPosition(gameScale);
      }

      // 카운트다운 완료 시 자동 리셋 (닉네임 입력 중이 아닐 때만)
      if (scoreManager.isCountdownFinished() && !isEnteringNickname) {
        resetGame();
      }
    }

    // 일시정지 화면
    if (gameState === 'paused') {
      drawPauseMenu();
    }

    // 속도 증가 시각 효과 (화면 플래시)
    if (speedEffectAlpha > 0) {
      push();
      noStroke();
      // 노란색 플래시로 변경 (속도 증가 = 긍정적 효과)
      fill(255, 220, 100, speedEffectAlpha);
      rectMode(CORNER);
      rect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      pop();

      // 서서히 사라짐
      speedEffectAlpha -= 5;
      if (speedEffectAlpha < 0) speedEffectAlpha = 0;
    }

    // 현재 속도 배율 표시 (게임 중) - 스코어 창 아래
    if (gameStarted && wallManager && !scoreManager.isGameEnded()) {
      const currentMultiplier = wallManager.getSpeedMultiplier();
      if (currentMultiplier > 1.0) {
        push();
        fill(255, 220, 100, 200); // 노란색
        textAlign(RIGHT, TOP);
        textSize(20);
        // 스코어 백보드 아래 (Y: 15 + 100 + 10 = 125)
        text(`SPEED: ${currentMultiplier.toFixed(1)}x`, BASE_WIDTH - 30, 125);
        pop();
      }
    }
  } else {
    // 스프라이트 없을 때 안내 메시지
    noStroke();
    fill(100);
    text('스프라이트를 로드해주세요', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    textSize(16);
    text('README.md의 다운로드 가이드를 참고하세요', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    textSize(32);
  }

  // 게임 정보 표시
  displayGameInfo();

  pop(); // 스케일 복원
}

/**
 * 게임 크기 계산 (비율 유지하면서 창에 맞춤)
 */
function calculateGameSize() {
  const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
  const windowRatio = windowWidth / windowHeight;

  if (windowRatio > aspectRatio) {
    // 창이 더 넓음 - 높이에 맞춤
    GAME_HEIGHT = windowHeight;
    GAME_WIDTH = windowHeight * aspectRatio;
  } else {
    // 창이 더 좁음 - 너비에 맞춤
    GAME_WIDTH = windowWidth;
    GAME_HEIGHT = windowWidth / aspectRatio;
  }

  gameScale = GAME_WIDTH / BASE_WIDTH;
}

/**
 * 창 크기 변경 시 캔버스 크기 조절
 */
function windowResized() {
  calculateGameSize();
  resizeCanvas(GAME_WIDTH, GAME_HEIGHT);

  // 미리듣기 버튼 및 화살표 버튼 위치 업데이트
  if (!gameStarted) {
    if (previewButton) updatePreviewButtonPosition();
    if (leftArrowButton && rightArrowButton) updateArrowButtonsPosition();
    if (infoManager && infoManager.infoButton) {
      infoManager.updateInfoButtonPosition(gameScale);
    }
  }
}

/**
 * 키 입력 처리
 */
function keyPressed() {
  // 정보 팝업이 열려있으면 ESC로 닫기
  if (infoManager && infoManager.isPopupOpen()) {
    if (keyCode === ESCAPE) {
      infoManager.closePopup();
      return;
    }
  }

  // 닉네임 입력 중일 때
  if (isEnteringNickname) {
    handleNicknameInput(key, keyCode);
    return;
  }

  // ESC 키 처리
  if (keyCode === ESCAPE) {
    // 게임 종료 상태면 리셋
    if (scoreManager && scoreManager.isGameEnded()) {
      resetGame();
      return;
    }
    // 게임 중이면 일시정지 토글
    if (gameStarted) {
      togglePause();
    }
    return;
  }

  // 일시정지 상태일 때는 메뉴 입력만 처리
  if (gameState === 'paused') {
    handlePauseMenuInput(key, keyCode);
    return;
  }

  // 스페이스바 기본 동작(스크롤) 방지
  if (key === ' ' || keyCode === 32) {
    if (!character) return false;

    if (!gameStarted) {
      // 게임 시작
      if (musicManager && musicManager.isLoaded) {
        startGame();
      }
    } else {
      // 게임 중에는 점프
      if (!character.isDisabled()) {
        character.setState(character.states.JUMP_PUNCH);
      } else if (character.isAttacking()) {
        // 공격 중이면 점프 선입력
        character.bufferInput('jump');
      }
    }
    return false; // 브라우저 기본 동작 방지
  }

  if (!character) return;

  // 게임 시작 전: 화살표 키로 곡 선택
  if (!gameStarted) {
    if (keyCode === LEFT_ARROW) {
      // 미리듣기 정지
      if (isPreviewPlaying && musicManager && musicManager.sound) {
        musicManager.sound.stop();
        isPreviewPlaying = false;
      }
      selectPrevMusic();
      initMusicManager(); // 선택된 곡으로 재초기화
      return;
    }
    if (keyCode === RIGHT_ARROW) {
      // 미리듣기 정지
      if (isPreviewPlaying && musicManager && musicManager.sound) {
        musicManager.sound.stop();
        isPreviewPlaying = false;
      }
      selectNextMusic();
      initMusicManager(); // 선택된 곡으로 재초기화
      return;
    }
    return; // 다른 키는 무시
  }

  // 'a' 키로 콤보 공격 (keyCode 65 = A키, 한/영 상관없이 인식)
  if (keyCode === 65) {
    character.handleAttack();
    return;
  }

  // 'r' 키로 콤보 리셋 (keyCode 82 = R키)
  if (keyCode === 82) {
    character.resetCombo();
    return;
  }

  // 'd' 키로 디버그 모드 토글 (keyCode 68 = D키)
  if (keyCode === 68) {
    if (wallManager) {
      wallManager.toggleDebug();
    }
    return;
  }

  // 숫자 키로 상태 전환 (테스트용)
  switch (key) {
    case '1':
      character.setState(character.states.IDLE);
      break;
    case '2':
      character.setState(character.states.RUN);
      break;
    case '3':
      character.setState(character.states.RIGHT_PUNCH);
      canDestroyWall = true; // 공격 시 벽 파괴 가능
      break;
    case '4':
      character.setState(character.states.LEFT_PUNCH);
      canDestroyWall = true; // 공격 시 벽 파괴 가능
      break;
    case '5':
      character.setState(character.states.UPPERCUT);
      canDestroyWall = true; // 공격 시 벽 파괴 가능
      break;
    case '6':
      character.setState(character.states.JUMP_PUNCH);
      canDestroyWall = true; // 공격 시 벽 파괴 가능
      break;
    case '7':
      character.setState(character.states.DAMAGED);
      break;
    case '8':
      character.setState(character.states.DEAD);
      break;
  }
}

/**
 * 마우스 클릭 처리
 */
function mousePressed() {
  // 팝업 방금 열렸으면 무시 (버튼 클릭 직후)
  if (infoManager && infoManager.justOpenedPopup) {
    return false;
  }

  // 정보 팝업이 열려있으면 클릭으로 닫기
  if (infoManager && infoManager.isPopupOpen()) {
    infoManager.closePopup();
    console.log('팝업 닫힘');
    return false;
  }
}

/**
 * 벽 충돌 판정
 * 벽이 캐릭터와 충돌하면 데미지
 */
function checkWallCollision() {
  if (!wallManager || !character || !scoreManager) return;

  // 이미 데미지 상태이거나 죽은 상태면 무시
  if (character.currentState === character.states.DAMAGED ||
      character.currentState === character.states.DEAD) {
    return;
  }

  // 무적 시간 중이면 충돌 무시
  if (character.isInvincibleNow()) {
    return;
  }

  // 공격 중일 때는 충돌 무시 (공격으로 벽을 부수는 중)
  if (character.isAttacking()) {
    return;
  }

  // 데미지 쿨다운 체크
  if (millis() - lastDamageTime < DAMAGE_COOLDOWN) {
    return;
  }

  // 충돌 확인
  if (wallManager.checkCollision(character.x)) {
    // 체력 감소
    const isDead = scoreManager.takeDamage();
    lastDamageTime = millis();

    // 콤보 끊김
    scoreManager.breakCombo();

    // 충돌한 벽 제거
    wallManager.removeCollidingWall(character.x);

    if (isDead) {
      // 사망 처리
      character.setState(character.states.DEAD);
      // 사망 애니메이션 후 게임 오버 화면 표시
      setTimeout(() => {
        scoreManager.gameOver();
      }, 1000); // 1초 후 게임 오버
    } else {
      // 데미지 상태
      character.setState(character.states.DAMAGED);
    }
  }
}

/**
 * 음악 매니저 초기화 (선택된 곡으로)
 */
function initMusicManager() {
  const config = getSelectedMusicConfig();

  // 기존 음악 정지
  if (musicManager && musicManager.isPlaying) {
    musicManager.stop();
  }

  musicManager = new MusicManager(config);
  musicManager.loadMusic(() => {
    // 음악 로드 완료 후 리듬 모드 설정
    const beatInterval = getCurrentBeatInterval();
    wallManager.setRhythmMode(true, beatInterval);

    // 비트 콜백 설정 - 비트마다 벽 생성
    musicManager.onBeat((beatInfo) => {
      wallManager.spawnOnBeat(beatInfo);
    });

    console.log(`✓ "${config.name}" 로드 완료 (BPM: ${config.bpm})`);
  });

  // 가사 로드 (LRC 파일이 있는 경우)
  if (lyricsManager && config.lrc) {
    lyricsManager.loadLRC(config.lrc);
  } else if (lyricsManager) {
    lyricsManager.reset();
    lyricsManager.isLoaded = false;
  }

  // 음악 로드 타임아웃 (3초 후에도 로드 안되면 음악 없이 진행 가능)
  setTimeout(() => {
    if (!musicManager.isLoaded) {
      console.log('⚠ 음악 파일 없음 - 음악 없이 게임 가능');
      musicManager.isLoaded = true;
      wallManager.setRhythmMode(false);
    }
  }, 3000);
}

/**
 * 게임 시작
 */
function startGame() {
  if (!musicManager || !musicManager.isLoaded) {
    console.warn('음악이 로드되지 않았습니다.');
    return;
  }

  // 미리듣기 정지
  if (isPreviewPlaying && musicManager.sound) {
    musicManager.sound.stop();
    isPreviewPlaying = false;
    updatePreviewButtonIcon();
  }

  // 미리듣기 버튼 및 화살표 버튼 숨기기
  hidePreviewButton();
  hideArrowButtons();

  // 정보 버튼 숨기기
  if (infoManager) {
    infoManager.hideInfoButton();
  }

  gameStarted = true;
  gameState = 'playing';

  // 캐릭터 RUN 상태로 (먼저 실행)
  if (character) {
    character.setState(character.states.RUN);
  }

  // 음악 재생 시작 (음악 파일이 있을 때만)
  if (musicManager.sound && musicManager.sound.duration() > 0) {
    musicManager.play();
  }

  console.log('🎮 게임 시작!');
}

/**
 * 게임 리셋
 */
function resetGame() {
  // 음악 정지
  if (musicManager) {
    musicManager.stop();
  }

  if (wallManager) {
    wallManager.reset();
  }
  if (character) {
    character.setState(character.states.IDLE); // IDLE 상태로 리셋
    character.resetCombo();
  }
  if (scoreManager) {
    scoreManager.reset();
  }

  // 음악 매니저 재초기화
  initMusicManager();

  gameStarted = false;
  gameState = 'playing';
  lastDamageTime = 0;

  // 공격 플래그 리셋
  canDestroyWall = false;
  attackHitWall = false;
  wasAttackingLastFrame = false;
  lastAttackState = null;

  // 랭킹 관련 변수 리셋
  nicknameInput = '';
  isEnteringNickname = false;
  rankingSaved = false;
  savedRank = -1;
  removeNicknameInput();

  // 미리듣기 버튼 및 화살표 버튼 다시 보이기 및 아이콘 초기화
  isPreviewPlaying = false;
  updatePreviewButtonIcon();
  showPreviewButton();
  showArrowButtons();

  // 정보 버튼 다시 보이기
  if (infoManager) {
    infoManager.showInfoButton();
  }

  console.log('🔄 게임 리셋! 스페이스바로 다시 시작');
}

/**
 * 시작 화면 그리기
 */
function drawStartScreen() {
  push();

  const config = getSelectedMusicConfig();

  // 반투명 오버레이
  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // 게임 타이틀
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(64);
  text('뿌슝뿌슝', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 250);

  // 곡 선택 박스
  fill(255, 255, 255, 40);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 150, 600, 80, 15);

  // 곡 선택 UI
  textSize(18);
  fill(255, 220, 100);
  text('[ 곡 선택 ]', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 180);

  // 선택된 곡 이름
  textSize(24);
  fill(255);
  text(config.name, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 155);

  // BPM 및 곡 길이 표시
  textSize(18);
  fill(100, 255, 100);

  // 곡 길이 계산
  let durationText = '';
  if (musicManager && musicManager.sound && musicManager.isLoaded) {
    const totalSec = Math.floor(musicManager.sound.duration());
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    durationText = ` | ${min}:${sec.toString().padStart(2, '0')}`;
  }
  text(`BPM: ${config.bpm}${durationText}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 125);

  // 곡 인덱스 표시 (박스 아래)
  textSize(14);
  fill(150);
  text(`${selectedMusicIndex + 1} / ${MUSIC_LIST.length}`, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 95);

  // 시작 안내
  textSize(36);
  fill(100, 255, 100);
  text('SPACE 를 눌러 시작', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 40);

  /* **조작 설명 박스 주석 삭제 처리
  // 조작 설명 박스
  fill(255, 255, 255, 30);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 100, 500, 180, 15);

  // 조작 설명
  textSize(24);
  fill(255);
  textAlign(CENTER, CENTER);
  text('[ 조작 방법 ]', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 35);

  textSize(20);
  fill(255, 220, 100);
  text('SPACE', BASE_WIDTH / 2 - 100, BASE_HEIGHT / 2 + 75);
  text('A', BASE_WIDTH / 2 - 100, BASE_HEIGHT / 2 + 105);
  text('ESC', BASE_WIDTH / 2 - 100, BASE_HEIGHT / 2 + 135);

  fill(200);
  textAlign(LEFT, CENTER);
  text('점프 공격', BASE_WIDTH / 2 - 50, BASE_HEIGHT / 2 + 75);
  text('펀치 공격 (오른손 -> 왼손 -> 어퍼컷)', BASE_WIDTH / 2 - 50, BASE_HEIGHT / 2 + 105);
  text('게임 리셋', BASE_WIDTH / 2 - 50, BASE_HEIGHT / 2 + 135);
  */

  // 음악 로드 상태
  textAlign(CENTER, CENTER);
  textSize(14);
  if (musicManager && musicManager.isLoaded) {
    fill(100, 255, 100);
    text('Ready!', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 175);

    // 미리듣기 버튼 생성 (없으면)
    if (!previewButton) {
      createPreviewButton();
    }
    updatePreviewButtonPosition();

    // 화살표 버튼 생성 (없으면)
    if (!leftArrowButton || !rightArrowButton) {
      createArrowButtons();
    }
    updateArrowButtonsPosition();

    // 정보 버튼 생성 (없으면)
    if (infoManager && !infoManager.infoButton) {
      infoManager.createInfoButton();
    }
    if (infoManager && infoManager.infoButton) {
      infoManager.updateInfoButtonPosition(gameScale);
    }
  } else {
    fill(255, 200, 100);
    text('로딩 중...', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 175);
  }

  // 랭킹 박스 (오른쪽)
  if (rankingManager) {
    const rankX = BASE_WIDTH - 200;
    const rankY = BASE_HEIGHT / 2 - 50;

    // 랭킹 박스 배경
    fill(0, 0, 0, 150);
    rectMode(CENTER);
    rect(rankX, rankY, 280, 300, 15);

    // 랭킹 타이틀
    fill(255, 220, 100);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('RANKING', rankX, rankY - 120);

    // 현재 곡 이름
    fill(150);
    textSize(12);
    text(config.name, rankX, rankY - 95);

    // 구분선
    stroke(100, 100, 150);
    strokeWeight(1);
    line(rankX - 120, rankY - 80, rankX + 120, rankY - 80);
    noStroke();

    // 랭킹 목록
    const rankings = rankingManager.getRankings(config.name);
    if (rankings.length === 0) {
      fill(100);
      textSize(14);
      text('기록 없음', rankX, rankY);
    } else {
      for (let i = 0; i < Math.min(5, rankings.length); i++) {
        const entry = rankings[i];
        const y = rankY - 55 + i * 35;

        // 등수 (1~3위는 금색)
        fill(i < 3 ? color(255, 220, 100) : color(150));
        textSize(16);
        textAlign(LEFT, CENTER);
        text(`${i + 1}.`, rankX - 110, y);

        // 이름
        fill(255);
        text(entry.name.substring(0, 6), rankX - 80, y);

        // 점수
        textAlign(RIGHT, CENTER);
        fill(100, 255, 100);
        text(`${entry.score}`, rankX + 110, y);
      }
    }
  }

  pop();
}

/**
 * 애니메이션 프레임 추출
 */
function extractAnimationFrames() {
  const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';

  if (loaderType === 'individual-frames') {
    // 개별 프레임 방식: 이미 preload에서 animations에 로드됨
    // ATTACK1 → RIGHT_PUNCH, ATTACK2 → LEFT_PUNCH, UPPERCUT 매핑
    if (animations.ATTACK1) {
      animations.RIGHT_PUNCH = animations.ATTACK1;
    }
    if (animations.ATTACK2) {
      animations.LEFT_PUNCH = animations.ATTACK2;
      animations.UPPERCUT = animations.ATTACK2;
    }

    // JUMP_PUNCH 조합
    if (animations.JUMP && animations.ATTACK1) {
      let jumpFrames = animations.JUMP.slice(0, 2);
      let attackFrames = animations.ATTACK1.slice(0, 3);
      animations.JUMP_PUNCH = [...jumpFrames, ...attackFrames];
    }

    // DAMAGED, DEAD도 매핑 (TAKE_HIT → DAMAGED, DEATH → DEAD)
    if (animations.TAKE_HIT) {
      animations.DAMAGED = animations.TAKE_HIT;
    }
    if (animations.DEATH) {
      animations.DEAD = animations.DEATH;
    }

    console.log('✓ 애니메이션 프레임 준비 완료 (개별 프레임 방식)');
    return;
  }

  // 스프라이트 시트 방식 (기존)
  const frameWidth = SPRITE_CONFIG.frameWidth;
  const frameHeight = SPRITE_CONFIG.frameHeight;
  const frameCounts = SPRITE_CONFIG.frameCounts;

  // IDLE
  if (spriteSheets.IDLE) {
    let sheet = new SpriteSheet(spriteSheets.IDLE, frameWidth, frameHeight);
    animations.IDLE = sheet.getFrameSequence(0, frameCounts.IDLE - 1);
  }

  // RUN
  if (spriteSheets.RUN) {
    let sheet = new SpriteSheet(spriteSheets.RUN, frameWidth, frameHeight);
    animations.RUN = sheet.getFrameSequence(0, frameCounts.RUN - 1);
  }

  // RIGHT_PUNCH (Attack1)
  if (spriteSheets.ATTACK1) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight);
    animations.RIGHT_PUNCH = sheet.getFrameSequence(0, frameCounts.ATTACK1 - 1);
  }

  // LEFT_PUNCH (Attack2)
  if (spriteSheets.ATTACK2) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK2, frameWidth, frameHeight);
    animations.LEFT_PUNCH = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
  }

  // UPPERCUT (Attack2와 동일하게 사용)
  if (spriteSheets.ATTACK2) {
    let sheet = new SpriteSheet(spriteSheets.ATTACK2, frameWidth, frameHeight);
    animations.UPPERCUT = sheet.getFrameSequence(0, frameCounts.ATTACK2 - 1);
  }

  // JUMP_PUNCH (Jump + Attack1 조합)
  if (spriteSheets.JUMP && spriteSheets.ATTACK1) {
    let jumpSheet = new SpriteSheet(spriteSheets.JUMP, frameWidth, frameHeight);
    let attackSheet = new SpriteSheet(spriteSheets.ATTACK1, frameWidth, frameHeight);

    let jumpFrames = jumpSheet.getFrameSequence(0, 2); // 점프 초반 프레임
    let attackFrames = attackSheet.getFrameSequence(0, 3); // 공격 프레임

    animations.JUMP_PUNCH = [...jumpFrames, ...attackFrames];
  }

  // DAMAGED (Take Hit)
  if (spriteSheets.TAKE_HIT) {
    let sheet = new SpriteSheet(spriteSheets.TAKE_HIT, frameWidth, frameHeight);
    animations.DAMAGED = sheet.getFrameSequence(0, frameCounts.TAKE_HIT - 1);
  }

  // DEAD (Death)
  if (spriteSheets.DEATH) {
    let sheet = new SpriteSheet(spriteSheets.DEATH, frameWidth, frameHeight);
    animations.DEAD = sheet.getFrameSequence(0, frameCounts.DEATH - 1);
  }

  console.log('✓ 애니메이션 프레임 추출 완료');
}

/**
 * 에셋 로드 확인
 */
function checkAssetsLoaded() {
  const loaderType = SPRITE_CONFIG.loaderType || 'sprite-sheet';

  if (loaderType === 'individual-frames') {
    // 개별 프레임 방식: animations 객체에 로드된 애니메이션 수 확인
    let loadedCount = Object.keys(animations).filter(key => animations[key] && animations[key].length > 0).length;
    assetsLoaded = loadedCount >= 3; // 최소 3개 이상 로드되면 실행 가능

    if (assetsLoaded) {
      console.log(`✓ ${loadedCount}개 애니메이션 로드 완료`);
    }
  } else {
    // 스프라이트 시트 방식
    let loadedCount = Object.keys(spriteSheets).length;
    assetsLoaded = loadedCount >= 3; // 최소 3개 이상 로드되면 실행 가능

    if (assetsLoaded) {
      console.log(`✓ ${loadedCount}개 스프라이트 로드 완료`);
    }
  }
}

/**
 * 스프라이트 경고 표시
 */
function showSpriteWarning() {
  let warningElement = document.getElementById('sprite-warning');
  if (warningElement) {
    warningElement.style.display = 'block';
  }
}

/**
 * 게임 정보 표시
 */
function displayGameInfo() {
  push();
  noStroke();

  // FPS 왼쪽 아래에 초록색 형광색으로 표시
  fill(0, 255, 100); // 형광 초록색
  textSize(16);
  textAlign(LEFT, BOTTOM);
  text(`FPS: ${Math.round(frameRate())}`, 20, BASE_HEIGHT - 20);

  // 파괴한 벽 수 HTML 업데이트
  if (wallManager) {
    let destroyedElement = document.getElementById('destroyed-count');
    if (destroyedElement) {
      destroyedElement.textContent = wallManager.destroyedCount;
    }
  }

  pop();
}

/**
 * 스크롤링 배경 그리기
 */
function drawScrollingBackground() {
  if (backgroundImg) {
    push();

    // 게임 중일 때만 배경 어둡게 (시작 화면에서는 선명하게)
    if (gameStarted && !scoreManager.isGameEnded()) {
      // 배경 어둡게 + 채도 낮춤 (밝기 60%, 채도 낮춤)
      // RGB 모드로 어두운 회색 톤 적용
      tint(100, 100, 120, 180); // 약간 푸른빛 + 투명도
    }

    // 두 개의 배경 이미지를 이어붙여서 그리기 (기준 해상도 사용)
    image(backgroundImg, bgX1, 0, BASE_WIDTH, BASE_HEIGHT);
    image(backgroundImg, bgX2, 0, BASE_WIDTH, BASE_HEIGHT);

    noTint();
    pop();

    // 게임 진행 중일 때만 배경 스크롤 (시작 후 + 종료 전)
    const isGameActive = gameStarted && (!scoreManager || !scoreManager.isGameEnded());
    if (isGameActive) {
      // 배경 왼쪽으로 이동
      bgX1 -= bgSpeed;
      bgX2 -= bgSpeed;

      // 화면 밖으로 나가면 오른쪽으로 이동
      if (bgX1 <= -BASE_WIDTH) {
        bgX1 = bgX2 + BASE_WIDTH;
      }
      if (bgX2 <= -BASE_WIDTH) {
        bgX2 = bgX1 + BASE_WIDTH;
      }
    }
  } else {
    // 배경 이미지 없으면 단색 배경
    background(220, 240, 255);
  }
}

/**
 * 개발용 그리드 그리기
 */
function drawGrid() {
  push();
  stroke(200, 220, 240);
  strokeWeight(1);

  // 세로선
  for (let x = 0; x < GAME_WIDTH; x += 100) {
    line(x, 0, x, GAME_HEIGHT);
  }

  // 가로선
  for (let y = 0; y < GAME_HEIGHT; y += 100) {
    line(0, y, GAME_WIDTH, y);
  }

  // 중앙선 강조
  stroke(150, 180, 200);
  strokeWeight(2);
  line(GAME_WIDTH / 2, 0, GAME_WIDTH / 2, GAME_HEIGHT);
  line(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

  pop();
}

/**
 * 일시정지 토글
 */
function togglePause() {
  if (gameState === 'paused') {
    resumeGame();
  } else {
    pauseGame();
  }
}

/**
 * 게임 일시정지
 */
function pauseGame() {
  gameState = 'paused';
  pauseMenuSelection = 0; // 기본 선택: 재개

  // 음악 일시정지
  if (musicManager && musicManager.isPlaying) {
    musicManager.pause();
  }

  // 캐릭터 입력 버퍼 클리어
  if (character) {
    character.inputBuffer = null;
  }

  console.log('⏸ 게임 일시정지');
}

/**
 * 게임 재개
 */
function resumeGame() {
  gameState = 'playing';

  // 음악 재개
  if (musicManager) {
    musicManager.resume();
  }

  console.log('▶ 게임 재개');
}

/**
 * 일시정지 메뉴 입력 처리
 */
function handlePauseMenuInput(key, keyCode) {
  // 위/아래 화살표로 선택 변경
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    pauseMenuSelection = pauseMenuSelection === 0 ? 1 : 0;
    return;
  }

  // Enter 키로 선택 실행
  if (keyCode === ENTER || keyCode === RETURN) {
    if (pauseMenuSelection === 0) {
      // 재개
      resumeGame();
    } else {
      // 다시 시작
      gameState = 'playing'; // 먼저 상태 변경
      resetGame();
    }
    return;
  }
}

/**
 * 일시정지 메뉴 그리기
 */
function drawPauseMenu() {
  push();

  // 반투명 오버레이
  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // 메뉴 박스
  fill(30, 30, 50, 240);
  stroke(100, 200, 255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(BASE_WIDTH / 2, BASE_HEIGHT / 2, 400, 280, 20);

  // 타이틀
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(48);
  text('일시정지', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 80);

  // 메뉴 옵션
  const menuY = BASE_HEIGHT / 2 + 20;
  const menuSpacing = 60;

  // 재개 버튼
  if (pauseMenuSelection === 0) {
    fill(100, 200, 255);
    rect(BASE_WIDTH / 2, menuY, 250, 50, 10);
    fill(0);
  } else {
    fill(80, 80, 100);
    rect(BASE_WIDTH / 2, menuY, 250, 50, 10);
    fill(200);
  }
  textSize(24);
  text('재개', BASE_WIDTH / 2, menuY);

  // 다시 시작 버튼
  if (pauseMenuSelection === 1) {
    fill(100, 200, 255);
    rect(BASE_WIDTH / 2, menuY + menuSpacing, 250, 50, 10);
    fill(0);
  } else {
    fill(80, 80, 100);
    rect(BASE_WIDTH / 2, menuY + menuSpacing, 250, 50, 10);
    fill(200);
  }
  text('다시 시작', BASE_WIDTH / 2, menuY + menuSpacing);

  // 조작 안내
  fill(150);
  textSize(14);
  text('↑↓ 선택  |  Enter 확인  |  ESC 재개', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 120);

  pop();
}

/**
 * 닉네임 입력 시작 (HTML input 생성)
 */
function startNicknameInput() {
  if (nicknameInputElement) return;

  isEnteringNickname = true;

  // HTML input 요소 생성
  nicknameInputElement = createInput('');
  nicknameInputElement.attribute('placeholder', '닉네임 입력');
  nicknameInputElement.attribute('maxlength', '10');
  nicknameInputElement.style('font-size', '16px');
  nicknameInputElement.style('padding', '8px 12px');
  nicknameInputElement.style('border', '2px solid #64c8ff');
  nicknameInputElement.style('border-radius', '5px');
  nicknameInputElement.style('background', '#32323c');
  nicknameInputElement.style('color', '#fff');
  nicknameInputElement.style('text-align', 'center');
  nicknameInputElement.style('width', '160px');
  nicknameInputElement.style('outline', 'none');

  // 캔버스 위치 계산
  const canvas = document.querySelector('canvas');
  const canvasRect = canvas.getBoundingClientRect();

  // 위치 설정 (ScoreManager의 displayGameOver에서 그리는 위치와 맞춤)
  // leftX = centerX - 160, rect at (leftX, centerY + 135)
  const inputX = canvasRect.left + (BASE_WIDTH / 2 - 160) * gameScale;
  const inputY = canvasRect.top + (BASE_HEIGHT / 2 + 135) * gameScale;
  nicknameInputElement.position(inputX - 80, inputY - 18);

  // Enter 키로 저장
  nicknameInputElement.elt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      nicknameInput = nicknameInputElement.value();
      if (nicknameInput.trim().length > 0) {
        saveRanking();
      }
      removeNicknameInput();
    } else if (e.key === 'Escape') {
      isEnteringNickname = false;
      rankingSaved = true;
      removeNicknameInput();
    }
  });

  // 포커스
  nicknameInputElement.elt.focus();
}

/**
 * 닉네임 입력 요소 제거
 */
function removeNicknameInput() {
  if (nicknameInputElement) {
    nicknameInputElement.remove();
    nicknameInputElement = null;
  }
}

/**
 * 닉네임 입력 처리 (키보드 이벤트)
 */
function handleNicknameInput(key, keyCode) {
  // HTML input이 없으면 생성
  if (!nicknameInputElement) {
    startNicknameInput();
  }
  // 키 이벤트는 HTML input이 처리
}

/**
 * 미리듣기 버튼 생성
 */
function createPreviewButton() {
  if (previewButton) return;

  previewButton = createButton('<i class="fas fa-headphones"></i>');
  previewButton.class('preview-btn');
  previewButton.style('font-size', '20px');
  previewButton.style('width', '45px');
  previewButton.style('height', '45px');
  previewButton.style('border', 'none');
  previewButton.style('border-radius', '50%');
  previewButton.style('background', 'linear-gradient(145deg, #4a9eff, #2d7dd2)');
  previewButton.style('color', '#fff');
  previewButton.style('cursor', 'pointer');
  previewButton.style('box-shadow', '0 4px 15px rgba(74, 158, 255, 0.4)');
  previewButton.style('transition', 'all 0.2s ease');
  previewButton.style('display', 'flex');
  previewButton.style('align-items', 'center');
  previewButton.style('justify-content', 'center');

  previewButton.mousePressed(togglePreview);

  // 호버 효과
  previewButton.mouseOver(() => {
    previewButton.style('transform', 'scale(1.1)');
    previewButton.style('box-shadow', '0 6px 20px rgba(74, 158, 255, 0.6)');
  });
  previewButton.mouseOut(() => {
    previewButton.style('transform', 'scale(1)');
    previewButton.style('box-shadow', '0 4px 15px rgba(74, 158, 255, 0.4)');
  });
}

/**
 * 미리듣기 버튼 위치 업데이트
 */
function updatePreviewButtonPosition() {
  if (!previewButton) return;

  // 곡 선택 박스 오른쪽에 배치
  const btnX = (windowWidth / 2) + 320 * gameScale;
  const btnY = (windowHeight / 2) - 150 * gameScale;
  previewButton.position(btnX, btnY - 22);
}

/**
 * 미리듣기 버튼 숨기기
 */
function hidePreviewButton() {
  if (previewButton) {
    previewButton.hide();
  }
}

/**
 * 미리듣기 버튼 보이기
 */
function showPreviewButton() {
  if (previewButton) {
    previewButton.show();
  }
}

/**
 * 미리듣기 버튼 아이콘 업데이트
 */
function updatePreviewButtonIcon() {
  if (!previewButton) return;

  if (isPreviewPlaying) {
    previewButton.html('<i class="fas fa-pause"></i>');
    previewButton.style('background', 'linear-gradient(145deg, #ff6b6b, #ee5a5a)');
  } else {
    previewButton.html('<i class="fas fa-headphones"></i>');
    previewButton.style('background', 'linear-gradient(145deg, #4a9eff, #2d7dd2)');
  }
}

/**
 * 화살표 버튼 생성
 */
function createArrowButtons() {
  if (leftArrowButton && rightArrowButton) return;

  // 왼쪽 화살표 버튼
  leftArrowButton = createButton('<i class="fas fa-chevron-left"></i>');
  styleArrowButton(leftArrowButton);
  leftArrowButton.mousePressed(() => {
    stopPreviewAndChangeMusic('prev');
  });

  // 오른쪽 화살표 버튼
  rightArrowButton = createButton('<i class="fas fa-chevron-right"></i>');
  styleArrowButton(rightArrowButton);
  rightArrowButton.mousePressed(() => {
    stopPreviewAndChangeMusic('next');
  });
}

/**
 * 화살표 버튼 스타일 적용
 */
function styleArrowButton(btn) {
  btn.style('font-size', '18px');
  btn.style('width', '40px');
  btn.style('height', '40px');
  btn.style('border', 'none');
  btn.style('border-radius', '50%');
  btn.style('background', 'rgba(255, 255, 255, 0.15)');
  btn.style('color', '#fff');
  btn.style('cursor', 'pointer');
  btn.style('transition', 'all 0.2s ease');
  btn.style('display', 'flex');
  btn.style('align-items', 'center');
  btn.style('justify-content', 'center');
  btn.style('backdrop-filter', 'blur(5px)');

  // 호버 효과
  btn.mouseOver(() => {
    btn.style('background', 'rgba(255, 255, 255, 0.3)');
    btn.style('transform', 'scale(1.1)');
  });
  btn.mouseOut(() => {
    btn.style('background', 'rgba(255, 255, 255, 0.15)');
    btn.style('transform', 'scale(1)');
  });
}

/**
 * 화살표 버튼 위치 업데이트
 */
function updateArrowButtonsPosition() {
  if (!leftArrowButton || !rightArrowButton) return;

  const centerY = (windowHeight / 2) - 150 * gameScale;

  // 왼쪽 화살표: 곡 선택 박스 왼쪽
  const leftX = (windowWidth / 2) - 280 * gameScale;
  leftArrowButton.position(leftX - 20, centerY - 20);

  // 오른쪽 화살표: 곡 선택 박스 오른쪽
  const rightX = (windowWidth / 2) + 240 * gameScale;
  rightArrowButton.position(rightX - 20, centerY - 20);
}

/**
 * 화살표 버튼 숨기기
 */
function hideArrowButtons() {
  if (leftArrowButton) leftArrowButton.hide();
  if (rightArrowButton) rightArrowButton.hide();
}

/**
 * 화살표 버튼 보이기
 */
function showArrowButtons() {
  if (leftArrowButton) leftArrowButton.show();
  if (rightArrowButton) rightArrowButton.show();
}

/**
 * 미리듣기 정지 후 곡 변경
 */
function stopPreviewAndChangeMusic(direction) {
  // 미리듣기 정지
  if (isPreviewPlaying && musicManager && musicManager.sound) {
    musicManager.sound.stop();
    isPreviewPlaying = false;
    updatePreviewButtonIcon();
  }

  // 곡 변경
  if (direction === 'prev') {
    selectPrevMusic();
  } else {
    selectNextMusic();
  }

  // 선택된 곡으로 재초기화
  initMusicManager();
}

/**
 * 미리듣기 토글
 */
function togglePreview() {
  if (!musicManager || !musicManager.sound) return;

  if (isPreviewPlaying) {
    musicManager.sound.pause();
    isPreviewPlaying = false;
    console.log('⏸ 미리듣기 정지');
  } else {
    musicManager.sound.play();
    isPreviewPlaying = true;
    console.log('▶ 미리듣기 재생');
  }

  updatePreviewButtonIcon();
}

/**
 * 랭킹 저장
 */
function saveRanking() {
  if (!rankingManager || !scoreManager) return;

  const config = getSelectedMusicConfig();
  const playerName = nicknameInput.trim() || 'Player';

  savedRank = rankingManager.saveRanking(
    config.name,
    playerName,
    scoreManager.score,
    scoreManager.wallsDestroyed
  );

  isEnteringNickname = false;
  rankingSaved = true;

  console.log(`🏆 랭킹 저장: ${playerName} - ${scoreManager.score}점 (${savedRank}위)`);
}
