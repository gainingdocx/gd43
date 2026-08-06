// The catalogue's two standing invariants.
//
// Both are the kind that fail silently: a hidden connector reappearing on the
// marketplace is a promise we cannot keep, and a broken anchor is a link that
// scrolls nowhere. Neither shows up in a typecheck or a build.

import assert from "node:assert/strict";
import test from "node:test";

import {
  INTEGRATION_CATALOG,
  catalogByCategory,
  catalogCounts,
  catalogEntry,
  publicCatalog,
} from "./catalog";

const internalIds = INTEGRATION_CATALOG.filter((entry) => entry.visibility === "internal").map((entry) => entry.id);

test("integration catalogue", async (t) => {
  await t.test("no internal connector reaches any public surface", () => {
    // Guard against the specific regression: adding a surface that reads
    // INTEGRATION_CATALOG directly instead of publicCatalog().
    assert.ok(internalIds.length > 0, "fixture check — expected at least one internal entry to guard");

    const published = publicCatalog().map((entry) => entry.id);
    for (const id of internalIds) {
      assert.ok(!published.includes(id), `${id} is internal but appears in publicCatalog()`);
      assert.equal(catalogEntry(id), null, `${id} is internal but resolvable through catalogEntry()`);
    }

    const grouped = catalogByCategory().flatMap((group) => group.entries.map((entry) => entry.id));
    for (const id of internalIds) {
      assert.ok(!grouped.includes(id), `${id} is internal but appears in catalogByCategory()`);
    }
  });

  await t.test("headline counts describe only what is published", () => {
    const counts = catalogCounts();
    assert.equal(counts.total, publicCatalog().length);
    assert.equal(
      counts.live + counts.beta + counts.via_api + counts.partner + counts.planned,
      counts.total,
      "every published entry must fall into exactly one status bucket"
    );
    assert.ok(counts.total < INTEGRATION_CATALOG.length, "internal entries must not be counted");
  });

  await t.test("no category renders as an empty heading", () => {
    for (const group of catalogByCategory()) {
      assert.ok(group.entries.length > 0, `${group.category} would render an empty heading`);
    }
  });

  await t.test("every published /integrations anchor resolves to a published entry", () => {
    const ids = new Set(publicCatalog().map((entry) => entry.id));
    const categories = new Set(publicCatalog().map((entry) => entry.category));
    for (const entry of publicCatalog()) {
      if (!entry.docsPath?.startsWith("/integrations#")) continue;
      const anchor = entry.docsPath.split("#")[1];
      assert.ok(
        ids.has(anchor) || categories.has(anchor as never) || anchor === "delivery",
        `${entry.id} links to #${anchor}, which no published entry or category renders`
      );
    }
  });

  await t.test("a published entry never links to a hidden one", () => {
    for (const entry of publicCatalog()) {
      if (!entry.docsPath?.startsWith("/integrations#")) continue;
      const anchor = entry.docsPath.split("#")[1];
      assert.ok(!internalIds.includes(anchor), `${entry.id} links to hidden connector #${anchor}`);
    }
  });
});
