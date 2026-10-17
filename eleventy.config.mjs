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
  // Split experience bullets into grades ("전공학점 4.29 / 4.5"), term counts ("총 6학기 …", "… 6학기") and plain notes; entries without figures get their duration.
  config.addFilter("experienceDetails", (details = [], period = "") => {
    const scores = [], stats = [], notes = [];
    for (const detail of details) {
      const score = detail.match(/^(.+?)\s+([\d.]+)\s*\/\s*([\d.]+)$/);
      const leading = detail.match(/^(?:총\s*)?(\d+\s*학기)\s+(.+)$/);
      const trailing = detail.match(/^(.+?)\s+(\d+\s*학기)$/);
      if (score) scores.push({ label: score[1], value: score[2], suffix: `/ ${score[3]}` });
      else if (leading) stats.push({ label: leading[2], value: leading[1] });
      else if (trailing) stats.push({ label: trailing[1], value: trailing[2] });
      else notes.push(detail);
    }
    let duration = "";
    const dates = [...period.matchAll(/(\d{4})\.\s*(\d{1,2})\./g)];
    if (!scores.length && !stats.length && dates.length === 2) {
      const months = (dates[1][1] - dates[0][1]) * 12 + (dates[1][2] - dates[0][2]);
      if (months > 0) duration = `${months}개월`;
    }
    return { scores, stats, notes, duration };
  });
  // "2020. 03. 02 – 2026. 02. 20" -> "2020.03 — 2026.02"
  config.addFilter("shortPeriod", (period = "") => {
    const dates = [...period.matchAll(/(\d{4})\.\s*(\d{1,2})\./g)].map(date => `${date[1]}.${date[2].padStart(2, "0")}`);
    return dates.length ? dates.join(" — ") : period;
  });
  // "교내 캡스톤 경진대회 동상 (6등)" -> { event: "교내 캡스톤 경진대회", prize: "동상", rank: "(6등)", tier: "bronze" }
  config.addFilter("awardParts", title => {
    const match = title.match(/^(.+?)\s+(\S+상)(?:\s*(\(.+\)))?$/);
    if (!match) return { event: title, prize: "", rank: "", tier: "" };
    const tier = /대상|최우수|우수|금상/.test(match[2]) ? "gold" : /은상/.test(match[2]) ? "silver" : /동상/.test(match[2]) ? "bronze" : "";
    return { event: match[1], prize: match[2], rank: match[3] || "", tier };
  });
  config.addCollection("documents", api => api.getFilteredByGlob("src/documents/**/*.md"));
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
}
