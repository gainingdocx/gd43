import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { TEMPLATES } from "../../content/templates";
import { TOOLS } from "../../content/tools";

describe("public shipping resources", () => {
  it("publishes the 11 distinct workflow templates", () => {
    assert.equal(TEMPLATES.length, 11);
    assert.equal(new Set(TEMPLATES.map((template) => template.slug)).size, TEMPLATES.length);
    for (const slug of [
      "commercial-invoice-template",
      "pro-forma-invoice-template",
      "certificate-of-origin-template",
      "simple-packing-list-template",
      "packing-list-template",
      "container-packing-list-template",
      "shipping-instructions-template",
      "bill-of-lading-template",
      "air-waybill-template",
      "arrival-notice-template",
      "delivery-order-template",
    ]) assert.ok(TEMPLATES.some((template) => template.slug === slug), `Missing ${slug}`);
  });

  it("ships non-empty XLSX and DOCX downloads for every template", () => {
    for (const template of TEMPLATES) {
      for (const extension of ["xlsx", "docx"]) {
        const file = path.join(process.cwd(), "public", "downloads", `${template.slug}.${extension}`);
        assert.ok(existsSync(file), `Missing ${file}`);
        assert.ok(statSync(file).size > 3_000, `Unexpectedly small ${file}`);
      }
    }
  });

  it("publishes seven unique deterministic tools", () => {
    assert.equal(TOOLS.length, 7);
    assert.equal(new Set(TOOLS.map((tool) => tool.slug)).size, TOOLS.length);
    assert.ok(TOOLS.some((tool) => tool.slug === "demurrage-detention-calculator"));
  });
});
