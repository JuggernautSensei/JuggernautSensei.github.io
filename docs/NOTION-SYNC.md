# Notion 자동 반영

Notion 변경을 GitHub Pages에 자동 반영할 수 있습니다. 이 프로젝트에는 별도 서버 없이 GitHub Actions가 매시간 17분에 확인하는 설정을 준비했습니다.
GitHub Pages는 main 변경 시 검증 후 배포하도록 설정했습니다. Notion 연결 토큰과 자동 반영 변수는 아직 설정하지 않았습니다.

## 준비된 반영 범위

`config/notion-sync.json`에 명시한 공개 페이지와 블록만 사용합니다.

- 포트폴리오의 한 줄 소개와 자기소개 본문
- 프로필 사진
- Juggernaut, Deferred Rendering, JugX의 표지 이미지

`src/_data/profile.json`, `src/assets/media/`에 반영한 뒤 사이트를 빌드합니다. 서명된 임시 이미지 URL은 저장하지 않고 실제 파일을 내려받습니다.
현재 학력·활동·수상과 프로젝트 본문 전체는 수동 관리입니다. 새 Notion 페이지나 새 블록을 자동으로 수집하지 않습니다.
전체 프로젝트 목록은 2026-10-16에 공개 Notion의 All 보기에서 18개 항목의 제목·다중 분류·순서를 확인해 `src/_data/projectCatalog.json`에 맞췄습니다.
이 목록 갱신은 현재 요청에 따른 수동 반영입니다. 기존 자동 반영 작업은 목록의 태그·순서·새 항목을 갱신하지 않습니다.
다시 맞출 때는 설정에 기록된 All 보기를 조회하고, 각 페이지의 공개 여부를 확인한 뒤 목록을 수정합니다. 비공개 하위 문서는 가져오지 않습니다.
따라서 이번 연결은 Notion 전체 복제 기능이 아니라 **승인한 항목의 자동 갱신**입니다.

프로젝트·비공개 문서가 임의로 추가되는 것을 막기 위해, 새로운 항목은 공개 여부와 대상 경로를 확인한 후 설정에 추가합니다.
선택한 페이지의 `public_url`이 없거나 공개 도메인이 달라지면 동기화를 중단합니다. 선택한 블록을 다른 페이지로 옮겨도 중단합니다.
원문을 비공개로 바꾸면 기존 공개 배포가 자동 철회되는 것은 아닙니다. 이미 배포한 페이지를 내리는 작업은 별도로 해야 합니다.

## 한 번 필요한 연결

1. Notion에서 읽기 전용 내부 연결을 만들고, 이 설정에 적힌 포트폴리오와 표지 페이지에만 접근 권한을 부여합니다.
2. GitHub 저장소의 Actions secret에 `NOTION_TOKEN`을 등록합니다. 토큰을 채팅·소스·공개 파일에 쓰지 않습니다.
3. 저장소 변수 `NOTION_SYNC_ENABLED=true`를 지정하면 수동 실행과 정기 실행에서 Notion 내용을 읽습니다.
4. 최초에는 수동 실행에서 빌드 결과를 검토합니다. 사이트 공개 승인 후에만 `NOTION_AUTO_DEPLOY_ENABLED=true`를 지정합니다.
5. Pages Source를 GitHub Actions로 설정합니다. 사이트 저장소와 기본 브랜치는 기존 배포 설정을 따릅니다.

자동 배포 변수는 기본적으로 미설정 상태이므로 자동 공개되지 않습니다.
예약 실행은 GitHub 서비스 상황에 따라 늦어질 수 있습니다. 즉시 반영이 필요하면 Actions를 수동 실행할 수 있습니다.
웹훅으로 즉시 반영하는 방법도 있지만 별도의 공개 수신 서버가 필요하므로 현재는 사용하지 않습니다.

## 로컬 실행

읽기 토큰을 환경 변수에 설정한 뒤 `npm run sync:notion`, `npm run check`를 실행합니다.
토큰이 없거나 API·이미지 요청이 실패하면 명확한 오류로 중단합니다. 새 데이터와 이미지 수집을 모두 마치기 전에는 파일을 변경하지 않습니다.

검증: `npm run test:sync`는 정상 반영·문단 보존, 비공개 페이지 거부, 다른 페이지로 이동한 블록 거부, 네트워크 실패를 확인합니다.
토큰을 이용한 실제 Notion REST API 호출과 GitHub 예약 실행은 미검증 상태입니다.

API가 정상적으로 읽히더라도 문장 내용의 공개 범위는 사용자가 관리해야 합니다. 공개된 원본에 민감한 내용을 작성하면 자동 갱신에도 들어갈 수 있습니다.

## 참고

- https://developers.notion.com/reference/page
- https://developers.notion.com/reference/retrieve-a-block
- https://developers.notion.com/reference/webhooks
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
