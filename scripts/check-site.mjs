import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const root = resolve("_site");
function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root);
const pages = files.filter(file => file.endsWith(".html"));
assert(pages.length >= 6);
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  assert(html.includes('lang="ko"'), file);
  assert(/<title>[^<]+<\/title>/.test(html), file);
  assert(!html.includes("PRIVATE_TEST_SENTINEL"), file);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1], "https://juggernautsensei.github.io" + file.slice(root.length).replaceAll(sep, "/"));
    if (url.origin !== "https://juggernautsensei.github.io") continue;
    let target = resolve(root, "." + decodeURIComponent(url.pathname));
    if (url.pathname.endsWith("/")) target = join(target, "index.html");
    assert(target.startsWith(root + sep), target);
    assert(existsSync(target), `${file}: broken local link ${match[1]}`);
    if (url.hash && target.endsWith(".html")) {
      const body = readFileSync(target, "utf8");
      assert(body.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor ${match[1]}`);
    }
  }
}
assert(!files.some(file => /[\\/](?:private|staging|notion-export)[\\/]/.test(file)));
console.log(`PASS: ${pages.length} HTML pages, local links, anchors, assets, and output boundaries.`);
