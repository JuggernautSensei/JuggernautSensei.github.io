import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPublicPage } from "../scripts/publication.mjs";

test("explicit public approval is accepted", () => {
  assert.doesNotThrow(() => assertPublicPage({ visibility: "public", publish: true }));
});

test("private, unknown, draft, and missing approval stop the build", () => {
  for (const data of [
    { visibility: "private", publish: true },
    { visibility: "unknown", publish: true },
    { visibility: "public", publish: false },
    { visibility: "public" },
    {}
  ]) assert.throws(() => assertPublicPage(data), assert.AssertionError);
});
