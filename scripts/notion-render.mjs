import { plain, blockText, descendants } from "./notion-public.mjs";

export const escape = text => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export function link(url, host) {
  const resolved = new URL(url, `https://${host}`);
  if (!["https:", "http:", "mailto:"].includes(resolved.protocol)) throw new Error(`Unsupported Notion link protocol: ${resolved.protocol}`);
  return resolved.href;
}
export function richText(parts, host) {
  return (parts || []).map(([text, marks = []]) => {
    let html = escape(text).replaceAll("\n", "<br>");
    for (const [mark, arg] of marks) {
      if (mark === "a") html = `<a href="${escape(link(arg, host))}">${html}</a>`;
      else if ({ b: "strong", i: "em", s: "s", c: "code", _: "u" }[mark]) {
        const tag = { b: "strong", i: "em", s: "s", c: "code", _: "u" }[mark];
        html = `<${tag}>${html}</${tag}>`;
      } else if (mark === "e") html = `<code class="notion-equation">${escape(arg)}</code>`;
      else if (mark === "p") html = `<a href="https://${host}/${escape(arg.replaceAll("-", ""))}">${html}</a>`;
    }
    return html;
  }).join("");
}

export async function renderPage(map, pageId, host, media) {
  const blocks = descendants(map.block, pageId), toc = [], warnings = [];
  const root = blocks.get(pageId);
  if (!root) throw new Error(`Notion page unavailable: ${pageId}`);
  const sourceLink = block => `https://${host}/${pageId.replaceAll("-", "")}#${block.id.replaceAll("-", "")}`;
  async function children(block) {
    const ids = (block.content || []).filter(id => blocks.has(id));
    let html = "", list = null;
    for (const id of ids) {
      const child = blocks.get(id);
      const tag = child.type === "bulleted_list" ? "ul" : child.type === "numbered_list" ? "ol" : null;
      if (tag !== list) { if (list) html += `</${list}>`; if (tag) html += `<${tag}>`; list = tag; }
      html += await render(child);
    }
    if (list) html += `</${list}>`;
    return html;
  }
  async function render(block) {
    const text = richText(block.properties?.title, host), id = `notion-${block.id}`;
    if (["header", "sub_header", "sub_sub_header"].includes(block.type)) {
      const tag = block.type === "sub_sub_header" ? "h3" : "h2";
      if (tag === "h2") toc.push({ id, label: blockText(block) });
      return `<${tag} id="${id}">${text}</${tag}>${await children(block)}`;
    }
    switch (block.type) {
      case "text": return `${text ? `<p>${text}</p>` : ""}${await children(block)}`;
      case "bulleted_list": case "numbered_list": return `<li>${text}${await children(block)}</li>`;
      case "quote": case "callout": return `<blockquote>${text}${await children(block)}</blockquote>`;
      case "toggle": return `<details><summary>${text}</summary>${await children(block)}</details>`;
      case "to_do": return `<p>${plain(block.properties?.checked) === "Yes" ? "☑" : "☐"} ${text}</p>${await children(block)}`;
      case "column_list": case "column": return children(block);
      case "divider": return "<hr>";
      case "code": return `<pre><code>${escape(blockText(block))}</code></pre>`;
      case "equation": return `<pre class="notion-equation">${escape(blockText(block))}</pre>`;
      case "image": {
        const source = block.format?.display_source || plain(block.properties?.source);
        if (!source) throw new Error(`Notion image has no source: ${block.id}`);
        const file = await media(source, block.id);
        return `<figure><img src="${file}" alt="${escape(plain(block.properties?.caption))}" loading="lazy">${block.properties?.caption ? `<figcaption>${richText(block.properties.caption, host)}</figcaption>` : ""}</figure>`;
      }
      case "table": {
        const columns = block.format.table_block_column_order;
        const rows = (block.content || []).map(id => blocks.get(id)).filter(Boolean);
        const html = rows.map((row, index) => {
          const tag = index === 0 && block.format.table_block_column_header ? "th" : "td";
          return `<tr>${columns.map(key => `<${tag}>${richText(row.properties?.[key], host)}</${tag}>`).join("")}</tr>`;
        }).join("");
        return `<div class="notion-table"><table>${html}</table></div>`;
      }
      case "bookmark": case "embed": case "video": case "audio": case "file": case "pdf": {
        const url = plain(block.properties?.link) || plain(block.properties?.source) || block.format?.display_source;
        if (!url) throw new Error(`Notion media link has no source: ${block.id}`);
        const href = /^(attachment:|https:\/\/prod-files|https:\/\/s3\.)/.test(url) ? await media(url, block.id) : link(url, host);
        return `<p><a href="${escape(href)}">${text || escape(plain(block.properties?.caption)) || "자료 보기 ↗"}</a></p>`;
      }
      case "page": return `<p><a href="https://${host}/${block.id.replaceAll("-", "")}">${text || "Notion 하위 페이지 ↗"}</a></p>`;
      default:
        warnings.push(`${block.type}:${block.id}`);
        // Preserve access to unsupported blocks; do not silently omit their content.
        return `<p><a href="${sourceLink(block)}">Notion에서 ${escape(block.type)} 보기 ↗</a></p>`;
    }
  }
  return { html: await children(root), toc, warnings };
}
