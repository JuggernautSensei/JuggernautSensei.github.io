import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";

export function requirePublicPage(page, host) {
  if (page.in_trash || page.archived || !page.public_url || new URL(page.public_url).hostname !== host) {
    throw new Error(`Notion page ${page.id} is not verified public. Sync stopped.`);
  }
}

function text(block) {
  return block[block.type].rich_text.map(item => item.plain_text).join("");
}

export async function collectPortfolio(config, profile, get, download) {
  const root = await get(`pages/${config.rootPageId}`);
  requirePublicPage(root, config.publicHost);
  const cache = new Map();
  async function block(id) {
    if (!cache.has(id)) cache.set(id, await get(`blocks/${id}`));
    return cache.get(id);
  }
  async function approvedBlock(id) {
    const selected = await block(id);
    let parent = selected.parent;
    while (parent.type === "block_id") parent = (await block(parent.block_id)).parent;
    if (selected.in_trash || selected.archived || parent.type !== "page_id" || parent.page_id !== config.rootPageId) {
      throw new Error(`Notion block ${id} is no longer inside the approved public page.`);
    }
    return selected;
  }
  const headline = await approvedBlock(config.headlineBlockId);
  const intro = await approvedBlock(config.introductionBlockId);
  const portrait = await approvedBlock(config.portraitBlockId);
  if (headline.type !== "quote" || intro.type !== "paragraph" || portrait.type !== "image") {
    throw new Error("Notion source blocks changed type. Review the sync mapping first.");
  }
  const nextProfile = { ...profile, headline: text(headline), introduction: text(intro).replace(/\n{2,}더 자세한 프로젝트와 개발 기록은[\s\S]*$/, "").trim() };
  if (!nextProfile.headline || !nextProfile.introduction) throw new Error("Notion profile content is empty.");
  const media = [];
  async function image(file, source) {
    if (!source || !["file", "external"].includes(source.type)) throw new Error(`No downloadable Notion image for ${file}.`);
    media.push({ file, ...await download(source[source.type].url) });
  }
  await image("portrait.png", portrait.image);
  for (const entry of config.covers) {
    const page = await get(`pages/${entry.pageId}`);
    requirePublicPage(page, config.publicHost);
    assert(/^[a-z0-9-]+\.png$/.test(entry.file));
    await image(entry.file, page.cover);
  }
  return { profile: nextProfile, media };
}

export async function sync() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("Set NOTION_TOKEN as a local environment variable or GitHub Actions secret. Do not put the token in chat or source files.");
  const config = JSON.parse(await readFile("config/notion-sync.json", "utf8"));
  const profile = JSON.parse(await readFile("src/_data/profile.json", "utf8"));
  async function get(endpoint) {
    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2025-09-03" },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Notion API ${response.status} at ${endpoint}; sync stopped.`);
    const result = await response.json();
    await new Promise(resolve => setTimeout(resolve, 350));
    return result;
  }
  async function download(url) {
    if (new URL(url).protocol !== "https:") throw new Error("Notion image must use HTTPS.");
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Notion image download failed (${response.status}).`);
    const type = response.headers.get("content-type") || "";
    if (!/^image\/(png|jpeg|webp)(;|$)/.test(type)) throw new Error(`Unsupported image type: ${type}`);
    const data = Buffer.from(await response.arrayBuffer());
    const extension = type.includes("jpeg") ? "jpg" : type.includes("webp") ? "webp" : "png";
    return { data, extension };
  }
  const result = await collectPortfolio(config, profile, get, download);
  const sharp = (await import("sharp")).default;
  const images = [];
  for (const item of result.media) images.push({ file: item.file, data: await sharp(item.data).rotate().png().toBuffer() });
  for (const item of images) {
    const target = resolve("src/assets/media", item.file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, item.data);
  }
  await writeFile("src/_data/profile.json", JSON.stringify(result.profile, null, 2) + "\n");
  console.log(`Notion sync complete: approved profile fields and ${images.length} images.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  sync().catch(error => { console.error(error.message); process.exitCode = 1; });
}
