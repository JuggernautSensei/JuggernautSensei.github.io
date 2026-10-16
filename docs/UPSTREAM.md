# 템플릿 점검

확인일: 2026-10-16 (KST).

추가로 받은 이전 대화 전문에서 Benjamin Mullins의 Portfolio Starter임을 확인했습니다.

- 원본: https://github.com/mullinsben/Portfolio-Starter
- 확인 커밋: f10e8de7b32586c9d1fb3c12c5ff1ab9fe5277ef (main)
- 라이선스: https://github.com/mullinsben/Portfolio-Starter/blob/f10e8de7b32586c9d1fb3c12c5ff1ab9fe5277ef/LICENSE
- MIT, Copyright (c) 2026 Benjamin Mullins. 고지를 licenses/portfolio-starter-MIT.txt에 보존하고 빌드 결과에도 포함합니다.
- 원본은 각 HTML에 CSS와 JavaScript를 포함하는 정적 사이트이며 package.json과 빌드 의존성이 없습니다.
- index.html의 style 블록을 src/assets/css/starter.css로 추출했습니다. 다크 팔레트·사이드 메뉴·타이포그래피를 Eleventy 레이아웃에 연결했습니다.
- 프로토타입은 원본의 Archivo·Inter를 Google Fonts로 불러오며 한국어는 시스템 글꼴을 사용합니다. 폰트 파일은 복사하지 않았습니다.
- 예시 이미지·개인 이력·샘플 PDF·실험 페이지·분석 스크립트는 가져오지 않았습니다.
- 원본의 브라우저 비밀번호 게이트는 제외했습니다. 비공개 문서는 파일 자체를 공개 저장소와 빌드 입력에서 제외합니다.
- 프로토타입 01의 단어 롤·색상 순환·스크롤 진행·모바일 메뉴·상세 목차 디자인을 사용자가 수락했습니다. 시안 02에서 한글·프로필 사진·교차 배경과 메인 이력을 추가했습니다.
- Eleventy 3.1.7을 설치하고 package-lock.json으로 의존성을 고정했습니다.

동명인 sb-ph/portfolio-starter를 잠정 확인했으나 정확한 템플릿 확인 후 해당 CSS·레이아웃·라이선스를 교체했습니다. 최종 결과에는 사용하지 않습니다.

디자인 참고 https://dan-andres-stoneley.github.io/ 는 별도 사이트입니다.
소스 https://github.com/dan-andres-stoneley/dan-andres-stoneley.github.io 의 조회 메타데이터 license는 null입니다.
이 사이트의 코드·이미지·개인 경력 문구는 복사하지 않았습니다.

개인 콘텐츠 전체에 MIT 라이선스를 자동 부여하지 않습니다. 공개 원문·게임 자산·문서별 권리를 별도로 확인합니다.

## 공식 설정 참고

- https://www.11ty.dev/docs/config/
- https://www.11ty.dev/docs/preprocessors/
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Actions: checkout v6 / setup-node v6 / configure-pages v5 / upload-pages-artifact v4 / deploy-pages v4의 확인한 커밋 SHA로 고정했습니다.
