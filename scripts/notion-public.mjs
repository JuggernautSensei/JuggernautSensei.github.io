import assert from "node:assert/strict";

export const value = row => row?.value?.value ?? row?.value;
export const plain = rich => (rich || []).map(part => part[0]).join("");
export const blockText = block => plain(block.properties?.title);

export function descendants(blocks, id) {
  const result = new Map();
  function visit(key) {
    if (result.has(key)) return;
    const block = value(blocks[key]);
    if (!block || block.alive === false) return;
    result.set(key, block);
    // A linked page is a boundary, not permission to crawl its contents.
    if (key !== id && ["page", "collection_view", "collection_view_page"].includes(block.type)) return;
    for (const child of block.content || []) visit(child);
  }
  visit(id);
  return result;
}

export function publicClient(host, request = fetch) {
  assert(/^[a-z0-9-]+\.notion\.site$/.test(host));
  async function post(endpoint, body) {
    const response = await request(`https://${host}/api/v3/${endpoint}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) throw new Error(`Public Notion ${endpoint}: HTTP ${response.status}`);
    const data = await response.json();
    if (!data.recordMap?.block) throw new Error(`Public Notion ${endpoint}: unexpected response`);
    return data;
  }
  return {
    async page(id) {
      const map = {};
      let cursor = { stack: [] }, chunkNumber = 0;
      do {
        const data = await post("loadPageChunk", { pageId: id, limit: 1000, cursor, chunkNumber, verticalColumns: false });
        for (const [table, rows] of Object.entries(data.recordMap)) Object.assign(map[table] ||= {}, rows);
        if (!data.cursor || !Array.isArray(data.cursor.stack)) throw new Error("Notion page cursor changed");
        cursor = data.cursor;
        if (++chunkNumber > 100) throw new Error("Notion page exceeds 100 chunks; review source size");
      } while (cursor.stack.length);
      return map;
    },
    async query(collectionId, view) {
      const data = await post("queryCollection?src=initial_load", {
        collection: { id: collectionId }, collectionView: { id: view.id },
        source: { type: "collection", id: collectionId },
        loader: { type: "reducer", reducers: { collection_group_results: { type: "results", limit: 1000, loadContentCover: true } },
          sort: [], filter: { filters: [], operator: "and" }, ...view.query2,
          searchQuery: "", userTimeZone: "Asia/Seoul" }
      });
      const result = data.result?.reducerResults?.collection_group_results;
      if (!Array.isArray(result?.blockIds) || result.hasMore) throw new Error("Notion collection response incomplete; sync stopped");
      return { ids: result.blockIds, map: data.recordMap };
    }
  };
}
