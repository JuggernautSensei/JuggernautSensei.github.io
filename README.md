# JuggernautSensei Portfolio

안지우의 GitHub Pages 포트폴리오입니다. Eleventy·Markdown·Nunjucks로 구성합니다.
메인에서 소개·프로필 사진·학력·활동·수상·전체 프로젝트·기술 자료·연락처를 확인할 수 있습니다. 프로젝트 목록은 대표 작업부터 썸네일·제목·짧은 설명으로 표시합니다. 프로젝트 배경은 교차 전환되며 프로젝트 상세는 메인 위에 서브 페이지로 열립니다.
공개 Notion 목록 18개의 제목·순서·중복 분류를 반영했습니다. 본문 전체 이전은 진행 중이며, 상세 페이지의 공개 원문 링크에서 기존 자료를 확인할 수 있습니다.

[사이트](https://juggernautsensei.github.io/) · [콘텐츠 추가](docs/ADDING-CONTENT.md) · [Notion 자동 반영](docs/NOTION-SYNC.md)

디자인 원본은 [Benjamin Mullins Portfolio Starter](https://github.com/mullinsben/Portfolio-Starter)입니다. MIT 고지를 보존하고 다크 CSS·사이드 메뉴를 Eleventy에 연결했습니다.

## 실행

Node.js 24.x와 Git을 사용합니다. GitHub CLI 없이 로컬 작업이 가능합니다.

```powershell
npm ci
npm run dev
```

미리보기: http://localhost:8080

```powershell
npm run test:privacy
npm run check
```

빌드 출력은 `_site/`이며 빌드마다 비워 오래된 결과가 남지 않도록 합니다.
개발 서버는 콘텐츠 변경을 반영합니다. 삭제·공개 상태 변경 후에는 `npm run check`로 깨끗한 결과를 확인합니다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `src/about.md` | 소개·학력·활동·수상 전체 원문 |
| `src/projects/` | 전체 프로젝트 상세 Markdown, 하위 폴더 사용 가능 |
| `src/documents/` | 공개 기술 문서, 하위 폴더 사용 가능 |
| `src/_includes/layouts/` | Nunjucks 레이아웃 |
| `src/_data/site.json` | 사이트 URL·소개·메뉴 |
| `src/assets/` | 공개 승인된 이미지·CSS·JS |
| `docs/CONTENT-MIGRATION.md` | 원문 보존과 공개 검토 규칙 |
| `.github/workflows/pages.yml` | 자동 검증, main 변경 시 Pages 배포 |
| `licenses/` | 원본 템플릿 MIT 고지 |

공개 URL은 `/`, `/projects/`, `/about/`, `/notes/`, `/resume/`입니다. `src/documents/`의 문서에는 `/notes/<topic>/<slug>/` 형태의 permalink를 지정합니다.

## 공개 경계

공개 저장소는 소스 파일과 Git 이력도 공개합니다. 비공개·미확인 Notion 원문을 이 폴더에 복사하지 않습니다.
원본 백업과 검토 중인 문서는 이 저장소 밖의 로컬 작업 폴더에 보관합니다.
`.gitignore`와 빌드 검사는 보조 수단이며 공개 승인 절차를 대체하지 않습니다.

`src`의 모든 페이지는 `visibility: public`, `publish: true`가 필요합니다. 누락되면 빌드를 중단합니다.
실제 원문을 검토한 후에만 이 값을 지정합니다. Markdown 본문은 Nunjucks로 재해석하지 않아 C++의 중괄호를 그대로 쓸 수 있습니다.
브라우저에는 GitHub/Notion 토큰을 포함하지 않습니다. 선택한 공개 콘텐츠를 읽는 동기화 코드와 활성화 방법은 `docs/NOTION-SYNC.md`에 있습니다.

## 배포

대상은 `JuggernautSensei/JuggernautSensei.github.io`, 루트 URL이므로 `pathPrefix`는 `/`입니다.
프로필 저장소 `JuggernautSensei/JuggernautSensei`와는 다릅니다.

Pages Source는 GitHub Actions입니다. `main`에 반영하면 공개 경계 검사·Notion 동기화 검사·빌드·내부 링크 검증을 통과한 결과를 배포합니다.
Pull request에서는 검증만 수행합니다. 수동 배포는 Actions의 `Verify and publish Pages`에서 `publish: true`로 실행할 수 있습니다.

공개 Notion 변경을 토큰 없이 15분 간격으로 수집·검증해 자동 배포합니다. 소개·사진·이력·프로젝트 본문·분류·순서·새 항목을 반영합니다. 예약 실행은 지연될 수 있으며, 범위와 운영 방법은 [Notion 자동 갱신](docs/NOTION-SYNC.md)을 참고하세요.
