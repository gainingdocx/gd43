import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeModelOutput } from "@/lib/ai/schemas/extraction-v2";
import { runFlagshipWorkflowRules } from "./workflow-rules";
import { DEFAULT_MATCH_POLICY } from "./engine";

const doc = (id: string, detected_type: string, fields: Record<string, unknown>) => ({
  id,
  extraction: normalizeModelOutput({ detected_type, fields }, "test"),
});

describe("runFlagshipWorkflowRules", () => {
  it("finds a port conflict between shipping instructions and a draft B/L", () => {
    const rules = runFlagshipWorkflowRules([
      doc("si", "shipping_instructions", { booking_no: "BK1", port_of_load: { name: "Shanghai", unlocode: "CNSHA" } }),
      doc("bl", "bill_of_lading", { booking_no: "BK1", document_stage: "draft", port_of_load: { name: "Ningbo", unlocode: "CNNGB" } }),
    ], DEFAULT_MATCH_POLICY);
    const finding = rules.find((rule) => rule.rule_id.includes("si_draft_bl.port_of_load"));
    assert.equal(finding?.status, "fail");
    assert.equal(finding?.workflow, "export_document_check");
  });

  it("flags freight-invoice accessorials absent from the rate agreement", () => {
    const rules = runFlagshipWorkflowRules([
      doc("rate", "rate_confirmation", { currency: "USD", subtotal: 1000, charges: [{ charge_code: "OCEAN", amount: 1000 }] }),
      doc("fi", "freight_invoice", { currency: "USD", subtotal: 1050, charges: [{ charge_code: "OCEAN", amount: 1000 }, { charge_code: "ADMIN", amount: 50 }] }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("unapproved_charge") && rule.value_b === "ADMIN"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("rate_invoice.subtotal") && rule.status === "fail"));
  });

  it("compares matching commercial-invoice and packing-list lines", () => {
    const rules = runFlagshipWorkflowRules([
      doc("ci", "commercial_invoice", { line_items: [{ product_code: "SKU-1", description: "Copper wire", quantity: 100, uom: "ROLL", hs_code: "740819" }] }),
      doc("pl", "packing_list", { line_items: [{ product_code: "SKU-1", description: "Copper wire", quantity: 95, uom: "ROLL", hs_code: "740819" }] }),
    ], DEFAULT_MATCH_POLICY);
    const quantity = rules.find((rule) => rule.rule_id.includes("invoice_packing") && rule.field_a?.endsWith(".quantity"));
    assert.equal(quantity?.status, "fail");
    assert.equal(quantity?.workflow, "shipment_document_check");
  });

  it("aggregates split packing rows and converts compatible UOMs", () => {
    const rules = runFlagshipWorkflowRules([
      doc("ci", "commercial_invoice", { line_items: [{ buyer_product_code: "BUY-7", seller_product_code: "SELL-7", description: "Copper cathodes", quantity: 1000, uom: "KG", hs_code: "740311" }] }),
      doc("pl", "packing_list", { line_items: [
        { product_code: "SELL-7", description: "Copper cathodes lot A", quantity: 0.4, uom: "MT", hs_code: "740311" },
        { product_code: "BUY-7", description: "Copper cathodes lot B", quantity: 600, uom: "KG", hs_code: "740311" },
      ] }),
    ], DEFAULT_MATCH_POLICY);
    const quantity = rules.find((rule) => rule.rule_id.includes("invoice_packing") && rule.field_a?.endsWith(".quantity"));
    assert.equal(quantity?.status, "pass");
    assert.equal(quantity?.value_b, "1000");
  });

  it("checks booking evidence directly against a classified draft B/L", () => {
    const rules = runFlagshipWorkflowRules([
      doc("booking", "booking_confirmation", { booking_no: "BK-99", vessel_name: "Ocean Star", port_of_load: { name: "Shanghai", unlocode: "CNSHA" } }),
      doc("draft", "bill_of_lading", { document_stage: "draft", booking_no: "BK-98", vessel_name: "Ocean Star", port_of_load: { name: "Shanghai", unlocode: "CNSHA" } }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("booking_draft_bl.booking_reference") && rule.status === "fail"));
  });

  it("flags duplicate freight-invoice lines and duplicate invoice numbers", () => {
    const charge = { charge_code: "THC", description: "Terminal handling", container_no: "MSCU6639870", amount: 125, currency: "USD" };
    const rules = runFlagshipWorkflowRules([
      doc("fi-a", "freight_invoice", { invoice_no: "INV-100", charges: [charge, charge] }),
      doc("fi-b", "freight_invoice", { invoice_no: "INV 100", charges: [] }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("duplicate_charge") && rule.status === "fail"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("duplicate_invoice") && rule.status === "fail"));
    assert.equal(rules.find((rule) => rule.rule_id.includes("duplicate_charge"))?.questioned_amount, 125);
  });

  it("checks draft-to-final release instructions and container evidence", () => {
    const container = { container_no: "MSCU6639870", seal_no: "SEAL-1", iso_type: "40HC", packages: 20, gross_kg: 15000, volume_cbm: 55 };
    const rules = runFlagshipWorkflowRules([
      doc("draft", "bill_of_lading", { document_stage: "draft", bl_number: "BL-1", bl_type: "original", containers: [container] }),
      doc("final", "bill_of_lading", { document_stage: "final", bl_number: "BL-1", bl_type: "seaway", containers: [container] }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("draft_final.release_type") && rule.status === "fail"));
  });

  it("checks arrival, container-event and D&D invoice evidence", () => {
    const rules = runFlagshipWorkflowRules([
      doc("arrival", "arrival_notice", { bl_number: "BL-77", containers: [{ container_no: "MSCU6639870" }], last_free_day: "2026-08-10" }),
      doc("event", "container_event", { container_no: "TGHU1234567", event_type: "discharge", event_timestamp: "2026-08-01T09:00:00+08:00" }),
      doc("dd", "demurrage_detention_invoice", { bl_numbers: ["BL-78"], container_refs: ["MSCU6639870"], service_period_start: "2026-08-02" }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("arrival_event.container") && rule.workflow === "arrival_free_time_control" && rule.status === "fail"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("arrival_dd.bl") && rule.status === "fail"));
  });

  it("validates weight billing basis and the last-free-day boundary", () => {
    const rules = runFlagshipWorkflowRules([
      doc("bl", "bill_of_lading", { bl_number: "BL-1", total_gross_kg: 10000, containers: [{ container_no: "MSCU6639870" }] }),
      doc("fi", "freight_invoice", { bl_numbers: ["BL-1"], container_refs: ["MSCU6639870"], charges: [{ charge_code: "WEIGHT", quantity: 9, uom: "MT", amount: 900 }] }),
      doc("arrival", "arrival_notice", { bl_number: "BL-1", last_free_day: "2026-08-10", containers: [{ container_no: "MSCU6639870" }] }),
      doc("dd", "demurrage_detention_invoice", { bl_numbers: ["BL-1"], container_refs: ["MSCU6639870"], service_period_start: "2026-08-10" }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("billing_basis") && rule.status === "fail"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("last_free_day") && rule.status === "fail"));
  });

  it("reconciles MAWB and HAWB totals and route evidence", () => {
    const rules = runFlagshipWorkflowRules([
      doc("mawb", "air_waybill", { awb_type: "master", awb_number: "123-12345675", origin_airport: "DEL", destination_airport: "FRA", total_pieces: 10, total_gross_kg: 500, total_chargeable_kg: 520 }),
      doc("hawb-a", "air_waybill", { awb_type: "house", awb_number: "H-1", house_awb_number: "H-1", master_awb_number: "123-12345675", origin_airport: "DEL", destination_airport: "FRA", total_pieces: 4, total_gross_kg: 200, total_chargeable_kg: 210 }),
      doc("hawb-b", "air_waybill", { awb_type: "house", awb_number: "H-2", house_awb_number: "H-2", master_awb_number: "123-12345675", origin_airport: "DEL", destination_airport: "LHR", total_pieces: 6, total_gross_kg: 300, total_chargeable_kg: 310 }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("mawb_hawb.destination") && rule.status === "fail"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("mawb_hawb.total_pieces_sum") && rule.status === "pass"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("mawb_hawb.total_chargeable_kg_sum") && rule.status === "pass"));
  });

  it("checks AWB chargeable weight and routing against a freight invoice", () => {
    const rules = runFlagshipWorkflowRules([
      doc("awb", "air_waybill", { awb_number: "123-12345675", origin_airport: "DEL", destination_airport: "FRA", total_chargeable_kg: 620 }),
      doc("invoice", "freight_invoice", { awb_numbers: ["12312345675"], origin_airport: "DEL", destination_airport: "FRA", total_chargeable_kg: 600, charges: [{ charge_code: "AIR", quantity: 600, uom: "KG", rate: 2.5, amount: 1500 }] }),
    ], DEFAULT_MATCH_POLICY);
    assert.ok(rules.some((rule) => rule.rule_id.includes("invoice_awb.reference") && rule.status === "pass"));
    assert.ok(rules.some((rule) => rule.rule_id.includes("invoice_awb.chargeable_weight") && rule.status === "fail"));
  });
});
