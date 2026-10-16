import { assertPublicPage } from "./scripts/publication.mjs";
import assert from "node:assert/strict";
import { projectAvailable, currentProject } from "./scripts/project-data.mjs";

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  const projectData = entry => currentProject(entry.data) || entry.data;
  config.addPreprocessor("public-content-only", "md,njk", (data, content) => {
    assertPublicPage(data);
    return content;
  });
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({ "licenses": "licenses" });
  config.addCollection("projects", api => api.getFilteredByGlob("src/projects/**/*.md").filter(entry => projectAvailable(entry.data)));
  config.addCollection("presentations", api => api.getFilteredByGlob("src/projects/**/*.md")
    .filter(entry => projectAvailable(entry.data) && projectData(entry).categories?.includes("Presentation"))
    .sort((a, b) => projectData(a).featuredOrder - projectData(b).featuredOrder));
  config.addFilter("projectFor", (projects, slug) => {
    const entry = projects.find(project => project.data.page.fileSlug === slug);
    assert(entry, `Missing project page: ${slug}`);
    return entry;
  });
  config.addFilter("prioritizePinned", items => [
    ...items.filter(item => item.pinned),
    ...items.filter(item => !item.pinned)
  ]);
  config.addCollection("documents", api => api.getFilteredByGlob("src/documents/**/*.md"));
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
}
