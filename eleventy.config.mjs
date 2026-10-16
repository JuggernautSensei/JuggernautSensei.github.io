import { assertPublicPage } from "./scripts/publication.mjs";
import assert from "node:assert/strict";

export default function (config) {
  config.addPreprocessor("public-content-only", "md,njk", (data, content) => {
    assertPublicPage(data);
    return content;
  });
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({ "licenses": "licenses" });
  config.addCollection("projects", api => api.getFilteredByGlob("src/projects/**/*.md"));
  config.addFilter("projectFor", (projects, slug) => {
    const entry = projects.find(project => project.data.page.fileSlug === slug);
    assert(entry, `Missing project page: ${slug}`);
    return entry;
  });
  for (const [name, group] of [["featuredLibraries", "library"], ["featuredGames", "game"]]) {
    config.addCollection(name, api => api.getFilteredByGlob("src/projects/**/*.md")
      .filter(entry => entry.data.pinned && entry.data.featuredGroup === group)
      .sort((a, b) => a.data.featuredOrder - b.data.featuredOrder));
  }
  config.addCollection("documents", api => api.getFilteredByGlob("src/documents/**/*.md"));
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
}
