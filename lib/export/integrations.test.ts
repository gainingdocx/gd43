import assert from "node:assert/strict";
import test from "node:test";
import { integrationExport } from "./integrations";

test("canonical XML escapes extracted user content", () => {
  const output = integrationExport("canonical_xml", "commercial_invoice", { invoice_no: "A&B<1" });
  assert.equal(output.extension, "xml");
  assert.match(output.body, /A&amp;B&lt;1/);
  assert.doesNotMatch(output.body, /A&B<1/);
});

test("ERP mapping profiles disclose that they are templates", () => {
  const output = integrationExport("sap_tm", "packing_list", { packing_list_no: "PL-1" });
  assert.match(output.body, /Integration mapping template/);
  assert.match(output.body, /SAP Transportation Management/);
});
