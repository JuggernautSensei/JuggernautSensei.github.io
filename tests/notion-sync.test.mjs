import assert from "node:assert/strict";
import { test } from "node:test";
import { publicClient, descendants } from "../scripts/notion-public.mjs";
import { catalogItems, collectPortfolio } from "../scripts/notion-sync.mjs";
import { renderPage, richText } from "../scripts/notion-render.mjs";
import { projectAvailable, projectFields } from "../scripts/project-data.mjs";

const row = block => ({ value: { value: { alive: true, ...block }, role: "reader" } });
const title = text => ({ title: [[text]] });
const host = "example.notion.site";
const catalog = { source: { databaseId: "db", viewId: "view" }, labels: { Project: "프로젝트", Game: "게임" }, items: [{ id: "old", slug: "stable" }] };
function fixture() {
  const config = { rootPageId: "root", publicHost: host, headlineBlockId: "headline", introductionBlockId: "intro", portraitBlockId: "portrait", experienceColumnId: "history", contactBlocks: { github: "github" }, covers: [] };
  const root = { block: {
    root: row({ id: "root", type: "page", permissions: [{ type: "public_permission", role: "reader" }], content: ["headline", "intro", "portrait", "history", "github", "db"] }),
    headline: row({ id: "headline", type: "quote", properties: title("수정한 소개") }),
    intro: row({ id: "intro", type: "text", properties: title("문단1\n\n문단2\n\n더 자세한 프로젝트와 개발 기록은 GitHub에서 확인하실 수 있습니다.") }),
    portrait: row({ id: "portrait", type: "image", format: { display_source: "https://example.com/face.png" } }),
    history: row({ id: "history", type: "column", content: [] }),
    github: row({ id: "github", type: "bookmark", properties: { ...title("제목은 URL이 아님"), link: [["https://github.com/JuggernautSensei"]] } }),
    db: row({ id: "db", type: "collection_view", collection_id: "collection" })
  }, collection_view: { view: row({ id: "view" }) } };
  const page = { id: "old", type: "page", parent_id: "collection", parent_table: "collection", properties: { ...title("새 제목"), tags: [["Project,Game,Pinned"]] }, content: ["paragraph"] };
  const query = { ids: ["old"], map: { block: { old: row(page) }, collection: { collection: row({ schema: { tags: { name: "Expertise", type: "multi_select" }, desc: { name: "설명", type: "text" } } }) } } };
  const detail = { block: { old: row(page), paragraph: row({ id: "paragraph", type: "text", properties: title("새 본문") }) } };
  return { config, root, query, detail, client: { page: async id => id === "root" ? root : detail, query: async () => query } };
}

test("sync reads public profile, bookmark URLs, changed project title and body", async () => {
  const f = fixture();
  const result = await collectPortfolio(f.config, { name: "안지우" }, catalog, f.client, async () => "/assets/face.png");
  assert.equal(result.profile.introduction, "문단1\n\n문단2");
  assert.equal(result.profile.github, "https://github.com/JuggernautSensei");
  assert.equal(result.catalog.items[0].title, "새 제목");
  assert.equal(result.snapshot.pages.stable.notionHtml, "<p>새 본문</p>");
  assert.equal(result.snapshot.pages.stable.pinned, true);
});

test("social links remain configured when Notion bookmarks are replaced by an embed", async () => {
  const f = fixture();
  f.config.contactBlocks = {};
  delete f.root.block.github;
  const profile = { github: "https://github.com/JuggernautSensei", blog: "https://example.notion.site/blog" };
  const result = await collectPortfolio(f.config, profile, catalog, f.client, async () => "/assets/face.png");
  assert.equal(result.profile.github, profile.github);
  assert.equal(result.profile.blog, profile.blog);
});

test("current Filter schema updates card descriptions, bullets, covers and external links", async () => {
  const f = fixture();
  f.query.map.collection.collection.value.value.schema = {
    tags: { name: "Filter", type: "multi_select" },
    desc: { name: "Description", type: "text" },
    repo: { name: "Github", type: "text" },
    video: { name: "Video", type: "text" }
  };
  const page = f.detail.block.old.value.value;
  Object.assign(page.properties, {
    desc: [["새 소개\n  • 첫 번째 구현\n• 두 번째 구현"]],
    repo: [["https://github.com/example/project"]],
    video: [["https://youtu.be/example"]]
  });
  page.format = { page_cover: "https://example.com/current-cover.png" };
  const result = await collectPortfolio(f.config, {}, catalog, f.client, async (source, id) => `/assets/${id}.png`);
  const card = result.snapshot.pages.stable;
  assert.equal(card.description, "새 소개");
  assert.deepEqual(card.highlights, ["첫 번째 구현", "두 번째 구현"]);
  assert.equal(card.repository, "https://github.com/example/project");
  assert.equal(card.video, "https://youtu.be/example");
  assert.equal(card.cover, "/assets/old.png");
  page.properties.video = [["깃허브 문서 참조"]];
  const textVideo = await collectPortfolio(f.config, {}, catalog, f.client, async () => "/assets/cover.png");
  assert.equal(textVideo.snapshot.pages.stable.video, null);
});

test("experience entries carry their column image as a downloaded logo", async () => {
  const f = fixture();
  Object.assign(f.root.block, {
    history: row({ id: "history", type: "column", content: ["edu", "school"] }),
    edu: row({ id: "edu", type: "header", properties: title("Education") }),
    school: row({ id: "school", type: "column_list", content: ["left", "right"] }),
    left: row({ id: "left", type: "column", content: ["period", "logo"] }),
    period: row({ id: "period", type: "text", properties: title("2020. 03. 02 – 2026. 02. 20") }),
    logo: row({ id: "logo", type: "image", format: { display_source: "attachment:logo" } }),
    right: row({ id: "right", type: "column", content: ["name", "desc"] }),
    name: row({ id: "name", type: "text", properties: title("Graduate | Pukyuong National University") }),
    desc: row({ id: "desc", type: "text", properties: title("학사 졸업") })
  });
  const result = await collectPortfolio(f.config, {}, catalog, f.client, async (source, id) => `/assets/${id}-${source}.svg`);
  assert.equal(result.profile.education[0].title, "부경대학교");
  assert.equal(result.profile.education[0].logo, "/assets/logo-attachment:logo.svg");
});

test("catalog preserves source order and overlapping tags; new IDs get stable URLs", () => {
  const page = (id, tags) => row({ id, type: "page", parent_id: "c", parent_table: "collection", properties: { ...title(id), tags: [[tags]] } });
  const map = { block: { old: page("old", "Project,Library"), newer: page("newer", "Study,Game"), removed: row({ id: "removed", alive: false }) } };
  const items = catalogItems(["newer", "old", "private", "removed"], map, catalog, "c", "tags", host);
  assert.deepEqual(items.map(i => i.slug), ["notion-newer", "stable"]);
  assert.deepEqual(items[0].categories, ["Study", "Game"]);
  assert.deepEqual(items[1].categories, ["Project", "Library"]);
  assert.equal(catalogItems(["newer"], map, { items }, "c", "tags", host)[0].slug, "notion-newer");
});

test("private root, moved profile blocks, and media failure abort collection", async () => {
  let f = fixture(); f.root.block.root.value.value.permissions = [];
  await assert.rejects(collectPortfolio(f.config, {}, catalog, f.client, async () => assert.fail()), /no longer public/);
  f = fixture(); f.root.block.root.value.value.content = ["history"];
  await assert.rejects(collectPortfolio(f.config, {}, catalog, f.client, async () => assert.fail()), /outside the public root/);
  f = fixture();
  await assert.rejects(collectPortfolio(f.config, {}, catalog, f.client, async () => { throw new Error("network offline"); }), /network offline/);
  f = fixture(); delete f.query.map.collection.collection.value.value.schema.desc;
  await assert.rejects(collectPortfolio(f.config, {}, catalog, f.client, async () => "/assets/face.png"), /description schema changed/);
});

test("renderer escapes text/URLs, keeps nested lists, local images, tables, and stable TOC", async () => {
  const map = { block: {
    p: row({ id: "p", type: "page", content: ["h", "li", "li2", "image", "table"] }),
    h: row({ id: "h", type: "sub_header", properties: title("구현") }),
    li: row({ id: "li", type: "bulleted_list", properties: title("<script>"), content: ["nested"] }),
    nested: row({ id: "nested", type: "numbered_list", properties: title("내부") }),
    li2: row({ id: "li2", type: "bulleted_list", properties: title("두 번째") }),
    image: row({ id: "image", type: "image", format: { display_source: "attachment:example" } }),
    table: row({ id: "table", type: "table", format: { table_block_column_order: ["a"], table_block_column_header: true }, content: ["tr"] }),
    tr: row({ id: "tr", type: "table_row", properties: { a: [["열"]] } })
  } };
  const result = await renderPage(map, "p", host, async () => "/assets/example.png");
  assert(result.html.includes("<ul><li>&lt;script&gt;<ol><li>내부</li></ol></li><li>두 번째</li></ul>"));
  assert(result.html.includes('src="/assets/example.png"'));
  assert(result.html.includes("<th>열</th>"));
  assert.deepEqual(result.toc, [{ id: "notion-h", label: "구현" }]);
  assert.throws(() => richText([["x", [["a", "javascript:alert(1)"]]]], host), /protocol/);
});

test("ancestor metadata and linked page children are never crawled", async () => {
  const map = { block: {
    p: row({ id: "p", type: "page", content: ["child"] }),
    child: row({ id: "child", type: "page", properties: title("원문"), content: ["secret"] }),
    secret: row({ id: "secret", type: "text", properties: title("PRIVATE_TEST_SENTINEL") }),
    ancestor: row({ id: "ancestor", type: "text", properties: title("PRIVATE_TEST_SENTINEL") })
  } };
  assert.deepEqual([...descendants(map.block, "p").keys()], ["p", "child"]);
  const result = await renderPage(map, "p", host, async () => assert.fail());
  assert(!result.html.includes("PRIVATE_TEST_SENTINEL"));
});

test("deleted/private projects lose routes and collections; independent manual pages remain", () => {
  const data = { page: { fileSlug: "deleted" }, notionUrl: "https://example.notion.site/deleted", permalink: "/projects/deleted/", notionSync: { active: true, pages: {} } };
  assert.equal(projectAvailable(data), false);
  assert.equal(projectFields.permalink(data), false);
  assert.equal(projectFields.eleventyExcludeFromCollections(data), true);
  assert.equal(projectAvailable({ ...data, notionUrl: undefined }), true);
  const changed = { ...data, page: { fileSlug: "changed" }, repository: "old", featuredGroup: "library", notionSync: { active: true, pages: { changed: { repository: null, featuredGroup: null } } } };
  assert.equal(projectFields.repository(changed), null);
  assert.equal(projectFields.featuredGroup(changed), null);
});

test("public API merges paginated chunks with anonymous requests", async () => {
  const bodies = [];
  const client = publicClient(host, async (url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body); bodies.push(body);
    return { ok: true, json: async () => ({ recordMap: { block: { [body.chunkNumber]: row({ id: String(body.chunkNumber) }) } }, cursor: { stack: body.chunkNumber ? [] : [[{ id: "p" }]] } }) };
  });
  const map = await client.page("p");
  assert.deepEqual(Object.keys(map.block), ["0", "1"]);
  assert.equal(bodies[1].cursor.stack.length, 1);
});

test("incomplete query and HTTP failures stop sync", async () => {
  const client = publicClient(host, async () => ({ ok: true, json: async () => ({ recordMap: { block: {} }, result: { reducerResults: { collection_group_results: { blockIds: [], hasMore: true } } } }) }));
  await assert.rejects(client.query("c", { id: "v" }), /incomplete/);
  await assert.rejects(publicClient(host, async () => ({ ok: false, status: 503 })).page("p"), /HTTP 503/);
});
