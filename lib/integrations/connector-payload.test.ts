import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildShipmentPush, connectorHeaders, validateConnectorUrl } from "./connector-payload";

describe("authenticated connector requests", () => {
  it("builds bearer, API-key and basic credentials", () => {
    assert.equal(connectorHeaders("bearer", { secret: "abc" }).Authorization, "Bearer abc");
    assert.equal(connectorHeaders("api_key", { secret: "abc" }, "X-TMS-Key")["X-TMS-Key"], "abc");
    assert.match(connectorHeaders("basic", { username: "u", secret: "p" }).Authorization, /^Basic /);
  });
  it("rejects local/private endpoints", () => {
    assert.equal(validateConnectorUrl("http://example.com"), null);
    assert.equal(validateConnectorUrl("https://127.0.0.1/push"), null);
    assert.equal(validateConnectorUrl("https://192.168.1.2/push"), null);
    assert.equal(validateConnectorUrl("https://tms.example.com/push"), "https://tms.example.com/push");
  });
  it("creates a versioned shipment envelope with vendor mapping content", () => {
    const payload = buildShipmentPush("sap_tm", { id: "s1" }, [{ id: "d1", doc_type: "packing_list", fields: { pl_no: "PL-1" } }]);
    assert.equal(payload.schema, "gainingdocx.shipment.push.v1");
    assert.match(payload.documents[0].mapping?.body ?? "", /sap_tm/);
  });
});
