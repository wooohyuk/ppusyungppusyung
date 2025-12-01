# 뿌슝뿌슝 - 캐릭터 애니메이션 시스템

p5.js 기반 벽 부수기 게임의 캐릭터 애니메이션 및 콤보 시스템 구현

## 주요 기능
- **3단 콤보 시스템**: 'a' 키로 오른손→왼손→어퍼컷 연속 공격
- **8가지 캐릭터 상태**: IDLE, RUN, 각종 공격, 데미지, 사망
- **자동 상태 복귀**: 모든 공격 후 자동으로 달리기 상태로 복귀

## 학습 키워드
- 게임 캐릭터의 상태 변환 (State Machine)
- 콤보 시스템 (Combo System)
- 스프라이트 슬라이스 (Sprite Slicing)
- 프레임 렌더링 (Frame Rendering)
- 스프라이트 애니메이션 (Sprite Animation)

## 프로젝트 구조
```
뿌슝뿌슝/
├── index.html              # 메인 HTML 파일
├── js/
│   ├── sketch.js           # p5.js 메인 로직
│   ├── SpriteSheet.js      # 스프라이트 슬라이싱
│   ├── AnimationManager.js # 프레임 렌더링
│   └── Character.js        # 캐릭터 상태 전환
├── assets/
│   └── sprites/
│       └── martial-hero/   # 다운로드한 스프라이트
└── README.md
```

## 스프라이트 다운로드

이 프로젝트는 **Martial Hero** 스프라이트를 사용합니다.

### 다운로드 방법
1. https://luizmelo.itch.io/martial-hero 접속
2. "Download Now" 클릭 (가격은 $0 또는 원하는 금액)
3. 다운로드한 ZIP 파일 압축 해제
4. 모든 PNG 파일을 `assets/sprites/martial-hero/` 폴더에 복사

### 라이선스
- **CC0 (Creative Commons Zero)** - 완전 무료, 상업적 사용 가능
- 크레딧 표시 불필요 (하지만 감사 표시는 환영!)

### 포함된 애니메이션
- Idle (8 frames) - 대기 상태
- Run (8 frames) - 달리기
- Jump (4 frames) - 점프
- Fall (4 frames) - 낙하
- Attack1 (6 frames) - 공격 1
- Attack2 (6 frames) - 공격 2
- Take Hit (4 frames) - 피격
- Death (6 frames) - 사망

## 스프라이트 교체 방법

다른 스프라이트로 쉽게 교체할 수 있도록 설정이 분리되어 있습니다!

### 방법 1: 기존 프리셋 사용
`js/spriteConfig.js` 파일을 열고 **CURRENT_SPRITE** 값만 변경:
```javascript
// 현재 사용할 스프라이트 선택
const CURRENT_SPRITE = 'MARTIAL_HERO';  // 다른 프리셋 이름으로 변경
```

### 방법 2: 새로운 스프라이트 추가
`js/spriteConfig.js`의 **SPRITE_PRESETS** 객체에 새 설정 추가:
```javascript
SPRITE_PRESETS = {
  // 기존 설정...

  MY_CUSTOM_SPRITE: {
    name: '내 스프라이트',
    author: '제작자',
    license: '라이선스',
    path: 'assets/sprites/my-sprite/',  // 스프라이트 경로
    frameWidth: 64,                      // 프레임 너비
    frameHeight: 64,                     // 프레임 높이
    characterScale: 4,                   // 캐릭터 크기
    files: {
      IDLE: 'idle.png',
      RUN: 'run.png',
      JUMP: 'jump.png',
      // ... 나머지 파일들
    },
    frameCounts: {
      IDLE: 4,
      RUN: 6,
      JUMP: 2,
      // ... 각 애니메이션 프레임 수
    }
  }
};
```

그 다음 `CURRENT_SPRITE = 'MY_CUSTOM_SPRITE'`로 변경!

### 필요한 애니메이션 파일
- IDLE.png - 대기
- RUN.png - 달리기
- JUMP.png - 점프
- FALL.png - 낙하
- ATTACK1.png - 공격 1 (오른손 펀치)
- ATTACK2.png - 공격 2 (왼손 펀치/어퍼컷)
- TAKE_HIT.png - 피격
- DEATH.png - 사망

## 실행 방법

### 로컬 서버 실행
```bash
# Python 3
python -m http.server 8000

# 또는 Node.js의 http-server
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

### VS Code Live Server
1. VS Code에서 `index.html` 열기
2. 우클릭 → "Open with Live Server"

## 캐릭터 상태 (8가지)

| 번호 | 상태 | 사용 애니메이션 | 설명 |
|------|------|-----------------|------|
| 1 | IDLE | Idle | 대기 상태 |
| 2 | RUN | Run | 달리기 |
| 3 | RIGHT_PUNCH | Attack1 | 오른손 펀치 |
| 4 | LEFT_PUNCH | Attack2 | 왼손 펀치 |
| 5 | UPPERCUT | Attack2 | 어퍼컷 |
| 6 | JUMP_PUNCH | Jump + Attack1 | 공중 점프 펀치 |
| 7 | DAMAGED | Take Hit | 벽 충돌 데미지 |
| 8 | DEAD | Death | 사망 |

## 게임 조작법

### 메인 컨트롤
- **A 키**: 콤보 공격
  - 1번째: 오른손 펀치
  - 2번째: 왼손 펀치
  - 3번째: 어퍼컷 (이후 콤보 리셋)
- **R 키**: 콤보 카운터 리셋

### 테스트용 단축키 (숫자 키로 직접 상태 전환)
- **1번 키**: Idle (대기)
- **2번 키**: Run (달리기)
- **3번 키**: Right Punch (오른손 펀치)
- **4번 키**: Left Punch (왼손 펀치)
- **5번 키**: Uppercut (어퍼컷)
- **6번 키**: Jump Punch (공중 펀치)
- **7번 키**: Damaged (데미지)
- **8번 키**: Dead (사망)

## 팀 개발 노트

### 내 담당: 캐릭터 애니메이션
- ✅ 스프라이트 슬라이싱
- ✅ 애니메이션 프레임 렌더링
- ✅ 상태 전환 시스템
- ✅ 8가지 캐릭터 상태 구현

### 다른 팀원 담당
- 벽 시스템
- 배경
- 체력바 UI
- 게임 로직 (타이밍, 점수)
- OST (Suno 활용)

## 나중에 통합할 때
이 프로젝트의 `Character` 클래스와 콤보 시스템을 메인 게임에 통합하면 됩니다.

```javascript
// 다른 팀원의 코드에서 사용 예시
let character = new Character(spriteSheet, x, y);

function setup() {
  // 애니메이션 설정
  character.setupAnimations(animations);
}

function draw() {
  // 게임 로직...

  // 벽과 충돌했을 때
  if (hitWall) {
    character.setState('DAMAGED');
  }

  // 체력이 0이 되었을 때
  if (health <= 0) {
    character.setState('DEAD');
  }

  // 캐릭터 업데이트 및 렌더링
  character.update();
  character.display();
}

function keyPressed() {
  // 공격 버튼 (스페이스바 또는 'a' 키)
  if (key === ' ' || key === 'a') {
    character.handleAttack(); // 3단 콤보 공격
  }
}
```

### 콤보 시스템 작동 방식
1. 기본 상태: **RUN** (달리기)
2. `character.handleAttack()` 호출 시:
   - 1번째: RIGHT_PUNCH → 애니메이션 끝나면 RUN 복귀
   - 2번째: LEFT_PUNCH → 애니메이션 끝나면 RUN 복귀
   - 3번째: UPPERCUT → 애니메이션 끝나면 RUN 복귀 + 콤보 리셋

## 크레딧
- **스프라이트**: Martial Hero by [LuizMelo](https://luizmelo.itch.io) (CC0)
- **프레임워크**: p5.js
- **개발자**: 11조 - 김우빈, 김만우, 유원준
