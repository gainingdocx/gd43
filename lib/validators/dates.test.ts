import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { dates, daysBetween, parsePrintedDate } from "./dates";

const iso = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

describe("parsePrintedDate", () => {
  it("ISO and ISO-like", () => {
    assert.equal(iso(parsePrintedDate("2026-03-12")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("2026/03/12")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("2026.3.2")), "2026-03-02");
  });

  it("day month-name year", () => {
    assert.equal(iso(parsePrintedDate("12 MAR 2026")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("12-Mar-26")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("1st April 2026")), "2026-04-01");
    assert.equal(iso(parsePrintedDate("02 SEPT 2025")), "2025-09-02");
  });

  it("month-name day, year", () => {
    assert.equal(iso(parsePrintedDate("MAR 12, 2026")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("March 12 2026")), "2026-03-12");
  });

  it("all-numeric is day-first, falling back to month-first", () => {
    assert.equal(iso(parsePrintedDate("12/03/2026")), "2026-03-12");
    assert.equal(iso(parsePrintedDate("03/28/2026")), "2026-03-28"); // 28 can't be a month
    assert.equal(iso(parsePrintedDate("12-03-26")), "2026-03-12");
  });

  it("rejects impossible or unrecognized dates", () => {
    assert.equal(parsePrintedDate("31 FEB 2026"), null);
    assert.equal(parsePrintedDate("2026-13-01"), null);
    assert.equal(parsePrintedDate("SOMEDAY"), null);
    assert.equal(parsePrintedDate(""), null);
    assert.equal(parsePrintedDate("13 BLA 2026"), null);
  });

  it("daysBetween is signed", () => {
    const a = parsePrintedDate("2026-03-01")!;
    const b = parsePrintedDate("2026-03-11")!;
    assert.equal(daysBetween(a, b), 10);
    assert.equal(daysBetween(b, a), -10);
  });
});

const META = {
  detected_type: "bill_of_lading" as const,
  confidence_flags: [],
  page_refs: {},
  prompt_version: "test",
};

function bl(over: Record<string, unknown>): NormalizedExtraction {
  return {
    detected_type: "bill_of_lading",
    fields: {
      bl_number: null, scac: null, carrier_name: null, shipper: null,
      consignee: null, notify: null, vessel_name: null, imo_number: null,
      voyage_no: null, port_of_load: null, port_of_discharge: null,
      place_of_receipt: null, place_of_delivery: null,
      shipped_on_board_date: null, issue_date: null, issue_place: null,
      freight_terms: null, incoterm: null, containers: [], cargo: [],
      total_packages: null, total_gross_kg: null, total_volume_cbm: null,
      originals_count: null, bl_type: null, clauses: [], _meta: META,
      ...over,
    },
  } as NormalizedExtraction;
}

const TODAY = parsePrintedDate("2026-07-19")!;

describe("dates — bill of lading", () => {
  it("passes a consistent sob/issue pair", () => {
    const r = dates(
      bl({ shipped_on_board_date: "01 MAR 2026", issue_date: "10 MAR 2026" }),
      TODAY
    );
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [["dates.sob_vs_issue", "pass"]]
    );
  });

  it("fails when shipped-on-board is >30 days before issue", () => {
    const r = dates(
      bl({ shipped_on_board_date: "01 JAN 2026", issue_date: "01 MAY 2026" }),
      TODAY
    );
    assert.equal(r[0].rule, "dates.sob_vs_issue");
    assert.equal(r[0].status, "fail");
  });

  it("fails a future shipped-on-board date (> today + 2d)", () => {
    const r = dates(bl({ shipped_on_board_date: "30 JUL 2026" }), TODAY);
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [["dates.sob_future", "fail"]]
    );
  });

  it("allows the +2 day window", () => {
    assert.deepEqual(dates(bl({ shipped_on_board_date: "21 JUL 2026" }), TODAY), []);
  });

  it("warns on unreadable dates instead of failing", () => {
    const r = dates(bl({ shipped_on_board_date: "??", issue_date: "N/A" }), TODAY);
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [
        ["dates.format", "warn"],
        ["dates.format", "warn"],
      ]
    );
  });
});

describe("dates — invoice and packing list", () => {
  it("warns on a future invoice date", () => {
    const ci: NormalizedExtraction = {
      detected_type: "commercial_invoice",
      fields: {
        invoice_no: null, invoice_date: "01 AUG 2026", po_no: null,
        seller: null, buyer: null, incoterm: null, currency: null,
        line_items: [], subtotal: null, freight_charge: null, insurance: null,
        total_amount: null, payment_terms: null, lc_number: null,
        country_of_origin: null, bank_details: null,
        _meta: { ...META, detected_type: "commercial_invoice" },
      },
    };
    const r = dates(ci, TODAY);
    assert.deepEqual(
      r.map((x) => [x.rule, x.status]),
      [["dates.invoice_future", "warn"]]
    );
  });

  it("warns on an unreadable packing list date", () => {
    const pl: NormalizedExtraction = {
      detected_type: "packing_list",
      fields: {
        pl_no: null, date: "sometime", invoice_ref: null, po_no: null,
        seller: null, buyer: null, line_items: [], total_cartons: null,
        total_net_kg: null, total_gross_kg: null, total_volume_cbm: null,
        container_refs: [], _meta: { ...META, detected_type: "packing_list" },
      },
    };
    const r = dates(pl, TODAY);
    assert.equal(r[0].rule, "dates.format");
  });

  it("does nothing for 'other' documents", () => {
    const other: NormalizedExtraction = {
      detected_type: "other",
      fields: { raw: {}, _meta: { ...META, detected_type: "other" } },
    };
    assert.deepEqual(dates(other, TODAY), []);
  });
});
