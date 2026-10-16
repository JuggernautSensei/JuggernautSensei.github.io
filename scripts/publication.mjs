import assert from "node:assert/strict";

export function assertPublicPage(data) {
  assert.equal(data.visibility, "public", "Only verified public content belongs in src.");
  assert.equal(data.publish, true, "Publishing must be explicitly approved in front matter.");
}
