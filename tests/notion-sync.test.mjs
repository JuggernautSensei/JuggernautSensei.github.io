import assert from "node:assert/strict";
import { test } from "node:test";
import { collectPortfolio, requirePublicPage } from "../scripts/notion-sync.mjs";

const config = { rootPageId: "root", publicHost: "example.notion.site", headlineBlockId: "headline", introductionBlockId: "intro", portraitBlockId: "portrait", covers: [{ pageId: "project", file: "project.png" }] };
function fixture() {
  return {
    "pages/root": { id: "root", public_url: "https://example.notion.site/root" },
    "pages/project": { id: "project", public_url: "https://example.notion.site/project", cover: { type: "file", file: { url: "https://example.com/project.png" } } },
    "blocks/headline": { id: "headline", type: "quote", parent: { type: "block_id", block_id: "column" }, quote: { rich_text: [{ plain_text: "새 소개 문구" }] } },
    "blocks/intro": { id: "intro", type: "paragraph", parent: { type: "page_id", page_id: "root" }, paragraph: { rich_text: [{ plain_text: "수정한 자기소개\n\n추가한 두 번째 문단\n\n더 자세한 프로젝트와 개발 기록은 GitHub에서 확인할 수 있습니다." }] } },
    "blocks/portrait": { id: "portrait", type: "image", parent: { type: "page_id", page_id: "root" }, image: { type: "file", file: { url: "https://example.com/portrait.png" } } },
    "blocks/column": { id: "column", type: "column", parent: { type: "page_id", page_id: "root" } }
  };
}

test("profile updates use approved blocks, preserve manual fields, and never crawl other pages", async () => {
  const data = fixture();
  const calls = [];
  const result = await collectPortfolio(config, { name: "안지우", education: ["유지"] }, async key => { calls.push(key); return data[key]; }, async () => ({ data: Buffer.from("image"), extension: "png" }));
  assert.equal(result.profile.headline, "새 소개 문구");
  assert.equal(result.profile.introduction, "수정한 자기소개\n\n추가한 두 번째 문단");
  assert.deepEqual(result.profile.education, ["유지"]);
  assert.equal(result.media.length, 2);
  assert(calls.every(key => key in data));
});

test("private or removed pages stop synchronization", async () => {
  assert.throws(() => requirePublicPage({ id: "private", public_url: null }, config.publicHost));
  const data = fixture();
  data["pages/project"].public_url = null;
  await assert.rejects(collectPortfolio(config, {}, async key => data[key], async () => ({ data: Buffer.from("image") })), /not verified public/);
});

test("a block moved to a different private page is not imported", async () => {
  const data = fixture();
  data["blocks/column"].parent.page_id = "private-page";
  await assert.rejects(collectPortfolio(config, {}, async key => data[key], async () => assert.fail("must not download")), /no longer inside/);
});

test("network failure returns no partial result", async () => {
  const data = fixture();
  await assert.rejects(collectPortfolio(config, {}, async key => data[key], async () => { throw new Error("network offline"); }), /network offline/);
});
