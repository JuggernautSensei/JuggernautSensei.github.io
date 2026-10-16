import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { publicClient, value, plain, blockText, descendants } from "./notion-public.mjs";
import { renderPage, link } from "./notion-render.mjs";

export function catalogItems(ids, map, catalog, collectionId, categoryKey, host) {
  const old = new Map(catalog.items.map(item => [item.id, item]));
  return ids.flatMap(id => {
    const page = value(map.block[id]);
    if (!page || page.alive === false) return [];
    if (page.parent_table !== "collection" || page.parent_id !== collectionId) throw new Error(`Notion project moved outside the public collection: ${id}`);
    const categories = plain(page.properties?.[categoryKey]).split(",").map(s => s.trim());
    const title = blockText(page);
    if (!title) throw new Error(`Notion project has no title: ${id}`);
    return [{ id, slug: old.get(id)?.slug || `notion-${id.replaceAll("-", "")}`, title,
      categories: categories.filter(key => key && key !== "Pinned"), pinned: categories.includes("Pinned"),
      notionUrl: `https://${host}/${id.replaceAll("-", "")}` }];
  });
}

function history(blocks, columnId) {
  const column = blocks.get(columnId);
  if (!column) throw new Error("Notion experience column moved; review config");
  const output = { education: [], activities: [], awards: [] };
  let section;
  const translations = { "Pukyuong National University": "부경대학교", "Code Coach": "코드코치 부산지부" };
  for (const id of column.content || []) {
    const block = blocks.get(id);
    if (!block) continue;
    if (block.type === "header") {
      const label = JSON.stringify(block.properties?.title);
      section = /Education/.test(label) ? "education" : /Activity/.test(label) ? "activities" : /Awards/.test(label) ? "awards" : undefined;
    } else if (section && block.type === "column_list") {
      const group = [];
      function walk(parent) { for (const key of parent.content || []) { const child = blocks.get(key); if (child) { group.push(child); walk(child); } } }
      walk(block);
      const texts = group.filter(b => b.type === "text" && blockText(b).trim()).map(blockText);
      const details = group.filter(b => b.type === "bulleted_list").map(blockText);
      if (section === "awards") {
        if (texts.length < 2) throw new Error(`Incomplete Notion award: ${id}`);
        const org = texts[0].split("|").at(-1).trim();
        output.awards.push({ period: "", title: texts.slice(1).join(" "), organization: translations[org] || org });
      } else {
        if (texts.length < 3) throw new Error(`Incomplete Notion experience: ${id}`);
        const title = texts[1].split("|").at(-1).trim();
        output[section].push({ period: texts[0], title: translations[title] || title, description: texts.slice(2).join(" "), details });
      }
    }
  }
  return output;
}

export async function collectPortfolio(config, profile, catalog, client, media) {
  const root = await client.page(config.rootPageId);
  const rootPage = value(root.block[config.rootPageId]);
  if (!rootPage?.alive || !rootPage.permissions?.some(p => p.type === "public_permission" && p.role === "reader")) throw new Error("Portfolio root is no longer public; sync stopped");
  const blocks = descendants(root.block, config.rootPageId);
  const selected = id => {
    const block = blocks.get(id);
    if (!block) throw new Error(`Approved Notion block is outside the public root: ${id}`);
    return block;
  };
  const nextProfile = { ...profile, headline: blockText(selected(config.headlineBlockId)),
    introduction: blockText(selected(config.introductionBlockId)).replace(/\n{2,}더 자세한 프로젝트와 개발 기록은[\s\S]*$/, "").trim(),
    ...history(blocks, config.experienceColumnId) };
  if (!nextProfile.headline || !nextProfile.introduction) throw new Error("Notion profile is empty");
  const portrait = selected(config.portraitBlockId);
  if (portrait.type !== "image") throw new Error("Notion portrait block changed type");
  nextProfile.portrait = await media(portrait.format?.display_source || plain(portrait.properties?.source), portrait.id);
  for (const [field, id] of Object.entries(config.contactBlocks)) {
    const block = selected(id);
    const parts = block.properties?.link || block.properties?.title || block.properties?.source;
    const mark = parts?.flatMap(part => part[1] || []).find(mark => mark[0] === "a");
    const url = link(mark?.[1] || plain(parts), config.publicHost);
    nextProfile[field] = field === "email" ? url.replace(/^mailto:/, "") : url;
  }
  const database = selected(catalog.source.databaseId);
  const collectionId = database.collection_id || database.format?.collection_pointer?.id;
  const view = value(root.collection_view?.[catalog.source.viewId]);
  if (!collectionId || !view) throw new Error("Public Notion collection/view missing");
  const query = await client.query(collectionId, view);
  const collection = value(query.map.collection?.[collectionId]);
  const categoryKey = Object.entries(collection?.schema || {}).find(([, s]) => s.name === "Expertise" && s.type === "multi_select")?.[0];
  const repoKey = Object.entries(collection?.schema || {}).find(([, s]) => s.name === "Github")?.[0];
  if (!categoryKey) throw new Error("Notion category schema changed");
  let items = catalogItems(query.ids, query.map, catalog, collectionId, categoryKey, config.publicHost);
  const pages = {}, covers = [], warnings = [];
  for (const [index, item] of items.entries()) {
    const map = await client.page(item.id), page = value(map.block[item.id]);
    if (!page || page.alive === false) continue;
    if (page.parent_id !== collectionId || page.parent_table !== "collection") throw new Error(`Notion page moved during synchronization: ${item.id}`);
    const rendered = await renderPage(map, item.id, config.publicHost, media);
    warnings.push(...rendered.warnings);
    const cover = page.format?.page_cover ? await media(page.format.page_cover, item.id) : undefined;
    const group = item.categories.includes("Library") ? "library" : item.categories.includes("Game") ? "game" : undefined;
    const repository = plain(page.properties?.[repoKey]);
    pages[item.slug] = { id: item.id, title: item.title.match(/^\[([^\]]+)\]/)?.[1] || item.title,
      displayTitle: item.title, categories: item.categories, category: item.categories.map(key => catalog.labels[key] || key).join(" · "),
      pinned: item.pinned, featuredGroup: group || null, featuredOrder: index,
      repository: repository ? link(repository, config.publicHost) : null,
      ...(cover ? { cover, coverAlt: item.title } : {}),
      notionUrl: item.notionUrl, notionHtml: rendered.html,
      ...(rendered.html ? { toc: [{ id: "overview", label: "개요" }, ...rendered.toc, { id: "links", label: "관련 자료" }] } : {}) };
    const target = config.covers.find(entry => entry.pageId === item.id);
    if (target && cover) covers.push({ target: target.file, source: cover });
  }
  items = items.filter(item => pages[item.slug]);
  const labels = { ...catalog.labels };
  for (const item of items) for (const category of item.categories) labels[category] ||= category;
  return { profile: nextProfile, catalog: { ...catalog, labels, items }, snapshot: { active: true, pages }, covers, warnings };
}

export async function sync() {
  const readJson = async file => JSON.parse(await readFile(file, "utf8"));
  const config = await readJson("config/notion-sync.json"), profile = await readJson("src/_data/profile.json"), catalog = await readJson("src/_data/projectCatalog.json");
  const downloads = new Map(), bySource = new Map();
  async function media(source, id) {
    if (!source) throw new Error(`Notion media source missing: ${id}`);
    const key = `${id}:${source}`;
    if (bySource.has(key)) return bySource.get(key);
    const url = source.startsWith("attachment:") || source.includes("amazonaws.com")
      ? `https://${config.publicHost}/image/${encodeURIComponent(source)}?table=block&id=${id}&width=1600&cache=v2` : link(source, config.publicHost);
    if (!url.startsWith("https://")) throw new Error("Notion downloads require HTTPS");
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Notion media HTTP ${response.status}: ${id}`);
    const type = response.headers.get("content-type")?.split(";")[0];
    const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf", "video/mp4": "mp4", "audio/mpeg": "mp3" };
    if (!extensions[type]) throw new Error(`Unsupported Notion media type ${type}: ${id}`);
    const data = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 24);
    const file = `/assets/notion/${hash}.${extensions[type]}`;
    downloads.set(file, data); bySource.set(key, file);
    return file;
  }
  // Collect first. Network/schema failures cannot publish a partial update.
  const result = await collectPortfolio(config, profile, catalog, publicClient(config.publicHost), media);
  const sharp = (await import("sharp")).default;
  for (const cover of result.covers) {
    assert(/^[a-z0-9-]+\.png$/.test(cover.target));
    downloads.set(`/assets/media/${cover.target}`, await sharp(downloads.get(cover.source)).rotate().png().toBuffer());
  }
  for (const [file, data] of downloads) {
    const target = resolve("src", "." + file);
    await mkdir(resolve(target, ".."), { recursive: true }); await writeFile(target, data);
  }
  for (const item of result.catalog.items) {
    assert(/^[a-z0-9-]+$/.test(item.slug));
    const file = `src/projects/${item.slug}.md`;
    try { await access(file); } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeFile(file, `---\nlayout: layouts/project.njk\ntitle: ${JSON.stringify(item.title)}\nnotionUrl: ${item.notionUrl}\npermalink: /projects/${item.slug}/index.html\nvisibility: public\npublish: true\n---\n`);
    }
  }
  for (const [file, data] of [["profile", result.profile], ["projectCatalog", result.catalog], ["notionSync", result.snapshot]]) await writeFile(`src/_data/${file}.json`, JSON.stringify(data, null, 2) + "\n");
  for (const warning of result.warnings) console.warn(`Notion block kept as source link: ${warning}`);
  console.log(`Public Notion sync complete: ${result.catalog.items.length} projects, ${Object.values(result.snapshot.pages).filter(p => p.notionHtml).length} bodies, ${downloads.size} media files. No token used.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) sync().catch(error => { console.error(error.message); process.exitCode = 1; });
