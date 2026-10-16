export function currentProject(data) {
  return data.notionSync?.pages[data.page.fileSlug];
}
export function projectAvailable(data) {
  return !data.notionSync?.active || !data.notionUrl || Boolean(currentProject(data));
}
export const projectFields = Object.fromEntries([
  "title", "displayTitle", "category", "categories", "repository", "cover", "coverAlt", "notionUrl", "notionHtml", "toc", "pinned", "featuredGroup", "featuredOrder"
].map(key => [key, data => {
  const synced = currentProject(data);
  return synced && Object.hasOwn(synced, key) ? synced[key] : data[key];
}]));
projectFields.permalink = data => projectAvailable(data) ? data.permalink : false;
projectFields.eleventyExcludeFromCollections = data => !projectAvailable(data);
