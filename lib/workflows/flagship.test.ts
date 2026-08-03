import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessFlagshipWorkflows, isFlagshipWorkflowKey, workflowLaunchHref } from "./flagship";

describe("assessFlagshipWorkflows", () => {
  it("requires the exact operational evidence chain", () => {
    const result = assessFlagshipWorkflows([
      { id: "b", doc_type: "booking_confirmation", status: "parsed", fields: {} },
      { id: "s", doc_type: "shipping_instructions", status: "parsed", fields: {} },
      { id: "d", doc_type: "bill_of_lading", status: "parsed", fields: { document_stage: "draft" } },
    ]);
    assert.equal(result[0].state, "ready");
    assert.equal(result[0].coverage, 100);
    assert.equal(result[1].state, "collecting");
  });

  it("does not treat an arrival notice without a printed last-free day as complete", () => {
    const [,,, arrival] = assessFlagshipWorkflows([
      { id: "a", doc_type: "arrival_notice", status: "parsed", fields: { last_free_day: null } },
      { id: "e", doc_type: "container_event", status: "parsed", fields: {} },
      { id: "i", doc_type: "demurrage_detention_invoice", status: "parsed", fields: {} },
    ]);
    assert.equal(arrival.completeRoles, 3);
    assert.equal(arrival.roles.find((role) => role.key === "last_free_day")?.present, false);
  });

  it("marks every flagship workflow ready when its complete evidence chain is parsed", () => {
    const result = assessFlagshipWorkflows([
      { id: "booking", doc_type: "booking_confirmation", status: "parsed", fields: {} },
      { id: "si", doc_type: "shipping_instructions", status: "parsed", fields: {} },
      { id: "draft", doc_type: "bill_of_lading", status: "parsed", fields: { document_stage: "draft" } },
      { id: "ci", doc_type: "commercial_invoice", status: "parsed", fields: {} },
      { id: "pl", doc_type: "packing_list", status: "parsed", fields: {} },
      { id: "coo", doc_type: "certificate_of_origin", status: "parsed", fields: {} },
      { id: "rate", doc_type: "rate_confirmation", status: "parsed", fields: {} },
      { id: "freight", doc_type: "freight_invoice", status: "parsed", fields: {} },
      { id: "arrival", doc_type: "arrival_notice", status: "parsed", fields: { last_free_day: "2026-08-10" } },
      { id: "event", doc_type: "container_event", status: "parsed", fields: {} },
      { id: "dd", doc_type: "demurrage_detention_invoice", status: "parsed", fields: {} },
      { id: "mawb", doc_type: "air_waybill", status: "parsed", fields: { awb_type: "master" } },
      { id: "hawb", doc_type: "air_waybill", status: "parsed", fields: { awb_type: "house" } },
      { id: "sli-air", doc_type: "shipper_letter_of_instruction", status: "parsed", fields: {} },
      { id: "manifest", doc_type: "air_cargo_manifest", status: "parsed", fields: {} },
      { id: "dgd", doc_type: "dangerous_goods_declaration", status: "parsed", fields: {} },
    ]);
    assert.deepEqual(result.map((workflow) => workflow.state), ["ready", "ready", "ready", "ready", "ready", "ready", "ready", "ready"]);
  });

  it("builds a batch launch URL that preserves workflow and shipment context", () => {
    assert.equal(
      workflowLaunchHref("freight_invoice_audit", "shipment-123"),
      "/app/scan?type=batch&workflow=freight_invoice_audit&shipment=shipment-123",
    );
    assert.equal(isFlagshipWorkflowKey("arrival_free_time_control"), true);
    assert.equal(isFlagshipWorkflowKey("unknown"), false);
  });
});
