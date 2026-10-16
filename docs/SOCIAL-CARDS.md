# 소셜 카드 수정

Notion 포트폴리오의 Socials에는 `https://juggernautsensei.github.io/socials/`를 임베드합니다. 북마크의 미리보기 수집을 사용하지 않습니다.

`src/_data/socialCards.json`에서 카드의 순서·제목(`title`)·설명(`description`)·링크(`url`)·표시 도메인(`domain`)·이미지(`image`)·대체 텍스트(`alt`)·이미지 위치(`position`)를 수정합니다. 이미지 파일은 `src/assets/media/`에 둡니다. 배치는 `src/socials.njk`에서 수정합니다.

`npm run check`로 확인하고 main에 반영하면 자동 배포됩니다. 배포 후 Notion을 새로고침하면 됩니다. 북마크를 다시 만들거나 날짜 쿼리를 바꿀 필요가 없습니다.

GitHub와 블로그 링크는 더 이상 Notion 북마크 블록에서 수집하지 않습니다. 사이트 본문의 소셜 링크는 기존 `src/_data/profile.json`에서 관리합니다. 카드의 목적지를 바꿀 때 사이트 본문 링크도 바꾸려면 해당 파일의 `github`·`blog`도 함께 수정합니다.
