import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeModelOutput } from "@/lib/ai/schemas/extraction-v2";
import { validateAirCargoDocument, validateIataAirportCode } from "./air-cargo";

describe("air cargo validation", () => {
  it("validates IATA code format without claiming the airport exists", () => {
    assert.equal(validateIataAirportCode("origin_airport", "DEL").status, "pass");
    assert.equal(validateIataAirportCode("origin_airport", "Delhi").status, "fail");
  });

  it("checks MAWB number, prefix, chargeable weight and line totals", () => {
    const extraction = normalizeModelOutput({ detected_type: "air_waybill", fields: {
      awb_number: "123-12345675", airline_prefix: "123", awb_type: "master",
      origin_airport: "DEL", destination_airport: "FRA",
      total_pieces: 3, total_gross_kg: 100, total_chargeable_kg: 90,
      line_items: [{ packages: 2, gross_kg: 100, chargeable_kg: 110 }],
    } }, "test");
    const results = validateAirCargoDocument(extraction);
    assert.equal(results.find((item) => item.rule === "iata_awb_mod7")?.status, "pass");
    assert.equal(results.find((item) => item.rule === "air_cargo.airline_prefix_consistency")?.status, "pass");
    assert.equal(results.find((item) => item.rule === "air_cargo.chargeable_not_below_gross")?.status, "fail");
    assert.equal(results.find((item) => item.rule === "air_cargo.total_pieces_sum")?.status, "fail");
    assert.equal(results.find((item) => item.rule === "air_cargo.total_chargeable_kg_sum")?.status, "fail");
  });

  it("warns when a dangerous-goods declaration lacks sign-off evidence", () => {
    const extraction = normalizeModelOutput({ detected_type: "dangerous_goods_declaration", fields: {
      awb_numbers: ["123-12345675"], dangerous_goods: [], signatory_name: null, signed_date: null,
    } }, "test");
    const results = validateAirCargoDocument(extraction);
    assert.equal(results.find((item) => item.rule === "air_cargo.dgd_items_present")?.status, "warn");
    assert.equal(results.find((item) => item.rule === "air_cargo.dgd_signatory_name_present")?.status, "warn");
  });
});
