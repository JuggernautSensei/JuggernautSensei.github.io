# Portfolio prototype 01

이 문서는 최초 시안 기록입니다. 사용자가 디자인을 수락한 후 한글 중심 문구, 실제 프로필 사진, 프로젝트 배경 교차 전환, 한 페이지 소개·이력으로 갱신했습니다. 현재 사용법은 `ADDING-CONTENT.md`, 자동 반영 범위는 `NOTION-SYNC.md`를 확인합니다.

질문: 선택한 Portfolio Starter의 화면과 동작을 유지하면서 게임·엔진 포트폴리오로 바꾸면 어떤 모습인가?

확인용 로컬 프로토타입입니다. 사용자 디자인 수락 전이며 공개 배포·커밋하지 않았습니다.
이미 선택한 레퍼런스에 맞추는 작업이므로 여러 디자인 변형을 만들지 않았습니다.

## 실행과 확인

`npm run dev` → http://localhost:8080/?prototype=1

- 메인: 대형 프로젝트 이미지·타이포그래피, 떠 있는 사이드 메뉴, 소개·작품·라이브러리·문서·연락처 섹션.
- 동작: 제목·상태 단어 전환, 화면 진입 연출, 스크롤에 따른 색상·메뉴 진행 표시.
- 상세: `/projects/juggfx/`, `/projects/metalslug2-clone/`. 상단 비주얼, 왼쪽 목차, 아키텍처·구현·출처.
- 목록: `/projects/`에서 Games / Libraries 필터.
- 모바일: 메뉴 열기·닫기, 항목 이동 시 닫기, Escape로 닫기, 한 열 배치.
- 접근성: 키보드 초점, 본문 건너뛰기, 모션 줄이기 설정 반영.

화면 파일은 `src/_includes/prototype/`, 공통 레이아웃은 `src/_includes/layouts/prototype.njk`에 있습니다.
전용 스타일과 동작은 `src/assets/css/prototype.css`, `src/assets/js/prototype.js`입니다.
이 파일들은 시안용이며 최종 콘텐츠 이전 시 선택한 구조에 맞춰 정리합니다.

## 원본과의 관계

Benjamin Mullins Portfolio Starter 커밋 f10e8de7b32586c9d1fb3c12c5ff1ab9fe5277ef를 기준으로 합니다.
메인 CSS와 essay CSS를 추출하고, 원본의 레이아웃·메뉴·모션 패턴을 Nunjucks와 별도 JS로 연결했습니다.
레이아웃과 동작을 비교하는 프로토타입이며 다른 미디어·문구를 사용하므로 픽셀 단위 동일 결과를 뜻하지 않습니다.
원본 글꼴인 Archivo·Inter는 Google Fonts로 불러옵니다. 폰트 파일을 저장소에 복사하지 않았습니다.
MIT 원문·제작자 크레딧은 보존합니다. 원본의 비밀번호 게이트·샘플 이력·동물 이미지는 사용하지 않았습니다.

## 콘텐츠와 미디어 근거

아래 공개 원문을 2026-10-16에 조회했습니다. 공개 페이지로의 업로드는 아직 하지 않았습니다.

| 사용 | 원본 |
| --- | --- |
| 히어로와 레이트레이싱 카드 | https://github.com/JuggernautSensei/RayTracingInOneWeekend/blob/main/RayTracingInOneWeekend/Outputs/14.%20Final%20Scene%202026-06-27%20195327.png |
| 게임 대표 이미지 | https://github.com/JuggernautSensei/MetalSlug2-Clone/blob/main/Media/banner.jpg |
| 상세 전투 GIF | https://github.com/JuggernautSensei/MetalSlug2-Clone/blob/main/Media/combat.gif |
| TextGradius 표지 | https://github.com/JuggernautSensei/TextGradius/blob/main/Resources/TitleScreen.png |
| JugGfx 상세 설명 | https://github.com/JuggernautSensei/JugGfx/blob/main/README.md |
| MetalSlug2 상세 설명 | https://github.com/JuggernautSensei/MetalSlug2-Clone/blob/main/README.md |

이미지의 프로젝트 소속을 바꾸어 표시하지 않습니다. JugGfx에는 렌더링 캡처 대신 설계 구조를 표시했습니다.
영문 히어로·소개·내비게이션 문구는 시안용 편집 문구입니다. Notion 자기소개·학력·활동·수상 원문은 아직 이전하지 않았습니다.
Juggernaut·JugNet·JugX 등 상세 원문이 없는 항목은 자리표시자로 남겼습니다.

## 확인 범위

설치된 Edge를 별도의 임시 headless 세션으로 실행해 화면과 동작을 확인했습니다. 사용자의 브라우저 로그인·탭은 사용하지 않았습니다.
스크린샷은 프로젝트 밖 상위 outputs 폴더에 저장했습니다.
빌드·내부 링크·앵커·공개 경계 검사는 기존 환경 검사를 사용합니다.
실제 Notion 전체 보존 대조와 최종 디자인 수락은 아직 수행하지 않았습니다.
